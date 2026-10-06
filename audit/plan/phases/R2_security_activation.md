# R2 — Security Activation (Keycloak login + role-gated UX)
**Env:** Node dev-role fallback locally; full PKCE verified on compose/CI · **Est:** 1 week

## Deliverables
1. **Web auth layer** — OIDC PKCE login against Keycloak 26 (`/realms/ulms`), silent refresh, logout; route guard on the shell; `VITE_ULMS_TOKEN` static-token dev mode retained for CI e2e.
2. **Role model in UI** — decode realm roles (11 roles incl. ladder bands L1..L7, collections, compliance, md); role-gate sitemap areas + action buttons (approve/act per band, disbursement gates, regcon sign-off chain, collections write actions); "insufficient role" affordance.
3. **Mock API role simulation** — honor a dev roles header / token claims so role gating is e2e-testable without Keycloak.
4. **Backend verification** — SecurityConfig already role-gates mutations; add role-matrix integration test (per PLANNING/06 §1) on compose; MFA (SMS-OTP) realm config note.
5. **Audit** — login/logout/token-refresh audit events.

## Exit criteria — local set MET (2026-10-02)
- [x] Login→role-gated journey e2e green in mock mode (6 journeys, r2-security.spec.ts)
- [ ] Compose journey green once (CI or dev VM — no Docker on this machine; CI jobs `api-integration` + `e2e-smoke` cover it)
- [x] Role-matrix test in `apps/api` (SecurityLadderMatrixTest — 7×7 exact rung + admin bypass + delegation)
- [x] CHANGELOG entry (created); OpenAPI unchanged (auth is infra)
