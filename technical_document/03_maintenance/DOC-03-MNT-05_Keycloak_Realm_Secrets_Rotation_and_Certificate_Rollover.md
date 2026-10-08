---
type: how-to
topic: keycloak_secret_rotation_cert_rollover
target_audience: [security_engineer, iam_administrator, devops]
version: 2026.10
document_id: DOC-03-MNT-05
---

# DOC-03-MNT-05: Keycloak Realm Secrets Rotation, Certificate Rollover & Client Hardening Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Keycloak Realm Secrets Rotation & Client Hardening |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Security Maintenance Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-06` → NIST SP 800-57 Part 1 |

---

## 1. Key Rotation Lifecycle & Policies

Under Bangladesh Bank ICT Security Guidelines, cryptographic keys must rotate on strict schedules:
- **RS256 Realm Signing Keys:** Rotated every 180 days (Active -> Passive -> Deleted).
- **OAuth2 client credentials (single seeded public client `ulms-web`; confidential service clients only when explicitly provisioned):** Rotated every 90 days.
- **Database Service Accounts:** Rotated every 90 days.

---

## 2. Zero-Downtime Key Rollover Procedure

1. **Phase 1 (Generate New Key as Passive):** Create new RS256 key in Keycloak Admin Console. Public key is published to `.well-known/jwks.json`.
2. **Phase 2 (Promote to Active):** Set priority of new key higher than old key. New tokens are signed with the new key. Existing tokens signed with old key remain valid until expiry.
3. **Phase 3 (Retire Old Key):** After max token lifespan (e.g. 24 hours), transition old key to disabled and then delete.
