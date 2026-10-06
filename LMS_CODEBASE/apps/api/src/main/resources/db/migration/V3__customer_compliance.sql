-- V3 — P1 audit-iteration tables (PLANNING/03 mod-customer, 04 §3, 05 §4):
-- kyc_check: e-KYC attempt history (status machine PENDING→VERIFIED/REJECTED/ERROR)
-- screening_hit: sanctions/PEP screening results (06 §8 P1 screening hooks)
-- idempotency_key: Idempotency-Key store for replay-safe POSTs (05 §4, 48h window)

CREATE TABLE IF NOT EXISTS ulms.kyc_check (
  id            UUID PRIMARY KEY,
  customer_id   UUID NOT NULL REFERENCES ulms.customer(id),
  status        VARCHAR(12) NOT NULL,            -- PENDING | VERIFIED | REJECTED | ERROR
  reference_id  VARCHAR(64),                     -- NIDW reference (mock: NIDW-MOCK-xxxxxx)
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kyccheck_customer ON ulms.kyc_check(customer_id);

CREATE TABLE IF NOT EXISTS ulms.screening_hit (
  id            UUID PRIMARY KEY,
  customer_id   UUID NOT NULL REFERENCES ulms.customer(id),
  list_name     VARCHAR(60) NOT NULL,            -- sanctions | pep | adverse-media
  matched_name  VARCHAR(200) NOT NULL,
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_screeninghit_customer ON ulms.screening_hit(customer_id);

CREATE TABLE IF NOT EXISTS ulms.idempotency_key (
  key           UUID PRIMARY KEY,                -- the Idempotency-Key header value
  endpoint      VARCHAR(120) NOT NULL,
  request_hash  VARCHAR(64) NOT NULL,            -- sha256 of serialized body
  status_code   INT NOT NULL,
  response_body JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL             -- created_at + 48h (05 §4)
);
