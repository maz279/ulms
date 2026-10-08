---
type: how-to
topic: local_developer_and_uat_docker_compose_environment
target_audience: [developer, devops_engineer, qa_engineer, test_automation_engineer]
version: 2026.10
document_id: DOC-04-DEP-06
---

# DOC-04-DEP-06: Local Developer & UAT Docker Compose Environment Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Local Developer & UAT Docker Compose Environment Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Infrastructure & Development Guide |
| **Status** | Approved Master Deployment Guide |
| **Authority Chain** | `LMS_CODEBASE/deploy/compose/docker-compose.yml` → `Technology_Stack_Recommendation_v3.md` |
| **Target Codebase** | `c:\software_project\mim_project\LMS\LMS_CODEBASE` |

---

## 1. Executive Environment Overview & Architecture

The ULMS v2.0 local development environment is orchestrated via **Docker Compose**, providing a deterministic replica of the production banking topology on a single development workstation or User Acceptance Testing (UAT) server.

```mermaid
flowchart TD
    subgraph Host ["Developer Workstation / UAT Host"]
        subgraph Web_Tier ["Frontend Channels"]
            WEB["ulms-web (:3000)<br/>React 19 / MUI v7 / Vite 7"]
            MOCK["mock-api (:8081)<br/>Contract-Compliant Node Server"]
        end
        subgraph Core_Tier ["Core Banking & App Services"]
            API["ulms-api (:8081)<br/>Spring Boot 4 Modular Monolith"]
            FIN["fineract-server (:8443)<br/>Apache Fineract 1.12.x CE"]
        end
        subgraph Infra_Tier ["Data & Identity Infrastructure"]
            PG["postgres (:5432)<br/>PostgreSQL 17 (Dual-Schema)"]
            RD["redis (:6379)<br/>Redis 7 (Session & Idempotency)"]
            KC["keycloak (:8082)<br/>Keycloak 26 (OAuth2 / OIDC)"]
        end
    end
    WEB -->|REST / JWT| API
    WEB -.->|Mock Mode| MOCK
    API -->|JDBC / Flyway| PG
    API -->|Cache / Locks| RD
    API -->|Token Validation| KC
    API -->|Accounting REST| FIN
    FIN -->|mifostenant-default| PG
```

---

## 2. Infrastructure Service Matrix

| Service Name | Container Image | Host Port | Memory Limit | Healthcheck Probe | Purpose |
|---|---|---|---|---|---|
| **`postgres`** | `postgres:17-alpine` | `5432` | 2.0 GB | `pg_isready -U ulms -d ulms` | Relational store for `ulms_app` and `mifostenant-default`. |
| **`redis`** | `redis:7.2-alpine` | `6379` | 512 MB | `redis-cli ping` | Distributed idempotency locks, token blacklist, and caching. |
| **`keycloak`** | `quay.io/keycloak/keycloak:26.0` | `8082` | 1.5 GB | `curl -f http://localhost:8082/health/ready` | Identity provider, OAuth2/OIDC token issuer, RBAC realm. |
| **`fineract`** | `apache/fineract:1.12.0` | `8443` | 2.5 GB | `curl -f -k https://localhost:8443/fineract-provider/actuator/health` | Double-entry accounting, loan schedules, interest accrual. |
| **`mock-api`** | `node:20-alpine` | `8081` | 512 MB | `curl -f http://localhost:8081/health` | Fast OpenAPI contract mock server for frontend UI work. |
| **`ulms-web`** | `node:20-alpine` | `3000` | 512 MB | `curl -f http://localhost:3000` | React 19 staff operations web application. |

---

## 3. Complete `docker-compose.yml` Manifest

The complete, authoritative compose definition is located at `LMS_CODEBASE/deploy/compose/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: ulms-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ulms
      POSTGRES_PASSWORD: ulms_dev_password_2026
      POSTGRES_DB: ulms
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-dual-schema.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ulms -d ulms"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: ulms-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    container_name: ulms-keycloak
    command: start-dev --import-realm
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin_password_2026
      KC_DB: postgres-vendor
      KC_DB_URL: jdbc:postgresql://postgres:5432/ulms
      KC_DB_USERNAME: ulms
      KC_DB_PASSWORD: ulms_dev_password_2026
    ports:
      - "8082:8080"
    volumes:
      - ./ulms-realm.json:/opt/keycloak/data/import/ulms-realm.json:ro
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

---

## 4. Environment Lifecycle Commands

### 4.1 Starting the Infrastructure Stack
```bash
cd LMS_CODEBASE/deploy/compose

# Launch database, cache, and authentication services in the background
docker compose up -d postgres redis keycloak

# Inspect health status of all running containers
docker compose ps
```

### 4.2 Verifying Keycloak Realm Import
Verify that Keycloak has imported the pre-configured `ulms` realm with default banking roles:
```bash
curl -s http://localhost:8082/realms/ulms | grep '"realm":"ulms"'
```

### 4.3 Clean Teardown & Reset
To wipe the environment and recreate fresh database volumes from zero state:
```bash
docker compose down -v
```

---

## 5. Lightweight Frontend Development: Mock API Mode (Zero Docker)

To enable developers to build, test, and debug user interfaces rapidly without allocating 6 GB of RAM to Docker containers, ULMS provides a standalone **Contract Mock API server**:

```bash
cd LMS_CODEBASE/apps/web

# 1. Install dependencies
npm ci

# 2. Run standalone mock server and Vite dev server concurrently
npm run mock:api &
npm run dev
```

### Advantages of Mock API Mode:
- **Instant Bringup:** Starts in less than 2 seconds with zero Docker daemon requirements.
- **Contract Fidelity:** Built directly from `packages/openapi/ulms-api.yaml`, ensuring 100% endpoint path and schema parity.
- **Pre-Seeded Data:** Automatically pre-seeded with sample retail and SME customers, active loans, and BRPD classification board records.

---

## 6. SRE Troubleshooting & Common Local Gotchas

### Gotcha 1: Host Port Collisions
- **Issue:** `Bind for 0.0.0.0:5432 failed: port is already allocated`.
- **Cause:** A local PostgreSQL service is already running on the host OS.
- **Solution:** Stop the local PostgreSQL service (`net stop postgresql` on Windows) or map the container to an alternative port (e.g., `"5433:5432"`).

### Gotcha 2: Keycloak Admin Login & Token Acquisition
To acquire a bearer token programmatically from the local Keycloak instance:
```bash
curl -s -X POST http://localhost:8082/realms/ulms/protocol/openid-connect/token \
  -d grant_type=password \
  -d client_id=ulms-web \
  -d username=loan_officer_01 \
  -d password=password123 | jq .access_token
```

---

*— End of Local Developer & UAT Docker Compose Environment Guide —*
