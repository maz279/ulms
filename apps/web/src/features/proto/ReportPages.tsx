/* ============================================================
   Report Center (#/reports[/:mid]) · Report Viewer (#/report/:mid/:i)
   · Report Writer (#/writer) — prototype pgReports / pgReport /
   pgWriter, with the writer's save/run wired to the reporting API.
   ============================================================ */
import * as React from "react";
import { useParams } from "react-router-dom";
import { LMS_AREAS, LMS_MODULES } from "../../shell/navData";
import { Head, Btn, TBtn, Card, Grid, toast, useGo, FilterPane, FilterHeader, type Col } from "../../shell/ui";
import { VBars, Donut } from "../../shell/charts";
import { BRANCHES, F, rng } from "../../shell/demoData";
import { listDefinitions, saveDefinition, type ReportDefinitionView } from "../../api/regcon";

/* ================= REPORT CENTER ================= */
export function ReportsPage() {
  const { mid: midFilter } = useParams();
  const go = useGo();
  const [q, setQ] = React.useState("");
  const shelves = LMS_AREAS.map((a) => {
    const cards = a.mods.filter((mid: string) => !midFilter || mid === midFilter).map((mid: string) => {
      const m: any = (LMS_MODULES as any)[mid];
      return m.reports.map((_rn: string, i: number) => ({ mid, i, name: m.reports[i], kind: "operational" as const }));
    }).flat() as { mid: string; i: number; name: string; kind: string }[];
    return { a, cards };
  }).filter((s) => s.cards.length);
  const statutory: { mid: string; idx: number; name: string }[] = [];
  [["F1", "CL-1", "Classified loan details"], ["F1", "CL-2", "Provisioning details"], ["F1", "CL-3", "Recovery position"],
    ["F1", "CL-4", "Write-off details"], ["F1", "CL-5", "Restructured loans"], ["C1", "CIB-S", "CIB Subject file"],
    ["C1", "CIB-C", "CIB Contract file"], ["G3", "CAR", "Basel III capital adequacy"], ["G3", "ECL", "IFRS-9 ECL statement"]].forEach(([mid, code, title]) => {
    const m: any = (LMS_MODULES as any)[mid];
    const idx = m.reports.findIndex((r: string) => r.toLowerCase().includes(String(title).split(" ")[0].toLowerCase()));
    statutory.push({ mid: String(mid), idx: idx < 0 ? 0 : idx, name: `${code} — ${title}` });
  });
  const match = (name: string) => !q.trim() || name.toLowerCase().includes(q.toLowerCase());
  const repCard = (mid: string, idx: number, name: string, kind: string) => (
    <div key={`${mid}-${idx}-${name}`} className="rep-card" style={{ display: match(name) ? "" : "none" }}
      onClick={() => go(`/report/${mid}/${idx}`)}>
      <h4>📄 {name}</h4>
      <p>{kind === "statutory" ? "Bangladesh Bank statutory return · fixed format" : "Operational / management report · parameterised"}</p>
      <div className="rep-meta"><span className="tag">{mid}</span><span className="chip chip-ok">p95 11s</span><span className="tag">BN / EN</span></div>
    </div>
  );
  const totalReports = Object.values(LMS_MODULES).reduce((s, m: any) => s + m.reports.length, 0);
  return (
    <>
      <Head crumbs={[{ label: "Insight & Compliance", to: "/workspace/G2" }, { label: "Report Center" }]}
        title={<>Report Center <span className="tag" style={{ verticalAlign: "middle" }}>{totalReports} configured + statutory</span></>}
        sub="Bilingual output · PDF / Excel · p95 11s · scheduler with email delivery"
        actions={<>
          <Btn label="＋ Report Writer" variant="btn-primary" onClick={() => go("/writer")} />
          <TBtn label="My scheduled" msg="Scheduled runs — 96 in the last 24h, 0 failures" />
        </>} />
      <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
        <label>Search reports</label>
        <input placeholder="e.g. CL-1, aging, branch…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="fp-h" style={{ paddingLeft: 0 }}>Statutory — Bangladesh Bank</div>
      <div className="rep-shelf" style={{ marginBottom: 16 }}>
        {statutory.map((s) => repCard(s.mid, s.idx, s.name, "statutory"))}
      </div>
      {shelves.map((s) => (
        <React.Fragment key={s.a.id}>
          <div className="fp-h" style={{ paddingLeft: 0 }}>{s.a.en}</div>
          <div className="rep-shelf" style={{ marginBottom: 16 }}>
            {s.cards.map((c: any) => repCard(c.mid, c.i, c.name, "operational"))}
          </div>
        </React.Fragment>
      ))}
    </>
  );
}

