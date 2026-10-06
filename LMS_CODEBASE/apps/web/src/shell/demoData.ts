/* ============================================================
   ULMS demo data — client-side port of Front_end/js/demo_data.js.
   Deterministic, seeded (same data every boot). Bangladeshi context:
   ৳, Lakh/Crore, BRPD 15/2024 stages, CIB grades, bKash/Nagad rails.
   Used by the prototype-faithful pages for demo analytics; the
   live registers (customers/loans/applications/collections) come
   from the API.
   ============================================================ */

export function h32(str: string): number {
  let x = 0;
  for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0;
  return x;
}
export function rng(seed: string): () => number {
  let s = h32(seed) || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
const pickW = <T,>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)];

/* ---------- formatters ---------- */
export const F = {
  tk(n: number): string {
    const neg = n < 0; n = Math.abs(n);
    let s: string;
    if (n >= 1e7) s = (n / 1e7).toFixed(2).replace(/\.00$/, "") + " Cr";
    else if (n >= 1e5) s = (n / 1e5).toFixed(2).replace(/\.00$/, "") + " L";
    else s = n.toLocaleString("en-US");
    return (neg ? "−৳" : "৳") + s;
  },
  tkFull(n: number): string { return (n < 0 ? "−" : "") + "৳ " + Math.abs(Math.round(n)).toLocaleString("en-US"); },
  pct(n: number): string { return (Math.round(n * 10) / 10).toFixed(1) + "%"; },
};

/* ---------- BRPD 15/2024 (single source of truth) ---------- */
export const BRPD = [
  { k: "STD-0", cls: "Standard · Current", dpd: "0", prov: 1, chip: "b-std0", color: "#107C10", bn: "উত্তম (চলতি)" },
  { k: "STD-1", cls: "Standard · Watch", dpd: "1–30", prov: 1, chip: "b-std1", color: "#256025", bn: "উত্তম (নজরদারি)" },
  { k: "STD-2", cls: "Standard · Caution", dpd: "31–60", prov: 1, chip: "b-std2", color: "#8A6D1A", bn: "উত্তম (সতর্ক)" },
  { k: "SMA", cls: "Special Mention", dpd: "61–90", prov: 5, chip: "b-sma", color: "#B58900", bn: "বিশেষ উল্লেখ" },
  { k: "SS", cls: "Substandard", dpd: "91–180", prov: 20, chip: "b-ss", color: "#C42B3C", bn: "অনুত্তম" },
  { k: "DF", cls: "Doubtful", dpd: "181–365", prov: 50, chip: "b-df", color: "#DA3B01", bn: "সন্দেহজনক" },
  { k: "B/L", cls: "Bad / Loss", dpd: ">365", prov: 100, chip: "b-bl", color: "#A4262C", bn: "অবলোপন" },
];
export function stageOf(dpd: number): number {
  if (dpd <= 0) return 0; if (dpd <= 30) return 1; if (dpd <= 60) return 2;
  if (dpd <= 90) return 3; if (dpd <= 180) return 4; if (dpd <= 365) return 5; return 6;
}

