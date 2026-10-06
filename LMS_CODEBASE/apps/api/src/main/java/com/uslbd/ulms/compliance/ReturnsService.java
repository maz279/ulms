package com.uslbd.ulms.compliance;

import com.uslbd.ulms.collections.CollectionsService;
import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.integration.cib.CibFileWriter;
import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.platform.MoneyMath;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import com.uslbd.ulms.servicing.ServicingService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

/**
 * Regulatory returns pack (P4 / G4): CL-1..CL-5, CIB Subject/Contract files,
 * Basel CAR, EDW, IFRS-9 ECL statement, large-loan forecast — generated into
 * WORM-staged rows with the preparer→checker→compliance sign-off chain (11 §6,
 * 06 §8 P4). Regeneration of the same (code, period) replaces the pack
 * wholesale (same rerun semantics as the EOD batch).
 *
 * <p>Cross-module reads go through the owning modules' public services
 * (ServicingService payments/reschedules, CollectionsService write-offs,
 * CustomerService directory) — one-way dependencies, repositories stay internal.
 */
@Service
public class ReturnsService {

    private static final Set<String> CLASSIFIED = Set.of("SS", "DF", "B/L");
    private static final String LENDER_CODE = "ULMS01";
    private static final String LENDER_NAME = "ULMS Bank (Pilot)";

    private final RegulatoryReturnRepository returnsRepo;
    private final EclSnapshotRepository eclRepo;
    private final ClassificationHistoryRepository history;
    private final ProvisionRunRepository runs;
    private final LoanRepository loans;
    private final ServicingService servicing;
    private final CollectionsService collections;
    private final CustomerService customers;
    private final DocumentStorePort objectStore;
    private final AuditService audit;
    private final long eligibleCapitalMinor;

    private final BaselService basel;   // R10 P-F: SCH-BR inputs

    ReturnsService(BaselService basel, RegulatoryReturnRepository returnsRepo, EclSnapshotRepository eclRepo,
                   ClassificationHistoryRepository history, ProvisionRunRepository runs,
                   LoanRepository loans, ServicingService servicing,
                   CollectionsService collections, CustomerService customers,
                   DocumentStorePort objectStore, AuditService audit,
                   @Value("${ulms.compliance.eligible-capital-minor:100000000000}")
                   long eligibleCapitalMinor) {
        this.returnsRepo = returnsRepo; this.eclRepo = eclRepo; this.history = history;
        this.runs = runs; this.loans = loans; this.servicing = servicing;
        this.collections = collections; this.customers = customers;
        this.objectStore = objectStore; this.audit = audit;
        this.eligibleCapitalMinor = eligibleCapitalMinor;
        this.basel = basel;
    }

    // ── generation ───────────────────────────────────────────────────────

    /** A generated pack: display rows + totals + (CIB) the pre-rendered fixed-width file. */
    record GeneratedPack(List<Map<String, Object>> rows, Map<String, Object> totals, String file) {}

    @Transactional
    public RegulatoryReturn generate(String code, String period, String actor) {
        RegconCatalog.Entry entry = RegconCatalog.byCode(code);
        if (entry.frequency() == RegconCatalog.Frequency.CONTINUOUS) {
            throw new IllegalArgumentException("CIB-R is the event-driven real-time channel — nothing to generate");
        }
        if (!period.matches("\\d{4}-\\d{2}")) {
            throw new IllegalArgumentException("period must be YYYY-MM, got " + period);
        }
        try {
            YearMonth.parse(period);   // rejects 2026-13 and friends
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("period must be a valid YYYY-MM, got " + period);
        }
        GeneratedPack pack = buildPack(entry, period);

        returnsRepo.deleteByCodeAndPeriod(code, period);   // regenerate replaces wholesale
        String rendered = pack.file() != null ? pack.file() : renderCsv(pack.rows());
        String sha = sha256(rendered);
        // 11 §6: WORM staging — the file bytes land in the object store (object-lock
        // in prod MinIO) beside the checksummed payload; the key rides the row.
        String storageKey = "regcon/" + code.replace("/", "-") + "/" + period
                + ("fixed-width".equals(entry.fileFormat()) ? ".txt" : ".csv");
        objectStore.put(storageKey,
                new java.io.ByteArrayInputStream(rendered.getBytes(StandardCharsets.UTF_8)),
                rendered.getBytes(StandardCharsets.UTF_8).length,
                "fixed-width".equals(entry.fileFormat()) ? "text/plain" : "text/csv");
        RegulatoryReturn saved = returnsRepo.save(RegulatoryReturn.staged(
                UUID.randomUUID(), code, period, payloadJson(entry, period, pack),
                entry.fileFormat(), sha, pack.rows().size(), "system:regcon", storageKey));
        audit.record(actor, "RETURN_GENERATED", "regulatory_return", saved.getId(),
                "{\"code\":\"" + code + "\",\"period\":\"" + period
                        + "\",\"rows\":" + pack.rows().size()
                        + ",\"sha256\":\"" + sha + "\"}", UUID.randomUUID());
        return saved;
    }

