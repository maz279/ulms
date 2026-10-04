/* ============================================================
   ULMS mock API — Vite dev/preview middleware (local only).
   Answers the OpenAPI contract (packages/openapi/ulms-api.yaml) from
   the seeded in-memory DB so the staff app is fully exercisable
   without the Java stack. Enabled unless VITE_USE_MOCK_API=0 (then
   vite.config.ts proxies /api to the compose stack).
   The router below is a PURE function over plain request data
   (method/path/query/body/headers) returning a plain response —
   the thin connect wrapper owns all socket I/O. No outbound
   connections are ever made.
   ============================================================ */
import type { Plugin } from "vite";
import { createHash, createHmac } from "node:crypto";
import { routeR3R4R5, seedR3R4R5, outboxEmit } from "./r3r4r5.ts";
import {
  db, audit, resetDb, customerViewById, loanView, applicationView, emiMonthly, provisionFor,
  BRPD, classify, LADDER, ladderLevelFor, cibObligationFor, maskPhone,
  type Loan, type Customer,
} from "./db.ts";

const RAIL_SECRET = process.env.MOCK_RAIL_SECRET ?? "ulms-dev-rail-secret";

/** Plain request data — extracted once by the wrapper, never a socket here. */
export interface MockRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  actor: string;
  roles?: string[];
}
/** Plain response — serialized by the wrapper. */
export interface MockResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

function problem(status: number, code: string, detail: string) {
  const titles: Record<number, string> = {
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    409: "Conflict", 422: "Unprocessable Entity", 501: "Not Implemented", 503: "Service Unavailable",
  };
  return { status, code, detail, title: titles[status] ?? "Error", type: `https://docs.ulms.local/errors#${code.toLowerCase()}` };
}
export const ok = (body: any, headers?: Record<string, string>): MockResponse => ({ status: 200, body, headers });
export const created = (body: any): MockResponse => ({ status: 201, body });
export const err = (status: number, code: string, detail: string): MockResponse => ({ status, body: problem(status, code, detail) });

const seqRef = { n: 0 };
function nextRef(): number { return (++seqRef.n * 7919) % 100000; }

// ---------- shared domain logic ----------
function scheduleFor(l: Loan) {
  const rate = l.interestRateBp / 10000;
  const emi = emiMonthly(l.principalMinor, l.tenorMonths, rate);
  let bal = l.principalMinor;
  const start = new Date(l.disbursedAt);
  const rows = [];
  for (let n = 1; n <= l.tenorMonths; n++) {
    const interest = Math.round((bal * rate) / 12);
    let principal = emi - interest;
    if (n === l.tenorMonths || principal > bal) principal = bal;
    bal = Math.max(0, bal - principal);
    const due = new Date(start);
    due.setMonth(due.getMonth() + n);
    rows.push({
      no: n, dueDate: due.toISOString().slice(0, 10), emiMinor: principal + interest,
      principalMinor: principal, interestMinor: interest, balanceAfterMinor: bal,
    });
  }
  return rows;
}
function ptpView(p: any) {
  return {
    id: p.id, loanId: p.loanId, promisedAmountMinor: p.promisedAmountMinor,
    promisedOn: p.promisedOn, confidence: p.confidence, contactName: p.contactName,
    contactRelation: p.contactRelation, contactPhoneMasked: p.contactPhoneMasked,
    remark: p.remark, dpdAtPromise: p.dpdAtPromise,
    classificationAtPromise: p.classificationAtPromise, kept: p.kept,
  };
}
function worklistRow(l: Loan) {
  const broken = db.ptps.some((pt) => pt.loanId === l.id && pt.kept === "BROKEN");
  const priority = l.dpd > 90 || broken ? "P1" : l.dpd > 60 ? "P2" : "P3";
  return {
    loanId: l.id, loanNo: l.loanNo, customerId: l.customerId, dpd: l.dpd,
    classification: l.classification, outstandingMinor: l.outstandingMinor,
    priority, hasBrokenPtp: broken,
  };
}
function scoreOf(a: any): { score: number; grade: string; decision: string } {
  const income = (a.incomeMinor ?? 0) / 100;
  const bureau = (a.cibObligationMinor ?? 0) / 100;
  const emi = emiMonthly(a.amountMinor, a.tenorMonths, 0.1199) / 100;
  const existing = (a.existingEmiMinor ?? 0) / 100;
  const dbr = income > 0 ? ((existing + bureau + emi) / income) * 100 : Infinity;
  const base = 620 + Math.min(180, Math.round(income / 2000));
  const score = Math.max(300, Math.min(850, base - (dbr > 50 ? 120 : dbr > 40 ? 40 : 0)));
  const grade = score >= 780 ? "AAA" : score >= 730 ? "AA" : score >= 680 ? "A" : score >= 630 ? "BBB" : score >= 580 ? "BB" : "D";
  const decision = dbr > 50 ? "AUTO_DECLINE" : score >= 680 ? "AUTO_PASS" : "REFER";
  return { score, grade, decision };
}
function dbrOf(a: any): number | null {
  const income = a.incomeMinor;
  if (!income) return null;
  const emi = emiMonthly(a.amountMinor, a.tenorMonths, 0.1199);
  return Math.round((((a.existingEmiMinor ?? 0) + (a.cibObligationMinor ?? 0) + emi) / income) * 1000) / 10;
}

