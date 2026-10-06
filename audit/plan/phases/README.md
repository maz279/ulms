# audit/plan — Remaining Production Implementation

- [`00_forensic_audit.md`](../00_forensic_audit.md) — what's built vs missing (evidence-based, with scorecard)
- [`01_master_plan.md`](../01_master_plan.md) — governing decisions D1–D6, phase map R1–R9, sequencing rationale, status ledger
- `phases/R1_truth_hygiene_devstack.md` — tracker truth, rot removal, compose completion, CI strictness, web hardening
- `phases/R2_security_activation.md` — Keycloak login, role-gated UX, role-matrix tests
- `phases/R3_origination_completion.md` — loan-product engine, sanction letters, BOCC module, transactional outbox
- `phases/R4_servicing_collections_depth.md` — write-off, NPA recovery, guarantors, notifications module, dunning timers, AML depth
- `phases/R5_portal_partner_depth.md` — borrower self-service portal, partner API channel
- `phases/R6_mobile_field_app.md` — Expo 54 CPV + collections app with offline sync
- `phases/R7_live_integrations.md` — real CIB/NIDW/rail/SMS/CBS adapters, AV engine, WireMock contract suites, BB SFTP
- `phases/R8_deployment_observability.md` — k3s + Helm, CI/CD completion, Prometheus/Grafana, pgBackRest, perf/security packs
- `phases/R9_pilot_g5_closure.md` — migration rehearsal, UAT, pen-test, training, G5 closure, multi-tenant decision

**Binding authority order** (per AGENTS.md): Compliance Matrix → SRS → PLANNING suite → Front_end prototype → Tech Stack v3. This plan operates *under* PLANNING; conflicts resolve to PLANNING + Tech Stack v3. The 401-doc implementation guide is advisory — its microservices/Camunda/Kafka mandates are translated per master-plan decision D1.
