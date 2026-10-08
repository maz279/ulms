# AGENTS.md - Project Guide for AI Coding Agents

## Project Overview

This is a **documentation and research project** (NOT a software codebase) focused on Loan Management Systems (LMS) for the Bangladesh banking sector. The project contains comprehensive research reports, product specifications, RFP documents, and competitive analysis prepared by **Unisoft Systems Limited**.

### ⚠️ IMPORTANT UPDATE - February 2026

This project has evolved to include **comprehensive implementation documentation** for ULMS v2.0 based on Apache Fineract Community Edition. The project now serves as both a knowledge repository AND an implementation guide for a 3-developer team.

### Project Purpose

The project serves as a knowledge repository and proposal documentation for developing and deploying a Loan Management System tailored to Bangladesh Bank regulations. It includes:

- Market research on global LMS solutions
- Bangladesh banking regulatory compliance analysis
- RFP (Request for Proposal) documentation
- Product specifications for Unisoft's LMS offering
- Open source LMS analysis (Apache Fineract, Frappe Lending, OpenCBS)
- Case studies, white papers, and presentations
- **NEW:** Complete implementation documentation for development team
- **NEW:** Technical documentation writing skill set

### Target Market

- **Primary**: 62 scheduled commercial banks in Bangladesh
  - 33 Private Commercial Banks (Conventional)
  - 10 Private Commercial Banks (Islamic)
  - 6 State-Owned Commercial Banks
  - 3 Specialized Development Banks
  - 9 Foreign Commercial Banks
- **Secondary**: Non-Bank Financial Institutions (NBFIs)
- **Tertiary**: Microfinance Institutions (MFIs)

---

## Skills Reference

This project includes a specialized skill for technical documentation:

### Technical Document Writing Skill

**Location:** `.claude/skills/technical-writing/SKILL.md`

**Purpose:** Comprehensive guidance for creating, maintaining, and reviewing technical documentation for the ULMS project.

**When to Use:**
- Creating new technical documentation
- Updating existing project documents
- Reviewing documentation for quality assurance
- Onboarding new team members to documentation standards
- Preparing compliance or regulatory documentation

**Key Features:**
- Document control header templates
- Classification levels and naming conventions
- Document type guidelines (BRD, SRS, Architecture, API, Developer Guide)
- Markdown standards and formatting conventions
- Writing style guidelines (Bangladesh-specific conventions)
- Review and approval process
- Tools and resources recommendations

---

## Project Structure

