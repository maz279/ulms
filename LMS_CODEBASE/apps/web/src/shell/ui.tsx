/* ============================================================
   ULMS shared UI kit — React port of the prototype's builders
   (app.js head/kpiRow/card/gridWrap/chips/docRows + modal form
   system). Same DOM + class names as the prototype so the copied
   app.css renders identically.
   ============================================================ */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { pick, useLang } from "../i18n/bilingual";
import { LMS_MODULES } from "./navData";
import { F, rng, BRPD, sparkFor, type GenRow } from "./demoData";
import { Spark } from "./charts";

/* ---------- toasts ---------- */
export type ToastType = "ok" | "err" | "warn" | "";
interface ToastMsg { id: number; msg: string; type: ToastType }
let toastSeq = 1;
const toastListeners = new Set<(t: ToastMsg) => void>();
export function toast(msg: string, type: ToastType = "ok") {
  const t: ToastMsg = { id: toastSeq++, msg, type };
  toastListeners.forEach((l) => l(t));
}
export function ToastHost() {
  const [items, setItems] = React.useState<ToastMsg[]>([]);
  React.useEffect(() => {
    const l = (t: ToastMsg) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 4400);
    };
    toastListeners.add(l);
    return () => { toastListeners.delete(l); };
  }, []);
  return (
    <div id="toasts" aria-live="polite">
      {items.map((t) => <div key={t.id} className={`toast ${t.type}`} role="status">{t.msg}</div>)}
    </div>
  );
}

/* ---------- navigation helper (prototype route grammar → SPA) ---------- */
/** Normalize a prototype route (hash or bare) into an SPA path. */
export function normalizeRoute(route: string): string {
  if (route === "portals.html") return "/portal";
  if (route === "mobile.html") return "/screen/C3-s1";   // field-app surface in the staff app
  return route.startsWith("#") ? route.slice(1) : route;
}
export function useGo() {
  const nav = useNavigate();
  return React.useCallback((route: string) => {
    if (/\.html/.test(route) && !["portals.html", "mobile.html"].includes(route)) { window.open(route, "_blank"); return; }
    nav(normalizeRoute(route) || "/home");
  }, [nav]);
}

/* ---------- buttons / links ---------- */
export function Btn({ label, variant = "btn-2nd", onClick, title, disabled, type }: {
  label: React.ReactNode; variant?: string; onClick?: (e: React.MouseEvent) => void;
  title?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button type={type ?? "button"} className={`btn ${variant}`} title={title} disabled={disabled} onClick={onClick}>{label}</button>
  );
}
/** Fire a toast — the prototype's data-toast pattern. */
export function TBtn({ msg, tt = "ok", label, variant = "btn-2nd" }: { msg: string; tt?: ToastType; label: React.ReactNode; variant?: string }) {
  return <Btn label={label} variant={variant} onClick={() => toast(msg, tt)} />;
}

