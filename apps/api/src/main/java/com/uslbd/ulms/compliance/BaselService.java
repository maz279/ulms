package com.uslbd.ulms.compliance;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Basel engine (R10 P-F, BASEL guide §3–§7): risk-weighted assets with CRM
 * haircuts, large-exposure checks (single ≤ 15% of capital), and the SCH-BR
 * summary inputs. Weight selection: BRPD class overrides (SS 150% / DF 200%
 * / B-L 250%) beat the segment base (retail 75%, SME/corporate 100%,
 * mortgage 35%); CRM nets recognized collateral up to 50% of exposure.
 */
@Service
public class BaselService {

    /** CRM recognition cap: collateral offsets at most half the exposure. */
    static final double CRM_CAP = 0.5;
    /** BIA operational-risk alpha (BASEL §5.1). Gross income is a UAT feed. */
    static final int BIA_ALPHA_BP = 1500;

    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final CollateralValuePort collateral;
    private final RiskWeightRepository weights;
    private final CapitalBaseRepository capital;

    public BaselService(LoanRepository loans, CustomerRepository customers,
                        CollateralValuePort collateral, RiskWeightRepository weights,
                        CapitalBaseRepository capital) {
        this.loans = loans; this.customers = customers;
        this.collateral = collateral; this.weights = weights; this.capital = capital;
    }

    int weightBp(Loan loan, String segment) {
        // classification overrides first (SS/DF/B-L), then segment base
        for (String cls : List.of("SS", "DF", "B/L")) {
            if (cls.equals(loan.getClassification())) {
                return weights.findById(cls).map(RiskWeight::getWeightBp)
                        .orElse(cls.equals("SS") ? 15000 : cls.equals("DF") ? 20000 : 25000);
            }
        }
        String key = switch (segment == null ? "RETAIL" : segment) {
            case "SME" -> "SME";
            case "CORPORATE" -> "CORPORATE";
            case "MORTGAGE" -> "MORTGAGE";
            default -> "RETAIL";
        };
        return weights.findById(key).map(RiskWeight::getWeightBp)
                .orElse(key.equals("MORTGAGE") ? 3500 : key.equals("RETAIL") ? 7500 : 10000);
    }

    /** RWA = exposure × weight × (1 − CRM), CRM capped at 50%. */
    @Transactional(readOnly = true)
    public long rwaMinor(Loan loan) {
        String segment = customers.findById(loan.getCustomerId())
                .map(Customer::getSegment).orElse("RETAIL");
        int w = weightBp(loan, segment);
        long realizable = collateral.realizableOf(loan.getCustomerId());
        double crm = Math.min((double) realizable / Math.max(1, loan.getOutstandingMinor()), CRM_CAP);
        return Math.round(loan.getOutstandingMinor() * w / 10_000.0 * (1 - crm));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> rwaSummary() {
        long totalRwa = 0, totalExposure = 0;
        for (Loan l : activeLoans()) {
            totalRwa += rwaMinor(l);
            totalExposure += l.getOutstandingMinor();
        }
        long cap = capitalMinor();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("exposureMinor", totalExposure);
        m.put("rwaMinor", totalRwa);
        m.put("capitalMinor", cap);
        m.put("carPercent", cap == 0 ? null
                : Math.round(cap * 10_000.0 / Math.max(1, totalRwa)) / 100.0);
        return m;
    }

    /** Single-borrower large exposures > 15% of capital (BASEL §4.3). */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> largeExposureBreaches() {
        long cap = capitalMinor();
        List<Map<String, Object>> breaches = new ArrayList<>();
        if (cap == 0) return breaches;
        Map<java.util.UUID, Long> byCustomer = new LinkedHashMap<>();
        for (Loan l : activeLoans()) {
            byCustomer.merge(l.getCustomerId(), l.getOutstandingMinor(), Long::sum);
        }
        byCustomer.forEach((customerId, exposure) -> {
            if (exposure > cap * 15 / 100) {
                String cif = customers.findById(customerId)
                        .map(Customer::getCifNo).orElse(String.valueOf(customerId));
                breaches.add(Map.of("cif", cif,
                        "exposureMinor", exposure,
                        "percentOfCapital", Math.round(exposure * 10_000.0 / cap) / 100.0));
            }
        });
        return breaches;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> rwaBySegment() {
        Map<String, Long> bySegment = new LinkedHashMap<>();
        for (Loan l : activeLoans()) {
            String segment = customers.findById(l.getCustomerId())
                    .map(Customer::getSegment).orElse("RETAIL");
            bySegment.merge(segment, rwaMinor(l), Long::sum);
        }
        return new LinkedHashMap<>(bySegment);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> portfolioByClassification() {
        Map<String, Long> byClass = new LinkedHashMap<>();
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Loan l : activeLoans()) {
            byClass.merge(l.getClassification(), l.getOutstandingMinor(), Long::sum);
            counts.merge(l.getClassification(), 1, Integer::sum);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        byClass.forEach((cls, amount) -> out.put(cls,
                Map.of("outstandingMinor", amount, "loans", counts.get(cls))));
        return out;
    }

    /** BIA: α(15%) × average gross income (3 y). Pilot carries a zero feed. */
    public long operationalRiskChargeMinor() {
        return 0;   // gross-income series arrives with the bank GL extract at UAT
    }

    /** Tier-1 leverage ratio: capital / total exposure (≥ 3% target). */
    @Transactional(readOnly = true)
    public long leverageRatioBp() {
        long exposure = activeLoans().stream()
                .mapToLong(Loan::getOutstandingMinor).sum();
        long cap = capitalMinor();
        return exposure == 0 ? 0 : Math.round(cap * 10_000.0 / exposure);
    }

    private List<Loan> activeLoans() {
        return loans.findAllByStageOrderByDpdDesc("ACTIVE");
    }

    private long capitalMinor() {
        return capital.findById(1).map(CapitalBase::getCapitalMinor).orElse(0L);
    }
}
