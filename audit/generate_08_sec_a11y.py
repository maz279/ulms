import json

with open('audit/scanner_findings.json', 'r', encoding='utf-8') as f:
    scanner = json.load(f)

with open('audit/a11y_audit_findings.json', 'r', encoding='utf-8') as f:
    a11y = json.load(f)

sec_p0 = scanner['security_findings']['items']
smell_items = scanner['smell_findings']['items']

md = []
md.append("# 08. Security Vulnerability, Threat Modeling & WCAG 2.1 AA Accessibility Audit")
md.append("\n**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  ")
md.append("**Audit Standards:** OWASP ASVS v4.0.3, NIST SP 800-218 (SSDF), ISO/IEC 5055, WCAG 2.1 Level AA  \n")
md.append("---\n")
md.append("## 1. Executive Summary: Security & Accessibility Posture\n")
md.append("The ULMS codebase was subjected to deep static security analysis (Shannon entropy secret scanning, AST vulnerability detection) and automated WCAG 2.1 AA accessibility auditing.\n")
md.append(f"- **P0 Critical Security Findings:** {len(sec_p0)} (High-entropy credentials in documentation & test scripts)")
md.append("- **P1 High Security Findings:** 1 (Bash script raw SQL string concatenation vulnerability)")
md.append(f"- **P3 Maintainability / Hardcoded IP Smells:** {len(smell_items)} (Localhost bindings in Docker & deployment manifests)")
md.append(f"- **WCAG 2.1 AA Accessibility Non-Compliances:** {len(a11y)} (Missing input labels, non-semantic interactive elements)\n")
md.append("---\n")
md.append("## 2. Static Security Findings (OWASP ASVS & NIST SSDF)\n")
md.append("### 2.1 P0 Critical: Hardcoded Secrets & Credential Assignments\n")
md.append("| Finding ID | File Path | Line | Entropy | Vulnerable Code Snippet | Remediation |")
md.append("| :--- | :--- | :---: | :---: | :--- | :--- |")

for p in sec_p0:
    md.append(f"| `{p['id']}` | `{p['file']}` | {p['line']} | {p['entropy']} | `{p['snippet']}` | Inject via Vault / Kubernetes Secret |")

md.append("\n### 2.2 P1 High: Raw SQL Concatenation in Migration Drill Scripts\n")
md.append("- **Vulnerable File:** `deploy/drills/migration-45k-rehearsal.sh:104`\n")
md.append("- **Snippet:** `WHERE NOT EXISTS (SELECT 1 FROM ${SCHEMA}.loan l WHERE l.loan_no = src.ref)`\n")
md.append("- **Risk:** Parameter injection if `$SCHEMA` environment variable is manipulated during automated deployment pipelines.\n")
md.append("- **Remediation:** Enforce parameter sanitation and strict regex validation on `${SCHEMA}` before interpolation.\n")

md.append("\n---\n")
md.append("## 3. Infrastructure & Authentication Threat Modeling\n")
md.append("### 3.1 Keycloak Development Profile Risk\n")
md.append("- **Location:** `deploy/compose/docker-compose.yml:28`\n")
md.append("- **Current Config:** `command: start-dev --import-realm` using embedded H2 database.\n")
md.append("- **Threat:** Development profile disables TLS enforcement, logs sensitive claims, and uses ephemeral in-memory storage. In a banking deployment, Keycloak MUST run in production mode (`start --optimized`) connected to a clustered PostgreSQL instance with TLS 1.3 certificates.\n")

md.append("### 3.2 Monolithic Header Identity Bypass (`X-ULMS-Actor`)\n")
md.append("- **Mechanism:** When OAuth 2.0 PKCE is absent, controllers accept `X-ULMS-Actor: <username>` to resolve the user context.\n")
md.append("- **Threat:** If an external client reaches Spring Boot directly without traversing an API gateway that strips untrusted headers, any user can impersonate a Credit Committee Member or BOCC approver.\n")
md.append("- **Remediation:** Enforce strict gateway-level header stripping and ensure backend Spring Security filter rejects `X-ULMS-Actor` unless signed by an internal mutual TLS (mTLS) reverse proxy.\n")

md.append("\n---\n")
md.append("## 4. Accessibility (a11y) & WCAG 2.1 Level AA Compliance\n")
md.append(f"A full scan across all 18 web source files identified **{len(a11y)} accessibility defects**:\n\n")
md.append("| Severity | Component / File | Line | WCAG Success Criterion | Defect Description |")
md.append("| :--- | :--- | :---: | :--- | :--- |")

for iss in a11y:
    comp = iss['file'].split('/')[-1]
    md.append(f"| **{iss['severity']}** | `{comp}` | {iss['line']} | `{iss['rule']}` | {iss['detail']} |")

md.append("\n### 4.1 Accessibility Remediation Priority:\n")
md.append("1. **Form Input Label Associations (`WCAG 1.3.1`):** In `LoginPage.tsx` and `DocumentPanel.tsx`, input fields lack associated `<label htmlFor=\"...\">` tags or `aria-label` attributes. Screen readers cannot announce the expected input.\n")
md.append("2. **Keyboard Focusable Clickables (`WCAG 4.1.2`):** Interactive `<div>` elements in `InsightPages.tsx` and `R3R4Pages.tsx` have `onClick` handlers but lack `role=\"button\"`, `tabIndex={0}`, and `onKeyDown` listeners, rendering them completely inaccessible to keyboard-only and switch-device users.\n")
md.append("3. **Bilingual Screen Reader Tags:** In `ScreenPages.tsx`, bilingual English/Bangla text nodes lack `lang=\"bn\"` attributes for Bengali phrases, causing English screen readers to pronounce phonemes incorrectly.\n")

with open('audit/08_SECURITY_VULNERABILITY_AND_A11Y_AUDIT.md', 'w', encoding='utf-8') as out:
    out.write('\n'.join(md))

print("Created audit/08_SECURITY_VULNERABILITY_AND_A11Y_AUDIT.md successfully!")