/* ---------- reference sets ---------- */
export const PRODUCTS = [
  { id: "PL-01", en: "Personal Loan", bn: "ব্যক্তিগত ঋণ", rate: "11.99%", tenor: "12–60m", amt: "৳50K–20L", type: "Retail", icon: "👤" },
  { id: "HL-01", en: "Home Loan", bn: "গৃহঋণ", rate: "9.50%", tenor: "60–300m", amt: "৳10L–2Cr", type: "Retail", icon: "🏠" },
  { id: "AL-01", en: "Auto Loan", bn: "যানবাহন ঋণ", rate: "12.50%", tenor: "12–84m", amt: "৳5L–80L", type: "Retail", icon: "🚗" },
  { id: "SME-01", en: "SME Term Loan", bn: "ক্ষুদ্র ঋণ (এসএমই)", rate: "13.00%", tenor: "12–60m", amt: "৳2L–5Cr", type: "SME", icon: "🏭" },
  { id: "SME-02", en: "SME Working Capital", bn: "এসএমই চালু মূলধন", rate: "13.50%", tenor: "12m rev", amt: "৳5L–3Cr", type: "SME", icon: "📦" },
  { id: "AGR-01", en: "Krishi (Agri) Loan", bn: "কৃষি ঋণ", rate: "8.00%", tenor: "6–36m", amt: "৳50K–10L", type: "Agri", icon: "🌾" },
  { id: "ISL-01", en: "Halal Auto Murabaha", bn: "হালাল অটো মুরাবাহা", rate: "12.00%", tenor: "12–60m", amt: "৳5L–60L", type: "Islamic", icon: "☪" },
  { id: "EDU-01", en: "Education Loan", bn: "শিক্ষা ঋণ", rate: "10.00%", tenor: "12–120m", amt: "৳1L–20L", type: "Retail", icon: "🎓" },
];
export const BRANCHES = [
  { id: "BR-001", name: "Gulshan", region: "Dhaka North" },
  { id: "BR-002", name: "Dhanmondi", region: "Dhaka North" },
  { id: "BR-003", name: "Motijheel", region: "Dhaka South" },
  { id: "BR-004", name: "Uttara", region: "Dhaka North" },
  { id: "BR-005", name: "Chattogram", region: "Chattogram" },
  { id: "BR-006", name: "Sylhet", region: "Sylhet" },
  { id: "BR-007", name: "Khulna", region: "Khulna" },
  { id: "BR-008", name: "Rajshahi", region: "Rajshahi" },
  { id: "BR-009", name: "Bogura", region: "Rajshahi" },
  { id: "BR-010", name: "Narayanganj", region: "Dhaka South" },
];

export interface DemoCustomer {
  cif: string; en: string; bn: string; firm: string | null;
  nid: string; mobile: string; city: string; seg: string;
  branch: (typeof BRANCHES)[number]; kyc: string;
  cibScore: number; cibGrade: string; risk: string; since: string; relLoans: number;
}
const C_NAMES: [string, string, string | null][] = [
  ["Md. Rafiqul Islam", "মোঃ রফিকুল ইসলাম", "Rashida Traders (Sole Prop.)"],
  ["Nusrat Jahan", "নুসরাত জাহান", null],
  ["Abdul Karim", "আব্দুল করিম", "Karim Auto Workshop"],
  ["Fatima Begum", "ফাতেমা বেগম", null],
  ["S. M. Tanvir Ahmed", "এস এম তানভির আহমেদ", "Tanvir Sea Foods Ltd."],
  ["Shirin Akter", "শিরিন আক্তার", null],
  ["Jahangir Alam", "জাহাঙ্গীর আলম", "Alam Agro Farms"],
  ["Rownak Jahan Khan", "রওনক জাহান খান", null],
  ["Md. Shahidul Islam", "মোঃ শহিদুল ইসলাম", "Shahidul Electro House"],
  ["Salma Khatun", "সালমা খাতুন", null],
  ["A. K. M. Asaduzzaman", "এ কে এম আসাদুজ্জামান", "Asad Garments Ltd."],
  ["Rehana Parvin", "রেহানা পারভীন", null],
  ["Kamrul Hasan", "কামরুল হাসান", "Hasan Fish Feed & Co."],
  ["Mizanur Rahman", "মিজানুর রহমান", null],
  ["Farhana Yasmin", "ফারহানা ইয়াসমিন", "Yasmin Boutique"],
  ["Habibur Rahman", "হাবিবুর রহমান", "Habib Traders (Partnership)"],
];
const CITIES = ["Dhaka", "Dhaka", "Dhaka", "Narayanganj", "Chattogram", "Sylhet", "Bogura", "Khulna", "Dhaka", "Rajshahi", "Gazipur", "Tangail", "Cox's Bazar", "Mymensingh", "Dhaka", "Jessore"];
const SEGMENTS = ["Salaried", "Self-Employed", "SME Owner", "Salaried", "Corporate SME", "Housewife", "Agri", "Salaried", "Retail Trade", "Salaried", "Corporate SME", "Salaried", "SME Owner", "Salaried", "Micro Retail", "Partnership"];

