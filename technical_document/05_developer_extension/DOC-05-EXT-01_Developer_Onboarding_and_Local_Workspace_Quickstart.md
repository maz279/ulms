---
type: tutorial
topic: developer_onboarding_and_workspace_quickstart
target_audience: [developer, intern, contractor, tech_lead]
version: 2026.10
document_id: DOC-05-EXT-01
---

# DOC-05-EXT-01: Developer Onboarding & Local Workspace Quickstart

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Developer Onboarding & Local Workspace Quickstart |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Developer Onboarding Tutorial |
| **Status** | Approved Master Onboarding Guide |
| **Authority Chain** | `LMS_CODEBASE/README.md` → `README_Documentation_Guide.md` → `Technology_Stack_Recommendation_v3.md` |
| **Target Codebase** | `c:\software_project\mim_project\LMS\LMS_CODEBASE` |

---

## 1. Welcome to the ULMS v2.0 Engineering Team

Welcome to the **Unisoft Loan Management System (ULMS v2.0)** core engineering group. ULMS is an enterprise-grade core lending platform engineered for scheduled commercial banks in Bangladesh, built upon Spring Boot 4, Apache Fineract CE (digest-pinned) Community Edition, PostgreSQL 17, and React 19.

### The 3-Developer Core Principles
Because our team operates with high velocity and precision, every engineer adheres to three non-negotiable engineering laws:
1. **Zero Hallucination / Evidence Basis:** Code never lies; test assertions prove behavior. Spec documents and implementation must maintain 100% mutual parity.
2. **Modular Monolith Discipline:** Never violate Spring Modulith package boundaries. Cross-module database joins or unmediated circular dependencies are build-breaking violations.
3. **Continuous Local Verification:** Run unit oracles, contract checks, and architectural boundary tests locally before opening a pull request.

---

## 2. Workstation Tooling Installation & Prerequisites

Ensure the following tools are installed and configured on your development machine prior to cloning the codebase:

### 2.1 Tooling Matrix

| Tool / Runtime | Required Version | Verification Command | Purpose |
|---|---|---|---|
| **Java Development Kit** | OpenJDK 21 LTS (Eclipse Temurin) | `java -version` | Backend Spring Boot 4 & Fineract compilation |
| **Node.js** | v20.x LTS or higher | `node -v` | Frontend build, Vite dev server, mock API |
| **npm** | 10.x or higher | `npm -v` | Frontend dependency management |
| **Container Engine** | Docker Desktop 24+ / Rancher | `docker --version` | Local PostgreSQL 17, Redis, Keycloak stack |
| **Git CLI** | 2.40+ | `git --version` | Version control & conventional commits |
| **Python** | 3.11+ | `python --version` | Build scripting & Word document generation |

### 2.2 Windows PowerShell Execution Policy Configuration
If developing on Windows, PowerShell script execution policies may block npm/npx wrappers. Run the following command in an administrative PowerShell terminal:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Alternatively, execute build commands via standard command prompt (`cmd /c`) or bash.

---

## 3. Repository Architecture & Directory Structure

Clone the repository and inspect the primary workspace layout:
```bash
git clone <REPOSITORY_URL>
cd LMS_CODEBASE
```

```
LMS_CODEBASE/
├── apps/
│   ├── api/             # Spring Boot 4 Modular Monolith (Java 21, Gradle, 9 domain modules)
│   ├── web/             # Staff Web Application (React 19, TypeScript, MUI v7, Vite 7)
│   └── mobile/          # Cross-Platform Mobile App (React Native, Expo 54+)
├── packages/
│   └── openapi/         # Authoritative REST API Specifications (ulms-api.yaml)
├── deploy/
│   ├── compose/         # Docker Compose local stack (Postgres, Keycloak, Fineract, MinIO, Prometheus, Grafana)
│   └── k3s/             # Production Helm chart lives at deploy/chart/ulms
└── e2e/                 # Playwright End-to-End Test Harness (12 journey suites)
```

---

## 4. Local Development Workflows

ULMS supports two primary developer workflows depending on your immediate focus:

### Workflow A: Full-Stack Containerized Mode
Use this when modifying cross-service integrations, authentication flows, or database schemas:
```bash
# 1. Start the supporting infrastructure stack
cd deploy/compose
docker compose up -d postgres keycloak fineract minio

# 2. Run backend API from IDE or terminal
cd ../../apps/api
./gradlew bootRun --args='--spring.profiles.active=dev'

# 3. Start the React frontend
cd ../web
npm install
npm run dev
```

