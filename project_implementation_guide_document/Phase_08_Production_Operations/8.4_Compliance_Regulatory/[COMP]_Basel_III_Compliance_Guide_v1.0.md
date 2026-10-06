# Basel III Compliance Guide

## ULMS v2.0 - Capital Adequacy and Risk Management

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-COMP-BASEL-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Confidential - Regulatory |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Chief Risk Officer |
| Approver | CEO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Risk Team | Initial draft | - |
| 0.5 | 2026-01-20 | Compliance | Added reporting | - |
| 0.9 | 2026-01-28 | External Review | Regulatory check | - |
| 1.0 | 2026-02-05 | CRO | Final release | CEO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Basel III Overview](#2-basel-iii-overview)
3. [Risk-Weighted Assets (RWA)](#3-risk-weighted-assets-rwa)
4. [Credit Risk](#4-credit-risk)
5. [Operational Risk](#5-operational-risk)
6. [Capital Requirements](#6-capital-requirements)
7. [Reporting Requirements](#7-reporting-requirements)
8. [System Implementation](#8-system-implementation)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document outlines ULMS v2.0 implementation of Basel III requirements for capital adequacy, risk-weighted assets calculation, and regulatory reporting for Bangladesh banks.

### 1.2 Regulatory Framework
- BASEL III Guidelines (Bangladesh Bank)
- BRPD Circular No. 14/2022
- Bangladesh Bank Capital Adequacy Guidelines

### 1.3 Scope
- Credit risk RWA calculation
- Operational risk capital
- Capital ratio monitoring
- Regulatory reporting (Returns)
- Leverage ratio support

---

## 2. Basel III Overview

### 2.1 Capital Requirements

| Ratio | Minimum | Conservation Buffer | Total Requirement |
|-------|---------|---------------------|-------------------|
| CET1 | 4.5% | 2.5% | 7.0% |
| Tier 1 | 6.0% | 2.5% | 8.5% |
| Total Capital | 8.0% | 2.5% | 10.5% |
| Counter-cyclical | - | 0-2.5% | Variable |

### 2.2 Leverage Ratio

| Component | Requirement |
|-----------|-------------|
| Minimum Leverage Ratio | 3.0% |
| Calculation | Tier 1 Capital / Total Exposure |

### 2.3 Liquidity Coverage Ratio (LCR)

| Component | Requirement |
|-----------|-------------|
| Minimum LCR | 100% |
| High Quality Liquid Assets / Net Cash Outflows |

---

## 3. Risk-Weighted Assets (RWA)

### 3.1 Standardized Approach

ULMS implements the Standardized Approach for credit risk RWA calculation.

### 3.2 Risk Weights by Asset Class

| Asset Category | Risk Weight | ULMS Mapping |
|----------------|-------------|--------------|
| Cash | 0% | Cash accounts |
| Bangladesh Govt Securities | 0% | Treasury bills/bonds |
| BB Claims | 0% | CRR/SLR balances |
| Bank Claims (AAA to AA-) | 20% | Interbank deposits |
| Corporate (AAA to AA-) | 20% | Corporate loans |
| Corporate (A+ to A-) | 50% | Corporate loans |
| Corporate (BBB+ to BBB-) | 100% | Corporate loans |
| Corporate (BB+ to B-) | 150% | Corporate loans |
| Retail - Mortgages | 35% | Home loans |
| Retail - Other | 75% | Personal loans |
| Past Due (< 90 days) | 100% + 20-150% | STD-1, STD-2, SMA |
| NPLs (Substandard) | 150% | SS category |
| NPLs (Doubtful) | 200% | DF category |
| NPLs (Loss) | 250% | BL category |

### 3.3 RWA Calculation Formula

```java
@Service
public class RWACalculationService {
    
    public BigDecimal calculateRWA(LoanAccount loan) {
        BigDecimal exposure = loan.getExposureAmount();
        BigDecimal riskWeight = getRiskWeight(loan);
        BigDecimal creditRiskMitigation = calculateCRM(loan);
        
        // RWA = Exposure × Risk Weight × (1 - CRM)
        return exposure.multiply(riskWeight)
            .multiply(BigDecimal.ONE.subtract(creditRiskMitigation));
    }
    
    private BigDecimal getRiskWeight(LoanAccount loan) {
        // Get base risk weight based on asset class
        BigDecimal baseWeight = riskWeightRepository
            .findByAssetClass(loan.getAssetClass());
        
        // Adjust for credit rating if available
        if (loan.getExternalRating() != null) {
            baseWeight = adjustForRating(baseWeight, loan.getExternalRating());
        }
        
        // Adjust for loan classification
        baseWeight = adjustForClassification(baseWeight, loan.getClassification());
        
        return baseWeight;
    }
    
    private BigDecimal adjustForClassification(BigDecimal baseWeight, 
                                                LoanClassification classification) {
        switch (classification) {
            case SS:
                return new BigDecimal("1.50"); // 150%
            case DF:
                return new BigDecimal("2.00"); // 200%
            case BL:
                return new BigDecimal("2.50"); // 250%
            default:
                return baseWeight;
        }
    }
}
```

---

## 4. Credit Risk

### 4.1 Credit Risk Mitigation (CRM)

| Mitigation Type | Recognition | Haircut |
|-----------------|-------------|---------|
| Financial Collateral | Cash, Gold, Gov Securities | 0-20% |
| Real Estate Collateral | Commercial/Residential | 20-50% |
| Guarantee | Bank/Corporate | As per guarantor rating |
| Credit Derivatives | CDS, Guarantees | As per counterparty |

### 4.2 Off-Balance Sheet Items

| Item | CCF | ULMS Treatment |
|------|-----|----------------|
| Direct Credit Substitutes | 100% | Guarantees, Standby LCs |
| Transaction-related | 50% | Performance bonds |
| Short-term SELF-liquidating | 20% | Trade-related |
| Commitments < 1 year | 20% | Undrawn credit lines |
| Commitments > 1 year | 50% | Undrawn credit lines |

### 4.3 Large Exposure Management

| Limit | Threshold | ULMS Check |
|-------|-----------|------------|
| Single Borrower | 15% of capital | Automated check |
| Borrower Group | 25% of capital | Automated check |
| Sector Concentration | Bank-specific | Monitoring report |

---

## 5. Operational Risk

### 5.1 Basic Indicator Approach (BIA)

ULMS supports the Basic Indicator Approach for operational risk capital calculation:

```
Capital Charge = α × GI

Where:
- α = 15% (fixed by Basel)
- GI = Average annual gross income over previous 3 years
```

### 5.2 Operational Loss Data

| Data Element | ULMS Field | Purpose |
|--------------|------------|---------|
| Loss Amount | loss_amount | Capital calculation |
| Loss Date | loss_date | Trend analysis |
| Loss Type | loss_category | Risk profiling |
| Recovery Amount | recovery_amount | Net loss calc |
| Event Description | description | RCA |

### 5.3 Key Risk Indicators (KRIs)

| KRI | Threshold | Monitoring |
|-----|-----------|------------|
| System Downtime | < 4 hours/month | Automated |
| Failed Transactions | < 0.1% | Real-time |
| User Errors | Trend analysis | Weekly |
| Audit Findings | < 5 critical | Quarterly |

---

## 6. Capital Requirements

### 6.1 Capital Calculation

```java
@Service
public class CapitalAdequacyService {
    
    public CapitalAdequacyRatio calculateRatios(BankData data) {
        // Calculate RWA components
        BigDecimal creditRiskRWA = calculateCreditRiskRWA(data);
        BigDecimal operationalRiskRWA = calculateOperationalRiskRWA(data);
        BigDecimal marketRiskRWA = calculateMarketRiskRWA(data);
        
        BigDecimal totalRWA = creditRiskRWA
            .add(operationalRiskRWA)
            .add(marketRiskRWA);
        
        // Calculate ratios
        BigDecimal cet1Ratio = data.getCET1Capital()
            .divide(totalRWA, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
        
        BigDecimal tier1Ratio = data.getTier1Capital()
            .divide(totalRWA, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
        
        BigDecimal totalCapitalRatio = data.getTotalCapital()
            .divide(totalRWA, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
        
        return CapitalAdequacyRatio.builder()
            .cet1Ratio(cet1Ratio)
            .tier1Ratio(tier1Ratio)
            .totalCapitalRatio(totalCapitalRatio)
            .totalRWA(totalRWA)
            .calculationDate(LocalDate.now())
            .build();
    }
}
```

### 6.2 Capital Buffers

| Buffer | Rate | Application |
|--------|------|-------------|
| Capital Conservation | 2.5% | All banks |
| Counter-cyclical | 0-2.5% | As notified by BB |
| D-SIB | 1-3.5% | Domestic Systemically Important Banks |

### 6.3 Leverage Ratio Calculation

```java
public BigDecimal calculateLeverageRatio(BankData data) {
    BigDecimal tier1Capital = data.getTier1Capital();
    BigDecimal totalExposure = data.getTotalExposure();
    
    return tier1Capital.divide(totalExposure, 4, RoundingMode.HALF_UP)
        .multiply(new BigDecimal("100"));
}
```

---

## 7. Reporting Requirements

### 7.1 Bangladesh Bank Returns

| Return Code | Description | Frequency | Due Date |
|-------------|-------------|-----------|----------|
| SCH-BR-1 | Capital Adequacy Return | Quarterly | 15th of following month |
| SCH-BR-2 | Large Exposures | Quarterly | 15th of following month |
| SCH-BR-3 | Credit Concentration | Quarterly | 15th of following month |
| SCH-BR-4 | Asset Classification | Monthly | 10th of following month |
| SCH-BR-5 | Operational Risk | Quarterly | 15th of following month |
| SCH-BR-6 | Leverage Ratio | Quarterly | 15th of following month |

### 7.2 Internal Reports

| Report | Frequency | Audience |
|--------|-----------|----------|
| Capital Adequacy Dashboard | Daily | ALCO |
| RWA Analysis | Weekly | Risk Management |
| Capital Forecast | Monthly | CFO |
| Stress Testing Results | Quarterly | Board |

---

## 8. System Implementation

### 8.1 Database Schema

```sql
-- RWA Calculations
CREATE TABLE rwa_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_date DATE NOT NULL,
    reporting_period VARCHAR(7) NOT NULL, -- YYYY-MM
    
    -- Asset breakdown
    asset_class VARCHAR(50) NOT NULL,
    exposure_amount DECIMAL(19,2) NOT NULL,
    risk_weight DECIMAL(5,4) NOT NULL,
    rwa_amount DECIMAL(19,2) NOT NULL,
    
    -- CRM adjustments
    collateral_amount DECIMAL(19,2),
    guarantee_amount DECIMAL(19,2),
    net_exposure DECIMAL(19,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capital Adequacy Summary
CREATE TABLE capital_adequacy_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_date DATE NOT NULL,
    
    -- Capital Components
    cet1_capital DECIMAL(19,2) NOT NULL,
    additional_tier1 DECIMAL(19,2),
    tier2_capital DECIMAL(19,2),
    total_capital DECIMAL(19,2) NOT NULL,
    
    -- RWA Components
    credit_risk_rwa DECIMAL(19,2) NOT NULL,
    operational_risk_rwa DECIMAL(19,2),
    market_risk_rwa DECIMAL(19,2),
    total_rwa DECIMAL(19,2) NOT NULL,
    
    -- Ratios
    cet1_ratio DECIMAL(5,2) NOT NULL,
    tier1_ratio DECIMAL(5,2) NOT NULL,
    total_capital_ratio DECIMAL(5,2) NOT NULL,
    leverage_ratio DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Large Exposures
CREATE TABLE large_exposures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_date DATE NOT NULL,
    borrower_id VARCHAR(50) NOT NULL,
    borrower_name VARCHAR(200) NOT NULL,
    exposure_amount DECIMAL(19,2) NOT NULL,
    capital_base DECIMAL(19,2) NOT NULL,
    exposure_percentage DECIMAL(5,2) NOT NULL,
    limit_percentage DECIMAL(5,2) NOT NULL,
    breach_flag BOOLEAN DEFAULT FALSE
);
```

### 8.2 Regulatory Reporting API

```java
@RestController
@RequestMapping("/api/v1/regulatory")
public class RegulatoryReportingController {
    
    @GetMapping("/capital-adequacy")
    public CapitalAdequacyReport getCapitalAdequacy(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportingDate) {
        return capitalAdequacyService.generateReport(reportingDate);
    }
    
    @GetMapping("/large-exposures")
    public List<LargeExposure> getLargeExposures(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportingDate) {
        return largeExposureService.getLargeExposures(reportingDate);
    }
    
    @GetMapping("/rwa-breakdown")
    public RWABreakdown getRWABreakdown(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportingDate) {
        return rwaService.getBreakdown(reportingDate);
    }
}
```

---

## 9. Appendices

### Appendix A: Risk Weight Matrix

| External Rating | Sovereign | Banks | Corporates |
|-----------------|-----------|-------|------------|
| AAA to AA- | 0% | 20% | 20% |
| A+ to A- | 20% | 50% | 50% |
| BBB+ to BBB- | 50% | 100% | 100% |
| BB+ to B- | 100% | 100% | 150% |
| Below B- | 150% | 150% | 150% |
| Unrated | 100% | 100% | 100% |

### Appendix B: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| BRPD 15/2024 Compliance | ULMS-COMP-BRPD-001 | 8.4_Compliance_Regulatory/ |
| IFRS-9 Implementation | ULMS-COMP-IFRS9-001 | 8.4_Compliance_Regulatory/ |
| Risk Management Framework | ULMS-RISK-RMF-001 | Risk/ |

### Appendix C: Glossary

| Term | Definition |
|------|------------|
| CET1 | Common Equity Tier 1 |
| RWA | Risk-Weighted Assets |
| CRM | Credit Risk Mitigation |
| CCF | Credit Conversion Factor |
| LCR | Liquidity Coverage Ratio |
| CAR | Capital Adequacy Ratio |

---

**Document Control Footer**

*Classification: Confidential - Regulatory*
*Next Review: Quarterly*
*Owner: Chief Risk Officer*

**END OF DOCUMENT**
