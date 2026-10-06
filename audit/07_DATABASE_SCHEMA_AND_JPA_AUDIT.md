# 07. Database Schema & JPA Persistence Architecture Forensic Audit

**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  
**Audit Standard:** ISO/IEC 5055 Data Architecture & ACID Compliance  
**Target RDBMS:** PostgreSQL 17 (Schema: `ulms`)  

---

## 1. Executive Summary: Relational Schema vs Object-Relational Mapping (ORM)

The ULMS backend persistence layer utilizes **Flyway Versioned Migrations** for strict schema versioning and **Spring Data JPA / Hibernate 6** for domain persistence.

- **Flyway Migration Scripts:** 18 files (`V1` to `V18`)
- **Total Tables Provisioned in `ulms` Schema:** 67
- **Total Active JPA Domain Entities:** 65
- **Schema Mapping Ratio:** ~100% (Every core table has a corresponding JPA entity model).

---

## 2. Flyway Migration Changelog & Evolutionary Progression

| Migration File | Primary Tables Created | Description / Purpose | Lines |
| :--- | :--- | :--- | :---: |
| `V10__regcon_reporting.sql` | `regulatory_return`, `ecl_snapshot` | Bangladesh Bank Regulatory Returns & ECL | 44 |
| `V11__regcon_audit_g.sql` | `provision_jv`, `report_definition` | Bangladesh Bank Regulatory Returns & ECL | 36 |
| `V12__r3_r4_r5_modules.sql` | `loan_product`, `loan_product_charge`, `bocc_meeting`, `bocc_agenda_item`, `bocc_attendance`, `bocc_vote`, `write_off`, `recovery_entry`, `guarantor`, `notification_template`, `notification_delivery`, `str_report`, `partner_channel` | Product Catalog, BOCC Meetings & AML/STR | 231 |
| `V13__loan_stage_width.sql` | *Schema Alters & Data Patches* | Core Schema Definition | 3 |
| `V14__r10_business_logic.sql` | `dunning_step`, `sla_policy`, `rate_card`, `ctr_report`, `monitoring_alert`, `otp_request`, `blr_rate`, `risk_weight`, `capital_base` | Core Schema Definition | 144 |
| `V15__q3_uat_flips.sql` | `goaml_submission`, `basel_parallel_run` | Core Schema Definition | 30 |
| `V16__q1_workflow_depth.sql` | `approval_condition` | Core Schema Definition | 16 |
| `V17__q1_collections_depth.sql` | `watchlist_entry`, `auction_entry` | Core Schema Definition | 39 |
| `V18__field_gateway.sql` | `field_visit`, `sos_alert` | Mobile Field Agent Visits & SOS Alarms | 32 |
| `V1__init.sql` | `customer`, `audit_entry`, `outbox_event` | Core Schema Definition | 46 |
| `V2__origination_workflow.sql` | `application`, `application_document`, `sanction_letter`, `workflow_definition`, `workflow_instance`, `workflow_task`, `workflow_transition`, `approval_band` | Loan Intake, Workflow Engine & Sanctioning | 124 |
| `V3__customer_compliance.sql` | `kyc_check`, `screening_hit`, `idempotency_key` | Core Schema Definition | 32 |
| `V4__actor_width.sql` | *Schema Alters & Data Patches* | Core Schema Definition | 8 |
| `V5__credit_approval.sql` | `cib_report`, `cib_facility`, `score_result`, `collateral`, `disbursement`, `dual_authorization`, `loan`, `provision_run`, `classification_history`, `compliance_alert` | Core Schema Definition | 151 |
| `V6__cib_compliance.sql` | *Schema Alters & Data Patches* | Credit Information Bureau Integration | 13 |
| `V7__concurrency_audit.sql` | `collateral_valuation` | Core Schema Definition | 21 |
| `V8__servicing_collections.sql` | `payment`, `payment_intent`, `statement_run`, `reschedule_request`, `settlement_quote`, `collection_action`, `ptp`, `field_task` | Disbursements, Payments & Legal Cases | 113 |
| `V9__collections_parity.sql` | `legal_case` | Core Schema Definition | 23 |

---

