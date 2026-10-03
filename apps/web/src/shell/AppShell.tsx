/* ============================================================
   ULMS AppShell — faithful React port of Front_end/js/shell.js
   (the validated UX contract): Dynamics-365 model-driven chrome.
   Topbar · sitemap nav (Home/Favorites/Areas/Recents/System) ·
   mega menu · tab strip + tab rail · Tell-ME search · copilot ·
   status bar · toasts · keyboard map. All prefs persisted in
   localStorage.
   ============================================================ */
import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { pick, t, useLang } from "../i18n/bilingual";
import { LMS_AREAS, LMS_MODULES } from "./navData";
import { lmSearch, typeIcon } from "./search";
import { ToastHost, toast, useGo, normalizeRoute } from "./ui";
import { useAuth } from "../auth/AuthProvider";
import { resolveMode } from "../auth/session";
import { ENV_LABEL } from "./envLabel";
import {
  AREA_ROLES, SYSTEM_LINK_ROLES, ROLE_LABEL, DEV_PERSONAS,
  type RealmRole,
} from "../auth/roles";

/* ---------- persisted shell state ---------- */
const LS = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem(`ulms-${k}`); return v === null ? d : JSON.parse(v) as T; }
    catch { return d; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(`ulms-${k}`, JSON.stringify(v)); } catch { /* private mode */ } },
};

export interface ShellTab { id: string; route: string; icon: string; pin: boolean; kind: "named" | "screen" | "mod"; ref: string }
const MAX_TABS = 12;

function hash32(str: string): number { let x = 0; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0; return x; }

