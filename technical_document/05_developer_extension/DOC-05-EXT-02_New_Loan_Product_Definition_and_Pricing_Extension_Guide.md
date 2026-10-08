---
type: how-to
topic: new_loan_product_definition_and_pricing_extension
target_audience: [credit_product_manager, backend_developer, business_analyst, systems_architect]
version: 2026.10
document_id: DOC-05-EXT-02
---

# DOC-05-EXT-02: New Loan Product Definition & Pricing Extension Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | New Loan Product Definition & Pricing Extension Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Product Engineering & Extension Guide |
| **Status** | Approved Master Extension Guide |
| **Authority Chain** | `LMS_CODEBASE/apps/api/src/main/java/com/uslbd/ulms/product/` → `LMS_CODEBASE/PLANNING/03_Backend_Module_Specifications.md` → `Bangladesh Bank BRPD & SMED Circulars` |
| **Target Codebase** | `c:\software_project\mim_project\LMS\LMS_CODEBASE` |

---

## 1. Credit Product Domain Architecture & Extension Philosophy

ULMS v2.0 implements a modular, metadata-driven loan product engine designed to support rapid innovation across conventional banking, SME development programs, and Islamic Shariah-compliant finance without requiring structural codebase refactoring.

```mermaid
flowchart TD
    subgraph Product_Engine ["ULMS Dynamic Product & Pricing Engine"]
        PC["1. Product Catalog Definition<br/>Code, Currency, Sector, Shariah Archetype"]
        PR["2. Dynamic Pricing & Interest Rules<br/>Day-Count, Fixed/Floating Spread, SMART Margin"]
        GR["3. Statutory Regulatory Constraints<br/>SMED 02/2024 SME Cap, BRPD DBR 50% Ceiling"]
        WF["4. Approval Ladder Workflow<br/>Delegated Authority Tiers & Credit Committee Matrix"]
        FIN["5. Fineract Core Banking Bridge<br/>GL Account Mapping & Amortization Engine"]
    end
    PC --> PR --> GR --> WF --> FIN
```

### Core Product Archetypes:
1. **Retail Consumer Lending:** Personal loans, auto loans, home mortgages (BRPD DBR $\le 50\%$ strict cap).
2. **SME & Cottage Finance:** Working capital, term loans, cluster refinancing (Bangladesh Bank SMED Circular 02/2024).
3. **Corporate Syndication:** Working capital limits, trade finance, revolving credit.
4. **Islamic Shariah Finance:** Bai-Murabaha (Cost-Plus), Bai-Muajjal (Deferred Payment), Ijara (Leasing), Diminishing Musharaka.

---

## 2. End-to-End Tutorial: Creating a New Islamic "Bai-Murabaha SME Working Capital" Product

Follow this 5-step tutorial to define, configure, register, and verify a new credit product in ULMS.

### Step 1: Database Seed Migration
Create migration `apps/api/src/main/resources/db/migration/V18__field_gateway.sql` (baseline migration preceding product seed):
```sql
-- Migration: V020__seed_murabaha_sme_product.sql
-- Purpose: Register Bai-Murabaha SME Working Capital product catalog entry

INSERT INTO ulms_app.loan_products (
    id,
    product_code,
    product_name,
    product_archetype,
    currency,
    min_principal_minor,
    max_principal_minor,
    min_tenor_months,
    max_tenor_months,
    interest_calculation_type,
    day_count_convention,
    statutory_dbr_cap_percentage,
    default_profit_rate,
    is_shariah_compliant,
    active
) VALUES (
    'PRD-ISL-MURABAHA-SME-001',
    'MURABAHA-SME',
    'Bai-Murabaha SME Working Capital',
    'ISLAMIC_MURABAHA',
    'BDT',
    10000000,       -- BDT 100,000 (in poisha)
    500000000,      -- BDT 5,000,000 (in poisha)
    6,              -- 6 months
    36,             -- 36 months
    'COST_PLUS_PROFIT_INSTALLMENT',
    'ACTUAL_365',
    50.00,
    9.50,
    TRUE,
    TRUE
) ON CONFLICT (product_code) DO NOTHING;
```

---