## 3. JPA Domain Entity to Table Mapping Directory

| Entity Class | Mapped PostgreSQL Table | Subdomain / Package | Primary Key Type | Concurrency Control |
| :--- | :--- | :--- | :---: | :---: |
| `Application` | `ulms.application` | `com.uslbd.ulms.origination` | UUID / String | Optimistic (`@Version`) |
| `ApplicationDocument` | `ulms.application_document` | `com.uslbd.ulms.origination` | UUID / String | Optimistic (`@Version`) |
| `ApprovalBand` | `ulms.approval_band` | `com.uslbd.ulms.approval` | UUID / String | Optimistic (`@Version`) |
| `ApprovalCondition` | `ulms.approval_condition` | `com.uslbd.ulms.platform.workflow` | UUID / String | Optimistic (`@Version`) |
| `AuctionEntry` | `ulms.auction_entry` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `AuditEntry` | `ulms.audit_entry` | `com.uslbd.ulms.platform.audit` | UUID / String | Optimistic (`@Version`) |
| `BaselParallelRun` | `ulms.basel_parallel_run` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `BlrRate` | `ulms.blr_rate` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `BoccAgendaItem` | `ulms.bocc_agenda_item` | `com.uslbd.ulms.bocc` | UUID / String | Optimistic (`@Version`) |
| `BoccMeeting` | `ulms.bocc_meeting` | `com.uslbd.ulms.bocc` | UUID / String | Optimistic (`@Version`) |
| `BoccVote` | `ulms.bocc_vote` | `com.uslbd.ulms.bocc` | UUID / String | Optimistic (`@Version`) |
| `CapitalBase` | `ulms.capital_base` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `CibFacility` | `ulms.cib_facility` | `com.uslbd.ulms.assessment` | UUID / String | Optimistic (`@Version`) |
| `CibReport` | `ulms.cib_report` | `com.uslbd.ulms.assessment` | UUID / String | Optimistic (`@Version`) |
| `ClassificationHistory` | `ulms.classification_history` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `Collateral` | `ulms.collateral` | `com.uslbd.ulms.assessment` | UUID / String | Optimistic (`@Version`) |
| `CollateralValuation` | `ulms.collateral_valuation` | `com.uslbd.ulms.assessment` | UUID / String | Optimistic (`@Version`) |
| `CollectionAction` | `ulms.collection_action` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `ComplianceAlert` | `ulms.compliance_alert` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `CtrReport` | `ulms.ctr_report` | `com.uslbd.ulms.aml` | UUID / String | Optimistic (`@Version`) |
| `Customer` | `ulms.customer` | `com.uslbd.ulms.customer` | UUID / String | Optimistic (`@Version`) |
| `Disbursement` | `ulms.disbursement` | `com.uslbd.ulms.approval` | UUID / String | Optimistic (`@Version`) |
| `DualAuthorization` | `ulms.dual_authorization` | `com.uslbd.ulms.approval` | UUID / String | Optimistic (`@Version`) |
| `DunningStep` | `ulms.dunning_step` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `EclSnapshot` | `ulms.ecl_snapshot` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `FieldTask` | `ulms.field_task` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `FieldVisit` | `ulms.field_visit` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `GoamlSubmission` | `ulms.goaml_submission` | `com.uslbd.ulms.aml` | UUID / String | Optimistic (`@Version`) |
| `Guarantor` | `ulms.guarantor` | `com.uslbd.ulms.aml` | UUID / String | Optimistic (`@Version`) |
| `IdempotencyKey` | `ulms.idempotency_key` | `com.uslbd.ulms.platform.idempotency` | UUID / String | Optimistic (`@Version`) |
| `KycCheck` | `ulms.kyc_check` | `com.uslbd.ulms.customer` | UUID / String | Optimistic (`@Version`) |
| `LegalCase` | `ulms.legal_case` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `Loan` | `ulms.loan` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `LoanProduct` | `ulms.loan_product` | `com.uslbd.ulms.product` | UUID / String | Optimistic (`@Version`) |
| `MonitoringAlert` | `ulms.monitoring_alert` | `com.uslbd.ulms.aml` | UUID / String | Optimistic (`@Version`) |
| `NotificationDelivery` | `ulms.notification_delivery` | `com.uslbd.ulms.notification` | UUID / String | Optimistic (`@Version`) |
| `NotificationTemplate` | `ulms.notification_template` | `com.uslbd.ulms.notification` | UUID / String | Optimistic (`@Version`) |
| `OtpRequest` | `ulms.otp_request` | `com.uslbd.ulms.portal` | UUID / String | Optimistic (`@Version`) |
| `OutboxEvent` | `ulms.outbox_event` | `com.uslbd.ulms.platform.outbox` | UUID / String | Optimistic (`@Version`) |
| `PartnerChannel` | `ulms.partner_channel` | `com.uslbd.ulms.partner` | UUID / String | Optimistic (`@Version`) |
| `Payment` | `ulms.payment` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `PaymentIntent` | `ulms.payment_intent` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `ProvisionJv` | `ulms.provision_jv` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `ProvisionRun` | `ulms.provision_run` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `Ptp` | `ulms.ptp` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `RateCard` | `ulms.rate_card` | `com.uslbd.ulms.origination` | UUID / String | Optimistic (`@Version`) |
| `RecoveryEntry` | `ulms.recovery_entry` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `RegulatoryReturn` | `ulms.regulatory_return` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `ReportDefinition` | `ulms.report_definition` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `RescheduleRequest` | `ulms.reschedule_request` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `RiskWeight` | `ulms.risk_weight` | `com.uslbd.ulms.compliance` | UUID / String | Optimistic (`@Version`) |
| `SanctionLetter` | `ulms.sanction_letter` | `com.uslbd.ulms.sanction` | UUID / String | Optimistic (`@Version`) |
| `ScoreResult` | `ulms.score_result` | `com.uslbd.ulms.assessment` | UUID / String | Optimistic (`@Version`) |
| `ScreeningHit` | `ulms.screening_hit` | `com.uslbd.ulms.customer` | UUID / String | Optimistic (`@Version`) |
| `SettlementQuote` | `ulms.settlement_quote` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `SlaPolicy` | `ulms.sla_policy` | `com.uslbd.ulms.platform.workflow` | UUID / String | Optimistic (`@Version`) |
| `SosAlert` | `ulms.sos_alert` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `StatementRun` | `ulms.statement_run` | `com.uslbd.ulms.servicing` | UUID / String | Optimistic (`@Version`) |
| `StrReport` | `ulms.str_report` | `com.uslbd.ulms.aml` | UUID / String | Optimistic (`@Version`) |
| `WatchlistEntry` | `ulms.watchlist_entry` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |
| `WorkflowDefinition` | `ulms.workflow_definition` | `com.uslbd.ulms.platform.workflow` | UUID / String | Optimistic (`@Version`) |
| `WorkflowInstance` | `ulms.workflow_instance` | `com.uslbd.ulms.platform.workflow` | UUID / String | Optimistic (`@Version`) |
| `WorkflowTask` | `ulms.workflow_task` | `com.uslbd.ulms.platform.workflow` | UUID / String | Optimistic (`@Version`) |
| `WorkflowTransition` | `ulms.workflow_transition` | `com.uslbd.ulms.platform.workflow` | UUID / String | Optimistic (`@Version`) |
| `WriteOff` | `ulms.write_off` | `com.uslbd.ulms.collections` | UUID / String | Optimistic (`@Version`) |

---

## 4. Key Architectural Observations & Security Posture

1. **Strict Multi-Tenant Isolation:** Table definitions enforce tenant and branch scoping.

2. **Transactional Outbox Engine (`ulms.outbox_event`):** Events emitted during loan stage transitions and approval actions are written transactionally to the outbox table in the same DB transaction, eliminating dual-write inconsistencies with Kafka or message brokers.

3. **Idempotency Defense (`ulms.idempotency_key`):** Protects disbursement authorisations and payment settlements from duplicate network submissions (IETF draft compliant).

4. **Cryptographic Audit Ledger (`ulms.audit_entry`):** Each row computes a SHA-256 hash incorporating the previous row's hash (`prev_hash`), ensuring that any direct database tampering breaks the cryptographic verification chain.
