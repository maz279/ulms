/* ============================================================
   Tell-ME search — same index as the prototype (pages, actions,
   reports, forms, records) with grouped, arrow-key navigable
   results. Route grammar matches the React router paths.
   ============================================================ */
import { LMS_MODULES, LMS_HOME_TILES } from "./navData";
import { RECORDS } from "./demoData";
import { normalizeRoute } from "./ui";

export interface SearchHit { g: string; t: string; route: string; ico: string }

const TYPE_GLYPH: Record<string, string> = { g: "▤", f: "✎", x: "◉", c: "⚙", d: "▦", r: "📄", s: "▫" };
export const typeIcon = (t: string) => TYPE_GLYPH[t] || "▫";

function buildIndex() {
  const pages: SearchHit[] = [];
  const acts: SearchHit[] = [];
  const reps: SearchHit[] = [];
  const forms: SearchHit[] = [];
  Object.keys(LMS_MODULES).forEach((mid) => {
    const m: any = (LMS_MODULES as any)[mid];
    pages.push({ g: "Pages", t: `${mid} · ${m.en}`, route: `/workspace/${mid}`, ico: m.icon });
    m.groups.forEach((grp: any) => grp.screens.forEach((s: any) => {
      pages.push({ g: "Pages", t: `${s.en}  ·  ${mid}`, route: s.route ? normalizeRoute(s.route) : `/screen/${s.id}`, ico: typeIcon(s.t) });
    }));
    m.reports.forEach((rn: string, i: number) => reps.push({ g: "Reports", t: `${rn} · ${mid}`, route: `/report/${mid}/${i}`, ico: "📄" }));
    m.forms.forEach((fn: string) => forms.push({ g: "Forms", t: `${fn} · ${mid}`, route: `/form/${mid}/${encodeURIComponent(fn)}`, ico: "✎" }));
  });
  ([
    ["New Application", "/apply", "✚"],
    ["New Customer", "/form/A1/New%20Individual%20Customer", "✚"],
    ["My Approvals", "/approvals", "✅"],
    ["Post a Payment", "/form/E2/Post%20payment", "৳"],
    ["Run CL-1", "/report/F1/0", "📄"],
    ["Collections Workbench", "/collections", "🎧"],
    ["BRPD Board", "/classification", "🏷"],
    ["Report Writer", "/writer", "✎"],
    ["Keyboard Shortcuts", "/shortcuts", "⌨"],
    ["Design System", "/designsystem", "🎨"],
  ] as [string, string, string][]).forEach(([t, route, ico]) => acts.push({ g: "Actions", t, route, ico }));
  const records: SearchHit[] = RECORDS.map(([id, title, sub, route]) => ({
    g: "Records", t: `${id} · ${title}  ·  ${sub}`, route, ico: /CIF/.test(id) ? "👤" : "◉",
  }));
  return { pages, acts, reps, forms, records };
}

export function lmSearch(qRaw: string): SearchHit[] {
  const q = (qRaw || "").toLowerCase().trim();
  if (!q) return [];
  const ix = buildIndex();
  const out: SearchHit[] = [];
  const match = (arr: SearchHit[]) => arr.forEach((r) => {
    if (out.length < 24 && r.t.toLowerCase().includes(q)) out.push(r);
  });
  match(ix.pages); match(ix.acts); match(ix.reps); match(ix.forms); match(ix.records);
  return out.slice(0, 24);
}

export { LMS_HOME_TILES };