// ---------- the pure router ----------
export function routeMock(r: MockRequest): MockResponse {
  // R3/R4/R5 module first (products, sanctions, BOCC, outbox, write-offs,
  // recoveries, guarantors, notifications, AML/STR, portal-apply, partner)
  const r345 = routeR3R4R5(r);
  if (r345) return r345;
  const method = r.method.toUpperCase();
  const p = (r.path.replace(/^\/(api\/v1|v1)/, "").replace(/\/+$/, "")) || "/";
  const q = (k: string) => r.query[k];
  const body = r.body;
  const actor = r.actor || "r.islam";
  const seg = p.split("/").filter(Boolean);
  const loanBy = (key: string | undefined) => db.loans.find((x) => key && (x.id === key || x.loanNo === key));
  const custBy = (key: string | undefined) => db.customers.find((x) => key && (x.id === key || x.cifNo === key));

  // ---- platform ----
  if (p === "/actuator/health" && method === "GET") return ok({ status: "UP" });

  // ---- customers ----
  if (p === "/customers" && method === "GET") {
    const page = +(q("page") ?? 1), size = +(q("size") ?? 25);
    const data = db.customers.map(customerViewById);
    return ok({ data: data.slice((page - 1) * size, page * size), meta: { page, size, totalElements: data.length } });
  }
  if (p === "/customers" && method === "POST") {
    const b = body as any;
    const errs: string[] = [];
    if (!b?.nameEn || !String(b.nameEn).trim()) errs.push("nameEn must not be blank");
    if (!/^\+8801\d{9}$/.test(String(b?.mobile ?? ""))) errs.push("mobile must be a valid BD number (+8801XXXXXXXXX)");
    if (!["RETAIL", "SME", "CORPORATE", "AGRI"].includes(b?.segment)) errs.push("segment must be RETAIL|SME|CORPORATE|AGRI");
    if (!/^BR-\d{3}$/.test(String(b?.branchCode ?? ""))) errs.push("branchCode must match BR-###");
    if (errs.length) return err(422, "ULMS-VALIDATION-0001", errs.join("; "));
    if (db.customers.some((c) => c.mobile === b.mobile))
      return err(422, "ULMS-DUPLICATE-MOBILE", "Fineract rejects duplicate mobileNo globally");
    const c: Customer = {
      id: `c-${db.customers.length + 1}`, cifNo: `CIF-${db.seq.cif++}`,
      nameEn: b.nameEn, nameBn: b.nameBn ?? null, segment: b.segment,
      mobile: b.mobile, branchCode: b.branchCode, nidMasked: "1990••••••1234",
      fineractClientId: 5000 + db.customers.length, kycStatus: "PENDING",
      createdAt: new Date().toISOString(),
    };
    db.customers.push(c);
    audit(actor, "CREATE", c.cifNo, `customer ${c.nameEn} created`);
    return ok(customerViewById(c));
  }
  if (seg[0] === "customers" && seg[1] && !seg[2] && method === "GET") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", `customer ${seg[1]} not found`);
    return ok({
      id: c.id, cifNo: c.cifNo, customer: customerViewById(c),
      applications: db.applications.filter((a) => a.customerId === c.id).map(applicationView),
      kycChecks: db.kycChecks.filter((k) => k.customerId === c.id),
      screeningHits: db.screeningHits.filter((s) => s.customerId === c.id),
    });
  }
  if (seg[0] === "customers" && seg[2] === "kyc-refresh" && method === "POST") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "customer not found");
    if (!/^\d{10,17}$/.test(String(body?.nid ?? ""))) return err(422, "ULMS-VALIDATION-0001", "nid must be 10–17 digits");
    c.kycStatus = "VERIFIED";
    db.kycChecks.push({ id: `k-${db.seq.kyc++}`, customerId: c.id, checkedAt: new Date().toISOString(), method: "NIDW_BIOMETRIC", status: "VERIFIED" });
    audit(actor, "VERIFY", c.cifNo, "e-KYC verified via NIDW mock");
    return ok(customerViewById(c));
  }
  if (seg[0] === "customers" && seg[2] === "screen" && method === "POST") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "customer not found");
    db.screeningHits.push({ id: `s-${db.screeningHits.length + 1}`, customerId: c.id, list: "UN/PEP/OFAC", hit: false, checkedAt: new Date().toISOString() });
    audit(actor, "SCREEN", c.cifNo, "sanctions/PEP screening CLEAR (mock)");
    return ok({ customerId: c.id, clear: true, hits: [] });
  }

  // ---- applications ----
  if (p === "/applications" && method === "GET") {
    let rows = [...db.applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (q("stage")) rows = rows.filter((a) => a.stage === q("stage"));
    if (q("officer")) rows = rows.filter((a) => a.officer === q("officer"));
    return ok({ data: rows.map(applicationView), meta: { page: 1, size: rows.length, totalElements: rows.length } });
  }
  if (p === "/applications" && method === "POST") {
    const b = body as any;
    const cust = db.customers.find((c) => c.id === b?.customerId);
    if (!cust) return err(422, "ULMS-VALIDATION-0001", "customerId must reference an existing customer");
    if (!(b.amountMinor > 0) || !(b.tenorMonths > 0)) return err(422, "ULMS-VALIDATION-0001", "amountMinor and tenorMonths must be positive");
    const a = {
      id: `a-${db.seq.app++}`, appNo: `APP-${7300 + db.seq.app}`, customerId: b.customerId,
      productCode: b.productCode ?? "retail-personal", amountMinor: b.amountMinor,
      tenorMonths: b.tenorMonths, rateType: b.rateType ?? "FIXED", stage: "SCREENING",
      dbrPercent: null, incomeMinor: b.incomeMinor ?? null,
      existingEmiMinor: b.existingEmiMinor ?? null, cibObligationMinor: null,
      fineractLoanId: null, branchCode: b.branchCode ?? cust.branchCode,
      createdAt: new Date().toISOString(), version: 1,
      workflowNode: null, workflowPhase: null, workflowSla: null, score: null, grade: null,
    };
    db.applications.push(a);
    audit(actor, "CREATE", a.appNo, `draft ${a.amountMinor / 100} ৳ / ${a.tenorMonths}m`);
    return ok(applicationView(a));
  }
    if (seg[0] === "applications" && seg[1] && !seg[2] && method === "GET") {
    const app = db.applications.find((x) => x.id === seg[1]);
    if (!app) return err(404, "ULMS-NOT-FOUND", "application not found");
    const task = db.tasks.find((x) => x.appId === app.id && x.status === "OPEN");
    return ok({ ...applicationView(app),
      workflowNode: task ? task.node : app.workflowNode,
      workflowPhase: task ? task.phase : app.workflowPhase,
      workflowSla: task?.slaDeadline ?? app.workflowSla });
  }
if (seg[0] === "applications" && seg[1] && !seg[2] && method === "PATCH") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    if (a.stage !== "SCREENING") return err(409, "ULMS-STATE-0002", `draft locked — application already at ${a.stage}`);
    Object.assign(a, {
      productCode: body?.productCode ?? a.productCode,
      amountMinor: body?.amountMinor ?? a.amountMinor,
      tenorMonths: body?.tenorMonths ?? a.tenorMonths,
      rateType: body?.rateType ?? a.rateType,
      incomeMinor: body?.incomeMinor ?? a.incomeMinor,
      existingEmiMinor: body?.existingEmiMinor ?? a.existingEmiMinor,
      version: a.version + 1,
    });
    return ok(applicationView(a));
  }
  if (seg[0] === "applications" && seg[2] === "submit" && method === "POST") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    const cust = db.customers.find((c) => c.id === a.customerId)!;
    a.cibObligationMinor = cibObligationFor(cust.cifNo);
    a.dbrPercent = dbrOf(a);
    const sc = scoreOf(a);
    a.score = sc.score; a.grade = sc.grade;
    audit(actor, "SUBMIT", a.appNo, `CIB pulled · score ${sc.score} (${sc.grade}) · DBR ${a.dbrPercent ?? "?"}%`);
    if (sc.decision === "AUTO_DECLINE" || (a.dbrPercent ?? 0) > 50) {
      a.stage = "SCREENING";   // rolled back with the score persisted (G2 contract)
      a.workflowPhase = "AUTO_DECLINE";
      return ok(applicationView(a));
    }
    a.stage = "CPV";
    a.workflowNode = "CPV_OFFICER";
    outboxEmit("APPLICATION_SUBMITTED", "application", a.id,
      { cif: db.customers.find((c) => c.id === a.customerId)?.cifNo, amountMinor: a.amountMinor });
    return ok(applicationView(a));
  }
  if (seg[0] === "applications" && seg[2] === "cpv" && method === "POST") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    if (a.stage !== "CPV") return err(409, "ULMS-STATE-0002", `CPV only valid at CPV stage (now ${a.stage})`);
    if (body?.passed) {
      a.stage = "APPROVAL";
      const lvl = ladderLevelFor(a.amountMinor);
      db.tasks.push({
        taskId: `t-${db.seq.task++}`, appId: a.id, node: `L${lvl.level}`, role: lvl.roleKey,
        phase: "ACTION", status: "OPEN",
        slaDeadline: new Date(Date.now() + 48 * 3600e3).toISOString(),
      });
      a.workflowNode = `L${lvl.level}`;
      audit(actor, "CPV_PASS", a.appNo, `ladder started at L${lvl.level}`);
    } else {
      a.stage = "SCREENING";
      a.workflowNode = null;
      audit(actor, "CPV_FAIL", a.appNo, String(body?.notes ?? "rolled back to screening"));
    }
    return ok(applicationView(a));
  }
  if (seg[0] === "applications" && seg[1] && seg[2] === "documents") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    if (method === "GET") return ok({ data: db.documents.filter((d) => d.appId === a.id) });
    if (method === "POST") {
      const raw = Buffer.isBuffer(body) ? body : Buffer.alloc(0);
      const sha = createHash("sha256").update(raw.length ? raw : String(Date.now())).digest("hex");
      const doc = { id: `d-${db.seq.doc++}`, appId: a.id, docType: q("docType") ?? "OTHER", sha256: sha, sizeBytes: raw.length, scanStatus: "CLEAN" as const };
      db.documents.push(doc);
      audit(actor, "UPLOAD", a.appNo, `${doc.docType} sha256=${sha.slice(0, 12)}… CLEAN`);
      return ok(doc);
    }
  }

  // ---- approvals ----
  if (p === "/approvals/ladder" && method === "GET") return ok({ data: LADDER });
  if (p === "/approvals/my-inbox" && method === "GET") {
    const rows = db.tasks.filter((t) => t.status === "OPEN").map((t) => {
      const a = db.applications.find((x) => x.id === t.appId)!;
      return { taskId: t.taskId, appNo: a.appNo, node: t.node, amountMinor: a.amountMinor, slaDeadline: t.slaDeadline };
    });
    return ok({ data: rows });
  }
  if (seg[0] === "approvals" && seg[1] === "current" && seg[2] && method === "GET") {
    const t = db.tasks.find((x) => x.appId === seg[2] && x.status === "OPEN");
    if (!t) return err(404, "ULMS-NOT-FOUND", "no open task");
    return ok({ taskId: t.taskId, node: t.node, role: t.role, phase: t.phase, status: t.status, slaDeadline: t.slaDeadline });
  }
  if (seg[0] === "approvals" && seg[2] === "act" && method === "POST") {
    const t = db.tasks.find((x) => x.taskId === seg[1]);
    if (!t) return err(404, "ULMS-NOT-FOUND", "task not found");
    const a = db.applications.find((x) => x.id === t.appId)!;
    const action = String(body?.action ?? "APPROVE").toUpperCase();
    const nextLevel = LADDER.find((l) => l.level === +(t.node.slice(1)) + 1);
    const stillInBand = nextLevel && nextLevel.minMinor <= a.amountMinor;
    // Q1.3 DELEGATE: hand the open task to a named peer — SLA clock keeps
    // running, node/phase unchanged, only the delegate may act afterwards
    if (action === "DELEGATE") {
      const target = String(body?.delegateTo ?? "").trim();
      if (!target) return err(400, "ULMS-REQ-0001", "delegateTo is required for DELEGATE");
      if (target === String(body?.actor ?? actor)) return err(400, "ULMS-REQ-0001", "cannot delegate to yourself");
      t.assigneeUser = target;
      audit(String(body?.actor ?? actor), "DELEGATE", a.appNo, `${t.node} handed to ${target}`);
      return ok({ instanceStatus: "RUNNING", event: "DELEGATED", nextTaskId: t.taskId });
    }
    // Q1.3 APPROVE_WITH_CONDITIONS: record one condition per remark line,
    // then advance exactly like APPROVE — rows gate disbursement until
    // every one is SATISFIED or WAIVED
    if (action === "APPROVE_WITH_CONDITIONS") {
      const lines = String(body?.remark ?? "").split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      if (lines.length === 0) return err(400, "ULMS-REQ-0001", "at least one condition line is required");
      for (const line of lines) {
        db.conditions.push({
          id: `cond-${db.seq.cond++}`, appId: a.id, node: t.node, conditionText: line,
          status: "PENDING", createdBy: String(body?.actor ?? actor),
          createdAt: new Date().toISOString(), resolvedBy: null, resolvedAt: null,
        });
      }
      audit(String(body?.actor ?? actor), "APPROVE_WITH_CONDITIONS", a.appNo,
        `${lines.length} condition(s) recorded at ${t.node}`);
    }
    if (action === "APPROVE" || action === "APPROVE_WITH_CONDITIONS") {
      if (stillInBand) {
        t.status = "DONE";
        db.tasks.push({ taskId: `t-${db.seq.task++}`, appId: a.id, node: `L${nextLevel.level}`, role: nextLevel.roleKey, phase: "ACTION", status: "OPEN", slaDeadline: new Date(Date.now() + 48 * 3600e3).toISOString() });
        a.workflowNode = `L${nextLevel.level}`;
        audit(String(body?.actor ?? actor), "APPROVE", a.appNo, `approved at ${t.node} → L${nextLevel.level}`);
        return ok({ instanceStatus: "RUNNING", event: `APPROVED_${t.node}`, nextTaskId: `t-${db.seq.task - 1}` });
      }
      t.status = "DONE";
      a.stage = "SANCTION";
      a.workflowNode = "SANCTION";
      outboxEmit("APPROVED", "application", a.id,
        { cif: db.customers.find((c) => c.id === a.customerId)?.cifNo, amountMinor: a.amountMinor });
      audit(String(body?.actor ?? actor), "APPROVE", a.appNo, `approved at ${t.node} → SANCTION`);
      return ok({ instanceStatus: "COMPLETED", event: "SANCTIONED", nextTaskId: null });
    }
    t.status = "DONE";
    a.stage = action === "REJECT" ? "DECLINED" : "SCREENING";
    a.workflowNode = null;
    audit(String(body?.actor ?? actor), action, a.appNo, String(body?.remark ?? ""));
    return ok({ instanceStatus: action === "REJECT" ? "TERMINATED" : "RUNNING", event: action, nextTaskId: null });
  }

  // ---- approvals: conditions precedent (Q1.3) ----
  if (seg[0] === "approvals" && seg[1] === "conditions" && seg[2] && method === "GET") {
    const rows = db.conditions.filter((c) => c.appId === seg[2]);
    return ok({ data: rows });
  }
  if (seg[0] === "approvals" && seg[1] === "conditions" && seg[3] === "resolve" && method === "POST") {
    const c = db.conditions.find((x) => x.id === seg[2]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "condition not found");
    const status = String(body?.status ?? "");
    if (status !== "SATISFIED" && status !== "WAIVED") {
      return err(400, "ULMS-REQ-0001", "status must be SATISFIED or WAIVED");
    }
    if (c.status !== "PENDING") return err(409, "ULMS-STATE-0002", `already ${c.status}`);
    c.status = status;
    c.resolvedBy = actor;
    c.resolvedAt = new Date().toISOString();
    audit(actor, `CONDITION_${status}`, c.id.slice(0, 12), String(body?.remark ?? ""));
    return ok(c);
  }

  // ---- assessments ----
  if (seg[0] === "assessments" && seg[1] === "cib" && seg[2] && seg[2] !== "file" && method === "POST") {
    const cust = custBy(seg[2]);
    if (!cust) return err(404, "ULMS-NOT-FOUND", "customer not found");
    const period = new Date().toISOString().slice(0, 7);
    let pull = db.cibPulls.find((x) => x.cif === cust.cifNo && x.period === period);
    if (!pull) {
      const facilities = [
        { lenderCode: "ABC001", lenderName: "ABC Bank", facilityType: "TERM_LOAN", limitMinor: 250000000, outstandingMinor: 190000000, overdueMinor: 0, installmentMinor: 3200000, dpd: 0, classification: "STD-0", lastPaymentDate: "2026-09-05", repaymentTrack: "111100001111000011110000" },
        { lenderCode: "EBL034", lenderName: "Eastern Bank PLC", facilityType: "AUTO_LOAN", limitMinor: 80000080, outstandingMinor: 42000000, overdueMinor: 0, installmentMinor: 900000, dpd: 74, classification: "SMA", lastPaymentDate: "2026-07-05", repaymentTrack: "111000000111000000111000" },
        { lenderCode: "CTY012", lenderName: "City Bank", facilityType: "OVERDRAFT", limitMinor: 120000000, outstandingMinor: 120000000, overdueMinor: 21000000, installmentMinor: 4700000, dpd: 132, classification: "SS", lastPaymentDate: "2026-05-02", repaymentTrack: "110000000011000000001100" },
      ];
      pull = { id: `cib-${db.seq.cib++}`, cif: cust.cifNo, status: "OK", period, pulledAt: new Date().toISOString(), facilities, pulls: [] };
      db.cibPulls.push(pull);
      audit(actor, "CIB_PULL", cust.cifNo, `period ${period} · ${facilities.length} facilities`);
    }
    return ok({ status: pull.status, period: pull.period });
  }
  if (seg[0] === "assessments" && seg[1] === "cib" && seg[2] && seg[2] !== "file" && method === "GET") {
    const cust = custBy(seg[2]);
    const pulls = db.cibPulls.filter((x) => !cust || x.cif === cust.cifNo);
    if (!pulls.length) return err(404, "ULMS-NOT-FOUND", "no CIB pull for this customer");
    const latest = pulls[pulls.length - 1];
    return ok({
      id: latest.id, status: latest.status, period: latest.period, pulledAt: latest.pulledAt,
      facilities: latest.facilities,
      pullHistory: pulls.map((x) => ({ period: x.period, status: x.status, source: "CIB_ONLINE", pulledAt: x.pulledAt })),
    });
  }
  if (seg[0] === "assessments" && seg[2] === "score" && method === "GET") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a || a.score == null) return err(404, "ULMS-NOT-FOUND", "no score yet");
    return ok({
      score: a.score, grade: a.grade, decision: a.workflowPhase === "AUTO_DECLINE" ? "AUTO_DECLINE" : "AUTO_PASS",
      version: 2, dbrPercent: a.dbrPercent != null ? String(a.dbrPercent) : null,
      cibObligationMinor: a.cibObligationMinor ?? 0,
      proposedEmiMinor: emiMonthly(a.amountMinor, a.tenorMonths, 0.1199),
    });
  }
  if (seg[0] === "assessments" && seg[2] === "collateral" && method === "POST") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    audit(actor, "COLLATERAL", a.appNo, `${body?.type} value ${(body?.valueMinor ?? 0) / 100} ৳`);
    return created({ id: `col-${Date.now()}` });
  }

  // ---- disbursements ----
  if (seg[0] === "disbursements" && seg[2] === "prepare" && method === "POST") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    if (a.stage !== "SANCTION") return err(409, "ULMS-STATE-0002", `prepare requires SANCTION (now ${a.stage})`);
    // Q1.3: conditions precedent gate the money
    const pendingConds = db.conditions.filter((c) => c.appId === a.id && c.status === "PENDING");
    if (pendingConds.length > 0) {
      return err(409, "ULMS-COND-0001",
        `Conditions precedent outstanding (${pendingConds.length}) — resolve before disbursement`);
    }
    const d = {
      id: `ds-${db.seq.disb++}`, applicationId: a.id, amountMinor: a.amountMinor,
      state: "PREPARED", preparedBy: actor, authorizedBy: null, fineractTxnId: null,
      trail: [{ action: "PREPARE", actor, actedAt: new Date().toISOString() }],
    };
    db.disbursements.push(d);
    a.stage = "DISBURSEMENT";
    audit(actor, "DISB_PREPARE", a.appNo, "dual-auth trail opened");
    return ok(d);
  }
  if (seg[0] === "disbursements" && seg[2] === "authorize" && method === "POST") {
    const d = db.disbursements.find((x) => x.id === seg[1]);
    if (!d) return err(404, "ULMS-NOT-FOUND", "disbursement not found");
    if (d.state !== "PREPARED") return err(409, "ULMS-STATE-0002", `authorize requires PREPARED (now ${d.state})`);
    if (actor === d.preparedBy) return err(409, "ULMS-DUAL-AUTH-0001", "preparer cannot authorize their own disbursement");
    d.state = "AUTHORIZED"; d.authorizedBy = actor;
    d.trail.push({ action: "AUTHORIZE", actor, actedAt: new Date().toISOString() });
    return ok(d);
  }
  if (seg[0] === "disbursements" && seg[2] === "release" && method === "POST") {
    const d = db.disbursements.find((x) => x.id === seg[1]);
    if (!d) return err(404, "ULMS-NOT-FOUND", "disbursement not found");
    if (d.state !== "AUTHORIZED") return err(409, "ULMS-STATE-0002", `release requires AUTHORIZED (now ${d.state})`);
    if (actor === d.preparedBy || actor === d.authorizedBy)
      return err(409, "ULMS-DUAL-AUTH-0002", "releaser must differ from preparer and authorizer");
    d.state = "RELEASED"; d.fineractTxnId = 77000 + db.seq.disb;
    d.trail.push({ action: "RELEASE", actor, actedAt: new Date().toISOString() });
    const a = db.applications.find((x) => x.id === d.applicationId)!;
    a.stage = "DISBURSED";
    outboxEmit("DISBURSED", "application", a.id,
      { cif: db.customers.find((c) => c.id === a.customerId)?.cifNo, amountMinor: a.amountMinor });
    audit(actor, "DISB_RELEASE", a.appNo, `payout released · Fineract txn ${d.fineractTxnId}`);
    return ok(d);
  }
  if (seg[0] === "disbursements" && seg[1] && !seg[2] && method === "GET") {
    const d = db.disbursements.find((x) => x.id === seg[1]);
    if (!d) return err(404, "ULMS-NOT-FOUND", "disbursement not found");
    return ok(d);
  }
  if (seg[0] === "disbursements" && seg[1] === "application" && seg[2] && method === "GET") {
    const d = db.disbursements.find((x) => x.applicationId === seg[2]);
    if (!d) return err(404, "ULMS-NOT-FOUND", "no disbursement for application");
    return ok(d);
  }

  // ---- compliance ----
  if (p === "/compliance/eod/run" && method === "POST") {
    const runDate = body?.date ?? new Date().toISOString().slice(0, 10);
    let run = db.eodRuns.find((x) => x.runDate === runDate);
    if (run) {
      run.detail = `rerun at ${new Date().toISOString()} — idempotent (same run-date)`;
    } else {
      const provisionsByClass: Record<string, number> = {};
      let totalOutstanding = 0, totalProvision = 0;
      for (const l of db.loans) {
        l.classification = classify(l.dpd);
        l.interestSuspense = ["SS", "DF", "B/L"].includes(l.classification);
        const prov = provisionFor(l);
        provisionsByClass[l.classification] = (provisionsByClass[l.classification] ?? 0) + prov;
        totalOutstanding += l.outstandingMinor; totalProvision += prov;
      }
      run = {
        runDate, loansClassified: db.loans.length, totalOutstandingMinor: totalOutstanding,
        totalProvisionMinor: totalProvision, provisionsByClass,
        detail: `EOD ${runDate}: ${db.loans.length} loans classified · interest suspense from SS`,
      };
      db.eodRuns.push(run);
      audit(actor, "EOD_RUN", runDate, `${db.loans.length} loans classified`);
    }
    return ok(run);
  }
  if (p === "/compliance/classification" && method === "GET") {
    const latest = db.eodRuns.length ? db.eodRuns[db.eodRuns.length - 1] : null;
    return ok({
      latestRun: latest ? {
        runDate: latest.runDate, loansClassified: latest.loansClassified,
        totalOutstandingMinor: latest.totalOutstandingMinor,
        totalProvisionMinor: latest.totalProvisionMinor, detail: latest.detail,
      } : null,
      loans: db.loans.map(loanView),
      openAlerts: [
        { id: "al-1", type: "SMA_MIGRATION", detail: "4 accounts STD-2 → SMA at Gulshan in 24h", createdAt: new Date().toISOString() },
        { id: "al-2", type: "INSURANCE_EXPIRED", detail: "LN-40143 fire policy expired 22 Sep", createdAt: new Date().toISOString() },
      ],
    });
  }
  if (p === "/compliance/provision-calculator" && method === "GET") {
    const cls = q("classification") ?? "STD-0";
    const outstandingMinor = +(q("outstandingMinor") ?? 0);
    const b = BRPD.find((x) => x.k === cls);
    if (!b) return err(422, "ULMS-VALIDATION-0001", `unknown classification ${cls}`);
    return ok({
      classification: cls, provisionRateBp: b.rateBp,
      interestSuspense: ["SS", "DF", "B/L"].includes(cls),
      provisionMinor: Math.round((outstandingMinor * b.rateBp) / 10000),
    });
  }
  if (p === "/compliance/alerts" && method === "GET") {
    return ok({ data: [
      { id: "al-1", type: "SMA_MIGRATION", detail: "4 accounts STD-2 → SMA at Gulshan in 24h", createdAt: new Date().toISOString() },
      { id: "al-2", type: "INSURANCE_EXPIRED", detail: "LN-40143 fire policy expired 22 Sep", createdAt: new Date().toISOString() },
    ] });
  }
  if (p === "/compliance/provision-jv" && method === "POST") {
    const runDate = body?.date ?? new Date().toISOString().slice(0, 10);
    const run = db.eodRuns[db.eodRuns.length - 1];
    const totalMinor = run?.totalProvisionMinor ?? 0;
    if (db.provisionJvs.some((j) => j.runDate === runDate))
      return err(409, "ULMS-JV-IDEMPOTENT", `provision JV for ${runDate} already posted — zero-sum posted earlier; drift ⇒ reversing entry required`);
    db.provisionJvs.push({ runDate, totalMinor });
    audit(actor, "PROVISION_JV", runDate, `zero-sum ৳${totalMinor / 100} posted to Fineract GL`);
    return ok({
      id: `jv-${db.provisionJvs.length}`, runDate, totalMinor,
      debitsMinor: totalMinor, creditsMinor: totalMinor, zeroSum: true,
      fineractTxnId: String(88000 + db.provisionJvs.length),
      referenceNumber: `JV-${runDate.replace(/-/g, "")}-${db.provisionJvs.length}`,
    });
  }

  // ---- regulatory returns / regcon ----
  if (p === "/compliance/returns" && method === "GET") {
    const filed = db.returns.filter((x) => x.status === "Filed");
    const dueIn30Days = db.returns.filter((x) =>
      x.frequency !== "CONTINUOUS" && x.nextDue
      && new Date(x.nextDue) <= new Date(Date.now() + 30 * 86400_000)
      && x.status !== "Filed").length;
    return ok({
      today: new Date().toISOString().slice(0, 10),
      entries: db.returns,
      kpis: {
        dueIn30Days, filedTotal: filed.length,
        onTimeStreak: 23,
        carPercent: 13.2, carFloorPercent: 12.5,
        eclRunwayMonths: 15, eclMandatoryFrom: "2027-12-01",
      },
    });
  }
  if (seg[0] === "compliance" && seg[1] === "returns" && seg[3] === "generate" && method === "POST") {
    const e = db.returns.find((x) => x.code === seg[2]);
    if (!e) return err(404, "ULMS-NOT-FOUND", `return ${seg[2]} not found`);
    const period = q("period") ?? "2026-09";
    const rowCount = 40 + nextRef() % 200;
    e.returnId = e.returnId ?? `r-${db.seq.ret++}`;
    e.status = "Staged"; e.latestPeriod = period; e.rowCount = rowCount;
    e.preparer = "system"; e.checker = null; e.complianceOfficer = null;
    e.fileFormat = e.code.startsWith("CIB") ? "fixed-width" : "csv";
    e.fileSha256 = createHash("sha256").update(`${e.code}:${period}:${rowCount}`).digest("hex");
    e.storageKey = `worm/returns/${e.code}/${period}/${e.fileSha256.slice(0, 16)}`;
    audit("system", "GENERATE", e.code, `period ${period} · ${rowCount} rows · WORM staged`);
    return ok({ id: e.returnId, code: e.code, period, status: "STAGED", rowCount, fileSha256: e.fileSha256, fileFormat: e.fileFormat });
  }
  if (seg[0] === "compliance" && seg[1] === "returns" && seg[4] === "check" && method === "POST") {
    const e = db.returns.find((x) => x.returnId === seg[2]);
    if (!e) return err(404, "ULMS-NOT-FOUND", "return not found");
    if (!e.returnId) return err(409, "ULMS-STATE-0002", "generate the return before sign-off");
    if (e.checker === actor)
      return err(409, "ULMS-SIGNOFF-0001", "checker already recorded for this pack");
    e.checker = actor;
    return ok({ status: "CHECKED", checker: actor });
  }
  if (seg[0] === "compliance" && seg[1] === "returns" && seg[4] === "file" && method === "POST") {
    const e = db.returns.find((x) => x.returnId === seg[2]);
    if (!e) return err(404, "ULMS-NOT-FOUND", "return not found");
    if (!e.checker) return err(409, "ULMS-STATE-0002", "checker sign-off must be recorded before filing");
    if (actor === e.checker)
      return err(409, "ULMS-SIGNOFF-0001", "compliance sign-off must be a DIFFERENT officer than the checker");
    e.complianceOfficer = actor;
    e.status = "Filed"; e.submittedAt = new Date().toISOString();
    audit(actor, "FILE_RETURN", e.code, "submitted to Bangladesh Bank");
    return ok({ status: "FILED", submittedAt: e.submittedAt });
  }
  if (seg[0] === "compliance" && seg[1] === "returns" && seg[3] === "file" && method === "GET") {
    const e = db.returns.find((x) => x.returnId === seg[2]);
    if (!e || !e.storageKey) return err(404, "ULMS-NOT-FOUND", "no staged file — generate first");
    const rows = ["code,branch,exposure_taka,provision_taka"];
    for (const l of db.loans.slice(0, 20))
      rows.push(`${e.code},${l.loanNo},${l.outstandingMinor / 100},${provisionFor(l) / 100}`);
    return { status: 200, body: rows.join("\n"), headers: { "Content-Type": e.code.startsWith("CIB") ? "text/plain" : "text/csv" } };
  }
  if (p === "/compliance/regcon-calendar" && method === "GET") {
    const months = +(q("months") ?? 6);
    const out: { code: string; dueDate: string; period: string }[] = [];
    for (let m = 0; m < months; m++) {
      const d = new Date(); d.setMonth(d.getMonth() + m + 1);
      for (const e of db.returns) {
        if (e.frequency === "MONTHLY" || (e.frequency === "QUARTERLY" && m % 3 === 0) || (e.frequency === "PERIODIC" && m === months - 1))
          out.push({ code: e.code, dueDate: e.nextDue, period: d.toISOString().slice(0, 7) });
      }
    }
    return ok(out.slice(0, months * 3));
  }
  if (p === "/compliance/ifrs9/ecl" && method === "GET") {
    const rows = BRPD.map((b, idx) => {
      const loans = db.loans.filter((l) => l.classification === b.k);
      const ead = loans.reduce((s, l) => s + l.outstandingMinor, 0);
      const ifrsStage = ["SS", "DF", "B/L"].includes(b.k) ? 3 : b.k === "SMA" ? 2 : 1;
      const pd = [50, 80, 120, 350, 900, 1400, 2200][idx];
      const lgd = 4500;
      const ecl = Math.round((ead * pd * lgd) / 1e8);
      return {
        stage: b.k, ifrsStage, loans: loans.length, eadMinor: ead,
        pdBp: pd, lgdBp: lgd, eclMinor: ecl,
        brpdProvisionMinor: loans.reduce((s, l) => s + provisionFor(l), 0),
      };
    }).filter((x) => x.loans > 0);
    const ecl = rows.reduce((s, x) => s + x.eclMinor, 0);
    const brpd = rows.reduce((s, x) => s + x.brpdProvisionMinor, 0);
    return ok({
      asOf: new Date().toISOString().slice(0, 10), rows,
      eclMinor: ecl, brpdProvisionMinor: brpd, deltaMinor: ecl - brpd,
      runwayMonths: 15, mandatoryFrom: "2027-12-01",
    });
  }
  if (p === "/compliance/basel/car" && method === "GET") {
    const RW: Record<string, number> = { "STD-0": 75, "STD-1": 75, "STD-2": 75, "SMA": 100, "SS": 150, "DF": 150, "B/L": 150 };
    const byCls = new Map<string, number>();
    for (const l of db.loans) byCls.set(l.classification, (byCls.get(l.classification) ?? 0) + l.outstandingMinor);
    const rows = [...byCls.entries()].map(([classification, minor]) => ({
      classification, outstanding_taka: String(minor / 100),
      risk_weight_percent: RW[classification] ?? 100, rwa_taka: String((minor * (RW[classification] ?? 100)) / 10000),
    }));
    const rwa = rows.reduce((s, x) => s + Number(x.rwa_taka), 0);
    return ok({
      asOf: new Date().toISOString().slice(0, 10), rows,
      eligible_capital_taka: String(Math.round(rwa * 0.132)),
      rwa_taka: String(Math.round(rwa)),
      car_percent: 13.2, floor_percent: 12.5, buffer_pp: 0.7,
    });
  }

  // ---- reporting ----
  const portfolioRead = (groupby: string, labelOf: (l: Loan) => string) => {
    const groups = new Map<string, { loans: number; principalMinor: number; outstandingMinor: number; provisionMinor: number }>();
    for (const l of db.loans) {
      const key = labelOf(l);
      const g = groups.get(key) ?? { loans: 0, principalMinor: 0, outstandingMinor: 0, provisionMinor: 0 };
      g.loans++; g.principalMinor += l.principalMinor;
      g.outstandingMinor += l.outstandingMinor; g.provisionMinor += provisionFor(l);
      groups.set(key, g);
    }
    return {
      groupBy: groupby, activeLoans: db.loans.length,
      rows: [...groups.entries()].map(([k, v]) => ({ key: k, [groupby]: k, ...v, coveragePercent: Math.round((v.provisionMinor / Math.max(1, v.outstandingMinor)) * 1000) / 10 })),
      totalOutstandingMinor: db.loans.reduce((s, l) => s + l.outstandingMinor, 0),
      totalProvisionMinor: db.loans.reduce((s, l) => s + provisionFor(l), 0),
    };
  };
  const groupLabel = (gb: string) =>
    gb === "branch" ? (l: Loan) => l.branchCode : gb === "product" ? (l: Loan) => l.productCode : (l: Loan) => l.classification;
  if (p === "/reporting/portfolio" && method === "GET") {
    const gb = q("groupby") ?? "classification";
    return ok(portfolioRead(gb, groupLabel(gb)));
  }
  if (p === "/reporting/definitions") {
    if (method === "GET") return ok(db.reportDefs);
    if (method === "POST") {
      const d = {
        id: `rd-${db.reportDefs.length + 1}`, name: String(body?.name ?? "New report"),
        domain: "LOAN_PORTFOLIO", groupBy: String(body?.groupBy ?? "classification"),
        schedule: body?.schedule ?? "NONE", createdBy: actor, createdAt: new Date().toISOString(),
      };
      db.reportDefs.push(d);
      return created(d);
    }
  }
  if (seg[0] === "reporting" && seg[1] === "definitions" && seg[3] === "run" && (method === "GET" || method === "POST")) {
    const d = db.reportDefs.find((x) => x.id === seg[2]);
    if (!d) return err(404, "ULMS-NOT-FOUND", "definition not found");
    return ok({
      ...portfolioRead(d.groupBy, groupLabel(d.groupBy)),
      definition: { id: d.id, name: d.name, schedule: d.schedule, createdBy: d.createdBy },
    });
  }

  // ---- loans / servicing ----
  if (p === "/loans" && method === "GET")
    return ok({ data: db.loans.map(loanView), meta: { page: 1, size: db.loans.length, totalElements: db.loans.length } });
  if (seg[0] === "loans" && seg[1] && !seg[2] && method === "GET") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", `loan ${seg[1]} not found`);
    return ok(loanView(l));
  }
  if (seg[0] === "loans" && seg[2] === "payments") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    if (method === "GET") return ok({ data: db.payments.filter((x) => x.loanId === l.id) });
    if (method === "POST") {
      const externalRef = String(body?.externalRef ?? "");
      const replay = db.payments.find((x) => x.loanId === l.id && x.externalRef === externalRef);
      if (replay) return ok(replay, { "Idempotent-Replay": "true" });
      const amountMinor = +(body?.amountMinor ?? 0);
      if (!(amountMinor > 0)) return err(422, "ULMS-VALIDATION-0001", "amountMinor must be positive");
      const pm = {
        id: `p-${db.seq.pay++}`, loanId: l.id, amountMinor,
        externalRef: externalRef || `REF-${db.seq.pay}`,
        rail: String(body?.rail ?? "COUNTER"), utr: null, fineractTxnId: 90000 + db.seq.pay,
        paidAt: new Date().toISOString(),
      };
      db.payments.push(pm);
      l.outstandingMinor = Math.max(0, l.outstandingMinor - amountMinor);
      outboxEmit("PAYMENT_POSTED", "loan", l.id,
        { cif: db.customers.find((c) => c.id === l.customerId)?.cifNo, amountMinor });
      if (l.outstandingMinor === 0) { l.closed = true; l.dpd = 0; }
      else if (amountMinor >= (l.emiMinor ?? 0)) l.dpd = Math.max(0, l.dpd - 30);
      audit(actor, "PAYMENT", l.loanNo, `${amountMinor / 100} ৳ via ${pm.rail} · outstanding ${l.outstandingMinor / 100} ৳`);
      return ok(pm);
    }
  }
  if (seg[0] === "loans" && seg[2] === "payment-intents" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    const rail = String(body?.rail ?? "BKASH");
    return ok({
      id: `int-${Date.now()}`, rail,
      railUrl: `/hooks/checkout/${rail.toLowerCase()}?intent=${Date.now()}`,
      status: "REDIRECT",
    });
  }
  if (seg[0] === "loans" && seg[2] === "schedule" && method === "GET") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    return ok({ data: scheduleFor(l) });
  }
  if (seg[0] === "loans" && seg[2] === "statement") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    const page = +(q("page") ?? 1), size = 20;
    const all = [...db.payments.filter((x) => x.loanId === l.id)].reverse();
    const rows = all.slice((page - 1) * size, page * size).map((x) => ({
      paidOn: x.paidAt.slice(0, 10), reference: x.externalRef, rail: x.rail,
      paidInMinor: x.amountMinor, outstandingAfterMinor: l.outstandingMinor,
    }));
    if (q("format") === "csv") {
      const csv = ["paid_on,reference,rail,paid_in_taka,outstanding_taka",
        ...rows.map((x) => `${x.paidOn},${x.reference},${x.rail},${x.paidInMinor / 100},${x.outstandingAfterMinor / 100}`)].join("\n");
      return { status: 200, body: csv, headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${l.loanNo}-statement.csv"` } };
    }
    return ok({ loanNo: l.loanNo, rows, page, size, total: all.length });
  }
  if (seg[0] === "loans" && seg[2] === "settle-quote" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    const penaltyMinor = Math.round(l.principalMinor * 0.02);          // 2% lock-in
    const unearned = Math.round((l.principalMinor - l.outstandingMinor) * 0.5 * 0.12);
    const rebateMinor = Math.round(unearned * 0.5);                    // 50% unearned-interest rebate
    const validUntil = new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10);
    return ok({
      id: `q-${Date.now()}`, outstandingMinor: l.outstandingMinor,
      penaltyMinor, rebateMinor, totalMinor: l.outstandingMinor + penaltyMinor - rebateMinor,
      validUntil,
    });
  }
  if (seg[0] === "loans" && seg[2] === "reschedule-request" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    l.tenorMonths = Math.max(3, +(body?.newTenorMonths ?? l.tenorMonths));
    audit(actor, "RESCHEDULE", l.loanNo, `tenor → ${l.tenorMonths}m · ${String(body?.reason ?? "")}`);
    return created({ id: `rs-${Date.now()}`, status: "APPROVED", newTenorMonths: l.tenorMonths });
  }

  // ---- mobile field gateway (PLANNING/08 A5) ----
  if (p === "/field/tasks" && method === "GET") {
    const since = q("since");
    const officer = actor;   // dev modes: the persona header stands in for the JWT sub
    const mine = db.fieldTasks.filter((t) => t.assignedTo === officer || t.assignedTo === "field-team");
    const data = since ? mine.filter((t) => new Date((t as any).updatedAt ?? t.dueOn) > new Date(since)) : mine;
    const version = mine.length ? new Date().toISOString() : "empty";
    return ok({ data, bundleVersion: version });
  }
  if (p === "/field/visits" && method === "POST") {
    const clientUuid = String(body?.clientUuid ?? "").trim();
    if (!clientUuid) return err(400, "ULMS-REQ-0001", "clientUuid is required (idempotency key)");
    const prior = db.fieldVisits.find((v) => v.clientUuid === clientUuid);
    if (prior) return ok({ id: prior.id, clientUuid, applied: false, outcome: prior.outcome, replayed: true });
    const task = body?.taskId ? db.fieldTasks.find((t) => t.id === body.taskId) : undefined;
    if (body?.taskId && !task) return err(404, "ULMS-NOT-FOUND", "task not found");
    let applied = true;
    if (task && task.status !== "DONE") {
      task.status = "DONE";
      task.evidence = JSON.stringify(body?.evidence ?? {});
    } else if (task) {
      applied = false;   // server-wins: replay on an already-DONE task
    }
    const v = { id: `fv-${db.seq.fv++}`, clientUuid, taskId: task?.id ?? null,
      loanId: body?.loanId ?? null, officer: actor,
      outcome: String(body?.outcome ?? "VERIFIED"), evidence: body?.evidence ?? {},
      applied, appliedAt: new Date().toISOString() };
    db.fieldVisits.push(v);
    return created({ id: v.id, clientUuid, applied, outcome: v.outcome, replayed: false });
  }
  if (p === "/field/ptp" && method === "POST") {
    const l = loanBy(body?.loanId);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    const ptp = { id: `pp-${db.seq.ptp++}`, loanId: l.id,
      promisedAmountMinor: Number(body?.promisedAmountMinor ?? 0),
      promisedOn: String(body?.promisedOn ?? new Date().toISOString().slice(0, 10)),
      confidence: String(body?.confidence ?? "MEDIUM"), contactName: body?.contactName ?? null,
      contactRelation: body?.contactRelation ?? null, contactPhone: body?.contactPhone ?? null,
      kept: "PENDING", dpdAtPromise: l.dpd, classAtPromise: l.classification };
    db.ptps.push(ptp as any);
    audit(actor, "PTP_CREATED", l.loanNo, `field capture ${ptp.promisedAmountMinor}`);
    return created(ptp);
  }
  if (p === "/field/sos" && method === "POST") {
    const a = { id: `sos-${db.seq.sos++}`, officer: actor, loanId: body?.loanId ?? null,
      lat: body?.lat ?? null, lng: body?.lng ?? null, note: body?.note ?? null,
      status: "OPEN" as const, createdAt: new Date().toISOString() };
    db.sosAlerts.push(a);
    outboxEmit("SOS_RAISED", "sos_alert", a.id, { officer: actor, geo: a.lat != null ? `${a.lat},${a.lng}` : "unavailable" });
    audit(actor, "SOS_RAISED", a.id.slice(0, 10), String(body?.note ?? ""));
    return created(a);
  }
  if (p === "/field/sos" && method === "GET") {
    return ok({ data: db.sosAlerts.filter((x) => x.status === "OPEN") });
  }
  if (seg[0] === "field" && seg[1] === "sos" && seg[3] === "ack" && method === "POST") {
    const a = db.sosAlerts.find((x) => x.id === seg[2]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "alert not found");
    if (a.status !== "OPEN") return err(409, "ULMS-STATE-0002", `already ${a.status}`);
    a.status = "ACKNOWLEDGED";
    audit(actor, "SOS_ACKNOWLEDGED", a.id.slice(0, 10), "");
    return ok(a);
  }

  // ---- collections ----
  // Q1.4 watchlist (one OPEN row per loan; nightly STD-2 auto-flag = seed time)
  if (p === "/collections/watchlist" && method === "GET") {
    const status = (q("status") ?? "OPEN").toUpperCase();
    const rows = status === "ALL" ? db.watchlist
      : db.watchlist.filter((w) => w.status === status);
    return ok({ data: rows });
  }
  if (p === "/collections/watchlist" && method === "POST") {
    const REASONS = ["DPD_RISING", "CHEQUE_BOUNCE", "CIB_ALERT", "FIELD_INTEL", "BANKING_INACTIVITY", "AUTO_STD2"];
    const reason = String(body?.reasonCode ?? "");
    if (!REASONS.includes(reason)) return err(422, "ULMS-REQ-0001", `reasonCode must be one of ${REASONS.join("|")}`);
    const loan = db.loans.find((l) => l.id === body?.loanId);
    if (!loan) return err(404, "ULMS-NOT-FOUND", "loan not found");
    if (db.watchlist.some((w) => w.loanId === loan.id && w.status === "OPEN")) {
      return err(409, "ULMS-STATE-0002", "loan already on the watchlist");
    }
    const w = {
      id: `wl-${db.seq.wl++}`, loanId: loan.id,
      cifNo: db.customers.find((c) => c.id === loan.customerId)?.cifNo ?? "?",
      loanNo: loan.loanNo,
      reasonCode: reason, note: body?.note ?? null, status: "OPEN" as const,
      reviewBy: new Date(Date.now() + (Number(body?.reviewWithinDays ?? 7)) * 86400e3).toISOString(),
      addedBy: actor, addedAt: new Date().toISOString(),
      clearedBy: null, clearedAt: null, clearNote: null,
    };
    db.watchlist.push(w);
    audit(actor, "WATCHLIST_ADD", loan.loanNo, reason);
    return ok(w);
  }
  if (seg[0] === "collections" && seg[1] === "watchlist" && seg[3] === "clear" && method === "POST") {
    const w = db.watchlist.find((x) => x.id === seg[2]);
    if (!w) return err(404, "ULMS-NOT-FOUND", "entry not found");
    if (w.status !== "OPEN") return err(409, "ULMS-STATE-0002", `already ${w.status}`);
    w.status = "CLEARED"; w.clearedBy = actor; w.clearedAt = new Date().toISOString();
    w.clearNote = body?.note ?? null;
    audit(actor, "WATCHLIST_CLEAR", w.loanNo, String(body?.note ?? ""));
    return ok(w);
  }
  // Q1.5 auction ledger — sold cuts a recovery row (5% incentive) like the real service
  if (p === "/collections/auctions" && method === "GET") {
    const status = q("status")?.toUpperCase();
    const loanId = q("loanId");
    const rows = db.auctions.filter((a) =>
      (!status || a.status === status) && (!loanId || a.loanId === loanId));
    return ok({ data: rows });
  }
  if (p === "/collections/auctions" && method === "POST") {
    const loan = db.loans.find((l) => l.id === body?.loanId);
    if (!loan) return err(404, "ULMS-NOT-FOUND", "loan not found");
    const writtenOff = db.writeOffs.some((w: any) => w.loanId === loan.id && w.state === "EXECUTED");
    if (!writtenOff) return err(422, "ULMS-STATE-0001", "auctions track written-off loans only");
    const when = body?.scheduledFor ? new Date(body.scheduledFor) : null;
    if (!when || isNaN(when.getTime()) || when.getTime() < Date.now()) {
      return err(422, "ULMS-REQ-0001", "scheduledFor must be in the future");
    }
    if (!body?.venue || !Number(body?.reserveMinor)) {
      return err(422, "ULMS-REQ-0001", "venue and positive reserveMinor are required");
    }
    const a = {
      id: `auc-${db.seq.auc++}`, loanId: loan.id,
      cifNo: db.customers.find((c) => c.id === loan.customerId)?.cifNo ?? "?",
      loanNo: loan.loanNo,
      collateralRef: body?.collateralRef ?? null, venue: String(body.venue),
      scheduledFor: when.toISOString(), heldOn: null, status: "SCHEDULED" as any,
      reserveMinor: Number(body.reserveMinor), proceedsMinor: null as number | null,
      buyer: null as string | null, recoveryId: null as string | null,
      createdBy: actor, createdAt: new Date().toISOString(),
    };
    db.auctions.push(a);
    audit(actor, "AUCTION_SCHEDULED", loan.loanNo, String(body.venue));
    return ok(a);
  }
  for (const [verb, target] of [["held", "HELD"], ["unsold", "UNSOLD"], ["cancel", "CANCELLED"]] as const) {
    if (seg[0] === "collections" && seg[1] === "auctions" && seg[3] === verb && method === "POST") {
      const a = db.auctions.find((x) => x.id === seg[2]);
      if (!a) return err(404, "ULMS-NOT-FOUND", "auction not found");
      // mirror the backend state machine: held needs SCHEDULED; unsold needs
      // SCHEDULED/HELD; only a SOLD auction can never be cancelled
      const okFrom = verb === "held" ? ["SCHEDULED"]
        : verb === "unsold" ? ["SCHEDULED", "HELD"]
        : ["SCHEDULED", "HELD", "UNSOLD", "CANCELLED"];
      if (verb === "cancel" && a.status === "SOLD") {
        return err(409, "ULMS-STATE-0002", "a sold auction cannot be cancelled");
      }
      if (!okFrom.includes(a.status)) {
        return err(409, "ULMS-STATE-0002", `${verb} not allowed from ${a.status}`);
      }
      a.status = target;
      a.heldOn = a.heldOn ?? new Date().toISOString();
      audit(actor, `AUCTION_${verb.toUpperCase()}`, a.loanNo, "");
      return ok(a);
    }
  }
  if (seg[0] === "collections" && seg[1] === "auctions" && seg[3] === "sold" && method === "POST") {
    const a = db.auctions.find((x) => x.id === seg[2]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "auction not found");
    if (a.status !== "SCHEDULED" && a.status !== "HELD") {
      return err(409, "ULMS-STATE-0002", `sold requires SCHEDULED/HELD (now ${a.status})`);
    }
    const proceeds = Number(body?.proceedsMinor ?? 0);
    if (!proceeds || proceeds <= 0) return err(422, "ULMS-REQ-0001", "proceedsMinor must be positive");
    if (!body?.buyer) return err(422, "ULMS-REQ-0001", "buyer is required");
    const recovery = {
      id: `rec-${db.seq.rec++}`, loanId: a.loanId, loanNo: a.loanNo, cifNo: a.cifNo,
      amountMinor: proceeds, mode: "AUCTION",
      incentiveMinor: Math.round(proceeds * 0.05),
      receivedBy: actor, receivedAt: new Date().toISOString(),
    };
    db.recoveries.push(recovery as any);
    a.status = "SOLD"; a.proceedsMinor = proceeds; a.buyer = String(body.buyer);
    a.recoveryId = recovery.id;
    a.heldOn = a.heldOn ?? new Date().toISOString();
    audit(actor, "AUCTION_SOLD", a.loanNo, `${proceeds} minor · incentive ${recovery.incentiveMinor}`);
    return ok(a);
  }
  if (p === "/collections/worklist" && method === "GET") {
    const rows = db.loans.filter((l) => l.dpd > 0 && !l.closed).map(worklistRow)
      .sort((a, b) => (a.priority === b.priority ? b.dpd - a.dpd : a.priority.localeCompare(b.priority)));
    return ok({ data: rows });
  }
  if (seg[0] === "collections" && seg[2] === "actions" && method === "GET") {
    // OpenAPI parity (audit R1): action history for a loan
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    return ok({ data: db.collActions.filter((a) => a.loanId === l.id) });
  }
  if (seg[0] === "collections" && seg[2] === "actions" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    db.collActions.push({
      id: `ca-${db.seq.act++}`, loanId: l.id, actionType: seg[3],
      outcome: String(body?.outcome ?? "CONTACTED"), notes: body?.notes ?? null,
      dueOn: null, actor, actedAt: new Date().toISOString(),
    });
    audit(actor, seg[2].toUpperCase(), l.loanNo, String(body?.outcome ?? ""));
    return created({ ok: true });
  }
  if (seg[0] === "collections" && seg[2] === "ptp" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    if (!(+(body?.promisedAmountMinor ?? 0) > 0))
      return err(422, "ULMS-VALIDATION-0001", "promisedAmountMinor must be positive");
    const cust = db.customers.find((c) => c.id === l.customerId)!;
    const pt = {
      id: `ptp-${db.seq.ptp++}`, loanId: l.id,
      promisedAmountMinor: +body.promisedAmountMinor,
      promisedOn: String(body?.promisedOn ?? new Date().toISOString().slice(0, 10)),
      confidence: String(body?.confidence ?? "MEDIUM"),
      contactName: body?.contactName ?? null, contactRelation: body?.contactRelation ?? null,
      contactPhoneMasked: body?.contactPhone ? maskPhone(String(body.contactPhone)) : maskPhone(cust.mobile),
      remark: body?.remark ?? null, dpdAtPromise: l.dpd,
      classificationAtPromise: l.classification, kept: "OPEN" as const,
    };
    db.ptps.push(pt);
    audit(actor, "PTP_CREATE", l.loanNo, `${pt.promisedAmountMinor / 100} ৳ promised on ${pt.promisedOn}`);
    return created(ptpView(pt));
  }
  if (seg[0] === "collections" && seg[1] === "ptp" && seg[3] === "outcome" && method === "POST") {
    const pt = db.ptps.find((x) => x.id === seg[2]);
    if (!pt) return err(404, "ULMS-NOT-FOUND", "PTP not found");
    pt.kept = body?.kept ? "KEPT" : "BROKEN";
    audit(actor, "PTP_OUTCOME", pt.loanId, `promise ${pt.kept}`);
    return ok(ptpView(pt));
  }
  if (p === "/collections/ptp/calendar" && method === "GET") {
    const from = q("from") ?? "2000-01-01", to = q("to") ?? "2999-12-31";
    return ok({ data: db.ptps.filter((x) => x.promisedOn >= from && x.promisedOn <= to).map(ptpView) });
  }
  if (p === "/collections/field-tasks" && method === "POST") {
    const l = loanBy(body?.loanId);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    // borrower pin for the field map (PLANNING/08 A4) — Dhaka-area scatter
    // when the caller has no geocode yet; loanNo joins for the map label
    const seed = l.id.charCodeAt(0) + (l.id.charCodeAt(1) ?? 0);
    const t = { id: `ft-${db.seq.ft++}`, loanId: l.id, assignedTo: String(body?.assignedTo ?? "field-team"),
      dueOn: String(body?.dueOn ?? new Date().toISOString().slice(0, 10)), status: "OPEN" as const, evidence: null,
      lat: body?.lat ?? 23.7 + (seed % 60) / 100, lng: body?.lng ?? 90.37 + (seed % 47) / 100,
      loanNo: l.loanNo };
    db.fieldTasks.push(t);
    return created(t);
  }
  if (seg[0] === "collections" && seg[1] === "field-tasks" && seg[3] === "complete" && method === "POST") {
    const t = db.fieldTasks.find((x) => x.id === seg[2]);
    if (!t) return err(404, "ULMS-NOT-FOUND", "task not found");
    t.status = "DONE"; t.evidence = String(body?.evidence ?? "gps+photos");
    return ok(t);
  }
  if (p === "/collections/dunning/queue" && method === "GET")
    return ok({ data: db.collActions.filter((a) => ["CALL", "SMS", "VISIT", "NOTICE"].includes(a.actionType)).slice(0, 20) });
  if (p === "/collections/dunning/run" && method === "POST") {
    const overdue = db.loans.filter((l) => l.dpd > 0 && !l.closed);
    for (const l of overdue) {
      const step = l.dpd <= 30 ? "SMS" : l.dpd <= 60 ? "CALL" : l.dpd <= 90 ? "VISIT" : "NOTICE";
      db.collActions.push({ id: `ca-${db.seq.act++}`, loanId: l.id, actionType: step, outcome: "QUEUED", notes: null, dueOn: null, actor: "system", actedAt: new Date().toISOString() });
    }
    audit(actor, "DUNNING_RUN", "-", `${overdue.length} actions queued`);
    return ok({ queued: overdue.length });
  }
  if (seg[0] === "collections" && seg[1] === "dunning" && seg[3] === "resolve" && method === "POST") {
    const a = db.collActions.find((x) => x.id === seg[2]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "action not found");
    a.outcome = String(body?.outcome ?? "RESOLVED"); a.notes = body?.notes ?? null;
    return ok(a);
  }
  if (seg[0] === "collections" && seg[2] === "legal-case" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    return created({
      id: `lc-${Date.now()}`, loanId: l.id, caseNo: `ARA-2026-${100 + nextRef() % 800}`,
      court: body?.court ?? "Artha Rin Adalat, Dhaka", filedOn: body?.filedOn ?? new Date().toISOString().slice(0, 10),
      status: "FILED", claimMinor: +body?.claimMinor, lawyer: body?.lawyer ?? null,
    });
  }
  if (seg[0] === "collections" && seg[2] === "waive-interest" && method === "POST") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    audit(actor, "WAIVE_INTEREST", l.loanNo, `${(+body?.amountMinor ?? 0) / 100} ৳ waived (Fineract adjustment)`);
    return ok({ ok: true });
  }

  // ---- borrower portal ----
  if (p === "/portal/me" && method === "GET") {
    const cust = db.customers.find((c) => c.mobile === (q("mobile") ?? ""));
    if (!cust) return err(404, "ULMS-NOT-FOUND", "no borrower with that registered mobile");
    const loans = db.loans.filter((l) => l.customerId === cust.id && !l.closed).map((l) => {
      const emi = l.emiMinor ?? emiMonthly(l.principalMinor, l.tenorMonths, l.interestRateBp / 10000);
      return { loanId: l.id, loanNo: l.loanNo, outstandingMinor: l.outstandingMinor,
        emiMinor: emi, nextDueOn: "2026-10-05", classification: l.classification };
    });
    return ok({ cifNo: cust.cifNo, nameEn: cust.nameEn, loans });
  }
  if (p === "/portal/me/application" && method === "GET") {
    const cust = db.customers.find((c) => c.cifNo === (q("cif") ?? ""));
    if (!cust) return err(404, "ULMS-NOT-FOUND", "unknown cif");
    return ok({ data: db.applications.filter((a) => a.customerId === cust.id).map((a) => ({
      appNo: a.appNo, stage: a.stage, amountMinor: a.amountMinor, createdAt: a.createdAt,
    })) });
  }
  if (p === "/portal/me/payments" && method === "GET") {
    return ok({ data: db.payments.filter((x) => x.loanId === (q("loanId") ?? "")).map((x) => ({
      paidAt: x.paidAt, amountMinor: x.amountMinor, rail: x.rail, reference: x.externalRef,
    })) });
  }
  if (p === "/portal/me/payments/initiate" && method === "POST") {
    const l = loanBy(String(body?.loanId ?? ""));
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    // Q3.1: the REAL backend enforces the payment-confirmation OTP when
    // ulms.portal.otp-required=true (compose default since the Q3 flip); the
    // mock stays lenient — its dev role is journey rehearsal, not the gate
    const rail = String(body?.rail ?? "BKASH");
    return ok({
      id: `int-${Date.now()}`, rail,
      railUrl: `/hooks/checkout/${rail.toLowerCase()}?intent=${Date.now()}&loan=${l.loanNo}`,
      status: "REDIRECT",
    });
  }
  if (seg[0] === "portal" && seg[1] === "me" && seg[2] === "loans" && seg[4] === "statement.csv" && method === "GET") {
    const cust = db.customers.find((c) => c.mobile === (q("mobile") ?? ""));
    const l = db.loans.find((x) => x.id === seg[3] && cust && x.customerId === cust.id);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found for this borrower");
    const csv = ["paid_on,reference,rail,paid_in_taka",
      ...db.payments.filter((x) => x.loanId === l.id)
        .map((x) => `${x.paidAt.slice(0, 10)},${x.externalRef},${x.rail},${x.amountMinor / 100}`)].join("\n");
    return { status: 200, body: csv, headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${l.loanNo}.csv"` } };
  }

  // ---- certificates ----
  if (seg[0] === "certificates" && seg[1] === "tax" && method === "GET") {
    const cust = db.customers.find((c) => c.cifNo === (q("cif") ?? ""));
    if (!cust) return err(404, "ULMS-NOT-FOUND", "unknown cif");
    const paid = db.payments.filter((pm) => {
      const l = db.loans.find((x) => x.id === pm.loanId);
      return l && l.customerId === cust.id;
    }).reduce((s, pm) => s + pm.amountMinor, 0);
    const csv = `ABC Bank Bangladesh\nTax certificate FY ${seg[2]}\nBorrower,${cust.nameEn}\nCIF,${cust.cifNo}\nInterest paid (taka),${(paid * 0.12) / 100}\n`;
    return { status: 200, body: csv, headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="tax-${cust.cifNo}-${seg[2]}.csv"` } };
  }

  // ---- payment-rail webhooks (HMAC over timestamp.body) ----
  if (seg[0] === "hooks" && seg[1] === "payments" && method === "POST") {
    const sig = r.headers["x-ulms-signature"] ?? "";
    const ts = r.headers["x-ulms-timestamp"] ?? "";
    if (!sig) return err(401, "ULMS-WEBHOOK-UNSIGNED", "missing X-ULMS-Signature");
    const raw = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body ?? {});
    const expected = createHmac("sha256", RAIL_SECRET).update(`${ts}.${raw}`).digest("hex");
    if (sig !== expected) return err(401, "ULMS-WEBHOOK-BADSIG", "HMAC mismatch");
    if (Math.abs(Date.now() - Number(ts)) > 5 * 60e3) return err(403, "ULMS-WEBHOOK-STALE", "timestamp outside ±5min window");
    const bodyObj = typeof body === "object" ? body : {};
    const utr = String(bodyObj?.utr ?? "");
    if (!utr) return err(422, "ULMS-VALIDATION-0001", "utr required");
    const replay = db.payments.find((x) => x.utr === utr);
    if (replay) return ok(replay, { "Idempotent-Replay": "true" });
    const loan = db.loans.find((l) => l.loanNo === bodyObj?.loanNo) ?? db.loans[0];
    const pm = {
      id: `p-${db.seq.pay++}`, loanId: loan.id,
      amountMinor: +(bodyObj?.amountMinor ?? 0),
      externalRef: `WEBHOOK-${utr}`, rail: String(seg[2] ?? "RAIL").toUpperCase(),
      utr, fineractTxnId: 95000 + db.seq.pay, paidAt: new Date().toISOString(),
    };
    db.payments.push(pm);
    loan.outstandingMinor = Math.max(0, loan.outstandingMinor - pm.amountMinor);
    return ok(pm);
  }

  // ---- assessments: score/dbr run + CIB batch file channel + revaluation (v1.3/v1.5) ----
  if (seg[0] === "assessments" && seg[2] === "score" && method === "POST") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    a.cibObligationMinor = a.cibObligationMinor ?? 8800000;
    const sc = scoreOf(a);
    a.score = sc.score; a.grade = sc.grade;
    return ok({ score: sc.score, grade: sc.grade, decision: sc.decision, version: 2, dbrPercent: dbrOf(a) });
  }
  if (seg[0] === "assessments" && seg[2] === "dbr" && (method === "POST" || method === "GET")) {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    a.cibObligationMinor = a.cibObligationMinor ?? 8800000;
    const emi = emiMonthly(a.amountMinor, a.tenorMonths, 0.1199);
    return ok({
      monthlyIncomeMinor: a.incomeMinor ?? 0, existingEmiMinor: a.existingEmiMinor ?? 0,
      cibObligationMinor: a.cibObligationMinor, proposedEmiMinor: emi,
      dbrPercent: dbrOf(a), policyMaxPercent: 50,
    });
  }
  if (p === "/assessments/cib/file" && method === "POST") {
    const period = body?.period ?? new Date().toISOString().slice(0, 7);
    audit(actor, "CIB_FILE_STAGE", period, "fixed-width batch file staged for FTP");
    return created({ period, status: "STAGED", records: db.loans.length, format: "fixed-width" });
  }
  if (seg[0] === "assessments" && seg[1] === "collateral" && seg[3] === "valuation" && method === "POST") {
    const a = db.applications.find((x) => x.id === seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    audit(actor, "COLLATERAL_VALUATION", a.appNo, `revalued at ${(body?.valueMinor ?? 0) / 100} ৳`);
    return created({ id: `col-${Date.now()}`, valueMinor: body?.valueMinor ?? 0, valuedOn: new Date().toISOString().slice(0, 10) });
  }

  // ---- compliance: ECL run (v1.5) ----
  if (p === "/compliance/ifrs9/ecl/run" && method === "POST") {
    const rows = BRPD.map((b, idx) => {
      const loans = db.loans.filter((l) => l.classification === b.k);
      const ead = loans.reduce((sum, l) => sum + l.outstandingMinor, 0);
      const pd = [50, 80, 120, 350, 900, 1400, 2200][idx];
      return { stage: b.k, ifrsStage: ["SS", "DF", "B/L"].includes(b.k) ? 3 : b.k === "SMA" ? 2 : 1,
        loans: loans.length, eadMinor: ead, pdBp: pd, lgdBp: 4500,
        eclMinor: Math.round((ead * pd * 4500) / 1e8),
        brpdProvisionMinor: loans.reduce((sum, l) => sum + provisionFor(l), 0) };
    }).filter((r) => r.loans > 0);
    audit(actor, "ECL_RUN", new Date().toISOString().slice(0, 10), `${rows.length} stage rows computed`);
    return ok({ asOf: new Date().toISOString().slice(0, 10), rows,
      eclMinor: rows.reduce((sum, r) => sum + r.eclMinor, 0),
      brpdProvisionMinor: rows.reduce((sum, r) => sum + r.brpdProvisionMinor, 0),
      runwayMonths: 15, mandatoryFrom: "2027-12-01" });
  }

  // ---- servicing: recon + reschedule decision + fee charges (v1.4/v1.5) ----
  if (p === "/loans/payments/reconcile" && method === "POST") {
    const lines = db.payments.slice(-25).map((pm) => ({
      utr: pm.utr ?? pm.externalRef, amountMinor: pm.amountMinor, matched: true }));
    const mismatch = lines.length % 7 === 6 ? 1 : 0;   // deterministic demo exception
    audit(actor, "RECON_RUN", "-", `${lines.length} lines reconciled · ${mismatch} mismatch`);
    return ok({ runDate: new Date().toISOString().slice(0, 10), lines: lines.length,
      matched: lines.length - mismatch, mismatched: mismatch,
      alerts: mismatch ? [{ type: "RECON_MISMATCH", detail: "1 settlement line without a posting" }] : [] });
  }
  if (seg[0] === "loans" && seg[1] === "reschedule" && seg[3] === "decision" && method === "POST") {
    const l = loanBy(seg[2]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "reschedule request not found");
    l.tenorMonths = Math.max(3, l.tenorMonths + 6);
    audit(actor, "RESCHEDULE_DECISION", l.loanNo, body?.approved === false ? "rejected" : "approved — schedule regenerated");
    return ok({ requestId: seg[2], status: body?.approved === false ? "REJECTED" : "APPROVED", newTenorMonths: l.tenorMonths });
  }
  if (seg[0] === "loans" && seg[1] && seg[2] === "fees") {
    const l = loanBy(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    if (method === "GET") return ok({ data: db.loanFees.filter((f) => f.loanId === l.id) });
    if (method === "POST") {
      const fee = { id: `fee-${db.loanFees.length + 1}`, loanId: l.id, code: String(body?.code ?? "PROCESSING"),
        amountMinor: +(body?.amountMinor ?? Math.round(l.principalMinor * 0.01)),
        waived: false, chargedAt: new Date().toISOString() };
      db.loanFees.push(fee);
      audit(actor, "FEE_CHARGE", l.loanNo, `${fee.code} ${(fee.amountMinor / 100).toFixed(0)} ৳`);
      return created(fee);
    }
  }

  // ---- collections: legal-case status transitions (v1.4.1) ----
  if (seg[0] === "collections" && seg[1] === "legal-case" && seg[3] === "status" && method === "POST") {
    const c = db.legalCases.find((x) => x.id === seg[2]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "legal case not found");
    c.status = String(body?.status ?? "HEARING");
    audit(actor, "LEGAL_STATUS", c.id, c.status);
    return ok(c);
  }

  // ---- auth session echo + audit events (R2; dev-role passthrough) ----
  if (p === "/auth/me" && method === "GET") {
    return ok({
      officer: actor, roles: r.roles ?? [], mode: "mock",
      staff: (r.roles ?? []).some((x) => ["branch-officer", "branch-manager", "credit-analyst",
        "ho-credit", "collections", "compliance", "admin"].includes(x)),
    });
  }
  if (p === "/auth/events" && method === "POST") {
    const type = String(body?.type ?? "LOGIN");
    audit(actor, type, "session", `${type} · mode=${String(body?.mode ?? "dev")}`);
    return ok({ recorded: true });
  }

  // ---- dev-only suite determinism hook (audit R1 verification) ----
  // Long-lived DBs accumulate journeys (loans paid to DPD-0, same-date JVs
  // posted) and break e2e repeatability. Playwright globalSetup calls this
  // before workers start. NEVER proxied to the real stack (mock-only route).
  if (p === "/__test/reset" && method === "POST") {
    resetDb();
    return ok({ reset: true });
  }

  return err(404, "ULMS-NOT-FOUND", `no mock route for ${method} ${p}`);
}

// ---------- shared socket helpers (the only place that touches raw I/O) ----------
export async function readMockRequest(req: any): Promise<MockRequest> {
  // originalUrl = full path BEFORE the connect mount stripped its prefix;
  // standalone (no mounts) only has url — same value there.
  const [pathPart, queryPart] = String(req.originalUrl ?? req.url ?? "/").split("?");
  const query: Record<string, string> = {};
  new URLSearchParams(queryPart ?? "").forEach((v, k) => { query[k] = v; });
  const chunks: Buffer[] = [];
  if (req.method !== "GET" && req.method !== "HEAD") {
    for await (const c of req) chunks.push(c as Buffer);
  }
  const rawBody = Buffer.concat(chunks);
  const ctype = String(req.headers["content-type"] ?? "");
  let body: any = rawBody.length ? rawBody : undefined;
  if (ctype.includes("application/json") && rawBody.length) {
    try { body = JSON.parse(rawBody.toString("utf8")); } catch { body = {}; }
  }
  const headers: Record<string, string> = {};
  for (const k of ["x-ulms-signature", "x-ulms-timestamp", "x-api-key", "idempotency-key"]) {
    const v = req.headers[k];
    if (v) headers[k] = String(v);
  }
  return {
    method: String(req.method ?? "GET"),
    path: pathPart ?? "/",
    query, headers, body,
    actor: String(req.headers["x-ulms-actor"] ?? "r.islam"),
    roles: String(req.headers["x-ulms-roles"] ?? "").split(",").map((x) => x.trim()).filter(Boolean),
  };
}
export function writeMockResponse(res: any, out: MockResponse) {
  res.statusCode = out.status;
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", typeof out.body === "string" && out.headers?.["Content-Type"]
    ? out.headers["Content-Type"] : "application/json");
  for (const [k, v] of Object.entries(out.headers ?? {})) {
    if (k !== "Content-Type") res.setHeader(k, v);
  }
  res.end(typeof out.body === "string" ? out.body : JSON.stringify(out.body));
}
export function mountMock(server: any) {
  const handle = async (req: any, res: any) => {
    try {
      writeMockResponse(res, routeMock(await readMockRequest(req)));
    } catch (e: any) {
      writeMockResponse(res, { status: 500, body: problem(500, "ULMS-MOCK-ERROR", String(e?.message ?? e)) });
    }
  };
  // payment-rail webhooks are served at /hooks (root context), not under /api/v1
  server.middlewares.use("/hooks", handle);
  server.middlewares.use("/api", handle);
}

// ---------- Vite plugin ----------
export function ulmsMockApi(options?: { enabled?: boolean }): Plugin {
  const enabled = options?.enabled ?? true;
  return {
    name: "ulms-mock-api",
    configureServer(server) { if (enabled) mountMock(server); },
    configurePreviewServer(server) { if (enabled) mountMock(server); },
  };
}
