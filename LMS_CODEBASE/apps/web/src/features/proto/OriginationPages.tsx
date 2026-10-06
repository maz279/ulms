/* ============================================================
   My Approvals (#/approvals) + Pre-Disbursement console
   (#/disburse) — prototype pgApprovals / pgDisburse wired to the
   live applications/approvals/disbursements APIs (real acts:
   ladder walk, dual-auth payout).
   ============================================================ */
import * as React from "react";
import { Head, Btn, TBtn, KpiRow, Card, Grid, StatusChip, toast, FbKv, type Col } from "../../shell/ui";
import { Donut } from "../../shell/charts";
import {
  listApplications, currentTask, actOnTask, type ApplicationView,
} from "../../api/applications";
import { getLadder, type LadderRung } from "../../api/applications";
import {
  prepareDisbursement, authorizeDisbursement, releaseDisbursement,
  getDisbursementByApplication, type DisbursementView,
} from "../../api/disbursements";
import { listCustomers, type CustomerView } from "../../api/customers";
import { F } from "../../shell/demoData";
import { useAuth } from "../../auth/AuthProvider";
import { canApprove } from "../../auth/roles";

/* ================= APPROVALS ================= */
export function ApprovalsPage() {
  const auth = useAuth();
  const roles = auth.session?.roles ?? [];
  const [apps, setApps] = React.useState<ApplicationView[]>([]);
  const [custs, setCusts] = React.useState<Record<string, CustomerView>>({});
  const [ladder, setLadder] = React.useState<LadderRung[]>([]);
  const [tasks, setTasks] = React.useState<Record<string, any>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const [all, cPage, lad] = await Promise.all([
        listApplications(), listCustomers(1, 100), getLadder().catch(() => []),
      ]);
      const byId: Record<string, CustomerView> = {};
      cPage.data.forEach((c) => { byId[c.id] = c; });
      setCusts(byId);
      setLadder(lad);
      const waiting = all.filter((a) => a.stage === "APPROVAL");
      setApps(waiting);
      const tMap: Record<string, any> = {};
      await Promise.all(waiting.map(async (a) => {
        tMap[a.id] = await currentTask(a.id).catch(() => null);
      }));
      setTasks(tMap);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const act = async (appId: string, action: "APPROVE" | "REJECT" | "RETURN") => {
    const t = tasks[appId];
    if (!t) { toast("No open task on this application", "err"); return; }
    setBusy(appId);
    try {
      const res = await actOnTask(t.taskId, action, "r.islam", action === "APPROVE" ? "" : "via My Approvals");
      toast(`done — ${res.event}${res.nextTaskId ? " → next level" : " · workflow complete"}`);
      await load();
    } catch (e: any) {
      toast(String(e?.message ?? e), "err");
    } finally { setBusy(null); }
  };

  const totalMinor = apps.reduce((s, a) => s + a.amountMinor, 0);
  const rows = apps.map((a) => ({
    a, cust: custs[a.customerId],
    task: tasks[a.id],
    waiting: Math.max(1, Math.round((Date.now() - new Date(a.createdAt).getTime()) / 3600e3)),
    sla: 48,
  }));
  const cols: Col<typeof rows[number]>[] = [
    { key: "ref", label: "Ref", render: (r) => <span className="idchip">{r.a.appNo}</span> },
    { key: "case", label: "Case", render: (r) => <><b>{r.cust?.nameEn ?? r.a.customerId}</b><span className="sub">{r.a.productCode} · {r.a.branchCode}</span></> },
    { key: "amt", label: "Amount", numeric: true, render: (r) => F.tk(r.a.amountMinor), sortValue: (r) => r.a.amountMinor },
    { key: "lvl", label: "Level", render: (r) => r.task?.node ?? "—" },
    { key: "wait", label: "Waiting / SLA", numeric: true, sortValue: (r) => r.waiting, render: (r) => <span style={{ color: r.waiting > r.sla - 6 ? "var(--warn-bold,#F7630C)" : undefined }}>{r.waiting}h / {r.sla}h</span> },
    { key: "st", label: "Status", render: (r) => <StatusChip s={r.a.stage} /> },
    { key: "dbr", label: "DBR", numeric: true, render: (r) => (r.a.dbrPercent != null ? `${r.a.dbrPercent}%` : "—") },
    { key: "acts", label: "", sortable: false, render: (r) => r.task ? (
      canApprove(roles, r.task.node) ? (
        <span className="rowActs">
          <button title="Approve" disabled={busy === r.a.id} onClick={(e) => { e.stopPropagation(); void act(r.a.id, "APPROVE"); }}>✓</button>
          <button title="Return" disabled={busy === r.a.id} onClick={(e) => { e.stopPropagation(); void act(r.a.id, "RETURN"); }}>↩</button>
          <button title="Reject" disabled={busy === r.a.id} onClick={(e) => { e.stopPropagation(); void act(r.a.id, "REJECT"); }}>✕</button>
        </span>
      ) : (
        <span className="tag" title={`Requires ${/^L\d/.test(r.task.node) ? `ladder-${r.task.node.slice(1)}` : r.task.node} authority (or admin)`}
          data-testid="insufficient-role">🔒 {r.task.node}</span>
      )
    ) : <span className="tag">queued</span> },
  ];
  return (
    <>
      <Head crumbs={[{ label: "Approval Workflow", to: "/workspace/D1" }, { label: "My Approvals" }]}
        title={<>My Approvals <span className="tag" style={{ verticalAlign: "middle" }}>{apps.length} waiting</span></>}
        sub="Routed by DMN amount ladder · decisions maker-checkered · digital signature on confirm"
        actions={<>
          <TBtn label="Approve selected" variant="btn-primary" msg="Batch approval queued — signature pad will open per record" />
          <TBtn label="Delegate…" msg="Delegation form opened — authority transfer requires maker-checker" />
        </>} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <KpiRow items={[
        { l: "My queue", v: String(apps.length), d: F.tk(totalMinor) + " total", st: "info" },
        { l: "SLA risk", v: String(rows.filter((r) => r.waiting > 42).length), d: "escalate < 6h", st: rows.some((r) => r.waiting > 42) ? "err" : "ok" },
        { l: "Avg decision", v: "3.4h", d: "all levels", st: "ok" },
        { l: "Escalated (wk)", v: "2", d: "auto → next level", st: "warn" },
      ]} />
      <div className="dash-grid">
        <div className="w8">
          <Grid cols={cols} rows={rows} rowKey={(r) => r.a.id} />
        </div>
        <div className="w4">
          <Card title="Approval authority ladder">
            <div className="org-ladder">
              {(ladder.length ? ladder : FALLBACK_LADDER).map((x) => (
                <div className="ol-row" key={x.level}>
                  <span className="o-lvl">L{x.level}</span>
                  <span>{x.roleNameEn}<small className="muted" style={{ display: "block" }}>
                    {x.maxMinor ? `≤ ${F.tk(x.maxMinor)}` : `> ${F.tk(x.minMinor)}`}</small></span>
                  {x.level <= 3 ? <span className="chip chip-ok">you</span> : <span className="tag">DMN</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
const FALLBACK_LADDER: LadderRung[] = [
  { level: 1, roleKey: "BRANCH_CREDIT_HEAD", roleNameEn: "Branch Credit Head", minMinor: 0, maxMinor: 50000000 },
  { level: 2, roleKey: "BRANCH_MANAGER", roleNameEn: "Branch Manager", minMinor: 50000000, maxMinor: 100000000 },
  { level: 3, roleKey: "REGIONAL_MANAGER", roleNameEn: "Regional Manager", minMinor: 100000000, maxMinor: 250000000 },
  { level: 4, roleKey: "HEAD_OF_CREDIT", roleNameEn: "Head of Credit", minMinor: 250000000, maxMinor: 1000000000 },
  { level: 5, roleKey: "CREDIT_COMMITTEE", roleNameEn: "Credit Committee", minMinor: 1000000000, maxMinor: 5000000000 },
  { level: 6, roleKey: "DEPUTY_MD", roleNameEn: "Deputy MD", minMinor: 5000000000, maxMinor: 10000000000 },
  { level: 7, roleKey: "MANAGING_MD", roleNameEn: "Managing MD", minMinor: 10000000000, maxMinor: null },
];

/* ================= DISBURSE ================= */
export function DisbursePage() {
  const [apps, setApps] = React.useState<ApplicationView[]>([]);
  const [custs, setCusts] = React.useState<Record<string, CustomerView>>({});
  const [disb, setDisb] = React.useState<Record<string, DisbursementView | null>>({});
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const [all, cPage] = await Promise.all([listApplications(), listCustomers(1, 100)]);
      const byId: Record<string, CustomerView> = {};
      cPage.data.forEach((c) => { byId[c.id] = c; });
      setCusts(byId);
      const ready = all.filter((a) => ["SANCTION", "DISBURSEMENT"].includes(a.stage));
      setApps(ready);
      const dMap: Record<string, DisbursementView | null> = {};
      await Promise.all(ready.map(async (a) => {
        dMap[a.id] = await getDisbQuiet(a.id);
      }));
      setDisb(dMap);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const step = async (appId: string, action: "prepare" | "authorize" | "release") => {
    setBusy(true);
    try {
      const d = disb[appId];
      if (action === "prepare") await prepareDisbursement(appId);
      else if (action === "authorize" && d) await authorizeDisbursement(d.id);
      else if (action === "release" && d) await releaseDisbursement(d.id);
      toast("Dual-auth step executed — trail updated, audit written");
      await load();
    } catch (e: any) {
      toast(String(e?.message ?? e), "err");
    } finally { setBusy(false); }
  };

  const checks: [string, string, number][] = [
    ["Sanction letter issued", "BOCC resolution on file", 1],
    ["Agreement signed & scanned", "Dual-page PDF verified", 1],
    ["Collateral registered", "Land Registry ack #DCK-88231", 1],
    ["Insurance valid", "Policy expires in 54 days — conditional pass", 0],
    ["Limit loaded in Finacle", "CBS ref FIN-774102", 1],
    ["Ready to pay", "payout rail selected per application", 1],
  ];
  const readyTotal = apps.reduce((s, a) => s + a.amountMinor, 0);
  return (
    <>
      <Head crumbs={[{ label: "Disbursement", to: "/workspace/D2" }, { label: "Pre-Disbursement Console" }]}
        title={<>Pre-Disbursement Control <span className="tag" style={{ verticalAlign: "middle" }}>dual authorization</span></>}
        sub="System checks · Fineract limit sync · payout rails: CBS · BEFTN · bKash · Nagad · cheque"
        actions={<>
          <TBtn label="Execute all ready" variant="btn-primary" msg="Batch payout queued — dual auth pending by second officer" />
          <Btn label="Print memo" variant="btn-2nd" onClick={() => window.print()} />
        </>} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <KpiRow items={[
        { l: "Ready to disburse", v: `${apps.length} apps`, d: F.tk(readyTotal), st: "info" },
        { l: "Paid today", v: "৳1.42 Cr", d: "12 branches", st: "ok" },
        { l: "Failed / retry", v: "1", d: "bKash timeout", st: "warn" },
        { l: "Avg checklist TAT", v: "41 min", d: "from approval", st: "ok" },
      ]} />
      <div className="console-layout">
        <div className="con-steps">
          <div className="cs-item" style={{ color: "var(--ink-500)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Payout rail</div>
          {[["🏦", "CBS account credit", "real-time"], ["⇄", "BEFTN transfer", "1–2 days"],
            ["📱", "bKash", "real-time"], ["📱", "Nagad", "real-time"], ["🧾", "Cheque / cash", "branch"]].map((x) => (
            <div className="cs-item" key={x[1]}><span className="c-dot">{x[0]}</span><span>{x[1]}<small>{x[2]}</small></span></div>
          ))}
        </div>
        <div className="grow">
          <section className="card">
            <div className="card-h"><h3>Ready queue — dual-auth execution</h3><span className="live">● live</span></div>
            {apps.length === 0 && <div className="card-pad small">No applications at SANCTION / DISBURSEMENT stage — approve one through the ladder first.</div>}
            {apps.map((a) => {
              const d = disb[a.id];
              return (
                <div className="ck-row" key={a.id}>
                  <span className="ck-ico">{d?.state === "RELEASED" ? "✓" : d ? "!" : "›"}</span>
                  <div className="grow">
                    <b>{a.appNo} · {custs[a.customerId]?.nameEn ?? a.customerId}</b>
                    <small>{F.tk(a.amountMinor)} · {a.productCode} · state {d?.state ?? "SANCTION"}</small>
                  </div>
                  {!d && <Btn label="Prepare (A)" variant="btn-sm btn-primary" disabled={busy} onClick={() => void step(a.id, "prepare")} />}
                  {d?.state === "PREPARED" && <Btn label="Authorize (B≠A)" variant="btn-sm btn-primary" disabled={busy} onClick={() => void step(a.id, "authorize")} />}
                  {d?.state === "AUTHORIZED" && <Btn label="Release (C∉{A,B})" variant="btn-sm btn-primary" disabled={busy} onClick={() => void step(a.id, "release")} />}
                  {d?.state === "RELEASED" && <span className="chip chip-ok">paid · txn {d.fineractTxnId}</span>}
                </div>
              );
            })}
            <div className="card-pad" style={{ borderTop: "1px solid var(--stroke)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <TBtn label="Print checklist" variant="btn-2nd" msg="Checklist printed" />
              <TBtn label="Hold" variant="btn-2nd" msg="Case held — reason captured" />
            </div>
          </section>
          <section className="card" style={{ marginTop: 12 }}>
            <div className="card-h"><h3>Standard checklist (per case)</h3></div>
            {checks.map((x, i) => (
              <div key={i} className={`ck-row${x[2] ? " ok" : " warn"}`}>
                <span className="ck-ico">{x[2] ? "✓" : "!"}</span>
                <div className="grow"><b>{x[0]}</b><small>{x[1]}</small></div>
                {x[2] ? <span className="tag">auto</span>
                  : <TBtn label="Override…" variant="btn-sm btn-2nd" msg="Dual authorization override requested (maker → checker)" />}
              </div>
            ))}
          </section>
        </div>
        <aside className="con-metrics">
          <Card title="Rail mix — Sep">
            <Donut items={[
              { label: "CBS", value: 9, color: "var(--chart-1)" },
              { label: "BEFTN", value: 6, color: "var(--chart-6)" },
              { label: "MFS", value: 3, color: "var(--chart-3)" },
            ]} size={120} centerTop="18" centerBot="payouts" />
          </Card>
          <Card title="Dual-auth discipline">
            <FbKv k="Preparer ≠ authorizer" v="enforced (409)" />
            <FbKv k="Releaser ∉ {A,B}" v="enforced (409)" />
            <FbKv k="Trail" v="immutable" />
          </Card>
        </aside>
      </div>
    </>
  );
}

async function getDisbQuiet(appId: string): Promise<DisbursementView | null> {
  try {
    return await getDisbursementByApplication(appId);
  } catch {
    return null;
  }
}
