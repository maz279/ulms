---
type: reference
topic: Financial Arithmetic, Money Formatting & Accounting Verification Plan
target_audience: backend_lead, banking_auditor, core_engineer
version: 2026.01
---

# 06. Technical Remediation Plan: High-Precision Currency Arithmetic & GL Ledger Verification

**Document ID:** ULMS-REM-2026-06  
**Classification:** BANKING ARITHMETIC & CORE ACCOUNTING SPECIFICATION  
**Target Subsystems:** `com.uslbd.ulms.integration` & `com.uslbd.ulms.compliance`  

---

## 1. Executive Summary & Defect Remediation Scope

The forensic audit verified that ULMS uses **integer minor units (`long` amountMinor)** for persistent database storage, which is the enterprise banking gold standard. However, **27 instances of binary floating-point division (`/ 100.0`)** were detected during JSON payload construction for external bank gateways (Fineract, Finacle, bKash).

In banking interfaces, binary floating-point representation can cause IEEE 754 precision leakage (e.g. converting `1234567` paisa to `12345.670000000002` BDT), which can cause schema validation errors or checksum rejections at core banking gateways.

---

## 2. Standardized Money Conversion Engine (`MoneyUtil.java`)

To eliminate ad-hoc `/ 100.0` divisions, a centralized, immutable `MoneyUtil` utility **MUST** be deployed to `com.uslbd.ulms.platform.money`:

```java
package com.uslbd.ulms.platform.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Enterprise Banking Money & Basis Point Conversion Utility.
 * Guarantees zero IEEE 754 floating-point precision loss.
 */
public final class MoneyUtil {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private MoneyUtil() {}

    /**
     * Converts integer Paisa minor units to major BDT units formatted to exactly 2 decimal places.
     * Example: 1500075L -> "15000.75"
     */
    public static String toMajorString(long amountMinor) {
        return BigDecimal.valueOf(amountMinor)
                .divide(HUNDRED, 2, RoundingMode.UNNECESSARY)
                .toPlainString();
    }

    /**
     * Converts integer Paisa minor units to an exact BigDecimal with scale 2.
     */
    public static BigDecimal toMajorBigDecimal(long amountMinor) {
        return BigDecimal.valueOf(amountMinor).divide(HUNDRED, 2, RoundingMode.UNNECESSARY);
    }

    /**
     * Converts basis points to a percentage string formatted to 2 decimal places.
     * Example: 1199 (11.99%) -> "11.99"
     */
    public static String basisPointsToPercentString(int basisPoints) {
        return BigDecimal.valueOf(basisPoints)
                .divide(HUNDRED, 2, RoundingMode.UNNECESSARY)
                .toPlainString();
    }
}
```

---

## 3. Targeted Refactoring of External Adapters

### A. Finacle CBS Adapter Refactoring:
* **File:** [`apps/api/src/main/java/com/uslbd/ulms/integration/fineract/FinacleCbsAdapter.java`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/api/src/main/java/com/uslbd/ulms/integration/fineract/FinacleCbsAdapter.java)
* **Code Modification:**
  ```diff
  - Map.of("limitKey", limitKey, "amount", amountMinor / 100.0, "currency", "BDT", "customer", cifNo)
  + Map.of("limitKey", limitKey, "amount", MoneyUtil.toMajorBigDecimal(amountMinor), "currency", "BDT", "customer", cifNo)

  - Map.of("account", debitAccount, "type", "D", "amount", amountMinor / 100.0),
  - Map.of("account", creditAccount, "type", "C", "amount", amountMinor / 100.0)
  + Map.of("account", debitAccount, "type", "D", "amount", MoneyUtil.toMajorBigDecimal(amountMinor)),
  + Map.of("account", creditAccount, "type", "C", "amount", MoneyUtil.toMajorBigDecimal(amountMinor))
  ```

### B. bKash Payment Rail Adapter Refactoring:
* **File:** [`apps/api/src/main/java/com/uslbd/ulms/integration/rails/BkashRailAdapter.java`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/api/src/main/java/com/uslbd/ulms/integration/rails/BkashRailAdapter.java)
* **Code Modification:**
  ```diff
  - "amount", String.valueOf(amountMinor / 100.0),
  + "amount", MoneyUtil.toMajorString(amountMinor),
  ```

---

## 4. Automated Double-Entry Balancing & BRPD 15/2024 Test Suite

An automated JUnit test **MUST** be deployed to verify that no unbalanced journal vouchers can ever be submitted:

```java
@Test
void verifyJournalVoucherBalancingInvariant() {
    long minor = 12_500_000_00L; // BDT 12.5M
    var voucher = provisionJvService.createVoucher(minor, "BRPD-2026-Q3");
    
    BigDecimal totalDebits = voucher.getDebits().stream()
        .map(VoucherLine::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
        
    BigDecimal totalCredits = voucher.getCredits().stream()
        .map(VoucherLine::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
        
    assertEquals(0, totalDebits.compareTo(totalCredits), "Double-entry violation: Debits must equal Credits");
}
```
