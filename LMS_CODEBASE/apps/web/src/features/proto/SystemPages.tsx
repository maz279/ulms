/* ============================================================
   System pages — Audit (#/audit) · Settings (#/settings) · Design
   System (#/designsystem) · Coverage (#/coverage) · Module Directory
   (#/directory) · Search (#/search) · Shortcuts (#/shortcuts) ·
   Notifications (#/notifications). Port of the prototype system
   pages.
   ============================================================ */
import * as React from "react";
import { ENV_LABEL } from "../../shell/envLabel";
import { pick, useLang } from "../../i18n/bilingual";
import { LMS_AREAS, LMS_MODULES } from "../../shell/navData";
import { Head, Btn, TBtn, KpiRow, Card, Grid, useGo, type Col } from "../../shell/ui";
import { Spark, Gauge } from "../../shell/charts";
import { typeIcon, lmSearch, type SearchHit } from "../../shell/search";
import { BRPD, ALERTS, rng } from "../../shell/demoData";

/* ================= AUDIT ================= */
export function AuditPage() {
  const r = rng("audit");
  const acts = ["APPROVE", "UPDATE", "CREATE", "VERIFY", "OVERRIDE", "EXPORT", "LOGIN"];
  const objs = ["APP-7239", "LN-300001", "CIF-100871", "LN-40160", "PRD-PL-01", "CFG-DENSITY", "APP-7248"];
  const users = ["r.islam", "f.akter", "k.chowdhury", "s.mia", "t.rahman"];
  const rows = Array.from({ length: 14 }, () => {
    const a = acts[Math.floor(r() * acts.length)], o = objs[Math.floor(r() * objs.length)];
    return {
      when: `2026-09-${String(26 - Math.floor(r() * 6)).padStart(2, "0")} ${String(8 + Math.floor(r() * 10)).padStart(2, "0")}:${String(Math.floor(r() * 59)).padStart(2, "0")}`,
      user: users[Math.floor(r() * users.length)], action: a, obj: o,
      change: a === "UPDATE" ? "status: Pending → Approved" : "n/a",
      control: a === "OVERRIDE" ? "maker-checker" : "logged",
    };
  });
  const cols: Col<typeof rows[number]>[] = [
    { key: "when", label: "When", render: (x) => <span className="mono">{x.when}</span> },
    { key: "user", label: "User", render: (x) => x.user },
    { key: "action", label: "Action", render: (x) => <span className="tag">{x.action}</span> },
    { key: "obj", label: "Object", render: (x) => <span className="mono">{x.obj}</span> },
    { key: "change", label: "Change", render: (x) => <span className="mono small">{x.change}</span> },
    { key: "control", label: "Control", render: (x) => x.control === "maker-checker" ? <span className="chip chip-warn">maker-checker</span> : <span className="chip chip-ok">logged</span> },
  ];
  return (
    <>
      <Head crumbs={[{ label: "Platform & Admin", to: "/workspace/H4" }, { label: "Audit Trail" }]}
        title={<>Audit Trail Viewer <span className="tag" style={{ verticalAlign: "middle" }}>immutable · WORM storage</span></>}
        sub="Every approve / modify / override captured · 18.4K events in 24h · 100% coverage"
        actions={<>
          <TBtn label="Export (CSV)" msg="14 events exported — digitally signed" />
          <TBtn label="SOX-style extract" msg="Extract queued for compliance" />
        </>} />
      <Grid cols={cols} rows={rows} rowKey={(x) => x.when + x.obj} />
    </>
  );
}

