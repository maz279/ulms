# 04 — Data Model & Migration Plan

**Doc:** PLAN-004 · v1.0 · 2026-09-27 · Owner: Backend Developer

---

## 1. Schema Strategy (two schemas, one cluster)

```
postgres cluster
├── schema fineract        # owned by Fineract CE — NEVER altered by us
│   └── (Fineract tables: m_client, m_loan, m_product_loan, ...)
├── schema ulms            # our domain tables (below)
└── role ulms_readonly     # for reporting read-model (ADR-008)
```

Rules: our app connects with `ulms` owner for our schema and a **read-only**
role for Fineract reporting queries; **all writes to Fineract go through its
REST API only** (adapter, per ADR-002). Reporting never joins across schemas in
OLTP paths — the EOD batch copies what it needs into `ulms` read models.

## 2. Core Entity Map (ulms schema; PKs = UUIDv7 when PG18, else bigint+uuid col)

```
CUSTOMER                ORIGINATION               WORKFLOW (shared engine)
 customer               application               workflow_definition
 kyc_check              application_document      workflow_instance
 screening_hit          cpv_visit                 workflow_task (+sla)
 customer_merge_log     sanction_letter           workflow_transition (audit)

ASSESSMENT                                        APPROVAL/SERVICING
 cib_report(raw+jsonb)  collateral               disbursement
 cib_facility           collateral_valuation     dual_authorization
 score_result           reschedule_request       payment
                                                statement_run
COLLECTIONS             COMPLIANCE               settlement_quote
 collection_action      classification_history   tax_certificate
 ptp                    provision_run
 field_task             regulatory_return        INTEGRATION/PLATFORM
 legal_case             ecl_snapshot             outbox_event
                                                integration_log
                                                audit_entry (hash-chained)
                                                app_config / feature_flag
                                                job_run (ShedLock)
                                                notification / template
                                                holiday_calendar
```

Money: `BIGINT` minor units (poisha) — never floats; currency column fixed
`BDT` for now. Dates: `timestamptz` everywhere, app zone Asia/Dhaka.
Names: `name_en` + `name_bn` columns — **one language rendered per request**,
per the bilingual separation policy (07 §6).

## 3. Representative DDL (illustrative — Flyway is authoritative)

```sql
CREATE TABLE ulms.customer (
  id              UUID PRIMARY KEY,
  cif_no          VARCHAR(16) UNIQUE NOT NULL,
  fineract_client_id BIGINT UNIQUE,          -- link, synced by adapter
  name_en         VARCHAR(140) NOT NULL,
  name_bn         VARCHAR(140),
  segment         VARCHAR(20) NOT NULL,
  mobile          VARCHAR(16) NOT NULL,
  nid_masked      VARCHAR(24),               -- full NID never stored in ULMS (06 §5)
  kyc_status      VARCHAR(12) NOT NULL,
  branch_code     VARCHAR(8)  NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_branch ON ulms.customer(branch_code);

CREATE TABLE ulms.outbox_event (
  id            UUID PRIMARY KEY,
  aggregate     VARCHAR(40) NOT NULL,        -- e.g. "application"
  aggregate_id  UUID NOT NULL,
  type          VARCHAR(60) NOT NULL,        -- ApplicationSubmitted
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  attempts      INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_outbox_pending ON ulms.outbox_event(dispatched_at) WHERE dispatched_at IS NULL;
```

## 4. Workflow Engine Tables (data-driven, no BPM)

`workflow_definition` (JSONB state graph + amount-band routing for ladder),
`workflow_instance` (current node, context ref), `workflow_task` (assignee role
+ user, action, SLA deadline, state), `workflow_transition` (append-only).
The 7-level ladder band table is **configuration data** (bank-tunable).

## 5. Read Models & Reporting

- `classification_history` doubles as the classification board read model
  (current row per loan flagged) — the EOD batch maintains it.
- Reporting queries run against `ulms_readonly` role + nightly snapshot schema
  `ulms_rpt` (refreshed post-EOD) so CL pack generation never locks OLTP.
- p95 budget: any listing endpoint uses an index-only scan (verify in review
  with `EXPLAIN` evidence attached to PR for new queries).

## 6. Flyway Conventions

- `apps/api/src/main/resources/db/migration/V{seq}__{ticket}_{desc}.sql`
  forward-only, one concern per file; no edits to merged files — new file reverses.
- Baseline: `V1__init.sql` creates schema `ulms`; seeds via `db/seed` (dev only).
- Contract: Testcontainers runs ALL migrations on every CI build from scratch
  (catches drift); migration timing check fails CI if full replay >60s.

## 7. Data Migration (ABC Bank pilot)

| Step | Content | Method | Gate |
|---|---|---|---|
| M0 | Product/branch/param config | seed scripts | config sign-off |
| M1 | Customer CIF extract | CSV→staging→dedupe→customer + Fineract client creation via adapter | row counts + 100-row manual QA both directions |
| M2 | Open loans | staging → Fineract loan creation (backdated) → reconciliation count/sum vs CBS extract | zero-sum reconciliation report |
| M3 | Arrears/DPD state | derive from repayment history replay through DPD engine | matches CBS aging ±1 day |
| M4 | Documents | object import to MinIO + metadata rows | checksum manifest |
| Cutover rehearsal ×2 | full TROPS runbook (10 §7) | timing sheet | ≤4h RTO demonstrated |

PII handling during migration: extracts encrypted at rest, transfer via bank
SFTP only, staging schema dropped after reconciliation sign-off (06 §7).
