# ULMS — Unisoft Loan Management System (v2.0)

Single repository for the complete ULMS program: research and proposal corpus,
binding planning suite, validated UX prototypes, audit records, marketing
deliverables, and the working codebase (staff web app, API, mobile apps).

Documentation and research project for the Bangladesh banking sector, prepared
by **Unisoft Systems Limited**. See [AGENTS.md](AGENTS.md) for the full project
guide (structure, standards, regulatory compliance tables).

## Repository layout

| Path | Contents |
|------|----------|
| `LMS_CODEBASE/` | Working monorepo — Java 21 / Spring Boot modular-monolith API, React 19 staff web app, Expo field & borrower apps, OpenAPI-contract mock API, infra and `PLANNING/` build suite |
| `Front_end/` | Validated UX prototype (Dynamics 365 style, 166 screens, bilingual) — the UX contract for the build |
| `mobileapp_frontend/` | Bilingual static galleries + interactive prototypes for the borrower and field apps |
| `mobile_app/` | Standalone borrower app (Expo; signed Android APK pipeline; verified iOS Xcode project) |
| `docs/` | Implementation documentation (initiation → architecture → setup → deployment, G5 evidence) |
| `Business_logic/` | BL-001 business-rules reference — rules → code → test status dashboard |
| `audit/` | Third-party audit reports, our verdicts & remediation plans, R1–R10 / Plan_2 build record |
| `Marketing/` | Generated technical `.docx` / `.pptx` deliverables plus their build sources |
| `project_implementation_guide_document/` | Phase 0–8 documentation roadmap and guides |
| Root `*.md` / `*.docx` | BRD, URD v2, SRS v2, Technology Stack v2 + v3 (v3 is binding), Compliance Validation Matrix, RFP documents, research reports |

## Authority order

Compliance Matrix → SRS → `LMS_CODEBASE/PLANNING/` → `Front_end/` prototype →
Technology Stack v3.

## History note

`LMS_CODEBASE/` and `mobile_app/` were developed as standalone git
repositories; their full commit histories (including audit and remediation
trails) were absorbed into this repository with `git subtree`.

## Getting oriented

1. `AGENTS.md` — project guide (structure, standards, compliance tables)
2. `README_Documentation_Guide.md` — documentation quick-start
3. `ARCHITECTURE_STATE.md` — current architecture state and pointers
4. `LMS_CODEBASE/PLANNING/` — build-phase source of truth (phases P0–P7, gates G0–G5)
5. `audit/` — verification and audit record for everything built so far
