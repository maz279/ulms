# 12 — Program Plan: Timeline, Team, Risks, Go-Live

**Doc:** PLAN-012 · v1.0 · 2026-09-27 · Owner: Lead Developer

---

## 1. Timeline (12 weeks to pilot + 4 pilot weeks)

```
Week:  1  2  3  4  5  6  7  8  9  10 11 12 | 13..16 pilot | 17+ GA
P0 ████████                                  G0
P1       ██████████████████                  G1
P2                ██████████████████         G2
P3                            ██████████    G3
P4                                  ██████   G4
P5                                       ████G5
Mobile scaffold        ██████ ██████ (W6-9, feature-complete)
Portal                          ██████ (W10-12)
UAT cycles            ▲(G1)  ▲(G2)  ▲(G3)  ▲(G4) ▲▲(G5 sign-off)
```

## 2. Week-by-Week Allocation (3 devs; L=Lead, F=Frontend, B=Backend)

| W | L | F | B |
|---|---|---|---|
| 1 | repo/CI/compose; Fineract pinned boot + contract harness | theme port from tokens; shell + auth + routing skeletons | Flyway baseline, Keycloak realm, outbox, audit spine |
| 2 | walking slice E2E; ADR 1–4; G0 review | shell complete (tabs/mega/Tell-ME static) | customer module + branch scope + tests |
| 3 | Fineract adapter ports + loan/product templates | customer 360 screens wired to API | origination module + wizard contracts |
| 4 | NID mock + e-KYC flow | wizard (RHF+Zod) + autosave + validation parity | application workflows + stage machine |
| 5 | docs/MinIO + virus-scan hook | pipeline + document screens; **G1 demo** | approval workflow engine + ladder data |
| 6 | CIB adapter (mock + parser) | approvals screens + BPF/ladder UI | assessment module; DBR oracle |
| 7 | scoring service + policy config | CIB viewer + classification board UI | disbursement + dual-auth; servicing payments core |
| 8 | BRPD EOD batch + provisions; **G2 demo** | classification/calculator parity tests | schedules/statements; reschedule |
| 9 | rails adapters (sandbox) + webhooks | collections workbench + PTP | collections module + field-task API |
| 10 | reconciliation jobs; portal payment intent | portal thin slice (login/balance/tracker) | portal APIs + certs; **G3 demo** |
| 11 | regcon pack + CL-1..5 generation | report viewer/writer + regcon screens; a11y/i18n sweep | reporting queries + read models; **G4 demo** |
| 12 | security fixes, perf pass, release RC | Playwright full suite green; UAT support | migration rehearsal ×2; runbook drills; **G5** |

Contingency: 10% scope buffer held by Lead; slippage policy = cut scope, never
gates (compliance/security items are uncuttable).

## 3. RACI (R=does, A=accountable, C=consulted, I=informed)

| Area | L | F | B | Bank SME | Unisoft QA |
|---|---|---|---|---|---|
| Architecture/ADRs | A/R | C | C | I | I |
| Web UI | C | A/R | I | C (UAT) | C |
| Backend modules | C | I | R | C | C |
| Integrations | A/R | I | C | **C (critical)** | I |
| Compliance features | A | C | R | **A sign-off** | C |
| Security | A/R | C | C | C (audit) | C |
| Release/deploy | A/R | C | C | I (window) | C |
| UAT mgmt | C | I | I | A | R |

## 4. Risk Register (top 10; full sheet lives with 00)

| # | Risk | P×I | Mitigation | Owner |
|---|---|---|---|---|
| 1 | CIB/NIDW sandbox or creds delayed | H×H | mocks behind ports from W3; UAT flag-gated; workflow unaffected | L |
| 2 | Fineract upgrade/security patch mid-build | M×H | pinned image + adapter contract tests; quarterly window (RB-04) | L |
| 3 | 3-dev bus factor / illness | M×H | pairing rotation, ADRs, module tests, runbooks; Unisoft bench on-call | L |
| 4 | ABC CBS interface unknowns | H×M | file-based pilot design (11 §4); early SME workshop W3 | L |
| 5 | Scope creep from bank stakeholders | H×M | prototype = frozen UX contract; change control via 00 §8 | L |
| 6 | Migration data quality | M×H | rehearsals ×2, reconciliation zero-sum gates, rollback plan | B |
| 7 | EOD batch performance at scale | M×M | staging scale run W8; read models; batch partitioning | B |
| 8 | Spring Boot 4 ecosystem gaps | M×M | core starters only; tracked migration guides; fallback path documented | L |
| 9 | Regulatory timeline shifts (IFRS-9) | L×H | ECL fields built P2; reports assembly-only later | B |
| 10 | Security pen-test findings late | M×H | ASVS L2 per-module from P0; internal DAST from G1; external test pre-G5 | L |

## 5. Budget Skeleton (per pilot deployment)

Team 3 dev × 16 weeks (build+pilot) · external pen-test 1 wk · bank infra
(3 VMs/hosts on-prem + standby) · EAS/MDM mobile distribution · sandbox fees
(rails/CIB as applicable) · contingency 15%. Productization (multi-bank
config, branding, packaging) scoped separately post-GA.

## 6. Go-Live Checklist (G5 evidence pack)

- [ ] All journey suites green on RC tag (09 §2)
- [ ] UAT sign-off letter (0 C/H, ≤5 M accepted) from bank
- [ ] Migration reconciliation zero-sum + 100-row QA both directions
- [ ] Backup restore + failover drill evidence (RB-02) within 14 days of GL
- [ ] Pen-test criticals/highs closed; ASVS L2 checklist complete
- [ ] Runbooks rehearsed (RB-01..08 at least once); on-call rota published
- [ ] Monitoring dashboards live for bank; alert channels tested end-to-end
- [ ] Secrets rotated for production; MDM mobile build distributed to devices
- [ ] Training delivered (officers, approvers, compliance, ops)
- [ ] Rollback plan verified (helm --atomic drill on staging)

## 7. Post-Pilot (weeks 13–16 → GA)

Shadow week (parallel with legacy) → single-branch live → progressive branch
rollout → burn-down review → GA branch cut, then productization backlog
(multi-bank tenancy, branding, marketplace integrations) as a separate release
train (17+).