```
c:\software_project\mim_project\LMS\
│
├── .claude/                          # Claude IDE configuration
│   ├── settings.local.json           # Local settings
│   └── skills/                       # Project-specific skills
│       └── technical-writing/
│           └── SKILL.md              # Technical writing skill
│
├── ABC Bank Documents/               # Client-specific documents
│
├── apache_Fineract/                  # Apache Fineract documentation
│   ├── 01_Apache_Fineract_Solution_Overview.md
│   ├── 02_Apache_Fineract_Features_and_Modules.md
│   └── 03_Apache_Fineract_Bangladesh_Market_Analysis.md
│
├── The products/                     # Unisoft product catalog documents
│   ├── 01_Unisoft_Client_Management_System.md
│   ├── 02_Unisoft_Loan_Management_System.md
│   ├── 03_Unisoft_Savings_Management_System.md
│   └── 04_Unisoft_Integrated_Solution_Architecture.md
│
├── Unisoft Loan Management system/   # Detailed ULMS documentation
│   ├── 01_COMPREHENSIVE_DETAILS_UNISOFT_LOAN_MANAGEMENT_SYSTEM.md
│   ├── 02_PRODUCT_CATALOGUE_UNISOFT_LOAN_MANAGEMENT_SYSTEM.md
│   ├── 02_Unisoft_Loan_Management_System.md
│   ├── 03_CASE_STUDY_ABC_BANK_BANGLADESH.md
│   ├── 04_WHITE_PAPER_DIGITAL_LENDING_TRANSFORMATION.md
│   └── COMPREHENSIVE_LOAN_MANAGEMENT_SYSTEM_BANGLADESH.md
│
├── docs/                             # IMPLEMENTATION DOCUMENTATION (NEW)
│   ├── 00-initiation/                # Project startup documents
│   ├── 01-architecture/              # System design docs
│   ├── 02-setup/                     # Environment setup
│   ├── 03-backend/                   # Backend development
│   ├── 04-frontend/                  # Frontend development
│   ├── 05-testing/                   # Testing documentation
│   ├── 06-deployment/                # DevOps & deployment
│   └── templates/                    # Document templates
│
├── technical_document/               # MASTER TECHNICAL DOCUMENTATION SUITE
│   ├── MASTER_TECHNICAL_DOCUMENTATION_CATALOG.md # 42 Technical documents blueprint
│   └── 01-06 categories             # Architecture, troubleshooting, maintenance, deployment, extensions, QA
│
├── business_document/                # MASTER BUSINESS & SALES DOCUMENTATION SUITE (NEW - Oct 2026)
│   ├── MASTER_BUSINESS_DOCUMENTATION_CATALOG.md # 42 Essential business & sales documents blueprint
│   ├── README.md                     # Sales quick-start guide & navigation index
│   └── 01_strategic_marketing/ to 07_poc_and_contracting/ # 7 Strategic sales/commercial categories
│
├── Business_Requirements_Document_LMS.md     # BRD v1.0 (30 KB)
├── User_Requirements_Document_v2.md          # URD v2.0 (42 KB)
├── Technology_Stack_Recommendation_v2.md     # Tech Stack v2.0 (28 KB)
├── Software_Requirements_Specification.md    # SRS v2.0 (44 KB)
├── Compliance_Validation_Matrix.md           # RFP/BRD compliance (10 KB)
├── ULMS_Development_Documentation_Roadmap.md # Master roadmap (56 KB)
├── README_Documentation_Guide.md             # Quick start guide (12 KB)
│
├── LMS_OpenSource_Analysis_Report.md      # Analysis of open source LMS options
├── LMS_Research_Report.md                 # Comprehensive market research
├── LMS_RFP_Summary.md                     # RFP executive summary
├── LMS_RFP_Bangladesh_Banking.docx        # Full RFP document (Word)
├── unisoft_business_profile_book.md       # Company profile
├── Proposal for LMS.docx                  # Business proposal (Word)
├── Unisoft Loan Management System.pptx    # Presentation (PowerPoint)
├── Unisoft_Loan_Management_System_Presentation.html  # HTML presentation
└── pasted-text-2026-01-26T17-41-54.txt    # Temporary/pasted content
```

---

## Key Documentation Files (Updated September 2026)

### ⚠️ IMPORTANT UPDATE - September 2026

Three new artifact categories now exist and are **binding for the build phase**:
- **`Front_end/`** — VALIDATED UX prototype (Dynamics 365 style, 166 screens, 405/405 route tests, 0 dead links of 1,327, bilingual, 13-fix QA log). It is the UX contract for the real build.
- **`Technology_Stack_Recommendation_v3.md`** — BINDING stack (supersedes v2): Fineract CE latest patch line, Java 21 + Spring Boot 4 modular monolith, PostgreSQL 17, Keycloak 26, React 19/MUI v7/Vite 7, Expo 54+, Compose→k3s; Camunda replaced (license), Kafka/Vault/ELK deferred.
- **`LMS_CODEBASE/PLANNING/`** — 14-document build/development/implementation plan (phases P0–P7, gates G0–G5, 12-week pilot timeline, module specs, security/compliance mapping, go-live checklist). This is the build-phase source of truth.

Authority order: Compliance Matrix → SRS → PLANNING suite → Front_end prototype → Tech Stack v3.

### Implementation Documentation Suite