/* ---------- page head + crumbs ---------- */
export interface Crumb { label: string; to?: string; area?: string }
export function Head({ crumbs, title, sub, actions }: { crumbs: Crumb[]; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  const [lang] = useLang();
  const nav = useNavigate();
  return (
    <>
      <div className="page-crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i ? <span className="sep">›</span> : null}
            {c.to
              ? <a href={c.to} onClick={(e) => { e.preventDefault(); nav(c.to!.replace(/^#/, "")); }} style={{ color: "var(--primary)" }}>{c.label}</a>
              : <span>{c.label}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="page-head">
        <div className="grow">
          <h1 className="page-title">{title}</h1>
          {sub ? <div className="page-sub" data-lang={lang}>{sub}</div> : null}
        </div>
        <div className="page-actions">{actions}</div>
      </div>
    </>
  );
}

/* ---------- KPI cards ---------- */
export interface KpiDef { l: string; v: React.ReactNode; d?: React.ReactNode; st?: string; spark?: number[] }
export function KpiCard({ k, onDrill }: { k: KpiDef; onDrill?: () => void }) {
  return (
    <button type="button" className={`kpi status-${k.st || "info"}`} onClick={() => onDrill?.()}
      title={typeof k.l === "string" ? k.l : undefined}
      style={{ textAlign: "left", font: "inherit", cursor: "pointer" }}>
      <div className="kpi-l">{k.l}</div>
      <div className="kpi-v">{k.v}</div>
      <div className="kpi-d">{k.d}</div>
      {k.spark ? <Spark vals={k.spark} w={84} h={26} /> : null}
    </button>
  );
}
export function KpiRow({ items }: { items: KpiDef[] }) {
  return <div className="kpiRow">{items.map((k, i) => <KpiCard key={i} k={k} onDrill={() => toast(`Drill-through: ${k.l} → underlying records`)} />)}</div>;
}

/* ---------- card ---------- */
export function Card({ title, more, className = "", children }: {
  title?: React.ReactNode; more?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={`card ${className}`}>
      {title ? <div className="card-h"><h3>{title}</h3>{more}</div> : null}
      <div className="card-pad">{children}</div>
    </section>
  );
}

/* ---------- chips ---------- */
export function StatusChip({ s }: { s: string }) {
  const cls = /Reject|Broken|Escalated|Overdue|SLA/i.test(s) ? "chip-err"
    : /Pending|Refresh|Returned|Risk|No Response/i.test(s) ? "chip-warn"
    : /Verified|Active|Approved|Kept|Filed|Cleared|Scheduled|Executed|Disbursed|Settled/i.test(s) ? "chip-ok" : "chip-neutral";
  return <span className={`chip ${cls}`}>{s}</span>;
}
export function StageChip({ stageIdx }: { stageIdx: number }) {
  const b = BRPD[Math.max(0, Math.min(6, stageIdx))];
  return <span className={b.chip}>{b.k}</span>;
}

/* ---------- doc rows (deterministic demo evidence) ---------- */
export function DocRows({ n, seed }: { n: number; seed: string }) {
  const r = rng(seed);
  const names = ["NID front", "NID back", "Photograph", "Salary certificate", "Bank statement 6m", "Trade license", "TIN certificate", "Property deed", "Utility bill", "Nominee NID"];
  const st = ["Verified", "Verified", "Pending Verification", "Approved", "Rejected — resubmit", "Verified"];
  const rows = Array.from({ length: n }, (_, i) => {
    const s = st[Math.floor(r() * st.length)];
    const name = names[i % names.length];
    return { name, s, size: (0.2 + r() * 4).toFixed(1), up: `202${Math.floor(r() * 6)}-0${Math.floor(r() * 9) + 1}-1${Math.floor(r() * 9)}` };
  });
  return (
    <>
      {rows.map((d, i) => (
        <div key={i} className="doc-row">
          <span className="d-ico">📄</span>
          <div className="grow"><b>{d.name}</b><small className="muted" style={{ display: "block" }}>PDF · {d.size} MB · uploaded {d.up}</small></div>
          <span className={`chip ${d.s.indexOf("Reject") >= 0 ? "chip-err" : d.s === "Verified" || d.s === "Approved" ? "chip-ok" : "chip-warn"}`}>{d.s}</span>
          <Btn label="View" variant="btn-sm btn-2nd" onClick={() => toast(`Preview: ${d.name} (secure viewer · AES-256 at rest)`)} />
        </div>
      ))}
    </>
  );
}

/* ---------- grid (sortable + row actions) ---------- */
export interface Col<T> {
  key: string; label: React.ReactNode; render: (row: T) => React.ReactNode;
  numeric?: boolean; sortable?: boolean;
  /** Explicit sort key — JSX cells can't be stringified reliably, so complex
   *  columns should declare this (falls back to plain-string renders). */
  sortValue?: (row: T) => string | number;
}
export function Grid<T>({ cols, rows, count, toolbar, foot, onRow, rowKey }: {
  cols: Col<T>[]; rows: T[]; count?: number; toolbar?: React.ReactNode;
  foot?: React.ReactNode; onRow?: (row: T, i: number) => void; rowKey: (row: T, i: number) => string;
}) {
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = cols.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (r: T): string | number => {
      if (col.sortValue) return col.sortValue(r);
      const node = col.render(r);
      if (typeof node === "string" || typeof node === "number") return node;
      return "";
    };
    const num = (v: string | number): number | null =>
      typeof v === "number" ? v : (() => {
        const n = parseFloat(String(v).replace(/[৳,%\s]|,/g, ""));
        return String(v).trim() !== "" && !isNaN(n) ? n : null;
      })();
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      const nx = num(x), ny = num(y);
      if (nx != null && ny != null) return sort.dir === "asc" ? nx - ny : ny - nx;
      return sort.dir === "asc" ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
    });
  }, [rows, sort, cols]);
  return (
    <div className="grid-wrap">
      <div className="grid-toolbar">
        <span className="grid-count"><b>{count ?? rows.length}</b> records</span>
        {toolbar}
      </div>
      <div className="scroll-x">
        <table className="usl-grid">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={c.numeric ? "right num" : undefined}>
                  {c.sortable === false
                    ? c.label
                    : <button type="button" style={{ all: "unset", cursor: "pointer", font: "inherit" }}
                        onClick={() => {
                          setSort((s) => s && s.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" });
                        }}>{c.label}{sort?.key === c.key ? <span className="arr">{sort.dir === "asc" ? "▲" : "▼"}</span> : null}</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={rowKey(row, i)} onClick={onRow ? () => onRow(row, i) : undefined} style={onRow ? { cursor: "pointer" } : undefined}>
                {cols.map((c) => <td key={c.key} className={c.numeric ? "right num" : undefined}>{c.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {foot}
    </div>
  );
}

/* ---------- generic grid page filter pane ---------- */
export function FilterPane({ children }: { children: React.ReactNode }) {
  return <aside className="filter-pane">{children}</aside>;
}
export function FilterHeader({ children }: { children: React.ReactNode }) {
  return <div className="fp-h">{children}</div>;
}
export function FilterItem({ checked = true, onChange, children }: { checked?: boolean; onChange?: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="fp-item">
      <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} /> {children}
    </label>
  );
}

/* ---------- mini list ---------- */
export function MiniList({ children }: { children: React.ReactNode }) {
  return <div className="miniList">{children}</div>;
}

/* ---------- factbox ---------- */
export function FbCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="fb-card"><h4>{title}</h4><div className="fb-body">{children}</div></div>;
}
export function FbKv({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="fb-kv"><span>{k}</span><b>{v}</b></div>;
}

/* ---------- timeline ---------- */
export function Timeline({ items }: { items: [string, string, string, string][] }) {
  return (
    <div className="card-pad timeline">
      {items.map((x, i) => (
        <div key={i} className="tl-item">
          <span className="tl-ico">{x[0]}</span><b>{x[1]}</b><p>{x[2]}</p><div className="tl-meta">{x[3]}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- form fields (validated) ---------- */
export function Field({ label, required, area, type = "text", placeholder, value, onChange, readOnly, mono, invalid, span2 }: {
  label: string; required?: boolean; area?: boolean; type?: string; placeholder?: string;
  value?: string; onChange?: (v: string) => void; readOnly?: boolean; mono?: boolean; invalid?: boolean; span2?: boolean;
}) {
  const [touched, setTouched] = React.useState(false);
  const bad = invalid || (touched && required && !(value ?? "").trim());
  const fid = React.useId();
  return (
    <div className={`field${span2 ? " span2" : ""}${bad ? " invalid" : ""}`} data-req={required ? 1 : 0}>
      <label htmlFor={fid}>{label}{required ? <span className="req">*</span> : null}</label>
      {area
        ? <textarea id={fid} rows={2} placeholder={placeholder ?? "…"} value={value} readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)} onBlur={() => setTouched(true)} />
        : <input id={fid} type={type} className={mono ? "mono" : undefined} placeholder={placeholder}
            value={value} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} onBlur={() => setTouched(true)} />}
      <span className="err-msg">Required — {label} cannot be blank</span>
    </div>
  );
}
export function Select({ label, options, required, value, onChange }: {
  label: string; options: string[]; required?: boolean; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div className="field" data-req={required ? 1 : 0}>
      <label>{label}{required ? <span className="req">*</span> : null}</label>
      <select value={value ?? options[0]} onChange={(e) => onChange?.(e.target.value)}>
        {options.map((o, i) => <option key={i} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({ title, sub, onClose, children, footer, wide }: {
  title: string; sub?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" style={wide ? { width: "min(880px, 94vw)" } : undefined}>
        <div className="modal-h">
          <div>
            <h3>{title}</h3>
            {sub ? <div className="m-sub">{sub}</div> : null}
          </div>
          <button className="tb-btn m-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-b">{children}</div>
        {footer ? <div className="modal-f">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------- validated modal form (the prototype's openForm) ---------- */
const FORMVOCAB: Record<string, string[]> = {
  A: ["Full name (English)", "Full name (Bangla)", "Father's name", "Mother's name", "Date of birth", "Gender", "Marital status", "NID (auto-verified)", "Passport no.", "TIN", "Mobile (OTP verified)", "Email", "Present address", "Permanent address", "Years at residence", "Employment type", "Employer / Business", "Monthly income", "Nominee name", "Nominee NID"],
  B: ["Application no.", "Customer (CIF)", "Product", "Loan amount (৳)", "Tenor (months)", "Purpose", "Repayment mode", "Interest type", "Collateral offered", "Guarantor name", "Branch", "Scheme / campaign", "Agent code", "Priority"],
  C: ["Inquiry ref", "Applicant", "NID / TIN", "Date of birth", "Purpose of inquiry", "Application ref", "Consent obtained", "Expected turnaround"],
  D: ["Reference", "Level", "Approver role", "Amount (৳)", "Conditions", "Delegation target", "Comment (required)", "Signature"],
  E: ["Loan account", "Customer", "Amount received (৳)", "Mode", "Value date", "Narration", "Waiver requested", "Receipt language"],
  F: ["Loan account", "DPD bucket", "Action type", "Promise date", "Promise amount (৳)", "Visit GPS", "Outcome", "Next follow-up"],
  G: ["Report name", "Parameters", "Schedule", "Recipients", "Format"],
  H: ["Setting", "Value", "Effective from", "Reason", "Maker", "Checker"],
};
export function FormModal({ mid, name, onClose }: { mid: string; name: string; onClose: () => void }) {
  const mod = (LMS_MODULES as any)[mid];
  const [lang] = useLang();
  const base = [...(FORMVOCAB[mod?.area ?? "A"] ?? FORMVOCAB.A)];
  if (/promise|ptp/i.test(name)) base.push("Promise date", "Confidence level");
  if (/disburse/i.test(name)) base.push("Payout rail", "Beneficiary wallet / account");
  if (/write.?off|recovery/i.test(name)) base.push("Board approval ref", "Recovery potential (৳)");
  if (/reschedul|restructur/i.test(name)) base.push("New tenor", "Provision impact", "BRPD justification");
  const [values, setValues] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const set = (i: number, v: string) => setValues((prev) => ({ ...prev, [i]: v }));
  const reqCount = Math.min(4, base.length);
  const invalidFor = (i: number) => submitted && i < reqCount && !(values[i] ?? "").trim();
  return (
    <Modal
      title={name}
      sub={`${mod?.icon ?? "▤"} ${mod ? pick({ en: mod.en, bn: mod.bn }) : mid} · ${mid} · validation · autosave · audit trail · maker-checker ready`}
      onClose={onClose} wide
      footer={
        <>
          <Btn label="Submit (maker)" variant="btn-primary" onClick={() => {
            setSubmitted(true);
            const bad = base.slice(0, reqCount).filter((_, i) => !(values[i] ?? "").trim()).length;
            if (bad) { toast(`Form invalid — ${bad} required field(s) blank`, "err"); return; }
            toast("Form saved — maker-checker routed · audit captured");
            onClose();
          }} />
          <Btn label="Cancel" variant="btn-2nd" onClick={onClose} />
          <span className="spacer" />
          <span className="small"><kbd className="k">Esc</kbd> closes · <kbd className="k">Ctrl</kbd><kbd className="k">S</kbd> saves draft</span>
        </>
      }>
      <div className="form-section" style={{ margin: 0, boxShadow: "none" }}>
        <h3>Fields</h3>
        <div className="form-grid" data-lang={lang}>
          {base.map((f, i) => (
            <Field key={i} label={f} required={i < reqCount}
              area={/address|Employer|Narration|Conditions|Comment|Purpose|Reason|Parameters/i.test(f)}
              type={/date/i.test(f) ? "text" : /amount|৳|income/i.test(f) ? "number" : "text"}
              placeholder={/date/i.test(f) ? "YYYY-MM-DD" : /amount|৳/i.test(f) ? "0.00" : /NID/i.test(f) ? "auto-verified from NIDW" : undefined}
              value={values[i] ?? ""} onChange={(v) => set(i, v)} invalid={invalidFor(i)} />
          ))}
        </div>
      </div>
      <div className="form-section" style={{ marginTop: 12 }}>
        <h3>Lines</h3>
        <div className="scroll-x">
          <table className="lines-table">
            <thead><tr><th>#</th><th>Item</th><th>Value (৳)</th><th>Note</th></tr></thead>
            <tbody>
              {[1, 2].map((i) => (
                <tr key={i}><td>{i}</td><td><input aria-label={`Row ${i} description`} defaultValue={`Line ${i}`} /></td><td><input className="num" aria-label={`Row ${i} amount`} defaultValue={i * 250000} /></td><td><input aria-label={`Row ${i} note`} /></td></tr>
              ))}
              <tr><td colSpan={4}><Btn label="＋ Add line" variant="btn-sm btn-2nd" onClick={() => toast("Line added")} /></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- genRow grid page helper (archetype g) ---------- */
export function genRowCols(onOpen: (row: GenRow, i: number) => void): Col<GenRow>[] {
  return [
    { key: "id", label: "Record", render: (r) => <span className="idchip">{r.id}</span>, sortValue: (r) => r.id },
    { key: "title", label: "Title", render: (r) => <><b>{r.title}</b><span className="sub">{r.sub}</span></>, sortValue: (r) => r.title },
    { key: "status", label: "Status", render: (r) => <StatusChip s={r.status} />, sortValue: (r) => r.status },
    { key: "amt", label: "Amount", numeric: true, render: (r) => (r.amt ? F.tk(r.amt) : "—"), sortValue: (r) => r.amt },
    { key: "date", label: "Date", numeric: true, render: (r) => r.date, sortValue: (r) => r.date },
    { key: "owner", label: "Owner", render: (r) => r.owner },
    { key: "branch", label: "Branch", render: (r) => r.branch, sortValue: (r) => r.branch },
    { key: "acts", label: "", sortable: false, render: (r, ) => (
      <span className="rowActs">
        <button title="Open" onClick={(e) => { e.stopPropagation(); onOpen(r, 0); }}>›</button>
        <button title="Toast" onClick={(e) => { e.stopPropagation(); toast(`${r.id} — quick action dispatched`); }}>⚡</button>
      </span>
    ) },
  ];
}
export { F, sparkFor };
