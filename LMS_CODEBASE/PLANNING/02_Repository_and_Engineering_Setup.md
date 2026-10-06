# 02 — Repository & Engineering Setup

**Doc:** PLAN-002 · v1.0 · 2026-09-27 · Owner: Lead System Developer

---

## 1. Repository Strategy

Single **monorepo** (`ulms`) — one product, one team, atomic cross-layer changes.

```
ulms/
├── apps/
│   ├── api/                 # Spring Boot 4 modular monolith (modules per 03)
│   ├── web/                 # React 19 + Vite 7 staff app
│   ├── portal/              # borrower portal (same toolchain, separate bundle)
│   └── mobile/              # Expo CPV app
├── packages/
│   ├── openapi/             # API-first OpenAPI spec (source of truth) + generated clients
│   ├── ui/                  # design system ported from Front_end tokens (MUI v7 theme)
│   └── config/              # eslint, prettier, editorconfig, lint-staged shared
├── deploy/
│   ├── compose/             # dev environment (one command)
│   ├── helm/                # k3s chart (pilot)
│   └── seed/                # synthetic data seeds + Fineract bootstrap script
├── docs/
│   ├── adr/                 # architecture decision records (001..N per 01)
│   ├── runbooks/            # per 10
│   └── api/                 # generated API reference site
├── e2e/                     # Playwright suites (journeys from prototype gates)
└── .gitlab-ci.yml
```

## 2. Backend Toolchain (apps/api)

- Java 21 (Temurin), Spring Boot 4.0.x, Gradle (Kotlin DSL), Spring Modulith
  (module verification in tests), ArchUnit rules enforcing dependency direction.
- **Flyway** migrations (one per ticket, forward-only; per 04).
- **Testcontainers** (Postgres, Keycloak, Fineract container) — no H2 anywhere.
- Fineract client: **generated from Fineract's OpenAPI spec** at a pinned
  version, wrapped behind `mod-integration` port interfaces (Adapter+Facade —
  the community-validated pattern; see Fineract docs & sources in v3 §8).
- MapStruct for mapping; no reflection mappers in hot paths.
- Libraries banned without lead approval: spring-cloud-stream, camel, drools
  (keep the monolith boring).

## 3. Frontend Toolchain (apps/web, apps/portal)

- Vite 7 + React 19 + TypeScript 5.8 (strict), ESLint(+react-hooks,jsx-a11y),
  Prettier, vitest + Testing Library, Playwright in /e2e.
- TanStack Query (server state) + Zustand (UI state); React Hook Form + Zod
  schemas generated from OpenAPI types where practical.
- react-i18next; **CI check: no mixed-script leaf text** (ported from the
  prototype's i18n probe).
- Bundle gates: ≤250KB gz initial route chunk; MUI icon tree-shaking enforced.

## 4. CI/CD Pipeline (GitLab CI — jobs in order, all gates must pass)

| Stage | Jobs |
|---|---|
| verify | format-check · backend: compile + unit + ArchUnit/Modulith · web/mobile: lint + typecheck + unit · openapi: spec lint (spectral) + breaking-change diff |
| test | integration (Testcontainers) · module contract tests (Fineract adapter vs pinned container) · coverage ≥80% backend modules / ≥70% overall (jacoco+vite merged) |
| security | dependency scan (OWASP dependency-check / osv-scanner) · SAST (Semgrep) · **secret detection (gitleaks — hard fail)** · container scan (trivy) |
| build | docker images (api, web, portal) tagged `$CI_COMMIT_SHA` · SBOM (syft) |
| deploy-dev | auto on main → DEV compose; smoke suite (auth+one write+one read) |
| e2e | Playwright suite vs DEV (nightly + on demand) incl. a11y (axe) and i18n mixed-script check |
| release | manual tag → UAT; bank change window → pilot (helm upgrade) |

**Branching:** trunk-based; branch lifetime ≤2 days; PR ≥1 review; squash
merges; conventional commits (feeds CHANGELOG).

## 5. Environments & Configuration

- Config via env vars only (12-factor); per-env values in GitLab CI variables /
  bank secret store (pilot); **no credential literals anywhere in repo or docs**
  (CI gitleaks gate enforces; examples use `${PLACEHOLDER}`).
- `compose/` boots: postgres:17, keycloak:26 (realm import), fineract:pinned,
  minio, api, web, prometheus, grafana, loki. `make seed` loads synthetic bank
  (branches, products, 26 loans mirrors of prototype data) so every dev and
  every CI run has identical fixtures.

## 6. Definition of Done (per PR) & Sprint Ceremonies

DoD checklist (template in PR description):
- [ ] Tests (unit + module) and migration if schema touched
- [ ] OpenAPI updated; generated types refreshed
- [ ] Playwright journey updated if UI flow changed
- [ ] Audit events + feature flag if phased
- [ ] Docs/ADR if architectural; CHANGELOG entry
- [ ] No secrets, no TODOs without ticket refs

Ceremonies for 3 people (lightweight): 15-min daily stand-up; Thursday demo
(from DEV); Friday 45-min planning + retro combined; ADR review as needed.

## 7. Week-1 Setup Tasks (this document's acceptance test)

1. Repo + branches + CI skeleton green with a hello module. 2. Compose env
boots all services with seeded realm + data. 3. Walking-skeleton slice
(login→client create→list→audit row→metric) behind smoke tests. 4. ADR-001..004
merged. 5. Playwright skeleton runs headless in CI. Exit = Gate G0.
