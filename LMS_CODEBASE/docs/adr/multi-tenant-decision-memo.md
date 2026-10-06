# Multi-Tenant Decision Memo (R9 — master-plan decision D3)

**Decision required by:** pilot exit review (12 weeks after go-live).
**Owner:** Unisoft Technical Lead + bank IT Head.

## Question
Adopt schema-per-tenant multi-tenancy (SRS CORE — 62+ scheduled banks as a
hosted SaaS) or remain single-tenant (one deployment per bank)?

## Options

| Dimension | A. Single-tenant (current) | B. Schema-per-tenant |
|-----------|---------------------------|----------------------|
| Isolation | strongest (own DB + keys) | logical schema per bank in a shared cluster |
| Compliance fit | clean per-bank audit/backup boundaries | per-tenant Flyway runner + tenant-context routing needed; BB examiners can still scope per tenant |
| Ops cost per bank | one compose/k3s stack (~fixed cost each) | shared platform, marginal cost per tenant is low |
| Code impact now | none | significant: tenant context (RLS or schema switch), per-tenant Flyway (guide Phase-1 design), cross-tenant admin tooling, per-tenant backup/restore drills |
| Scaling to 10+ banks | expensive, but simple | the intended path |
| Blast radius | bank-local | shared platform incidents touch all tenants |

## Data points from the pilot (fill at review)
- Concurrent-bank pipeline count: ___
- DB size at pilot exit: ___ GB; growth rate: ___ GB/month
- Bank-side demand for hosted vs on-prem: ___
- Incident count traced to shared-resource contention: ___

## Recommendation (pre-pilot position)
Defer the build. Revisit when either trigger fires:
1. **≥3 signed banks** want hosted deployment, or
2. Pilot KPIs show a repeatable 4–6 week onboarding that per-tenant stacks
   would slow beyond the bank's tolerance.

If triggered: budget ~4–6 engineer-weeks for tenant context + Flyway runner +
admin tooling, plus an ADR (ADR-010) and a dedicated DR drill per tenant.
The modular-monolith keeps this a vertical carve, not a rewrite.