### Workflow B: Fast Frontend & Mock API Mode (Zero Docker Overhead)
Use this when developing user interfaces, wizards, or reports without needing Docker containers:
```bash
cd apps/web
npm install

# Start standalone contract mock API server (Port 8081)
npm run mock:api &

# Start Vite 7 development server with HMR (Port 5173)
npm run dev
```
The staff web application will launch at `http://localhost:5173` connected to the OpenAPI-compliant mock API.

---

## 5. End-to-End Hands-On Tutorial: Adding a New Field

Follow this step-by-step walkthrough to make your first verified feature contribution across the full stack: adding an optional **Tax Identification Number (TIN)** to the Customer entity.

### Step 1: Create a Feature Branch
```bash
git checkout -b feat/customer-tax-id-field
```

### Step 2: Create a Versioned Flyway Database Migration
Create a new migration file in `apps/api/src/main/resources/db/migration/V18__field_gateway.sql`:
```sql
-- Migration: V019__add_customer_tin.sql
-- Purpose: Add statutory Tax Identification Number (TIN) field to Customer entity

ALTER TABLE ulms.customer
ADD COLUMN IF NOT EXISTS tax_identification_number VARCHAR(32);

COMMENT ON COLUMN ulms.customer.tax_identification_number IS 
'National Board of Revenue (NBR) 12-digit Taxpayer Identification Number (TIN)';

CREATE INDEX IF NOT EXISTS idx_customers_tin 
ON ulms.customer (tax_identification_number) 
WHERE tax_identification_number IS NOT NULL;
```

### Step 3: Update the JPA Domain Entity
Edit `apps/api/src/main/java/com/uslbd/ulms/customer/Customer.java`:
```java
@Column(name = "tax_identification_number", length = 32)
private String taxIdentificationNumber;

public String getTaxIdentificationNumber() {
    return taxIdentificationNumber;
}

public void setTaxIdentificationNumber(String taxIdentificationNumber) {
    this.taxIdentificationNumber = taxIdentificationNumber;
}
```

### Step 4: Update the OpenAPI Contract Specification
Edit `packages/openapi/ulms-api.yaml` under `components.schemas.CustomerResponse`:
```yaml
taxIdentificationNumber:
  type: string
  maxLength: 32
  example: "876543210987"
  description: "NBR Taxpayer Identification Number (TIN)"
```

### Step 5: Update the React 19 UI & Zod Validation
Edit `apps/web/src/features/customer/CustomerPage.tsx`:
```tsx
const customerSchema = z.object({
  fullName: z.string().min(3),
  nidNumber: z.string().length(10),
  taxIdentificationNumber: z.string().max(32).optional(),
});
```

### Step 6: Verify Architecture Boundaries & Test Suites
Execute the architectural boundary check and domain tests:
```bash
cd apps/api
./gradlew test --tests com.uslbd.ulms.ModularityTest
./gradlew test --tests com.uslbd.ulms.customer.*

cd ../web
npm run test:unit
npm run typecheck
```
*Assertion: All tests must pass with zero modularity violations or TypeScript errors.*

---

## 6. Integrated Development Environment (IDE) Configuration

### 6.1 IntelliJ IDEA Recommendations
1. **Annotation Processing:** Enable under `Settings -> Build, Execution, Deployment -> Compiler -> Annotation Processors` (required for Lombok and MapStruct).
2. **Code Style:** Import `config/ide/intellij-java-google-style.xml`.
3. **Gradle JVM:** Ensure Project SDK and Gradle JVM are set to Java 21 (Temurin-21).

### 6.2 Visual Studio Code Recommendations
Install the following essential extensions:
- **Extension Pack for Java** (`vscjava.vscode-java-pack`)
- **Lombok Annotations Support** (`gabrielbb.vscode-lombok`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier Code Formatter** (`esbenp.prettier-vscode`)

---

## 7. Git Workflow & Conventional Commits

All commit messages must adhere to the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Allowed Types:
- `feat`: A new user-facing feature or API capability.
- `fix`: A bug fix or boundary correction.
- `docs`: Documentation updates or runbook additions.
- `refactor`: Code restructuring with zero behavioral change.
- `test`: Adding or refactoring automated test suites.
- `chore`: Build dependencies, Gradle/npm scripts, or CI updates.

### Pre-PR Checklist:
- [ ] `./gradlew test` passes with zero failures.
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run test:unit` passes.
- [ ] Code formatted with Google Java Style / Prettier.
- [ ] No hardcoded secrets, passwords, or internal URLs.

---

*— End of Developer Onboarding & Local Workspace Quickstart Guide —*


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Corrections (v3.1.0): Vite dev server is :5173 (3000 is Grafana); there is no Redis service; the Helm chart is deploy/chart/ulms; migration guidance fixed to create the next free version (V19+) — never recreate V18.
