# IFRS-9 Implementation Document

## ULMS v2.0 - Expected Credit Loss (ECL) Implementation

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-COMP-IFRS9-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Confidential - Financial |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Chief Risk Officer |
| Approver | CEO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Risk Team | Initial draft | - |
| 0.5 | 2026-01-20 | Finance Team | Added calculations | - |
| 0.9 | 2026-01-28 | External Auditor | Audit review | - |
| 1.0 | 2026-02-05 | CRO | Final release | CEO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [IFRS-9 Overview](#2-ifrs-9-overview)
3. [ECL Methodology](#3-ecl-methodology)
4. [Stage Allocation](#4-stage-allocation)
5. [PD/LGD/EAD Models](#5-pdlgdead-models)
6. [System Implementation](#6-system-implementation)
7. [Reporting and Disclosure](#7-reporting-and-disclosure)
8. [Governance and Controls](#8-governance-and-controls)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document describes the implementation of IFRS 9 Financial Instruments Expected Credit Loss (ECL) calculation within ULMS v2.0, ensuring compliance with international accounting standards effective December 2027 for Bangladesh banks.

### 1.2 Scope
- Impairment calculation under IFRS 9
- Three-stage impairment model
- Probability of Default (PD) estimation
- Loss Given Default (LGD) estimation
- Exposure at Default (EAD) calculation
- Forward-looking scenarios
- Regulatory reporting

### 1.3 Implementation Timeline

| Phase | Activity | Target Date |
|-------|----------|-------------|
| 1 | Model development | Q1 2026 |
| 2 | System integration | Q2 2026 |
| 3 | Parallel run | Q3 2026 |
| 4 | Full implementation | Dec 2027 |

---

## 2. IFRS-9 Overview

### 2.1 Key Requirements

| Requirement | IFRS-9 Reference | ULMS Implementation |
|-------------|------------------|---------------------|
| Expected Credit Loss | 5.5 | ECL calculation engine |
| 12-month ECL | 5.5.5 | Stage 1 calculation |
| Lifetime ECL | 5.5.5 | Stage 2 & 3 calculation |
| Significant Increase in Credit Risk | 5.5.9 | SICR assessment |
| Forward-looking Information | 5.5.17 | Scenario modeling |

### 2.2 Three-Stage Model

| Stage | Description | ECL Calculation | Transfer Criteria |
|-------|-------------|-----------------|-------------------|
| 1 | Performing | 12-month ECL | Origination, not SICR |
| 2 | Under-performing | Lifetime ECL | SICR since origination |
| 3 | Non-performing | Lifetime ECL | Credit-impaired |

### 2.3 Comparison with BRPD 15/2024

| Aspect | BRPD 15/2024 | IFRS-9 | ULMS Approach |
|--------|--------------|--------|---------------|
| Trigger | DPD-based | SICR assessment | Both calculated |
| Provision | Fixed rates | Model-based | Parallel tracking |
| Forward-looking | Limited | Required | Macroeconomic factors |
| Reporting | Regulatory | Financial | Both reports generated |

---

## 3. ECL Methodology

### 3.1 ECL Formula

```
ECL = Σ (PDt × LGt × EADt × Discount Factor)

Where:
- PDt = Probability of Default in period t
- LGt = Loss Given Default in period t
- EADt = Exposure at Default in period t
- DF = Discount factor
```

### 3.2 Implementation in ULMS

```java
@Service
public class ECLCalculationService {
    
    public ECLCalculation calculateECL(LoanAccount loan, LocalDate calculationDate) {
        Stage stage = determineStage(loan);
        List<CashFlowProjection> cashFlows = projectCashFlows(loan, stage);
        
        BigDecimal ecl = BigDecimal.ZERO;
        
        for (CashFlowProjection cf : cashFlows) {
            BigDecimal pd = probabilityOfDefaultService.calculatePD(loan, cf.getPeriod());
            BigDecimal lgd = lossGivenDefaultService.calculateLGD(loan, cf.getPeriod());
            BigDecimal ead = exposureAtDefaultService.calculateEAD(loan, cf.getPeriod());
            BigDecimal discountFactor = calculateDiscountFactor(cf.getDate(), calculationDate);
            
            BigDecimal periodECL = pd.multiply(lgd).multiply(ead).multiply(discountFactor);
            ecl = ecl.add(periodECL);
        }
        
        return ECLCalculation.builder()
            .loanId(loan.getId())
            .stage(stage)
            .expectedCreditLoss(ecl)
            .calculationDate(calculationDate)
            .build();
    }
    
    private Stage determineStage(LoanAccount loan) {
        if (isCreditImpaired(loan)) {
            return Stage.STAGE_3;
        } else if (hasSignificantIncreaseInCreditRisk(loan)) {
            return Stage.STAGE_2;
        } else {
            return Stage.STAGE_1;
        }
    }
}
```

### 3.3 Scenario-Based Calculation

| Scenario | Weight | Description |
|----------|--------|-------------|
| Base Case | 50% | Most likely economic outlook |
| Upside | 25% | Favorable economic conditions |
| Downside | 25% | Adverse economic conditions |

```java
public BigDecimal calculateProbabilityWeightedECL(LoanAccount loan) {
    BigDecimal baseECL = calculateECL(loan, Scenario.BASE);
    BigDecimal upsideECL = calculateECL(loan, Scenario.UPSIDE);
    BigDecimal downsideECL = calculateECL(loan, Scenario.DOWNSIDE);
    
    return baseECL.multiply(new BigDecimal("0.50"))
        .add(upsideECL.multiply(new BigDecimal("0.25")))
        .add(downsideECL.multiply(new BigDecimal("0.25")));
}
```

---

## 4. Stage Allocation

### 4.1 Stage 1: 12-Month ECL

**Criteria:**
- Loan originated or purchased
- No significant increase in credit risk since origination
- Not credit-impaired

**Calculation:**
- 12-month probability of default
- Lifetime EAD and LGD

### 4.2 Stage 2: Lifetime ECL

**Criteria:**
- Significant increase in credit risk (SICR) since origination
- Not credit-impaired

**SICR Indicators:**

| Quantitative | Threshold |
|--------------|-----------|
| PD increase | > 100 basis points |
| DPD change | Moved to STD-2 or worse |
| Credit rating downgrade | 2+ notches |

| Qualitative | Assessment |
|-------------|------------|
| Forbearance | Restructuring granted |
| Watchlist | Internal monitoring |
| Early warning | Adverse financial trends |

### 4.3 Stage 3: Credit-Impaired

**Criteria:**
- Objective evidence of impairment
- Default event occurred

**Indicators:**
- 90+ days past due (DPD >= 90)
- BRPD classification SMA, SS, DF, or BL
- Legal proceedings initiated
- Bankruptcy or restructuring

### 4.4 Stage Transfer Matrix

```
                    ┌─────────────────────────────────────┐
                    │         STAGE DETERMINATION         │
                    └─────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
        ┌─────────┐          ┌─────────┐          ┌─────────┐
        │ STAGE 1 │          │ STAGE 2 │          │ STAGE 3 │
        │ 12-mo   │          │Lifetime │          │Lifetime │
        │  ECL    │          │  ECL    │          │  ECL    │
        └────┬────┘          └────┬────┘          └────┬────┘
             │                    │                    │
             │ SICR detected      │ SICR confirmed     │ Credit
             │ (but not default)  │                    │ impaired
             │                    │                    │
             └────────────────────►                    │
                                  │                    │
                                  │ Recovery           │ Recovery
                                  │ (no longer SICR)   │ (cure)
                                  │                    │
                                  └────────────────────►
                                                       │
                                                       │ Cure not
                                                       │ possible
                                                       ▼
                                                  Write-off
```

---

## 5. PD/LGD/EAD Models

### 5.1 Probability of Default (PD)

**Model Type:** Logistic regression with macroeconomic factors

```java
@Service
public class ProbabilityOfDefaultService {
    
    public BigDecimal calculatePD(LoanAccount loan, int period) {
        // Base PD from historical data
        double basePD = getHistoricalPD(loan.getProductType(), loan.getCustomerSegment());
        
        // Adjust for loan characteristics
        double loanAgeFactor = calculateLoanAgeFactor(loan.getMonthsSinceOrigination());
        double collateralFactor = calculateCollateralFactor(loan.getCollateralCoverage());
        
        // Macroeconomic adjustments
        double macroFactor = calculateMacroeconomicFactor(period);
        
        double adjustedPD = basePD * loanAgeFactor * collateralFactor * macroFactor;
        
        return BigDecimal.valueOf(Math.min(adjustedPD, 0.999));
    }
}
```

**PD Calibration:**

| Segment | 12-Month PD Range | Model Confidence |
|---------|-------------------|------------------|
| Corporate | 0.1% - 5.0% | High |
| SME | 1.0% - 10.0% | Medium |
| Retail | 0.5% - 8.0% | High |
| Microfinance | 2.0% - 15.0% | Medium |

### 5.2 Loss Given Default (LGD)

**Model Type:** Workout LGD with downturn adjustment

| Collateral Type | Base LGD | Downturn LGD |
|-----------------|----------|--------------|
| Real Estate | 20% | 35% |
| Equipment | 40% | 55% |
| Inventory | 50% | 65% |
| Receivables | 30% | 45% |
| Unsecured | 70% | 80% |

### 5.3 Exposure at Default (EAD)

**Calculation Method:**
- Amortizing loans: Outstanding balance
- Revolving facilities: Current balance + Undrawn amount × Credit Conversion Factor (CCF)

```java
public BigDecimal calculateEAD(LoanAccount loan, int period) {
    if (loan.getType() == LoanType.TERM_LOAN) {
        return loan.getOutstandingBalance();
    } else {
        // Revolving facility
        BigDecimal undrawn = loan.getApprovedLimit().subtract(loan.getCurrentBalance());
        BigDecimal ccf = getCreditConversionFactor(loan);
        return loan.getCurrentBalance().add(undrawn.multiply(ccf));
    }
}
```

---

## 6. System Implementation

### 6.1 Database Schema

```sql
-- ECL Calculation Results
CREATE TABLE ecl_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_account_id UUID NOT NULL REFERENCES loan_accounts(id),
    calculation_date DATE NOT NULL,
    reporting_date DATE NOT NULL,
    stage INTEGER NOT NULL CHECK (stage IN (1, 2, 3)),
    
    -- ECL Components
    probability_of_default_12m DECIMAL(10,6),
    probability_of_default_lifetime DECIMAL(10,6),
    loss_given_default DECIMAL(5,4) NOT NULL,
    exposure_at_default DECIMAL(19,2) NOT NULL,
    
    -- ECL Results
    twelve_month_ecl DECIMAL(19,2),
    lifetime_ecl DECIMAL(19,2),
    final_ecl DECIMAL(19,2) NOT NULL,
    
    -- Scenario Analysis
    base_case_ecl DECIMAL(19,2),
    upside_ecl DECIMAL(19,2),
    downside_ecl DECIMAL(19,2),
    
    -- Stage Transfer Information
    previous_stage INTEGER,
    stage_transfer_date DATE,
    sicr_indicator VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL
);

-- Macroeconomic Scenarios
CREATE TABLE macroeconomic_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_name VARCHAR(50) NOT NULL,
    scenario_date DATE NOT NULL,
    gdp_growth_rate DECIMAL(5,2),
    inflation_rate DECIMAL(5,2),
    unemployment_rate DECIMAL(5,2),
    interest_rate DECIMAL(5,2),
    weight DECIMAL(3,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- PD Master Data
CREATE TABLE pd_master_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment VARCHAR(50) NOT NULL,
    rating_grade VARCHAR(10) NOT NULL,
    months_on_book INTEGER NOT NULL,
    pd_12m DECIMAL(10,6) NOT NULL,
    pd_lifetime DECIMAL(10,6) NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE
);
```

### 6.2 ECL Batch Job

```java
@Component
public class ECLBatchJob {
    
    @Scheduled(cron = "0 0 3 1 * ?") // 1st of month at 3 AM
    public void executeMonthlyECLCalculation() {
        LocalDate calculationDate = LocalDate.now();
        List<LoanAccount> activeLoans = loanAccountRepository.findActiveLoans();
        
        for (List<LoanAccount> batch : Lists.partition(activeLoans, 1000)) {
            List<ECLCalculation> calculations = batch.parallelStream()
                .map(loan -> eclCalculationService.calculateECL(loan, calculationDate))
                .collect(Collectors.toList());
            
            eclCalculationRepository.saveAll(calculations);
        }
        
        // Generate reports
        reportGenerationService.generateIFRS9Reports(calculationDate);
    }
}
```

### 6.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/v1/ecl/calculate/{loanId} | POST | Calculate ECL for specific loan |
| /api/v1/ecl/batch | POST | Run batch ECL calculation |
| /api/v1/ecl/report | GET | Generate IFRS-9 reports |
| /api/v1/ecl/stage-transfers | GET | Get stage transfer report |

---

## 7. Reporting and Disclosure

### 7.1 IFRS-7 Disclosure Requirements

| Disclosure | ULMS Report | Frequency |
|------------|-------------|-----------|
| Credit risk management | Risk Report | Quarterly |
| ECL measurement | ECL Summary | Quarterly |
| Collateral and credit enhancements | Collateral Report | Quarterly |
| Credit quality | Portfolio Quality | Quarterly |
| Past due analysis | DPD Analysis | Monthly |
| Write-offs | Write-off Report | Monthly |

### 7.2 Internal Reports

| Report | Purpose | Audience |
|--------|---------|----------|
| ECL vs BRPD Provision Reconciliation | Gap analysis | Finance, Risk |
| Stage Movement Analysis | Portfolio trends | Risk, Management |
| SICR Backtesting | Model validation | Risk, Audit |
| Macroeconomic Sensitivity | Scenario impact | ALCO |

### 7.3 Report Schedule

| Report | Generation | Distribution |
|--------|------------|--------------|
| Monthly ECL | 3rd working day | Finance, Risk |
| Quarterly Disclosure | 15th of quarter end | Board, External |
| Annual Financial Statements | Post audit | Public disclosure |

---

## 8. Governance and Controls

### 8.1 Model Governance

| Role | Responsibility |
|------|----------------|
| Board | Ultimate oversight |
| Risk Committee | Model risk approval |
| CRO | Model development oversight |
| Model Risk Team | Validation and monitoring |
| Finance | Implementation and reporting |

### 8.2 Model Validation

| Validation Type | Frequency | Scope |
|-----------------|-----------|-------|
| Developmental | Pre-implementation | Model design, data quality |
| Ongoing | Annual | Performance monitoring |
| Periodic | 3 years | Full model rebuild |
| Ad-hoc | As needed | Triggered by events |

### 8.3 Key Controls

| Control | Description | Frequency |
|---------|-------------|-----------|
| Data Quality Check | Validate input data | Daily |
| Calculation Reconciliation | ECL vs manual check | Monthly |
| Stage Transfer Review | Analyze movements | Monthly |
| Model Performance | Backtesting | Quarterly |
| Documentation Review | Policy compliance | Annual |

### 8.4 Audit Trail

All ECL calculations must maintain:
- Input data snapshots
- Model parameters used
- Calculation methodology
- Assumptions and overrides
- Approver identification

---

## 9. Appendices

### Appendix A: IFRS-9 Transition Approach

| Step | Activity | Timeline |
|------|----------|----------|
| 1 | Data collection | Q1 2026 |
| 2 | Model development | Q1-Q2 2026 |
| 3 | System build | Q2 2026 |
| 4 | Parallel run | Q3-Q4 2026 |
| 5 | External validation | Q4 2026 |
| 6 | Go-live | Dec 2027 |

### Appendix B: Glossary

| Term | Definition |
|------|------------|
| ECL | Expected Credit Loss |
| PD | Probability of Default |
| LGD | Loss Given Default |
| EAD | Exposure at Default |
| SICR | Significant Increase in Credit Risk |
| CC | Credit Conversion Factor |

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| BRPD 15/2024 Compliance | ULMS-COMP-BRPD-001 | 8.4_Compliance_Regulatory/ |
| Model Risk Policy | ULMS-RISK-MRP-001 | Risk/ |
| ECL Model Documentation | ULMS-RISK-EMD-001 | Risk/ |

---

**Document Control Footer**

*Classification: Confidential - Financial*
*Next Review: Quarterly*
*Owner: Chief Risk Officer*

**END OF DOCUMENT**
