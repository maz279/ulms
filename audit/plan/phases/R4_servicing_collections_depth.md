# R4 — Servicing & Collections Depth
**Env:** Java + Node · **Est:** 2 weeks

## Deliverables
1. **Write-off processing (CORE)** — workflow: propose → committee approve → GL write-off JV → CIB report flag; reversal; CL-4 feed.
2. **NPA recovery tracking + incentives (CORE)** — recovery ledger per written-off account, incentive calculation, CL-3 feed.
3. **Guarantor management (CORE)** — `guarantor` registry linked to applications/loans; guarantor CIB check reuses the assessment port; obligation notifications.
4. **Notifications module (CORE)** — `notification_template` (BN/EN pairs), outbox consumer; SMS + email gateway ports with mock adapters (Robi/GP + SES shapes); delivery-status tracking; lifecycle triggers (application/approval/disbursement/EMI D-3/overdue/classification); template admin UI (H5-s3 screens).
5. **Dunning timers (v1.4.1 gap)** — queue/run/resolve backend scheduler with configurable ladder (Day1 SMS → Day7 call → Day15 visit → Day30 escalate → Day60 legal prep → Day90 NPA).
6. **AML depth (CORE-min)** — replace NoListScreeningAdapter with a list port + seeded PEP/sanctions lists; CDD/EDD workflow flags on customer; STR draft object + BFIU export; ≥৳10L STR alert surfaced in UI.

## Exit criteria
- [ ] Backend tests per flow; e2e: write-off → recovery entry; dunning auto-queues on EOD; notification rendered+delivered (mock) for 3 lifecycle events
- [ ] OpenAPI sync + mock parity + ledger updated
