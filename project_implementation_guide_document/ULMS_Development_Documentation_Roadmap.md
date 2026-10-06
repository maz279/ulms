# ULMS Development Documentation Roadmap
## Comprehensive Guide for 3-Developer Team Implementation
### Unisoft Loan Management System v2.0 - Apache Fineract Based

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | ULMS Development Documentation Roadmap |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Senior Technical Architect & Project Manager |
| **Target Audience** | Development Team (1 Lead + 2 Developers) |
| **Development Environment** | Linux OS, VS Code, Vite/HMR, Local Dev Server |

---

## Table of Contents

1. [Team Structure & Responsibilities](#1-team-structure--responsibilities)
2. [Phase 0: Project Initiation](#2-phase-0-project-initiation)
3. [Phase 1: Architecture & Design](#3-phase-1-architecture--design)
4. [Phase 2: Development Environment Setup](#4-phase-2-development-environment-setup)
5. [Phase 3: Backend Development](#5-phase-3-backend-development)
6. [Phase 4: Frontend Development](#6-phase-4-frontend-development)
7. [Phase 5: Integration & Testing](#7-phase-5-integration--testing)
8. [Phase 6: Deployment & DevOps](#8-phase-6-deployment--devops)
9. [Documentation Templates](#9-documentation-templates)
10. [Appendices](#10-appendices)

---

## 1. Team Structure & Responsibilities

### 1.1 Team Composition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT TEAM STRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TECHNICAL LEAD (Lead Dev)                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ Responsibilities:                                             │  │   │
│  │  │ • Architecture oversight                                      │  │   │
│  │  │ • Code review & quality assurance                             │  │   │
│  │  │ • Backend microservices (CIB, BRPD, Workflow)                 │  │   │
│  │  │ • Database design & optimization                              │  │   │
│  │  │ • DevOps & CI/CD pipeline                                     │  │   │
│  │  │ • Integration architecture                                    │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│              ┌─────────────────────┼─────────────────────┐                  │
│              │                     │                     │                  │
│              ▼                     ▼                     ▼                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  DEVELOPER 1     │  │  DEVELOPER 2     │  │  SHARED RESPONSIBILITIES    │
│  │  (Frontend Lead) │  │  (Backend/Mobile)│  │                             │
│  ├──────────────────┤  ├──────────────────┤  │ • Daily standups            │
│  │ • React Frontend │  │ • Fineract Core  │  │ • Sprint planning           │
│  │ • UI/UX Components│  │ • Custom Services│  │ • Code reviews              │
│  │ • State Management│  │ • API Development│  │ • Documentation updates     │
│  │ • i18n (Bengali) │  │ • CPV Mobile App │  │ • Bug fixes                 │
│  │ • Vite/HMR Setup │  │ • Offline Sync   │  │ • Testing support           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Skill Requirements Matrix

| Technology | Lead Dev | Dev 1 (Frontend) | Dev 2 (Backend) |
|------------|----------|------------------|-----------------|
| **Java 21 / Spring Boot** | Expert | Basic | Expert |
| **React 18 / TypeScript** | Advanced | Expert | Intermediate |
| **PostgreSQL** | Expert | Basic | Advanced |
| **Apache Fineract** | Expert | - | Advanced |
| **React Native** | Intermediate | - | Expert |
| **Docker / Kubernetes** | Expert | Basic | Intermediate |
| **Kafka / Redis** | Advanced | - | Intermediate |
| **Camunda BPMN** | Expert | - | Intermediate |

---

## 2. Phase 0: Project Initiation

### 2.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 0.1 | Project Kickoff Meeting Minutes | Lead Dev | `docs/00-initiation/kickoff-meeting.md` | Critical |
| 0.2 | Team Onboarding Guide | Lead Dev | `docs/00-initiation/team-onboarding.md` | Critical |
| 0.3 | Development Standards & Guidelines | Lead Dev | `docs/00-initiation/coding-standards.md` | Critical |
| 0.4 | Communication Plan | Lead Dev | `docs/00-initiation/communication-plan.md` | High |
| 0.5 | Risk Register | Lead Dev | `docs/00-initiation/risk-register.md` | High |
| 0.6 | Sprint Planning Template | Lead Dev | `docs/00-initiation/sprint-template.md` | High |

### 2.2 Required Document: Project Kickoff Meeting Minutes

**Template Location:** `docs/00-initiation/kickoff-meeting.md`

```markdown
# Project Kickoff Meeting - ULMS v2.0

**Date:** [Insert Date]  
**Attendees:** [Lead Dev], [Dev 1], [Dev 2], [Project Manager], [Business Analyst]  
**Location:** Virtual/Physical

## 1. Project Overview
- Project: Unisoft Loan Management System v2.0
- Timeline: 10 months (4 phases)
- Budget: [Insert]
- Target: Bangladesh Banking Sector (62 banks)

## 2. Team Roles Confirmation
| Role | Name | Responsibilities |
|------|------|-----------------|
| Technical Lead | [Name] | Architecture, Backend, DevOps |
| Frontend Developer | [Name] | React UI, Web Components |
| Backend/Mobile Dev | [Name] | Fineract, APIs, React Native |

## 3. Key Decisions
- [ ] Development environment confirmed (Linux, VS Code)
- [ ] Git workflow selected (Git Flow / Trunk Based)
- [ ] Communication tools selected (Slack, Jira, Confluence)
- [ ] Meeting schedule confirmed (Daily standup: 10 AM)

## 4. Immediate Actions
- [ ] Environment setup (Week 1)
- [ ] Architecture document review (Week 1)
- [ ] Sprint 1 planning (Week 2)

## 5. Questions & Concerns
| Question | Raised By | Answer/Action |
|----------|-----------|---------------|
| | | |

## 6. Next Meeting
**Date:** [Insert]  
**Purpose:** Sprint 1 Planning
```

### 2.3 Required Document: Team Onboarding Guide

**Template Location:** `docs/00-initiation/team-onboarding.md`

```markdown
# ULMS Team Onboarding Guide

## 1. Development Environment Setup (Linux)

### 1.1 Operating System Requirements
- **OS:** Ubuntu 22.04 LTS or equivalent
- **Memory:** Minimum 16GB RAM (32GB recommended)
- **Storage:** 100GB free space (SSD recommended)
- **Network:** Stable internet for package downloads

### 1.2 Required Software Installation

#### Java Development Kit
```bash
# Install Eclipse Temurin JDK 21
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install temurin-21-jdk
java -version  # Verify: openjdk version "21.0.2"
```

#### Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Verify: v20.x.x
npm -v   # Verify: 10.x.x
```

#### VS Code Setup
```bash
# Install VS Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
rm -f packages.microsoft.gpg
sudo apt update
sudo apt install code
```

#### Required VS Code Extensions
Install these extensions (via CLI or GUI):
```bash
code --install-extension vscjava.vscode-java-pack
code --install-extension vmware.vscode-boot-dev-pack
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode-remote.remote-containers
code --install-extension ms-vscode.docker
code --install-extension ms-vscode.git-graph
code --install-extension github.copilot
code --install-extension rangav.vscode-thunder-client
code --install-extension ms-vscode.rest-client
code --install-extension streetsidesoftware.code-spell-checker
```

#### Database Setup
```bash
# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Install Redis
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### Docker & Docker Compose
```bash
# Install Docker
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 2. Project Repository Setup

### 2.1 Clone Repository
```bash
mkdir -p ~/projects/unisoft
cd ~/projects/unisoft
git clone https://github.com/unisoft/lms.git
cd lms
```

### 2.2 Git Configuration
```bash
git config user.name "Your Name"
git config user.email "your.email@unisoft.com.bd"
git config init.defaultBranch main

# Setup Git Flow (optional but recommended)
sudo apt install git-flow
git flow init
```

## 3. Local Development Environment

### 3.1 Environment Variables
Create `.env` file in project root:
```bash
# Database
POSTGRES_USER=ulms_dev
POSTGRES_PASSWORD=dev_password_123
POSTGRES_DB=ulms_development

# Redis
REDIS_URL=redis://localhost:6379/0

# Fineract
FINERACT_SERVER_URL=http://localhost:8443
FINERACT_DEFAULT_TENANT=default

# Security
JWT_SECRET=your-dev-secret-key-change-in-production
ENCRYPTION_KEY=dev-encryption-key-32-chars-long

# External APIs (Mock for development)
CIB_API_URL=https://mock-cib-api.local
NID_API_URL=https://mock-nid-api.local
```

## 4. IDE Configuration

### 4.1 VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.format.enable": true,
  "prettier.requireConfig": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.gradle": true,
    "**/build": true,
    "**/dist": true
  }
}
```

## 5. Communication Channels

| Channel | Purpose | Check Frequency |
|---------|---------|-----------------|
| Slack #ulms-dev | Daily communication | Continuous |
| Slack #ulms-alerts | Build failures, alerts | As needed |
| Jira | Task tracking | Daily |
| Confluence | Documentation | As needed |
| Google Meet | Video calls | Scheduled |

## 6. Development Workflow

### 6.1 Daily Routine
1. **Morning (9:30 AM):** Check Slack, review PRs
2. **Standup (10:00 AM):** 15-min sync
3. **Development:** Focus time with breaks
4. **Evening (5:30 PM):** Commit code, update Jira

### 6.2 Code Review Process
1. Create feature branch from `develop`
2. Implement feature with tests
3. Run local tests and linting
4. Create Pull Request to `develop`
5. Minimum 1 approval required (Lead Dev for critical)
6. Merge after CI passes
```

---

## 3. Phase 1: Architecture & Design

### 3.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 1.1 | System Architecture Document | Lead Dev | `docs/01-architecture/system-architecture.md` | Critical |
| 1.2 | Database Schema Design | Lead Dev | `docs/01-architecture/database-schema.md` | Critical |
| 1.3 | API Design Specification | Lead Dev | `docs/01-architecture/api-design.md` | Critical |
| 1.4 | Frontend Component Architecture | Dev 1 | `docs/01-architecture/frontend-architecture.md` | Critical |
| 1.5 | Security Architecture | Lead Dev | `docs/01-architecture/security-architecture.md` | Critical |
| 1.6 | Integration Architecture | Lead Dev | `docs/01-architecture/integration-architecture.md` | High |
| 1.7 | Workflow Design (BPMN) | Lead Dev | `docs/01-architecture/workflow-design.md` | High |
| 1.8 | Deployment Architecture | Lead Dev | `docs/01-architecture/deployment-architecture.md` | High |

### 3.2 Required Document: System Architecture

**Template Location:** `docs/01-architecture/system-architecture.md`

```markdown
# ULMS System Architecture Document

## 1. Architectural Overview

### 1.1 High-Level Architecture
```
[Include the architecture diagram from Technology Stack v2.0]
```

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React + TypeScript | 18.2 / 5.3 | Web UI |
| **Mobile** | React Native | 0.73 | CPV App |
| **Backend Core** | Apache Fineract | 1.10 | Loan lifecycle |
| **Backend Services** | Spring Boot | 3.2 | Custom modules |
| **Database** | PostgreSQL | 16 | Primary storage |
| **Cache** | Redis | 7 | Performance |
| **Message Queue** | Apache Kafka | 3.6 | Events |
| **Workflow** | Camunda | 8.3 | Approvals |
| **Auth** | Keycloak | 23 | IAM |
| **DevOps** | Kubernetes | 1.28 | Orchestration |

### 1.3 Microservices Breakdown

#### Core Fineract Services (Extended)
| Service | Responsibility | Customization |
|---------|---------------|---------------|
| `loan-service` | Loan lifecycle | BRPD hooks |
| `client-service` | Customer management | NID integration |
| `accounting-service` | GL postings | Bangladesh COA |
| `scheduler-service` | DPD calculation | Classification job |

#### ULMS Custom Microservices
| Service | Owner | Endpoints | Priority |
|---------|-------|-----------|----------|
| `cib-service` | Lead Dev | 8 | Critical |
| `nid-ekyc-service` | Dev 2 | 6 | Critical |
| `workflow-service` | Lead Dev | 12 | Critical |
| `document-service` | Dev 2 | 10 | High |
| `brpd-service` | Lead Dev | 6 | Critical |
| `notification-service` | Dev 2 | 4 | Medium |
| `analytics-service` | Dev 2 | 8 | Medium |
| `integration-gateway` | Lead Dev | - | High |

## 2. Data Flow Architecture

### 2.1 Loan Application Flow
```
[Detailed sequence diagram for loan application]
```

### 2.2 CIB Integration Flow
```
[Detailed integration flow diagram]
```

## 3. Security Architecture

### 3.1 Authentication Flow
```
[OAuth 2.0 / JWT flow diagram]
```

### 3.2 Authorization Matrix
| Resource | BRANCH_USER | CREDIT_ANALYST | BRANCH_MANAGER | MD |
|----------|-------------|----------------|----------------|-----|
| /loans (GET) | ✓ | ✓ | ✓ | ✓ |
| /loans (POST) | ✓ | ✓ | ✓ | ✓ |
| /cib/inquiry | - | ✓ | ✓ | ✓ |
| /approvals/{id} | - | - | ✓ | ✓ |

## 4. Scalability Design

### 4.1 Horizontal Scaling Strategy
- Kubernetes HPA configuration
- Database read replicas
- Caching strategy

### 4.2 Performance Targets
| Metric | Target | Strategy |
|--------|--------|----------|
| Response Time | <500ms | Caching, optimization |
| Throughput | 500 RPS | Load balancing |
| Concurrent Users | 1000+ | Horizontal scaling |
```

### 3.3 Required Document: Database Schema Design

**Template Location:** `docs/01-architecture/database-schema.md`

```markdown
# ULMS Database Schema Design

## 1. Multi-Tenant Strategy

### 1.1 Schema-per-Tenant Approach
```sql
-- Master tenant table
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(20) UNIQUE NOT NULL,  -- e.g., 'BANK001'
    schema_name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'bank_001'
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schema creation template
CREATE SCHEMA bank_001;
SET search_path TO bank_001, public;
```

## 2. Core Tables

### 2.1 Customer Management
```sql
-- Extended from Fineract m_client
CREATE TABLE bank_001.ulms_customers (
    id BIGSERIAL PRIMARY KEY,
    fineract_client_id BIGINT REFERENCES bank_001.m_client(id),
    
    -- NID Information
    nid_number VARCHAR(20) UNIQUE NOT NULL,
    nid_verified BOOLEAN DEFAULT FALSE,
    nid_verified_at TIMESTAMP,
    
    -- Personal Information
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100),
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    spouse_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    marital_status VARCHAR(20),
    
    -- Contact
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    
    -- Address (JSON for flexibility)
    present_address JSONB NOT NULL,
    permanent_address JSONB,
    
    -- Employment
    employment_type VARCHAR(30),
    employer_name VARCHAR(100),
    designation VARCHAR(50),
    monthly_income DECIMAL(15,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_customers_nid ON bank_001.ulms_customers(nid_number);
CREATE INDEX idx_customers_mobile ON bank_001.ulms_customers(mobile_number);
CREATE INDEX idx_customers_name ON bank_001.ulms_customers USING gin(name_en gin_trgm_ops);
```

### 2.2 Loan Applications
```sql
CREATE TABLE bank_001.loan_applications (
    id BIGSERIAL PRIMARY KEY,
    application_no VARCHAR(20) UNIQUE NOT NULL, -- APP-2026-000001
    
    -- Customer Reference
    customer_id BIGINT NOT NULL REFERENCES bank_001.ulms_customers(id),
    
    -- Product
    product_id BIGINT NOT NULL REFERENCES bank_001.loan_products(id),
    
    -- Application Details
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    tenor_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2),
    purpose TEXT,
    
    -- Status Workflow
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'BOCC_REVIEW', 
                   'CREDIT_ANALYSIS', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED')
    ),
    
    -- Credit Assessment
    cib_report_id BIGINT REFERENCES bank_001.cib_reports(id),
    credit_score INTEGER,
    risk_grade VARCHAR(10),
    dbr_percentage DECIMAL(5,2),
    
    -- Approval Hierarchy
    current_approval_level INTEGER DEFAULT 0,
    final_approval_level INTEGER,
    
    -- Timestamps
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_apps_customer ON bank_001.loan_applications(customer_id);
CREATE INDEX idx_apps_status ON bank_001.loan_applications(status);
CREATE INDEX idx_apps_submitted ON bank_001.loan_applications(submitted_at);
```

### 2.3 CIB Reports
```sql
CREATE TABLE bank_001.cib_reports (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Inquiry Details
    customer_id BIGINT REFERENCES bank_001.ulms_customers(id),
    nid_number VARCHAR(20) NOT NULL,
    inquiry_type VARCHAR(20), -- INDIVIDUAL, CORPORATE
    inquiry_purpose VARCHAR(50),
    
    -- CIB Response Data (JSON for flexibility)
    cib_response JSONB,
    cib_score INTEGER,
    risk_grade VARCHAR(10),
    
    -- Summary
    total_facilities INTEGER,
    total_outstanding DECIMAL(15,2),
    total_emi DECIMAL(15,2),
    worst_classification VARCHAR(10),
    max_dpd INTEGER,
    
    -- Metadata
    inquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    
    -- Audit
    created_by VARCHAR(50),
    inquiry_source VARCHAR(50) -- API, BATCH
);

-- Indexes
CREATE INDEX idx_cib_customer ON bank_001.cib_reports(customer_id);
CREATE INDEX idx_cib_nid ON bank_001.cib_reports(nid_number);
CREATE INDEX idx_cib_date ON bank_001.cib_reports(inquiry_date);
```

### 2.4 Loan Classification (BRPD Compliance)
```sql
CREATE TABLE bank_001.loan_classification_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES bank_001.m_loan(id),
    
    -- Classification
    previous_classification VARCHAR(10),
    new_classification VARCHAR(10) CHECK (
        new_classification IN ('STD-0', 'STD-1', 'STD-2', 'SMA', 'SS', 'DF', 'BL')
    ),
    
    -- DPD Information
    days_past_due INTEGER,
    outstanding_amount DECIMAL(15,2),
    
    -- Provision
    provision_rate DECIMAL(5,2),
    provision_amount DECIMAL(15,2),
    
    -- Change Date
    change_date DATE NOT NULL,
    change_reason VARCHAR(100),
    
    -- System
    calculated_by VARCHAR(50) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_class_loan ON bank_001.loan_classification_history(loan_id);
CREATE INDEX idx_class_date ON bank_001.loan_classification_history(change_date);
```

## 3. Partitioning Strategy

### 3.1 Large Table Partitioning
```sql
-- Partition loan_transactions by month
CREATE TABLE bank_001.m_loan_transaction (
    id BIGSERIAL,
    loan_id BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    -- ... other columns
    PRIMARY KEY (id, transaction_date)
) PARTITION BY RANGE (transaction_date);

-- Create monthly partitions
CREATE TABLE bank_001.m_loan_transaction_2026_01 
    PARTITION OF bank_001.m_loan_transaction
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

## 4. Entity Relationship Diagram

```
[Include ERD diagram or reference]
```
```

---

## 4. Phase 2: Development Environment Setup

### 4.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 2.1 | Local Development Setup Guide | Lead Dev | `docs/02-setup/local-dev-setup.md` | Critical |
| 2.2 | Docker Compose Configuration | Lead Dev | `docker/docker-compose.yml` | Critical |
| 2.3 | Fineract Local Installation | Dev 2 | `docs/02-setup/fineract-setup.md` | Critical |
| 2.4 | Frontend Development Setup | Dev 1 | `docs/02-setup/frontend-setup.md` | Critical |
| 2.5 | Database Seeding Scripts | Lead Dev | `scripts/db-seed/` | High |
| 2.6 | VS Code Workspace Configuration | Dev 1 | `.vscode/` | Medium |

### 4.2 Required Document: Local Development Setup

**Template Location:** `docs/02-setup/local-dev-setup.md`

```markdown
# Local Development Environment Setup

## Quick Start (5-minute setup)

### Step 1: Clone and Start Infrastructure
```bash
git clone https://github.com/unisoft/lms.git
cd lms

# Start infrastructure services (PostgreSQL, Redis, Kafka)
docker-compose -f docker/docker-compose.infra.yml up -d

# Verify
docker ps
```

### Step 2: Start Fineract Backend
```bash
# Terminal 1 - Fineract
cd backend/fineract
./gradlew bootRun

# Wait for "Started Fineract in XX seconds"
```

### Step 3: Start ULMS Custom Services
```bash
# Terminal 2 - CIB Service
cd backend/cib-service
./mvnw spring-boot:run

# Terminal 3 - Other services (use tmux/screen for multiple)
cd backend/services
./start-services.sh
```

### Step 4: Start Frontend
```bash
# Terminal 4 - React Frontend
cd frontend/ulms-web
npm install
npm run dev

# Access: http://localhost:5173
```

## Detailed Setup

### Fineract Configuration
```properties
# fineract-local.properties
fineract.tenants.host=localhost
fineract.tenants.port=5432
fineract.tenants.username=postgres
fineract.tenants.password=postgres

fineract.node.id=1
fineract.database.hostname=localhost
fineract.database.port=5432
fineract.database.username=fineract
fineract.database.password=fineract
```

### Frontend Environment
```bash
# frontend/ulms-web/.env.local
VITE_API_BASE_URL=http://localhost:8443/fineract-provider/api/v1
VITE_AUTH_URL=http://localhost:8080/auth
VITE_CIB_SERVICE_URL=http://localhost:8081
```
```

---

## 5. Phase 3: Backend Development

### 5.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 3.1 | CIB Service Implementation Guide | Lead Dev | `docs/03-backend/cib-service.md` | Critical |
| 3.2 | NID/e-KYC Service Guide | Dev 2 | `docs/03-backend/nid-service.md` | Critical |
| 3.3 | Workflow Engine Setup (Camunda) | Lead Dev | `docs/03-backend/workflow-service.md` | Critical |
| 3.4 | Document Management Service | Dev 2 | `docs/03-backend/document-service.md` | High |
| 3.5 | BRPD Compliance Service | Lead Dev | `docs/03-backend/brpd-service.md` | Critical |
| 3.6 | Notification Service | Dev 2 | `docs/03-backend/notification-service.md` | Medium |
| 3.7 | API Integration Guide | Lead Dev | `docs/03-backend/api-integration.md` | High |
| 3.8 | Backend Testing Strategy | Lead Dev | `docs/03-backend/testing-strategy.md` | High |

### 5.2 Required Document: CIB Service Implementation

**Template Location:** `docs/03-backend/cib-service.md`

```markdown
# CIB Integration Service Implementation

## 1. Service Overview

**Service Name:** `cib-service`  
**Port:** 8081  
**Base URL:** `http://localhost:8081/api/v1/cib`

## 2. API Endpoints

### 2.1 Online CIB Inquiry
```java
@RestController
@RequestMapping("/api/v1/cib")
@RequiredArgsConstructor
@Slf4j
public class CibController {
    
    private final CibInquiryService inquiryService;
    private final CibCacheService cacheService;
    
    @PostMapping("/inquiry")
    public ResponseEntity<CibReportResponse> inquiry(
            @Valid @RequestBody CibInquiryRequest request,
            @AuthenticationPrincipal Jwt principal) {
        
        log.info("CIB inquiry for NID: {}, by user: {}", 
            maskNid(request.getNidNumber()), principal.getSubject());
        
        // Check cache first
        Optional<CibReportResponse> cached = cacheService.get(request.getNidNumber());
        if (cached.isPresent()) {
            log.debug("CIB cache hit for NID: {}", maskNid(request.getNidNumber()));
            return ResponseEntity.ok(cached.get());
        }
        
        // Call CIB Online API
        CibReportResponse report = inquiryService.inquiry(request);
        
        // Cache for 1 hour
        cacheService.put(request.getNidNumber(), report, Duration.ofHours(1));
        
        // Audit log
        auditService.logCibInquiry(request, report, principal.getSubject());
        
        return ResponseEntity.ok(report);
    }
}
```

### 2.2 Request/Response DTOs
```java
@Data
@Builder
public class CibInquiryRequest {
    @NotBlank
    @Pattern(regexp = "\\d{10,17}")
    private String nidNumber;
    
    @NotNull
    private InquiryType inquiryType; // INDIVIDUAL, CORPORATE
    
    private String applicationId; // For audit linking
}

@Data
@Builder
public class CibReportResponse {
    private String inquiryId;
    private LocalDateTime inquiryDate;
    private String status;
    
    private SubjectInfo subject;
    private List<FacilityInfo> facilities;
    private SummaryInfo summary;
    
    @Data
    public static class SubjectInfo {
        private String name;
        private String nidNumber; // Masked
        private Integer cibScore;
        private String riskGrade;
    }
}
```

### 2.3 External API Integration
```java
@Service
@RequiredArgsConstructor
public class CibOnlineApiClient {
    
    private final WebClient webClient;
    private final CibProperties properties;
    
    public CibApiResponse callCibOnline(CibInquiryRequest request) {
        try {
            return webClient.post()
                .uri(properties.getApiUrl() + "/inquiry")
                .header("Authorization", "Bearer " + getAccessToken())
                .header("X-Client-Certificate", properties.getClientCert())
                .bodyValue(mapToCibApiRequest(request))
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
                .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
                .bodyToMono(CibApiResponse.class)
                .timeout(Duration.ofSeconds(30))
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                    .filter(this::isRetryableError))
                .block();
        } catch (WebClientResponseException e) {
            throw new CibIntegrationException("CIB API error: " + e.getMessage(), e);
        }
    }
}
```

## 3. Configuration

### application.yml
```yaml
spring:
  application:
    name: cib-service
  
  datasource:
    url: jdbc:postgresql://localhost:5432/ulms_cib
    username: ${DB_USER:cib_user}
    password: ${DB_PASSWORD:}
  
  redis:
    host: localhost
    port: 6379
    database: 1

cib:
  api:
    url: ${CIB_API_URL:https://cib.bb.org.bd/api/v1}
    client-id: ${CIB_CLIENT_ID:}
    client-secret: ${CIB_CLIENT_SECRET:}
    certificate-path: ${CIB_CERT_PATH:}
  
  cache:
    ttl-minutes: 60
    max-entries: 10000

resilience4j:
  circuitbreaker:
    instances:
      cib-api:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
```

## 4. Testing

### 4.1 Unit Tests
```java
@SpringBootTest
class CibInquiryServiceTest {
    
    @MockBean
    private CibOnlineApiClient apiClient;
    
    @Autowired
    private CibInquiryService inquiryService;
    
    @Test
    void shouldReturnCachedReport_whenCacheExists() {
        // Given
        String nid = "1234567890123";
        CibReportResponse cached = createMockReport(nid);
        when(cacheService.get(nid)).thenReturn(Optional.of(cached));
        
        // When
        CibReportResponse result = inquiryService.inquiry(
            CibInquiryRequest.builder().nidNumber(nid).build()
        );
        
        // Then
        assertEquals(cached.getInquiryId(), result.getInquiryId());
        verify(apiClient, never()).callCibOnline(any());
    }
}
```

### 4.2 Integration Tests
```bash
# Run CIB service tests
./mvnw test -pl cib-service

# Run with coverage
./mvnw verify -pl cib-service
```
```

---

## 6. Phase 4: Frontend Development

### 6.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 4.1 | Frontend Architecture Guide | Dev 1 | `docs/04-frontend/architecture.md` | Critical |
| 4.2 | Component Library Documentation | Dev 1 | `docs/04-frontend/component-library.md` | Critical |
| 4.3 | State Management Guide | Dev 1 | `docs/04-frontend/state-management.md` | Critical |
| 4.4 | i18n (Bengali) Implementation | Dev 1 | `docs/04-frontend/internationalization.md` | Critical |
| 4.5 | Form Handling & Validation | Dev 1 | `docs/04-frontend/form-handling.md` | High |
| 4.6 | API Integration (React Query) | Dev 1 | `docs/04-frontend/api-integration.md` | High |
| 4.7 | Dashboard & Reporting UI | Dev 1 | `docs/04-frontend/dashboard-ui.md` | High |
| 4.8 | Frontend Testing Strategy | Dev 1 | `docs/04-frontend/testing-strategy.md` | High |

### 6.2 Required Document: Frontend Architecture

**Template Location:** `docs/04-frontend/architecture.md`

```markdown
# Frontend Architecture Guide

## 1. Project Structure

```
frontend/ulms-web/
├── public/
│   ├── locales/           # i18n files
│   │   ├── bn/           # Bengali
│   │   └── en/           # English
│   └── assets/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── los/          # Loan Origination
│   │   ├── credit/       # Credit Management
│   │   ├── workflow/     # Approval Workflow
│   │   ├── disbursement/ # Disbursement
│   │   ├── servicing/    # Loan Servicing
│   │   ├── collections/  # Collections
│   │   ├── reporting/    # Reports
│   │   └── admin/        # Administration
│   ├── shared/           # Shared components
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── utils/        # Utilities
│   │   └── types/        # TypeScript types
│   ├── services/         # API services
│   │   ├── api/          # API clients
│   │   ├── auth/         # Auth service
│   │   └── websocket/    # WS service
│   ├── store/            # Redux store
│   ├── i18n/             # i18n config
│   ├── theme/            # MUI theme
│   └── App.tsx
├── tests/
├── .env.local
├── vite.config.ts
└── package.json
```

## 2. Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | React | 18.2 | UI Library |
| Language | TypeScript | 5.3 | Type Safety |
| Build Tool | Vite | 5.0 | Fast builds, HMR |
| UI Library | Material-UI | 5.15 | Components |
| State | Redux Toolkit + RTK Query | 2.0 | State & API |
| Routing | React Router | 6.21 | Navigation |
| Forms | React Hook Form + Zod | 7.49 | Forms & Validation |
| i18n | react-i18next | 14.0 | Localization |
| Charts | Recharts | 2.10 | Data viz |
| PDF | react-pdf | 7.6 | PDF generation |
| Testing | Vitest + React Testing Library | - | Testing |

## 3. Module Structure Example (LOS)

```
src/modules/los/
├── components/
│   ├── CustomerForm/
│   │   ├── CustomerForm.tsx
│   │   ├── CustomerForm.test.tsx
│   │   └── index.ts
│   ├── ApplicationList/
│   ├── DocumentUpload/
│   └── BOCCMeeting/
├── hooks/
│   ├── useCustomer.ts
│   ├── useApplications.ts
│   └── useDocumentUpload.ts
├── services/
│   ├── customerApi.ts
│   └── applicationApi.ts
├── types/
│   └── los.types.ts
└── index.ts
```

## 4. State Management Pattern

### 4.1 Redux Store Structure
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { losApi } from '../modules/los/services/losApi';
import { cibApi } from '../modules/credit/services/cibApi';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    [losApi.reducerPath]: losApi.reducer,
    [cibApi.reducerPath]: cibApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .concat(losApi.middleware)
      .concat(cibApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 4.2 API Service with RTK Query
```typescript
// modules/los/services/losApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const losApi = createApi({
  reducerPath: 'losApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Application', 'Customer'],
  endpoints: (builder) => ({
    getApplications: builder.query<Application[], void>({
      query: () => '/loans/applications',
      providesTags: ['Application'],
    }),
    
    createApplication: builder.mutation<Application, CreateApplicationRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Application'],
    }),
    
    // NID auto-fill endpoint
    verifyNid: builder.query<NidVerificationResponse, string>({
      query: (nidNumber) => `/customers/verify-nid/${nidNumber}`,
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useCreateApplicationMutation,
  useVerifyNidQuery,
} = losApi;
```

## 5. Component Example

### 5.1 Customer Form with NID Auto-fill
```typescript
// modules/los/components/CustomerForm/CustomerForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVerifyNidQuery } from '../../services/losApi';
import { TextField, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

const customerSchema = z.object({
  nidNumber: z.string().regex(/^\d{10,17}$/, 'Invalid NID'),
  nameEn: z.string().min(1, 'Name is required'),
  nameBn: z.string().optional(),
  mobileNumber: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid mobile'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomerForm: React.FC = () => {
  const { t } = useTranslation('los');
  const { register, handleSubmit, setValue, watch, formState: { errors } } = 
    useForm<CustomerFormData>({
      resolver: zodResolver(customerSchema),
    });
  
  const nidNumber = watch('nidNumber');
  const { data: nidData, isLoading: isVerifying } = useVerifyNidQuery(
    nidNumber!, 
    { skip: !nidNumber || nidNumber.length < 10 }
  );
  
  // Auto-fill on NID verification
  React.useEffect(() => {
    if (nidData) {
      setValue('nameEn', nidData.nameEn);
      setValue('nameBn', nidData.nameBn);
      setValue('dateOfBirth', nidData.dateOfBirth);
    }
  }, [nidData, setValue]);
  
  const onSubmit = async (data: CustomerFormData) => {
    // Submit logic
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('nidNumber')}
        label={t('customer.nidNumber')}
        error={!!errors.nidNumber}
        helperText={errors.nidNumber?.message}
        InputProps={{
          endAdornment: isVerifying && <CircularProgress size={20} />,
        }}
      />
      
      <TextField
        {...register('nameEn')}
        label={t('customer.nameEn')}
        error={!!errors.nameEn}
        helperText={errors.nameEn?.message}
      />
      
      <TextField
        {...register('nameBn')}
        label={t('customer.nameBn')}
      />
      
      <Button type="submit" variant="contained">
        {t('common.save')}
      </Button>
    </form>
  );
};
```

## 6. i18n (Bengali) Setup

### 6.1 Configuration
```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import bn from './locales/bn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    lng: 'bn', // Default to Bengali
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### 6.2 Translation File Structure
```json
{
  "common": {
    "save": "সংরক্ষণ করুন",
    "cancel": "বাতিল করুন",
    "submit": "জমা দিন",
    "loading": "লোড হচ্ছে..."
  },
  "customer": {
    "nidNumber": "জাতীয় পরিচয়পত্র নম্বর",
    "nameEn": "নাম (ইংরেজি)",
    "nameBn": "নাম (বাংলা)",
    "mobileNumber": "মোবাইল নম্বর"
  },
  "loan": {
    "application": "ঋণ আবেদন",
    "amount": "ঋণের পরিমাণ",
    "tenor": "মেয়াদ (মাস)"
  }
}
```

## 7. Development Workflow

### 7.1 Starting Development Server
```bash
cd frontend/ulms-web
npm install
npm run dev

# Access: http://localhost:5173
# HMR: Enabled for instant updates
```

### 7.2 Building for Production
```bash
npm run build
npm run preview  # Preview production build
```

### 7.3 Running Tests
```bash
npm run test        # Run unit tests
npm run test:ui     # Run with UI
npm run coverage    # Generate coverage report
```
```

---

## 7. Phase 5: Integration & Testing

### 7.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 5.1 | Integration Test Plan | Lead Dev | `docs/05-testing/integration-test-plan.md` | Critical |
| 5.2 | API Contract Testing | Lead Dev | `docs/05-testing/api-contract-testing.md` | Critical |
| 5.3 | E2E Test Scenarios | Dev 1 | `docs/05-testing/e2e-test-scenarios.md` | High |
| 5.4 | Performance Testing Guide | Lead Dev | `docs/05-testing/performance-testing.md` | High |
| 5.5 | Security Testing Checklist | Lead Dev | `docs/05-testing/security-testing.md` | Critical |
| 5.6 | UAT Preparation Guide | Lead Dev | `docs/05-testing/uat-preparation.md` | High |

### 7.2 Required Document: Integration Test Plan

**Template Location:** `docs/05-testing/integration-test-plan.md`

```markdown
# Integration Test Plan

## 1. Test Scope

### 1.1 Integration Points
| Source | Target | Protocol | Priority |
|--------|--------|----------|----------|
| ULMS Frontend | Fineract API | REST/HTTPS | Critical |
| ULMS Frontend | CIB Service | REST/HTTPS | Critical |
| CIB Service | BB CIB API | REST/mTLS | Critical |
| Workflow Service | Camunda | REST | Critical |
| All Services | PostgreSQL | JDBC | Critical |
| All Services | Redis | RESP | High |
| Services | Kafka | TCP | High |

## 2. Test Scenarios

### 2.1 CIB Integration Tests
```java
@Test
@DisplayName("Should successfully inquiry CIB and cache result")
void cibInquiry_Success_WithCaching() {
    // Given
    String nid = "1234567890123";
    
    // When - First call (cache miss)
    CibReportResponse first = cibService.inquiry(
        CibInquiryRequest.builder().nidNumber(nid).build()
    );
    
    // Then
    assertNotNull(first.getInquiryId());
    verify(cibOnlineClient).callCibOnline(any());
    
    // When - Second call (cache hit)
    CibReportResponse second = cibService.inquiry(
        CibInquiryRequest.builder().nidNumber(nid).build()
    );
    
    // Then - Should not call external API
    assertEquals(first.getInquiryId(), second.getInquiryId());
    verify(cibOnlineClient, times(1)).callCibOnline(any());
}

@Test
@DisplayName("Should handle CIB API timeout gracefully")
void cibInquiry_Timeout_HandlesGracefully() {
    when(cibOnlineClient.callCibOnline(any()))
        .thenThrow(new TimeoutException("Connection timeout"));
    
    assertThrows(CibIntegrationException.class, () -> {
        cibService.inquiry(createRequest());
    });
}
```

### 2.2 End-to-End Loan Application Flow
```gherkin
Feature: Complete Loan Application Journey

  Scenario: Customer submits loan application and gets approved
    Given a customer with NID "1234567890123" exists
    When the customer submits a loan application for BDT 500,000
    Then the application status should be "SUBMITTED"
    
    When the CIB inquiry is completed
    Then the credit score should be calculated
    And the application moves to "UNDER_REVIEW"
    
    When the Branch Manager approves the application
    Then the status should be "APPROVED"
    And a notification should be sent to the customer
```

## 3. Test Environment

### 3.1 Docker Compose for Testing
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ulms_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
  
  test-redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
  
  wiremock:
    image: wiremock/wiremock:3.3.1
    volumes:
      - ./wiremock:/home/wiremock
    ports:
      - "8089:8080"
```

## 4. CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Test Infrastructure
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Run Backend Tests
        run: ./mvnw verify -P integration-tests
      
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm ci
          npm run test:coverage
      
      - name: Run E2E Tests
        run: npm run test:e2e
```
```

---

## 8. Phase 6: Deployment & DevOps

### 8.1 Documentation Deliverables Checklist

| # | Document | Owner | Status Template | Priority |
|---|----------|-------|-----------------|----------|
| 6.1 | Docker Configuration Guide | Lead Dev | `docs/06-deployment/docker-guide.md` | Critical |
| 6.2 | Kubernetes Deployment Guide | Lead Dev | `docs/06-deployment/kubernetes-guide.md` | Critical |
| 6.3 | CI/CD Pipeline Configuration | Lead Dev | `docs/06-deployment/cicd-pipeline.md` | Critical |
| 6.4 | Environment Configuration | Lead Dev | `docs/06-deployment/environment-config.md` | High |
| 6.5 | Monitoring & Alerting Setup | Lead Dev | `docs/06-deployment/monitoring-setup.md` | High |
| 6.6 | Backup & Disaster Recovery | Lead Dev | `docs/06-deployment/backup-dr.md` | High |
| 6.7 | Release Management Process | Lead Dev | `docs/06-deployment/release-management.md` | Medium |

### 8.2 Required Document: Kubernetes Deployment

**Template Location:** `docs/06-deployment/kubernetes-guide.md`

```markdown
# Kubernetes Deployment Guide

## 1. Prerequisites

- Kubernetes cluster (v1.28+)
- kubectl configured
- Helm 3.x installed

## 2. Namespace Setup

```bash
# Create namespaces
kubectl create namespace ulms-production
kubectl create namespace ulms-staging
kubectl create namespace ulms-monitoring

# Set context
kubectl config set-context --current --namespace=ulms-staging
```

## 3. Application Deployment

### 3.1 Fineract Deployment
```yaml
# k8s/fineract-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fineract
  namespace: ulms-staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fineract
  template:
    metadata:
      labels:
        app: fineract
    spec:
      containers:
      - name: fineract
        image: unisoft/ulms-fineract:1.0.0
        ports:
        - containerPort: 8443
        env:
        - name: FINERACT_DB_HOST
          valueFrom:
            secretKeyRef:
              name: fineract-db-secret
              key: host
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /fineract-provider/actuator/health
            port: 8443
          initialDelaySeconds: 120
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /fineract-provider/actuator/health
            port: 8443
          initialDelaySeconds: 60
          periodSeconds: 10
```

### 3.2 HPA Configuration
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fineract-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fineract
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 4. Helm Chart Structure

```
helm/ulms/
├── Chart.yaml
├── values.yaml
├── values-production.yaml
├── values-staging.yaml
└── templates/
    ├── _helpers.tpl
    ├── fineract-deployment.yaml
    ├── fineract-service.yaml
    ├── cib-service-deployment.yaml
    ├── frontend-deployment.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    └── secrets.yaml
```

## 5. Deployment Commands

```bash
# Deploy to staging
helm upgrade --install ulms ./helm/ulms \
  --namespace ulms-staging \
  --values ./helm/ulms/values-staging.yaml

# Deploy to production
helm upgrade --install ulms ./helm/ulms \
  --namespace ulms-production \
  --values ./helm/ulms/values-production.yaml

# Rollback
helm rollback ulms [REVISION]
```
```

---

## 9. Documentation Templates

### 9.1 Sprint Planning Template

**Location:** `docs/templates/sprint-planning.md`

```markdown
# Sprint [Number] Planning

**Sprint Duration:** [Start Date] - [End Date] (2 weeks)  
**Sprint Goal:** [One-line goal]

## Team Capacity

| Team Member | Role | Capacity | Notes |
|-------------|------|----------|-------|
| [Name] | Lead Dev | 80% | 20% code review |
| [Name] | Frontend Dev | 100% | |
| [Name] | Backend Dev | 100% | |

## Sprint Backlog

| ID | Story | Assignee | Story Points | Status |
|----|-------|----------|--------------|--------|
| US-001 | [Story title] | [Name] | 5 | To Do |
| US-002 | [Story title] | [Name] | 3 | To Do |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

## Definition of Done
- [ ] Code completed
- [ ] Unit tests passing (>80% coverage)
- [ ] Code reviewed
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Demo ready
```

### 9.2 Daily Standup Template

```markdown
# Daily Standup - [Date]

## [Lead Dev Name]
**Yesterday:**
- 

**Today:**
- 

**Blockers:**
- 

---

## [Dev 1 Name]
**Yesterday:**
- 

**Today:**
- 

**Blockers:**
- 

---

## [Dev 2 Name]
**Yesterday:**
- 

**Today:**
- 

**Blockers:**
- 
```

### 9.3 Code Review Checklist

```markdown
# Code Review Checklist

## General
- [ ] Code follows style guide
- [ ] No hardcoded secrets
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Logging appropriate

## Frontend (React)
- [ ] TypeScript types defined
- [ ] Components properly typed
- [ ] Error boundaries considered
- [ ] i18n strings externalized
- [ ] Responsive design checked

## Backend (Java)
- [ ] Unit tests included
- [ ] Integration tests included
- [ ] API documented
- [ ] Transaction boundaries correct
- [ ] Security annotations present

## Database
- [ ] Migrations included
- [ ] Indexes added for queries
- [ ] No N+1 query issues
- [ ] Rollback script included

## Performance
- [ ] No obvious performance issues
- [ ] Caching considered
- [ ] Query execution plan checked
```

---

## 10. Appendices

### Appendix A: Documentation Index

| Doc ID | Document Name | Location | Owner | Status |
|--------|---------------|----------|-------|--------|
| 0.1 | Kickoff Meeting Minutes | `docs/00-initiation/` | Lead | Template |
| 0.2 | Team Onboarding Guide | `docs/00-initiation/` | Lead | Template |
| 1.1 | System Architecture | `docs/01-architecture/` | Lead | Template |
| 2.1 | Local Dev Setup | `docs/02-setup/` | Lead | Template |
| 3.1 | CIB Service Guide | `docs/03-backend/` | Lead | Template |
| 4.1 | Frontend Architecture | `docs/04-frontend/` | Dev 1 | Template |
| 5.1 | Integration Test Plan | `docs/05-testing/` | Lead | Template |
| 6.1 | Kubernetes Guide | `docs/06-deployment/` | Lead | Template |

### Appendix B: Quick Reference Commands

```bash
# Development
npm run dev              # Start frontend dev server
./gradlew bootRun       # Start Fineract
./mvnw spring-boot:run  # Start Spring Boot service

# Testing
npm run test            # Frontend tests
./mvnw test             # Backend tests
docker-compose -f docker-compose.test.yml up

# Docker
docker build -t ulms/fineract:latest .
docker-compose up -d

# Kubernetes
kubectl apply -f k8s/
helm upgrade --install ulms ./helm/ulms
kubectl logs -f deployment/fineract
```

### Appendix C: External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Apache Fineract Docs | https://fineract.apache.org/docs/ | Core platform docs |
| Spring Boot Docs | https://docs.spring.io/spring-boot/ | Backend framework |
| React Docs | https://react.dev/ | Frontend framework |
| MUI Docs | https://mui.com/ | UI components |
| Camunda Docs | https://docs.camunda.io/ | Workflow engine |
| Bangladesh Bank CIB | [Internal] | CIB integration |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This roadmap provides comprehensive documentation guidance for the ULMS development team.*