function seedGen2(seed: string) {
  let x = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { x = Math.imul(x ^ seed.charCodeAt(i), 3432918353); x = (x << 13) | (x >>> 19); }
  return () => {
    x = Math.imul(x ^ (x >>> 16), 2246822507); x = Math.imul(x ^ (x >>> 13), 3266489909);
    x ^= x >>> 16; return (x >>> 0) / 4294967296;
  };
}
const R = seedGen2("ulms-2026");
const ri = (a: number, b: number) => a + Math.floor(R() * (b - a + 1));

export const CUSTOMERS: DemoCustomer[] = C_NAMES.map((cn, i) => {
  const kyc = R() > 0.15 ? "Verified" : R() > 0.5 ? "Pending" : "Refresh Due";
  const cibScore = ri(620, 830);
  return {
    cif: `CIF-${100871 + i}`, en: cn[0], bn: cn[1], firm: cn[2],
    nid: `*********${String(1000 + ri(0, 8999)).slice(-3)}·masked`,
    mobile: `+880 1${pickW(R, [7, 8, 9])}${ri(10000000, 99999999)}`,
    city: CITIES[i], seg: SEGMENTS[i], branch: BRANCHES[i % BRANCHES.length], kyc,
    cibScore, cibGrade: cibScore >= 780 ? "AAA" : cibScore >= 730 ? "AA" : cibScore >= 680 ? "A" : cibScore >= 630 ? "BBB" : "BB",
    risk: pickW(R, ["Low", "Low", "Low", "Medium", "Medium", "High"]),
    since: `20${ri(12, 24)}`, relLoans: ri(0, 3),
  };
});
export const custByCif = (cif: string) => CUSTOMERS.find((c) => c.cif === cif) ?? null;

export const OFFICERS = ["R. Islam (LO)", "F. Akter (LO)", "K. Chowdhury (LO)", "S. Mia (LO)", "T. Rahman (CA)"];

export interface DemoLoan {
  id: string; cust: DemoCustomer; product: (typeof PRODUCTS)[number];
  principal: number; outstanding: number; dpd: number; stage: number; stageKey: string;
  provPct: number; provAmt: number; rate: string; emi: number; overdue: number;
  branch: (typeof BRANCHES)[number]; officer: string; disbursed: string;
  nextDue: string; rail: string; top: boolean;
}
export const LOANS: DemoLoan[] = (() => {
  const out: DemoLoan[] = [];
  const LSTAGES = [0, 0, 0, 1, 2, 3, 4, 5, 6, 0, 1, 3, 2, 0];
  for (let li = 0; li < 26; li++) {
    const st = LSTAGES[li % LSTAGES.length];
    const dpd = st === 0 ? 0 : st === 1 ? ri(2, 28) : st === 2 ? ri(33, 58) : st === 3 ? ri(63, 88)
      : st === 4 ? ri(95, 175) : st === 5 ? ri(190, 350) : ri(370, 640);
    const product = PRODUCTS[li % PRODUCTS.length];
    const cust = CUSTOMERS[li % CUSTOMERS.length];
    const principal = pickW(R, [400000, 800000, 1500000, 2500000, 3500000, 6000000, 12000000, 25000000]);
    const outstanding = Math.round(principal * pickW(R, [0.2, 0.35, 0.5, 0.62, 0.75, 0.88]));
    const emi = Math.round((principal / ri(24, 60)) * 1.25);
    out.push({
      id: `LN-${40118 + li * 7}`, cust, product, principal, outstanding, dpd, stage: st,
      stageKey: BRPD[st].k, provPct: BRPD[st].prov, provAmt: Math.round((outstanding * BRPD[st].prov) / 100),
      rate: product.rate, emi, overdue: dpd > 0 ? Math.round(emi * Math.min(dpd / 30, 6)) : 0,
      branch: cust.branch, officer: OFFICERS[li % OFFICERS.length],
      disbursed: `202${ri(2, 5)}-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}`,
      nextDue: pickW(R, ["2026-10-05", "2026-10-10", "2026-10-15", "2026-10-20", "2026-10-25"]),
      rail: pickW(R, ["CBS A/C", "BEFTN", "bKash", "Nagad", "Cheque"]), top: false,
    });
  }
  out[8].top = true;
  return out;
})();
export const loanById = (id: string) => LOANS.find((l) => l.id === id) ?? null;

