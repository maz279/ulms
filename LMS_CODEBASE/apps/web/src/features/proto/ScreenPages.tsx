/* ============================================================
   Spec screen engine — React port of the prototype's pgScreen /
   pgRecord / pgFormHost: archetype dispatch over the navigation
   data (g=grid f=record x=360 c=console d=dashboard r=report).
   ============================================================ */
import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { pick, useLang } from "../../i18n/bilingual";
import { LMS_MODULES } from "../../shell/navData";
import {
  Head, Btn, TBtn, KpiRow, Card, Grid, StatusChip, DocRows, FbCard, FbKv, FilterPane,
  FilterHeader, FilterItem, FormModal, useGo, normalizeRoute, genRowCols, F, sparkFor,
} from "../../shell/ui";
import { LineChart, VBars, HBars, Donut, Gauge, Spark } from "../../shell/charts";
import { genRows, rng, BRANCHES, h32, type GenRow } from "../../shell/demoData";

function modOf(mid: string) { return (LMS_MODULES as any)[mid]; }

export function findScreen(sid: string): { mod: any; grp: any; scr: any; mid: string } | null {
  for (const mid of Object.keys(LMS_MODULES)) {
    const m: any = (LMS_MODULES as any)[mid];
    for (const grp of m.groups) for (const s of grp.screens) if (s.id === sid) return { mod: m, grp, scr: s, mid };
  }
  return null;
}
export function midOfModule(m: any): string {
  return Object.keys(LMS_MODULES).find((k) => (LMS_MODULES as any)[k] === m) ?? "";
}

/* ================= SCREEN (archetype dispatch) ================= */
export function ScreenPage() {
  const { sid = "" } = useParams();
  const hit = findScreen(sid);
  if (!hit) return <MissingPage />;
  if (hit.scr.route) return <Redirector route={normalizeRoute(hit.scr.route)} sid={sid} />;
  const map: Record<string, React.ComponentType<any>> = {
    g: GridArchetype, f: RecordArchetype, x: XArchetype, c: ConsoleArchetype, d: DashArchetype, r: ReportArchetypeScreen,
  };
  const El = map[hit.scr.t] ?? GridArchetype;
  return (
    <>
      {/* Archetype screens render the validated prototype layout with
          reference rows (genRows) — badged so demo figures never read as
          production data. Live registers live on their dedicated pages. */}
      <div className="small" style={{ padding: "4px 2px", opacity: 0.75 }}>
        <span className="tag">PROTOTYPE REFERENCE LAYOUT</span>
      </div>
      <El {...hit} />
    </>
  );
}
function Redirector({ route, sid }: { route: string; sid: string }) {
  const go = useGo();
  const { pathname } = useLocation();
  const target = route || "/home";
  React.useEffect(() => {
    if (target !== pathname) go(target);
  }, [target, pathname]);
  if (target === pathname) {
    // the screen's declared route IS this screen (e.g. Field App alias) — render its archetype
    const hit = findScreen(sid);
    if (hit) return <GridArchetypeOrArchetype hit={hit} />;
  }
  return <Head crumbs={[{ label: "Redirecting…" }]} title="Redirecting…" />;
}
function GridArchetypeOrArchetype({ hit }: { hit: { mod: any; grp: any; scr: any; mid: string } }) {
  const map: Record<string, React.ComponentType<any>> = {
    g: GridArchetype, f: RecordArchetype, x: XArchetype, c: ConsoleArchetype, d: DashArchetype, r: ReportArchetypeScreen,
  };
  const El = map[hit.scr.t] ?? GridArchetype;
  return <El {...hit} />;
}
function XArchetype() {
  const nav = useNavigate();
  React.useEffect(() => { nav("/cust/CIF-100871"); }, []);
  return <Head crumbs={[{ label: "Loading 360° view…" }]} title="Loading…" />;
}

