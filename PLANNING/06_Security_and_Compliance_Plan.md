# 06 — Security & Compliance Implementation Plan

**Doc:** PLAN-006 · v1.0 · 2026-09-27 · Owner: Lead System Developer
**Regulatory anchors (from Compliance Validation Matrix):** BB ICT Security
Guidelines V4.0 · BFIU AML/CFT & e-KYC circulars · BRPD 15/2024 · Bank Company
Act 1991 · Money Laundering Prevention Act 2012 · IFRS-9 (Dec 2027) · Basel III.

---

## 1. Security Architecture Baseline

| Control | Implementation |
|---|---|
| AuthN | Keycloak 26 OIDC (auth code + PKCE for web/mobile, client-credentials for services); MFA (TOTP) mandatory for officer roles — matches prototype login |
| AuthZ | Realm roles (`md`,`ho-credit`,`branch-manager`,`branch-officer`,`regional-manager`,`credit-analyst`,`collections`,`compliance`,`admin`) + **branch scope** claim; method security + row filters |
| Session | 15-min idle, 8h absolute; refresh rotation; single active session per officer (configurable per bank policy) |
| Transport | TLS 1.2+ everywhere incl. internal; HSTS; mTLS to Fineract where supported |
| At rest | Postgres TDE/volume encryption; MinIO SSE; backups encrypted (bank KMS keys) |
| Secrets | ENV/secret store only; gitleaks gate in CI; rotated quarterly; no literals in code/docs/tests |
| App hardening | OWASP ASVS L2 checklist as issue-template per module; dependency + container scanning gates (02) |

## 2. Bangladesh Bank ICT Security Guidelines V4.0 mapping (extract)

| BB ICT V4.0 area | Our control |
|---|---|
| Information security governance | Security section per release sign-off; roles/responsibilities in 12 |
| Access control / least privilege | Keycloak roles + branch scope + quarterly access review job |
| Password & MFA policy | Keycloak policy: 12+ chars, history 5, lockout 5/15min; MFA enforced |
| Audit logging & retention | mod-platform audit: append-only, hash-chained, **WORM export daily to MinIO with object-lock; 10-year retention** |
| Data classification & handling | PII tagged columns (04); masking rules below |
| Network security | Bank on-prem VLAN segregation; only gateway exposed; egress allow-list for CIB/NIDW/rails |
| Incident response | Runbook IR-01 (10): severity matrix, BB notification path per circular timelines |
| Backup & DR | 10 §6: WAL shipping + daily full; RPO 15m / RTO 4h drills |
| Vendor/patch mgmt | Fineract pinned + quarterly patch window; SBOM per release |

## 3. Audit Trail (bank-grade)

- Every state change writes `audit_entry`: actor (user/service), action,
  aggregate+id, before/after JSONB (PII-masked), requestId, source IP, ts.
- **Hash chain**: each row stores hash(prev_hash + payload) — tamper evident;
  daily anchor exported WORM.
- Officer-visible audit viewer (prototype audit screen) reads via
  `ulms_readonly`; exports are CSV/PDF signed.
- Maker-checker: sensitive actions (blacklist, waiver, write-off, provision
  override, config change) are workflow tasks requiring a second authorized role.

## 4. AML / BFIU Controls

- Screening at onboarding + periodic (sanctions/PEP/adverse-media lists via
  updatable list files — provider-agnostic port).
- Threshold transaction reporting hooks (cash >৳10L etc. per BFIU circulars)
  generate STR-workflow tasks for the compliance officer.
- KYC refresh cycles (high risk: 1y, medium: 2y, low: 3y) as scheduled tasks.
- Full NID capture passes to NIDW via adapter; ULMS stores **masked** NID +
  verification reference only (full value only inside Fineract identifiers,
  field-level encrypted).

## 5. PII & Data Protection Rules

| Data | Storage rule |
|---|---|
| NID | masked in ULMS (`****998Q` pattern as prototype); full only in Fineract, encrypted |
| Mobile/email | stored for ops, masked in logs & audit JSONB |
| Photos/signature/GPS | MinIO, access via short-lived signed URLs, never public |
| CIB raw files | encrypted object + parsed JSONB with facility-level data only; raw purged per retention policy after sign-off |
| Logs | structured logs scrub PII (pattern deny-list test in CI) |

## 6. Application Security Testing (per phase + release)

- Unit-level: authorization matrix tests (role×endpoint×branch) — 100% of
  mutating endpoints covered.
- SAST (Semgrep) + dependency (osv) + container (trivy) in CI (02).
- DAST (ZAP baseline) against DEV nightly; full scan pre-G2 and pre-release.
- Pen-test: external assessor before GA (budget in 12); findings tracked to closure.
- Fraud controls: velocity checks on payments, four-eyes on limit overrides,
  immutable officer action history for CIB inquiry audit.

## 7. Data Lifecycle & Retention

| Data | Retention | Disposal |
|---|---|---|
| Loan records | 10y post-closure (Bank Company Act) | archival export then delete |
| Audit | 10y WORM | none (court-grade) |
| Documents | life of loan + 10y | MinIO lifecycle |
| CIB parsed | 24 months rolling | batch purge |
| Dev/staging extracts | UAT window only | drop + wipe (04 §7) |

## 8. Compliance Features Schedule (build order)

- P0: roles/MFA/audit spine/branch scope (in walking skeleton).
- P1: maker-checker engine, document WORM, screening hooks.
- P2: CIB audit interlocks, BRPD EOD + provisions (mod-compliance), STR hooks.
- P3: retention jobs, KYC refresh cycles, tax cert controls.
- P4: CL pack sign-off chain (preparer/checker/compliance), regcon calendar.
- P5: pen-test fixes, DR/crypto drill evidence pack for bank sign-off.
