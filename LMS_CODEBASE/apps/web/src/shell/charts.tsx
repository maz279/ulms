/* ============================================================
   ULMS charts — React port of Front_end/js/charts.js.
   Zero-dependency SVG builders (Fluent-flat style: no gradients,
   direct labels, dashed gridlines, palette read live from CSS
   tokens so dark mode restyles charts too).
   ============================================================ */
import * as React from "react";

function palette(): string[] {
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(document.documentElement) : null;
  const out: string[] = [];
  for (let i = 1; i <= 8; i++) out.push(cs ? (cs.getPropertyValue(`--chart-${i}`).trim() || "#3F51B5") : "#3F51B5");
  return out;
}
const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString("en-US");
export interface Series { name: string; data: number[]; color?: string }
export interface Bar { label: string; value: number; color?: string; hl?: boolean; cap?: string; sub?: string }

export function Spark({ vals, w = 96, h = 30, color }: { vals: number[]; w?: number; h?: number; color?: string }) {
  if (!vals || vals.length < 2) return null;
  const P = palette(); const col = color || P[0];
  const mx = Math.max(...vals), mn = Math.min(...vals), rg = (mx - mn) || 1;
  const pts = vals.map((v, i) => `${(2 + (i * (w - 4)) / (vals.length - 1)).toFixed(1)},${(h - 3 - ((v - mn) / rg) * (h - 7)).toFixed(1)}`);
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={col} />
    </svg>
  );
}

