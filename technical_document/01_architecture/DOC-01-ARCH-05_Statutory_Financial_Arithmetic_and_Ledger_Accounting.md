---
type: reference
topic: statutory_financial_arithmetic_and_ledger_accounting
target_audience: [financial_engineer, backend_developer, core_banking_architect, auditor]
version: 2026.10
document_id: DOC-01-ARCH-05
---

# DOC-01-ARCH-05: Statutory Financial Arithmetic & Banking Accounting Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Statutory Financial Arithmetic & Banking Accounting Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Banking Mathematical & Accounting Specification |
| **Status** | Approved Master Financial Specification |
| **Authority Chain** | `LMS_CODEBASE/apps/api/src/main/java/com/uslbd/ulms/platform/MoneyMath.java` → `Bangladesh Bank BRPD Circular 15/2024` → `IFRS 9 Financial Instruments` |
| **Target Codebase** | `c:\software_project\mim_project\LMS\LMS_CODEBASE` |

---

## 1. Zero Floating-Point Money Invariant

In accordance with institutional banking engineering standards, **floating-point numeric data types (`float`, `double`, `Float`, `Double`) are strictly prohibited** throughout the ULMS codebase for all currency amounts, fees, balances, and interest rates.

### The Single Money Representation Rule:
1. **Persistent Minor Units (Poisha):** All monetary values in the database, REST API DTOs, and internal messaging are expressed as **64-bit integer minor currency units (`Long` / `BIGINT`)** representing Bangladesh Poisha ($1\text{ BDT} = 100\text{ poisha}$).
2. **Intermediate Calculation Arithmetic:** All interest rates, loan amortizations, and provisioning calculations utilize `java.math.BigDecimal` with an exact precision scale of 6 decimal places, applying `RoundingMode.HALF_UP` (Banker's rounding) before converting back to integer poisha.

---

## 2. Day-Count Conventions & Equal Monthly Installment (EMI) Arithmetic

ULMS v2.0 implements standard **Actual/365** day-count conventions for conventional commercial loans and **30/360** for specialized term products.

### 2.1 The Reducing Balance EMI Formula
The monthly installment ($EMI$) on a reducing balance loan is determined by:

$$EMI = P \times \frac{r \times (1 + r)^n}{(1 + r)^n - 1}$$

Where:
- $P$ = Principal loan amount in poisha.
- $r$ = Monthly periodic interest rate ($\frac{\text{Annual Interest Rate}}{12 \times 100}$).
- $n$ = Total number of monthly installments (Tenor in months).

### 2.2 Worked Numerical Example
- **Principal ($P$):** BDT 2,000,000.00 ($200,000,000\text{ poisha}$)
- **Annual Interest Rate:** $9.00\%$ per annum $\implies r = \frac{0.09}{12} = 0.0075$
- **Tenor ($n$):** 36 months

$$\text{Factor } (1 + r)^n = (1.0075)^{36} \approx 1.308645$$

$$EMI = 2,000,000 \times \frac{0.0075 \times 1.308645}{1.308645 - 1} = 2,000,000 \times \frac{0.0098148}{0.308645} = \text{BDT } 63,599.37$$

Every month, the interest component ($I_k = \text{Outstanding Balance} \times r$) decreases while the principal repayment component ($P_k = EMI - I_k$) increases proportionately.

---

## 3. Statutory Debt Burden Ratio (DBR) Computation

Under Bangladesh Bank regulations, an individual borrower's aggregate debt service commitments across all financial institutions must not breach the statutory ceiling:

$$DBR = \frac{\text{Proposed Monthly EMI} + \text{Verified Existing Monthly Liabilities}}{\text{Verified Monthly Net Income}} \times 100 \le 50.0\%$$

### Worked DBR Compliance Verification:
- **Verified Net Monthly Salary:** BDT 150,000.00
- **Existing Credit Card & Personal Loan Dues (from CIB):** BDT 18,500.00 / month
- **Proposed New Home Loan EMI:** BDT 52,000.00 / month
- **Total Monthly Debt Commitments:** $\text{BDT } 18,500 + \text{BDT } 52,000 = \text{BDT } 70,500.00$

$$DBR = \frac{70,500}{150,000} \times 100 = 47.0\% \quad \implies \text{\textbf{COMPLIANT}} \ (\le 50.0\%)$$

If the proposed EMI were BDT 60,000, DBR would reach $52.33\%$, automatically triggering `ULMS-VAL-0001` and blocking application submission.

---

## 4. Delegated Credit Approval Ladder Arithmetic

ULMS enforces strict role-based credit limits matching commercial bank governance mandates:

| Approval Tier | Approver Role | Single Borrower Limit (BDT) | Unsecured Limit (BDT) | Governance Body |
|---|---|---|---|---|
| **Tier 1** | Branch Manager | Up to BDT 1,000,000 | Up to BDT 200,000 | Branch Credit Committee |
| **Tier 2** | Regional Credit Manager (CRM) | Up to BDT 5,000,000 | Up to BDT 500,000 | Regional Office |
| **Tier 3** | Head of Credit (HoC) | Up to BDT 20,000,000 | Up to BDT 1,000,000 | Head Office CRM Division |
| **Tier 4** | Managing Director & CEO | Up to BDT 50,000,000 | Up to BDT 2,500,000 | Executive Management Committee |
| **Tier 5** | Board Credit Committee (BCC) | Up to BDT 200,000,000 | Up to BDT 5,000,000 | Board Committee |
| **Tier 6** | Full Board of Directors | Exceeding BDT 200,000,000 | Exceeding BDT 5,000,000 | Board of Directors |

---

## 5. BRPD Circular 15/2024 Loan Classification & Provisioning Engine

On each nightly EOD run, every loan is classified into one of 7 statutory stages based on Days Past Due (DPD) and objective qualitative criteria:

| Stage ID | Classification Label | DPD Boundary | Statutory Base Provision Rate | Eligible Collateral Deduction |
|---|---|---|---|---|
| **STD-0** | Standard (Current) | $0\text{ days}$ | $1.0\%$ | None |
| **STD-1** | Standard (Watch) | $1\text{ to } 30\text{ days}$ | $1.0\%$ | None |
| **STD-2** | Standard (Caution) | $31\text{ to } 60\text{ days}$ | $1.0\%$ | None |
| **SMA** | Special Mention Account | $61\text{ to } 90\text{ days}$ | $5.0\%$ | None |
| **SS** | Substandard | $91\text{ to } 180\text{ days}$ | $20.0\%$ | Permitted (Eligible FSV) |
| **DF** | Doubtful | $181\text{ to } 365\text{ days}$ | $50.0\%$ | Permitted (Eligible FSV) |
| **B/L** | Bad / Loss | $> 365\text{ days}$ | $100.0\%$ | Permitted (Eligible FSV) |

### Net Provision Arithmetic Formula:
For classified loans (SS, DF, B/L), statutory provisioning is computed against net unsecured exposure:

$$\text{Net Provision} = \max\Big(0, \big(\text{Total Outstanding} - \text{Eligible Collateral Forced Sale Value}\big)\Big) \times \text{Provision Rate}$$

---

## 6. Double-Entry General Ledger Accounting Mappings

All loan lifecycle events map to balanced, zero-sum double-entry accounting journal vouchers posted directly into Apache Fineract's general ledger (`acc_gl_journal_entry`):

### 6.1 Loan Fund Disbursement
```
DEBIT:  GL-10401 (Loans & Advances Asset Account)       BDT 2,000,000.00
CREDIT: GL-20105 (Customer Settlement / CASA Account)   BDT 1,980,000.00
CREDIT: GL-40201 (Loan Documentation & Processing Fee) BDT    15,000.00
CREDIT: GL-20302 (National CIB Verification Fee Pool)  BDT     5,000.00
-------------------------------------------------------------------------
TOTAL DEBITS: BDT 2,000,000.00 | TOTAL CREDITS: BDT 2,000,000.00 (BALANCED)
```

### 6.2 Monthly Installment Repayment Collection
```
DEBIT:  GL-20105 (Customer CASA Settlement Account)      BDT    63,599.37
CREDIT: GL-10401 (Loan Principal Asset Account)          BDT    48,599.37
CREDIT: GL-40101 (Interest Income on Advances)          BDT    15,000.00
-------------------------------------------------------------------------
TOTAL DEBITS: BDT 63,599.37 | TOTAL CREDITS: BDT 63,599.37 (BALANCED)
```

### 6.3 Nightly Provisioning Adjustment (EOD)
```
DEBIT:  GL-50301 (P&L Provision Expense on Loans)        BDT    50,000.00
CREDIT: GL-10409 (Allowance for Loan Losses Contra-Asset) BDT   50,000.00
-------------------------------------------------------------------------
TOTAL DEBITS: BDT 50,000.00 | TOTAL CREDITS: BDT 50,000.00 (BALANCED)
```

---

*— End of Statutory Financial Arithmetic & Banking Accounting Specification —*
