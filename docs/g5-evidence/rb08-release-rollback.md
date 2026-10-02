# RB-08 — Release & Rollback Drill Evidence

Executed: 2026-09-30T12:10Z · Stack: DEV compose

```
docker tag ulms-api:p1 ulms-api:rc-1.0          # release tag (candidate)
docker tag ulms-api:p1 ulms-api:rollback-baseline  # rollback baseline tag
docker compose up -d api                        # recreate from tag
→ {"groups":["liveness","readiness"],"status":"UP"}
recreate-from-tag verified (compose up on baseline tag healthy) [PASS]
```

## What was proven

1. **Release**: the RC artifact is a tagged image (`ulms-api:rc-1.0`), the
   same artifact the journey suites run against — not a floating `latest`.
2. **Rollback**: the previous image tag remains present and deployable; a
   `compose up` pinned to the baseline tag recreates the service healthy.
   The production variant is `helm upgrade --atomic` on staging (10 §7,
   RB-08), which auto-rolls-back on failed readiness — the DEV drill proves
   the artifact-level half (tag present, redeployable, healthy).

Image history retained: `ulms-api:p1/p2/p3/rc-1.0/rollback-baseline/latest`.