    private GeneratedPack buildPack(RegconCatalog.Entry entry, String period) {
        YearMonth ym = YearMonth.parse(period);
        LocalDate periodEnd = ym.atEndOfMonth();
        return switch (entry.code()) {
            case "CL-1" -> classifiedLoanDetails(periodEnd);
            case "CL-2" -> provisioningDetails(periodEnd);
            case "CL-3" -> recoveryPosition(ym);
            case "CL-4" -> writeOffDetails();
            case "CL-5" -> restructuredLoans(ym);
            case "CAR" -> baselCarRows();
            case "EDW" -> edwRows(periodEnd);
            case "ECL" -> eclRows(periodEnd);
            case "LLF" -> largeLoanForecast();
            case "CIB-S" -> cibFile(true, periodEnd);
            case "CIB-C" -> cibFile(false, periodEnd);
            // R10 P-F: SCH-BR series (BASEL §7.1)
            case "SCH-BR-1" -> packOf("SCH-BR-1 capital adequacy inputs", basel.rwaSummary());
            case "SCH-BR-2" -> packOf("SCH-BR-2 large exposures",
                    java.util.Map.of("breaches", basel.largeExposureBreaches()));
            case "SCH-BR-3" -> packOf("SCH-BR-3 credit concentration", basel.rwaBySegment());
            case "SCH-BR-4" -> packOf("SCH-BR-4 asset classification", basel.portfolioByClassification());
            case "SCH-BR-5" -> packOf("SCH-BR-5 operational risk (BIA)",
                    java.util.Map.of("capitalChargeMinor", basel.operationalRiskChargeMinor()));
            case "SCH-BR-6" -> packOf("SCH-BR-6 leverage ratio",
                    java.util.Map.of("leverageRatioBp", basel.leverageRatioBp()));
            default -> throw new IllegalArgumentException("No generator for " + entry.code());
        };
    }

    /** One-row packs for the SCH-BR summaries (totals carry the payload). */
    private GeneratedPack packOf(String label, Map<String, Object> totals) {
        return new GeneratedPack(new ArrayList<>(List.of(
                new LinkedHashMap<>(java.util.Map.of("return", label)))), totals, null);
    }

    /** CL-1 — classified loans (SS/DF/B/L) at the latest EOD run within the period. */
    private GeneratedPack classifiedLoanDetails(LocalDate periodEnd) {
        List<Map<String, Object>> rows = new ArrayList<>();
        long outstandingTotal = 0;
        LocalDate runDate = latestRunOnOrBefore(periodEnd);
        if (runDate != null) {
            for (ClassificationHistory h : history.findAllByRunDate(runDate)) {
                if (!CLASSIFIED.contains(h.getToClass())) continue;
                Loan loan = loans.findById(h.getLoanId()).orElse(null);
                if (loan == null) continue;
                outstandingTotal += h.getOutstandingMinor();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("loan_no", loan.getLoanNo());
                row.put("cif", cifOf(loan));
                row.put("classification", h.getToClass());
                row.put("dpd", h.getDpd());
                row.put("outstanding_taka", taka(h.getOutstandingMinor()));
                row.put("interest_suspense", h.isInterestSuspense());
                rows.add(row);
            }
        }
        return new GeneratedPack(rows, Map.of("run_date", String.valueOf(runDate),
                "classified_loans", rows.size(), "outstanding_taka", taka(outstandingTotal)), null);
    }

