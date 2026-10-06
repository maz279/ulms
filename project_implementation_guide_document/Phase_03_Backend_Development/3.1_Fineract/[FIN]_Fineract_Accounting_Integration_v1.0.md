**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Apache Fineract Accounting Integration Guide - Bangladesh COA |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# Apache Fineract Accounting Integration Guide - Bangladesh COA

## Table of Contents

1. [Introduction](#1-introduction)
2. [Bangladesh Chart of Accounts](#2-bangladesh-chart-of-accounts)
3. [Fineract Accounting Setup](#3-fineract-accounting-setup)
4. [COA Mapping Configuration](#4-coa-mapping-configuration)
5. [Journal Entry Extensions](#5-journal-entry-extensions)
6. [Provisioning Accounting](#6-provisioning-accounting)
7. [Interest Suspense Accounting](#7-interest-suspense-accounting)
8. [Integration with CBS](#8-integration-with-cbs)
9. [Financial Reporting](#9-financial-reporting)
10. [Testing and Validation](#10-testing-and-validation)

---

## 1. Introduction

### 1.1 Purpose

This document describes the integration between Apache Fineract's accounting module and Bangladesh Bank's Chart of Accounts (COA) requirements for scheduled commercial banks.

### 1.2 Regulatory Context

Bangladesh Bank mandates specific account codes and structures for:
- Loan portfolio tracking
- Provision for classified loans
- Interest income recognition
- Suspense account management
- Regulatory reporting

---

## 2. Bangladesh Chart of Accounts

### 2.1 Standard COA Structure

```
┌─────────────────────────────────────────────────────────────┐
│              Bangladesh Bank Standard COA                    │
├─────────────────────────────────────────────────────────────┤
│ 1xxxx - Assets                                              │
│   11xxx - Cash & Bank Balances                              │
│   12xxx - Loans & Advances                                  │
│     121xx - Consumer Loans                                  │
│     122xx - SME Loans                                       │
│     123xx - Corporate Loans                                 │
│   13xxx - Investments                                       │
│   14xxx - Fixed Assets                                      │
│ 2xxxx - Liabilities                                         │
│   21xxx - Deposits                                          │
│   22xxx - Borrowings                                        │
│   23xxx - Provisions                                        │
│     231xx - Loan Loss Provisions                            │
│ 3xxxx - Equity                                              │
│ 4xxxx - Income                                              │
│   41xxx - Interest Income                                   │
│   42xxx - Fee Income                                        │
│ 5xxxx - Expenses                                            │
│   51xxx - Interest Expense                                  │
│   52xxx - Provision Expense                                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Loan-Related Account Codes

| Account Code | Description | Type |
|--------------|-------------|------|
| 12001 | Consumer Loans - Standard | Asset |
| 12002 | Consumer Loans - Classified | Asset |
| 12101 | SME Loans - Standard | Asset |
| 12102 | SME Loans - Classified | Asset |
| 12201 | Corporate Loans - Standard | Asset |
| 12202 | Corporate Loans - Classified | Asset |
| 23101 | General Provision | Liability |
| 23102 | Specific Provision - SMA | Liability |
| 23103 | Specific Provision - SS | Liability |
| 23104 | Specific Provision - DF | Liability |
| 23105 | Specific Provision - BL | Liability |
| 41001 | Interest Income - Loans | Income |
| 41002 | Interest in Suspense | Income (Contra) |
| 52001 | Provision for Loan Losses | Expense |

---

## 3. Fineract Accounting Setup

### 3.1 Accounting Rule Configuration

```sql
-- Configure accounting rules for Bangladesh COA
INSERT INTO acc_accounting_rule (
    id, name, office_id, 
    debit_account_id, credit_account_id,
    system_defined, description
) VALUES
-- Loan Disbursement
(1, 'Loan Disbursement - Consumer', 1, 
 (SELECT id FROM acc_gl_account WHERE gl_code = '12001'),
 (SELECT id FROM acc_gl_account WHERE gl_code = '11001'),
 true, 'Consumer loan disbursement'),

-- Loan Repayment - Principal
(2, 'Loan Repayment - Principal', 1,
 (SELECT id FROM acc_gl_account WHERE gl_code = '11001'),
 (SELECT id FROM acc_gl_account WHERE gl_code = '12001'),
 true, 'Loan principal repayment'),

-- Interest Accrual
(3, 'Interest Accrual', 1,
 (SELECT id FROM acc_gl_account WHERE gl_code = '12001'),
 (SELECT id FROM acc_gl_account WHERE gl_code = '41001'),
 true, 'Daily interest accrual'),

-- Interest Application
(4, 'Interest Application', 1,
 (SELECT id FROM acc_gl_account WHERE gl_code = '12001'),
 (SELECT id FROM acc_gl_account WHERE gl_code = '41001'),
 true, 'Apply accrued interest');
```

### 3.2 Product-Level Accounting Configuration

```java
package com.unisoft.ulms.fineract.accounting;

import lombok.Data;
import org.apache.fineract.accounting.common.AccountingRuleType;

/**
 * Bangladesh COA Accounting Configuration
 */
@Data
public class BangladeshAccountingConfiguration {
    
    private Long loanProductId;
    private AccountingRuleType accountingRule;
    
    // Asset Accounts
    private Long fundSourceAccountId;           // 11001 - Cash/Bank
    private Long loanPortfolioAccountId;        // 12001 - Loans
    private Long transfersInSuspenseAccountId;  // 19001 - Suspense
    
    // Income Accounts
    private Long interestOnLoansAccountId;      // 41001 - Interest Income
    private Long incomeFromFeesAccountId;       // 42001 - Fee Income
    private Long incomeFromPenaltiesAccountId;  // 42002 - Penalty Income
    
    // Expense Accounts
    private Long writeOffAccountId;             // 52002 - Write-off Expense
    
    // Liability Accounts
    private Long overpaymentsAccountId;         // 24001 - Overpayments
    private Long suspendedInterestAccountId;    // 41002 - Interest Suspense
    
    // Provision Accounts (ULMS Extension)
    private Long generalProvisionAccountId;     // 23101
    private Long specificProvisionAccountId;    // 23102-23105
}
```

---

## 4. COA Mapping Configuration

### 4.1 GL Account Setup Service

```java
package com.unisoft.ulms.fineract.accounting.service;

import lombok.RequiredArgsConstructor;
import org.apache.fineract.accounting.glaccount.domain.GLAccount;
import org.apache.fineract.accounting.glaccount.domain.GLAccountType;
import org.apache.fineract.accounting.glaccount.domain.GLAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Bangladesh COA Setup Service
 * Configures GL accounts per Bangladesh Bank guidelines
 */
@Service
@RequiredArgsConstructor
public class BangladeshCoaSetupService {
    
    private final GLAccountRepository glAccountRepository;
    
    private static final Map<String, AccountTemplate> BANGLADESH_COA = new HashMap<>();
    
    static {
        // Asset Accounts
        BANGLADESH_COA.put("11001", new AccountTemplate("11001", "Cash on Hand", ASSET));
        BANGLADESH_COA.put("11002", new AccountTemplate("11002", "Balance with Bangladesh Bank", ASSET));
        BANGLADESH_COA.put("12001", new AccountTemplate("12001", "Consumer Loans - Standard", ASSET));
        BANGLADESH_COA.put("12002", new AccountTemplate("12002", "Consumer Loans - SMA", ASSET));
        BANGLADESH_COA.put("12003", new AccountTemplate("12003", "Consumer Loans - SS", ASSET));
        BANGLADESH_COA.put("12004", new AccountTemplate("12004", "Consumer Loans - DF", ASSET));
        BANGLADESH_COA.put("12005", new AccountTemplate("12005", "Consumer Loans - BL", ASSET));
        
        // Liability Accounts
        BANGLADESH_COA.put("23101", new AccountTemplate("23101", "General Loan Loss Provision", LIABILITY));
        BANGLADESH_COA.put("23102", new AccountTemplate("23102", "Specific Provision - SMA", LIABILITY));
        BANGLADESH_COA.put("23103", new AccountTemplate("23103", "Specific Provision - SS", LIABILITY));
        BANGLADESH_COA.put("23104", new AccountTemplate("23104", "Specific Provision - DF", LIABILITY));
        BANGLADESH_COA.put("23105", new AccountTemplate("23105", "Specific Provision - BL", LIABILITY));
        
        // Income Accounts
        BANGLADESH_COA.put("41001", new AccountTemplate("41001", "Interest Income - Loans", INCOME));
        BANGLADESH_COA.put("41002", new AccountTemplate("41002", "Interest in Suspense", INCOME));
        
        // Expense Accounts
        BANGLADESH_COA.put("52001", new AccountTemplate("52001", "Provision for Loan Losses", EXPENSE));
        BANGLADESH_COA.put("52002", new AccountTemplate("52002", "Write-off of Loans", EXPENSE));
    }
    
    @Transactional
    public void setupBangladeshCoa(Long officeId) {
        for (Map.Entry<String, AccountTemplate> entry : BANGLADESH_COA.entrySet()) {
            createGlAccountIfNotExists(entry.getValue(), officeId);
        }
    }
    
    private void createGlAccountIfNotExists(AccountTemplate template, Long officeId) {
        if (!glAccountRepository.existsByGlCodeAndOfficeId(template.getGlCode(), officeId)) {
            GLAccount account = GLAccount.builder()
                .name(template.getName())
                .glCode(template.getGlCode())
                .type(template.getType())
                .usage(GLAccountUsage.DETAIL)
                .manualEntriesAllowed(false)
                .build();
            
            glAccountRepository.save(account);
        }
    }
}
```

### 4.2 Dynamic COA Mapping

```java
package com.unisoft.ulms.fineract.accounting.mapping;

import com.unisoft.ulms.fineract.brpd.BrpdClassification;
import org.apache.fineract.portfolio.loanaccount.domain.Loan;

/**
 * Dynamic COA Mapping Service
 * Maps loans to appropriate GL accounts based on classification
 */
@Service
@RequiredArgsConstructor
public class DynamicCoaMappingService {
    
    private final GlAccountRepository glAccountRepository;
    
    /**
     * Get the loan portfolio GL account based on classification
     */
    public GLAccount getLoanPortfolioAccount(Loan loan) {
        BrpdClassification classification = getLoanClassification(loan);
        String glCode = mapClassificationToGlCode(classification, loan.getLoanProduct().getProductType());
        
        return glAccountRepository.findByGlCode(glCode)
            .orElseThrow(() -> new GlAccountNotFoundException(glCode));
    }
    
    private String mapClassificationToGlCode(BrpdClassification classification, ProductType productType) {
        String prefix = getProductPrefix(productType);
        
        return switch (classification) {
            case STD_0, STD_1, STD_2 -> prefix + "01";
            case SMA -> prefix + "02";
            case SS -> prefix + "03";
            case DF -> prefix + "04";
            case BL -> prefix + "05";
        };
    }
    
    private String getProductPrefix(ProductType type) {
        return switch (type) {
            case CONSUMER -> "12";
            case SME -> "13";
            case CORPORATE -> "14";
        };
    }
}
```

---

## 5. Journal Entry Extensions

### 5.1 Custom Journal Entry Service

```java
package com.unisoft.ulms.fineract.accounting.service;

import lombok.RequiredArgsConstructor;
import org.apache.fineract.accounting.journalentry.domain.JournalEntry;
import org.apache.fineract.accounting.journalentry.service.JournalEntryWritePlatformService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * ULMS Extended Journal Entry Service
 * Supports Bangladesh-specific accounting entries
 */
@Service
@RequiredArgsConstructor
public class UlmsJournalEntryService {
    
    private final JournalEntryWritePlatformService journalEntryService;
    private final DynamicCoaMappingService coaMappingService;
    
    /**
     * Create journal entry for loan disbursement with Bangladesh COA
     */
    public void createDisbursementEntry(Loan loan, BigDecimal amount, LocalDate transactionDate) {
        GLAccount loanPortfolioAccount = coaMappingService.getLoanPortfolioAccount(loan);
        GLAccount fundSourceAccount = coaMappingService.getFundSourceAccount(loan.getFund());
        
        JournalEntryCommand command = JournalEntryCommand.builder()
            .officeId(loan.getOfficeId())
            .transactionDate(transactionDate)
            .comments("Loan disbursement - " + loan.getAccountNumber())
            .debits(Arrays.asList(
                DebitCreditDetail.builder()
                    .glAccountId(loanPortfolioAccount.getId())
                    .amount(amount)
                    .build()
            ))
            .credits(Arrays.asList(
                DebitCreditDetail.builder()
                    .glAccountId(fundSourceAccount.getId())
                    .amount(amount)
                    .build()
            ))
            .build();
        
        journalEntryService.createJournalEntry(command);
    }
    
    /**
     * Create journal entry for provision adjustment
     */
    public void createProvisionEntry(
            Long officeId,
            BrpdClassification classification,
            BigDecimal provisionAmount,
            BigDecimal adjustment,
            LocalDate transactionDate) {
        
        GLAccount provisionAccount = getProvisionAccount(classification);
        GLAccount provisionExpenseAccount = glAccountRepository.findByGlCode("52001")
            .orElseThrow(() -> new GlAccountNotFoundException("52001"));
        
        // Debit or Credit based on adjustment direction
        if (adjustment.compareTo(BigDecimal.ZERO) > 0) {
            // Increase provision
            createDoubleEntry(
                officeId,
                provisionExpenseAccount.getId(), adjustment, // Debit
                provisionAccount.getId(), adjustment,        // Credit
                transactionDate,
                "Provision increase - " + classification.name()
            );
        } else if (adjustment.compareTo(BigDecimal.ZERO) < 0) {
            // Decrease provision (write-back)
            createDoubleEntry(
                officeId,
                provisionAccount.getId(), adjustment.abs(),      // Debit
                provisionExpenseAccount.getId(), adjustment.abs(), // Credit
                transactionDate,
                "Provision write-back - " + classification.name()
            );
        }
    }
}
```

### 5.2 Journal Entry Validator

```java
package com.unisoft.ulms.fineract.accounting.validator;

import org.springframework.stereotype.Component;

/**
 * Bangladesh Accounting Entry Validator
 * Ensures entries comply with BB regulations
 */
@Component
public class BangladeshJournalEntryValidator {
    
    /**
     * Validate journal entry for compliance
     */
    public void validateEntry(JournalEntry entry) {
        // Check office is valid
        if (entry.getOffice() == null) {
            throw new AccountingValidationException("Office is required");
        }
        
        // Verify account codes are from Bangladesh COA
        validateGlCode(entry.getGlAccount().getGlCode());
        
        // Check transaction date is not in future
        if (entry.getTransactionDate().isAfter(LocalDate.now())) {
            throw new AccountingValidationException("Transaction date cannot be in the future");
        }
        
        // Validate debit/credit balance
        validateBalance(entry);
    }
    
    private void validateGlCode(String glCode) {
        if (!glCode.matches("^[1-5]\\d{4}$")) {
            throw new AccountingValidationException(
                "Invalid GL code format: " + glCode + ". Expected format: XXXXX"
            );
        }
    }
}
```

---

## 6. Provisioning Accounting

### 6.1 Provisioning Journal Entry Service

```java
package com.unisoft.ulms.fineract.accounting.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Provisioning Accounting Service
 * Handles provision journal entries per BRPD 15/2024
 */
@Service
@RequiredArgsConstructor
public class ProvisioningAccountingService {
    
    private final UlmsJournalEntryService journalEntryService;
    private final GlAccountRepository glAccountRepository;
    
    /**
     * Post provision entries for classification changes
     */
    @Transactional
    public void postProvisionEntries(
            Long officeId,
            Map<BrpdClassification, ProvisionChange> changes,
            LocalDate effectiveDate) {
        
        for (Map.Entry<BrpdClassification, ProvisionChange> entry : changes.entrySet()) {
            BrpdClassification classification = entry.getKey();
            ProvisionChange change = entry.getValue();
            
            if (change.getAdjustment().compareTo(BigDecimal.ZERO) != 0) {
                journalEntryService.createProvisionEntry(
                    officeId,
                    classification,
                    change.getNewProvision(),
                    change.getAdjustment(),
                    effectiveDate
                );
            }
        }
    }
    
    /**
     * Calculate provision summary for reporting
     */
    public ProvisionSummary calculateProvisionSummary(Long officeId, LocalDate asOfDate) {
        return ProvisionSummary.builder()
            .generalProvision(calculateGeneralProvision(officeId, asOfDate))
            .specificProvisionSMA(calculateSpecificProvision(officeId, SMA, asOfDate))
            .specificProvisionSS(calculateSpecificProvision(officeId, SS, asOfDate))
            .specificProvisionDF(calculateSpecificProvision(officeId, DF, asOfDate))
            .specificProvisionBL(calculateSpecificProvision(officeId, BL, asOfDate))
            .totalProvision(calculateTotalProvision(officeId, asOfDate))
            .build();
    }
}
```

### 6.2 Provisioning Report Generator

```java
package com.unisoft.ulms.fineract.accounting.report;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Provisioning Report Generator
 * Generates BB-compliant provision reports
 */
@Service
@RequiredArgsConstructor
public class ProvisioningReportGenerator {
    
    private final JdbcTemplate jdbcTemplate;
    
    public ProvisioningReport generateReport(Long officeId, LocalDate reportDate) {
        String sql = """
            SELECT 
                a.gl_code,
                a.name as account_name,
                COALESCE(SUM(je.amount), 0) as provision_balance
            FROM acc_gl_account a
            LEFT JOIN acc_gl_journal_entry je ON a.id = je.account_id
                AND je.office_id = ?
                AND je.entry_date <= ?
                AND je.reversed = false
            WHERE a.gl_code IN ('23101', '23102', '23103', '23104', '23105')
            GROUP BY a.gl_code, a.name
            ORDER BY a.gl_code
            """;
        
        List<ProvisionAccountBalance> balances = jdbcTemplate.query(
            sql, 
            (rs, rowNum) -> ProvisionAccountBalance.builder()
                .glCode(rs.getString("gl_code"))
                .accountName(rs.getString("account_name"))
                .balance(rs.getBigDecimal("provision_balance"))
                .build(),
            officeId, reportDate
        );
        
        return ProvisioningReport.builder()
            .officeId(officeId)
            .reportDate(reportDate)
            .accountBalances(balances)
            .generatedAt(LocalDateTime.now())
            .build();
    }
}
```

---

## 7. Interest Suspense Accounting

### 7.1 Interest Suspense Service

```java
package com.unisoft.ulms.fineract.accounting.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Interest Suspense Accounting Service
 * Manages interest accrual for classified loans
 */
@Service
@RequiredArgsConstructor
public class InterestSuspenseAccountingService {
    
    private final GlAccountRepository glAccountRepository;
    private final UlmsJournalEntryService journalEntryService;
    
    /**
     * Suspend interest accrual for classified loan
     * Moves interest from P&L to Suspense account
     */
    @Transactional
    public void suspendInterestAccrual(
            Loan loan,
            BigDecimal interestAmount,
            LocalDate transactionDate) {
        
        GLAccount interestIncomeAccount = glAccountRepository.findByGlCode("41001")
            .orElseThrow(() -> new GlAccountNotFoundException("41001"));
        
        GLAccount interestSuspenseAccount = glAccountRepository.findByGlCode("41002")
            .orElseThrow(() -> new GlAccountNotFoundException("41002"));
        
        // Reverse interest income and move to suspense
        journalEntryService.createDoubleEntry(
            loan.getOfficeId(),
            interestIncomeAccount.getId(), interestAmount,  // Debit - reverse income
            interestSuspenseAccount.getId(), interestAmount, // Credit - to suspense
            transactionDate,
            "Interest suspended - Loan: " + loan.getAccountNumber()
        );
        
        // Record suspense transaction
        recordSuspenseTransaction(loan, interestAmount, transactionDate);
    }
    
    /**
     * Resume interest accrual when loan returns to standard
     */
    @Transactional
    public void resumeInterestAccrual(
            Loan loan,
            BigDecimal suspendedAmount,
            LocalDate transactionDate) {
        
        GLAccount interestIncomeAccount = glAccountRepository.findByGlCode("41001")
            .orElseThrow(() -> new GlAccountNotFoundException("41001"));
        
        GLAccount interestSuspenseAccount = glAccountRepository.findByGlCode("41002")
            .orElseThrow(() -> new GlAccountNotFoundException("41002"));
        
        // Move from suspense back to income
        journalEntryService.createDoubleEntry(
            loan.getOfficeId(),
            interestSuspenseAccount.getId(), suspendedAmount, // Debit - from suspense
            interestIncomeAccount.getId(), suspendedAmount,   // Credit - to income
            transactionDate,
            "Interest resumed - Loan: " + loan.getAccountNumber()
        );
    }
}
```

---

## 8. Integration with CBS

### 8.1 CBS Accounting Interface

```java
package com.unisoft.ulms.fineract.accounting.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Core Banking System Accounting Integration
 * Syncs Fineract entries with CBS General Ledger
 */
@Service
@RequiredArgsConstructor
public class CbsAccountingIntegrationService {
    
    private final CbsApiClient cbsClient;
    private final JournalEntryRepository journalEntryRepository;
    
    /**
     * Sync journal entries to CBS
     */
    @Transactional
    public void syncEntriesToCbs(LocalDate syncDate) {
        List<JournalEntry> pendingEntries = journalEntryRepository
            .findByTransactionDateAndCbsSyncedFalse(syncDate);
        
        for (JournalEntry entry : pendingEntries) {
            try {
                CbsGlEntry cbsEntry = mapToCbsEntry(entry);
                CbsResponse response = cbsClient.postGlEntry(cbsEntry);
                
                if (response.isSuccess()) {
                    entry.setCbsSynced(true);
                    entry.setCbsReference(response.getReference());
                    journalEntryRepository.save(entry);
                }
            } catch (Exception e) {
                log.error("Failed to sync entry {} to CBS", entry.getId(), e);
                entry.setSyncError(e.getMessage());
                journalEntryRepository.save(entry);
            }
        }
    }
    
    private CbsGlEntry mapToCbsEntry(JournalEntry entry) {
        return CbsGlEntry.builder()
            .referenceNo(generateReference(entry))
            .accountCode(entry.getGlAccount().getGlCode())
            .branchCode(entry.getOffice().getExternalId())
            .transactionDate(entry.getTransactionDate())
            .debitAmount(entry.isDebitEntry() ? entry.getAmount() : BigDecimal.ZERO)
            .creditAmount(entry.isCreditEntry() ? entry.getAmount() : BigDecimal.ZERO)
            .narration(entry.getDescription())
            .build();
    }
}
```

### 8.2 Reconciliation Service

```java
package com.unisoft.ulms.fineract.accounting.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * CBS-Fineract Reconciliation Service
 */
@Service
@RequiredArgsConstructor
public class AccountingReconciliationService {
    
    private final CbsApiClient cbsClient;
    private final GlAccountRepository glAccountRepository;
    
    /**
     * Perform daily reconciliation between Fineract and CBS
     */
    public ReconciliationReport performReconciliation(LocalDate reconciliationDate) {
        // Get balances from Fineract
        Map<String, BigDecimal> fineractBalances = getFineractBalances(reconciliationDate);
        
        // Get balances from CBS
        Map<String, BigDecimal> cbsBalances = cbsClient.getGlBalances(reconciliationDate);
        
        // Compare and identify discrepancies
        List<ReconciliationDifference> differences = new ArrayList<>();
        
        for (String glCode : fineractBalances.keySet()) {
            BigDecimal fineractBalance = fineractBalances.getOrDefault(glCode, BigDecimal.ZERO);
            BigDecimal cbsBalance = cbsBalances.getOrDefault(glCode, BigDecimal.ZERO);
            
            if (fineractBalance.compareTo(cbsBalance) != 0) {
                differences.add(ReconciliationDifference.builder()
                    .glCode(glCode)
                    .fineractBalance(fineractBalance)
                    .cbsBalance(cbsBalance)
                    .difference(fineractBalance.subtract(cbsBalance))
                    .build());
            }
        }
        
        return ReconciliationReport.builder()
            .reconciliationDate(reconciliationDate)
            .differences(differences)
            .isBalanced(differences.isEmpty())
            .generatedAt(LocalDateTime.now())
            .build();
    }
}
```

---

## 9. Financial Reporting

### 9.1 BB-Compliant Report Generators

```java
package com.unisoft.ulms.fineract.accounting.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Bangladesh Bank Financial Report Service
 */
@Service
@RequiredArgsConstructor
public class BangladeshFinancialReportService {
    
    private final JdbcTemplate jdbcTemplate;
    
    /**
     * Generate CL-1: Statement of Loans and Advances
     */
    public CL1Report generateCL1Report(Long officeId, LocalDate reportDate) {
        String sql = """
            SELECT 
                lp.product_type,
                lc.classification_code,
                COUNT(*) as loan_count,
                SUM(l.principal_outstanding_derived) as outstanding,
                SUM(l.principal_overdue_derived) as overdue
            FROM m_loan l
            JOIN m_product_loan lp ON l.product_id = lp.id
            JOIN ulms_loan_classification lc ON l.id = lc.loan_id
            WHERE lc.effective_date <= ?
            AND (lc.end_date IS NULL OR lc.end_date > ?)
            AND l.office_id = ?
            GROUP BY lp.product_type, lc.classification_code
            """;
        
        // Implementation continues...
        return reportBuilder.build();
    }
}
```

---

## 10. Testing and Validation

### 10.1 Accounting Test Suite

```java
package com.unisoft.ulms.fineract.accounting;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AccountingIntegrationTest {
    
    @Test
    void testDisbursementJournalEntry() {
        // Test disbursement creates correct entries
    }
    
    @Test
    void testProvisionJournalEntry() {
        // Test provision adjustment entries
    }
    
    @Test
    void testInterestSuspenseEntry() {
        // Test interest suspension entries
    }
}
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [FIN]_Fineract_Extension_Development_Guide_v1.0.md | Extension development patterns |
| [FIN]_Fineract_Scheduler_Customization_v1.0.md | Scheduler customization |
| [BRPD]_BRPD_Service_Technical_Specification_v1.0.md | BRPD compliance service |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
