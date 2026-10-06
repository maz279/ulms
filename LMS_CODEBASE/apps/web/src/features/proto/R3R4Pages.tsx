/* ============================================================
   R3/R4/R5 pages — products catalog+admin, sanctions, BOCC,
   write-off/recovery console, notifications admin. Prototype-
   faithful DOM/classes; live API data; role-gated actions.
   ============================================================ */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Head, Btn, TBtn, KpiRow, Card, Grid, StatusChip, toast, type Col } from "../../shell/ui";
import { useAuth } from "../../auth/AuthProvider";
import { COLLECTIONS_WRITE, DISBURSEMENT_WRITE } from "../../auth/roles";
import { formatTk } from "../../api/money";
import {
  listProducts, createProduct, activateProduct, productEligibility, type LoanProduct,
  listSanctions, generateSanction, acceptSanction, resendSanction, type SanctionLetter,
  listMeetings, scheduleMeeting, checkIn, voteCase, closeMeeting, type BoccMeeting,
  listOutbox, relayOutbox, type OutboxEvent,
  listWriteOffs, proposeWriteOff, approveWriteOff, reverseWriteOff, recordRecovery, type WriteOff,
  listTemplates, upsertTemplate, listDeliveries, sendNotification, type NotifTemplate, type NotifDelivery,
} from "../../api/r3r4r5";
import { listApplications, type ApplicationView } from "../../api/applications";