    /** CL-2 — provisioning by class at the latest EOD run within the period. */
    private GeneratedPack provisioningDetails(LocalDate periodEnd) {
        List<Map<String, Object>> rows = new ArrayList<>();
        LocalDate runDate = latestRunOnOrBefore(periodEnd);
        long totalProvision = 0;
        if (runDate != null) {
            Map<String, long[]> byClass = new LinkedHashMap<>();   // [count, outstanding, provision]
            for (ClassificationHistory h : history.findAllByRunDate(runDate)) {
                long[] agg = byClass.computeIfAbsent(h.getToClass(), k -> new long[3]);
                agg[0]++; agg[1] += h.getOutstandingMinor(); agg[2] += h.getProvisionMinor();
            }
            for (var e : byClass.entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("classification", e.getKey());
                row.put("loans", e.getValue()[0]);
                row.put("outstanding_taka", taka(e.getValue()[1]));
                row.put("rate_percent", BrpdClassifier.byName(e.getKey()).provisionRateBp() / 100.0);
                row.put("provision_taka", taka(e.getValue()[2]));
                totalProvision += e.getValue()[2];
                rows.add(row);
            }
        }
        return new GeneratedPack(rows, Map.of("run_date", String.valueOf(runDate),
                "provision_taka", taka(totalProvision)), null);
    }

    /** CL-3 — cash recovered in-period on classified loans. */
    private GeneratedPack recoveryPosition(YearMonth period) {
        Instant from = period.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = period.atEndOfMonth().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Map<UUID, List<ServicingService.PaymentFact>> byLoan = new LinkedHashMap<>();
        for (ServicingService.PaymentFact f : servicing.paymentsBetween(from, to)) {
            byLoan.computeIfAbsent(f.loanId(), k -> new ArrayList<>()).add(f);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        long recovered = 0;
        for (Loan loan : activeLoans()) {
            if (!CLASSIFIED.contains(loan.getClassification())) continue;
            List<ServicingService.PaymentFact> inPeriod = byLoan.get(loan.getId());
            if (inPeriod == null || inPeriod.isEmpty()) continue;
            long sum = inPeriod.stream().mapToLong(ServicingService.PaymentFact::amountMinor).sum();
            recovered += sum;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("loan_no", loan.getLoanNo());
            row.put("cif", cifOf(loan));
            row.put("classification", loan.getClassification());
            row.put("payments", inPeriod.size());
            row.put("recovered_taka", taka(sum));
            rows.add(row);
        }
        return new GeneratedPack(rows, Map.of("recovered_taka", taka(recovered)), null);
    }

    /** CL-4 — write-off legal case resolutions. */
    private GeneratedPack writeOffDetails() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CollectionsService.WriteOffFact c : collections.writeOffCases()) {
            Loan loan = loans.findById(c.loanId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("case_no", c.caseNo());
            row.put("loan_no", loan == null ? "" : loan.getLoanNo());
            row.put("court", c.court() == null ? "" : c.court());
            row.put("status", c.status());
            row.put("claim_taka", taka(c.claimMinor()));
            row.put("filed_on", String.valueOf(c.filedOn()));
            rows.add(row);
        }
        return new GeneratedPack(rows, Map.of("write_offs", rows.size()), null);
    }

