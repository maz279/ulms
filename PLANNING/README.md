# ULMS v2.0 — Production Build, Development & Implementation Planning Suite

**Folder:** `LMS_CODEBASE/PLANNING` · **Version:** 1.0 · **Date:** 2026-09-27
**Prepared by:** Lead System Developer, Unisoft Systems Limited
**Inputs:** BRD v1.0 · URD v2.0 · SRS v2.0 · Compliance Validation Matrix ·
Technology Stack Recommendation v3.0 · validated UX prototype (`Front_end/`)
**Scope:** plan the build, development, and implementation of the REAL product —
ULMS v2.0 for Bangladesh scheduled banks (first deployment: ABC Bank).

---

## Document Map

| # | Document | What it decides |
|---|----------|-----------------|
| 00 | [00_Master_Build_and_Implementation_Plan.md](00_Master_Build_and_Implementation_Plan.md) | Phases, gates, milestones, governing rules, how the docs bind together |
| 01 | [01_Architecture_Blueprint.md](01_Architecture_Blueprint.md) | System architecture: modular monolith + Fineract, C4 views, runtime topology |
| 02 | [02_Repository_and_Engineering_Setup.md](02_Repository_and_Engineering_Setup.md) | Monorepo layout, toolchain, CI/CD pipeline, environments, Definition of Done |
| 03 | [03_Backend_Module_Specifications.md](03_Backend_Module_Specifications.md) | The 9 custom modules: responsibilities, APIs, workflows, Fineract usage |
| 04 | [04_Data_Model_and_Migration_Plan.md](04_Data_Model_and_Migration_Plan.md) | ERD core, schema strategy alongside Fineract, Flyway, outbox, EOD batch |
| 05 | [05_API_Design_Standards.md](05_API_Design_Standards.md) | REST conventions, versioning, errors, idempotency, pagination, security |
| 06 | [06_Security_and_Compliance_Plan.md](06_Security_and_Compliance_Plan.md) | BB ICT guidelines, BFIU AML, Keycloak, audit trail, secrets, OWASP ASVS |
| 07 | [07_Frontend_Implementation_Plan.md](07_Frontend_Implementation_Plan.md) | React 19 + MUI v7 app: structure, prototype→code map, i18n, a11y, state |
| 08 | [08_Mobile_and_Portal_Plan.md](08_Mobile_and_Portal_Plan.md) | Expo CPV field app + borrower self-service portal |
| 09 | [09_Testing_and_QA_Strategy.md](09_Testing_and_QA_Strategy.md) | Test pyramid, Fineract contract tests, Playwright from prototype gates, UAT |
| 10 | [10_DevOps_Deployment_and_Runbook.md](10_DevOps_Deployment_and_Runbook.md) | Compose → k3s, Helm, backup/DR, monitoring, SLAs, upgrade strategy |
| 11 | [11_External_Integrations_Plan.md](11_External_Integrations_Plan.md) | CIB, NIDW/NID, SMS/e-mail, bKash/Nagad/BEFTN, CBS: protocols & failure modes |
| 12 | [12_Program_Plan_Timeline_Risks.md](12_Program_Plan_Timeline_Risks.md) | 12-week pilot + hardening, RACI for 3 devs, risk register, go-live checklist |

## Reading Order

- **Executives / client:** 00 → 12 → 06.
- **Developers (day 1):** 00 → 02 → 01 → 03/04/05 → your module.
- **QA:** 09 → 05 → 12. **DevOps:** 10 → 02. **Frontend:** 07 → 05 → 08.

## Governing Facts (locked inputs to all documents)

1. **Stack = Technology Stack Recommendation v3.0**: Fineract CE (latest stable
   patch line, verified at build start — 1.12+/1.13/1.14 family), Java 21 LTS,
   Spring Boot 4.0.x modular monolith, PostgreSQL 17, Keycloak 26.x, React 19 +
   TS 5.8+ + Vite 7 + MUI v7, React Native/Expo 54+, Docker Compose → k3s,
   Prometheus/Grafana/Loki. **No Camunda (license), no Kafka day one (outbox),
   no Vault day one (bank KMS/HSM at hardening), no ELK (Loki).**
2. **Team = 3 developers** (Lead/full-stack, Frontend, Backend) + part-time QA
   support from Unisoft; the plan is sized so no week assumes more than 3.
3. **Regulatory baseline** (from Compliance Validation Matrix): BRPD 15/2024
   7-stage classification, CIB reporting, BFIU AML/e-KYC, IFRS-9 ECL runway
   (Dec 2027), Basel III CAR, BB ICT Security Guidelines V4.0.
4. **UX contract = the validated prototype** (405/405 routes, 0 dead links,
   bilingual, themed). Screens may gain fields; they may not lose structure.
5. **First milestone: ABC Bank pilot** (single branch, ~5,000 loans migrated),
   then scale to the 62-bank market.

## Change Control

These are living documents under the same review/approval flow as the SRS:
any change that moves a milestone, gate, or regulatory commitment requires
Lead Developer sign-off and a dated revision entry in the changed document.