/* ================= REPORT VIEWER ================= */
export function ReportViewerPage() {
  const { mid = "F1", idx = "0" } = useParams();
  const m: any = (LMS_MODULES as any)[mid];
  const i = parseInt(idx, 10) || 0;
  if (!m) return <Head crumbs={[{ label: "Report Center", to: "/reports" }]} title={`Unknown module ${mid}`} />;
  const name = m.reports[Math.min(i, m.reports.length - 1)];
  const r = rng(name);
  const branches = BRANCHES.slice(0, 8).map((b, bi) => ({
    label: b.name, value: Math.round(80 + r() * 400), hl: b.name === "Gulshan",
    npl: (2 + r() * 6).toFixed(1), bi,
  }));
  const rows = branches.map((b) => ({ ...b, v: b.value * 100000 }));
  const tot1 = rows.reduce((s, b) => s + b.v, 0);
  const cols: Col<typeof rows[number]>[] = [
    { key: "#", label: "#", numeric: true, render: (b) => b.bi + 1 },
    { key: "br", label: "Branch", render: (b) => b.label },
    { key: "exp", label: "Exposure", numeric: true, render: (b) => F.tkFull(b.v) },
    { key: "prov", label: "Provision required", numeric: true, render: (b) => F.tkFull(b.v * 0.31) },
    { key: "cls", label: "Classified", numeric: true, render: (b) => F.tkFull(b.v * 0.18) },
    { key: "npl", label: "NPL %", numeric: true, render: (b) => `${b.npl}%` },
  ];
  const totRow = { ...rows[0], label: "TOTAL — 65 branches", v: tot1, bi: -1, npl: "4.6" };
  return (
    <>
      <Head crumbs={[{ label: "Report Center", to: "/reports" }, { label: m.en, to: `/workspace/${mid}` }, { label: name }]}
        title={`📄 ${name}`}
        sub={`Viewing generated sample · parameters below · generated 2026-09-26 11:0${i % 9} by system`}
        actions={<>
          <TBtn label="Run" variant="btn-primary" msg="Re-run with parameters — preview refreshing" />
          <TBtn label="Schedule" msg="New schedule created — email delivery armed" />
          <Btn label="PDF" variant="btn-2nd" onClick={() => window.print()} />
          <TBtn label="Excel" msg="XLSX download started" />
          <TBtn label="Share" msg="Shared with Credit Ops distribution list" />
        </>} />
      <div className="list-layout">
        <FilterPane>
          <FilterHeader>Parameters</FilterHeader>
          <div style={{ padding: "0 10px 10px" }}>
            <div className="field"><label>Period</label><select><option>Sep 2026</option><option>Aug 2026</option><option>FY 2025-26</option></select></div>
            <div className="field" style={{ marginTop: 8 }}><label>Branch</label>
              <select>{["All 65 branches", ...BRANCHES.map((b) => b.name)].map((b) => <option key={b}>{b}</option>)}</select></div>
            <div className="field" style={{ marginTop: 8 }}><label>Currency display</label><select><option>৳ Lakh / Crore</option><option>৳ full</option></select></div>
            <div className="field" style={{ marginTop: 8 }}><label>Language</label><select><option>English</option><option>Bangla</option><option>Bilingual</option></select></div>
            <TBtn label="Apply" variant="btn-primary" msg="Report re-generated with selected parameters" />
          </div>
        </FilterPane>
        <div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 420px" }}><Card title="By branch (৳ Lakh)"><VBars rows={branches} /></Card></div>
            <div style={{ flex: "0 1 300px" }}><Card title="Mix">
              <Donut items={[
                { label: "Retail", value: 46, color: "var(--chart-1)" }, { label: "SME", value: 31, color: "var(--chart-2)" },
                { label: "Corporate", value: 15, color: "var(--chart-3)" }, { label: "Agri", value: 8, color: "var(--chart-7)" },
              ]} size={130} centerTop="100%" centerBot="mix" />
            </Card></div>
          </div>
          <Grid cols={cols} rows={[...rows, totRow]} rowKey={(b) => b.label} />
          <div className="grid-foot">Print-friendly · generated in 9.4s · audit ref RPT-{1000 + i}</div>
        </div>
      </div>
    </>
  );
}