export function LineChart({ labels, series, w = 640, h = 220 }: { labels: string[]; series: Series[]; w?: number; h?: number }) {
  const P = palette();
  const padL = 44, padB = 24, padT = 10, padR = 8, iw = w - padL - padR, ih = h - padT - padB;
  const all = series.flatMap((s) => s.data);
  const mx = Math.max(...all) * 1.08 || 1, mn = 0;
  const X = (i: number) => padL + (i * iw) / Math.max(labels.length - 1, 1);
  const Y = (v: number) => padT + ih - ((v - mn) / (mx - mn)) * ih;
  const grid: React.ReactNode[] = [];
  [0, 0.25, 0.5, 0.75, 1].forEach((t, i) => {
    const yy = Y(mx * t).toFixed(1);
    grid.push(<line key={`g${i}`} x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--stroke)" strokeDasharray="3 4" />);
    grid.push(<text key={`t${i}`} x={padL - 6} y={Number(yy) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-500)">{fmt(mx * t)}</text>);
  });
  labels.forEach((l, i) => {
    if (labels.length > 14 && i % 2) return;
    grid.push(<text key={`x${i}`} x={X(i)} y={h - 6} textAnchor="middle" fontSize="9.5" fill="var(--ink-500)">{l}</text>);
  });
  return (
    <div>
      <div className="legend" style={{ justifyContent: "flex-end", marginBottom: 6 }}>
        {series.map((s, i) => (
          <span key={s.name}><i className="sw" style={{ background: s.color || P[i % 8] }} />{s.name}</span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="line chart">
        {grid}
        {series.map((s, si) => {
          const col = s.color || P[si % 8];
          const pts = s.data.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {s.data.map((v, i) => (
                <circle key={i} cx={X(i).toFixed(1)} cy={Y(v).toFixed(1)} r="2.2" fill={col}>
                  <title>{`${s.name} · ${labels[i] ?? ""} · ${fmt(v)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function VBars({ rows, w = 640, h = 200 }: { rows: Bar[]; w?: number; h?: number }) {
  const P = palette();
  const mx = Math.max(...rows.map((r) => r.value)) || 1;
  const padT = 16, padB = 26, padL = 8, iw = (w - padL * 2) / rows.length, ih = h - padT - padB;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="bar chart">
      {rows.map((r, i) => {
        const bh = Math.max(2, (r.value / mx) * ih), bw = Math.min(46, iw * 0.6);
        const bx = padL + i * iw + (iw - bw) / 2, by = padT + ih - bh, col = r.color || P[0];
        return (
          <g key={i}>
            <rect x={bx.toFixed(1)} y={by.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)} rx="3" fill={col}
              stroke={r.hl ? "var(--ink-700)" : undefined} strokeWidth={r.hl ? 1.5 : undefined}>
              <title>{`${r.label} · ${fmt(r.value)}`}</title>
            </rect>
            <text x={(bx + bw / 2).toFixed(1)} y={(by - 4).toFixed(1)} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--ink-700)">{r.cap ?? fmt(r.value)}</text>
            <text x={(bx + bw / 2).toFixed(1)} y={h - 8} textAnchor="middle" fontSize="9.5" fill="var(--ink-500)">{r.label}</text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + ih} x2={w - padL} y2={padT + ih} stroke="var(--stroke-strong)" />
    </svg>
  );
}

export function HBars({ rows, opts }: { rows: Bar[]; opts?: { max?: number; fmt?: (v: number) => string } }) {
  const P = palette();
  const mx = opts?.max ?? (Math.max(...rows.map((r) => r.value)) || 1);
  const fmtV = opts?.fmt ?? fmt;
  return (
    <div>
      {rows.map((r, i) => {
        const pct = Math.round((r.value / mx) * 100);
        return (
          <div key={r.label + i} className="hbar-row">
            <span className="trunc" title={r.label}>{r.label}</span>
            <span className="track"><span className="fill" style={{ width: `${pct}%`, background: r.color || P[i % 8] }} /></span>
            <span className="val">{fmtV(r.value)}{r.sub ? <span className="muted"> {r.sub}</span> : null}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Donut({ items, size = 150, centerTop, centerBot }: {
  items: { label: string; value: number; color?: string }[]; size?: number; centerTop?: string | number; centerBot?: string;
}) {
  const P = palette();
  const tot = items.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - 11, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let off = 0;
  const segs = items.map((it, i) => {
    const frac = it.value / tot, len = frac * circ;
    const el = (
      <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={it.color || P[i % 8]} strokeWidth="16"
        strokeDasharray={`${len.toFixed(2)} ${(circ - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)}
        transform={`rotate(-90 ${cx} ${cy})`}>
        <title>{`${it.label} · ${fmt(it.value)} (${Math.round(frac * 100)}%)`}</title>
      </circle>
    );
    off += len;
    return el;
  });
  return (
    <div className="flex" style={{ justifyContent: "center", gap: "var(--s-5, 20px)", flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="donut chart">
        {segs}
        {centerTop != null && <text x={cx} y={cy - 3} textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--ink-900)">{centerTop}</text>}
        {centerBot != null && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9.5" fill="var(--ink-500)">{centerBot}</text>}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
        {items.map((it, i) => (
          <span key={i} className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="sw" style={{ background: it.color || P[i % 8] }} />{it.label}
            <b className="num" style={{ marginLeft: "auto", color: "var(--ink-700)" }}>{fmt(it.value)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Gauge({ pct, label, warnAt = 55, errAt = 40 }: { pct: number; label?: string; warnAt?: number; errAt?: number }) {
  const w = 170, h = 95, cx = w / 2, cy = h - 8, r = 64;
  const col = pct >= warnAt ? "var(--ok-bold,#107C10)" : pct >= errAt ? "var(--warn-bold,#F7630C)" : "var(--err-bold,#C50F1F)";
  const a = Math.PI * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`gauge ${pct} percent`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--surface-3)" strokeWidth="13" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`} fill="none" stroke={col} strokeWidth="13" strokeLinecap="round" />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="21" fontWeight="700" fill="var(--ink-900)">{Math.round(pct)}%</text>
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="9.5" fill="var(--ink-500)">{label ?? ""}</text>
    </svg>
  );
}

export function Funnel({ rows }: { rows: { label: string; value: number; cap?: string }[] }) {
  const P = palette();
  const mx = rows.length ? rows[0].value : 1;
  return (
    <svg width="100%" viewBox={`0 0 560 ${rows.length * 44 + 10}`} role="img" aria-label="funnel">
      {rows.map((r, i) => {
        const wv = Math.max(90, (r.value / mx) * 430), y = 6 + i * 44, col = P[i % 8];
        return (
          <g key={r.label}>
            <rect x="8" y={y} width={wv.toFixed(0)} height="30" rx="4" fill={col} opacity={1 - i * 0.11}>
              <title>{`${r.label} · ${fmt(r.value)}`}</title>
            </rect>
            <text x="18" y={y + 20} fontSize="12" fontWeight="600" fill="#fff">{r.label}</text>
            <text x={(wv + 16).toFixed(0)} y={y + 20} fontSize="12" fontWeight="600" fill="var(--ink-700)">{r.cap ?? fmt(r.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function ClsStrip({ buckets }: { buckets: { label: string; value: number; color: string }[] }) {
  return (
    <div role="img" aria-label="BRPD classification mix">
      <div className="flex" style={{ gap: 2, height: 22, borderRadius: 5, overflow: "hidden" }}>
        {buckets.filter((b) => b.value).map((b) => (
          <i key={b.label} title={`${b.label} · ${fmt(b.value)}`} style={{ flex: b.value, background: b.color }} />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 6 }}>
        {buckets.map((b) => (
          <span key={b.label}><i className="sw" style={{ background: b.color }} />{b.label} <b className="num" style={{ color: "var(--ink-700)" }}>{fmt(b.value)}</b></span>
        ))}
      </div>
    </div>
  );
}

export function Heatmap({ rows, cols, valFn }: { rows: string[]; cols: string[]; valFn: (r: string, c: string) => number }) {
  const out: React.ReactNode[] = [];
  out.push(<div key="h0" />);
  cols.forEach((c) => out.push(<div key={`h${c}`} style={{ textAlign: "center", color: "var(--ink-500)" }}>{c}</div>));
  rows.forEach((r) => {
    out.push(<div key={`r${r}`} className="trunc" style={{ color: "var(--ink-500)", lineHeight: "22px" }}>{r}</div>);
    cols.forEach((c) => {
      const v = valFn(r, c);
      const a = (0.08 + v * 0.85).toFixed(2);
      out.push(<div key={`${r}${c}`} title={`${r} · ${c} · ${Math.round(v * 100)}%`}
        style={{ height: 22, borderRadius: 3, background: `rgba(63,81,181,${a})` }} />);
    });
  });
  return <div style={{ display: "grid", gridTemplateColumns: `90px repeat(${cols.length},1fr)`, gap: 3, fontSize: 10 }}>{out}</div>;
}