| File | Size | Purpose | Audience |
|------|------|---------|----------|
| `ULMS_Development_Documentation_Roadmap.md` | 56 KB | Master implementation guide with 49 document templates | Development Team |
| `README_Documentation_Guide.md` | 12 KB | Quick start guide for navigating documentation | Development Team |
| `Business_Requirements_Document_LMS.md` | 30 KB | Business requirements (BRD v1.0) | Business Analysts |
| `User_Requirements_Document_v2.md` | 42 KB | User-centric requirements (URD v2.0) | UX/UI Team |
| `Technology_Stack_Recommendation_v2.md` | 28 KB | Technical architecture (SUPERSEDED by v3) | Architects |
| `Technology_Stack_Recommendation_v3.md` | — | **BINDING stack for the build (Sept 2026)** | Architects, Team |
| `Software_Requirements_Specification.md` | 44 KB | Technical specifications (SRS v2.0) | Developers |
| `Compliance_Validation_Matrix.md` | 10 KB | RFP/BRD 100% compliance verification | QA, Compliance |
| `Front_end/` (prototype) | 18 files | **Validated UX contract + QA harnesses** | Team, Stakeholders |
| `LMS_CODEBASE/PLANNING/` (14 docs) | ~74 KB | **Build/development/implementation plan** | Team |
| `LMS_CODEBASE/apps/web` (staff app + mock API) | — | React 19 app; `npm run mock:api` + `npm run dev` runs the full UI + OpenAPI-contract mock without Docker | Team |
| `technical_document/` | 127 KB | **Master Technical Documentation Catalog & Operational Blueprint (42 Docs)** | Architects, DevOps, SRE |
| `business_document/` | 195 KB (MD) + 13.5 MB (DOCX) | **Master Business Documentation Suite: 21 Microsoft Word (.docx) & Markdown (.md) documents, 74 embedded production build screenshots/exhibits, 4-iteration executive styling; forensically re-audited & corrected 2026-10-08 (see audit/docx_forensic_audit_2026-10-08.md)** | Sales, Marketing, C-Suite |

### Research Reports

| File | Purpose |
|------|---------|
| `LMS_Research_Report.md` | Comprehensive market analysis of global LMS solutions |
| `LMS_OpenSource_Analysis_Report.md` | Analysis of Apache Fineract, Frappe Lending, OpenCBS |
| `LMS_RFP_Summary.md` | Executive summary of Bangladesh banking RFP requirements |

### Product Documentation

| File | Purpose |
|------|---------|
| `The products/02_Unisoft_Loan_Management_System.md` | Product specification document |
| `Unisoft Loan Management system/01_COMPREHENSIVE_DETAILS_*.md` | Detailed technical specifications |
| `Unisoft Loan Management system/02_PRODUCT_CATALOGUE_*.md` | Product catalog and pricing |

### Supporting Documentation

| File | Purpose |
|------|---------|
| `unisoft_business_profile_book.md` | Company background and capabilities |
| `Unisoft Loan Management system/03_CASE_STUDY_*.md` | ABC Bank implementation case study |
| `Unisoft Loan Management system/04_WHITE_PAPER_*.md` | Digital lending transformation white paper |

---

## Document Types and Formats

### Primary Document Format: Markdown (.md)

All main documentation is written in **Markdown format** with the following conventions:

- **Headers**: Use ATX-style (`#` for H1, `##` for H2, etc.)
- **Tables**: Used extensively for comparisons and specifications
- **Code Blocks**: Used for technical specifications, YAML configs, and shell commands
- **ASCII Diagrams**: Used for architecture and workflow visualization
- **Mermaid Diagrams**: For complex flowcharts and sequences
- **Language**: English (US)

### Secondary Document Formats

- **Microsoft Word (.docx)**: For formal proposals and RFPs requiring signatures
- **Microsoft PowerPoint (.pptx)**: For presentations
- **HTML**: For web-based presentations

---

## Content Organization Conventions

### Standard Document Structure

All major markdown documents follow this structure:

```markdown
# Main Title
## Subtitle
### Metadata (Version, Date, Author)

---

## Table of Contents

1. [Section Name](#anchor)
2. [Section Name](#anchor)

---

## 1. Section Name

### 1.1 Subsection
Content...

### 1.2 Subsection
Content...

---

## Sources & References
- Reference 1
- Reference 2
```

