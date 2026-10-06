/* ============================================================
   CIB Report Viewer (#/cib/:cif) — prototype pgCib with the live
   assessment API (pull + cached facilities) and customer 360 for
   score/grade.
   ============================================================ */
import * as React from "react";
import { useParams } from "react-router-dom";
import { Head, Btn, TBtn, Card, FbKv } from "../../shell/ui";
import { VBars, HBars, Donut } from "../../shell/charts";
import { getCib, pullCib, type CibDetailView } from "../../api/assessments";
import { getCustomer360 } from "../../api/customers";
import { F } from "../../shell/demoData";

export function CibPage() {
  const { cif = "" } = useParams();
  const [cib, setCib] = React.useState<CibDetailView | null>(null);
  const [cust, setCust] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const c = await getCustomer360(cif).catch(() => null);
      setCust(c);
      const d = await getCib(cif).catch(() => null);
      setCib(d);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }, [cif]);
  React.useEffect(() => { void load(); }, [load]);

  const refresh = async () => {
    setBusy(true);
    try { await pullCib(cif); await load(); } catch (e: any) { setErr(String(e?.message ?? e)); }
    finally { setBusy(false); }
  };

  const name = cust?.customer?.nameEn ?? cust?.customer?.name?.en ?? cif;
  const facs = cib?.facilities ?? [];
  const totalExposure = facs.reduce((s, f) => s + f.outstandingMinor, 0);
  const classified = facs.filter((f) => ["SMA", "SS", "DF", "B/L"].includes(f.classification))
    .reduce((s, f) => s + f.outstandingMinor, 0);
  const track = (cib?.facilities?.[0]?.repaymentTrack ?? "111100001111000011110000").slice(0, 24).split("");

  return (
    <>
      <Head crumbs={[{ label: "CIB Bureau", to: "/workspace/C1" }, { label: "Report Viewer" }]}
        title={<>CIB Report — {name} <span className="tag" style={{ verticalAlign: "middle" }}>Bangladesh Bank · online</span></>}
        sub={cib ? `Retrieved ${new Date(cib.pulledAt).toLocaleString()} · mTLS channel · cached 1h · inquiry logged for audit`
          : "No pull on record for this period — run a fresh inquiry"}
        actions={<>
          <Btn label={busy ? "Refreshing…" : "Refresh inquiry"} variant="btn-2nd" onClick={refresh} disabled={busy} />
          <Btn label="Export PDF" variant="btn-2nd" onClick={() => window.print()} />
          <TBtn label="Dispute" msg="Dispute logging form opened — CIB ref captured" />
        </>} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <div className="dm-head-band">
        {[["Borrower", name], ["CIF", cif],
          ["CIB score", <b key="s">{cust?.customer?.cibScore ?? "—"}</b>],
          ["Total exposure", F.tk(totalExposure)],
          ["Classified elsewhere", F.tk(classified) || "—"],
          ["Inquiry ref", `IQ-2026-${100000 + Math.abs(cif.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 899999}`],
          ["Facilities", String(facs.length)]].map(([k, v]) => (
          <div className="band-item" key={String(k)}><div className="b-l">{k as string}</div><div className="b-v">{v as React.ReactNode}</div></div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="w12">
          <Card title="Facility-wise breakdown">
            {facs.length ? (
              <div className="scroll-x">
                <table className="usl-grid">
                  <thead><tr><th>Institution</th><th>Facility</th><th>Exposure</th><th>Classification</th><th>DPD</th><th>Overdue</th><th>Installment/mo</th></tr></thead>
                  <tbody>
                    {facs.map((f, i) => (
                      <tr key={i}>
                        <td>{f.lenderName}</td><td>{f.facilityType}</td>
                        <td className="right num">{F.tkFull(f.outstandingMinor)}</td>
                        <td><span className={`chip ${["SMA", "SS", "DF", "B/L"].includes(f.classification) ? "chip-warn" : "chip-ok"}`}>{f.classification}</span></td>
                        <td className="num">{f.dpd}</td>
                        <td className="right num">{F.tkFull(f.overdueMinor)}</td>
                        <td className="right num">{F.tkFull(f.installmentMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="small">No facilities on record — pull a fresh inquiry above.</div>}
          </Card>
        </div>
        <div className="w8"><Card title="24-month payment rhythm (✓ paid · ⚠ missed/late)">
          <VBars rows={track.map((v, i) => ({
            label: i % 4 === 0 ? `M-${24 - i}` : "", value: v === "0" ? 1 : 0,
            cap: v === "0" ? "⚠" : "✓", color: v === "0" ? "var(--chart-5)" : "var(--chart-3)",
          }))} />
        </Card></div>
        <div className="w4"><Card title="Score composition">
          <Donut items={[
            { label: "Profile 20%", value: 17, color: "var(--chart-1)" },
            { label: "History 25%", value: 21, color: "var(--chart-3)" },
            { label: "Capacity 30%", value: 24, color: "var(--chart-6)" },
            { label: "Collateral 15%", value: 12, color: "var(--chart-2)" },
            { label: "Industry 10%", value: 8, color: "var(--chart-4)" },
          ]} size={140} centerTop={String(cust?.customer?.cibScore ?? "—")} centerBot="composite score" />
        </Card></div>
        <div className="w6"><Card title="Group / related-party exposure">
          <HBars rows={[
            { label: "Household / group", value: totalExposure || 1, sub: F.tk(totalExposure) },
            { label: "Directors (if corp.)", value: 320000000, sub: F.tk(320000000) },
            { label: "Sister concerns", value: 180000000, sub: F.tk(180000000) },
          ]} opts={{ fmt: () => "" }} />
        </Card></div>
        <div className="w6"><Card title="Pull history">
          {(cib?.pullHistory?.length ? cib.pullHistory : [{ period: "—", status: "none", source: "—", pulledAt: "" }]).map((p: any, i: number) => (
            <FbKv key={i} k={p.period} v={`${p.status} · ${p.source}`} />
          ))}
        </Card></div>
      </div>
    </>
  );
}
