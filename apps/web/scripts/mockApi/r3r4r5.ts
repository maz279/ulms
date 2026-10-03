/* ============================================================
   ULMS mock — R3/R4/R5 module (loan products, sanction letters,
   BOCC, transactional outbox, write-off/recovery, guarantors,
   notifications, AML/STR, portal apply, partner channel).
   Business rules mirror the Java slices shipped for CI; every
   route matches packages/openapi v1.7.0.
   ============================================================ */
import { db, audit, emiMonthly } from "./db.ts";
import { ok, created, err, type MockRequest, type MockResponse } from "./plugin.ts";
import { randomBytes } from "node:crypto";
const nodeCrypto = { randomBytes };

type R = MockRequest;

/* ---------- helpers ---------- */
/** Crypto-strong ids/tokens (audit hook: acceptance tokens are security proofs).
 *  Hoisted function declaration — db.ts calls seedR3R4R5() mid-module-cycle. */
function uuid(): string { return randomBytes(12).toString("hex"); }
const custBy = (key: string) => db.customers.find((c) => c.id === key || c.cifNo === key);
const appBy = (key: string) => db.applications.find((a) => a.id === key || a.appNo === key);
const loanByKey = (key: string) => db.loans.find((l) => l.id === key || l.loanNo === key);

/** Transactional outbox writer (ADR-004) — same "transaction" as the state change. */
export function outboxEmit(type: string, aggregateType: string, aggregateId: string, payload: Record<string, unknown>): void {
  db.outbox.push({
    id: uuid(), type, aggregateType, aggregateId, payload,
    state: "PENDING", attempts: 0, createdAt: new Date().toISOString(), relayedAt: null,
  });
}

/** Relay: PENDING → fan-out (renders notifications for lifecycle types) → RELAYED. */
function relayOutbox(): { relayed: number; notifications: number } {
  let relayed = 0, notifications = 0;
  const pending = db.outbox.filter((e) => e.state === "PENDING");
  for (const e of pending) {
    const tpl = db.notifTemplates.find((t) => t.type === e.type && t.channel === "SMS");
    const cif = (e.payload as any).cif as string | undefined;
    const cust = cif ? custBy(cif) : undefined;
    if (tpl && cust) {
      const body = tpl.body.replace("{name}", cust.nameEn).replace("{amount}", String(((e.payload as any).amountMinor ?? 0) / 100));
      db.notifDeliveries.push({
        id: uuid(), type: e.type, cif: cust.cifNo, mobile: cust.mobile, channel: "SMS",
        body, status: "DELIVERED", sentAt: new Date().toISOString(),
      });
      notifications++;
    }
    e.state = "RELAYED"; e.attempts++; e.relayedAt = new Date().toISOString(); relayed++;
  }
  return { relayed, notifications };
}