/* ================= WRITER ================= */
const WSTEPS = ["Source", "Fields", "Filters", "Grouping", "Calculations", "Layout", "Schedule"];
export function WriterPage() {
  const [step, setStep] = React.useState(0);
  const [defs, setDefs] = React.useState<ReportDefinitionView[]>([]);
  const [name, setName] = React.useState("My branch risk pack");
  const [groupBy, setGroupBy] = React.useState("classification");
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(() => { listDefinitions().then(setDefs).catch(() => setDefs([])); }, []);

  const save = async () => {
    setErr(null);
    try {
      const d = await saveDefinition(name, groupBy, "NONE");
      setDefs((prev) => [...prev.filter((x) => x.id !== d.id), d]);
      toast("Report published to Report Center — added to your shelf");
    } catch (e: any) { setErr(String(e?.message ?? e)); }
  };
  return (
    <>
      <Head crumbs={[{ label: "Report Center", to: "/reports" }, { label: "Report Writer" }]}
        title={<>Report Writer <span className="tag" style={{ verticalAlign: "middle" }}>7 steps · governed data model</span></>}
        sub="Build over 60 governed materialised views — no SQL needed"
        actions={<>
          <TBtn label="Save draft" msg="Draft saved to My Reports" />
          <Btn label="Finish & publish" variant="btn-primary" onClick={() => void save()} />
        </>} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <div className="wiz">
        <div className="wiz-steps">
          {WSTEPS.map((s, i) => (
            <div key={s} className={`wiz-step${i === step ? " current" : i < step ? " done" : ""}`}
              style={{ cursor: "pointer" }} onClick={() => setStep(i)}>
              <span className="w-dot">{i < step ? "✓" : i + 1}</span>{s}
            </div>
          ))}
        </div>
        <div className="wiz-pane">
          <div className="form-section" style={{ margin: 0 }}>
            <h3>1 · Source — governed views</h3>
            <div className="form-grid">
              <div className="field" data-req="1"><label>Data domain<span className="req">*</span></label>
                <select defaultValue="loan"><option value="loan">Loan portfolio (MV_LOAN_PORTFOLIO)</option><option value="los">Applications (MV_LOS_PIPELINE)</option><option value="col">Collections (MV_COLLECTIONS)</option><option value="brpd">Classification (MV_BRPD_STAGE)</option><option value="cust">Customers (MV_CLIENT_X)</option></select></div>
              <div className="field" data-req="1"><label>Grain<span className="req">*</span></label>
                <select defaultValue="loan"><option value="loan">One row per loan</option><option value="emi">One row per EMI</option><option value="day">One row per day × branch</option></select></div>
              <div className="field" data-req="1"><label>Report name<span className="req">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="field"><label>Group by</label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="classification">Classification (BRPD)</option><option value="branch">Branch</option><option value="product">Product</option>
                </select></div>
            </div>
            <div className="card-pad" style={{ borderTop: "1px solid var(--stroke)" }}>
              <div className="small">Selected view exposes 42 columns · row-level security applies automatically (branch scope).</div>
            </div>
          </div>
        </div>
        <div className="wiz-foot">
          <Btn label="‹ Back" variant="btn-2nd" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} />
          {step < WSTEPS.length - 1
            ? <Btn label="Next ›" variant="btn-primary" onClick={() => { setStep((s) => Math.min(WSTEPS.length - 1, s + 1)); toast("Steps 2–7 simulated — field picker, filters, grouping, calc, layout, schedule"); }} />
            : <Btn label="Finish & publish" variant="btn-primary" onClick={() => void save()} />}
          <span className="spacer" />
          <span className="small">My reports: {defs.length} saved</span>
        </div>
      </div>
      {defs.length > 0 && (
        <Card title="My reports">
          <div className="miniList">
            {defs.map((d) => (
              <div className="mi" key={d.id}>
                <span className="idchip">{d.id}</span>
                <span className="grow trunc">{d.name}</span>
                <span className="tag">{d.groupBy}</span>
                <span className="small">by {d.createdBy}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