export const APP_STAGES = ["Received", "Screening", "CIB Check", "Credit Scoring", "CPV", "BOCC Review", "Approval", "Sanction", "Disbursement Ready"];
export interface DemoApplication {
  id: string; cust: DemoCustomer; product: (typeof PRODUCTS)[number]; amount: number;
  stage: string; stageIdx: number; dbr: number; score: number; tat: number;
  branch: (typeof BRANCHES)[number]; officer: string;
  docs: number; docsDone: number; slaHrs: number; status: string;
}
export const APPLICATIONS: DemoApplication[] = (() => {
  const out: DemoApplication[] = [];
  for (let ai = 0; ai < 18; ai++) {
    const stg = Math.min(APP_STAGES.length - 1, Math.floor(R() * APP_STAGES.length));
    const product = PRODUCTS[(ai + 2) % PRODUCTS.length];
    const cust = CUSTOMERS[(ai + 3) % CUSTOMERS.length];
    out.push({
      id: `APP-${7210 + ai * 3}`, cust, product,
      amount: pickW(R, [300000, 600000, 1200000, 2500000, 4500000, 9000000]),
      stage: APP_STAGES[stg], stageIdx: stg, dbr: ri(28, 62), score: ri(590, 820), tat: ri(0, 9),
      branch: cust.branch, officer: OFFICERS[ai % OFFICERS.length],
      docs: ri(2, 8), docsDone: ri(2, 8), slaHrs: ri(2, 40),
      status: stg === APP_STAGES.length - 1 ? "Ready" : R() > 0.75 ? "SLA Risk" : "On Track",
    });
  }
  return out.sort((a, b) => a.stageIdx - b.stageIdx || b.amount - a.amount);
})();

export const APPROVALS = APPLICATIONS.slice(4, 10).map((app, i) => {
  const L = ["L1 · Branch Credit Head", "L2 · Branch Manager", "L3 · Regional Manager", "L4 · Head of Credit", "L5 · Credit Committee"][i % 5];
  return { app, level: L, waitingHrs: ri(1, 52), slaHrs: L.indexOf("L1") === 0 ? 24 : 48, by: app.officer };
});

export interface DemoCollection {
  loan: DemoLoan; bucket: string; lastAction: string; ptp: string | null;
  propensity: number; agency: string | null; officer: string;
}
const COLL_ACTIONS = ["Call — no response", "Call — promised", "Field visit done", "SMS reminder sent", "Legal notice drafted", "PTP kept", "PTP broken", "Right-party contact"];
export const COLLECTIONS: DemoCollection[] = LOANS.filter((l) => l.dpd > 0).map((loan, i) => ({
  loan,
  bucket: loan.dpd <= 30 ? "1–30" : loan.dpd <= 60 ? "31–60" : loan.dpd <= 90 ? "61–90" : "90+",
  lastAction: COLL_ACTIONS[i % COLL_ACTIONS.length],
  ptp: /promise|PTP/.test(COLL_ACTIONS[i % COLL_ACTIONS.length]) ? `৳${ri(2, 18)}K · Oct ${ri(2, 9)}` : null,
  propensity: ri(15, 92),
  agency: loan.dpd > 180 ? pickW(R, ["RecoveryBD Ltd.", "Metro Collections"]) : null,
  officer: OFFICERS[i % OFFICERS.length],
}));

export const ALERTS = [
  { sev: "err", ico: "🏷", t: "SMA migration spike — Gulshan branch", d: "4 accounts migrated STD-2 → SMA in 24h (DPD 60+). Immediate collection push recommended.", ago: "12m" },
  { sev: "warn", ico: "⏱", t: "Approval SLA breach risk", d: "APP-7239 waiting 46h at L3 · Regional Manager (SLA 48h). Escalation in 2h.", ago: "38m" },
  { sev: "warn", ico: "🛡", t: "CIB gateway latency", d: "Bangladesh Bank CIB API p95 = 168s (threshold 120s). 3 inquiries queued.", ago: "1h" },
  { sev: "err", ico: "🔒", t: "Collateral insurance expired", d: "LN-40143 (Tanvir Sea Foods) — fire policy expired 22 Sep. Renewal notice issued.", ago: "3h" },
  { sev: "info", ico: "🧾", t: "CL-2 provisioning file staged", d: "September provisioning return generated · awaiting Compliance sign-off.", ago: "5h" },
  { sev: "info", ico: "🪪", t: "e-KYC batch verified", d: "38 of 40 NIDW verifications passed this morning (avg 3.2s). 2 flagged for manual review.", ago: "6h" },
];