### Step 2: Implement Java Domain Pricing Strategy
Create the Shariah-compliant pricing calculator in `apps/api/src/main/java/com/uslbd/ulms/product/ProductService.java`:
```java
package com.uslbd.ulms.product.pricing;

import com.uslbd.ulms.assessment.MoneyMath;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Component("MURABAHA_PRICING_STRATEGY")
public class MurabahaPricingStrategy implements PricingStrategy {

    @Override
    public PricingCalculationResult calculate(BigDecimal goodsCostBDT, int tenorMonths, BigDecimal annualProfitRate) {
        // Shariah Cost-Plus Calculation:
        // Total Profit = Goods Cost * (Profit Rate / 100) * (Tenor Months / 12)
        BigDecimal tenorYears = BigDecimal.valueOf(tenorMonths).divide(BigDecimal.valueOf(12), 6, RoundingMode.HALF_UP);
        BigDecimal totalProfitBDT = goodsCostBDT
                .multiply(annualProfitRate.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
                .multiply(tenorYears)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalSellingPriceBDT = goodsCostBDT.add(totalProfitBDT);
        BigDecimal monthlyInstallmentBDT = totalSellingPriceBDT.divide(
                BigDecimal.valueOf(tenorMonths), 2, RoundingMode.HALF_UP
        );

        return new PricingCalculationResult(
                goodsCostBDT,
                totalProfitBDT,
                totalSellingPriceBDT,
                monthlyInstallmentBDT
        );
    }
}
```

---

### Step 3: Apache Fineract Loan Product Registration Bridge
Configure the upstream Fineract core banking product template via REST API:
```bash
curl -s -k -X POST https://localhost:8443/fineract-provider/api/v1/loanproducts \
  -H "Fineract-Platform-TenantId: default" \
  -H "Authorization: Basic bWlmb3M6cGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bai-Murabaha SME Working Capital",
    "shortName": "MUR-SME",
    "currencyCode": "BDT",
    "digitsAfterDecimal": 2,
    "inMultiplesOf": 1,
    "principal": 1000000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "interestRatePerPeriod": 9.5,
    "interestRateFrequencyType": 3,
    "annualInterestRate": 9.5,
    "amortizationType": 1,
    "interestType": 0,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "mifos-standard-strategy",
    "accountingRule": 2,
    "fundId": 1
  }'
```

---

### Step 4: React 19 Dynamic Wizard Parameter Binding
The staff frontend origination wizard dynamically pulls product parameters from `/api/v1/products`:
```tsx
// apps/web/src/modules/origination/ProductParameterBinder.tsx
export const MurabahaProductFields = ({ product, form }: ProductProps) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" color="primary">
        {product.productName} (Shariah Compliant)
      </Typography>
      <Alert severity="info" sx={{ my: 1 }}>
        Cost-Plus Profit Model: Declared Goods Purchase Price + Agreed Bank Profit Margin.
      </Alert>
      <TextField
        label="Goods Invoice / Cost Price (BDT)"
        fullWidth
        type="number"
        {...form.register('goodsCostPrice', { required: true })}
        helperText={`Allowed: BDT ${product.minPrincipal} to BDT ${product.maxPrincipal}`}
      />
    </Box>
  );
};
```

---

### Step 5: Automated Verification Test Oracle
Create a unit test validating statutory math in `apps/api/src/test/java/com/uslbd/ulms/ModularityTest.java`:
```java
@Test
void testMurabahaProfitAndInstallmentCalculation() {
    MurabahaPricingStrategy strategy = new MurabahaPricingStrategy();
    BigDecimal goodsCost = new BigDecimal("1200000.00"); // 12 Lac BDT
    int tenorMonths = 24; // 2 years
    BigDecimal profitRate = new BigDecimal("9.50"); // 9.5% p.a.

    var result = strategy.calculate(goodsCost, tenorMonths, profitRate);

    // Expected Profit = 1,200,000 * 0.095 * 2 = 228,000 BDT
    assertEquals(new BigDecimal("228000.00"), result.totalProfitBDT());
    // Total Sale Price = 1,428,000 BDT
    assertEquals(new BigDecimal("1428000.00"), result.totalSellingPriceBDT());
    // Monthly Installment = 1,428,000 / 24 = 59,500.00 BDT
    assertEquals(new BigDecimal("59500.00"), result.monthlyInstallmentBDT());
}
```

---

*— End of New Loan Product Definition & Pricing Extension Guide —*