/* ---------- seeds ---------- */
export function seedR3R4R5(): void {
  const P = (code: string, en: string, bn: string, min: number, max: number, tenorMax: number, rateBp: number,
    security: { collateral: boolean; guarantor: boolean; maxLtvBp: number }) => ({
      code, version: 1, status: "ACTIVE",
      nameEn: en, nameBn: bn,
      minAmountMinor: min, maxAmountMinor: max, defaultAmountMinor: Math.round((min + max) / 40 / 100) * 100 * 100, stepMinor: 500000,
      tenorMinMonths: 6, tenorMaxMonths: tenorMax, tenorDefaultMonths: Math.min(48, tenorMax),
      rateType: "FIXED", rateBp, frequency: "MONTHLY", amortization: "REDUCING",
      prepaymentPenaltyBp: 200, charges: [{ code: "PROCESSING", rateBp: 100 }, { code: "LATE_FEE", rateBp: 200 }],
      security, bilingual: true,
    });
  // first entry MUST stay "sme-term" — the wizard's default option (p1 e2e contract)
  (db as any).products = [
    P("sme-term", "SME Term Loan", "ক্ষুদ্র ঋণ (এসএমই)", 30000000, 500000000, 60, 1300, { collateral: true, guarantor: true, maxLtvBp: 7000 }),
    P("retail-personal", "Personal Loan", "ব্যক্তিগত ঋণ", 5000000, 20000000, 60, 1199, { collateral: false, guarantor: false, maxLtvBp: 0 }),
    P("retail-home", "Home Loan", "গৃহঋণ", 100000000, 2000000000, 300, 950, { collateral: true, guarantor: false, maxLtvBp: 8000 }),
    P("retail-auto", "Auto Loan", "যানবাহন ঋণ", 50000000, 80000000, 84, 1250, { collateral: true, guarantor: false, maxLtvBp: 8000 }),
    P("krishi", "Krishi (Agri) Loan", "কৃষি ঋণ", 5000000, 10000000, 36, 800, { collateral: false, guarantor: true, maxLtvBp: 0 }),
    P("islamic-murabaha", "Halal Auto Murabaha", "হালাল অটো মুরাবাহা", 50000000, 60000000, 60, 1200, { collateral: true, guarantor: false, maxLtvBp: 8000 }),
    P("edu", "Education Loan", "শিক্ষা ঋণ", 10000000, 20000000, 120, 1000, { collateral: false, guarantor: true, maxLtvBp: 0 }),
    P("sme-wc", "SME Working Capital", "এসএমই চালু মূলধন", 50000000, 300000000, 12, 1350, { collateral: true, guarantor: true, maxLtvBp: 6500 }),
  ];
  (db as any).sanctions = [];
  (db as any).boccMeetings = [];
  (db as any).outbox = [];
  (db as any).writeOffs = [];
  (db as any).recoveries = [];
  (db as any).guarantors = [
    { id: uuid(), customerId: "c-5", cif: "CIF-100875", name: "Abdul Karim", nid: "1975123456789",
      mobile: "+8801811223344", cibScore: 712, linkedAmountMinor: 120000000, status: "ACTIVE", checkedAt: "2026-09-12" },
  ];
  (db as any).notifTemplates = [
    { type: "APPLICATION_SUBMITTED", channel: "SMS", lang: "en", body: "Dear {name}, your ULMS application is received. Ref will follow by SMS." },
    { type: "APPLICATION_SUBMITTED", channel: "SMS", lang: "bn", body: "প্রিয় {name}, আপনার আবেদন গৃহীত হয়েছে।" },
    { type: "APPROVED", channel: "SMS", lang: "en", body: "Dear {name}, your loan of BDT {amount} is approved. Sanction letter follows." },
    { type: "APPROVED", channel: "SMS", lang: "bn", body: "প্রিয় {name}, আপনার ঋণ অনুমোদিত হয়েছে।" },
    { type: "DISBURSED", channel: "SMS", lang: "en", body: "Dear {name}, BDT {amount} disbursed. Welcome to ABC Bank." },
    { type: "DISBURSED", channel: "SMS", lang: "bn", body: "প্রিয় {name}, টাকা {amount} ব্যয় করা হয়েছে। ABC ব্যাংকে স্বাগতম।" },
    { type: "EMI_REMINDER", channel: "SMS", lang: "en", body: "Dear {name}, EMI reminder: pay before the 5th to keep your account standard." },
    { type: "EMI_REMINDER", channel: "SMS", lang: "bn", body: "প্রিয় {name}, কিস্তি স্মরণ: হিসাব স্বাভাবিক রাখতে মাসের ৫ তারিখের মধ্যে পরিশোধ করুন।" },
    { type: "OVERDUE", channel: "SMS", lang: "en", body: "Dear {name}, your account is overdue. Please pay to avoid classification impact." },
    { type: "OVERDUE", channel: "SMS", lang: "bn", body: "প্রিয় {name}, আপনার হিসাব অনাদায়ী। শ্রেণিবিন্যাসে প্রভাব এড়াতে দ্রুত পরিশোধ করুন।" },
    { type: "CLASSIFICATION_CHANGED", channel: "SMS", lang: "en", body: "Dear {name}, account status changed per BRPD rules. Contact your branch." },
    { type: "CLASSIFICATION_CHANGED", channel: "SMS", lang: "bn", body: "প্রিয় {name}, বাংলাদেশ ব্যাংক বিধি অনুযায়ী হিসাবের শ্রেণি পরিবর্তিত হয়েছে। শাখায় যোগাযোগ করুন।" },
    { type: "PAYMENT_POSTED", channel: "SMS", lang: "en", body: "Dear {name}, payment of BDT {amount} received. Thank you." },
    { type: "PAYMENT_POSTED", channel: "SMS", lang: "bn", body: "প্রিয় {name}, টাকা {amount} গৃহীত হয়েছে। ধন্যবাদ।" },
    { type: "RECOVERY_RECEIVED", channel: "SMS", lang: "en", body: "Dear {name}, recovery of BDT {amount} recorded on your settled account." },
    { type: "RECOVERY_RECEIVED", channel: "SMS", lang: "bn", body: "প্রিয় {name}, নিষ্পত্তি হিসাবে টাকা {amount} আদায় নথিভুক্ত হয়েছে।" },
  ];
  (db as any).notifDeliveries = [];
  (db as any).strReports = [];
  (db as any).portalDocs = [];
  (db as any).__otp = {};   // R10: OTP store resets with the DB (e2e determinism)
}

