/* ============================================================
   Executive role center (#/home) — LIVE DATA EDITION (audit
   2026-10-03: every KPI, chart, funnel, table and alert below is
   computed from the real API; nothing is fabricated). The
   analytics page (#/analytics) remains a prototype reference and
   is badged as such.
   ============================================================ */
import { useNavigate } from "react-router-dom";
import { Head, Btn, KpiRow, Card, useGo, normalizeRoute } from "../../shell/ui";
import { Funnel, ClsStrip } from "../../shell/charts";
import { LMS_HOME_TILES } from "../../shell/navData";
import { listLoans, type LoanView } from "../../api/servicing";
import { listApplications, type ApplicationView } from "../../api/applications";
import { listCustomers } from "../../api/customers";
import { getBoard, type BoardData } from "../../api/compliance";
import { F } from "../../shell/demoData";   // formatters only — no data
import * as React from "react";

const NPL_CLASSES = new Set(["SS", "DF", "B/L"]);

interface HomeStats {
  loans: LoanView[];
  applications: ApplicationView[];
  board: BoardData | null;
  branchByCustomer: Map<string, string>;
}

export function HomePage() {
  const nav = useNavigate();
  const go = useGo();
  const [stats, setStats] = React.useState<HomeStats | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    void Promise.all([
      listLoans(),
      listApplications(),
      getBoard().catch(() => null),
      listCustomers(1, 1000),
    ]).then(([loans, applications, board, customers]) => {
      if (!alive) return;
      const branchByCustomer = new Map<string, string>();
      (customers as { data: { id: string; branchCode: string }[] }).data
        .forEach((c) => branchByCustomer.set(c.id, c.branchCode));
      setStats({ loans, applications, board, branchByCustomer });
    }).catch((e) => alive && setErr(String(e)));
    return () => { alive = false; };
  }, []);

  if (err) {
    return (
      <>
        <Head crumbs={[{ label: "ULMS" }, { label: "Home" }]} title="Executive Role Center" />
        <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>
      </>
    );
  }
  if (!stats) {
    return (
      <>
        <Head crumbs={[{ label: "ULMS" }, { label: "Home" }]} title="Executive Role Center" />
        <div className="empty-state"><div className="e-ico">◷</div><p>Loading live portfolio…</p></div>
      </>
    );
  }

  const { loans, applications, board, branchByCustomer } = stats;
  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingMinor, 0);
  const nplLoans = loans.filter((l) => NPL_CLASSES.has(l.classification));
  const nplPct = loans.length ? (nplLoans.length / loans.length) * 100 : 0;
  const provision = board?.latestRun?.totalProvisionMinor ?? 0;
  const coverage = totalOutstanding ? Math.min(100, (provision / totalOutstanding) * 100) : 0;

  // classification mix from the EOD board (falls back to live loan rows)
  const mix = new Map<string, number>();
  if (board?.loans?.length) {
    board.loans.forEach((l) => mix.set(l.classification, (mix.get(l.classification) ?? 0) + 1));
  } else {
    loans.forEach((l) => mix.set(l.classification, (mix.get(l.classification) ?? 0) + 1));
  }

  // origination funnel from live application stages
  const byStage = new Map<string, number>();
  applications.forEach((a) => byStage.set(a.stage, (byStage.get(a.stage) ?? 0) + 1));
  const stageCount = (s: string) => byStage.get(s) ?? 0;

  // branch aggregates: loans joined to customer branch (live)
  const branchAgg = new Map<string, { loans: number; out: number; npl: number }>();
  loans.forEach((l) => {
    const b = branchByCustomer.get(l.customerId) ?? "—";
    const a = branchAgg.get(b) ?? { loans: 0, out: 0, npl: 0 };
    a.loans++; a.out += l.outstandingMinor;
    if (NPL_CLASSES.has(l.classification)) a.npl++;
    branchAgg.set(b, a);
  });
  const branchRows = [...branchAgg.entries()]
    .sort((x, y) => y[1].out - x[1].out)
    .slice(0, 10);

  const waiting = stageCount("APPROVAL");
  const alerts = board?.openAlerts ?? [];

  return (
    <>
      <Head crumbs={[{ label: "ULMS" }, { label: "Home" }]}
        title="Executive Role Center"
        sub={<>ABC Bank Bangladesh · {branchAgg.size} branches live · {loans.length} active loans · <span className="chip chip-ok" style={{ height: 18 }}>● live</span></>}
        actions={<>
          <Btn label="＋ New Application" variant="btn-primary" onClick={() => nav("/apply")} />
          <Btn label="▤ Report Center" variant="btn-2nd" onClick={() => nav("/reports")} />
        </>} />
      <KpiRow items={[
        { l: "Gross portfolio", v: F.tk(totalOutstanding), d: <>{loans.length} loans · live</>, st: "ok" },
        { l: "Gross NPL", v: loans.length ? `${nplPct.toFixed(1)}%` : "—", d: <>{nplLoans.length} classified loans</>, st: nplPct > 5 ? "warn" : "ok" },
        { l: "Provision coverage", v: totalOutstanding ? `${coverage.toFixed(1)}%` : "—", d: provision ? `৳${F.tk(provision)} held` : "no EOD run yet", st: "ok" },
        { l: "Applications", v: String(applications.length), d: <>{waiting} awaiting approval</>, st: "info" },
        { l: "Disbursed loans", v: String(loans.filter((l) => l.stage === "ACTIVE" || l.stage === "CLOSED").length), d: "live from servicing", st: "ok" },
        { l: "Open alerts", v: String(alerts.length), d: alerts.length ? "compliance board" : "none open", st: alerts.length ? "warn" : "ok" },
      ]} />
      <div className="dash-grid">
        <div className="w6">
          <Card title="Origination funnel — live by stage">
            {applications.length === 0
              ? <div className="empty-state"><div className="e-ico">♺</div><p>No applications yet — the funnel fills as intake begins.</p></div>
              : <Funnel rows={[
                  { label: "Screening", value: stageCount("SCREENING") + stageCount("CIB_PULL") },
                  { label: "Scoring", value: stageCount("SCORING") },
                  { label: "CPV", value: stageCount("CPV") },
                  { label: "Approval", value: stageCount("APPROVAL") },
                  { label: "Sanction", value: stageCount("SANCTION") },
                  { label: "Disbursed", value: stageCount("DISBURSED") },
                ].filter((r) => r.value > 0)} />}
          </Card>
        </div>
        <div className="w6">
          <Card title="BRPD 15/2024 classification mix — live">
            {mix.size === 0
              ? <div className="empty-state"><div className="e-ico">♺</div><p>No classified loans yet — run EOD to populate the board.</p></div>
              : <>
                  <ClsStrip buckets={[...mix.entries()].map(([k, n]) => ({
                    label: k, value: n,
                    color: k.startsWith("STD") ? "var(--chart-2)" : "var(--bad)",
                  }))} />
                  <div className="small" style={{ marginTop: 8 }}>
                    {board?.latestRun
                      ? <>EOD {board.latestRun.runDate} · {board.latestRun.loansClassified} loans classified</>
                      : "no EOD run yet — counts from live loan rows"}
                  </div>
                </>}
            <div style={{ marginTop: 8 }}><Btn label="Open BRPD board" variant="btn-sm btn-2nd" onClick={() => nav("/classification")} /></div>
          </Card>
        </div>
        <div className="w4">
          <Card title="Priority alerts — live" more={<a className="more" href="#/notifications" onClick={(e) => { e.preventDefault(); nav("/notifications"); }}>View all</a>}>
            {alerts.length === 0
              ? <div className="empty-state"><div className="e-ico">✓</div><p>No open compliance alerts.</p></div>
              : alerts.slice(0, 6).map((a) => (
                <div className="alert-row" key={a.id}>
                  <span className="a-ico">🛡</span>
                  <div className="grow"><b>{a.type}</b><div className="small">{a.detail}</div></div>
                </div>
              ))}
          </Card>
        </div>
        <div className="w4">
          <Card title="Quick actions">
            <div className="kpiRow" style={{ margin: 0, gridTemplateColumns: "1fr 1fr" }}>
              {LMS_HOME_TILES.map((t: any) => (
                <a className="kpi status-info" key={t.label} href={normalizeRoute(t.route)} style={{ textAlign: "center" }}
                  onClick={(e) => { e.preventDefault(); go(t.route); }}>
                  <div style={{ fontSize: 22 }}>{t.icon}</div>
                  <div className="kpi-l">{t.label}</div>
                  {t.badge ? <span className="ni-badge" style={{ marginTop: 4 }}>{t.badge}</span> : null}
                </a>
              ))}
            </div>
          </Card>
        </div>
        <div className="w12">
          <Card title="Portfolio by branch — live">
            {branchRows.length === 0
              ? <div className="empty-state"><div className="e-ico">♺</div><p>No loans yet.</p></div>
              : <div className="scroll-x">
                  <table className="usl-grid">
                    <thead><tr>{["#", "Branch", "Loans", "Outstanding", "NPL loans", "NPL %"].map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {branchRows.map(([b, a], i) => (
                        <tr key={b}>
                          <td>{i + 1}</td>
                          <td><b>{b}</b></td>
                          <td className="num">{a.loans}</td>
                          <td className="num">{F.tk(a.out)}</td>
                          <td className="num">{a.npl}</td>
                          <td><span className={`chip ${a.npl / a.loans > 0.05 ? "chip-warn" : "chip-ok"}`}>
                            {((a.npl / a.loans) * 100).toFixed(1)}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
          </Card>
        </div>
      </div>
    </>
  );
}

/* ================= analytics (prototype reference) =================
   The full portfolio-analytics screen is a validated prototype page;
   until its live aggregates ship, it renders as an explicit reference. */
export function AnalyticsPage() {
  const nav = useNavigate();
  return (
    <>
      <Head crumbs={[{ label: "Insight & Compliance", to: "/workspace/G1" }, { label: "Portfolio Analytics" }]}
        title={<>Portfolio Analytics <span className="tag">PROTOTYPE REFERENCE</span></>}
        sub="Live aggregates are on the executive home; this screen keeps the validated prototype layout"
        actions={<Btn label="Back to live home" variant="btn-2nd" onClick={() => nav("/home")} />} />
      <div className="empty-state">
        <div className="e-ico">▦</div>
        <p>Prototype-reference screen — no figures are shown here so that no
        demo data can be mistaken for production numbers. Live portfolio
        KPIs, classification mix and branch aggregates live on the home page.</p>
      </div>
    </>
  );
}
