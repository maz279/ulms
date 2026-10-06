# 08 — Mobile (CPV Field App) & Borrower Portal Plan

**Doc:** PLAN-008 · v1.0 · 2026-09-27 · Owner: Frontend Dev (app) + Backend Dev (contracts)

---

## Part A — CPV / Collections Field App (Expo)

### A1. Scope (from prototype `mobile.html` + SRS)

Offline-first Android app (iOS later) for CPV officers and field collectors:
today's visit list, visit execution (checklist, photos, voice note, borrower
signature, GPS), collection outcome logging, PTP capture, offline queue with
conflict-safe sync, SOS escalation. **Bangla-first UI** (English toggle) — the
prototype's Bangla labels are the content baseline.

### A2. Stack & Project

- Expo SDK 54+ / React Native 0.81+, TypeScript strict, EAS Build/Update.
- Storage: **MMKV** (settings/session) + **expo-sqlite** (task/evidence queue),
  WatermelonDB not needed at this scale.
- Security: app PIN + biometric unlock; JWT in secure store (expo-secure-store);
  certificate pinning to our gateway; device registration (managed by MDM at bank).

### A3. Offline Contract (the critical design)

- **Server authority model** (mirrors prototype spec text): task *status*
  transitions are server-wins; evidence (photos/notes/GPS/signature) is
  append-only and always accepted; conflict ⇒ task re-fetched + officer sees a
  banner (never silent loss).
- Sync: pull `GET /field/tasks?since=` (delta) on foreground + 15-min push;
  upsert by `task_id + local_rev`; photos upload direct to presigned MinIO URLs
  when online, queued in SQLite when not.
- Queue UI shows the prototype's "Offline queue — will sync automatically"
  states, plus per-item retry/error.

### A4. Screens (1:1 from prototype)

Today (visit cards with distance/priority) · Visit form (checklist, photo ≤5,
voice ≤5min, signature canvas, GPS auto ±10m) · Collection outcome + PTP ·
Map (task pins) · Proof gallery · Sync center · SOS (one-tap → branch security
workflow task + SMS). Bilingual per 07 §6 rules.

### A5. Backend Contracts (mod-collections / mod-platform)

`GET /field/tasks` (delta, includes offline bundle version), `POST /field/visits`
(idempotent by client uuid), `POST /field/evidence` (multipart or presigned),
`POST /field/ptp`, `POST /field/sos`. All documented in OpenAPI with mobile
examples; **contract tests are shared with web** (same spec).

### A6. Testing & Release

Detox happy-path suite (login→visit→sync); sync conflict unit tests on device
farm (EAS); release via bank MDM (APK) — Play Store only if bank chooses BYOD.
Track: scaffold W6, feature-complete W9, pilot-hardened W12.

---

## Part B — Borrower Self-Service Portal

### B1. Scope (from prototype `portals.html` + URD)

Login (mobile + OTP), outstanding balance + EMI card, application tracker (BPF),
payment (bKash/Nagad/card/BEFTN), statements & tax certificates download,
help/chat entry. **Separate audience, separate app** (`apps/portal`) — lighter
bundle, no staff chrome, its own Keycloak client + realm role `borrower` bound
to CIF.

### B2. Implementation Notes

- Same toolchain as staff web; reuses `packages/ui` tokens but a borrower theme
  (marketing-friendly variant already present in prototype tokens).
- Payments: portal never handles card data — redirect/deeplink to rail SDKs or
  hosted pages; backend callbacks per 05 §7 do the posting (idempotent).
- Tracker state derives from the SAME workflow tables (read-only projection
  `GET /portal/me/application`) — no second source of truth.
- Statements/certs: presigned download URLs, short TTL.
- Anti-fraud: OTP per login + per payment confirmation; velocity limits; device
  binding optional per bank policy.

### B3. Security Delta (vs staff app)

No branch scope; row access strictly own-CIF; rate-limited aggressively;
audit events mirror staff actions; privacy: no NID display — masked only.

### B4. Schedule

W10 thin slice (login+balance+tracker), W11 payments sandbox + downloads,
W12 pilot polish. Go-live with pilot phase 2 (borrowers invited after internal
weeks stabilize).
