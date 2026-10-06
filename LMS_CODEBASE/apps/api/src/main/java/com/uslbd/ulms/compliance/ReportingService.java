package com.uslbd.ulms.compliance;

import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Reporting read model (P4 / 12 W11 "reporting queries + read models"): the
 * governed aggregates behind the Report Viewer — MV_LOAN_PORTFOLIO shape per
 * the prototype writer's domain list, grouped by classification / stage /
 * branch. Money is aggregated in minor units; the viewer renders.
 */
@Service
public class ReportingService {

    private final LoanRepository loans;
    private final CustomerService customers;

    ReportingService(LoanRepository loans, CustomerService customers) {
        this.loans = loans; this.customers = customers;
    }

    public enum GroupBy { classification, stage, branch }

    @Transactional(readOnly = true)
    public Map<String, Object> portfolio(String groupByRaw) {
        GroupBy groupBy;
        try {
            groupBy = GroupBy.valueOf(groupByRaw == null ? "classification" : groupByRaw);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "groupby must be one of classification|stage|branch, got " + groupByRaw);
        }
        List<Loan> active = loans.findAllByStageOrderByDpdDesc("ACTIVE");

        // the read model reports the whole book (ACTIVE + CLOSED), grouped
        Map<String, long[]> agg = new LinkedHashMap<>();   // [count, principal, outstanding, provision]
        long totalOutstanding = 0, totalProvision = 0;
        for (Loan loan : loans.findAll()) {
            String key = switch (groupBy) {
                case classification -> loan.getClassification();
                case stage -> loan.getStage();
                case branch -> branchOf(loan);
            };
            long provision = BrpdClassifier.byName(loan.getClassification())
                    .provisionMinor(loan.getOutstandingMinor());
            long[] a = agg.computeIfAbsent(key, k -> new long[4]);
            a[0]++; a[1] += loan.getPrincipalMinor(); a[2] += loan.getOutstandingMinor(); a[3] += provision;
            totalOutstanding += loan.getOutstandingMinor();
            totalProvision += provision;
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        agg.forEach((key, a) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put(groupBy.name(), key);
            row.put("loans", a[0]);
            row.put("principalMinor", a[1]);
            row.put("outstandingMinor", a[2]);
            row.put("provisionMinor", a[3]);
            row.put("coveragePercent", a[2] == 0 ? 0
                    : Math.round(a[3] * 10_000.0 / a[2]) / 100.0);
            rows.add(row);
        });
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("groupBy", groupBy.name());
        result.put("activeLoans", active.size());
        result.put("rows", rows);
        result.put("totalOutstandingMinor", totalOutstanding);
        result.put("totalProvisionMinor", totalProvision);
        return result;
    }

    private String branchOf(Loan loan) {
        try {
            return customers.get(loan.getCustomerId()).getBranchCode();
        } catch (NoSuchElementException e) {
            return "UNKNOWN";
        }
    }
}