    /** CL-5 — restructures approved in period. */
    private GeneratedPack restructuredLoans(YearMonth period) {
        Instant from = period.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = period.atEndOfMonth().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ServicingService.RescheduleFact r : servicing.reschedulesApprovedBetween(from, to)) {
            Loan loan = loans.findById(r.loanId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("loan_no", loan == null ? "" : loan.getLoanNo());
            row.put("new_tenor_months", r.newTenorMonths());
            row.put("reason", r.reason());
            row.put("requested_by", r.requestedBy());
            row.put("decided_by", r.decidedBy() == null ? "" : r.decidedBy());
            rows.add(row);
        }
        return new GeneratedPack(rows, Map.of("restructured", rows.size()), null);
    }

    /** Basel III CAR inputs — RWA by class, CAR vs the 12.5% floor. */
    private GeneratedPack baselCarRows() {
        Map<String, Long> byClass = outstandingByClass();
        long rwa = BaselCar.rwaMinor(byClass);
        int car = BaselCar.carBp(eligibleCapitalMinor, rwa);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var e : byClass.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("classification", e.getKey());
            row.put("outstanding_taka", taka(e.getValue()));
            row.put("risk_weight_percent", BaselCar.riskWeightBp(e.getKey()) / 100.0);
            row.put("rwa_taka", taka(Math.round(e.getValue() * BaselCar.riskWeightBp(e.getKey()) / 10_000.0)));
            rows.add(row);
        }
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("eligible_capital_taka", taka(eligibleCapitalMinor));
        totals.put("rwa_taka", taka(rwa));
        totals.put("car_percent", car == Integer.MAX_VALUE ? null : car / 100.0);
        totals.put("floor_percent", BaselCar.FLOOR_BP / 100.0);
        totals.put("buffer_pp", car == Integer.MAX_VALUE ? null : BaselCar.bufferBp(car) / 100.0);
        return new GeneratedPack(rows, totals, null);
    }

    /** EDW feed — portfolio aggregate for the BB data warehouse. */
    private GeneratedPack edwRows(LocalDate periodEnd) {
        List<Loan> active = activeLoans();
        long outstanding = active.stream().mapToLong(Loan::getOutstandingMinor).sum();
        long provision = active.stream()
                .mapToLong(l -> BrpdClassifier.byName(l.getClassification()).provisionMinor(l.getOutstandingMinor()))
                .sum();
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("as_of", String.valueOf(periodEnd));
        row.put("loans", active.size());
        row.put("outstanding_taka", taka(outstanding));
        row.put("provision_taka", taka(provision));
        return new GeneratedPack(List.of(row), Map.of("loans", active.size(),
                "outstanding_taka", taka(outstanding), "provision_taka", taka(provision)), null);
    }

    /** IFRS-9 ECL statement — persists the runway snapshot, then reports it. */
    private GeneratedPack eclRows(LocalDate asOf) {
        List<EclSnapshot> snapshot = runEclSnapshot(asOf, "system:regcon");
        List<Map<String, Object>> rows = new ArrayList<>();
        long eclTotal = 0, brpdTotal = 0;
        for (EclSnapshot s : snapshot) {
            eclTotal += s.getEclMinor(); brpdTotal += s.getBrpdProvisionMinor();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("stage", s.getStage());
            row.put("ifrs_stage", s.getIfrsStage());
            row.put("loans", s.getLoans());
            row.put("ead_taka", taka(s.getEadMinor()));
            row.put("pd_percent", s.getPdBp() / 100.0);
            row.put("lgd_percent", s.getLgdBp() / 100.0);
            row.put("ecl_taka", taka(s.getEclMinor()));
            row.put("brpd_provision_taka", taka(s.getBrpdProvisionMinor()));
            row.put("delta_taka", taka(s.getEclMinor() - s.getBrpdProvisionMinor()));
            rows.add(row);
        }
        return new GeneratedPack(rows, Map.of("as_of", String.valueOf(asOf),
                "ecl_taka", taka(eclTotal), "brpd_provision_taka", taka(brpdTotal),
                "delta_taka", taka(eclTotal - brpdTotal)), null);
    }

    /** Large-loan forecast — exposures ≥ 10% of capital, then the largest approaching. */
    private GeneratedPack largeLoanForecast() {
        long threshold = eligibleCapitalMinor / 10;   // BB single-borrower norm
        List<Loan> bySize = activeLoans().stream()
                .sorted(java.util.Comparator.comparingLong(Loan::getOutstandingMinor).reversed())
                .limit(10).toList();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Loan loan : bySize) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("loan_no", loan.getLoanNo());
            row.put("cif", cifOf(loan));
            row.put("classification", loan.getClassification());
            row.put("outstanding_taka", taka(loan.getOutstandingMinor()));
            row.put("percent_of_capital", Math.round(loan.getOutstandingMinor() * 10_000.0
                    / eligibleCapitalMinor) / 100.0);
            row.put("large", loan.getOutstandingMinor() >= threshold);
            rows.add(row);
        }
        return new GeneratedPack(rows, Map.of("large_loan_threshold_taka", taka(threshold)), null);
    }

    /**
     * CIB files (11 §6): Subject = one SUBJ block per borrowing customer with a
     * FACL row per loan; Contract = one FACL row per contract. Both fixed-width
     * via the parser's own field offsets (round-trip tested).
     */
    private GeneratedPack cibFile(boolean subject, LocalDate periodEnd) {
        List<Loan> active = activeLoans();
        Map<UUID, List<Loan>> byCustomer = new LinkedHashMap<>();
        for (Loan loan : active) byCustomer.computeIfAbsent(loan.getCustomerId(), k -> new ArrayList<>()).add(loan);

        Set<YearMonth> paidMonths = paidMonthsOf(active, periodEnd);
        List<Map<String, Object>> displayRows = new ArrayList<>();
        String file;
        if (subject) {
            List<CibFileWriter.Subject> subjects = new ArrayList<>();
            for (var e : byCustomer.entrySet()) {
                Customer c = customerOrNull(e.getKey());
                List<CibFileWriter.FacilityLineRaw> facs = new ArrayList<>();
                for (Loan loan : e.getValue()) {
                    facs.add(faclRow(loan, paidMonths, periodEnd));
                    displayRows.add(cibDisplayRow(loan, c));
                }
                subjects.add(new CibFileWriter.Subject(c == null ? "" : c.getCifNo(),
                        c == null ? "" : c.getNameEn(), List.copyOf(facs)));
            }
            file = CibFileWriter.subjectFile(YearMonth.from(periodEnd).toString(),
                    "ULMS-S-" + periodEnd, subjects);
        } else {
            List<CibFileWriter.FacilityLineRaw> contracts = new ArrayList<>();
            for (Loan loan : active) {
                contracts.add(faclRow(loan, paidMonths, periodEnd));
                displayRows.add(cibDisplayRow(loan, customerOrNull(loan.getCustomerId())));
            }
            file = CibFileWriter.contractFile(YearMonth.from(periodEnd).toString(),
                    "ULMS-C-" + periodEnd, contracts);
        }
        return new GeneratedPack(displayRows, Map.of("rows", displayRows.size()), file);
    }

    /** Payment months across the 24-month rhythm window (oldest→latest track). */
    private Set<YearMonth> paidMonthsOf(List<Loan> active, LocalDate periodEnd) {
        Instant from = periodEnd.minusMonths(24).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = periodEnd.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Set<YearMonth> months = new HashSet<>();
        for (ServicingService.PaymentFact f : servicing.paymentsBetween(from, to)) {
            months.add(YearMonth.from(f.paidOn()));
        }
        return months;
    }

    private CibFileWriter.FacilityLineRaw faclRow(Loan loan, Set<YearMonth> paidMonths,
                                                  LocalDate periodEnd) {
        BigDecimal rate = BigDecimal.valueOf(loan.getInterestRateBp(), 2);
        long emi = loan.getDisbursedAt() == null ? 0
                : MoneyMath.emiMonthly(loan.getPrincipalMinor(), loan.getTenorMonths(), rate);
        long overdue = loan.getDpd() <= 0 ? 0 : Math.min(loan.getOutstandingMinor(),
                emi * ((loan.getDpd() + 29) / 30));
        // 24-month rhythm oldest→latest ending at the period ('0' paid month · '2' missed)
        StringBuilder track = new StringBuilder(24);
        YearMonth lastMonth = YearMonth.from(periodEnd);
        for (int i = 23; i >= 0; i--) {
            track.append(paidMonths.contains(lastMonth.minusMonths(i)) ? '0' : '2');
        }
        return new CibFileWriter.FacilityLineRaw(LENDER_CODE, LENDER_NAME, "TERM LOAN",
                loan.getPrincipalMinor(), loan.getOutstandingMinor(), overdue, emi,
                loan.getDpd(), loan.getClassification(),
                loan.getLastPaidAt() == null ? ""
                        : LocalDateTime.ofInstant(loan.getLastPaidAt(), ZoneOffset.UTC)
                        .toLocalDate().toString().replace("-", ""),
                track.toString());
    }

    private Map<String, Object> cibDisplayRow(Loan loan, Customer c) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("cif", c == null ? "" : c.getCifNo());
        row.put("loan_no", loan.getLoanNo());
        row.put("classification", loan.getClassification());
        row.put("outstanding_taka", taka(loan.getOutstandingMinor()));
        row.put("dpd", loan.getDpd());
        return row;
    }

    // ── ECL runway (03: fields now, statement assembly-only later) ────────

    /** Compute + persist the ECL snapshot for an as-of date (rerun replaces). */
    @Transactional
    public List<EclSnapshot> runEclSnapshot(LocalDate asOf, String actor) {
        eclRepo.deleteAllByAsOf(asOf);
        Map<String, long[]> byStage = new LinkedHashMap<>();   // [count, ead, brpdProvision]
        for (Loan loan : activeLoans()) {
            long[] agg = byStage.computeIfAbsent(loan.getClassification(), k -> new long[3]);
            agg[0]++;
            agg[1] += loan.getOutstandingMinor();
            agg[2] += BrpdClassifier.byName(loan.getClassification()).provisionMinor(loan.getOutstandingMinor());
        }
        List<EclSnapshot> saved = new ArrayList<>();
        for (var e : byStage.entrySet()) {
            int pd = EclModel.pdBp(e.getKey());
            long ecl = EclModel.eclMinor(e.getValue()[1], pd, EclModel.LGD_BP);
            saved.add(eclRepo.save(EclSnapshot.of(UUID.randomUUID(), asOf, e.getKey(),
                    EclModel.ifrsStage(e.getKey()), (int) e.getValue()[0], e.getValue()[1],
                    pd, EclModel.LGD_BP, ecl, e.getValue()[2])));
        }
        audit.record(actor, "ECL_SNAPSHOT_RUN", "ecl_snapshot",
                saved.isEmpty() ? null : saved.get(0).getId(),
                "{\"asOf\":\"" + asOf + "\",\"stages\":" + saved.size() + "}", UUID.randomUUID());
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> eclBoard(LocalDate asOf) {
        List<EclSnapshot> rows = eclRepo.findAllByAsOfOrderByStageAsc(asOf);
        long ecl = rows.stream().mapToLong(EclSnapshot::getEclMinor).sum();
        long brpd = rows.stream().mapToLong(EclSnapshot::getBrpdProvisionMinor).sum();
        Map<String, Object> board = new LinkedHashMap<>();
        board.put("asOf", asOf.toString());
        board.put("rows", rows);
        board.put("eclMinor", ecl);
        board.put("brpdProvisionMinor", brpd);
        board.put("deltaMinor", ecl - brpd);
        board.put("runwayMonths", EclModel.runwayMonths(LocalDate.now()));
        board.put("mandatoryFrom", EclModel.MANDATORY_FROM.toString());
        return board;
    }

    // ── sign-off chain (06 §8 P4: preparer → checker → compliance) ────────

    @Transactional
    public RegulatoryReturn check(UUID id, String checker) {
        RegulatoryReturn r = get(id);
        r.check(checker);
        audit.record(checker, "RETURN_CHECKED", "regulatory_return", id,
                "{\"code\":\"" + r.getCode() + "\",\"period\":\"" + r.getPeriod() + "\"}", UUID.randomUUID());
        return r;
    }

    @Transactional
    public RegulatoryReturn fileReturn(UUID id, String officer) {
        RegulatoryReturn r = get(id);
        r.file(officer);
        audit.record(officer, "RETURN_FILED", "regulatory_return", id,
                "{\"code\":\"" + r.getCode() + "\",\"period\":\"" + r.getPeriod()
                        + "\",\"sha256\":\"" + r.getFileSha256() + "\"}", UUID.randomUUID());
        return r;
    }

    private RegulatoryReturn get(UUID id) {
        return returnsRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No such regulatory return " + id));
    }

    // ── board + calendar read models ─────────────────────────────────────

    /** The regcon console board: catalog × latest pack + KPIs (prototype pgRegcon). */
    @Transactional(readOnly = true)
    public Map<String, Object> board(LocalDate today) {
        Map<String, RegulatoryReturn> latest = new LinkedHashMap<>();
        returnsRepo.findLatestPerCode().forEach(r -> latest.put(r.getCode(), r));

        List<Map<String, Object>> entries = new ArrayList<>();
        int dueIn30 = 0;
        for (RegconCatalog.Entry e : RegconCatalog.CATALOG) {
            RegulatoryReturn r = latest.get(e.code());
            LocalDate due = RegconCatalog.nextDue(e.code(), today);
            String status;
            if (e.frequency() == RegconCatalog.Frequency.CONTINUOUS) {
                status = "Live";
            } else if (r == null) {
                status = "Not started";
            } else {
                status = switch (r.getStatus()) {
                    case "FILED" -> "Filed";
                    case "CHECKED" -> "In sign-off";
                    default -> "Staged";
                };
            }
            boolean filedForDuePeriod = r != null && "FILED".equals(r.getStatus())
                    && due != null && r.getPeriod().equals(RegconCatalog.periodOf(due));
            if (due != null && !due.isAfter(today.plusDays(30)) && !filedForDuePeriod) dueIn30++;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", e.code());
            row.put("description", e.description());
            row.put("frequency", e.frequency().name());
            row.put("nextDue", due == null ? null : due.toString());
            row.put("status", status);
            row.put("latestPeriod", r == null ? null : r.getPeriod());
            row.put("returnId", r == null ? null : r.getId().toString());
            row.put("rowCount", r == null ? 0 : r.getRowCount());
            row.put("fileSha256", r == null ? null : r.getFileSha256());
            row.put("storageKey", r == null ? null : r.getStorageKey());
            row.put("preparer", r == null ? null : r.getPreparer());
            row.put("checker", r == null ? null : r.getChecker());
            row.put("complianceOfficer", r == null ? null : r.getComplianceOfficer());
            row.put("submittedAt", r == null ? null : r.getSubmittedAt());
            entries.add(row);
        }

        List<RegulatoryReturn> filed = returnsRepo.findAllByStatusOrderBySubmittedAtDesc("FILED");
        long onTime = filed.stream().filter(f -> f.getSubmittedAt() != null).count();

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("dueIn30Days", dueIn30);
        kpis.put("filedTotal", filed.size());
        kpis.put("onTimeStreak", onTime);
        kpis.put("carPercent", carBoardPercent());
        kpis.put("carFloorPercent", BaselCar.FLOOR_BP / 100.0);
        kpis.put("eclRunwayMonths", EclModel.runwayMonths(today));
        kpis.put("eclMandatoryFrom", EclModel.MANDATORY_FROM.toString());

        return Map.of("today", today.toString(), "entries", entries, "kpis", kpis);
    }

    private Double carBoardPercent() {
        long rwa = BaselCar.rwaMinor(outstandingByClass());
        int car = BaselCar.carBp(eligibleCapitalMinor, rwa);
        return car == Integer.MAX_VALUE ? null : car / 100.0;
    }

    /** Basel CAR detail endpoint payload — per-class RWA rows + the ratio totals. */
    @Transactional(readOnly = true)
    public Map<String, Object> carInputs() {
        GeneratedPack pack = baselCarRows();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("asOf", LocalDate.now().toString());
        out.put("rows", pack.rows());
        out.putAll(pack.totals());
        return out;
    }

    /** The rendered file bytes for download — WORM staging evidence. */
    @Transactional(readOnly = true)
    public RenderedFile file(UUID id) {
        RegulatoryReturn r = get(id);
        String content = "fixed-width".equals(r.getFileFormat())
                ? fixedWidthFileOf(r) : renderCsv(rowsOf(r));
        if (!sha256(content).equals(r.getFileSha256())) {
            throw new IllegalStateException("File checksum mismatch for return " + id
                    + " — staged payload tampered");
        }
        return new RenderedFile(r, content);
    }

    record RenderedFile(RegulatoryReturn ret, String content) {}

    // ── helpers ───────────────────────────────────────────────────────────

    private List<Loan> activeLoans() { return loans.findAllByStageOrderByDpdDesc("ACTIVE"); }

    private Map<String, Long> outstandingByClass() {
        Map<String, Long> byClass = new LinkedHashMap<>();
        for (Loan loan : activeLoans()) byClass.merge(loan.getClassification(), loan.getOutstandingMinor(), Long::sum);
        return byClass;
    }

    private LocalDate latestRunOnOrBefore(LocalDate date) {
        return runs.findAllByOrderByRunDateDesc().stream()
                .map(ProvisionRun::getRunDate)
                .filter(d -> !d.isAfter(date)).findFirst().orElse(null);
    }

    private String cifOf(Loan loan) {
        Customer c = customerOrNull(loan.getCustomerId());
        return c == null ? "" : c.getCifNo();
    }

    private Customer customerOrNull(UUID id) {
        try {
            return customers.get(id);
        } catch (NoSuchElementException e) {
            return null;
        }
    }

    /** CSV over the display rows — money in TAKA major units (07 §5: API renders money). */
    private String renderCsv(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return "no rows for period\n";
        StringBuilder sb = new StringBuilder();
        Set<String> headers = rows.get(0).keySet();
        sb.append(String.join(",", headers)).append('\n');
        for (Map<String, Object> row : rows) {
            List<String> cells = new ArrayList<>();
            for (String h : headers) {
                Object v = row.get(h);
                cells.add(v == null ? "" : (v instanceof String s && (s.contains(",") || s.contains("\""))
                        ? '"' + s.replace("\"", "\"\"") + '"' : String.valueOf(v)));
            }
            sb.append(String.join(",", cells)).append('\n');
        }
        return sb.toString();
    }

    /** CIB packs carry the pre-rendered fixed-width file in their payload. */
    private String fixedWidthFileOf(RegulatoryReturn r) {
        Object file = payloadOf(r).get("file");
        if (file == null) throw new IllegalStateException("Fixed-width payload missing file for " + r.getId());
        return String.valueOf(file);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> rowsOf(RegulatoryReturn r) {
        Object rows = payloadOf(r).get("rows");
        return rows == null ? List.of() : (List<Map<String, Object>>) rows;
    }

    private Map<String, Object> payloadOf(RegulatoryReturn r) {
        return com.uslbd.ulms.platform.idempotency.IdempotencyService.parseJson(r.getPayload());
    }

    private String payloadJson(RegconCatalog.Entry entry, String period, GeneratedPack pack) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("code", entry.code());
        payload.put("description", entry.description());
        payload.put("period", period);
        payload.put("generatedAt", Instant.now().toString());
        payload.put("totals", pack.totals());
        payload.put("rows", pack.rows());
        if (pack.file() != null) payload.put("file", pack.file());
        return com.uslbd.ulms.platform.idempotency.IdempotencyService.toJson(payload);
    }

    static String taka(long minor) {
        return BigDecimal.valueOf(minor, 2).toPlainString();
    }

    static String sha256(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(64);
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
