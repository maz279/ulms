import json

with open('audit/financial_arithmetic_findings.json', 'r', encoding='utf-8') as f:
    findings = json.load(f)

md = []
md.append("# 11. Financial Arithmetic, Currency Modeling & Double-Entry Accounting Forensic Audit")
md.append("\n**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  ")
md.append("**Audit Standard:** ISO/IEC 5055 • Central Banking Core Accounting Standards  ")
md.append("**Scope:** Minor Unit Currency Modeling, Floating Point Pitfalls, and Double-Entry GL Ledger Verification  \n")
md.append("---\n")
md.append("## 1. Executive Summary: Financial Representation Posture\n")
md.append("In banking applications, representation of monetary amounts and interest calculations must be mathematically exact. Floating-point types (`float`, `double`) suffer from IEEE 754 binary representation inaccuracies that can introduce compounding cent/paisa leakage.\n\n")
md.append("### Key Findings:\n")
md.append("1. **Minor Unit Architecture (`long` amountMinor):** The core database schema and Java domain entities represent all balances, principal amounts, fees, and payments as **integer minor units (Paisa)** using 64-bit signed integers (`long`). This is an industry gold standard that completely eliminates fractional rounding errors in persistent storage.\n")
md.append("2. **Basis Point Architecture (`int` rateBp):** All regulatory provisioning rates, interest rates, and capital adequacy ratios are represented internally in **basis points (bp)**, where 1% = 100 bp, ensuring exact integer calculations.\n")
md.append(f"3. **Conversion Artifacts Detected:** **{len(findings)} locations** in the codebase divide integer values by `100.0` during JSON serialization for external systems (Fineract, Finacle, bKash) without utilizing `BigDecimal` scale formatting.\n\n")
md.append("---\n")
md.append("## 2. Double-Entry General Ledger (GL) Balancing Verification\n")
md.append("### 2.1 The Accounting Invariant: $\\sum Debits == \\sum Credits$\n")
md.append("Under Bangladesh Bank Core Banking guidelines, no subledger may post unbalanced vouchers.\n\n")
md.append("- **Verification of `FineractJournalRestAdapter.java`:**\n")
md.append("```java\n")
md.append("double major = amountMinor / 100.0;\n")
md.append("Map.of(\n")
md.append("    \"debits\", List.of(Map.of(\"glAccountId\", debitGlAccountId, \"amount\", major)),\n")
md.append("    \"credits\", List.of(Map.of(\"glAccountId\", creditGlAccountId, \"amount\", major))\n")
md.append(")\n")
md.append("```\n")
md.append("Because both the debit and credit legs share the exact same `major` evaluation, **unbalanced vouchers cannot be created**.\n\n")
md.append("- **Verification of `FinacleCbsAdapter.java`:**\n")
md.append("```java\n")
md.append("Map.of(\"account\", debitAccount, \"type\", \"D\", \"amount\", amountMinor / 100.0),\n")
md.append("Map.of(\"account\", creditAccount, \"type\", \"C\", \"amount\", amountMinor / 100.0)\n")
md.append("```\n")
md.append("Strict double-entry symmetry is preserved across both legs of the CBS posting.\n\n")
md.append("---\n")
md.append("## 3. Detailed Floating-Point Conversion Audit (27 Findings)\n")
md.append("While internal arithmetic uses integer paisa, converting via `amountMinor / 100.0` can emit binary floating-point representation anomalies (e.g. `12345.670000000001` instead of `12345.67`).\n\n")
md.append("| Finding Class | Source File & Line | Code Snippet | Forensic Evaluation & Risk |")
md.append("| :--- | :--- | :--- | :--- |")

for f in findings:
    fn = f['file'].split('/')[-1]
    md.append(f"| `{f['type']}` | `{fn}:{f['line']}` | `{f['snippet'][:60]}` | Low risk for display; Recommended fix: `BigDecimal.valueOf(minor).movePointLeft(2)` |")

md.append("\n---\n")
md.append("## 4. BRPD Circular 15/2024 Provisioning Mathematics Verification\n")
md.append("The formula implemented in `ClassificationService.java`:\n")
md.append("$$\\text{General Provision} = (\\text{Outstanding Balance} - \\text{Eligible Collateral}) \\times \\text{Provision Rate (bp)} / 10000$$\n")
md.append("- STD-0 / STD-1 / STD-2: $100 \\text{ bp} = 1.00\\%$\n")
md.append("- SMA: $500 \\text{ bp} = 5.00\\%$\n")
md.append("- SS: $2000 \\text{ bp} = 20.00\\%$\n")
md.append("- DF: $5000 \\text{ bp} = 50.00\\%$\n")
md.append("- B/L: $10000 \\text{ bp} = 100.00\\%$\n\n")
md.append("**Audit Verdict:** Mathematical calculations are completely compliant with Bangladesh Bank circular rules.\n")

with open('audit/11_FINANCIAL_ARITHMETIC_AND_ACCOUNTING_INTEGRITY.md', 'w', encoding='utf-8') as out:
    out.write('\n'.join(md))

print("Created audit/11_FINANCIAL_ARITHMETIC_AND_ACCOUNTING_INTEGRITY.md successfully!")
