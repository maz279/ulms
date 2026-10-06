package com.uslbd.ulms.origination;

import java.util.UUID;

record ApplicationView(UUID id, String appNo, UUID customerId, String productCode,
                       long amountMinor, int tenorMonths, String rateType, String stage,
                       java.math.BigDecimal dbrPercent, Long incomeMinor,
                       Long existingEmiMinor, Long cibObligationMinor, Long fineractLoanId,
                       String branchCode, long version,
                       String workflowNode, String workflowPhase, java.time.Instant workflowSla,
                       java.time.Instant createdAt) {
    static ApplicationView of(Application a) { return of(a, null, null, null); }

    /** 03: application detail includes workflow state (node/phase/SLA). */
    static ApplicationView of(Application a, String workflowNode, String workflowPhase,
                              java.time.Instant workflowSla) {
        return new ApplicationView(a.getId(), a.getAppNo(), a.getCustomerId(),
                a.getProductCode(), a.getAmountMinor(), a.getTenorMonths(),
                a.getRateType().name(), a.getStage().name(), a.getDbrPercent(),
                a.getIncomeMinor(), a.getExistingEmiMinor(), a.getCibObligationMinor(),
                a.getFineractLoanId(), a.getBranchCode(), a.getVersion(),
                workflowNode, workflowPhase, workflowSla, a.getCreatedAt());
    }
}