/* ---------- archetype g · grid/list ---------- */
function GridArchetype({ mod, grp, scr, mid }: { mod: any; grp: any; scr: any; mid: string }) {
  const [lang] = useLang();
  const nav = useNavigate();
  const rows = React.useMemo(() => genRows(scr.id, 14), [scr.id]);
  const [statusSel, setStatusSel] = React.useState<Record<string, boolean>>({});
  const [view, setView] = React.useState<"all" | "large" | "flag">("all");
  const stPool = rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {});
  const visible = rows.filter((r) => {
    if (Object.values(statusSel).some((v) => !v)) {
      const on = Object.entries(statusSel).filter(([, v]) => v).map(([k]) => k);
      if (on.length && !on.includes(r.status)) return false;
    }
    if (view === "large") return r.amt >= 5000000;
    if (view === "flag") return /Broken|Reject|Overdue|Escalated/i.test(r.status);
    return true;
  });
  return (
    <>
      <Head
        crumbs={[{ label: pick({ en: mod.en, bn: mod.bn }), to: `/workspace/${mid}` }, { label: pick({ en: scr.en, bn: scr.bn }) }]}
        title={<>{pick({ en: scr.en, bn: scr.bn })} <span className="tag" style={{ verticalAlign: "middle" }}>archetype g · list</span></>}
        sub={`${pick({ en: scr.en, bn: scr.bn })} · ${grp.en} · ${pick({ en: mod.en, bn: mod.bn })}`}
        actions={<>
          <TBtn label="Export" msg="Exported 14 rows → Excel (demo dataset)" />
          <TBtn label="Refresh" msg="View refreshed from source" />
          <FormOpenBtn mid={mid} formName={mod.forms[0] ?? "New record"} label="＋ New" primary />
        </>} />
      <div className="list-layout" data-lang={lang}>
        <FilterPane>
          <FilterHeader>Status</FilterHeader>
          {Object.keys(stPool).map((s) => (
            <FilterItem key={s} checked={statusSel[s] ?? true} onChange={(v) => setStatusSel((prev) => ({ ...prev, [s]: v }))}>
              {" "}<StatusChip s={s} /> <span className="fp-n">{stPool[s]}</span>
            </FilterItem>
          ))}
          <FilterHeader>Branch</FilterHeader>
          {BRANCHES.slice(0, 6).map((b) => (
            <FilterItem key={b.id} checked>{b.name} <span className="fp-n">{Math.max(1, Math.round(rows.length / 8))}</span></FilterItem>
          ))}
          <FilterHeader>Saved views</FilterHeader>
          <label className="fp-item"><input type="radio" name={`sv-${scr.id}`} checked={view === "all"} onChange={() => setView("all")} /> All records <span className="fp-n">{rows.length}</span></label>
          <label className="fp-item"><input type="radio" name={`sv-${scr.id}`} checked={view === "large"} onChange={() => setView("large")} /> Large (≥ ৳50 L)</label>
          <label className="fp-item"><input type="radio" name={`sv-${scr.id}`} checked={view === "flag"} onChange={() => setView("flag")} /> ⚠ Exceptions</label>
          <div style={{ padding: "8px 10px" }}>
            <TBtn label="＋ Save view" variant="btn-sm btn-2nd" msg="Saved view created — available to your role" />
          </div>
        </FilterPane>
        <Grid
          cols={genRowCols((r) => nav(`/record/${scr.id}/${r.id}`))}
          rows={visible}
          rowKey={(r) => r.id}
          onRow={(r) => nav(`/record/${scr.id}/${r.id}`)}
          toolbar={<div className="view-pills">
            <button className={`vp${view === "all" ? " on" : ""}`} onClick={() => setView("all")}>All</button>
            <button className={`vp${view === "large" ? " on" : ""}`} onClick={() => setView("large")}>Large</button>
            <button className={`vp${view === "flag" ? " on" : ""}`} onClick={() => setView("flag")}>⚠ Exceptions</button>
          </div>}
          foot={<div className="grid-foot">Page 1 of 2 · {visible.length} records</div>} />
      </div>
    </>
  );
}