/* ================= SETTINGS ================= */
export function SettingsPage() {
  const [lang] = useLang();
  return (
    <>
      <Head crumbs={[{ label: "Platform & Admin", to: "/workspace/H5" }, { label: "System Settings" }]}
        title="System Settings" sub="Maker-checker applies to every change · Bangladesh localisation"
        actions={<>
          <TBtn label="Save changes" variant="btn-primary" msg="Form saved — routed to checker · audit captured" />
          <TBtn label="Request checker approval" msg="Change request #CR-882 routed to checker" />
        </>} />
      <div className="dm-layout" data-lang={lang}>
        <div className="dm-main">
          <div className="form-section">
            <h3>Localisation</h3>
            <div className="form-grid">
              <div className="field" data-req="1"><label>Primary language<span className="req">*</span></label>
                <select defaultValue="en"><option value="en">English</option><option value="bn">Bangla</option></select></div>
              <div className="field" data-req="1"><label>Number format<span className="req">*</span></label>
                <select><option>৳ Lakh / Crore (5,200 Cr)</option><option>৳ full digits</option></select></div>
              <div className="field" data-req="1"><label>Fiscal year<span className="req">*</span></label><select><option>July – June</option></select></div>
              <div className="field" data-req="1"><label>Timezone<span className="req">*</span></label><input readOnly defaultValue="Asia/Dhaka (GMT+6)" /></div>
            </div>
          </div>
          <div className="form-section">
            <h3>Working days & holidays</h3>
            <div className="form-grid">
              <div className="field span2"><label>Working days</label>
                <div className="flex" style={{ flexWrap: "wrap", gap: 10 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu"].map((d) => <label key={d} className="check"><input type="checkbox" defaultChecked /> {d}</label>)}
                  {["Fri", "Sat"].map((d) => <label key={d} className="check"><input type="checkbox" /> {d}</label>)}
                </div>
              </div>
              <div className="field"><label>Holiday calendar</label><input readOnly defaultValue="BB + lunar 2026 (loaded ✓)" /></div>
            </div>
          </div>
          <div className="form-section">
            <h3>Comms</h3>
            <div className="form-grid">
              <div className="field"><label>SMS gateway</label><select><option>SSL Wireless</option><option>Bulk SMS BD</option><option>Alpha</option></select></div>
              <div className="field"><label>Email relay</label><select><option>SendGrid</option><option>AWS SES</option></select></div>
              <div className="field"><label>Sender mask</label><input defaultValue="ABCBANK" /></div>
            </div>
          </div>
          <div className="form-section">
            <h3>Security</h3>
            <div className="form-grid">
              <div className="field"><label>Session timeout</label><select><option>15 min</option><option>30 min</option><option>60 min</option></select></div>
              <div className="field"><label>Password policy</label><select><option>BB ICT V4.0 (default)</option></select></div>
              <div className="field"><label>2FA for approvers</label><select><option>Enabled — TOTP</option><option>Disabled</option></select></div>
            </div>
          </div>
        </div>
        <aside>
          <Card title="Change discipline">
            <div className="fb-kv"><span>Maker</span><b>you</b></div>
            <div className="fb-kv"><span>Checker</span><b>admin-2</b></div>
            <div className="fb-kv"><span>Audit</span><b>always on</b></div>
            <div className="fb-kv"><span>Rollback</span><b>supported</b></div>
          </Card>
          <Card title="Environment">
            <div className="fb-kv"><span>Mode</span><b>{ENV_LABEL} build</b></div>
            <div className="fb-kv"><span>Core</span><b>Apache Fineract CE</b></div>
            <div className="fb-kv"><span>Deployment</span><b>bank on-prem (compose/k3s)</b></div>
          </Card>
        </aside>
      </div>
    </>
  );
}

/* ================= DESIGN SYSTEM ================= */
export function DesignPage() {
  const ramp = Array.from({ length: 16 }, (_, i) => (i + 1) * 10);
  return (
    <>
      <Head crumbs={[{ label: "Platform & Admin", to: "/workspace/H5" }, { label: "Design System" }]}
        title="ULMS Design System — INDIGO-FLUENT v3"
        sub="Tokens, components and archetypes — this living page is generated from the same CSS the app uses"
        actions={<TBtn label="Toggle dark" msg="Use the ☾ button in the top bar — dark theme restyles charts too" />} />
      <div className="dash-grid">
        <div className="w12"><Card title="Brand ramp">
          <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
            {ramp.map((i) => (
              <div key={i} style={{ flex: 1, minWidth: 60 }}>
                <div style={{ height: 38, borderRadius: 6, background: `var(--brand-${i})`, border: "1px solid var(--stroke)" }} />
                <div className="small" style={{ textAlign: "center" }}>{i}</div>
              </div>
            ))}
          </div>
        </Card></div>
        <div className="w4"><Card title="Buttons">
          <div className="flex" style={{ flexWrap: "wrap", gap: 8 }}>
            <TBtn label="Primary" variant="btn-primary" msg="primary" />
            <TBtn label="Secondary" msg="secondary" />
            <TBtn label="Danger" variant="btn-danger" msg="danger" />
            <TBtn label="Ghost" variant="btn-ghost" msg="ghost" />
            <TBtn label="Small" variant="btn-sm btn-primary" msg="small" />
          </div>
        </Card></div>
        <div className="w4"><Card title="BRPD chips">
          <div className="flex" style={{ flexWrap: "wrap", gap: 8 }}>
            {BRPD.map((b) => <span key={b.k} className={b.chip}>{b.k} · {b.prov}%</span>)}
          </div>
        </Card></div>
        <div className="w4"><Card title="Status chips">
          <div className="flex" style={{ flexWrap: "wrap", gap: 8 }}>
            {["ok", "warn", "err", "info", "neutral"].map((s) => <span key={s} className={`chip chip-${s}`}>{s}</span>)}
          </div>
        </Card></div>
        <div className="w6"><Card title="Form field">
          <div className="form-grid" style={{ padding: 0 }}>
            <div className="field"><label>Amount (৳)<span className="req">*</span></label><input defaultValue="1,500,000" className="num" /><span className="help">Lakh/Crore display per system setting</span></div>
            <div className="field invalid"><label>Required demo<span className="req">*</span></label><input value="" readOnly /><span className="err-msg">Required field</span></div>
          </div>
        </Card></div>
        <div className="w6"><Card title="Charts">
          <Spark vals={[4, 9, 7, 12, 8, 14, 11, 16]} w={120} h={32} />
          <div style={{ marginTop: 8 }}><Gauge pct={78} label="gauge demo" /></div>
        </Card></div>
        <div className="w12"><Card title="Density & theme">
          <div className="small">Cycle density with ◷ (compact 32px · comfortable 40px · spacious 48px rows) and toggle dark ☾ — both are real, persisted, and propagate to charts (palette read from CSS tokens).</div>
        </Card></div>
      </div>
    </>
  );
}

/* ================= COVERAGE ================= */
export function CoveragePage() {
  const go = useGo();
  const mids = Object.keys(LMS_MODULES);
  const rows = mids.map((mid) => {
    const m: any = (LMS_MODULES as any)[mid];
    return {
      mid, m,
      groups: m.groups.length,
      screens: m.groups.reduce((a: number, g: any) => a + g.screens.length, 0),
      reports: m.reports.length, forms: m.forms.length, frs: m.frs,
    };
  });
  const counts = {
    areas: LMS_AREAS.length, modules: rows.length,
    groups: rows.reduce((s, r) => s + r.groups, 0), screens: rows.reduce((s, r) => s + r.screens, 0),
    reports: rows.reduce((s, r) => s + r.reports, 0), forms: rows.reduce((s, r) => s + r.forms, 0),
    frs: rows.reduce((s, r) => s + r.frs, 0),
  };
  const cols: Col<typeof rows[number]>[] = [
    { key: "mid", label: "ID", render: (r) => <b>{r.mid}</b> },
    { key: "mod", label: "Module", render: (r) => `${r.m.icon} ${r.m.en}` },
    { key: "g", label: "Groups", numeric: true, render: (r) => r.groups },
    { key: "s", label: "Screens", numeric: true, render: (r) => r.screens },
    { key: "r", label: "Reports", numeric: true, render: (r) => r.reports },
    { key: "f", label: "Forms", numeric: true, render: (r) => r.forms },
    { key: "frs", label: "Functions", numeric: true, render: (r) => r.frs },
    { key: "st", label: "Routes", render: () => <span className="chip chip-ok">routes wired</span> },
    { key: "open", label: "", sortable: false, render: (r) => <Btn label="Open" variant="btn-sm btn-2nd" onClick={() => go(`/workspace/${r.mid}`)} /> },
  ];
  return (
    <>
      <Head crumbs={[{ label: "System", to: "/directory" }, { label: "Coverage" }]}
        title="Screen Coverage & Route Accounting"
        sub="Machine-checkable proof that every module, screen, report and form is reachable"
        actions={<TBtn label="Run self-test" variant="btn-primary" msg="Route harness: every /screen/:id resolves through the archetype engine" />} />
      <KpiRow items={[
        { l: "Areas", v: String(counts.areas), d: "top-level", st: "info" },
        { l: "Modules", v: String(counts.modules), d: "across 8 areas", st: "info" },
        { l: "Screens", v: String(counts.screens), d: "6 archetypes", st: "ok" },
        { l: "Reports", v: String(counts.reports), d: "+ statutory shelf", st: "ok" },
        { l: "Forms", v: String(counts.forms), d: "modal + wizard", st: "ok" },
        { l: "Functions", v: String(counts.frs), d: "register", st: "ok" },
      ]} />
      <Grid cols={cols} rows={rows} rowKey={(r) => r.mid} />
    </>
  );
}

/* ================= DIRECTORY ================= */
export function DirectoryPage() {
  const go = useGo();
  const [q, setQ] = React.useState("");
  const letters: Record<string, { mid: string; m: any; area: any }[]> = {};
  LMS_AREAS.forEach((a) => a.mods.forEach((mid: string) => {
    const m: any = (LMS_MODULES as any)[mid];
    const L = (m.en.replace(/[^A-Za-z]/g, "")[0] ?? "#").toUpperCase();
    (letters[L] = letters[L] ?? []).push({ mid, m, area: a });
  }));
  const Ls = Object.keys(letters).sort();
  const hit = (e: { mid: string; m: any; area: any }) => {
    if (!q.trim()) return true;
    const t = `${e.m.en} ${e.m.bn} ${e.area.en} ${e.m.groups.map((g: any) => `${g.en} ${g.screens.map((s: any) => s.en).join(" ")}`).join(" ")}`.toLowerCase();
    return t.includes(q.toLowerCase());
  };
  return (
    <>
      <Head crumbs={[{ label: "System" }, { label: "Module Directory" }]}
        title={<>Module Directory <span className="tag" style={{ verticalAlign: "middle" }}>A–Z</span></>}
        sub={`${counts2().modules} modules · ${counts2().groups} sub-module groups · ${counts2().screens} screens — every module card shows its area, counts and full module → group → screen tree`}
        actions={<TBtn label="Tell-ME search" variant="btn-primary" msg="Press Alt+Q anywhere — arrow keys + Enter" />} />
      <div className="field" style={{ maxWidth: 420, marginBottom: 14 }}>
        <label>Filter modules & screens</label>
        <input placeholder="e.g. CIB, collections, e-KYC, H4…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {Ls.map((L) => {
        const entries = letters[L].filter(hit);
        if (!entries.length) return null;
        return (
          <React.Fragment key={L}>
            <div className="nav-zone-h" style={{ padding: "var(--s-3, 12px) 0 6px", fontSize: 12 }}>{L}</div>
            <div className="dash-grid">
              {entries.map((e) => {
                const nScr = e.m.groups.reduce((a: number, g: any) => a + g.screens.length, 0);
                return (
                  <div className="card dir-mod w4" key={e.mid}>
                    <div className="card-h"><h3>{e.m.icon} {pick({ en: e.m.en, bn: e.m.bn })}</h3><span className="tag">{e.mid}</span></div>
                    <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="small">{e.m.en} · <span style={{ color: "var(--primary)", fontWeight: 600 }}>{e.area.en}</span></div>
                      <p style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{e.m.desc}</p>
                      <div className="small" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="tag">{e.m.groups.length} groups</span><span className="tag">{nScr} screens</span>
                        <span className="tag">{e.m.reports.length} reports</span><span className="tag">{e.m.forms.length} forms</span>
                      </div>
                      <div className="dir-groups">
                        {e.m.groups.map((g: any) => (
                          <div className="dir-g" key={g.en}>
                            <b>{g.en}</b>
                            {g.screens.map((s: any) => {
                              const r = s.route ? s.route.replace(/^#/, "") : `/screen/${s.id}`;
                              return (
                                <a key={s.id} href={r} title={`${s.en} · ${g.en}`}
                                  onClick={(ev) => { ev.preventDefault(); go(r); }}>{typeIcon(s.t)} {s.en}</a>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <Btn label="Open module →" variant="btn-sm btn-primary" onClick={() => go(`/workspace/${e.mid}`)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
      {!Ls.some((L) => letters[L].some(hit)) && (
        <div className="empty-state"><div className="e-ico">🔎</div><p>No module or screen matches that filter.</p></div>
      )}
    </>
  );
}
function counts2() {
  let groups = 0, screens = 0;
  Object.values(LMS_MODULES).forEach((m: any) => m.groups.forEach((g: any) => { groups++; screens += g.screens.length; }));
  return { modules: Object.keys(LMS_MODULES).length, groups, screens };
}

/* ================= SEARCH ================= */
export function SearchPage() {
  const [q, setQ] = React.useState("");
  const go = useGo();
  const res: SearchHit[] = q.trim() ? lmSearch(q) : [];
  return (
    <>
      <Head crumbs={[{ label: "System" }, { label: "Search" }]} title="Search"
        sub="Records, pages, reports, forms and actions — same index as Tell-ME (Alt+Q)"
        actions={
          <div className="field grow" style={{ maxWidth: 520 }}>
            <label>Search everything…</label>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything…" />
          </div>
        } />
      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="small" style={{ color: "var(--ink-500)" }}>Try:</span>
        {["LN-40118", "CL-1", "NPL", "CIF-100871", "New Application", "collections", "Basel"].map((s) => (
          <button key={s} className="vp" style={{ cursor: "pointer" }} onClick={() => setQ(s)}>{s}</button>
        ))}
      </div>
      <div className="dash-grid" style={{ marginTop: 12 }}>
        {res.length ? (
          <div className="w12"><Card title={`Results (${res.length})`}>
            <div className="miniList">
              {res.map((r, i) => (
                <div key={i} className="mi" style={{ cursor: "pointer" }} onClick={() => go(r.route)}>
                  <span className="t-ico">{r.ico}</span><span className="grow trunc">{r.t}</span><span className="tag">{r.g}</span>
                </div>
              ))}
            </div>
          </Card></div>
        ) : (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="e-ico">🔎</div>
            <p>{q ? "No matches — try a loan no (LN-…), CIF id or report name." : "Type above or pick a suggestion — results cover all 31 modules."}</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= SHORTCUTS ================= */
export function ShortcutsPage() {
  const map: [string, string][] = [
    ["Alt + Q", "Focus Tell-ME search"], ["Ctrl + K", "Command palette (alias of search)"],
    ["Ctrl + B", "Collapse / expand sitemap"], ["Ctrl + W", "Close active tab"],
    ["Ctrl + PgUp / PgDn", "Previous / next tab"], ["Ctrl + Shift + T", "Reopen last session"],
    ["Ctrl + /", "This shortcut sheet"], ["Esc", "Close mega menu · flyouts · copilot"],
    ["Enter / ↑ ↓", "Navigate Tell-ME results"], ["Click area ▸", "Open mega menu (column per group)"],
    ["★ on module", "Pin to favorites"], ["Click row", "Open record — grids are live"],
  ];
  return (
    <>
      <Head crumbs={[{ label: "System" }, { label: "Keyboard shortcuts" }]} title="Keyboard Shortcuts"
        sub="D365-aligned muscle memory for power users"
        actions={<Btn label="Print sheet" variant="btn-2nd" onClick={() => window.print()} />} />
      <div className="grid-wrap">
        <div className="scroll-x">
          <table className="usl-grid">
            <thead><tr><th>Keys</th><th>Action</th></tr></thead>
            <tbody>
              {map.map((x) => (
                <tr key={x[0]}>
                  <td>{x[0].split("+").map((k) => <kbd key={k} className="k">{k.trim()}</kbd>)}</td>
                  <td>{x[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ================= NOTIFICATIONS ================= */
export function NotificationsPage() {
  return (
    <>
      <Head crumbs={[{ label: "System" }, { label: "Notifications" }]} title="Notifications"
        sub="Real-time exception alerts across origination, risk and compliance"
        actions={<TBtn label="Mark all read" msg="All notifications marked read" />} />
      <Card title="">
        {ALERTS.map((a) => (
          <div className="alert-row" key={a.t}>
            <span className="a-ico">{a.ico}</span>
            <div className="grow"><b>{a.t}</b><div className="small">{a.d}</div></div>
            <span className="tag">{a.ago}</span>
            <TBtn label="Open" variant="btn-sm btn-2nd" msg="Alert opened — routed to owning module" />
          </div>
        ))}
      </Card>
    </>
  );
}
