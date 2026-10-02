/* ============================================================
   Executive role center (#/home) + Portfolio analytics (#/analytics)
   — React port of the prototype's pgHome / pgAnalytics.
   ============================================================ */
import { useNavigate } from "react-router-dom";
import { Head, Btn, TBtn, KpiRow, Card, useGo, normalizeRoute } from "../../shell/ui";
import { LineChart, VBars, HBars, Gauge, Funnel, ClsStrip, Heatmap } from "../../shell/charts";
import { LMS_HOME_TILES } from "../../shell/navData";
import { LOANS, BRANCHES, ALERTS, APPROVALS, BRPD, F, rng } from "../../shell/demoData";

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

export function HomePage() {
  const nav = useNavigate();
  const go = useGo();
  const disb = [288, 301, 342, 296, 318, 352, 331, 371, 384, 392, 401, 412].map((v) => v * 10);
  const recov = [252, 268, 281, 262, 279, 301, 289, 316, 328, 339, 351, 366].map((v) => v * 10);
  const buckets = BRPD.map((b) => ({ n: 0, amt: 0, b })).map((x) => {
    LOANS.forEach((l) => { if (BRPD[l.stage].k === x.b.k) { x.n++; x.amt += l.outstanding; } });
    return x;
  });
  const brRows = BRANCHES.map((b, i) => {
    const tgt = [45, 50, 32, 42, 55, 38, 30, 35, 28, 33][i], act = [52, 61, 38, 47, 58, 42, 24, 31, 33, 36][i];
    return { i, b, tgt, act, par: [3.1, 4.2, 5.8, 3.9, 4.4, 6.1, 7.2, 4.8, 8.9, 5.5][i], npl: [1.4, 1.9, 2.8, 1.8, 2.1, 3.0, 3.6, 2.3, 4.5, 2.7][i] };
  });
  return (
    <>
      <Head crumbs={[{ label: "ULMS" }, { label: "Home" }]}
        title="Executive Role Center"
        sub={<>ABC Bank Bangladesh · 65 branches · 45,230 active loans · <span className="chip chip-ok" style={{ height: 18 }}>● live</span></>}
        actions={<>
          <Btn label="＋ New Application" variant="btn-primary" onClick={() => nav("/apply")} />
          <TBtn label="Board pack (PDF)" msg="Board pack queued — 7 dashboards compiling to PDF" />
          <Btn label="▤ Report Center" variant="btn-2nd" onClick={() => nav("/reports")} />
        </>} />
      <KpiRow items={[
        { l: "Gross portfolio", v: "৳5,200 Cr", d: <><b className="up">+1.8%</b> m/m · 45,230 loans</>, st: "ok", spark: disb },
        { l: "Gross NPL", v: "4.6%", d: <><b className="up">−0.2pp</b> vs Aug · target ≤5%</>, st: "ok", spark: [6.8, 6.4, 6.1, 5.8, 5.5, 5.2, 5.0, 4.9, 4.8, 4.7, 4.6, 4.6] },
        { l: "Net NPL", v: "2.1%", d: "provision coverage 68.5%", st: "ok" },
        { l: "PAR-30", v: "6.2%", d: <><b className="dn">+0.3pp</b> — watch Gulshan</>, st: "warn" },
        { l: "Applications (Sep)", v: "342", d: <><b className="up">+12%</b> · drop-off 18%</>, st: "info" },
        { l: "Avg TAT", v: "1.9 days", d: "from 12 days legacy · target 2d", st: "ok" },
        { l: "Disbursed (Sep)", v: "৳412 Cr", d: "108% of monthly plan", st: "ok", spark: disb },
        { l: "Collection efficiency", v: "91.4%", d: "target 90% · PTP kept 72%", st: "ok" },
      ]} />
      <div className="dash-grid">
        <div className="w8">
          <Card title="Disbursed vs collected — trailing 12 months (৳ Lakh)">
            <LineChart labels={MONTHS} series={[
              { name: "Disbursed", data: disb },
              { name: "Collected", data: recov, color: "var(--chart-3)" },
            ]} />
          </Card>
        </div>
        <div className="w4">
          <Card title="BRPD 15/2024 classification mix">
            <ClsStrip buckets={buckets.map((x) => ({ label: x.b.k, value: x.n, color: x.b.color }))} />
            <div className="small" style={{ marginTop: 8 }}>Provision held <b>৳212 Cr</b> · coverage 68.5% · EOD batch 02:30 ✓</div>
            <div style={{ marginTop: 8 }}><Btn label="Open BRPD board" variant="btn-sm btn-2nd" onClick={() => nav("/classification")} /></div>
          </Card>
        </div>
        <div className="w6">
          <Card title="Origination funnel — September">
            <Funnel rows={[
              { label: "Received", value: 342, cap: "342 apps" },
              { label: "Screening passed", value: 301 },
              { label: "CIB cleared", value: 272 },
              { label: "Scored AAA–BBB", value: 224 },
              { label: "CPV passed", value: 196 },
              { label: "Approved", value: 243, cap: "71% approve" },
            ]} />
          </Card>
        </div>
        <div className="w6">
          <Card title="Disbursement by branch — top 6 (৳ Cr, Sep)">
            <VBars rows={BRANCHES.slice(0, 6).map((b, i) => ({ label: b.name, value: [52, 61, 38, 47, 58, 42][i], cap: `৳${[52, 61, 38, 47, 58, 42][i]} Cr` }))} />
          </Card>
        </div>
        <div className="w4">
          <Card title="Priority alerts" more={<a className="more" href="#/notifications" onClick={(e) => { e.preventDefault(); nav("/notifications"); }}>View all</a>}>
            {ALERTS.map((a) => (
              <div className="alert-row" key={a.t}>
                <span className="a-ico">{a.ico}</span>
                <div className="grow"><b>{a.t}</b><div className="small">{a.d}</div></div>
                <span className="tag">{a.ago}</span>
                <TBtn label="Open" variant="btn-sm btn-2nd" msg="Alert routed to owning module" />
              </div>
            ))}
          </Card>
        </div>
        <div className="w4">
          <Card title="My approvals waiting" more={<a className="more" href="#/approvals" onClick={(e) => { e.preventDefault(); nav("/approvals"); }}>Open inbox</a>}>
            <div className="miniList">
              {APPROVALS.slice(0, 4).map((a) => (
                <div className="mi" key={a.app.id} onClick={() => nav("/approvals")} style={{ cursor: "pointer" }}>
                  <span className="idchip">{a.app.id}</span>
                  <span className="grow trunc">{a.app.cust.en}</span>
                  <b className="num">{F.tk(a.app.amount)}</b>
                  <span className={`chip ${a.waitingHrs > a.slaHrs - 6 ? "chip-warn" : "chip-neutral"}`}>{a.waitingHrs}h</span>
                </div>
              ))}
            </div>
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
          <Card title="Branch performance — September"
            more={<a className="more" href="#/screen/G1-s3" onClick={(e) => { e.preventDefault(); nav("/screen/G1-s3"); }}>Full ranking</a>}>
            <div className="scroll-x">
              <table className="usl-grid">
                <thead><tr>{["#", "Branch", "Target", "Actual", "Achv %", "PAR-30", "NPL"].map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {brRows.map((r) => (
                    <tr key={r.b.id} onClick={() => nav("/screen/G1-s3")} style={{ cursor: "pointer" }}>
                      <td>{r.i + 1}</td>
                      <td><b>{r.b.name}</b><span className="sub">{r.b.region}</span></td>
                      <td className="num">{F.tk(r.tgt * 1e7)}</td>
                      <td className="num">{F.tk(r.act * 1e7)}</td>
                      <td><span className={`chip ${r.act / r.tgt >= 1 ? "chip-ok" : r.act / r.tgt >= 0.85 ? "chip-warn" : "chip-err"}`}>{Math.round((r.act / r.tgt) * 100)}%</span></td>
                      <td className="num">{r.par.toFixed(1)}%</td>
                      <td className="num">{r.npl.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ================= analytics ================= */
export function AnalyticsPage() {
  const nav = useNavigate();
  return (
    <>
      <Head crumbs={[{ label: "Insight & Compliance", to: "/workspace/G1" }, { label: "Portfolio Analytics" }]}
        title={<>Portfolio Analytics <span className="tag" style={{ verticalAlign: "middle" }}>drill-down enabled</span></>}
        sub="Vintage, roll-rates, aging and district heat — export pack ready"
        actions={<>
          <TBtn label="Export pack (PDF+XLS)" variant="btn-primary" msg="Analytics pack queued — 6 exhibits compiled" />
          <Btn label="Schedule weekly" variant="btn-2nd" onClick={() => nav("/writer")} />
        </>} />
      <KpiRow items={[
        { l: "Portfolio", v: "৳5,200 Cr", d: "+1.8% m/m", st: "ok" },
        { l: "PAR-30", v: "6.2%", d: "+0.3pp — watch", st: "warn" },
        { l: "Yield", v: "12.4%", d: "portfolio weighted", st: "ok" },
        { l: "Cost of risk", v: "1.9%", d: "annualised", st: "info" },
      ]} />
      <div className="dash-grid">
        <div className="w6"><Card title="Vintage curves — NPL % by origination cohort">
          <LineChart labels={MONTHS} series={[
            { name: "2023 vintage NPL%", data: [1.2, 1.4, 1.7, 2.1, 2.4, 2.6, 2.9, 3.1, 3.3, 3.4, 3.5, 3.6] },
            { name: "2024 vintage NPL%", data: [0.8, 0.9, 1.1, 1.3, 1.5, 1.6, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3], color: "var(--chart-3)" },
            { name: "2025 vintage NPL%", data: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.1, 1.2, 1.3], color: "var(--chart-6)" },
          ]} />
        </Card></div>
        <div className="w6"><Card title="Monthly roll-rates">
          <HBars rows={[
            { label: "STD → SMA", value: 3.2 }, { label: "SMA → SS", value: 1.8 }, { label: "SS → DF", value: 1.1 },
            { label: "DF → B/L", value: 0.7 }, { label: "SMA → STD (cure)", value: 2.4, color: "var(--chart-3)" },
          ]} opts={{ fmt: (v) => `${v}%` }} />
        </Card></div>
        <div className="w4"><Card title="DPD aging">
          <VBars rows={[
            { label: "0", value: 38900, cap: "38.9K" }, { label: "1–30", value: 3400, cap: "3.4K" },
            { label: "31–60", value: 1500, cap: "1.5K", color: "var(--chart-2)" }, { label: "61–90", value: 900, cap: "0.9K", color: "var(--chart-2)" },
            { label: "91–180", value: 340, cap: "340", color: "var(--chart-5)" }, { label: "181+", value: 190, cap: "190", color: "var(--chart-5)" },
          ]} />
        </Card></div>
        <div className="w4"><Card title="District exposure">
          <HBars rows={[
            { label: "Dhaka", value: 2100 }, { label: "Chattogram", value: 880 }, { label: "Sylhet", value: 520 },
            { label: "Khulna", value: 480 }, { label: "Rajshahi", value: 430 }, { label: "Other", value: 790 },
          ]} opts={{ fmt: (v) => `৳${v} Cr` }} />
        </Card></div>
        <div className="w4"><Card title="Collection efficiency">
          <div style={{ textAlign: "center" }}><Gauge pct={91.4} label="vs 90% target" warnAt={80} errAt={70} /></div>
        </Card></div>
        <div className="w12"><Card title="Branch × month disbursement heat (৳ Cr)">
          <Heatmap rows={BRANCHES.slice(0, 6).map((b) => b.name)} cols={["Apr", "May", "Jun", "Jul", "Aug", "Sep"]}
            valFn={(r, c) => { const rr = rng(r + c); return rr() * 0.9 + 0.05; }} />
        </Card></div>
      </div>
    </>
  );
}