export const RECORDS: [string, string, string, string][] = [
  ...LOANS.slice(0, 12).map((l) => [l.id, `Loan · ${l.cust.en}`, `${l.stageKey} · ${F.tk(l.outstanding)} outstanding`, `/loan/${l.id}`] as [string, string, string, string]),
  ...CUSTOMERS.slice(0, 12).map((c) => [c.cif, `Customer · ${c.en}`, `${c.firm ? c.firm + " · " : ""}${c.seg} · ${c.city}`, `/cust/${c.cif}`] as [string, string, string, string]),
  ...APPLICATIONS.slice(0, 8).map((a) => [a.id, `Application · ${a.cust.en}`, `${a.stage} · ${F.tk(a.amount)}`, "/pipeline"] as [string, string, string, string]),
];

export const KPIS = {
  portfolio: 5200, nplGross: 4.6, nplNet: 2.1, par30: 6.2, appsMonth: 342,
  tatAvg: 1.9, approvalRate: 71, disbMonth: 412, collEff: 91.4, coverage: 68.5, capRatio: 13.2,
};

/* ---------- generic row synth per area (consistent per screen id) ---------- */
const AREAVOCAB: Record<string, { id: string; t: string; st: string[]; amt: [number, number] }> = {
  A: { id: "CIF-", t: "Customer", st: ["e-KYC Verified", "Pending", "Refresh Due"], amt: [2, 40] },
  B: { id: "APP-", t: "Application", st: ["On Track", "SLA Risk", "Returned", "Approved"], amt: [3, 90] },
  C: { id: "CR-", t: "Assessment", st: ["Cleared", "Exception", "In Progress"], amt: [4, 60] },
  D: { id: "APR-", t: "Approval", st: ["Approved", "Pending", "Rejected", "Escalated"], amt: [4, 95] },
  E: { id: "LN-", t: "Loan account", st: ["Active", "Due Today", "Overdue", "Closed"], amt: [4, 120] },
  F: { id: "COL-", t: "Collection", st: ["PTP Kept", "PTP Broken", "No Response", "Cured"], amt: [1, 25] },
  G: { id: "RPT-", t: "Report", st: ["Scheduled", "On Demand", "Filed"], amt: [0, 0] },
  H: { id: "CFG-", t: "Configuration", st: ["Active", "Draft", "Maker-Checker"], amt: [0, 0] },
};
export interface GenRow {
  id: string; title: string; sub: string; status: string; amt: number;
  date: string; owner: string; branch: string; cust: DemoCustomer;
}
export function genRows(sid: string, n: number): GenRow[] {
  const r = rng(sid);
  const info = AREAVOCAB[sid.charAt(0)] ?? AREAVOCAB.A;
  const out: GenRow[] = [];
  for (let i = 0; i < n; i++) {
    const cust = CUSTOMERS[Math.floor(r() * CUSTOMERS.length)];
    const amt = Math.round((info.amt[0] + r() * (info.amt[1] - info.amt[0])) * 100000);
    out.push({
      id: info.id + (10000 + Math.floor(r() * 89999)),
      title: cust.en + (cust.firm ? ` · ${cust.firm}` : ""),
      sub: `${info.t} · ${cust.seg}`,
      status: info.st[Math.floor(r() * info.st.length)],
      amt: info.amt[1] ? amt : 0,
      date: `2026-${String(1 + Math.floor(r() * 9)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`,
      owner: pickW(r, ["R. Islam", "F. Akter", "K. Chowdhury", "S. Mia", "T. Rahman"]),
      branch: cust.branch.name, cust,
    });
  }
  return out;
}
export function sparkFor(label: string): number[] {
  const r = rng(label);
  const v: number[] = [];
  for (let i = 0; i < 14; i++) v.push(20 + r() * 60);
  return v;
}