/* ============ R3: product catalog + admin (B2 wired) ============ */
export function ProductsPage() {
  const auth = useAuth();
  const admin = (auth.session?.roles ?? []).includes("admin");
  const nav = useNavigate();
  const [rows, setRows] = React.useState<LoanProduct[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ code: "", nameEn: "", nameBn: "", min: 5, max: 100, rate: 1200 });
  const [elig, setElig] = React.useState<{ amt: number; tenor: number; result: any } | null>(null);

  const refresh = React.useCallback(async () => {
    try { setRows(await listProducts(admin)); setErr(null); } catch (e) { setErr(String(e)); }
  }, [admin]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const checkEligibility = async (code: string) => {
    try {
      const amountMinor = (elig?.amt ?? 15) * 100000 * 100;
      const tenorMonths = elig?.tenor ?? 48;
      const result = await productEligibility(code, amountMinor, tenorMonths);
      setElig({ amt: elig?.amt ?? 15, tenor: elig?.tenor ?? 48, result });
    } catch (e) { toast(String(e), "err"); }
  };

  const cols: Col<LoanProduct>[] = [
    { key: "code", label: "Code", sortValue: (p) => p.code, render: (p) => <span className="idchip">{p.code}</span> },
    { key: "name", label: "Product (bilingual)", sortValue: (p) => p.nameEn,
      render: (p) => <><b>{p.nameEn}</b><span className="sub">{p.nameBn ?? "—"}</span></> },
    { key: "range", label: "Amount range", sortValue: (p) => p.minAmountMinor, render: (p) => `${formatTk(p.minAmountMinor)} – ${formatTk(p.maxAmountMinor)}` },
    { key: "tenor", label: "Tenor", numeric: true, sortValue: (p) => p.tenorMaxMonths, render: (p) => `${p.tenorMinMonths}–${p.tenorMaxMonths}m` },
    { key: "rate", label: "Rate", numeric: true, sortValue: (p) => p.rateBp, render: (p) => `${(p.rateBp / 100).toFixed(2)}%` },
    { key: "security", label: "Security", render: (p) => p.security.collateral || p.security.guarantor
      ? `${p.security.collateral ? " collateral" : ""}${p.security.guarantor ? " + guarantor" : ""}`.trim() : "clean" },
    { key: "status", label: "Status", sortValue: (p) => p.status, render: (p) => <StatusChip s={p.status} /> },
    { key: "acts", label: "", sortable: false, render: (p) => (
      <span className="rowActs">
        <button title="Eligibility check" onClick={() => void checkEligibility(p.code)}>⚖</button>
        {admin && p.status === "DRAFT" && (
          <button title="Activate" onClick={async () => { try { await activateProduct(p.code); toast(`${p.code} v${p.version} activated`); await refresh(); } catch (e) { toast(String(e), "err"); } }}>✓</button>
        )}
      </span>
    ) },
  ];

  return (
    <>
      <Head crumbs={[{ label: "Loan Origination (LOS)", to: "/workspace/B2" }, { label: "Product Catalog" }]}
        title={<>Product Catalog <span className="tag" style={{ verticalAlign: "middle" }}>{rows.length} configured · bilingual</span></>}
        sub="23-product engine: amounts, tenors, rates, charges, security rules — maker-checker versioned (R3)"
        actions={<>
          <Btn label="＋ New Application" variant="btn-primary" onClick={() => nav("/apply")} />
          <TBtn label="Export catalog" msg="Catalog exported → Excel" />
        </>} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <KpiRow items={[
        { l: "Active products", v: String(rows.filter((p) => p.status === "ACTIVE").length), d: "retail · SME · agri · Islamic", st: "info" },
        { l: "Draft versions", v: String(rows.filter((p) => p.status === "DRAFT").length), d: "awaiting activation", st: "warn" },
        { l: "Secured products", v: String(rows.filter((p) => p.security.collateral).length), d: "collateral required", st: "ok" },
      ]} />
      <Grid cols={cols} rows={rows} rowKey={(p) => `${p.code}-${p.version}`} />
      {elig?.result && (
        <Card title={`Eligibility — ${elig.result.product} · ৳${elig.amt} L / ${elig.tenor}m`}>
          <div className="chip-row">
            <StatusChip s={elig.result.eligible ? "ACTIVE" : "Pending"} />
            {elig.result.emiMinor != null && <span className="tag">EMI {formatTk(elig.result.emiMinor)}/mo</span>}
            {elig.result.violations?.map((v: string) => <span key={v} className="chip chip-err">{v}</span>)}
          </div>
        </Card>
      )}
      {admin && (
        <Card title="New product (maker — checker activates)">
          <div className="form-grid" style={{ padding: 0 }}>
            {[["code", "Code"], ["nameEn", "Name (EN)"], ["nameBn", "Name (BN)"]].map(([k, l]) => (
              <div key={k} className="field" data-req={k === "code" || k === "nameEn" ? 1 : 0}>
                <label>{l}{k === "code" || k === "nameEn" ? <span className="req">*</span> : null}</label>
                <input data-testid={`product-${k}`} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div className="field"><label>Min (৳ L)</label><input type="number" data-testid="product-min" value={form.min} onChange={(e) => setForm({ ...form, min: +e.target.value })} /></div>
            <div className="field"><label>Max (৳ L)</label><input type="number" data-testid="product-max" value={form.max} onChange={(e) => setForm({ ...form, max: +e.target.value })} /></div>
            <div className="field"><label>Rate (bp)</label><input type="number" data-testid="product-rate" value={form.rate} onChange={(e) => setForm({ ...form, rate: +e.target.value })} /></div>
          </div>
          <div style={{ padding: "10px 0" }}>
            <Btn label="Create draft" variant="btn-primary" onClick={async () => {
              try {
                await createProduct({
                  code: form.code, nameEn: form.nameEn, nameBn: form.nameBn,
                  minAmountMinor: form.min * 100000 * 100, maxAmountMinor: form.max * 100000 * 100,
                  tenorMinMonths: 6, tenorMaxMonths: 60, rateBp: form.rate,
                  security: { collateral: true, guarantor: false, maxLtvBp: 7000 },
                } as any);
                toast(`Draft ${form.code} created — activate to publish`);
                await refresh();
              } catch (e) { toast(String(e), "err"); }
            }} />
          </div>
        </Card>
      )}
    </>
  );
}

/* ============ R3: sanction letters (B4 wired) ============ */
export function SanctionsPage() {
  const [apps, setApps] = React.useState<ApplicationView[]>([]);
  const [letters, setLetters] = React.useState<SanctionLetter[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const refresh = React.useCallback(async () => {
    try {
      const [apps2, letters2] = await Promise.all([listApplications(), listSanctions()]);
      setApps(apps2);
      setLetters(letters2);   // rehydrate — navigating away and back must not lose issued letters
      setErr(null);
    } catch (e) { setErr(String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const sanctioned = apps.filter((a) => a.stage === "SANCTION");
  const generate = async (id: string) => {
    try {
      const letter = await generateSanction(id);
      setLetters((prev) => [letter, ...prev]);
      toast(`Letter issued for ${letter.appNo} — tokenized acceptance link armed`);
    } catch (e) { toast(String(e), "err"); }
  };

  return (
    <>
      <Head crumbs={[{ label: "Loan Origination (LOS)", to: "/workspace/B4" }, { label: "Sanction & Letters" }]}
        title={<>Sanction Letters <span className="tag" style={{ verticalAlign: "middle" }}>bilingual · acceptance tracked</span></>}
        sub="Auto-generated on SANCTION · BN+EN bodies · portal acceptance via tokenized link · branch copy (R3)"
        actions={<TBtn label="Template library" msg="Template editor (maker-checker)" />} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <Card title={`Awaiting letter generation (${sanctioned.length})`}>
        {sanctioned.length === 0 && <div className="small">No applications at SANCTION stage — approve one through the ladder first.</div>}
        {sanctioned.map((a) => (
          <div key={a.id} className="ck-row">
            <span className="ck-ico">›</span>
            <div className="grow"><b>{a.appNo}</b><small>{a.productCode} · {formatTk(a.amountMinor)} · {a.tenorMonths}m</small></div>
            <Btn label="Generate letter" variant="btn-sm btn-primary" onClick={() => void generate(a.id)} />
          </div>
        ))}
      </Card>
      {letters.map((l) => (
        <Card key={l.id} title={`${l.appNo} — ${l.customerNameEn}`}>
          <div className="chip-row" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <StatusChip s={l.status} />
            <span className="tag">{formatTk(l.amountMinor)} · {l.tenorMonths}m</span>
            <span className="tag mono">{l.acceptanceToken.slice(0, 12)}…</span>
            <Btn label="Resend" variant="btn-sm btn-2nd" onClick={async () => { try { await resendSanction(l.id); toast("Resent — SMS + email + branch copy"); } catch (e) { toast(String(e), "err"); } }} />
            {l.status === "ISSUED" && (
              <Btn label="Simulate customer acceptance" variant="btn-sm btn-primary" onClick={async () => {
                try { const s = await acceptSanction(l.id, l.acceptanceToken); setLetters((prev) => prev.map((x) => x.id === s.id ? s : x)); toast("Acceptance recorded — signed via tokenized link"); }
                catch (e) { toast(String(e), "err"); }
              }} />
            )}
          </div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "var(--ink-700)", margin: "10px 0 0" }} data-testid="sanction-body-en">{l.bodyEn}</pre>
          {l.bodyBn && <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "var(--ink-500)", margin: "8px 0 0" }}>{l.bodyBn}</pre>}
        </Card>
      ))}
    </>
  );
}

/* ============ R3: BOCC console (B3 wired) ============ */
export function BoccPage() {
  const [meetings, setMeetings] = React.useState<BoccMeeting[]>([]);
  const [selected, setSelected] = React.useState<BoccMeeting | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ branch: "BR-001", members: "bm-1, bm-2, bm-3, bm-4" });
  const refresh = React.useCallback(async () => {
    try { setMeetings(await listMeetings()); setErr(null); } catch (e) { setErr(String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);
  const sel = selected ?? meetings[0] ?? null;

  return (
    <>
      <Head crumbs={[{ label: "Loan Origination (LOS)", to: "/workspace/B3" }, { label: "BOCC Committee" }]}
        title={<>BOCC Console <span className="tag" style={{ verticalAlign: "middle" }}>agenda → quorum → vote → minutes</span></>}
        sub="Branch Officers Credit Committee — agenda auto-built from pending cases, one-page review, 10-minute minutes (R3)"
        actions={<TBtn label="Minutes archive" msg="Archive opened (grid)" />} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <Card title="Schedule a sitting">
        <div className="form-grid" style={{ padding: 0 }}>
          <div className="field" data-req="1"><label>Branch<span className="req">*</span></label>
            <input data-testid="bocc-branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
          <div className="field span2" data-req="1"><label>Panel members (≥3, comma-separated)<span className="req">*</span></label>
            <input data-testid="bocc-members" value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value })} /></div>
        </div>
        <div style={{ padding: "10px 0" }}>
          <Btn label="Schedule + build agenda" variant="btn-primary" onClick={async () => {
            const members = form.members.split(",").map((m) => m.trim()).filter(Boolean);
            try { const m = await scheduleMeeting({ branchCode: form.branch, members }); await refresh(); setSelected(m); toast(`Sitting scheduled — ${m.agenda.length} cases listed`); }
            catch (e) { toast(String(e), "err"); }
          }} />
        </div>
      </Card>

      {meetings.length > 0 && (
        <Card title={`Sittings (${meetings.length})`}>
          {meetings.map((m) => (
            <div key={m.id} className="ck-row" style={{ cursor: "pointer" }} onClick={() => setSelected(m)}>
              <span className="ck-ico">{m.status === "CLOSED" ? "✓" : m.status === "HELD" ? "!" : "›"}</span>
              <div className="grow"><b>{m.branchCode} · {m.date}</b>
                <small>{m.agenda.length} cases · {m.attendance.length}/{m.quorumNeeded} present · {m.votes.length} votes · {m.status}</small></div>
              <span className="tag">{m.id.slice(0, 8)}</span>
            </div>
          ))}
        </Card>
      )}

      {sel && (
        <Card title={`Sitting — ${sel.branchCode} · ${sel.date} (${sel.status})`}>
          <div className="form-grid" style={{ padding: 0 }}>
            {sel.members.map((mem) => {
              const present = sel.attendance.some((a) => a.member === mem);
              return (
                <div key={mem} className="field">
                  <label>{mem}</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <StatusChip s={present ? "Active" : "Pending"} />
                    {!present && sel.status !== "CLOSED" && (
                      <Btn label="Check in" variant="btn-sm btn-2nd" onClick={async () => {
                        try { const m = await checkIn(sel.id, mem); setSelected(m); await refresh(); toast(`${mem} signed in`); }
                        catch (e) { toast(String(e), "err"); }
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <h4 style={{ margin: "14px 0 6px" }}>Agenda ({sel.agenda.length})</h4>
          {sel.agenda.map((c) => {
            const votes = sel.votes.filter((v) => v.caseId === c.caseId);
            return (
              <div key={c.caseId} className="ck-row">
                <span className="ck-ico">▤</span>
                <div className="grow"><b>{c.appNo}</b> · {formatTk(c.amountMinor)}
                  <small>{votes.map((v) => `${v.member}:${v.vote}`).join(" · ") || "no votes yet"}</small></div>
                {sel.status !== "CLOSED" && (
                  <span style={{ display: "flex", gap: 4 }}>
                    {["APPROVE", "REJECT", "HOLD"].map((vote) => (
                      <button key={vote} className="btn btn-sm btn-2nd" onClick={async () => {
                        const member = sel.attendance[0]?.member ?? sel.members[0];
                        try { await voteCase(sel.id, { caseId: c.caseId, member, vote }); setSelected(await (await import("../../api/r3r4r5")).getMeeting(sel.id)); toast(`${member} voted ${vote}`); }
                        catch (e) { toast(String(e), "err"); }
                      }}>{vote[0]}</button>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
          {sel.minutes && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "0 0 6px" }}>Minutes (auto-drafted)</h4>
              <pre data-testid="bocc-minutes" style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "var(--surface-2, #f6f6f8)", padding: 10, borderRadius: 8 }}>{sel.minutes.text}</pre>
            </div>
          )}
          {sel.status !== "CLOSED" && (
            <div style={{ padding: "12px 0" }}>
              <Btn label={`Close sitting (needs ${sel.quorumNeeded} present)`} variant="btn-primary" onClick={async () => {
                try { await closeMeeting(sel.id); setSelected(null); await refresh(); toast("Sitting closed — minutes drafted, resolutions routed"); }
                catch (e) { toast(String(e), "err"); }
              }} />
            </div>
          )}
        </Card>
      )}
    </>
  );
}

/* ============ R4: write-off / recovery console (F3 wired) ============ */
export function WriteOffPage() {
  const auth = useAuth();
  const roles = auth.session?.roles ?? [];
  const canWrite = roles.some((r) => COLLECTIONS_WRITE.has(r) || DISBURSEMENT_WRITE.has(r));
  const [cases, setCases] = React.useState<WriteOff[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [loanNo, setLoanNo] = React.useState("");
  const refresh = React.useCallback(async () => {
    try { setCases(await listWriteOffs()); setErr(null); } catch (e) { setErr(String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const cols: Col<WriteOff>[] = [
    { key: "loan", label: "Loan", sortValue: (w) => w.loanNo, render: (w) => <span className="idchip">{w.loanNo}</span> },
    { key: "amt", label: "Written-off amount", numeric: true, sortValue: (w) => w.amountMinor, render: (w) => formatTk(w.amountMinor) },
    { key: "cls", label: "Class @ proposal", render: (w) => <span className="tag">{w.classification}</span> },
    { key: "prov", label: "Provision pinned", numeric: true, sortValue: (w) => w.provisionAtProposalMinor, render: (w) => formatTk(w.provisionAtProposalMinor) },
    { key: "band", label: "Board band", render: (w) => <span className="tag">{w.boardBand}</span> },
    { key: "st", label: "State", sortValue: (w) => w.state, render: (w) => <StatusChip s={w.state} /> },
    { key: "acts", label: "", sortable: false, render: (w) => (
      <span className="rowActs">
        {canWrite && w.state === "PROPOSED" && (
          <button title="Approve (GL JV + CIB flag)" onClick={async () => { try { await approveWriteOff(w.id); toast(`Write-off executed — GL JV posted, CIB flagged`); await refresh(); } catch (e) { toast(String(e), "err"); } }}>✓</button>
        )}
        {canWrite && w.state === "EXECUTED" && (
          <button title="Reverse (recovery received)" onClick={async () => { try { await reverseWriteOff(w.id); await recordRecovery(w.loanId, Math.round(w.amountMinor * 0.1)); toast("Reversed + recovery recorded (10% receipt demo)"); await refresh(); } catch (e) { toast(String(e), "err"); } }}>↩</button>
        )}
      </span>
    ) },
  ];

  return (
    <>
      <Head crumbs={[{ label: "Monitoring & Collections", to: "/workspace/F3" }, { label: "Write-off Processing" }]}
        title={<>Write-off & Recovery <span className="tag" style={{ verticalAlign: "middle" }}>CL-3/CL-4 feed</span></>}
        sub="Propose → committee approve → GL write-off JV + CIB flag → recovery ledger with 5% incentive (R4)"
        actions={<TBtn label="Export CL-4" msg="Write-off register exported (CL-4 shape)" />} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <Card title="Propose write-off (loan must be SS/DF/B-L)">
        <div style={{ display: "flex", gap: 8 }}>
          <input data-testid="wo-loan" placeholder="LN-300005 / loan id" value={loanNo} onChange={(e) => setLoanNo(e.target.value)} style={{ flex: 1 }} />
          <Btn label="Propose" variant="btn-primary" disabled={!canWrite} onClick={async () => {
            try { const w = await proposeWriteOff(loanNo, "aged arrears, recovery exhausted"); toast(`Proposed ${w.loanNo} — ${w.boardBand} band`); await refresh(); }
            catch (e) { toast(String(e), "err"); }
          }} />
        </div>
      </Card>
      <Grid cols={cols} rows={cases} rowKey={(w) => w.id} />
      {cases.length === 0 && <div className="empty-state"><div className="e-ico">♺</div><p>No write-off cases. Propose one from a classified loan above (e.g. LN-300005 SS).</p></div>}
    </>
  );
}

/* ============ R4: notifications admin (H5-s3 wired) ============ */
export function NotificationsPage() {
  const auth = useAuth();
  const admin = (auth.session?.roles ?? []).includes("admin");
  const [templates, setTemplates] = React.useState<NotifTemplate[]>([]);
  const [deliveries, setDeliveries] = React.useState<NotifDelivery[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<NotifTemplate>({ type: "EMI_REMINDER", channel: "SMS", lang: "en", body: "" });
  const refresh = React.useCallback(async () => {
    try { setTemplates(await listTemplates()); setDeliveries(await listDeliveries()); setErr(null); } catch (e) { setErr(String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const cols: Col<NotifTemplate>[] = [
    { key: "type", label: "Trigger", sortValue: (t) => t.type, render: (t) => <span className="tag">{t.type}</span> },
    { key: "channel", label: "Channel", render: (t) => t.channel },
    { key: "lang", label: "Lang", render: (t) => t.lang },
    { key: "body", label: "Body", render: (t) => <span className="small trunc" style={{ display: "inline-block", maxWidth: 420 }}>{t.body}</span> },
  ];

  return (
    <>
      <Head crumbs={[{ label: "Platform & Admin", to: "/workspace/H5" }, { label: "SMS / Email Templates" }]}
        title={<>Notifications <span className="tag" style={{ verticalAlign: "middle" }}>{templates.length} templates · {deliveries.length} deliveries</span></>}
        sub="BN/EN template pairs · lifecycle triggers fan out via the transactional outbox (R4)"
        actions={<>
          <Btn label="Send test (EMI_REMINDER)" variant="btn-2nd" onClick={async () => {
            try { const d = await sendNotification({ type: "EMI_REMINDER", cif: "CIF-100871" }); toast(`Delivered → ${d.mobile}`); await refresh(); }
            catch (e) { toast(String(e), "err"); }
          }} />
        </>} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <Grid cols={cols} rows={templates} rowKey={(t) => `${t.type}-${t.channel}-${t.lang}`} />
      {admin && (
        <Card title="Upsert template (maker-checker)">
          <div className="form-grid" style={{ padding: 0 }}>
            <div className="field"><label>Type</label><input data-testid="tpl-type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} /></div>
            <div className="field"><label>Lang</label>
              <select data-testid="tpl-lang" value={draft.lang} onChange={(e) => setDraft({ ...draft, lang: e.target.value })}><option>en</option><option>bn</option></select></div>
            <div className="field span2"><label>Body ({'{name}'} / {'{amount}'} placeholders)</label>
              <input data-testid="tpl-body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></div>
          </div>
          <div style={{ padding: "10px 0" }}>
            <Btn label="Save template" variant="btn-primary" onClick={async () => {
              try { await upsertTemplate(draft); toast("Template saved (maker-checker routed)"); await refresh(); } catch (e) { toast(String(e), "err"); }
            }} />
          </div>
        </Card>
      )}
      <Card title="Recent deliveries">
        {deliveries.slice(0, 10).map((d) => (
          <div key={d.id} className="doc-row">
            <span className="d-ico">{d.channel === "SMS" ? "💬" : "✉"}</span>
            <div className="grow"><b>{d.type}</b> → {d.mobile ?? "—"}<small style={{ display: "block" }}>{d.body}</small></div>
            <StatusChip s={d.status} />
          </div>
        ))}
        {deliveries.length === 0 && <div className="small">No deliveries yet — relay the outbox after a lifecycle event, or send a test above.</div>}
      </Card>
    </>
  );
}

/* ============ R3: outbox ops (platform) ============ */
export function OutboxPage() {
  const [events, setEvents] = React.useState<OutboxEvent[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const refresh = React.useCallback(async () => {
    try { setEvents(await listOutbox()); setErr(null); } catch (e) { setErr(String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);
  const pending = events.filter((e) => e.state === "PENDING").length;
  return (
    <>
      <Head crumbs={[{ label: "Platform & Admin", to: "/workspace/H4" }, { label: "Outbox" }]}
        title={<>Transactional Outbox <span className="tag" style={{ verticalAlign: "middle" }}>{pending} pending / {events.length} total</span></>}
        sub="ADR-004: state changes write events in-transaction; the relay fans out notifications + audit (R3)"
        actions={<Btn label="Relay now" variant="btn-primary" onClick={async () => {
          try { const r = await relayOutbox(); toast(`Relayed ${r.relayed} events → ${r.notifications} notifications rendered`); await refresh(); }
          catch (e) { toast(String(e), "err"); }
        }} />} />
      {err && <div className="empty-state"><div className="e-ico">⚠</div><p>{err}</p></div>}
      <Grid cols={[
        { key: "type", label: "Event", sortValue: (e) => e.type, render: (e) => <span className="tag">{e.type}</span> },
        { key: "agg", label: "Aggregate", render: (e) => `${e.aggregateType}/${e.aggregateId.slice(0, 10)}…` },
        { key: "st", label: "State", sortValue: (e) => e.state, render: (e) => <StatusChip s={e.state === "RELAYED" ? "Filed" : "Pending"} /> },
        { key: "att", label: "Attempts", numeric: true, sortValue: (e) => e.attempts, render: (e) => String(e.attempts) },
        { key: "at", label: "Created", render: (e) => e.createdAt.replace("T", " ").slice(0, 19) },
      ]} rows={events} rowKey={(e) => e.id} />
    </>
  );
}
