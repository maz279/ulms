# UAT Test Pack — ABC Bank (R9)

**Entry criteria:** staging e2e green on the RC tag; UAT environment live with
migrated-like data (RB-12 rehearsal output); bank testers badged.
**Exit criteria:** 0 critical / 0 high defects; ≤5 medium accepted with
workarounds; sign-off letter filed (G5 item 2).

## Coverage matrix (200+ cases across 8 tracks)

| Track | Cases | Owner (bank) | Journeys |
|-------|-------|--------------|----------|
| 1. Customer & e-KYC | 30 | Branch ops | register → NID verify → screening → 360 view → guarantor attach |
| 2. Origination wizard | 35 | Branch credit | 6-step apply (draft/autosave/submit), decline paths, portal apply, partner intake |
| 3. Credit assessment | 20 | Credit analysts | CIB pull/viewer, score + DBR gate (auto-decline), collateral |
| 4. Approval & BOCC | 25 | Branch managers + committee | ladder walk L1–L7, BOCC schedule/vote/close/minutes, sanction letter accept |
| 5. Disbursement | 15 | Ops | checklist, dual-auth (3-officer chain), rail redirect, failure reverse |
| 6. Servicing & payments | 30 | Ops + finance | counter posting, statement CSV/JSON, settle quote, reschedule, write-off + recovery |
| 7. Collections | 25 | Collections officers | worklist priorities, PTP lifecycle (kept/broken), dunning queue, field-task complete from mobile |
| 8. Compliance & reporting | 25 | Compliance | EOD run, classification board 7-class, provision JV, CL pack generate→check→file, submission calendar |
| Cross-cutting (all) | ~15 | QA lead | i18n toggle, role gating, error states, offline mobile sync |

## Defect triage
- **Critical:** data corruption / money wrong / security — fix before any sign-off
- **High:** core journey blocked, no workaround — fix before sign-off
- **Medium:** workaround exists — bank may accept with dates
- **Low:** cosmetic / copy — backlog

Log: bank's tracker mirrored into `docs/g5-evidence/uat-defects.md`; each
closing MR references the case ID.

## Sign-off letter template (G5 item 2)
> We, the undersigned UAT owners of ABC Bank, confirm User Acceptance Testing
> of ULMS v2.0 on the RC build: 200+ cases executed, 0 critical / 0 high
> defects open, __ medium defects accepted with remediation dates. We
> recommend go-live.
