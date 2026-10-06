# SOURCES — provenance map for ULMS_v2_Technical_Documentation.docx

| Fact in document | Provenance |
|---|---|
| 16 backend modules, 162 endpoints, per-module counts | `_phase1_modules.json` (built by structured sweep over `apps/api/src/main/java/com/uslbd/ulms/*/`, this session) |
| 18 Flyway migrations V1–V18 | `ls apps/api/src/main/resources/db/migration/*.sql` |
| Approval bands L1 ≤50,000,000 minor … L7 >10Cr | `V2__origination_workflow.sql:98-105` (approval_band seed) |
| BRPD stages/provisions incl. B/L >365 100% | `BrpdClassifier.java:13-43` header contract + code |
| ECL stage multipliers | `EclModel.java:31` (STD-0 → 100 …) |
| STR ৳10L disbursement threshold | `DisbursementService.java` STR_THRESHOLD_MINOR = 100_000_000 |
| Java suite 193/52 (last full) | recorded full-suite run (build/test-results + evidence packs) |
| Web unit 44, e2e 44, field 20, borrower 10 | recorded runs this workspace (`npm test` outputs) |
| minSdk 24 / com.uslbd.ulmsborrower / arm64 | `aapt2 dump badging` on the shipped APK (recorded) |
| 12 runbooks RB-01..RB-12 | `ls docs/runbooks/*.md` |
| 6 CI stages / 14 jobs | machine-parsed `.gitlab-ci.yml` |
| 8 compose services | `docker-compose.yml` (postgres, api, web, keycloak, fineract, minio, prometheus, grafana) |
| 11 scheduled jobs | `grep -c @Scheduled` across main |
| Screenshots s01–s05 | live compose stack :4173, signed-in staff session (this session) |
| Screenshots b1–b3, f1–f3 | working prototypes :8791 (borrower + field — the shipped apps' demo modes embed identical simulations) |
| Exhibits E1–E7 | `exhibits/` (matplotlib, this session; data from the JSONs above) |
| Mobile app facts (offline rules, PIN, gateway) | `apps/mobile/src/sync/engine.ts`, `auth/pin.ts`, `FieldGatewayController.java`, `mobile_app/src/api/demo.ts` |