/* ---------- archetype f · record/form ---------- */
export function RecordArchetype({ mod, grp, scr, mid, row }: { mod: any; grp: any; scr: any; mid: string; row?: GenRow }) {
  const [lang] = useLang();
  const nav = useNavigate();
  const rows = React.useMemo(() => genRows(scr.id, 14), [scr.id]);
  const r = row ?? rows[0];
  const [tab, setTab] = React.useState(0);
  const steps = ["Draft", "Review", "Verification", "Approval", "Active"];
  const cur = h32(scr.id) % 5;
  const bpf = (
    <div className="bpf">
      {steps.map((s, i) => (
        <div key={s} className={`bpf-step${i < cur ? " done" : i === cur ? " current" : ""}`}>
          <span className="b-dot">{i < cur ? "✓" : i + 1}</span>
          <span>{s}<small>{i < cur ? `cleared · ${i + 1}d` : i === cur ? `with ${r.owner}` : "pending"}</small></span>
        </div>
      ))}
      <div className="bpf-step" style={{ flex: "none" }}><span className="tag">SLA 48h</span></div>
    </div>
  );
  const band = (
    <div className="dm-head-band">
      {[["Record", r.id], ["Title", r.title], ["Status", <StatusChip s={r.status} key="s" />],
        ["Amount", r.amt ? F.tk(r.amt) : "—"], ["Owner", r.owner], ["Branch", r.branch], ["Created", r.date]].map(([k, v]) => (
        <div className="band-item" key={String(k)}><div className="b-l">{k as string}</div><div className="b-v">{v as React.ReactNode}</div></div>
      ))}
    </div>
  );
  const tabs = ["General", "Lines & schedule", "Documents", "Activity", "Audit trail"];
  const FORMVOCAB_F: Record<string, string[]> = {
    A: ["Full name (English)", "Full name (Bangla)", "Father's name", "Mother's name", "Date of birth", "Gender", "Marital status", "NID (auto-verified)", "Passport no.", "TIN", "Mobile (OTP verified)", "Email", "Present address", "Permanent address", "Years at residence", "Employment type", "Employer / Business", "Monthly income", "Nominee name", "Nominee NID"],
    B: ["Application no.", "Customer (CIF)", "Product", "Loan amount (৳)", "Tenor (months)", "Purpose", "Repayment mode", "Interest type", "Collateral offered", "Guarantor name", "Branch", "Scheme / campaign", "Agent code", "Priority"],
    C: ["Inquiry ref", "Applicant", "NID / TIN", "Date of birth", "Purpose of inquiry", "Application ref", "Consent obtained", "Expected turnaround"],
    D: ["Reference", "Level", "Approver role", "Amount (৳)", "Conditions", "Delegation target", "Comment (required)", "Signature"],
    E: ["Loan account", "Customer", "Amount received (৳)", "Mode", "Value date", "Narration", "Waiver requested", "Receipt language"],
    F: ["Loan account", "DPD bucket", "Action type", "Promise date", "Promise amount (৳)", "Visit GPS", "Outcome", "Next follow-up"],
    G: ["Report name", "Parameters", "Schedule", "Recipients", "Format"],
    H: ["Setting", "Value", "Effective from", "Reason", "Maker", "Checker"],
  };
  const fields = FORMVOCAB_F[mod.area] ?? FORMVOCAB_F.A;
  return (
    <>
      <Head crumbs={[{ label: mod.en, to: `/workspace/${mid}` }, { label: grp.en }, { label: scr.en }]}
        title={<>{r.title} <span className="tag" style={{ verticalAlign: "middle" }}>archetype f · record</span></>}
        sub={`${r.id} · ${scr.bn} · ${r.sub}`}
        actions={<>
          <span className="locked-chip">🔒 Concurrent-edit lock · you</span>
          <Btn label="Print" variant="btn-2nd" onClick={() => window.print()} />
          <TBtn label="Submit (maker → checker)" variant="btn-primary" msg="Form saved — routed to checker · audit captured" />
        </>} />
      {bpf}
      {band}
      <div className="dm-layout" data-lang={lang}>
        <div className="dm-main">
          <div className="dm-tabs">
            <div className="dm-tabbar" role="tablist">
              {tabs.map((t2, i) => (
                <button key={t2} className={`dm-tab${i === tab ? " on" : ""}`} role="tab" aria-selected={i === tab} onClick={() => setTab(i)}>{t2}</button>
              ))}
            </div>
            {tab === 0 && (
              <div className="tabpane on">
                <div className="form-section">
                  <h3>Primary information <span className="h-note">autosave · 30s · maker-checker</span></h3>
                  <div className="form-grid">
                    {fields.map((f, i) => (
                      <div key={f} className={`field${i === 0 ? " prefill" : ""}`} data-req={i < 4 ? 1 : 0}>
                        <label>{f}{i < 4 ? <span className="req">*</span> : null}</label>
                        {/address|Employer|Narration|Conditions|Comment|Purpose|Reason|Parameters/i.test(f)
                          ? <textarea rows={2} placeholder="…" defaultValue={i === 0 ? r.title : ""} />
                          : <input type="text" placeholder={/date/i.test(f) ? "YYYY-MM-DD" : /amount|৳/i.test(f) ? "0.00" : /NID/i.test(f) ? "auto-verified from NIDW" : ""}
                              className={/amount|৳/.test(f) ? "num" : undefined} defaultValue={i === 0 ? r.title : ""} />}
                        <span className="err-msg">Required — {f} cannot be blank</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === 1 && (
              <div className="tabpane on">
                <div className="form-section">
                  <h3>Lines</h3>
                  <div className="scroll-x">
                    <table className="lines-table">
                      <thead><tr><th>#</th><th>Item</th><th>Value (৳)</th><th>Type</th><th>Status</th></tr></thead>
                      <tbody>
                        {[1, 2, 3].map((i) => (
                          <tr key={i}><td>{i}</td><td>Line item {i} — seeded from {mod.en}</td>
                            <td className="num">{F.tkFull(100000 * i * 7)}</td><td>Standard</td><td><StatusChip s="Active" /></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {tab === 2 && <div className="tabpane on"><div className="form-section"><h3>Documents</h3><DocRows n={5} seed={scr.id} /></div></div>}
            {tab === 3 && (
              <div className="tabpane on">
                <div className="card-pad timeline">
                  {[["✎", "Record created", `Draft captured from ${mod.en} intake`, `2d ago · ${r.owner}`],
                    ["🛡", "Status change", `Moved to ${r.status}`, "1d ago · system"],
                    ["⏱", "Task assigned", "Verification to field team", `22h ago · ${r.owner}`],
                    ["✓", "Checklist cleared", "4 of 4 checks green", "3h ago · checker-2"]].map((x, i) => (
                    <div key={i} className="tl-item"><span className="tl-ico">{x[0]}</span><b>{x[1]}</b><p>{x[2]}</p><div className="tl-meta">{x[3]}</div></div>
                  ))}
                </div>
              </div>
            )}
            {tab === 4 && (
              <div className="tabpane on">
                <div className="form-section">
                  <h3>Audit trail (immutable)</h3>
                  <div className="scroll-x">
                    <table className="usl-grid">
                      <thead><tr><th>When</th><th>User</th><th>Action</th><th>Field</th><th>Old → New</th></tr></thead>
                      <tbody>
                        {[["2026-09-24 10:12", "r.islam", "UPDATE", "status", `Pending → ${r.status}`],
                          ["2026-09-24 09:40", "maker-1", "CREATE", "record", "— → draft"],
                          ["2026-09-23 17:02", "f.akter", "VERIFY", "documents", "2 files → verified"]].map((x, i) => (
                          <tr key={i}><td className="num mono">{x[0]}</td><td>{x[1]}</td><td><span className="tag">{x[2]}</span></td><td>{x[3]}</td><td className="mono small">{x[4]}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside>
          <FbCard title="Next best action">
            <div className="nba">
              <h5>{mod.area === "F" ? "Field visit before SMS" : "Complete verification today"}</h5>
              <p>Based on {r.id} profile and SLA clock.</p>
              <TBtn label="Execute" variant="btn-sm btn-primary" msg={`Action executed — task dispatched to ${r.owner}`} />
            </div>
          </FbCard>
          <FbCard title="Key facts">
            <FbKv k="Stage" v={steps[cur]} /><FbKv k="SLA left" v="22h" /><FbKv k="Risk" v="Medium" />
            <FbKv k="Linked CIF" v={r.cust.cif} /><FbKv k="Loans" v={String(r.cust.relLoans)} />
          </FbCard>
          <FbCard title="Trend">
            <Spark vals={sparkFor(r.id)} />
            <div className="small" style={{ marginTop: 6 }}>Activity index, 14 days</div>
          </FbCard>
          <FbCard title="Related">
            <div className="fb-links">
              <a href={`#/cust/${r.cust.cif}`} onClick={(e) => { e.preventDefault(); nav(`/cust/${r.cust.cif}`); }}>◉ Customer 360</a>
              <a href="#/audit" onClick={(e) => { e.preventDefault(); nav("/audit"); }}>🧾 Audit entries</a>
              <a href={`#/report/${mid}/0`} onClick={(e) => { e.preventDefault(); nav(`/report/${mid}/0`); }}>📄 Module report</a>
            </div>
          </FbCard>
        </aside>
      </div>
    </>
  );
}

/* ---------- archetype c · console ---------- */
function ConsoleArchetype({ mod, scr, mid }: { mod: any; grp: any; scr: any; mid: string }) {
  const steps = ["Prepare", "Verify", "Approve", "Execute", "Reconcile"];
  const cur = h32(scr.id) % 5;
  const checks: [string, string, number][] = [
    ["Sanction letter issued", "BOCC resolution 2026-09-14", 1],
    ["Agreement signed & scanned", "Dual-page PDF verified", 1],
    ["Collateral charge registered", "Land Registry ack #DCK-88231", 1],
    ["Insurance valid", "Policy expires 2027-03-21", 1],
    ["Limit loaded in Finacle", "CBS ref FIN-774102", 1],
    ["First EMI date set", "2026-11-05", 1],
    ["e-KYC consent on file", "Version 3 · 2026-09-12", 0],
  ];
  return (
    <>
      <Head crumbs={[{ label: mod.en, to: `/workspace/${mid}` }, { label: scr.en }]}
        title={<>{scr.en} <span className="tag">archetype c · console</span></>}
        sub={`${scr.bn} · ${mod.desc}`}
        actions={<TBtn label="Refresh" msg="Console refreshed" />} />
      <div className="console-layout">
        <div className="con-steps">
          <div className="cs-item" style={{ color: "var(--ink-500)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Process</div>
          {steps.map((s, i) => (
            <div key={s} className={`cs-item${i < cur ? " done" : i === cur ? " current" : ""}`}>
              <span className="c-dot">{i < cur ? "✓" : i + 1}</span>
              <span>{s}<small>{i < cur ? "done" : i === cur ? "in progress · you" : "queued"}</small></span>
            </div>
          ))}
        </div>
        <div className="grow">
          <section className="card">
            <div className="card-h"><h3>{scr.en} — control checklist</h3><span className="live">● live</span></div>
            {checks.map((x, i) => (
              <div key={i} className={`ck-row${x[2] ? " ok" : " warn"}`}>
                <span className="ck-ico">{x[2] ? "✓" : "!"}</span>
                <div className="grow"><b>{x[0]}</b><small>{x[1]}</small></div>
                {x[2] ? <span className="tag">auto</span>
                  : <TBtn label="Override…" variant="btn-sm btn-2nd" msg="Override requested — dual authorization required (maker-checker)" />}
              </div>
            ))}
            <div className="card-pad" style={{ borderTop: "1px solid var(--stroke)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <TBtn label="Execute next step" variant="btn-primary" msg="Step executed — workflow advanced, audit written" />
              <TBtn label="Hold" msg="Placed on hold — reason captured" />
              <Btn label="Print checklist" variant="btn-2nd" onClick={() => window.print()} />
            </div>
          </section>
        </div>
        <aside className="con-metrics">
          <Card title="Health"><div style={{ textAlign: "center" }}><Gauge pct={86} label="controls green" /></div></Card>
          <Card title="Recent activity">
            {[["10:41", "Checklist 6/7 verified"], ["09:58", "Limit FIN-774102 loaded"], ["09:12", "Docs re-verified (checker-2)"], ["08:30", "Batch opened"]].map((x, i) => (
              <FbKv key={i} k={x[0]} v={x[1]} />
            ))}
          </Card>
        </aside>
      </div>
    </>
  );
}

/* ---------- archetype d · dashboard ---------- */
function DashArchetype({ mod, scr, mid }: { mod: any; grp: any; scr: any; mid: string }) {
  const r = React.useMemo(() => rng(scr.id), [scr.id]);
  const a: number[] = [], b: number[] = [];
  for (let i = 0; i < 12; i++) { a.push(Math.round(100 + r() * 250)); b.push(Math.round(80 + r() * 200)); }
  return (
    <>
      <Head crumbs={[{ label: mod.en, to: `/workspace/${mid}` }, { label: scr.en }]}
        title={<>{scr.en} <span className="tag">archetype d · dashboard</span></>}
        sub={`${scr.bn} · live with 5s refresh`}
        actions={<TBtn label="Export" msg="Dashboard exported to PDF" />} />
      <KpiRow items={mod.kpis.map((k: any) => ({ l: k.l, v: k.v, d: k.d, st: k.st }))} />
      <div className="dash-grid">
        <div className="w8"><Card title="Trend — 12 weeks">
          <LineChart labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"]}
            series={[{ name: "Inflow", data: a }, { name: "Resolved", data: b, color: "var(--chart-3)" }]} />
        </Card></div>
        <div className="w4"><Card title="Mix">
          <Donut items={[
            { label: "Green", value: Math.round(5 + r() * 10), color: "var(--ok-bold,#107C10)" },
            { label: "Watch", value: Math.round(2 + r() * 5), color: "var(--chart-2)" },
            { label: "Risk", value: Math.round(1 + r() * 3), color: "var(--chart-5)" },
          ]} size={140} centerTop="42%" centerBot="green" />
        </Card></div>
        <div className="w6"><Card title="Weekly volumes">
          <VBars rows={["W7", "W8", "W9", "W10", "W11", "W12"].map((w) => ({ label: w, value: Math.round(60 + r() * 180) }))} />
        </Card></div>
        <div className="w6"><Card title="Breakdown">
          <HBars rows={BRANCHES.slice(0, 6).map((x) => ({ label: x.name, value: Math.round(20 + r() * 100) }))} />
        </Card></div>
      </div>
    </>
  );
}

/* ---------- archetype r · report screen ---------- */
function ReportArchetypeScreen({ scr, mid }: { mod: any; grp: any; scr: any; mid: string }) {
  const nav = useNavigate();
  React.useEffect(() => { nav(`/report/${mid}/${h32(scr.id) % Math.max(1, modOf(mid).reports.length)}`); }, []);
  return null;
}

/* ================= RECORD route ================= */
export function RecordPage() {
  const { sid = "", rid = "" } = useParams();
  const hit = findScreen(sid);
  if (!hit) return <MissingPage />;
  const rows = genRows(sid, 14);
  const row = rows.find((r) => r.id === rid) ?? rows[parseInt(rid, 10) || 0] ?? rows[0];
  return <RecordArchetype {...hit} row={row} />;
}

/* ================= FORM host route ================= */
export function FormHostPage() {
  const { mid = "A1", name = "New record" } = useParams();
  const [open, setOpen] = React.useState(true);
  const mod = modOf(mid);
  return (
    <>
      <Head crumbs={[{ label: mod?.en ?? "ULMS", to: `/workspace/${mid}` }, { label: decodeURIComponent(name) }]}
        title={decodeURIComponent(name)} sub="Modal form — validation · autosave · maker-checker" />
      <div className="empty-state" style={{ minHeight: 200 }}>
        <div className="e-ico">✎</div>
        <p>{open ? "Form is open…" : "Form closed."}</p>
        {!open && <Btn label="Reopen form" variant="btn-primary" onClick={() => setOpen(true)} />}
      </div>
      {open && <FormModal mid={mid} name={decodeURIComponent(name)} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ---------- shared small pieces ---------- */
export function FormOpenBtn({ mid, formName, label, primary }: { mid: string; formName: string; label?: string; primary?: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (<>
    <Btn label={label ?? formName} variant={primary ? "btn-primary" : "btn-2nd"} onClick={() => setOpen(true)} />
    {open && <FormModal mid={mid} name={formName} onClose={() => setOpen(false)} />}
  </>);
}

/* ================= MISSING ================= */
export function MissingPage() {
  const nav = useNavigate();
  const { "*": frag } = useParams();
  return (
    <>
      <Head crumbs={[{ label: "ULMS" }]} title="Screen not found" sub={`No route matches “${frag ?? ""}”`} />
      <div className="empty-state">
        <div className="e-ico">🔎</div>
        <p>The link may be stale. Try the module directory or Tell-ME search (Alt+Q).</p>
        <div className="flex" style={{ justifyContent: "center" }}>
          <Btn label="Module Directory" variant="btn-primary" onClick={() => nav("/directory")} />
          <Btn label="Home" variant="btn-2nd" onClick={() => nav("/home")} />
        </div>
      </div>
    </>
  );
}