/* ---------- router (returns null when not matched) ---------- */
export function routeR3R4R5(r: R): MockResponse | null {
  const method = r.method.toUpperCase();
  const p = (r.path.replace(/^\/(api\/v1|v1)/, "").replace(/\/+$/, "")) || "/";
  const q = (k: string) => r.query[k];
  const body = r.body as any;
  const actor = r.actor || "r.islam";
  const roles = r.roles ?? [];
  const admin = roles.includes("admin") || roles.length === 0;   // open/no-roles dev = admin-like
  const seg = p.split("/").filter(Boolean);
  const D: any = db as any;

  /* ============ R3 — products ============ */
  if (p === "/products" && method === "GET") {
    const rows = q("includeInactive") === "true" ? D.products : D.products.filter((x: any) => x.status === "ACTIVE");
    return ok({ data: rows, meta: { page: 1, size: rows.length, totalElements: rows.length } });
  }
  if (p === "/products" && method === "POST") {
    if (!admin) return err(403, "ULMS-FORBIDDEN", "product administration requires admin");
    if (!body?.code || !body?.nameEn || !(body.maxAmountMinor > 0)) return err(422, "ULMS-VALIDATION-0001", "code, nameEn, maxAmountMinor required");
    // parity with the Java oracle (ProductServiceTest): one live version per
    // code at a time — DRAFT or ACTIVE; superseding happens via activate
    if (D.products.some((x: any) => x.code === body.code && x.status !== "RETIRED")) {
      return err(409, "ULMS-STATE-0002", `active version exists for ${body.code} — version it instead`);
    }
    const product = { version: 1, status: "DRAFT", bilingual: true, rateType: "FIXED", frequency: "MONTHLY",
      amortization: "REDUCING", prepaymentPenaltyBp: 200, charges: [], security: { collateral: false, guarantor: false, maxLtvBp: 0 }, ...body };
    D.products.push(product);
    audit(actor, "PRODUCT_CREATE", product.code, `v1 draft · max ৳${(product.maxAmountMinor / 100).toFixed(0)}`);
    return created(product);
  }
  if (seg[0] === "products" && seg[1] && !seg[2] && method === "GET") {
    const product = D.products.find((x: any) => x.code === seg[1] && x.status !== "RETIRED");
    if (!product) return err(404, "ULMS-NOT-FOUND", `product ${seg[1]} not found`);
    return ok(product);
  }
  if (seg[0] === "products" && seg[1] && !seg[2] && method === "PATCH") {
    if (!admin) return err(403, "ULMS-FORBIDDEN", "product administration requires admin");
    const product = D.products.find((x: any) => x.code === seg[1] && x.status === "DRAFT");
    if (!product) return err(409, "ULMS-STATE-0002", "only DRAFT products are amendable");
    Object.assign(product, body, { code: product.code });
    return ok(product);
  }
  if (seg[0] === "products" && seg[2] === "activate" && method === "POST") {
    if (!admin) return err(403, "ULMS-FORBIDDEN", "product administration requires admin");
    const product = D.products.find((x: any) => x.code === seg[1] && x.status === "DRAFT");
    if (!product) return err(409, "ULMS-STATE-0002", `no DRAFT ${seg[1]} to activate`);
    D.products.filter((x: any) => x.code === seg[1] && x.status === "ACTIVE").forEach((x: any) => { x.status = "RETIRED"; });
    product.status = "ACTIVE";
    audit(actor, "PRODUCT_ACTIVATE", product.code, `v${product.version} active`);
    return ok(product);
  }
  if (seg[0] === "products" && seg[2] === "eligibility" && method === "GET") {
    const product = D.products.find((x: any) => x.code === seg[1] && x.status === "ACTIVE");
    if (!product) return err(404, "ULMS-NOT-FOUND", `product ${seg[1]} not found`);
    const amount = +(q("amountMinor") ?? 0), tenor = +(q("tenorMonths") ?? 0);
    const amountOk = amount >= product.minAmountMinor && amount <= product.maxAmountMinor;
    const tenorOk = tenor >= product.tenorMinMonths && tenor <= product.tenorMaxMonths;
    const emi = amountOk && tenorOk ? emiMonthly(amount, tenor, product.rateBp / 10000) : null;
    return ok({
      product: product.code, eligible: amountOk && tenorOk,
      violations: [...(amountOk ? [] : [`amount must be ৳${product.minAmountMinor / 100}–৳${product.maxAmountMinor / 100}`]),
                   ...(tenorOk ? [] : [`tenor must be ${product.tenorMinMonths}–${product.tenorMaxMonths}m`])],
      emiMinor: emi, rateBp: product.rateBp,
      security: product.security,
    });
  }

  /* ============ R3 — sanction letters ============ */
  if (seg[0] === "sanctions" && seg[2] === "generate" && method === "POST") {
    const a = appBy(seg[1]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    if (a.stage !== "SANCTION") return err(409, "ULMS-STATE-0002", `sanction letter requires SANCTION stage (now ${a.stage})`);
    if (D.sanctions.some((s: any) => s.applicationId === a.id && s.status !== "REPLACED")) {
      return err(409, "ULMS-STATE-0002", "letter already issued for this application");
    }
    const cust = db.customers.find((c: any) => c.id === a.customerId)!;
    const ratePct = (13).toFixed(2);   // product rate at sanction time (R3: snapshot)
    const letter = {
      id: uuid(), applicationId: a.id, appNo: a.appNo, cifNo: cust.cifNo, customerNameEn: cust.nameEn,
      amountMinor: a.amountMinor, tenorMonths: a.tenorMonths, rateBp: 1300,
      status: "ISSUED", acceptanceToken: "tok-" + randomBytes(9).toString("base64url"), acceptedAt: null,
      issuedAt: new Date().toISOString(), bodyEn:
        `SANCTION LETTER — ABC Bank Bangladesh.\nDear ${cust.nameEn},\nYour application ${a.appNo} for BDT ${(a.amountMinor / 100).toLocaleString("en-IN")} over ${a.tenorMonths} months @ ${ratePct}% p.a. (reducing balance) is sanctioned per credit policy and the committee resolution. First EMI falls on the 5th of the month following disbursement. Terms are per the executed agreement; this letter is bilingual and electronically delivered.`,
      bodyBn: `স্যাংকশন চিঠি — এবিসি ব্যাংক বাংলাদেশ।\nপ্রিয় ${cust.nameBn ?? cust.nameEn},\nআপনার ${a.appNo} আবেদন ৳${(a.amountMinor / 100).toLocaleString("en-IN")} (${a.tenorMonths} মাস, ${ratePct}%) অনুমোদিত হয়েছে।`,
    };
    D.sanctions.push(letter);
    outboxEmit("APPROVED", "application", a.id, { cif: cust.cifNo, amountMinor: a.amountMinor });
    audit(actor, "SANCTION_ISSUE", a.appNo, `letter ${letter.id} · tokenized acceptance link`);
    return created(letter);
  }
  if (p === "/sanctions" && method === "GET") {
    // list recent letters (page rehydration after navigation)
    return ok({ data: D.sanctions.slice().reverse(), meta: { page: 1, size: D.sanctions.length, totalElements: D.sanctions.length } });
  }
  if (seg[0] === "sanctions" && seg[1] && !seg[2] && method === "GET") {
    const s = D.sanctions.find((x: any) => x.id === seg[1]);
    if (!s) return err(404, "ULMS-NOT-FOUND", "letter not found");
    return ok(s);
  }
  if (seg[0] === "sanctions" && seg[2] === "accept" && method === "POST") {
    const s = D.sanctions.find((x: any) => x.id === seg[1]);
    if (!s) return err(404, "ULMS-NOT-FOUND", "letter not found");
    if (q("token") !== s.acceptanceToken) return err(409, "ULMS-SIGNOFF-0001", "acceptance token mismatch");
    if (s.status === "ACCEPTED") return ok(s);
    s.status = "ACCEPTED"; s.acceptedAt = new Date().toISOString();
    audit("customer:" + s.cifNo, "SANCTION_ACCEPT", s.appNo, "tokenized acceptance recorded");
    return ok(s);
  }
  if (seg[0] === "sanctions" && seg[2] === "resend" && method === "POST") {
    const s = D.sanctions.find((x: any) => x.id === seg[1]);
    if (!s) return err(404, "ULMS-NOT-FOUND", "letter not found");
    db.notifDeliveries.push({ id: uuid(), type: "SANCTION_RESEND", cif: s.cifNo, mobile: "+88017xxxxxxx",
      channel: "SMS", body: `Sanction letter for ${s.appNo} re-dispatched`, status: "DELIVERED", sentAt: new Date().toISOString() });
    audit(actor, "SANCTION_RESEND", s.appNo, "SMS + email + branch copy");
    return ok({ ...s, resentAt: new Date().toISOString() });
  }

  /* ============ R3 — BOCC ============ */
  if (p === "/bocc/meetings" && method === "GET") {
    return ok({ data: D.boccMeetings, meta: { page: 1, size: D.boccMeetings.length, totalElements: D.boccMeetings.length } });
  }
  if (p === "/bocc/meetings" && method === "POST") {
    if (!body?.branchCode || !Array.isArray(body?.members) || body.members.length < 3) {
      return err(422, "ULMS-VALIDATION-0001", "branchCode and ≥3 members required (quorum needs 3)");
    }
    // agenda auto-build: pending committee-band cases at the branch (APPROVAL stage)
    const cases = db.applications.filter((a) => a.stage === "APPROVAL" && a.branchCode === body.branchCode).slice(0, 9)
      .map((a) => ({ caseId: a.id, appNo: a.appNo, cifNo: db.customers.find((c: any) => c.id === a.customerId)?.cifNo ?? "",
        amountMinor: a.amountMinor, stage: a.stage }));
    const meeting = {
      id: uuid(), branchCode: body.branchCode, date: body.date ?? new Date(Date.now() + 86400e3).toISOString().slice(0, 10),
      members: body.members, agenda: cases, attendance: [], votes: [],
      minutes: null, status: "SCHEDULED", quorumNeeded: Math.floor(body.members.length / 2) + 1,   // simple majority
    };
    D.boccMeetings.push(meeting);
    audit(actor, "BOCC_SCHEDULE", body.branchCode, `${cases.length} cases listed for ${meeting.date}`);
    return created(meeting);
  }
  if (seg[0] === "bocc" && seg[1] === "meetings" && seg[2] && !seg[3] && method === "GET") {
    const m = D.boccMeetings.find((x: any) => x.id === seg[2]);
    if (!m) return err(404, "ULMS-NOT-FOUND", "meeting not found");
    return ok(m);
  }
  if (seg[0] === "bocc" && seg[3] === "attendance" && method === "POST") {
    const m = D.boccMeetings.find((x: any) => x.id === seg[2]);
    if (!m) return err(404, "ULMS-NOT-FOUND", "meeting not found");
    if (m.status !== "SCHEDULED" && m.status !== "HELD") return err(409, "ULMS-STATE-0002", "meeting closed");
    if (!m.members.includes(body?.member)) return err(422, "ULMS-VALIDATION-0001", "member not on the panel");
    if (m.attendance.some((a: any) => a.member === body.member)) return err(409, "ULMS-STATE-0002", "already checked in");
    m.attendance.push({ member: body.member, signedAt: new Date().toISOString() });
    m.status = "HELD";
    return ok(m);
  }
  if (seg[0] === "bocc" && seg[3] === "vote" && method === "POST") {
    const m = D.boccMeetings.find((x: any) => x.id === seg[2]);
    if (!m) return err(404, "ULMS-NOT-FOUND", "meeting not found");
    if (m.status === "CLOSED") return err(409, "ULMS-STATE-0002", "meeting closed");
    if (!["APPROVE", "REJECT", "HOLD", "DEFER"].includes(body?.vote)) return err(422, "ULMS-VALIDATION-0001", "vote must be APPROVE|REJECT|HOLD|DEFER");
    if (!m.agenda.some((c: any) => c.caseId === body.caseId)) return err(422, "ULMS-VALIDATION-0001", "case not on the agenda");
    if (!m.attendance.some((a: any) => a.member === body.member)) return err(403, "ULMS-FORBIDDEN", "only checked-in members vote");
    if (m.votes.some((v: any) => v.caseId === body.caseId && v.member === body.member)) {
      return err(409, "ULMS-STATE-0002", "one vote per member per case");
    }
    const vote = { caseId: body.caseId, member: body.member, vote: body.vote, dissent: body.dissent ?? null, votedAt: new Date().toISOString() };
    m.votes.push(vote);
    return ok(vote);
  }
  if (seg[0] === "bocc" && seg[3] === "close" && method === "POST") {
    const m = D.boccMeetings.find((x: any) => x.id === seg[2]);
    if (!m) return err(404, "ULMS-NOT-FOUND", "meeting not found");
    if (m.status === "CLOSED") return err(409, "ULMS-STATE-0002", "already closed");
    if (m.attendance.length < m.quorumNeeded) {
      return err(409, "ULMS-BOCC-0001", `quorum not met: ${m.attendance.length}/${m.quorumNeeded} present`);
    }
    const resolutions = m.agenda.map((c: any) => {
      const votes = m.votes.filter((v: any) => v.caseId === c.caseId);
      const approve = votes.filter((v: any) => v.vote === "APPROVE").length;
      const resolution = approve > votes.length / 2 ? "RECOMMEND_APPROVE"
        : votes.some((v: any) => v.vote === "REJECT") ? "REJECT" : "HOLD";
      return { appNo: c.appNo, resolution, votes: votes.length, dissent: votes.filter((v: any) => v.dissent).map((v: any) => v.member) };
    });
    m.minutes = {
      draft: true, closedAt: new Date().toISOString(),
      text: `BOCC minutes — ${m.branchCode} ${m.date}. Present: ${m.attendance.map((a: any) => a.member).join(", ")}.\n` +
        resolutions.map((r: any) => `${r.appNo}: ${r.resolution} (${r.votes} votes${r.dissent.length ? `; dissent: ${r.dissent.join(", ")}` : ""})`).join("\n"),
      resolutions,
    };
    m.status = "CLOSED";
    for (const r of resolutions) audit(actor, "BOCC_RESOLUTION", r.appNo, r.resolution);
    audit(actor, "BOCC_CLOSE", m.branchCode, "auto-minutes drafted");
    outboxEmit("BOCC_CLOSED", "bocc_meeting", m.id, { branch: m.branchCode, cases: resolutions.length });
    return ok(m.minutes);
  }

  /* ============ R3 — outbox ============ */
  if (p === "/outbox" && method === "GET") {
    if (!admin) return err(403, "ULMS-FORBIDDEN", "outbox is an admin ops view");
    return ok({ data: D.outbox.slice(-50).reverse(), meta: { page: 1, size: 50, totalElements: D.outbox.length } });
  }
  if (p === "/outbox/relay" && method === "POST") {
    if (!admin) return err(403, "ULMS-FORBIDDEN", "outbox is an admin ops view");
    return ok(relayOutbox());
  }

  /* ============ R4 — write-off & recovery ============ */
  if (seg[0] === "collections" && seg[2] === "write-off" && method === "POST") {
    const l = loanByKey(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    if (!["SS", "DF", "B/L"].includes(l.classification)) {
      return err(422, "ULMS-VALIDATION-0001", `write-off requires SS/DF/B-L classification (now ${l.classification})`);
    }
    if (D.writeOffs.some((w: any) => w.loanId === l.id && w.state !== "REVERSED")) {
      return err(409, "ULMS-STATE-0002", "write-off already in flight for this loan");
    }
    const w = {
      id: uuid(), loanId: l.id, loanNo: l.loanNo, cifNo: db.customers.find((c: any) => c.id === l.customerId)?.cifNo ?? "",
      amountMinor: l.outstandingMinor, provisionAtProposalMinor: Math.round(l.outstandingMinor *
        { SS: 0.2, DF: 0.5, "B/L": 1 }[l.classification as "SS"] ?? 1),
      classification: l.classification, state: "PROPOSED",
      proposedBy: actor, proposedAt: new Date().toISOString(),
      boardBand: l.outstandingMinor > 10000000000 ? "BOARD" : "EXEC_COMMITTEE",
      approvedAt: null, reversedAt: null, glRef: null,
    };
    D.writeOffs.push(w);
    audit(actor, "WO_PROPOSE", l.loanNo, `৳${(w.amountMinor / 100).toFixed(0)} · ${w.boardBand}`);
    return created(w);
  }
  if (p === "/write-offs" && method === "GET") {
    return ok({ data: D.writeOffs, meta: { page: 1, size: D.writeOffs.length, totalElements: D.writeOffs.length } });
  }
  if (seg[0] === "write-offs" && seg[2] === "approve" && method === "POST") {
    const w = D.writeOffs.find((x: any) => x.id === seg[1]);
    if (!w) return err(404, "ULMS-NOT-FOUND", "write-off not found");
    if (w.state !== "PROPOSED") return err(409, "ULMS-STATE-0002", `approve requires PROPOSED (now ${w.state})`);
    w.state = "EXECUTED"; w.approvedAt = new Date().toISOString();
    w.glRef = "WO-" + Date.now();
    const l = db.loans.find((x: any) => x.id === w.loanId)!;
    l.outstandingMinor = 0; (l as any).closed = true;
    audit(actor, "WO_APPROVE", w.loanNo, `GL JV ${w.glRef} · CIB flag queued`);
    outboxEmit("WRITE_OFF_EXECUTED", "loan", w.loanId, { cif: w.cifNo, amountMinor: w.amountMinor });
    return ok(w);
  }
  if (seg[0] === "write-offs" && seg[2] === "reverse" && method === "POST") {
    const w = D.writeOffs.find((x: any) => x.id === seg[1]);
    if (!w) return err(404, "ULMS-NOT-FOUND", "write-off not found");
    if (w.state !== "EXECUTED") return err(409, "ULMS-STATE-0002", "only EXECUTED write-offs reverse");
    w.state = "REVERSED"; w.reversedAt = new Date().toISOString();
    const l = db.loans.find((x: any) => x.id === w.loanId)!;
    l.outstandingMinor = w.amountMinor; (l as any).closed = false;
    audit(actor, "WO_REVERSE", w.loanNo, "recovery-driven reversal");
    return ok(w);
  }
  if (seg[0] === "collections" && seg[2] === "recoveries" && method === "GET") {
    const l = loanByKey(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    return ok({ data: D.recoveries.filter((x: any) => x.loanId === l.id) });
  }
  if (seg[0] === "collections" && seg[2] === "recoveries" && method === "POST") {
    const l = loanByKey(seg[1]);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found");
    if (!(+(body?.amountMinor ?? 0) > 0)) return err(422, "ULMS-VALIDATION-0001", "amountMinor must be positive");
    const entry = {
      id: uuid(), loanId: l.id, loanNo: l.loanNo, cifNo: db.customers.find((c: any) => c.id === l.customerId)?.cifNo ?? "",
      amountMinor: +body.amountMinor, mode: body.mode ?? "CASH",
      incentiveMinor: Math.round(+body.amountMinor * 0.05),   // recovery incentive policy: 5%
      receivedAt: new Date().toISOString(), receivedBy: actor,
    };
    D.recoveries.push(entry);
    audit(actor, "RECOVERY", l.loanNo, `৳${(entry.amountMinor / 100).toFixed(0)} · incentive ৳${(entry.incentiveMinor / 100).toFixed(0)}`);
    outboxEmit("RECOVERY_RECEIVED", "loan", l.id, { cif: entry.cifNo, amountMinor: entry.amountMinor });
    return created(entry);
  }

  /* ============ R4 — guarantors ============ */
  if (seg[0] === "customers" && seg[2] === "guarantors" && method === "GET") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "customer not found");
    return ok({ data: D.guarantors.filter((g: any) => g.customerId === c.id) });
  }
  if (seg[0] === "customers" && seg[2] === "guarantors" && method === "POST") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "customer not found");
    if (!body?.name || !/^\+8801\d{9}$/.test(String(body.mobile ?? ""))) {
      return err(422, "ULMS-VALIDATION-0001", "name and BD mobile required");
    }
    const score = 650 + (Math.abs(body.name.length * 17 + body.mobile.length * 31) % 180);
    const g = {
      id: uuid(), customerId: c.id, cif: c.cifNo, name: body.name, nid: body.nid ?? null,
      mobile: body.mobile, cibScore: score, cibStatus: score >= 680 ? "CLEAR" : "REFER",
      linkedAmountMinor: +(body.linkedAmountMinor ?? 0), status: "ACTIVE", checkedAt: new Date().toISOString().slice(0, 10),
    };
    D.guarantors.push(g);
    audit(actor, "GUARANTOR_ADD", c.cifNo, `${g.name} · CIB ${g.cibScore} ${g.cibStatus}`);
    outboxEmit("GUARANTOR_ADDED", "customer", c.id, { cif: c.cifNo });
    return created(g);
  }

  /* ============ R4 — notifications ============ */
  if (p === "/notifications/templates" && method === "GET") {
    return ok({ data: D.notifTemplates, meta: { page: 1, size: D.notifTemplates.length, totalElements: D.notifTemplates.length } });
  }
  if (p === "/notifications/templates" && method === "POST") {
    if (!admin) return err(403, "ULMS-FORBIDDEN", "template administration requires admin");
    if (!body?.type || !body?.body || !body?.lang) return err(422, "ULMS-VALIDATION-0001", "type, lang, body required");
    const i = D.notifTemplates.findIndex((t: any) => t.type === body.type && t.channel === (body.channel ?? "SMS") && t.lang === body.lang);
    const tpl = { type: body.type, channel: body.channel ?? "SMS", lang: body.lang, body: body.body };
    if (i >= 0) D.notifTemplates[i] = tpl; else D.notifTemplates.push(tpl);
    audit(actor, "NOTIF_TEMPLATE", tpl.type, `${tpl.lang}/${tpl.channel} upsert (maker-checker)`);
    return created(tpl);
  }
  if (p === "/notifications/outbox" && method === "GET") {
    return ok({ data: D.notifDeliveries.slice(-50).reverse(), meta: { page: 1, size: 50, totalElements: D.notifDeliveries.length } });
  }
  if (p === "/notifications/send" && method === "POST") {
    if (!body?.type) return err(422, "ULMS-VALIDATION-0001", "type required");
    const tpl = D.notifTemplates.find((t: any) => t.type === body.type && t.channel === (body.channel ?? "SMS"));
    if (!tpl) return err(404, "ULMS-NOT-FOUND", `no ${body.type} template`);
    const c = body.cif ? custBy(String(body.cif)) : undefined;
    const rendered = tpl.body.replace("{name}", c?.nameEn ?? body.name ?? "customer")
      .replace("{amount}", String((body.amountMinor ?? 0) / 100));
    const d = { id: uuid(), type: tpl.type, cif: c?.cifNo ?? null, mobile: c?.mobile ?? body.mobile ?? null,
      channel: tpl.channel, body: rendered, status: "DELIVERED", sentAt: new Date().toISOString() };
    D.notifDeliveries.push(d);
    audit(actor, "NOTIF_SEND", tpl.type, `${tpl.channel} → ${d.mobile ?? "n/a"}`);
    return ok(d);
  }

  /* ============ R4 — AML / STR ============ */
  if (seg[0] === "customers" && seg[2] === "aml" && method === "GET") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "customer not found");
    return ok({
      cifNo: c.cifNo, cddLevel: (c as any).risk === "High" ? "EDD" : "CDD",
      risk: (c as any).risk ?? "Low",
      screeningHits: db.screeningHits.filter((h: any) => h.customerId === c.id),
      strs: D.strReports.filter((s: any) => s.cifNo === c.cifNo),
    });
  }
  if (seg[0] === "customers" && seg[2] === "str" && method === "POST") {
    const c = custBy(seg[1]);
    if (!c) return err(404, "ULMS-NOT-FOUND", "customer not found");
    if (!body?.reason || String(body.reason).length < 20) {
      return err(422, "ULMS-VALIDATION-0001", "STR reason must be descriptive (≥20 chars) per BFIU practice");
    }
    const s = { id: uuid(), cifNo: c.cifNo, reason: body.reason, amountMinor: +(body.amountMinor ?? 0),
      status: "FILED", filedBy: actor, filedAt: new Date().toISOString(), bfiuRef: "BFIU-" + Date.now() };
    D.strReports.push(s);
    audit(actor, "STR_FILE", c.cifNo, `ref ${s.bfiuRef}`);
    return created(s);
  }

  /* ============ R10 P-D — portal OTP (login + payment confirmation) ============ */
  const otpStore: Record<string, { code: string; expires: number; attempts: number; consumed: boolean }> =
    (db as any).__otp ?? ((db as any).__otp = {});
  if (p === "/portal/otp" && method === "POST") {
    const m = String(body?.mobile ?? "");
    if (!/^\+8801\d{9}$/.test(m)) return err(422, "ULMS-VALIDATION-0001", "BD mobile required (+8801…)");
    const live = otpStore[m];
    if (live && !live.consumed && live.expires > Date.now()) {
      return err(429, "ULMS-RATELIMIT", "an active code already exists — wait for expiry");
    }
    // crypto-random 6-digit code (mock surfaces it as devCode — dev parity only)
    const code = String(100000 + Math.floor(nodeCrypto.randomBytes(4).readUInt32BE(0) % 900000));
    otpStore[m] = { code, expires: Date.now() + 5 * 60_000, attempts: 0, consumed: false };
    audit(actor, "OTP_ISSUED", m.slice(0, 7) + "…" + m.slice(-3), "login/payment-confirm");
    return { status: 202, body: { requestId: uuid(), ttlSeconds: 300, devCode: code } };
  }
  if (p === "/portal/otp/verify" && method === "POST") {
    const m = String(body?.mobile ?? "");
    const row = otpStore[m];
    if (!row || row.consumed || row.expires <= Date.now()) return err(401, "ULMS-AUTH", "no active code — request one first");
    if (row.attempts >= 5) return err(429, "ULMS-RATELIMIT", "too many attempts — request a new code");
    row.attempts++;
    if (String(body?.code) !== row.code) return err(401, "ULMS-AUTH", "code mismatch");
    row.consumed = true;
    return ok({ otpToken: uuid() });
  }

  /* ============ R5 — portal depth ============ */
  if (p === "/portal/me/applications" && method === "POST") {
    const cust = db.customers.find((c) => c.mobile === String(body?.mobile ?? ""));
    if (!cust) return err(404, "ULMS-NOT-FOUND", "no borrower with that registered mobile");
    const product = D.products.find((x: any) => x.code === body.productCode && x.status === "ACTIVE");
    if (!product) return err(422, "ULMS-VALIDATION-0001", `unknown product ${body.productCode}`);
    if (!(+body.amountMinor >= product.minAmountMinor && +body.amountMinor <= product.maxAmountMinor)) {
      return err(422, "ULMS-VALIDATION-0001", `amount outside ${product.code} bounds`);
    }
    const a = {
      id: `a-${db.seq.app++}`, appNo: `APP-${8100 + db.seq.app}`, customerId: cust.id,
      productCode: product.code, amountMinor: +body.amountMinor, tenorMonths: +body.tenorMonths,
      rateType: product.rateType, stage: "SCREENING", dbrPercent: null,
      incomeMinor: +body.incomeMinor ?? null, existingEmiMinor: 0, cibObligationMinor: null,
      fineractLoanId: null, branchCode: cust.branchCode, createdAt: new Date().toISOString(),
      version: 1, workflowNode: null, workflowPhase: null, workflowSla: null, score: null, grade: null,
      channel: "PORTAL",
    };
    db.applications.push(a as any);
    outboxEmit("APPLICATION_SUBMITTED", "application", a.id, { cif: cust.cifNo, amountMinor: a.amountMinor });
    audit("customer:" + cust.cifNo, "PORTAL_APPLY", a.appNo, `${product.code} ৳${(a.amountMinor / 100).toFixed(0)}`);
    return created(a);
  }
  if (p === "/portal/me/documents" && method === "POST") {
    const cust = db.customers.find((c) => c.mobile === String(body?.mobile ?? ""));
    if (!cust) return err(404, "ULMS-NOT-FOUND", "no borrower with that registered mobile");
    if (!body?.docType || !body?.sha256 || String(body.sha256).length !== 64) {
      return err(422, "ULMS-VALIDATION-0001", "docType and 64-char sha256 required");
    }
    const doc = { id: uuid(), customerId: cust.id, cifNo: cust.cifNo, appId: body.appId ?? null,
      docType: body.docType, sha256: body.sha256, sizeBytes: +(body.sizeBytes ?? 0),
      scanStatus: "CLEAN", uploadedAt: new Date().toISOString(), channel: "PORTAL" };
    D.portalDocs.push(doc);
    audit("customer:" + cust.cifNo, "PORTAL_DOC", cust.cifNo, `${doc.docType} sha ${doc.sha256.slice(0, 12)}…`);
    return created(doc);
  }
  if (seg[0] === "portal" && seg[1] === "me" && seg[2] === "loans" && seg[4] === "statement" && method === "GET") {
    const cust = db.customers.find((c) => c.mobile === (q("mobile") ?? ""));
    const l = db.loans.find((x) => x.id === seg[3] && cust && x.customerId === cust.id);
    if (!l) return err(404, "ULMS-NOT-FOUND", "loan not found for this borrower");
    const rows = db.payments.filter((x) => x.loanId === l.id).map((x) => ({
      paidOn: x.paidAt.slice(0, 10), reference: x.externalRef, rail: x.rail,
      paidInMinor: x.amountMinor, outstandingAfterMinor: l.outstandingMinor }));
    if (q("format") === "csv") {
      const csv = ["paid_on,reference,rail,paid_in_taka", ...rows.map((x) => `${x.paidOn},${x.reference},${x.rail},${x.paidInMinor / 100}`)].join("\n");
      return { status: 200, body: csv, headers: { "Content-Type": "text/csv" } };
    }
    return ok({ loanNo: l.loanNo, rows });
  }

  /* ============ R5 — partner channel ============ */
  if (p === "/partner/applications" && method === "POST") {
    const apiKey = String(r.headers["x-api-key"] ?? "");
    if (!apiKey) return err(401, "ULMS-PARTNER-0001", "X-Api-Key required");
    const envKey = process.env.ULMS_PARTNER_API_KEY;
    if (envKey && apiKey !== envKey) return err(401, "ULMS-PARTNER-0001", "unknown partner key");
    // rate limit: 60/min per key (token bucket in-memory)
    const now2 = Date.now();
    (D as any).rl = (D as any).rl ?? {};
    const b = (D.rl[apiKey] = D.rl[apiKey] ?? { tokens: 60, ts: now2 });
    const refill = Math.min(60, b.tokens + ((now2 - b.ts) / 1000));
    if (refill < 1) return err(429, "ULMS-RATE-0001", "partner rate limit (60/min) exceeded");
    b.tokens = refill - 1; b.ts = now2;
    const idem = r.headers["idempotency-key"];
    if (idem && D.portalDocs /* cheap guard */) {
      const prior = db.applications.find((a: any) => (a as any).partnerIdem === idem);
      if (prior) return ok(prior);
    }
    const c = custBy(String(body?.cif ?? ""));
    if (!c) return err(422, "ULMS-VALIDATION-0001", "cif must reference an existing customer");
    const product = D.products.find((x: any) => x.code === body.productCode && x.status === "ACTIVE");
    if (!product) return err(422, "ULMS-VALIDATION-0001", `unknown product ${body.productCode}`);
    const a = {
      id: `a-${db.seq.app++}`, appNo: `APP-${9100 + db.seq.app}`, customerId: c.id,
      productCode: product.code, amountMinor: +body.amountMinor, tenorMonths: +body.tenorMonths,
      rateType: product.rateType, stage: "SCREENING", dbrPercent: null, incomeMinor: +body.incomeMinor ?? null,
      existingEmiMinor: 0, cibObligationMinor: null, fineractLoanId: null, branchCode: c.branchCode,
      createdAt: new Date().toISOString(), version: 1, workflowNode: null, workflowPhase: null,
      workflowSla: null, score: null, grade: null, channel: "PARTNER", partnerKey: apiKey.slice(0, 6) + "…",
      partnerIdem: idem ?? null,
    };
    db.applications.push(a as any);
    outboxEmit("APPLICATION_SUBMITTED", "application", a.id, { cif: c.cifNo, amountMinor: a.amountMinor });
    audit("partner:" + a.partnerKey, "PARTNER_APPLY", a.appNo, `${product.code} via API`);
    return created(a);
  }
  if (seg[0] === "partner" && seg[1] === "applications" && seg[3] === "status" && method === "GET") {
    const apiKey = String(r.headers["x-api-key"] ?? "");
    if (!apiKey) return err(401, "ULMS-PARTNER-0001", "X-Api-Key required");
    const a = db.applications.find((x) => x.id === seg[2]);
    if (!a) return err(404, "ULMS-NOT-FOUND", "application not found");
    const task = db.tasks.find((t) => t.appId === a.id && t.status === "OPEN");
    return ok({ appNo: a.appNo, stage: a.stage, workflowNode: task ? task.node : a.workflowNode,
      slaDeadline: task?.slaDeadline ?? null, channel: (a as any).channel });
  }

  return null;
}
