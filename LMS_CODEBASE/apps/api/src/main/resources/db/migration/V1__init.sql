-- ULMS Flyway baseline (PLANNING/04 §6) — forward-only, one concern per file.
-- V1: schema ulms + walking-slice tables (customer, audit, outbox).

CREATE SCHEMA IF NOT EXISTS ulms;

CREATE TABLE ulms.customer (
    id                  UUID PRIMARY KEY,
    cif_no              VARCHAR(16)  NOT NULL UNIQUE,
    name_en             VARCHAR(140) NOT NULL,
    name_bn             VARCHAR(140),
    segment             VARCHAR(20)  NOT NULL,
    mobile              VARCHAR(16)  NOT NULL,
    nid_masked          VARCHAR(24),
    kyc_status          VARCHAR(12)  NOT NULL DEFAULT 'PENDING',
    branch_code         VARCHAR(8)   NOT NULL,
    fineract_client_id  BIGINT UNIQUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_branch ON ulms.customer(branch_code);
CREATE INDEX idx_customer_mobile ON ulms.customer(mobile);

CREATE TABLE ulms.audit_entry (
    id            UUID PRIMARY KEY,
    actor         VARCHAR(64)  NOT NULL,     -- "user:<keycloak-sub uuid>" fits
    action        VARCHAR(60)  NOT NULL,
    aggregate     VARCHAR(40)  NOT NULL,
    aggregate_id  UUID         NOT NULL,
    payload       JSONB        NOT NULL,
    hash          VARCHAR(64)  NOT NULL,
    at            TIMESTAMPTZ  NOT NULL,
    request_id    UUID
);
CREATE INDEX idx_audit_aggregate ON ulms.audit_entry(aggregate, aggregate_id, at);

CREATE TABLE ulms.outbox_event (
    id            UUID PRIMARY KEY,
    aggregate     VARCHAR(40)  NOT NULL,
    aggregate_id  UUID         NOT NULL,
    type          VARCHAR(60)  NOT NULL,
    payload       JSONB        NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    dispatched_at TIMESTAMPTZ,
    attempts      INT          NOT NULL DEFAULT 0
);
CREATE INDEX idx_outbox_pending ON ulms.outbox_event(dispatched_at) WHERE dispatched_at IS NULL;
