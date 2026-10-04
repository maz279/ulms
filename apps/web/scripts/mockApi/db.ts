/* ============================================================
   ULMS mock API — seeded in-memory database (dev/preview only).
   Mirrors deploy/seed/10-seed.sql + the validated prototype demo
   dataset (Front_end/js/demo_data.js) so the staff app runs the
   full journey without the Java stack. Money = integer minor units.
   ============================================================ */

// ---------- tiny deterministic PRNG (same data every boot) ----------
import { createHash } from "node:crypto";
import { seedR3R4R5 } from "./r3r4r5.ts";

function seedGen(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const R = seedGen("ulms-2026");
const pick = <T,>(a: T[]): T => a[Math.floor(R() * a.length)];
const ri = (a: number, b: number) => a + Math.floor(R() * (b - a + 1));

// ---------- BRPD 15/2024 (single source of truth) ----------
export const BRPD = [
  { k: "STD-0", maxDpd: 0, rateBp: 100 },
  { k: "STD-1", maxDpd: 30, rateBp: 100 },
  { k: "STD-2", maxDpd: 60, rateBp: 100 },
  { k: "SMA", maxDpd: 90, rateBp: 500 },
  { k: "SS", maxDpd: 180, rateBp: 2000 },
  { k: "DF", maxDpd: 365, rateBp: 5000 },
  { k: "B/L", maxDpd: Number.MAX_SAFE_INTEGER, rateBp: 10000 },
];
export function classify(dpd: number): string {
  return (BRPD.find((b) => dpd <= b.maxDpd) ?? BRPD[BRPD.length - 1]).k;
}

export interface Customer {
  id: string; cifNo: string; nameEn: string; nameBn: string | null;
  segment: "RETAIL" | "SME" | "CORPORATE" | "AGRI"; mobile: string;
  branchCode: string; nidMasked?: string; fineractClientId: number | null;
  kycStatus: "VERIFIED" | "PENDING" | "REFRESH_DUE"; createdAt: string;
  city?: string; firm?: string | null; cibScore?: number;
}
export interface Loan {
  id: string; loanNo: string; customerId: string; principalMinor: number;
  outstandingMinor: number; dpd: number; classification: string;
  interestSuspense: boolean; tenorMonths: number; interestRateBp: number;
  disbursedAt: string; productCode: string; branchCode: string; officer: string;
  closed?: boolean; emiMinor?: number;
}
export interface AppWorkflowTask {
  taskId: string; appId: string; node: string; role: string;
  phase: "ACTION" | "CHECK"; status: "OPEN" | "DONE"; slaDeadline: string | null;
  assigneeUser?: string | null;
}
export interface ApprovalConditionRow {
  id: string; appId: string; node: string; conditionText: string;
  status: "PENDING" | "SATISFIED" | "WAIVED";
  createdBy: string; createdAt: string;
  resolvedBy: string | null; resolvedAt: string | null;
}
export interface Application {
  id: string; appNo: string; customerId: string; productCode: string;
  amountMinor: number; tenorMonths: number; rateType: "FIXED" | "FLOATING";
  stage: string; dbrPercent: number | null; incomeMinor: number | null;
  existingEmiMinor: number | null; cibObligationMinor: number | null;
  fineractLoanId: number | null; branchCode: string; createdAt: string;
  version: number; workflowNode: string | null; workflowPhase: string | null;
  workflowSla: string | null; score: number | null; grade: string | null;
}
export interface Payment {
  id: string; loanId: string; amountMinor: number; externalRef: string;
  rail: string; utr: string | null; fineractTxnId: number | null; paidAt: string;
}
export interface Ptp {
  id: string; loanId: string; promisedAmountMinor: number; promisedOn: string;
  confidence: string; contactName: string | null; contactRelation: string | null;
  contactPhoneMasked: string | null; remark: string | null; dpdAtPromise: number;
  classificationAtPromise: string; kept: "OPEN" | "KEPT" | "BROKEN";
}
export interface FieldTask {
  id: string; loanId: string; assignedTo: string; dueOn: string;
  status: "OPEN" | "DONE"; evidence: string | null;
  lat?: number | null; lng?: number | null; loanNo?: string;
}
export interface FieldVisitRow {
  id: string; clientUuid: string; taskId: string | null; loanId: string | null;
  officer: string; outcome: string; evidence: unknown; applied: boolean; appliedAt: string;
}
export interface SosAlertRow {
  id: string; officer: string; loanId: string | null; lat: number | null; lng: number | null;
  note: string | null; status: "OPEN" | "ACKNOWLEDGED"; createdAt: string;
}
export interface CollAction {
  id: string; loanId: string; actionType: string; outcome: string;
  notes: string | null; dueOn: string | null; actor: string; actedAt: string;
}
export interface KycCheck {
  id: string; customerId: string; checkedAt: string; method: string; status: string;
}
export interface Disbursement {
  id: string; applicationId: string; amountMinor: number; state: string;
  preparedBy: string; authorizedBy: string | null; fineractTxnId: number | null;
  trail: { action: string; actor: string; actedAt: string }[];
}
export interface ReturnEntry {
  returnId: string | null; code: string; description: string; frequency: string;
  nextDue: string | null; latestPeriod: string | null; status: string; rowCount: number;
  fileSha256: string | null; fileFormat: string | null; storageKey: string | null;
  preparer: string | null; checker: string | null; complianceOfficer: string | null;
  submittedAt: string | null;
}
export interface AuditEntry {
  at: string; actor: string; action: string; object: string; detail: string;
}

export const BRANCHES = [
  { code: "BR-001", name: "Gulshan" }, { code: "BR-002", name: "Dhanmondi" },
  { code: "BR-003", name: "Motijheel" }, { code: "BR-004", name: "Uttara" },
  { code: "BR-005", name: "Chattogram" }, { code: "BR-006", name: "Sylhet" },
  { code: "BR-007", name: "Khulna" }, { code: "BR-008", name: "Rajshahi" },
  { code: "BR-009", name: "Bogura" }, { code: "BR-010", name: "Narayanganj" },
];
export const PRODUCTS: Record<string, { name: string; rateBp: number }> = {
  "sme-term": { name: "SME Term Loan", rateBp: 1300 },
  "retail-personal": { name: "Personal Loan", rateBp: 1199 },
  krishi: { name: "Krishi (agri) Loan", rateBp: 800 },
  "islamic-murabaha": { name: "Islamic Murabaha", rateBp: 1200 },
  "retail-home": { name: "Home Loan", rateBp: 950 },
  "retail-auto": { name: "Auto Loan", rateBp: 1250 },
};

// ---------- customers: the 5 SQL-seed anchors + 11 demo ----------
const SEED_CUSTOMERS: [string, string, string | null, Customer["segment"], string, string, Customer["kycStatus"]][] = [
  ["Md. Rafiqul Islam", "মোঃ রফিকুল ইসলাম", "Rashida Traders (Sole Prop.)", "SME", "+8801712345678", "BR-001", "VERIFIED"],
  ["Nusrat Jahan", "নুসরাত জাহান", null, "RETAIL", "+8801812345678", "BR-001", "VERIFIED"],
  ["Salma Khatun", "সালমা খাতুন", null, "RETAIL", "+8801912345678", "BR-004", "PENDING"],
  ["Habibur Rahman", "হাবিবুর রহমান", "Habib Traders (Partnership)", "AGRI", "+8801612345678", "BR-009", "PENDING"],
  ["S. M. Tanvir Ahmed", "এস এম তানভির আহমেদ", "Tanvir Sea Foods Ltd.", "CORPORATE", "+8801512345678", "BR-003", "VERIFIED"],
];
const DEMO_CUSTOMERS: [string, string, string | null][] = [
  ["Abdul Karim", "আব্দুল করিম", "Karim Auto Workshop"],
  ["Fatima Begum", "ফাতেমা বেগম", null],
  ["Shirin Akter", "শিরিন আক্তার", null],
  ["Jahangir Alam", "জাহাঙ্গীর আলম", "Alam Agro Farms"],
  ["Rownak Jahan Khan", "রওনক জাহান খান", null],
  ["Md. Shahidul Islam", "মোঃ শহিদুল ইসলাম", "Shahidul Electro House"],
  ["A. K. M. Asaduzzaman", "এ কে এম আসাদুজ্জামান", "Asad Garments Ltd."],
  ["Rehana Parvin", "রেহানা পারভীন", null],
  ["Kamrul Hasan", "কামরুল হাসান", "Hasan Fish Feed & Co."],
  ["Mizanur Rahman", "মিজানুর রহমান", null],
  ["Farhana Yasmin", "ফারহানা ইয়াসমিন", "Yasmin Boutique"],
];
const DEMO_SEGMENTS: Customer["segment"][] = ["SME", "RETAIL", "RETAIL", "AGRI", "RETAIL", "SME", "CORPORATE", "RETAIL", "SME", "RETAIL", "SME"];

const now = () => new Date().toISOString();

export const db = {
  customers: [] as Customer[],
  loans: [] as Loan[],
  applications: [] as Application[],
  tasks: [] as AppWorkflowTask[],
  conditions: [] as ApprovalConditionRow[],
  watchlist: [] as any[],
  auctions: [] as any[],
  payments: [] as Payment[],
  ptps: [] as Ptp[],
  fieldTasks: [] as FieldTask[],
  fieldVisits: [] as FieldVisitRow[],
  sosAlerts: [] as SosAlertRow[],
  collActions: [] as CollAction[],
  kycChecks: [] as KycCheck[],
  screeningHits: [] as { id: string; customerId: string; list: string; hit: boolean; checkedAt: string }[],
  disbursements: [] as Disbursement[],
  cibPulls: [] as { id: string; cif: string; status: string; period: string; pulledAt: string; facilities: any[]; pulls: any[] }[],
  documents: [] as { id: string; appId: string; docType: string; sha256: string; sizeBytes: number; scanStatus: "PENDING" | "CLEAN" | "INFECTED" }[],
  eodRuns: [] as { runDate: string; loansClassified: number; totalOutstandingMinor: number; totalProvisionMinor: number; detail: string; provisionsByClass: Record<string, number> }[],
  provisionJvs: [] as { runDate: string; totalMinor: number }[],
  returns: [] as ReturnEntry[],
  reportDefs: [] as { id: string; name: string; domain: string; groupBy: string; schedule: string; createdBy: string; createdAt: string }[],
  loanFees: [] as { id: string; loanId: string; code: string; amountMinor: number; waived: boolean; chargedAt: string }[],
  legalCases: [] as { id: string; loanId: string; caseNo: string; court: string | null; filedOn: string | null; status: string; claimMinor: number; lawyer: string | null }[],
  // ---- R3/R4/R5 stores (seeded/reset via r3r4r5.seedR3R4R5) ----
  products: [] as any[],
  sanctions: [] as any[],
  boccMeetings: [] as any[],
  outbox: [] as any[],
  writeOffs: [] as any[],
  recoveries: [] as any[],
  guarantors: [] as any[],
  notifTemplates: [] as any[],
  notifDeliveries: [] as any[],
  strReports: [] as any[],
  portalDocs: [] as any[],
  audit: [] as AuditEntry[],
  seq: { cif: 100887, app: 13, task: 3, pay: 5, ptp: 3, ft: 1, act: 1, disb: 1, cib: 1, doc: 1, kyc: 6, ret: 12, cond: 1, wl: 1, auc: 1, rec: 1, fv: 1, sos: 1 },
};

export const LADDER = [
  { level: 1, roleKey: "BRANCH_CREDIT_HEAD", roleNameEn: "Branch Credit Head", minMinor: 0, maxMinor: 50000000 },
  { level: 2, roleKey: "BRANCH_MANAGER", roleNameEn: "Branch Manager", minMinor: 50000000, maxMinor: 100000000 },
  { level: 3, roleKey: "REGIONAL_MANAGER", roleNameEn: "Regional Manager", minMinor: 100000000, maxMinor: 250000000 },
  { level: 4, roleKey: "HEAD_OF_CREDIT", roleNameEn: "Head of Credit", minMinor: 250000000, maxMinor: 1000000000 },
  { level: 5, roleKey: "CREDIT_COMMITTEE", roleNameEn: "Credit Committee", minMinor: 1000000000, maxMinor: 5000000000 },
  { level: 6, roleKey: "DEPUTY_MD", roleNameEn: "Deputy MD", minMinor: 5000000000, maxMinor: 10000000000 },
  { level: 7, roleKey: "MANAGING_MD", roleNameEn: "Managing MD", minMinor: 10000000000, maxMinor: null },
];

function seed() {
  // customers
  SEED_CUSTOMERS.forEach(([en, bn, firm, segment, mobile, branch, kyc], i) => {
    db.customers.push({
      id: `c-${i + 1}`, cifNo: `CIF-${100871 + i}`, nameEn: en, nameBn: bn,
      segment, mobile, branchCode: branch, nidMasked: "19" + "•".repeat(8) + String(1000 + i),
      fineractClientId: 1001 + i, kycStatus: kyc, createdAt: `2026-0${1 + (i % 9)}-1${i}T09:00:00Z`,
      city: ["Dhaka", "Dhaka", "Dhaka", "Bogura", "Chattogram"][i], firm,
      cibScore: [781, 705, 648, 662, 794][i],
    });
    if (kyc === "VERIFIED") db.kycChecks.push({ id: `k-${db.seq.kyc++}`, customerId: `c-${i + 1}`, checkedAt: "2026-09-01T10:00:00Z", method: "NIDW_BIOMETRIC", status: "VERIFIED" });
  });
  DEMO_CUSTOMERS.forEach(([en, bn, firm], i) => {
    const seg = DEMO_SEGMENTS[i];
    db.customers.push({
      id: `c-${6 + i}`, cifNo: `CIF-${100876 + i}`, nameEn: en, nameBn: bn,
      segment: seg, mobile: `+8801711${String(2000000 + i * 137).slice(0, 7)}`,
      branchCode: BRANCHES[(i + 5) % BRANCHES.length].code,
      nidMasked: "19" + "•".repeat(8) + String(2000 + i), fineractClientId: 2001 + i,
      kycStatus: R() > 0.2 ? "VERIFIED" : "PENDING", createdAt: `2026-0${1 + (i % 9)}-0${1 + (i % 9)}T09:00:00Z`,
      city: pick(["Dhaka", "Sylhet", "Khulna", "Rajshahi", "Gazipur"]), firm,
      cibScore: ri(620, 830),
    });
  });

  // loans — 7 SQL-seed anchors covering every BRPD class …
  const SEED_LOANS: [string, string, number, number][] = [
    ["LN-300001", "CIF-100871", 400000000, 0],     // STD-0
    ["LN-300002", "CIF-100872", 250000000, 22],    // STD-1
    ["LN-300003", "CIF-100873", 180000000, 47],    // STD-2
    ["LN-300004", "CIF-100874", 320000000, 78],    // SMA
    ["LN-300005", "CIF-100875", 850000000, 140],   // SS (interest suspense)
    ["LN-300006", "CIF-100871", 600000000, 240],   // DF
    ["LN-300007", "CIF-100872", 500000000, 410],   // B/L
  ];
  SEED_LOANS.forEach(([loanNo, cif, principalMinor, dpd], i) => {
    const cust = db.customers.find((c) => c.cifNo === cif)!;
    const cls = classify(dpd);
    const outstanding = Math.round(principalMinor * [0.62, 0.75, 0.5, 0.88, 0.4, 0.35, 0.3][i]);
    db.loans.push({
      id: `l-${i + 1}`, loanNo, customerId: cust.id, principalMinor, outstandingMinor: outstanding,
      dpd, classification: cls, interestSuspense: cls === "SS" || cls === "DF" || cls === "B/L",
      tenorMonths: 60, interestRateBp: 1199, disbursedAt: `2024-0${1 + (i % 9)}-05T00:00:00Z`,
      productCode: pick(Object.keys(PRODUCTS)), branchCode: cust.branchCode,
      officer: pick(["R. Islam (LO)", "F. Akter (LO)", "K. Chowdhury (LO)", "S. Mia (LO)", "T. Rahman (CA)"]),
    });
  });
  // … plus the prototype demo portfolio (LN-40118 line)
  const LSTAGES = [0, 0, 0, 1, 2, 3, 4, 5, 6, 0, 1, 3, 2, 0];
  for (let i = 0; i < 26; i++) {
    const st = LSTAGES[i % LSTAGES.length];
    const dpd = st === 0 ? 0 : st === 1 ? ri(2, 28) : st === 2 ? ri(33, 58) : st === 3 ? ri(63, 88)
      : st === 4 ? ri(95, 175) : st === 5 ? ri(190, 350) : ri(370, 640);
    const cust = db.customers[(5 + i) % db.customers.length];
    const principal = pick([40000000, 80000000, 150000000, 250000000, 350000000, 600000000, 1200000000, 2500000000]);
    const outstanding = Math.round(principal * pick([0.2, 0.35, 0.5, 0.62, 0.75, 0.88]));
    const cls = classify(dpd);
    const tenor = ri(24, 60);
    db.loans.push({
      id: `l-${8 + i}`, loanNo: `LN-${40118 + i * 7}`, customerId: cust.id,
      principalMinor: principal, outstandingMinor: outstanding, dpd,
      classification: cls, interestSuspense: cls === "SS" || cls === "DF" || cls === "B/L",
      tenorMonths: tenor, interestRateBp: 1199,
      disbursedAt: `202${ri(2, 5)}-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}T00:00:00Z`,
      productCode: pick(Object.keys(PRODUCTS)), branchCode: cust.branchCode,
      officer: pick(["R. Islam (LO)", "F. Akter (LO)", "K. Chowdhury (LO)", "S. Mia (LO)", "T. Rahman (CA)"]),
    });
  }

  // demo applications across the 9-stage pipeline
  const STAGES = ["SCREENING", "CIB_CHECK", "SCORING", "CPV", "BOCC_REVIEW", "APPROVAL", "SANCTION", "DISBURSEMENT", "DISBURSED"];
  for (let i = 0; i < 12; i++) {
    // keep a live approvals inbox + disbursement queue in every boot:
    // apps 6/9 wait on the ladder, app 8 is SANCTIONed (ready for dual-auth payout)
    const stg = i === 6 || i === 9 ? "APPROVAL" : i === 8 ? "SANCTION"
      : STAGES[Math.min(STAGES.length - 1, Math.floor(R() * STAGES.length))];
    const cust = db.customers[(i + 3) % db.customers.length];
    db.applications.push({
      id: `a-${db.seq.app++}`, appNo: `APP-${7210 + i * 3}`, customerId: cust.id,
      productCode: pick(Object.keys(PRODUCTS)),
      amountMinor: i === 6 ? 90000000 : i === 8 ? 450000000 : pick([30000000, 60000000, 120000000, 250000000, 450000000, 900000000]),
      tenorMonths: ri(12, 60), rateType: "FIXED", stage: stg,
      dbrPercent: ri(28, 48), incomeMinor: ri(8000000, 40000000),
      existingEmiMinor: ri(1000000, 8000000), cibObligationMinor: 8800000,
      fineractLoanId: null, branchCode: cust.branchCode,
      createdAt: `2026-09-${String(10 + i).padStart(2, "0")}T09:00:00Z`,
      version: 1, workflowNode: stg === "APPROVAL" ? "L2" : null, workflowPhase: null, workflowSla: null,
      score: ri(590, 820), grade: null,
    });
    if (stg === "APPROVAL") {
      const lvl = LADDER.find((l) => (i === 6 ? 90000000 : 450000000) <= (l.maxMinor ?? Infinity))!;
      db.tasks.push({
        taskId: `t-${db.seq.task++}`, appId: `a-${db.seq.app - 1}`, node: `L${lvl.level}`,
        role: lvl.roleKey, phase: "ACTION", status: "OPEN",
        slaDeadline: new Date(Date.now() + 46 * 3600e3).toISOString(),
      });
    }
  }

  // payments history for the flagship demo loan
  const demoLoan = db.loans.find((l) => l.loanNo === "LN-40118")!;
  demoLoan.emiMinor = Math.round(demoLoan.principalMinor * 0.025);
  for (let m = 0; m < 4; m++) {
    db.payments.push({
      id: `p-${db.seq.pay++}`, loanId: demoLoan.id, amountMinor: demoLoan.emiMinor!,
      externalRef: `CBS-${7000 + m}`, rail: pick(["COUNTER", "BEFTN", "BKASH"]),
      utr: null, fineractTxnId: 9000 + m, paidAt: `2026-0${9 - m}-05T10:00:00Z`,
    });
  }

  // seeded open PTP on a 61–90 account (prototype PTP board)
  const sma = db.loans.find((l) => l.loanNo === "LN-300004")!;
  db.ptps.push({
    id: `ptp-${db.seq.ptp++}`, loanId: sma.id, promisedAmountMinor: 1200000,
    promisedOn: "2026-10-05", confidence: "MEDIUM", contactName: "Borrower",
    contactRelation: "SELF", contactPhoneMasked: "+880 17•• •••567",
    remark: "Salary credit on 04th", dpdAtPromise: sma.dpd,
    classificationAtPromise: sma.classification, kept: "OPEN",
  });
  // a broken promise to drive P1 priority in the worklist
  const bl = db.loans.find((l) => l.loanNo === "LN-300007")!;
  db.ptps.push({
    id: `ptp-${db.seq.ptp++}`, loanId: bl.id, promisedAmountMinor: 2000000,
    promisedOn: "2026-09-20", confidence: "LOW", contactName: null,
    contactRelation: null, contactPhoneMasked: null, remark: null,
    dpdAtPromise: 380, classificationAtPromise: "B/L", kept: "BROKEN",
  });

  // regulatory returns board — statuses are the page's human vocabulary:
  // Filed | In sign-off | Staged | Live | Not started. returnId=null ⇒ not generated.
  const RETS: [string, string, string, string | null, string, string | null, string | null, string | null][] = [
    ["CL-1", "Classified loan details", "MONTHLY", "2026-10-10", "Filed", "2026-08", "f.akter", "k.chowdhury"],
    ["CL-2", "Provisioning details", "MONTHLY", "2026-10-10", "In sign-off", "2026-09", "f.akter", null],
    ["CL-3", "Recovery position", "MONTHLY", "2026-10-10", "Filed", "2026-08", "f.akter", "k.chowdhury"],
    ["CL-4", "Write-off details", "MONTHLY", "2026-10-10", "Filed", "2026-08", "f.akter", "k.chowdhury"],
    ["CL-5", "Restructured loans", "MONTHLY", "2026-10-10", "Filed", "2026-08", "f.akter", "k.chowdhury"],
    ["CIB-S", "CIB subject file (fixed-width)", "MONTHLY", "2026-11-05", "Not started", null, null, null],
    ["CIB-C", "CIB contract file (fixed-width)", "MONTHLY", "2026-11-05", "Not started", null, null, null],
    ["CIB-R", "CIB real-time (event-driven API)", "CONTINUOUS", null, "Live", null, null, null],
    ["CAR", "Basel III capital adequacy return", "QUARTERLY", "2027-01-15", "Not started", null, null, null],
    ["EDW", "EDW submission", "MONTHLY", "2026-10-12", "Staged", "2026-09", null, null],
    ["ECL", "IFRS-9 ECL statement", "PERIODIC", "2026-12-31", "Not started", null, null, null],
    ["LLF", "Large loan forecast", "QUARTERLY", "2027-01-20", "Not started", null, null, null],
  ];
  RETS.forEach(([code, description, freq, due, status, period, checker, compliance]) => {
    const generated = status === "Filed" || status === "In sign-off" || status === "Staged";
    db.returns.push({
      returnId: generated ? `r-${db.seq.ret++}` : null, code, description, frequency: freq,
      nextDue: due, latestPeriod: period, status,
      rowCount: generated ? 214 : 0,
      fileSha256: generated ? createHash("sha256").update(`${code}:${period ?? ""}`).digest("hex") : null,
      fileFormat: null, storageKey: generated ? `worm/returns/${code}/${period ?? ""}/seed` : null,
      preparer: generated ? "system" : null, checker, complianceOfficer: compliance,
      submittedAt: status === "Filed" ? "2026-09-10T04:00:00Z" : null,
    });
  });
}
function resetDb() {
  const fresh = {
    customers: [], loans: [], applications: [], tasks: [], conditions: [], watchlist: [], auctions: [], fieldVisits: [], sosAlerts: [], payments: [], ptps: [],
    fieldTasks: [], collActions: [], kycChecks: [], screeningHits: [], disbursements: [],
    cibPulls: [], documents: [], eodRuns: [], provisionJvs: [], returns: [], reportDefs: [],
    loanFees: [], legalCases: [], audit: [],
    products: [], sanctions: [], boccMeetings: [], outbox: [], writeOffs: [],
    recoveries: [], guarantors: [], notifTemplates: [], notifDeliveries: [],
    strReports: [], portalDocs: [],
  };
  Object.assign(db, fresh);
  db.seq = { cif: 100887, app: 13, task: 3, pay: 5, ptp: 3, ft: 1, act: 1, disb: 1, cib: 1, doc: 1, kyc: 6, ret: 12, cond: 1, wl: 1, auc: 1, rec: 1, fv: 1, sos: 1 };
  seed();
  seedR3R4R5();
}
export { resetDb };

seed();
seedR3R4R5();

// ---------- helpers ----------
export function audit(actor: string, action: string, object: string, detail: string) {
  db.audit.unshift({ at: now(), actor, action, object, detail });
  if (db.audit.length > 500) db.audit.length = 500;
}
export function customerViewById(c: Customer) {
  return {
    id: c.id, cifNo: c.cifNo, name: { en: c.nameEn, bn: c.nameBn },
    nameEn: c.nameEn, nameBn: c.nameBn, nidMasked: c.nidMasked,
    segment: c.segment, mobile: c.mobile, branchCode: c.branchCode,
    fineractClientId: c.fineractClientId, kycStatus: c.kycStatus, createdAt: c.createdAt,
  };
}
export function loanView(l: Loan) {
  return {
    id: l.id, loanNo: l.loanNo, customerId: l.customerId,
    principalMinor: l.principalMinor, outstandingMinor: l.outstandingMinor,
    dpd: l.dpd, stage: l.classification, classification: l.classification,
    interestSuspense: l.interestSuspense, tenorMonths: l.tenorMonths,
    interestRateBp: l.interestRateBp, disbursedAt: l.disbursedAt,
  };
}
export function applicationView(a: Application) {
  return { ...a };
}
export function emiMonthly(principalMinor: number, months: number, annualRate: number): number {
  const i = annualRate / 12;
  const pow = Math.pow(1 + i, months);
  return Math.round((principalMinor * i * pow) / (pow - 1));
}
export function provisionFor(l: Loan): number {
  const b = BRPD.find((x) => x.k === l.classification) ?? BRPD[0];
  return Math.round((l.outstandingMinor * b.rateBp) / 10000);
}
export function ladderLevelFor(amountMinor: number) {
  return LADDER.find((l) => amountMinor <= (l.maxMinor ?? Infinity)) ?? LADDER[LADDER.length - 1];
}
/** CIB bureau obligation for a customer — the G2 fixture: ৳88,000/mo. */
export function cibObligationFor(_cif: string): number {
  return 8800000;
}
export function maskPhone(phone: string): string {
  if (phone.length < 6) return "•••";
  return phone.slice(0, 7) + "•••" + phone.slice(-3);
}