### Naming Conventions

- **Research Reports**: `LMS_*_Report.md`
- **Product Docs**: `*_Unisoft_Loan_Management_System.md`
- **Apache Fineract Docs**: `##_Apache_Fineract_*.md`
- **Case Studies**: `##_CASE_STUDY_*.md`
- **White Papers**: `##_WHITE_PAPER_*.md`
- **Implementation Docs**: `[Category]_[Type]_[Subject]_v[X.Y].md`

---

## Technology Stack - ULMS v2.0

### Confirmed Technology Stack (February 2026)

#### Backend
- **Core Platform**: Apache Fineract 1.10 Community Edition
- **Language**: Java 21 LTS (Eclipse Temurin)
- **Framework**: Spring Boot 3.2
- **Microservices**: Spring Boot 3.2 + Camunda 8.3
- **Database**: PostgreSQL 16 (Primary), Redis 7 (Cache)
- **Build Tool**: Gradle 8.x / Maven 3.9+
- **Message Queue**: Apache Kafka 3.6
- **Workflow Engine**: Camunda Platform 8.3

#### Frontend
- **Framework**: React 18.2 with TypeScript 5.3
- **Build Tool**: Vite 5.0 (with HMR)
- **UI Library**: Material-UI (MUI) 5.15
- **State Management**: Redux Toolkit 2.0 + RTK Query
- **Forms**: React Hook Form + Zod
- **i18n**: react-i18next (Bengali/English)
- **Charts**: Recharts 2.10

#### Mobile
- **Framework**: React Native 0.73
- **Platform**: Expo SDK 50.0
- **Offline Storage**: Redux Persist + MMKV
- **Maps**: React Native Maps

#### Infrastructure
- **Containerization**: Docker 24.x, Kubernetes 1.28
- **API Gateway**: Kong 3.5
- **Identity**: Keycloak 23 (OAuth 2.0/OIDC)
- **Secrets**: HashiCorp Vault 1.15
- **Monitoring**: Prometheus + Grafana + ELK Stack
- **CI/CD**: GitLab CI + ArgoCD

#### Integration Points
- **CIB Online**: Bangladesh Bank Credit Information Bureau (REST API)
- **NID/e-KYC**: National ID verification (NIDW API)
- **CBS**: Core Banking System (REST/SOAP)
- **Payment Gateways**: bKash, Nagad, Rocket APIs
- **SMS/Email**: Bangladesh-specific gateways

---

## Bangladesh Regulatory Compliance

Key regulatory frameworks documented in the project:

| Regulation | Relevance |
|------------|-----------|
| Bangladesh Bank Order, 1972 | Central bank authority |
| Bank Company Act, 1991 | Banking operations regulation |
| BRPD Circular 15/2024 | 7-stage loan classification |
| BFIU e-KYC Guidelines | Digital customer onboarding |
| Basel III RBCA Guidelines | Capital adequacy (12.5% CAR) |
| IFRS-9 | ECL provisioning (mandatory Dec 2027) |
| Money Laundering Prevention Act, 2012 | AML/CFT requirements |
| ICT Security Guidelines V4.0 | Information security compliance |

### Loan Classification (BRPD 15/2024)

| Stage | Classification | DPD Range | Provisioning Rate |
|-------|---------------|-----------|-------------------|
| STD-0 | Standard (Current) | 0 | 1% |
| STD-1 | Standard (Watch) | 1-30 days | 1% |
| STD-2 | Standard (Caution) | 31-60 days | 1% |
| SMA | Special Mention Account | 61-90 days | 5% |
| SS | Substandard | 91-180 days | 20% |
| DF | Doubtful | 181-365 days | 50% |
| B/L | Bad/Loss | >365 days | 100% |

---

## Working with This Project

### When Editing Documentation

