---
type: reference
topic: security_hardening_sast_dast_owasp_asvs
target_audience: [security_lead, penetration_tester, compliance_auditor]
version: 2026.10
document_id: DOC-06-QA-02
---

# DOC-06-QA-02: Security Hardening, SAST/DAST & OWASP ASVS Verification Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Security Hardening & OWASP ASVS Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Information Security Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | OWASP ASVS v4.0.3 Level 3 → BB ICT Security Guidelines V4.0 §5.0 |

---

## 1. OWASP ASVS Level 3 Verification Matrix

| ASVS Area | Standard Requirement | ULMS Implementation | Verification Tool |
|---|---|---|---|
| **V1 Architecture** | Secure architecture and trust boundaries | Spring Modulith boundary rules | ArchUnit & ModularityTest |
| **V2 Authentication** | Strong credentials and MFA | Keycloak 26 OIDC with WebAuthn/TOTP | ZAP DAST Scanner |
| **V3 Session Mgmt** | Secure cookies and token timeout | Stateless JWT, 15m access token expiry | Burp Suite |
| **V4 Access Control** | Object-level authorization | Spring `@PreAuthorize("hasRole(...)")` | SonarQube SAST |
| **V5 Cryptography** | Strong encryption in transit and rest | TLS 1.3, AES-256 for PII/collateral | Trivy Container Scan |

---

## 2. Continuous SAST/DAST Verification Gates

In every CI pipeline:
- **SonarQube SAST:** Zero blocker, critical, or high security bugs.
- **OWASP Dependency-Check:** Zero dependencies with CVSS score $\ge 7.0$.
- **Trivy Container Scanner:** Zero vulnerabilities in base Alpine Linux OS packages.


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- ASVS level unified to Level 3 corpus-wide (v3.1.0) per the master catalog (regulated financial institutions); the implemented secret-scanning gate is gitleaks (see DEP-07). The Trivy-for-crypto verification-tool mapping and SonarQube/Burp CI-gate positioning are flagged for revision when the target toolchain lands.
