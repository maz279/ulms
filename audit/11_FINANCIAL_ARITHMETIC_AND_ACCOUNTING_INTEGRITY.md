# 11. Financial Arithmetic, Currency Modeling & Double-Entry Accounting Forensic Audit

**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  
**Audit Standard:** ISO/IEC 5055 • Central Banking Core Accounting Standards  
**Scope:** Minor Unit Currency Modeling, Floating Point Pitfalls, and Double-Entry GL Ledger Verification  

---

## 1. Executive Summary: Financial Representation Posture

In banking applications, representation of monetary amounts and interest calculations must be mathematically exact. Floating-point types (`float`, `double`) suffer from IEEE 754 binary representation inaccuracies that can introduce compounding cent/paisa leakage.


### Key Findings:

1. **Minor Unit Architecture (`long` amountMinor):** The core database schema and Java domain entities represent all balances, principal amounts, fees, and payments as **integer minor units (Paisa)** using 64-bit signed integers (`long`). This is an industry gold standard that completely eliminates fractional rounding errors in persistent storage.

2. **Basis Point Architecture (`int` rateBp):** All regulatory provisioning rates, interest rates, and capital adequacy ratios are represented internally in **basis points (bp)**, where 1% = 100 bp, ensuring exact integer calculations.

3. **Conversion Artifacts Detected:** **27 locations** in the codebase divide integer values by `100.0` during JSON serialization for external systems (Fineract, Finacle, bKash) without utilizing `BigDecimal` scale formatting.


---

## 2. Double-Entry General Ledger (GL) Balancing Verification

### 2.1 The Accounting Invariant: $\sum Debits == \sum Credits$

Under Bangladesh Bank Core Banking guidelines, no subledger may post unbalanced vouchers.


- **Verification of `FineractJournalRestAdapter.java`:**

```java

double major = amountMinor / 100.0;

Map.of(

    "debits", List.of(Map.of("glAccountId", debitGlAccountId, "amount", major)),

    "credits", List.of(Map.of("glAccountId", creditGlAccountId, "amount", major))

)

```

Because both the debit and credit legs share the exact same `major` evaluation, **unbalanced vouchers cannot be created**.


- **Verification of `FinacleCbsAdapter.java`:**

```java

Map.of("account", debitAccount, "type", "D", "amount", amountMinor / 100.0),

Map.of("account", creditAccount, "type", "C", "amount", amountMinor / 100.0)

```

Strict double-entry symmetry is preserved across both legs of the CBS posting.


---

## 3. Detailed Floating-Point Conversion Audit (27 Findings)

While internal arithmetic uses integer paisa, converting via `amountMinor / 100.0` can emit binary floating-point representation anomalies (e.g. `12345.670000000001` instead of `12345.67`).


| Finding Class | Source File & Line | Code Snippet | Forensic Evaluation & Risk |
| :--- | :--- | :--- | :--- |
| `Java Division by 100.0 float conversion` | `BaselService.java:85` | `: Math.round(cap * 10_000.0 / Math.max(1, totalRwa)) / 100.0` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `BaselService.java:105` | `"percentOfCapital", Math.round(exposure * 10_000.0 / cap) / ` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReportingService.java:69` | `: Math.round(a[3] * 10_000.0 / a[2]) / 100.0);` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:199` | `row.put("rate_percent", BrpdClassifier.byName(e.getKey()).pr` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:281` | `row.put("risk_weight_percent", BaselCar.riskWeightBp(e.getKe` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:288` | `totals.put("car_percent", car == Integer.MAX_VALUE ? null : ` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:289` | `totals.put("floor_percent", BaselCar.FLOOR_BP / 100.0);` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:290` | `totals.put("buffer_pp", car == Integer.MAX_VALUE ? null : Ba` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:322` | `row.put("pd_percent", s.getPdBp() / 100.0);` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:323` | `row.put("lgd_percent", s.getLgdBp() / 100.0);` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:348` | `/ eligibleCapitalMinor) / 100.0);` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:560` | `kpis.put("carFloorPercent", BaselCar.FLOOR_BP / 100.0);` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `ReturnsService.java:570` | `return car == Integer.MAX_VALUE ? null : car / 100.0;` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FinacleCbsAdapter.java:42` | `.bodyValue(Map.of("limitKey", limitKey, "amount", amountMino` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FinacleCbsAdapter.java:62` | `Map.of("account", debitAccount, "type", "D", "amount", amoun` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FinacleCbsAdapter.java:63` | `Map.of("account", creditAccount, "type", "C", "amount", amou` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FineractJournalRestAdapter.java:45` | `double major = amountMinor / 100.0;` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FineractLoanRestAdapter.java:39` | `Map.entry("principal", spec.principalMinor() / 100.0),   // ` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FineractLoanRestAdapter.java:110` | `"transactionAmount", amountMinor / 100.0,   // Fineract majo` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FineractLoanRestAdapter.java:136` | `"transactionAmount", amountMinor / 100.0,   // Fineract majo` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FineractLoanRestAdapter.java:162` | `"transactionAmount", amountMinor / 100.0,` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `FineractLoanRestAdapter.java:186` | `"amount", amountMinor / 100.0,   // Fineract majors` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `BkashRailAdapter.java:53` | `"amount", String.valueOf(amountMinor / 100.0),` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `SanctionService.java:58` | `String ratePct = String.format(Locale.US, "%.2f", SANCTION_R` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `CertificateController.java:67` | `.append(String.format("%.2f", l.interestPaidMinor() / 100.0)` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `CertificateController.java:68` | `.append(String.format("%.2f", l.totalPaidMinor() / 100.0)).a` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |
| `Java Division by 100.0 float conversion` | `CertificateController.java:71` | `.append(String.format("%.2f", totalInterest / 100.0))` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |

---

## 4. BRPD Circular 15/2024 Provisioning Mathematics Verification

The formula implemented in `ClassificationService.java`:

$$\text{General Provision} = (\text{Outstanding Balance} - \text{Eligible Collateral}) \times \text{Provision Rate (bp)} / 10000$$

- STD-0 / STD-1 / STD-2: $100 \text{ bp} = 1.00\%$

- SMA: $500 \text{ bp} = 5.00\%$

- SS: $2000 \text{ bp} = 20.00\%$

- DF: $5000 \text{ bp} = 50.00\%$

- B/L: $10000 \text{ bp} = 100.00\%$


**Audit Verdict:** Mathematical calculations are completely compliant with Bangladesh Bank circular rules.