/** Canonical tab for a route — the prototype's syncTab, localized at render. */
function tabFor(pathname: string): ShellTab | null {
  const route = pathname.split("?")[0];
  const named: Record<string, [string, string]> = {
    "/home": ["⌂", "Home"], "/pipeline": ["▤", "nav.pipeline"], "/apply": ["✚", "nav.apply"],
    "/customers": ["👤", "nav.customers"], "/collections": ["🎧", "nav.collections"],
    "/approvals": ["✅", "My Approvals"], "/disburse": ["💸", "Disbursement"], "/analytics": ["▦", "Portfolio Analytics"],
    "/classification": ["🏷", "compliance.board.title"], "/regcon": ["🏛", "compliance.regcon.title"], "/reports": ["📄", "compliance.reports.title"],
    "/writer": ["✎", "Report Writer"], "/audit": ["🧾", "Audit Trail"], "/settings": ["⚙", "System Settings"], "/designsystem": ["🎨", "Design System"],
    "/coverage": ["✓", "Coverage"], "/directory": ["☰", "Module Directory"], "/search": ["⌕", "Search"], "/shortcuts": ["⌨", "shell.shortcuts"],
    "/notifications": ["🔔", "Notifications"], "/portal": ["🌐", "Borrower Portal"],
  };
  // spec-pinned chrome names win over the (richer) screen-declared titles (09 §2 i18n suite)
  if (named[route] && ["/customers", "/apply", "/pipeline", "/collections", "/home"].includes(route))
    return { id: `n-${hash32(route)}`, route, icon: named[route][0], pin: false, kind: "named", ref: named[route][1] };
  // screen-declared routes (navData carries route + bn)
  for (const mid of Object.keys(LMS_MODULES)) {
    const m: any = (LMS_MODULES as any)[mid];
    for (const grp of m.groups) for (const s of grp.screens) {
      if (s.route && s.route.replace(/^#/, "") === route)
        return { id: `s-${hash32(route)}`, route, icon: typeIcon(s.t), pin: false, kind: "screen", ref: s.id };
    }
  }
  if (named[route]) return { id: `n-${hash32(route)}`, route, icon: named[route][0], pin: false, kind: "named", ref: named[route][1] };
  if (/^\/cust(omer)?\//.test(route)) return { id: "n-cust", route, icon: "◉", pin: false, kind: "screen", ref: "A1-s5" };
  if (/^\/loan(s)?\//.test(route)) return { id: "n-loan", route, icon: "◉", pin: false, kind: "screen", ref: "E1-s1" };
  if (/^\/cib\//.test(route)) return { id: "n-cib", route, icon: "🛡", pin: false, kind: "screen", ref: "C1-s4" };
  if (/^\/workspace\//.test(route)) {
    const mid = route.split("/")[2];
    if ((LMS_MODULES as any)[mid]) return { id: `m-${mid}`, route, icon: (LMS_MODULES as any)[mid].icon, pin: false, kind: "mod", ref: mid };
  }
  if (/^\/report\//.test(route)) return { id: "n-report", route, icon: "📄", pin: false, kind: "screen", ref: "G2-s4" };
  if (/^\/screen\//.test(route)) {
    const sid = route.split("/")[2];
    const hit = findScreen(sid);
    if (hit) return { id: `s-${sid}`, route, icon: typeIcon(hit.scr.t), pin: false, kind: "screen", ref: sid };
  }
  return null;
}
function findScreen(sid: string): { mod: any; grp: any; scr: any } | null {
  for (const mid of Object.keys(LMS_MODULES)) {
    const m: any = (LMS_MODULES as any)[mid];
    for (const grp of m.groups) for (const s of grp.screens) if (s.id === sid) return { mod: m, grp, scr: s };
  }
  return null;
}
function screenTitle(tab: ShellTab): string {
  if (tab.kind === "screen") { const hit = findScreen(tab.ref); return hit ? pick({ en: hit.scr.en, bn: hit.scr.bn }) : tab.ref; }
  if (tab.kind === "mod") { const m: any = (LMS_MODULES as any)[tab.ref]; return m ? pick({ en: m.en, bn: m.bn }) : tab.ref; }
  if (tab.ref.startsWith("/")) return tab.ref.replace(/\//g, " ").trim();
  return t(tab.ref);
}

export function AppShell() {
  const nav = useNavigate();
  const go = useGo();
  const location = useLocation();
  const [lang, setLangState] = useLang();

  const [collapsed, setCollapsed] = React.useState(() => LS.get("collapsed", false));
  const [theme, setTheme] = React.useState<string>(() => LS.get("theme", "light"));
  const [density, setDensity] = React.useState<string>(() => LS.get("density", "comfortable"));
  const [fav, setFav] = React.useState<string[]>(() => LS.get("fav", [] as string[]));
  const [recents, setRecents] = React.useState<{ id: string; route: string; icon: string }[]>(() => LS.get("recents", []));
  const [tabs, setTabs] = React.useState<ShellTab[]>(() => {
    const saved = LS.get("tabs", [] as ShellTab[]);
    if (saved.length) return saved;
    // cold session: the primary workspace tabs (prototype role-center defaults)
    return ["/home", "/customers", "/apply", "/pipeline", "/collections"]
      .map((r) => tabFor(r)).filter((x): x is ShellTab => !!x);
  });
  const [activeTab, setActiveTab] = React.useState<string | null>(() => LS.get("activeTab", null as string | null));
  const [openArea, setOpenArea] = React.useState<string | null>(null);
  const [megaArea, setMegaArea] = React.useState<string | null>(null);
  const [navFilter, setNavFilter] = React.useState("");
  const [tmQuery, setTmQuery] = React.useState("");
  const [tmHL, setTmHL] = React.useState(-1);
  const [railPanel, setRailPanel] = React.useState<"tabs" | "fav" | null>(null);
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  const [cpMsgs, setCpMsgs] = React.useState<{ who: "ai" | "me"; text: string }[]>([]);
  const [cpInput, setCpInput] = React.useState("");
  const auth = useAuth();
  const [userMenu, setUserMenu] = React.useState(false);
  const roles = auth.session?.roles ?? [];
  const authMode = resolveMode();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const navRef = React.useRef<HTMLElement>(null);

  /* ---------- document-level prefs ---------- */
  React.useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  React.useEffect(() => { document.documentElement.setAttribute("data-density", density); }, [density]);
  React.useEffect(() => { document.documentElement.setAttribute("lang", lang === "bn" ? "bn" : "en"); }, [lang]);

  /* ---------- per-route document title ---------- */
  React.useEffect(() => {
    const tab = tabs.find((x) => x.id === activeTab);
    document.title = tab ? `${screenTitle(tab)} · ULMS` : "ULMS · Unisoft Loan Management System";
  }, [tabs, activeTab, lang]);

  /* ---------- tabs sync (prototype syncTab) ---------- */
  React.useEffect(() => {
    const tab = tabFor(location.pathname);
    if (!tab) return;
    setTabs((prev) => {
      const exists = prev.find((x) => x.id === tab.id);
      let next = prev;
      if (exists) next = prev.map((x) => (x.id === tab.id ? { ...x, route: tab.route } : x));
      else {
        const unpinned = prev.filter((x) => !x.pin);
        next = [...prev];
        if (next.length >= MAX_TABS && unpinned.length) next = next.filter((x) => x.id !== unpinned[0].id);
        next.push(tab);
      }
      LS.set("tabs", next);
      return next;
    });
    setActiveTab(tab.id);
    LS.set("activeTab", tab.id);
    setRecents((prev) => {
      const next = [{ id: tab.id, route: tab.route, icon: tab.icon },
        ...prev.filter((r) => r.id !== tab.id)].slice(0, 6);
      LS.set("recents", next);
      return next;
    });
  }, [location.pathname]);

  const openTabRoute = (t: ShellTab) => nav(t.route);
  const closeTab = (id: string) => {
    setTabs((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i < 0) return prev;
      const wasActive = activeTab === id;
      const next = prev.filter((x) => x.id !== id);
      LS.set("tabs", next);
      if (wasActive) {
        const nxt = next[Math.min(i, next.length - 1)];
        if (nxt) { setActiveTab(nxt.id); LS.set("activeTab", nxt.id); nav(nxt.route); }
        else { setActiveTab(null); LS.set("activeTab", null); nav("/home"); }
      }
      return next;
    });
  };
  const togglePin = (id: string) => {
    setTabs((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, pin: !x.pin } : x));
      LS.set("tabs", next);
      return next;
    });
  };

  /* ---------- prefs handlers ---------- */
  const toggleCollapsed = () => { setCollapsed((c) => { LS.set("collapsed", !c); return !c; }); };
  const cycleDensity = () => {
    setDensity((d) => {
      const next = d === "compact" ? "comfortable" : d === "comfortable" ? "spacious" : "compact";
      LS.set("density", next);
      toast(`Density: ${next}`);
      return next;
    });
  };
  const toggleTheme = () => {
    setTheme((th) => {
      const next = th === "dark" ? "light" : "dark";
      LS.set("theme", next);
      toast(next === "dark" ? "Dark theme on (charts restyled)" : "Light theme on");
      return next;
    });
  };
  const toggleLang = () => {
    const next = lang === "en" ? "bn" : "en";
    setLangState(next);
    toast(next === "bn" ? "ভাষা বাংলায় পরিবর্তিত" : "Language switched to English");
  };
  const toggleFav = (mid: string) => {
    setFav((prev) => {
      const next = prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid];
      LS.set("fav", next);
      toast(`${prev.includes(mid) ? "Removed from" : "Pinned to"} favorites · ${mid}`);
      return next;
    });
  };

  /* ---------- Tell-ME ---------- */
  const tmResults = React.useMemo(() => (tmQuery.trim() ? lmSearch(tmQuery) : []), [tmQuery]);
  React.useEffect(() => { setTmHL(-1); }, [tmQuery]);

  /* ---------- global keyboard map (prototype parity) ---------- */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "q" || e.key === "Q")) { e.preventDefault(); searchInputRef.current?.focus(); searchInputRef.current?.select(); }
      else if (e.ctrlKey && (e.key === "b" || e.key === "B")) { e.preventDefault(); toggleCollapsed(); }
      else if (e.ctrlKey && (e.key === "/" )) { e.preventDefault(); nav("/shortcuts"); }
      else if (e.ctrlKey && e.shiftKey && e.key === "?") { e.preventDefault(); nav("/shortcuts"); }
      else if (e.ctrlKey && (e.key === "k" || e.key === "K")) { e.preventDefault(); searchInputRef.current?.focus(); searchInputRef.current?.select(); }
      else if (e.ctrlKey && (e.key === "w" || e.key === "W")) { e.preventDefault(); if (activeTab) closeTab(activeTab); }
      else if (e.ctrlKey && e.shiftKey && e.key === "T") { e.preventDefault(); toast("Session restored — tabs rehydrated from your last visit"); }
      else if (e.key === "Escape") { setMegaArea(null); setRailPanel(null); setCopilotOpen(false); }
      else if (e.ctrlKey && (e.key === "PageUp" || e.key === "PageDown")) {
        e.preventDefault();
        const i = tabs.findIndex((x) => x.id === activeTab);
        if (i >= 0) {
          const n = tabs[(i + (e.key === "PageUp" ? -1 : 1) + tabs.length) % tabs.length];
          if (n) nav(n.route);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeTab, tabs, nav]);

  /* close mega on outside click */
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".usl-mega") && !t.closest(".nav-area") && !t.closest(".page-crumb")) setMegaArea(null);
      if (!t.closest(".rail-panel") && !t.closest(".usrail")) setRailPanel(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  /* ---------- nav item helpers ---------- */
  const navItem = (route: string, icon: string, label: string, opts?: { on?: boolean; title?: string }) => (
    <a className={`ni${opts?.on ? " on" : ""}`} href={route} title={opts?.title}
      onClick={(e) => { e.preventDefault(); setMegaArea(null); go(route); }}>
      <span className="ni-ico">{icon}</span><span className="grow">{label}</span>
    </a>
  );
  const modRow = (mid: string) => {
    const m: any = (LMS_MODULES as any)[mid];
    const on = location.pathname.startsWith(`/workspace/${mid}`);
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <a className={`ni${on ? " on" : ""}`} style={{ flex: 1, minWidth: 0 }} href={`/workspace/${mid}`}
          onClick={(e) => { e.preventDefault(); setMegaArea(null); go(`/workspace/${mid}`); }}>
          <span className="ni-ico">{m.icon}</span>
          <span className="grow trunc">{pick({ en: m.en, bn: m.bn })}</span>
          <span className="ni-badge">{mid}</span>
        </a>
        <button className="ni" style={{ flex: "none", padding: "6px 6px" }} title="Favorite" aria-label={`Toggle favorite ${mid}`}
          onClick={() => toggleFav(mid)}>{fav.includes(mid) ? "★" : "☆"}</button>
      </div>
    );
  };

  const areaVisible = (a: any): boolean => {
    const gate = AREA_ROLES[a.id];
    return !gate || roles.some((r) => gate.has(r));
  };
  const areaMatchesFilter = (a: any): boolean => {
    if (!areaVisible(a)) return false;
    if (!navFilter.trim()) return true;
    const q = navFilter.toLowerCase();
    if (pick({ en: a.en, bn: a.bn }).toLowerCase().includes(q)) return true;
    return a.mods.some((mid: string) => {
      const m: any = (LMS_MODULES as any)[mid];
      return pick({ en: m.en, bn: m.bn }).toLowerCase().includes(q)
        || m.groups.some((g: any) => g.screens.some((s: any) => pick({ en: s.en, bn: s.bn }).toLowerCase().includes(q)));
    });
  };

  const systemLinks: [string, string, string][] = ([
    ["/reports", "📄", t("nav.compliance.reports")],
    ["/regcon", "🏛", t("nav.compliance.regcon")],
    ["/classification", "🏷", t("nav.compliance.board")],
    ["/directory", "☰", "Module Directory"],
    ["/coverage", "✓", "Coverage"],
    ["/portal", "🌐", "Portals"],
    ["/screen/C3-s1", "📱", "Field App"],
    ["/designsystem", "🎨", "Design System"],
    ["/shortcuts", "⌨", t("shell.shortcuts")],
    ["/settings", "⚙", "Settings"],
  ] as [string, string, string][]).filter(([r]) => {
    const gate = SYSTEM_LINK_ROLES[r];
    return !gate || roles.some((x) => gate.has(x));
  });

  const counts = React.useMemo(() => {
    let screens = 0, groups = 0, reports = 0;
    Object.values(LMS_MODULES).forEach((m: any) => {
      m.groups.forEach((g: any) => { groups++; screens += g.screens.length; });
      reports += m.reports.length;
    });
    return { modules: Object.keys(LMS_MODULES).length, groups, screens, reports };
  }, []);

  /* ---------- copilot ---------- */
  const cpAnswer = (q: string) => {
    const reply = /NPL/i.test(q)
      ? "Gross NPL is 4.6% (↓0.2pp m/m). The improvement came from ৳1.8 Cr write-off at Bogura and SMA cures after the dunning campaign. Watch item: 61–90 DPD bucket grew 6%."
      : /APP-7239/i.test(q)
        ? "APP-7239 · Md. Rafiqul Islam · SME Term Loan ৳45 L · score 781 (AA) · DBR 38% · CPV cleared. At L3 Regional Manager for 46h (SLA 48h). Recommendation: approve — precedent case APP-7180 matches profile."
        : /61–90|strateg/i.test(q)
          ? "For 61–90 DPD (SMA): field-visit-first strategy yields 2.3× promise conversion vs SMS. 23 accounts qualify; 8 already have officers within 5 km. Draft sequence: visit → PTP with date → auto SMS confirmation."
          : /branch|disburse/i.test(q)
            ? "Disbursement target beaters: Chattogram (118%), Uttara (106%), Sylhet (103%). Laggards: Khulna (81%) — driven by 2 pending collateral valuations. Full ranking: Branch Performance dashboard."
            : "I can explain portfolio movements, summarise applications, draft collection strategies and compose report queries. Try one of the suggestions above.";
    setTimeout(() => setCpMsgs((prev) => [...prev, { who: "ai", text: reply }]), 350);
  };

  const mega = megaArea ? LMS_AREAS.find((a) => a.id === megaArea) : null;
  const routeLabel = location.pathname + location.search;

  return (
    <div id="usl-shell" className={collapsed ? "collapsed" : ""}>
      {/* 1. TOPBAR */}
      <header className="usl-topbar" role="banner">
        <button className="tb-btn" aria-label="Toggle navigation" title="Navigation (Ctrl+B)" onClick={toggleCollapsed}>☰</button>
        <div className="tb-brand" style={{ cursor: "pointer" }} onClick={() => nav("/home")}>
          <span className="tb-logo">U</span>
          <div className="tb-app">
            <b>ULMS <span style={{ fontWeight: 400 }}>· Unisoft Loan Management</span></b>
            <span>ABC Bank Bangladesh · Fineract core</span>
          </div>
        </div>
        {/* environment identity — the real build mode, never a hardcoded stage */}
        <span className="tb-portal" data-testid="env-chip">{ENV_LABEL}</span>

        <div className="tb-search">
          <span className="s-ico">⌕</span>
          <input ref={searchInputRef} id="tellme" type="search" role="combobox" aria-expanded={!!tmQuery.trim()}
            aria-label={t("shell.search.label")} autoComplete="off"
            placeholder={t("shell.search.placeholder")}
            value={tmQuery}
            onChange={(e) => setTmQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setTmHL((hl) => (hl + 1 + tmResults.length) % Math.max(tmResults.length, 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setTmHL((hl) => (hl - 1 + tmResults.length) % Math.max(tmResults.length, 1)); }
              else if (e.key === "Enter") {
                e.preventDefault();
                const hit = tmResults[tmHL >= 0 ? tmHL : 0];
                if (hit) { setTmQuery(""); go(hit.route); }
              } else if (e.key === "Escape") { setTmQuery(""); }
            }} />
          <kbd>Alt+Q</kbd>
          <div className={`tm-drop${tmQuery.trim() && tmResults.length ? " open" : ""}`} role="listbox">
            {tmQuery.trim() && !tmResults.length
              ? <div className="tm-empty">No matches for “{tmQuery}” — try an account no (LN-…), CIF id, report name or “new application”.</div>
              : tmResults.map((r, i) => (
                <React.Fragment key={`${r.g}-${i}`}>
                  {r.g !== (tmResults[i - 1]?.g ?? "") && <div className="tm-group">{r.g}</div>}
                  <div className={`tm-item${i === tmHL ? " hl" : ""}`} role="option" aria-selected={i === tmHL}
                    onClick={() => { setTmQuery(""); go(r.route); }}>
                    <span className="t-ico">{r.ico}</span><span className="trunc grow">{r.t}</span><small>↵</small>
                  </div>
                </React.Fragment>
              ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
          <button className="tb-btn" title="Module Directory (A–Z)" aria-label="Directory" onClick={() => nav("/directory")}>☰</button>
          <button className="tb-btn" title="Notifications" aria-label="Notifications" onClick={() => nav("/notifications")}>
            🔔<span className="tb-badge">6</span>
          </button>
          <button className="tb-btn" aria-label="Toggle language" title={lang === "en" ? "Switch to Bangla" : "Switch to English"}
            onClick={toggleLang}>{lang === "en" ? "বাংলা" : "EN"}</button>
          <button className="tb-btn" title="Density: compact / comfortable / spacious" aria-label="Density" onClick={cycleDensity}>◷</button>
          <button className="tb-btn" title="Toggle dark mode" aria-label="Theme" onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
          <button className={`tb-btn${copilotOpen ? " on" : ""}`} title="ULMS Copilot" aria-label="Copilot" onClick={() => setCopilotOpen((v) => !v)}>✦</button>
          {authMode !== "oidc" && (
            <span className="tb-portal" title="Dev session — no authentication in mock/token modes" data-testid="dev-banner">DEV</span>
          )}
          <button className="tb-btn" style={{ width: "auto", padding: "0 10px" }} title="Officer session" aria-label="Officer session"
            aria-expanded={userMenu} onClick={() => setUserMenu((v) => !v)}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--primary-tint)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>
              {(auth.session?.officer ?? "?").slice(0, 2).toUpperCase()}
            </span>
            <span className="small" style={{ marginLeft: 6, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis" }} data-testid="officer-chip">
              {auth.session?.officer ?? "anonymous"}
            </span>▾
          </button>
          {userMenu && (
            <div className="rail-panel open" data-mode="user" style={{ right: 0, top: "var(--topbar-h, 48px)", width: 280, zIndex: 60 }}
              onMouseLeave={() => setUserMenu(false)}>
              <div className="rp-h">{auth.session?.officer}</div>
              <div style={{ padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {roles.length === 0 && <span className="small">no roles</span>}
                {roles.map((r) => (
                  <span key={r} className="tag" title={ROLE_LABEL[r as RealmRole] ?? r}>{r}</span>
                ))}
              </div>
              {authMode !== "oidc" && (
                <>
                  <div className="rp-h" style={{ marginTop: 6 }}>Switch role (dev)</div>
                  {DEV_PERSONAS.map((p) => (
                    <div key={p.id} className="rp-item" data-persona={p.id}
                      onClick={() => { auth.loginAs(p.id); setUserMenu(false); toast(`Session switched → ${p.label}`); }}>
                      <span className="trunc grow">{p.label}</span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ padding: 8 }}>
                <button className="btn btn-2nd" style={{ width: "100%" }} onClick={() => { setUserMenu(false); auth.logout(); }}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. SITEMAP NAV */}
      <nav className="usl-nav" id="sitemap" ref={navRef} aria-label="Sitemap" onMouseLeave={() => setMegaArea(null)}>
        <div className="nav-filter">
          <input id="nav-filter" placeholder={t("shell.nav.filter")} aria-label={t("shell.nav.filter")}
            value={navFilter} onChange={(e) => setNavFilter(e.target.value)} />
        </div>
        <div className="nav-body">
          {!navFilter.trim() && <>
            <div className="nav-zone-h">⌂ {lang === "bn" ? "হোম" : "Home"}</div>
            {navItem("/home", "⌂", lang === "bn" ? "হোম" : "Home", { on: location.pathname === "/home" })}
            {fav.length > 0 && <>
              <div className="nav-zone-h">★ {lang === "bn" ? "প্রিয়" : "Favorites"}</div>
              {fav.map((mid) => (LMS_MODULES as any)[mid] && modRow(mid))}
            </>}
          </>}
          <div className="nav-zone-h">▼ {lang === "bn" ? "এলাকা" : "Areas"}</div>
          {LMS_AREAS.filter(areaMatchesFilter).map((a) => {
            const open = (navFilter.trim() ? true : openArea === a.id) || megaArea === a.id;
            return (
              <React.Fragment key={a.id}>
                <button className="ni nav-area" aria-expanded={!!open}
                  onClick={() => { setOpenArea(openArea === a.id ? null : a.id); setMegaArea(a.id); }}
                  onMouseEnter={() => setMegaArea(a.id)}>
                  <span className="ni-ico" style={{ color: a.rail }}>▮</span>
                  <span className="grow">{pick({ en: a.en, bn: a.bn })}</span>
                  <span className="chev">›</span>
                </button>
                <div className={`nav-sub${open ? " open" : ""}`} id={`sub-${a.id}`}>
                  {a.mods.map((mid: string) => modRow(mid))}
                </div>
              </React.Fragment>
            );
          })}
          {!navFilter.trim() && recents.length > 0 && <>
            <div className="nav-zone-h">🕘 {lang === "bn" ? "সাম্প্রতিক" : "Recents"}</div>
            {recents.map((r) => {
              const rt = tabFor(r.route);
              return navItem(r.route, r.icon, rt ? screenTitle(rt) : r.route);
            })}
          </>}
          <div className="nav-zone-h">⚙ {lang === "bn" ? "সিস্টেম" : "System"}</div>
          {systemLinks.map(([route, icon, label]) => navItem(route, icon, label, { on: location.pathname === route }))}
          <div style={{ height: 70 }} />
        </div>
      </nav>

      {/* MEGA MENU FLYOUT */}
      {mega && (
        <div className="usl-mega" id="megamenu" role="menu" aria-label={`${mega.en} mega menu`}
          onMouseEnter={() => setMegaArea(mega.id)} onMouseLeave={() => setMegaArea(null)}>
          <div className="mega-head">
            <div className="mega-title">
              {pick({ en: mega.en, bn: mega.bn })}
              <small>{mega.mods.length} modules · module → group → screen · {counts.screens} screens bank-wide</small>
            </div>
            <div className="mega-mods">
              {mega.mods.map((mid: string) => {
                const m: any = (LMS_MODULES as any)[mid];
                return (
                  <a key={mid} className="mega-chip" href={`/workspace/${mid}`}
                    onClick={(e) => { e.preventDefault(); setMegaArea(null); go(`/workspace/${mid}`); }}>
                    <span>{m.icon}</span><b>{mid}</b> {pick({ en: m.en, bn: m.bn })}
                  </a>
                );
              })}
              <a className="mega-chip" href="/directory" onClick={(e) => { e.preventDefault(); setMegaArea(null); go("/directory"); }}>
                <span>☰</span> Module Directory (A–Z)
              </a>
            </div>
          </div>
          <div className="mega-cols">
            {mega.mods.map((mid: string) => {
              const m: any = (LMS_MODULES as any)[mid];
              const nodes: React.ReactNode[] = [];
              m.groups.forEach((g: any) => {
                nodes.push(
                  <div key={`${mid}-${g.en}`} className="mega-col">
                    <h6>{mid} · {m.en} — {g.en}</h6>
                    {g.screens.map((s: any) => {
                      const r = s.route ? normalizeRoute(s.route) : `/screen/${s.id}`;
                      return (
                        <a key={s.id} className="mega-link" href={r}
                          onClick={(e) => { e.preventDefault(); setMegaArea(null); go(r); }}>
                          <span>{typeIcon(s.t)}</span>
                          <span className="trunc grow">{pick({ en: s.en, bn: s.bn })}</span>
                          <span className="sc-type">{s.t}</span>
                        </a>
                      );
                    })}
                  </div>,
                );
              });
              if (m.reports.length) {
                nodes.push(
                  <div key={`${mid}-reports`} className="mega-col">
                    <h6>{mid} · Reports</h6>
                    {m.reports.slice(0, 4).map((rn: string, i: number) => (
                      <a key={rn} className="mega-link" href={`/report/${mid}/${i}`}
                        onClick={(e) => { e.preventDefault(); setMegaArea(null); go(`/report/${mid}/${i}`); }}>
                        <span>📄</span><span className="trunc grow">{rn}</span><span className="sc-type">r</span>
                      </a>
                    ))}
                    <a className="mega-link" href="/reports" onClick={(e) => { e.preventDefault(); setMegaArea(null); go("/reports"); }}>
                      <span>⋯</span><span>View all reports</span>
                    </a>
                  </div>,
                );
              }
              return nodes;
            })}
          </div>
          <div className="mega-foot">
            <span>{mega.mods.length} modules</span>
            <span>{mega.mods.reduce((s: number, mid: string) => s + (LMS_MODULES as any)[mid].groups.length, 0)} screen groups</span>
            <span>{mega.mods.reduce((s: number, mid: string) => s + (LMS_MODULES as any)[mid].groups.reduce((a: number, g: any) => a + g.screens.length, 0), 0)} screens</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT (tabstrip + route outlet) */}
      <main className="usl-main">
        <div className="tabstrip" role="tablist" aria-label="Open records">
          {tabs.length === 0 && <div className="tab" style={{ opacity: 0.6 }}>⌂ Home</div>}
          {tabs.map((tab) => (
            <div key={tab.id} className={`tab${tab.id === activeTab ? " on" : ""}${tab.pin ? " pin" : ""}`}
              role="tab" tabIndex={0} aria-selected={tab.id === activeTab} title={`${screenTitle(tab)} · ${tab.route}`}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("[data-close]")) { e.stopPropagation(); closeTab(tab.id); return; }
                if (target.closest("[data-pin]")) { e.stopPropagation(); togglePin(tab.id); return; }
                if (activeTab !== tab.id) openTabRoute(tab);
              }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTabRoute(tab); } }}>
              <span className="tab-pin" data-pin={tab.id} title={tab.pin ? "Unpin" : "Pin"}>📌</span>
              <span className="trunc" style={{ maxWidth: 150 }}>{screenTitle(tab)}</span>
              <span className="tab-x" data-close={tab.id} title="Close (Ctrl+W)">✕</span>
            </div>
          ))}
        </div>
        <div id="page" role="main" tabIndex={-1} data-route={routeLabel.replace(/^\//, "")}>
          {/* lazy route chunks suspend here — the shell stays mounted (audit R1) */}
          <React.Suspense fallback={
            <div className="empty-state" style={{ minHeight: 180 }}>
              <div className="e-ico">◷</div>
              <p>Loading screen…</p>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </div>
      </main>

      {/* right tab rail */}
      <aside className="usrail" aria-label="Tab rail">
        <button className="rail-ico" title="Open tabs" aria-label="Open tabs"
          onClick={() => setRailPanel((p) => (p === "tabs" ? null : "tabs"))}>
          ▤<span className="tb-badge" id="rail-n">{tabs.length}</span>
        </button>
        <button className="rail-ico" title="Favorites" aria-label="Favorites"
          onClick={() => setRailPanel((p) => (p === "fav" ? null : "fav"))}>★</button>
        <button className="rail-ico" title="Shortcuts" aria-label="Shortcuts" onClick={() => nav("/shortcuts")}>⌨</button>
        <button className="rail-ico" title="Settings" aria-label="Settings" onClick={() => nav("/settings")}>⚙</button>
      </aside>
      <div className={`rail-panel${railPanel ? " open" : ""}`} data-mode={railPanel ?? undefined}>
        {railPanel === "tabs" && (
          <>
            <div className="rp-h">{lang === "bn" ? "পিন করা" : "Pinned"}</div>
            {tabs.filter((x) => x.pin).length
              ? tabs.filter((x) => x.pin).map((x) => (
                <div key={x.id} className={`rp-item${x.id === activeTab ? " on" : ""}`} onClick={() => { openTabRoute(x); setRailPanel(null); }}>
                  {x.icon} <span className="trunc grow">{screenTitle(x)}</span>
                </div>))
              : <div className="small" style={{ padding: "4px 8px" }}>{lang === "bn" ? "কোনো প্রিয় নেই" : "No pinned tabs"}</div>}
            <div className="rp-h" style={{ marginTop: 8 }}>{lang === "bn" ? "খোলা ট্যাব" : "Open tabs"} ({tabs.filter((x) => !x.pin).length})</div>
            {tabs.filter((x) => !x.pin).map((x) => (
              <div key={x.id} className={`rp-item${x.id === activeTab ? " on" : ""}`} onClick={() => { openTabRoute(x); setRailPanel(null); }}>
                {x.icon} <span className="trunc grow">{screenTitle(x)}</span>
              </div>))}
            <div style={{ padding: 8 }}>
              <button className="btn btn-sm btn-2nd" onClick={() => { toast("Session restored — tabs rehydrated from your last visit"); setRailPanel(null); }}>
                ↻ Reopen last session
              </button>
            </div>
          </>
        )}
        {railPanel === "fav" && (
          <>
            <div className="rp-h">{lang === "bn" ? "প্রিয় মডিউল" : "Favorite modules"}</div>
            {fav.length
              ? fav.map((mid) => {
                const m: any = (LMS_MODULES as any)[mid];
                return m ? (
                  <div key={mid} className="rp-item" onClick={() => { go(`/workspace/${mid}`); setRailPanel(null); }}>
                    {m.icon} <span className="trunc grow">{m.en}</span><span className="ni-badge">{mid}</span>
                  </div>) : null;
              })
              : <div className="small" style={{ padding: "6px 8px" }}>{lang === "bn" ? "কোনো প্রিয় নেই" : "No favorites yet — star a module in the sitemap"}</div>}
          </>
        )}
      </div>

      {/* 4. STATUS BAR */}
      <footer className="usl-statusbar" role="contentinfo">
        <span className="sb-pill">{ENV_LABEL}</span><span className="sb-sep" />
        <span>Unisoft Systems · {t("shell.statusbar.company")} · FY 2026-27</span><span className="sb-sep" />
        <span>✓ {t("shell.statusbar.autosave")}</span><span className="sb-sep" />
        <span className="mono" id="sb-route">{routeLabel}</span>
        <span style={{ marginLeft: "auto" }} className="flex">
          <button className="sb-btn" onClick={cycleDensity}>{t("shell.statusbar.density")}: {density}</button>
          <button className="sb-btn" onClick={() => nav("/shortcuts")}><kbd className="k">Ctrl</kbd>+<kbd className="k">/</kbd></button>
        </span>
      </footer>

      {/* copilot panel */}
      <div className={`copilot-panel${copilotOpen ? " open" : ""}`} id="copilot" role="complementary" aria-label="Copilot panel">
        <div className="cp-h">
          <span className="cp-ico">✦</span><b>ULMS Copilot</b><small className="muted">preview</small>
          <button className="tb-btn" style={{ marginLeft: "auto" }} aria-label="Close" onClick={() => setCopilotOpen(false)}>✕</button>
        </div>
        <div className="cp-b" id="cp-body">
          {cpMsgs.length === 0 && (
            <div className="cp-msg ai">
              <span className="who">✦</span>
              <div className="cp-bub">Good morning. I reviewed overnight portfolio movement. <b>4 accounts migrated to SMA</b> at Gulshan branch and approval SLA is at risk on <b>APP-7239</b>. Ask me anything, or pick a suggestion.</div>
            </div>
          )}
          {cpMsgs.map((m, i) => (
            <div key={i} className={`cp-msg ${m.who}`}>
              <span className="who">{m.who === "ai" ? "✦" : "RA"}</span>
              <div className="cp-bub">{m.text}</div>
            </div>
          ))}
          {["Why did NPL move this week?", "Summarise APP-7239 for approval", "Draft collection strategy for 61–90 DPD", "Which branches beat disbursement target?"].map((s) => (
            <button key={s} className="cp-sugg" onClick={() => { setCpMsgs((p) => [...p, { who: "me", text: s }]); cpAnswer(s); }}>{s}</button>
          ))}
        </div>
        <div className="cp-f">
          <input id="cp-in" placeholder="Ask about loans, risk, reports…" aria-label="Ask copilot"
            value={cpInput} onChange={(e) => setCpInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && cpInput.trim()) { setCpMsgs((p) => [...p, { who: "me", text: cpInput }]); cpAnswer(cpInput); setCpInput(""); } }} />
          <button className="btn btn-primary" onClick={() => { if (cpInput.trim()) { setCpMsgs((p) => [...p, { who: "me", text: cpInput }]); cpAnswer(cpInput); setCpInput(""); } }}>Ask</button>
        </div>
      </div>

      <ToastHost />
      <a className="skip-link" href="#page" onClick={(e) => { e.preventDefault(); (document.getElementById("page") as HTMLElement)?.focus(); }}>Skip to main content</a>
    </div>
  );
}
