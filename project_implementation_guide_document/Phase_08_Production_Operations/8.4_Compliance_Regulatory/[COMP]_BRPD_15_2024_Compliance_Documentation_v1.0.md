# BRPD 15/2024 Compliance Documentation

## ULMS v2.0 - Loan Classification Compliance

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-COMP-BRPD-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Confidential - Regulatory |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Compliance Officer |
| Approver | CEO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Compliance Team | Initial draft | - |
| 0.5 | 2026-01-20 | Risk Team | Added provisions | - |
| 0.9 | 2026-01-28 | Legal | Regulatory review | - |
| 1.0 | 2026-02-05 | Compliance Officer | Final release | CEO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Regulatory Overview](#2-regulatory-overview)
3. [Loan Classification Framework](#3-loan-classification-framework)
4. [Provisioning Requirements](#4-provisioning-requirements)
5. [System Implementation](#5-system-implementation)
6. [Reporting Requirements](#6-reporting-requirements)
7. [Audit Trail](#7-audit-trail)
8. [Compliance Monitoring](#8-compliance-monitoring)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document details ULMS v2.0 compliance with Bangladesh Bank BRPD Circular No. 15/2024 regarding loan classification and provisioning.

### 1.2 Scope
- 7-stage loan classification system
- Automated classification rules
- Provisioning calculations
- Regulatory reporting
- Audit trail requirements

### 1.3 Regulatory Reference
- BRPD Circular No. 15/2024 (7-Stage Loan Classification)
- BRPD Circular No. 14/2022 (BASEL III Implementation)
- Bangladesh Bank Order, 1972 (Sections related to loan management)

---

## 2. Regulatory Overview

### 2.1 BRPD 15/2024 Key Requirements

| Requirement | Description | ULMS Implementation |
|-------------|-------------|---------------------|
| 7-Stage Classification | STD-0 to Bad/Loss categories | Automated classification engine |
| DPD-Based Rules | Days Past Due calculation | Real-time DPD tracking |
| Provisioning | Percentage-based reserves | Automated provisioning calc |
| Quarterly Review | Regular classification review | Scheduled classification jobs |
| Board Reporting | Monthly board reports | Automated report generation |

### 2.2 Compliance Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| Classification Accuracy | 100% | Audit comparison |
| DPD Calculation | Real-time | System timestamp |
| Provision Accuracy | 100% | GL reconciliation |
| Report Timeliness | On schedule | Submission date |
| Audit Trail | Complete | Log completeness |

---

## 3. Loan Classification Framework

### 3.1 7-Stage Classification System

| Stage | Classification | DPD Range | Days in Period | ULMS Code |
|-------|---------------|-----------|----------------|-----------|
| STD-0 | Standard (Current) | 0 | 1-30 | STD_0 |
| STD-1 | Standard (Watch) | 1-30 | 31-60 | STD_1 |
| STD-2 | Standard (Caution) | 31-60 | 61-90 | STD_2 |
| SMA | Special Mention Account | 61-90 | 91-180 | SMA |
| SS | Substandard | 91-180 | 181-365 | SS |
| DF | Doubtful | 181-365 | 366+ | DF |
| BL | Bad/Loss | >365 | - | BL |

### 3.2 Classification Rules Engine

```java
@Service
public class LoanClassificationService {
    
    public LoanClassification classifyLoan(LoanAccount loan) {
        long daysPastDue = calculateDaysPastDue(loan);
        
        if (daysPastDue == 0) {
            return LoanClassification.STD_0;
        } else if (daysPastDue <= 30) {
            return LoanClassification.STD_1;
        } else if (daysPastDue <= 60) {
            return LoanClassification.STD_2;
        } else if (daysPastDue <= 90) {
            return LoanClassification.SMA;
        } else if (daysPastDue <= 180) {
            return LoanClassification.SS;
        } else if (daysPastDue <= 365) {
            return LoanClassification.DF;
        } else {
            return LoanClassification.BL;
        }
    }
    
    private long calculateDaysPastDue(LoanAccount loan) {
        LocalDate dueDate = loan.getNextDueDate();
        LocalDate today = LocalDate.now();
        
        if (today.isBefore(dueDate) || today.isEqual(dueDate)) {
            return 0;
        }
        
        return ChronoUnit.DAYS.between(dueDate, today);
    }
}
```

### 3.3 Special Classification Rules

| Scenario | Rule | Implementation |
|----------|------|----------------|
| Rescheduled Loan | Classify based on rescheduled terms | Reschedule flag + new DPD calc |
| Restructured Loan | Special provisioning | Restructure workflow |
| Legal Proceedings | Minimum Substandard | Legal status flag |
| Write-off Recommendation | Bad/Loss | Board approval workflow |

---

## 4. Provisioning Requirements

### 4.1 General Provisioning Rates

| Classification | General Provision | Specific Provision | Total |
|----------------|-------------------|-------------------|-------|
| STD-0 | 1% | - | 1% |
| STD-1 | 1% | - | 1% |
| STD-2 | 1% | - | 1% |
| SMA | 1% | 5% | 6% |
| SS | 1% | 20% | 21% |
| DF | 1% | 50% | 51% |
| BL | 1% | 100% | 101% |

### 4.2 Provisioning Calculation

```java
@Service
public class ProvisionCalculationService {
    
    private static final Map<LoanClassification, BigDecimal> SPECIFIC_PROVISION_RATES = Map.of(
        LoanClassification.STD_0, BigDecimal.ZERO,
        LoanClassification.STD_1, BigDecimal.ZERO,
        LoanClassification.STD_2, BigDecimal.ZERO,
        LoanClassification.SMA, new BigDecimal("0.05"),
        LoanClassification.SS, new BigDecimal("0.20"),
        LoanClassification.DF, new BigDecimal("0.50"),
        LoanClassification.BL, BigDecimal.ONE
    );
    
    private static final BigDecimal GENERAL_PROVISION_RATE = new BigDecimal("0.01");
    
    public ProvisionCalculation calculateProvision(LoanAccount loan) {
        BigDecimal outstandingBalance = loan.getOutstandingBalance();
        LoanClassification classification = loan.getClassification();
        
        BigDecimal generalProvision = outstandingBalance.multiply(GENERAL_PROVISION_RATE);
        BigDecimal specificProvisionRate = SPECIFIC_PROVISION_RATES.get(classification);
        BigDecimal specificProvision = outstandingBalance.multiply(specificProvisionRate);
        
        return ProvisionCalculation.builder()
            .loanId(loan.getId())
            .classification(classification)
            .outstandingBalance(outstandingBalance)
            .generalProvision(generalProvision)
            .specificProvision(specificProvision)
            .totalProvision(generalProvision.add(specificProvision))
            .calculationDate(LocalDate.now())
            .build();
    }
}
```

### 4.3 Provisioning Journal Entries

| Classification | Debit | Credit |
|----------------|-------|--------|
| General Provision | Provision Expense | General Provision Account |
| Specific Provision | Specific Provision Expense | Specific Provision Account |
| Write-off | Specific Provision | Loan Account |

---

## 5. System Implementation

### 5.1 Database Schema

```sql
-- Loan Classification Table
CREATE TABLE loan_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_account_id UUID NOT NULL REFERENCES loan_accounts(id),
    classification VARCHAR(10) NOT NULL CHECK (classification IN ('STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL')),
    days_past_due INTEGER NOT NULL,
    classified_by VARCHAR(50) NOT NULL, -- 'SYSTEM' or user_id
    classification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_date DATE NOT NULL,
    reason VARCHAR(255),
    previous_classification VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    CONSTRAINT valid_classification CHECK (classification IN ('STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL'))
);

-- Provision Calculation Table
CREATE TABLE provision_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_account_id UUID NOT NULL REFERENCES loan_accounts(id),
    classification VARCHAR(10) NOT NULL,
    outstanding_balance DECIMAL(19,2) NOT NULL,
    general_provision_rate DECIMAL(5,4) NOT NULL DEFAULT 0.01,
    general_provision_amount DECIMAL(19,2) NOT NULL,
    specific_provision_rate DECIMAL(5,4) NOT NULL,
    specific_provision_amount DECIMAL(19,2) NOT NULL,
    total_provision DECIMAL(19,2) NOT NULL,
    calculation_date DATE NOT NULL,
    reporting_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL
);

-- Classification History (Audit Trail)
CREATE TABLE classification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_account_id UUID NOT NULL,
    old_classification VARCHAR(10),
    new_classification VARCHAR(10) NOT NULL,
    old_dpd INTEGER,
    new_dpd INTEGER NOT NULL,
    change_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50) NOT NULL,
    reason VARCHAR(500),
    system_generated BOOLEAN DEFAULT FALSE
);
```

### 5.2 Classification Job Configuration

```yaml
# application.yml
loan:
  classification:
    auto-classify: true
    schedule: "0 0 2 * * ?"  # Daily at 2 AM
    batch-size: 1000
    
reporting:
  monthly:
    generation-day: 5  # Generate on 5th of each month
    submission-deadline: 10  # Submit by 10th
```

### 5.3 API Endpoints

| Endpoint | Method | Description | Authorization |
|----------|--------|-------------|---------------|
| /api/v1/classifications/{loanId} | GET | Get loan classification | ROLE_USER |
| /api/v1/classifications/bulk | POST | Bulk classify loans | ROLE_ADMIN |
| /api/v1/provisions/calculate | POST | Calculate provisions | ROLE_ACCOUNTANT |
| /api/v1/provisions/report | GET | Generate provision report | ROLE_REPORT_VIEWER |
| /api/v1/classifications/history/{loanId} | GET | Classification history | ROLE_AUDITOR |

---

## 6. Reporting Requirements

### 6.1 Monthly Classification Report

| Field | Description | Source |
|-------|-------------|--------|
| Reporting Month | YYYY-MM | System date |
| Total Loan Accounts | Count | loan_accounts table |
| STD-0 Amount | Outstanding balance | Classification view |
| STD-1 Amount | Outstanding balance | Classification view |
| STD-2 Amount | Outstanding balance | Classification view |
| SMA Amount | Outstanding balance | Classification view |
| SS Amount | Outstanding balance | Classification view |
| DF Amount | Outstanding balance | Classification view |
| BL Amount | Outstanding balance | Classification view |
| Total Provision Required | Sum of provisions | provision_calculations |

### 6.2 Report Generation Schedule

| Report | Frequency | Due Date | Recipient |
|--------|-----------|----------|-----------|
| Loan Classification Summary | Monthly | 5th | Management |
| Provision Summary | Monthly | 5th | Finance |
| NPL Ratio Report | Monthly | 5th | Board |
| Bangladesh Bank Returns | Monthly | 10th | Bangladesh Bank |
| Board Report | Monthly | 15th | Board of Directors |

### 6.3 Bangladesh Bank Returns

| Return Code | Description | Format |
|-------------|-------------|--------|
| SCH-BR-1 | Statement of Classified Loans | Excel/PDF |
| SCH-BR-2 | Provision Summary | Excel/PDF |
| SCH-BR-3 | NPL Movement | Excel/PDF |

---

## 7. Audit Trail

### 7.1 Audit Requirements

| Event | Data Captured | Retention |
|-------|---------------|-----------|
| Classification Change | Old/New class, DPD, timestamp, user | 7 years |
| Manual Override | Reason, approver, timestamp | 7 years |
| Provision Calculation | All input/output values | 7 years |
| Report Generation | Report type, timestamp, user | 7 years |

### 7.2 Audit Query Examples

```sql
-- Classification changes in reporting period
SELECT 
    h.loan_account_id,
    h.old_classification,
    h.new_classification,
    h.change_date,
    h.changed_by,
    h.reason
FROM classification_history h
WHERE h.change_date >= '2026-01-01'
AND h.change_date < '2026-02-01'
ORDER BY h.change_date DESC;

-- Manual classifications
SELECT 
    c.loan_account_id,
    c.classification,
    c.classified_by,
    c.classification_date,
    c.reason
FROM loan_classifications c
WHERE c.classified_by != 'SYSTEM'
AND c.classification_date >= CURRENT_DATE - INTERVAL '30 days';

-- Provision reconciliation
SELECT 
    reporting_month,
    SUM(total_provision) as total_provision,
    COUNT(*) as loan_count
FROM provision_calculations
WHERE reporting_month = '2026-01'
GROUP BY reporting_month;
```

---

## 8. Compliance Monitoring

### 8.1 Compliance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Classification Accuracy | 100% | Sample audit |
| DPD Accuracy | 100% | Repayment comparison |
| Report Timeliness | 100% | Submission date |
| Manual Override Rate | < 5% | Classification count |
| Audit Finding | 0 | Audit report |

### 8.2 Compliance Checklist

| Item | Frequency | Owner | Status |
|------|-----------|-------|--------|
| Classification rules review | Quarterly | Risk Team | ☐ |
| Provision rate verification | Quarterly | Finance | ☐ |
| Audit trail completeness | Monthly | Compliance | ☐ |
| Bangladesh Bank return accuracy | Monthly | Compliance | ☐ |
| User access review | Quarterly | Security | ☐ |

### 8.3 Exception Handling

| Exception | Action | Approval Required |
|-----------|--------|-------------------|
| Manual classification override | Document reason | Branch Manager |
| Backdated classification | Legal review | CRO |
| Write-off recommendation | Board resolution | Board |
| Reschedule classification | Risk assessment | Risk Committee |

---

## 9. Appendices

### Appendix A: BRPD 15/2024 Circular Summary

Key provisions of BRPD Circular No. 15/2024:
1. Implementation of 7-stage loan classification
2. DPD-based classification triggers
3. Revised provisioning requirements
4. Enhanced reporting obligations
5. Quarterly classification review requirement

### Appendix B: Classification Decision Tree

```
Start
  │
  ▼
Calculate DPD
  │
  ├─► DPD = 0 ──► STD-0
  │
  ├─► DPD 1-30 ──► STD-1
  │
  ├─► DPD 31-60 ──► STD-2
  │
  ├─► DPD 61-90 ──► SMA
  │
  ├─► DPD 91-180 ──► SS
  │
  ├─► DPD 181-365 ──► DF
  │
  └─► DPD > 365 ──► BL
```

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| IFRS-9 Implementation Document | ULMS-COMP-IFRS9-001 | 8.4_Compliance_Regulatory/ |
| Basel III Compliance Guide | ULMS-COMP-BASEL-001 | 8.4_Compliance_Regulatory/ |
| Loan Management Policy | ULMS-POL-LMP-001 | Policies/ |

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| DPD | Days Past Due |
| STD | Standard |
| SMA | Special Mention Account |
| SS | Substandard |
| DF | Doubtful |
| BL | Bad/Loss |
| NPL | Non-Performing Loan |
| Provision | Reserve for potential loan losses |

---

**Document Control Footer**

*Classification: Confidential - Regulatory*
*Next Review: Quarterly*
*Owner: Compliance Officer*

**END OF DOCUMENT**
