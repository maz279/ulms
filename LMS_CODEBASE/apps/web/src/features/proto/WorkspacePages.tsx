/* ============================================================
   Workspace (module landing) + function register — port of the
   prototype's pgWorkspace / pgFreg.
   ============================================================ */
import { useParams } from "react-router-dom";
import { pick } from "../../i18n/bilingual";
import { LMS_AREAS, LMS_MODULES } from "../../shell/navData";
import { Head, Btn, TBtn, KpiRow, Card, Grid, StatusChip, useGo, normalizeRoute, type Col } from "../../shell/ui";
import { typeIcon } from "../../shell/search";
import { FormOpenBtn } from "./ScreenPages";
import { h32 } from "../../shell/demoData";

export function WorkspacePage() {
  const { mid = "" } = useParams();
  const go = useGo();
  const m: any = (LMS_MODULES as any)[mid];
  if (!m) return <FormOpenBtnShim mid={mid} />;
  const area = LMS_AREAS.find((a) => a.id === m.area)!;
  return (
    <>
      <Head
        crumbs={[{ label: pick({ en: area.en, bn: area.bn }), to: "/directory" }, { label: pick({ en: m.en, bn: m.bn }) }]}
        title={<>{m.icon} {pick({ en: m.en, bn: m.bn })} <span className="tag" style={{ verticalAlign: "middle" }}>{mid}</span></>}
        sub={m.desc}
        actions={<>
          <Btn label="Function register" variant="btn-2nd" onClick={() => go(`/freg/${mid}`)} />
          <Btn label="All module reports" variant="btn-2nd" onClick={() => go(`/reports/${mid}`)} />
        </>} />
      {/* navData KPIs are PROTOTYPE reference numbers (from the validated UX
          contract) — badged so demo figures never read as production truth */}
      <div className="small" style={{ margin: "-6px 0 8px", opacity: 0.75 }}>
        <span className="tag">PROTOTYPE REFERENCE KPIs</span>
      </div>
      <KpiRow items={m.kpis.map((k: any) => ({ l: k.l, v: k.v, d: k.d, st: k.st }))} />
      <div className="dash-grid">
        <div className="w12" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
          {m.groups.map((g: any, i: number) => (
            <section className="card" key={g.en}>
              <div className="card-h"><h3>{i + 1}. {pick({ en: g.en, bn: g.bn ?? g.en })}</h3>
                <span className="more">{g.screens.length} screens</span></div>
              <div className="card-pad" style={{ padding: "8px 8px" }}>
                {g.screens.map((s: any) => {
                  const r = s.route ? normalizeRoute(s.route) : `/screen/${s.id}`;
                  return (
                    <a key={s.id} className="mega-link" href={r} onClick={(e) => { e.preventDefault(); go(r); }}>
                      <span>{typeIcon(s.t)}</span>
                      <span className="grow trunc">{pick({ en: s.en, bn: s.bn })}</span>
                      <span className="sc-type">{s.t}</span>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="w4">
          <Card title="Data entry forms">
            <div style={{ padding: 4 }}>
              {m.forms.map((f: string) => <FormOpenBtn key={f} mid={mid} formName={f} />)}
            </div>
          </Card>
        </div>
        <div className="w4">
          <Card title="Module reports">
            <div style={{ padding: 4 }}>
              {m.reports.map((rn: string, i: number) => (
                <a key={rn} className="mega-link" href={`/report/${mid}/${i}`} onClick={(e) => { e.preventDefault(); go(`/report/${mid}/${i}`); }}>
                  <span>📄</span><span className="grow trunc">{rn}</span><span className="sc-type">r</span>
                </a>
              ))}
            </div>
          </Card>
        </div>
        <div className="w4">
          <Card title="Cross-module links">
            <div className="card-pad" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {m.cross.map((c: string) => <span key={c} className="chip chip-info">{c}</span>)}
            </div>
            <div className="card-pad" style={{ borderTop: "1px solid var(--stroke)" }}>
              <div className="fb-kv"><span>Functions in register</span><b>{m.frs}</b></div>
              <div className="fb-kv"><span>Screens</span><b>{m.groups.reduce((a: number, g: any) => a + g.screens.length, 0)}</b></div>
              <div className="fb-kv"><span>Reports</span><b>{m.reports.length}</b></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
function FormOpenBtnShim({ mid }: { mid: string }) {
  return <Head crumbs={[{ label: "ULMS" }]} title={`Unknown module “${mid}”`} sub="Pick a module from the sitemap or directory." />;
}

/* ================= function register ================= */
export function FregPage() {
  const { mid = "" } = useParams();
  const go = useGo();
  const m: any = (LMS_MODULES as any)[mid];
  if (!m) return <FormOpenBtnShim mid={mid} />;
  let idx = 1;
  const rows: any[] = [];
  m.groups.forEach((g: any) => g.screens.forEach((s: any) => {
    rows.push({ n: idx++, s, g, rules: 2 + (h32(s.id) % 7) });
  }));
  const cols: Col<any>[] = [
    { key: "n", label: "#", numeric: true, render: (r) => r.n },
    { key: "fn", label: "Function", render: (r) => <><b>{pick({ en: r.s.en, bn: r.s.bn })}</b><span className="sub">{r.g.en}</span></> },
    { key: "t", label: "Type", render: (r) => `${typeIcon(r.s.t)} ${r.s.t}` },
    { key: "rules", label: "Rules", numeric: true, render: (r) => r.rules },
    { key: "st", label: "Status", render: () => <StatusChip s="configured" /> },
    { key: "open", label: "", sortable: false, render: (r) => (
      <Btn label="Open" variant="btn-sm btn-2nd" onClick={() => go(r.s.route ? normalizeRoute(r.s.route) : `/screen/${r.s.id}`)} />
    ) },
  ];
  return (
    <>
      <Head crumbs={[{ label: m.en, to: `/workspace/${mid}` }, { label: "Function register" }]}
        title={`Function register — ${m.en}`}
        sub={`Every function is bound to a screen and a maker-checker rule · ${m.frs} functions total`}
        actions={<TBtn label="Export register" msg="Register exported → Excel" />} />
      <Grid cols={cols} rows={rows} rowKey={(r) => r.s.id} />
    </>
  );
}