1. **Maintain consistency**: Follow existing document structure and formatting
2. **Update tables**: Ensure all comparison tables are accurate and complete
3. **Preserve ASCII art**: Do not break ASCII diagrams
4. **Check cross-references**: Verify all internal links work
5. **Version control**: Update document version and date when making significant changes
6. **Use the Technical Writing Skill**: Reference `.claude/skills/technical-writing/SKILL.md`

### When Adding New Content

1. Use Markdown format for text-based content
2. Place files in appropriate subdirectories
3. Follow naming conventions
4. Include table of contents for documents > 100 lines
5. Add to this AGENTS.md if introducing new document categories
6. Apply document control headers per the Technical Writing Skill

### When Converting Formats

- Word (.docx) to Markdown: Use Pandoc or manual conversion preserving tables
- PowerPoint to HTML: Export as HTML or use online converters
- Maintain original files for archival purposes

### For Development Team

1. Start with `README_Documentation_Guide.md` for orientation
2. Use `ULMS_Development_Documentation_Roadmap.md` as your master reference
3. Follow the Technical Writing Skill standards for all new documentation
4. Create documents in the appropriate `docs/` subdirectory

---

## Development Team Structure

### Team Composition (3 Developers)

| Role | Responsibilities | Primary Documents |
|------|------------------|-------------------|
| **Technical Lead** | Architecture, Backend microservices, DevOps | Tech Stack v2.0, SRS v2.0, Architecture docs |
| **Frontend Developer** | React UI, Component library, i18n | URD v2.0, Frontend Architecture |
| **Backend/Mobile Dev** | Fineract customization, APIs, React Native | SRS v2.0, Fineract docs, API specs |

### Documentation Responsibilities

| Phase | Lead Dev | Frontend Dev | Backend Dev |
|-------|----------|--------------|-------------|
| Phase 0: Initiation | All docs | Review | Review |
| Phase 1: Architecture | All architecture docs | Frontend architecture | Backend setup |
| Phase 2: Setup | Docker, Infrastructure | Frontend setup | Fineract setup |
| Phase 3: Backend | CIB, BRPD, Workflow | API integration | All services |
| Phase 4: Frontend | Review | All frontend docs | Mobile app |
| Phase 5: Testing | Test plans | E2E tests | Integration tests |
| Phase 6: Deployment | All DevOps docs | Review | Review |

---

## Key External References

### Bangladesh Bank Resources
- [Bangladesh Bank Guidelines](https://www.bb.org.bd/en/index.php/about/guidelist)
- [CIB Department](https://www.bb.org.bd/en/index.php/about/deptdtl/11)
- [Digital Bank Guidelines](https://www.bb.org.bd/aboutus/regulationguideline/brpd/digitalbank_version-2_english.pdf)

### Apache Fineract
- GitHub: https://github.com/apache/fineract
- Documentation: https://fineract.apache.org/docs/current/
- API Sandbox: https://demo.fineract.dev/

### Technology Documentation
- Spring Boot: https://docs.spring.io/spring-boot/
- React: https://react.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- Kubernetes: https://kubernetes.io/docs/

---

## Contact Information

**Unisoft Systems Limited**
- **Address**: Youth Tower, Begum Rokeya Sarani, Dhaka, Bangladesh
- **Phone**: +880 1709-642404
- **Email**: office@uslbd.com
- **Website**: www.uslbd.com
- **Parent Company**: Smart Technologies BD Ltd

---

## Document Version

- **AGENTS.md Version**: 2.0
- **Last Updated**: February 3, 2026
- **Project**: ULMS (Unisoft Loan Management System) v2.0
- **Status**: Implementation Phase - Ready for Development
- **Prepared For**: AI Coding Agents & Development Team

### Major Changes in Version 2.0

- Added comprehensive implementation documentation suite
- Added Technical Document Writing skill
- Added Development Team structure and responsibilities
- Updated Technology Stack to v2.0 (Apache Fineract based)
- Added compliance validation documentation
- Added 49-document implementation roadmap

---

*This file should be updated whenever significant structural changes are made to the project or new document categories are introduced.*
