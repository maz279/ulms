/* ULMS Technical Presentation — pptxgenjs single-pass builder.
   Palette (content-informed): bank-indigo from the product's own tokens.
   BG white F7F8FC-ish / PRIMARY 1E2660 navy / ACCENT F0C441 gold.
   Motif: rounded screenshot frames + oversized stat numbers.
   Fonts: Calibri throughout (matches the Word documentation house style). */
const pptxgen = require("pptxgenjs");
const path = require("path");

const W = 13.33, H = 7.5, M = 0.5;
const NAVY = "1E2660", MID = "3F51B5", LIGHT = "C5CAE9", PALE = "F0F2FB";
const GOLD = "F0C441", OK = "107C10", ERR = "C50F1F", INK = "1A1F36", MUTED = "5A6178";
const F = "Calibri";
const DIR = __dirname;
const img = (f) => path.join(DIR, f);

let p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "Unisoft Systems Limited";
p.title = "ULMS v2.0 — Technical Presentation";

const bu = () => ({ code: "25B8", indent: 12, color: MID });
const shadow = () => ({ type: "outer", color: "0D1233", blur: 7, offset: 2, angle: 45, opacity: 0.18 });

function light(s) { s.background = { color: "FFFFFF" }; }
function titleBar(s, kicker, title) {
  s.addText(kicker.toUpperCase(), { x: M, y: 0.32, w: W - 2 * M, h: 0.3, fontFace: F, fontSize: 12,
    color: MID, bold: true, charSpacing: 3, margin: 0 });
  s.addText(title, { x: M, y: 0.58, w: W - 2 * M, h: 0.75, fontFace: F, fontSize: 32,
    color: NAVY, bold: true, margin: 0 });
}
function pageFoot(s, n) {
  s.addText(`ULMS v2.0 · October 2026`, { x: M, y: H - 0.42, w: 4, h: 0.3, fontFace: F, fontSize: 10,
    color: MUTED, margin: 0 });
  s.addText(String(n), { x: W - M - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontFace: F, fontSize: 10,
    color: MUTED, align: "right", margin: 0 });
}
function frame(s, file, x, y, w, h, caption) {
  // 1280x720 screenshots & exhibit PNGs — cover-crop inside a rounded frame
  s.addImage({ path: img(file), x, y, w, h, sizing: { type: "cover", w, h }, rounding: false });
  if (caption) s.addText(caption, { x, y: y + h + 0.06, w, h: 0.3, fontFace: F, fontSize: 11,
    color: MUTED, italic: true, margin: 0 });
}

/* ---------- 1 · Title (dark) ---------- */
let s = p.addSlide();
s.background = { color: NAVY };
s.addShape(p.shapes.OVAL, { x: 9.4, y: -1.6, w: 5.6, h: 5.6, fill: { color: MID, transparency: 72 }, line: { type: "none" } });
s.addShape(p.shapes.OVAL, { x: 10.6, y: 4.9, w: 4.4, h: 4.4, fill: { color: GOLD, transparency: 82 }, line: { type: "none" } });
s.addText("UNISOFT SYSTEMS LIMITED", { x: M, y: 1.0, w: 9, h: 0.4, fontFace: F, fontSize: 14, color: GOLD, bold: true, charSpacing: 4, margin: 0 });
s.addText("ULMS", { x: M, y: 1.7, w: 10, h: 1.5, fontFace: F, fontSize: 88, color: "FFFFFF", bold: true, margin: 0 });
s.addText("Unisoft Loan Management System — Technical Overview", { x: M, y: 3.3, w: 10.5, h: 0.6, fontFace: F, fontSize: 24, color: LIGHT, margin: 0 });
s.addText("Bank-grade lending for Bangladesh scheduled banks · Staff web · Borrower app · Field app · Fineract core",
  { x: M, y: 4.0, w: 10.5, h: 0.5, fontFace: F, fontSize: 15, color: LIGHT, margin: 0 });
s.addText([
  { text: "16 modules · 162 REST endpoints · 18 migrations", options: { breakLine: true } },
  { text: "193 Java tests · 44 e2e journeys · 12 runbooks", options: {} },
], { x: M, y: 5.9, w: 7, h: 0.9, fontFace: F, fontSize: 14, color: GOLD, margin: 0, lineSpacingMultiple: 1.3 });
s.addText("October 2026", { x: W - M - 2.4, y: H - 0.65, w: 2.4, h: 0.35, fontFace: F, fontSize: 12, color: LIGHT, align: "right", margin: 0 });

/* ---------- 2 · Agenda ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Agenda", "What this deck covers");
const agenda = [
  ["01", "System at a glance", "KPIs, scope, architecture"],
  ["02", "Technology stack", "Binding stack v3 — every layer"],
  ["03", "Modules & functions", "All 16 backend modules"],
  ["04", "Regulatory engine", "BRPD 15/2024 · ECL · Basel · AML"],
  ["05", "Quality gates", "311 tests across five suites"],
  ["06", "The three apps", "Staff web · borrower · field"],
  ["07", "Deploy · enhance · secure", "Environments, extension recipe, controls"],
  ["08", "Boundaries & roadmap", "What is externally bound, what is next"],
];
agenda.forEach(([n, t, d], i) => {
  const col = i < 4 ? 0 : 1, row = i % 4;
  const x = M + col * 6.3, y = 1.75 + row * 1.32;
  s.addText(n, { x, y, w: 0.9, h: 1.1, fontFace: F, fontSize: 40, color: PALE, bold: true, margin: 0 });
  s.addText(t, { x: x + 1.0, y: y + 0.12, w: 4.9, h: 0.4, fontFace: F, fontSize: 18, color: NAVY, bold: true, margin: 0 });
  s.addText(d, { x: x + 1.0, y: y + 0.55, w: 4.9, h: 0.35, fontFace: F, fontSize: 13, color: MUTED, margin: 0 });
});
pageFoot(s, 2);

/* ---------- 3 · KPIs (oversized numbers motif) ---------- */
s = p.addSlide(); light(s);
titleBar(s, "System at a glance", "The program in seven numbers");
const kpis = [
  ["16", "backend modules", NAVY], ["162", "REST endpoints", NAVY], ["18", "Flyway migrations", NAVY],
  ["193", "Java tests (last full)", MID], ["44", "e2e journeys", MID],
  ["2", "mobile apps shipped", NAVY], ["12", "ops runbooks", MID],
];
kpis.forEach(([v, l, c], i) => {
  const x = M + i * 1.78;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 2.3, w: 1.62, h: 2.3, rectRadius: 0.09,
    fill: { color: PALE }, line: { color: LIGHT, width: 0.75 }, shadow: shadow() });
  s.addText(v, { x, y: 2.5, w: 1.62, h: 1.1, fontFace: F, fontSize: 44, color: c, bold: true, align: "center", margin: 0 });
  s.addText(l, { x: x + 0.08, y: 3.6, w: 1.46, h: 0.8, fontFace: F, fontSize: 11.5, color: MUTED, align: "center", margin: 0 });
});
s.addText([
  { text: "Modular monolith by binding decision — one deployable unit, module boundaries enforced by Spring Modulith. ", options: { bold: true } },
  { text: "Apache Fineract CE is the immutable loan subledger; ULMS mirrors state for BRPD boards and projections. Build stage complete; bank cutover items follow the RB-11A flip runbook.", options: {} },
], { x: M, y: 5.1, w: W - 2 * M, h: 1.2, fontFace: F, fontSize: 14, color: INK, margin: 0, lineSpacingMultiple: 1.25 });
pageFoot(s, 3);

/* ---------- 4 · Architecture ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Architecture", "Three clients · one modular monolith · bank cores");
s.addImage({ path: img("exhibits/E1_architecture.png"), x: 0.7, y: 1.7, w: 8.2, h: 4.45 });
s.addText("Key decisions", { x: 9.3, y: 1.8, w: 3.4, h: 0.4, fontFace: F, fontSize: 16, color: NAVY, bold: true, margin: 0 });
s.addText([
  { text: "Modular monolith (stack v3) — cycles broken with owned ports", options: { bullet: bu(), breakLine: true } },
  { text: "Contract-first mock drives 44 e2e tests without Docker", options: { bullet: bu(), breakLine: true } },
  { text: "Live adapters profile-gated (cib-live, rails-live …)", options: { bullet: bu(), breakLine: true } },
  { text: "nginx same-origin: /api, /realms (Keycloak), /hooks", options: { bullet: bu() } },
], { x: 9.3, y: 2.3, w: 3.5, h: 3.4, fontFace: F, fontSize: 12.5, color: INK, paraSpaceAfter: 10, margin: 0 });
s.addText("Source: component diagram generated from repo structure (SOURCES.md, Marketing/exhibits/E1).",
  { x: M, y: H - 0.75, w: 9, h: 0.3, fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
pageFoot(s, 4);

/* ---------- 5 · Stack ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Technology stack", "Binding Technology Stack v3 — every layer");
const stack = [
  ["Backend", "Java 21 · Spring Boot 4 · Gradle 8", "Modular monolith · Spring Modulith"],
  ["Database", "PostgreSQL 17 · Flyway", "18 migrations V1–V18 · JPA validates only"],
  ["Identity", "Keycloak 26 · OIDC + PKCE", "Realm ulms · direct-grant MFA login"],
  ["Staff web", "React 19 · MUI v7 · Vite 7 · TS 5.8", "Dynamics-365 shell · bilingual EN/BN"],
  ["Mobile", "Expo 54 · React Native 0.81", "Borrower (signed APK) · field (offline-first)"],
  ["Core ledger", "Apache Fineract CE (pinned SHA)", "Loan lifecycle subledger"],
  ["Ops", "Compose → k3s · Helm · Prometheus/Grafana", "6 CI stages · 14 jobs (GitLab)"],
  ["Contract", "OpenAPI 3.0 (redocly-valid)", "140 documented paths"],
];
const rows = stack.map(([a, b, c]) => ([
  { text: a, options: { bold: true, color: NAVY, fontFace: F, fontSize: 13 } },
  { text: b, options: { fontFace: F, fontSize: 13, color: INK } },
  { text: c, options: { fontFace: F, fontSize: 12, color: MUTED } },
]));
s.addTable([["Layer", "Technology", "Notes"].map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: NAVY }, fontFace: F, fontSize: 13 } })), ...rows], {
  x: M, y: 1.8, w: W - 2 * M, colW: [2.2, 4.9, 5.23],
  border: { pt: 0.5, color: LIGHT }, rowH: 0.52, valign: "middle", margin: 0.06,
});
pageFoot(s, 5);

/* ---------- 6 · Module map ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Modules & functions", "16 modules — where the endpoints live");
s.addImage({ path: img("exhibits/E2_endpoints.png"), x: 0.6, y: 1.75, w: 6.6, h: 4.1 });
const modPairs = [
  ["Collections", "37"], ["Compliance", "24"], ["Servicing", "20"], ["Assessment", "13"], ["Approval", "11"],
  ["Portal", "10"], ["AML", "9"], ["Origination", "8"],
];
modPairs.forEach(([n, v], i) => {
  const x = 7.6 + (i % 2) * 2.7, y = 1.9 + Math.floor(i / 2) * 1.15;
  s.addText(v, { x, y, w: 0.85, h: 0.75, fontFace: F, fontSize: 30, color: MID, bold: true, margin: 0 });
  s.addText(n, { x: x + 0.9, y: y + 0.16, w: 1.75, h: 0.5, fontFace: F, fontSize: 13, color: INK, margin: 0 });
});
s.addText("Counts from the structured repo sweep (SOURCES.md). Collections & compliance dominate by design — delinquency and regulatory reporting are the deepest domains.",
  { x: 7.6, y: 5.5, w: 5.2, h: 0.9, fontFace: F, fontSize: 11.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.2 });
pageFoot(s, 6);

/* ---------- 7 · Credit-to-cash workflow ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Workflow", "Credit-to-cash: application to money in seven steps");
const steps = [
  ["1", "Draft", "Product bounds + DBR ≤50% enforced server-side"],
  ["2", "CIB pull", "Cached 1h · 429 never retried · circuit breaker"],
  ["3", "CPV gate", "Field/branch verification gates the ladder"],
  ["4", "Ladder", "Amount-derived level · maker-checker at L1"],
  ["5", "Sanction", "Letter with tokenized acceptance link"],
  ["6", "Dual-auth", "Prepare ≠ authorize ≠ release"],
  ["7", "Disburse", "Fineract posts · ULMS mirror · STR if ≥৳10L"],
];
steps.forEach(([n, t, d], i) => {
  const x = M + i * 1.79;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 2.1, w: 1.64, h: 2.6, rectRadius: 0.08,
    fill: { color: i === 6 ? NAVY : PALE }, line: { color: LIGHT, width: 0.75 }, shadow: shadow() });
  s.addText(n, { x, y: 2.24, w: 1.64, h: 0.7, fontFace: F, fontSize: 30, bold: true,
    color: i === 6 ? GOLD : MID, align: "center", margin: 0 });
  s.addText(t, { x, y: 2.98, w: 1.64, h: 0.4, fontFace: F, fontSize: 13.5, bold: true,
    color: i === 6 ? "FFFFFF" : NAVY, align: "center", margin: 0 });
  s.addText(d, { x: x + 0.08, y: 3.42, w: 1.48, h: 1.15, fontFace: F, fontSize: 10,
    color: i === 6 ? LIGHT : MUTED, align: "center", margin: 0 });
  if (i < 6) s.addShape(p.shapes.LINE, { x: x + 1.66, y: 3.4, w: 0.12, h: 0, line: { color: MID, width: 2 } });
});
s.addText("Nightly EOD (23:30 Dhaka) then reclassifies the book: DPD recompute → BRPD stage → provision JV → interest suspense (SS+) → board & IFRS-9 refresh.",
  { x: M, y: 5.2, w: W - 2 * M, h: 0.6, fontFace: F, fontSize: 13.5, color: INK, margin: 0 });
s.addText("Source: workflow trace in code — OriginationService.java, ApprovalService.java, DisbursementService.java, EodBatchService.java.",
  { x: M, y: 6.1, w: 11, h: 0.3, fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
pageFoot(s, 7);

/* ---------- 8 · Regulatory engine ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Regulatory engine", "BRPD Circular 15/2024 — classification & provisioning");
s.addImage({ path: img("exhibits/E4_brpd.png"), x: 0.6, y: 1.9, w: 7.6, h: 2.8 });
s.addText("Also implemented and tested", { x: 8.6, y: 1.95, w: 4.1, h: 0.4, fontFace: F, fontSize: 16, color: NAVY, bold: true, margin: 0 });
s.addText([
  { text: "IFRS-9 ECL staging (EclModel.java)", options: { bullet: bu(), breakLine: true } },
  { text: "Basel III CAR + RWA by segment + parallel-run harness", options: { bullet: bu(), breakLine: true } },
  { text: "BFIU AML: STR ≥৳20L cash, CTR, goAML XML export", options: { bullet: bu(), breakLine: true } },
  { text: "12-return Regcon catalog · WORM packs · maker-checker sign-off", options: { bullet: bu() } },
], { x: 8.6, y: 2.45, w: 4.2, h: 2.3, fontFace: F, fontSize: 12.5, color: INK, paraSpaceAfter: 9, margin: 0 });
s.addText("Interest suspense applies from SS onward; ≥EMI payments regularize DPD (demoed live in the borrower app demo mode). Boundaries locked by BrpdBoundaryLockTest — DF ≤365 / B-L >365 move only together.",
  { x: 0.6, y: 5.05, w: 11.9, h: 0.85, fontFace: F, fontSize: 13, color: INK, margin: 0, lineSpacingMultiple: 1.2 });
s.addText("Source: BrpdClassifier.java, EclModel.java, BaselParallelRunService.java, AmlController.java.",
  { x: M, y: 6.15, w: 10, h: 0.3, fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
pageFoot(s, 8);

/* ---------- 9 · Approval ladder ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Approval ladder", "Seven levels, configured — not coded");
s.addImage({ path: img("exhibits/E5_ladder.png"), x: 0.6, y: 1.85, w: 8.3, h: 3.2 });
s.addText("L1 nodes are maker-checker dual; SLA 48h/level with 02:15 nightly auto-escalation. DELEGATE moves a task to a peer (assignee-only gate after); APPROVE_WITH_CONDITIONS records conditions precedent that block disbursement until SATISFIED or WAIVED. Bands live in approval_band (V2 seed) — the bank retunes limits with a data change.",
  { x: 9.2, y: 1.95, w: 3.6, h: 3.6, fontFace: F, fontSize: 12.5, color: INK, margin: 0, lineSpacingMultiple: 1.25 });
s.addText("Source: V2__origination_workflow.sql:98-105, SlaService.java, Q1DelegateConditionsTest.java.",
  { x: M, y: 5.6, w: 10, h: 0.3, fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
pageFoot(s, 9);

/* ---------- 10 · Quality gates ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Quality gates", "311 passing tests across five suites");
s.addImage({ path: img("exhibits/E3_tests.png"), x: 0.6, y: 1.85, w: 7.4, h: 3.3 });
const suites = [["Java", "193 / 52 suites"], ["Web unit", "44"], ["e2e", "44"], ["Field app", "20"], ["Borrower app", "10"]];
suites.forEach(([n, v], i) => {
  const y = 1.95 + i * 0.68;
  s.addText(n, { x: 8.5, y, w: 2.1, h: 0.4, fontFace: F, fontSize: 14, color: INK, margin: 0 });
  s.addText(v, { x: 10.7, y, w: 2.1, h: 0.4, fontFace: F, fontSize: 14, color: MID, bold: true, margin: 0 });
});
s.addText("Java suites run in Docker (gradle:8-jdk21 + Testcontainers PG17 — CI parity). The e2e suite includes a WCAG 2.1 AA axe gate over 7 surfaces; the build reproduced the release APK byte-identically (deterministic pipeline).",
  { x: M, y: 5.35, w: 12, h: 0.85, fontFace: F, fontSize: 13, color: INK, margin: 0, lineSpacingMultiple: 1.2 });
pageFoot(s, 10);

/* ---------- 11 · Staff app ---------- */
s = p.addSlide(); light(s);
titleBar(s, "The three apps · staff web", "Production staff cockpit — real Keycloak session");
frame(s, "screenshots/s00_staff_login.png", M, 1.75, 4.05, 2.28, "Sign-in: creds → MFA (Keycloak direct grant)");
frame(s, "screenshots/s01_home.png", 4.75, 1.75, 4.05, 2.28, "Home — environment chip reads PRODUCTION");
frame(s, "screenshots/s02_pipeline.png", 9.0, 1.75, 4.05, 2.28, "Pipeline — stage chips, DBR, drawer");
frame(s, "screenshots/s03_classification.png", M, 4.45, 4.05, 2.28, "BRPD classification board");
frame(s, "screenshots/s04_collections.png", 4.75, 4.45, 4.05, 2.28, "Collections workbench — PTP, dunning");
frame(s, "screenshots/s05_customers.png", 9.0, 4.45, 4.05, 2.28, "Customer master — branch-scoped");
pageFoot(s, 11);

/* ---------- 12 · Borrower app ---------- */
s = p.addSlide(); light(s);
titleBar(s, "The three apps · borrower mobile", "Signed Android APK — runs standalone in demo mode");
frame(s, "screenshots/b1_borrower_login.png", M, 1.8, 4.1, 2.9, "OTP sign-in — code auto-fills (demo simulates SMS)");
frame(s, "screenshots/b2_borrower_home.png", 4.85, 1.8, 4.1, 2.9, "Home — hero balance card, EMI, DPD, quick actions");
frame(s, "screenshots/b3_borrower_pay.png", 9.15, 1.8, 3.9, 2.9, "Pay — rail chips + OTP confirmation");
s.addText([
  { text: "com.uslbd.ulmsborrower v0.1.0 · minSdk 24 · apksigner v2/v3 verified · arm64 Hermes", options: { bullet: bu(), breakLine: true } },
  { text: "No backend set → embedded prototype simulation; set EXPO_PUBLIC_API_BASE → real /portal", options: { bullet: bu(), breakLine: true } },
  { text: "iOS: verified Xcode project shipped — IPA needs Mac/EAS per Apple licensing", options: { bullet: bu() } },
], { x: M, y: 5.05, w: 12.2, h: 1.3, fontFace: F, fontSize: 13, color: INK, paraSpaceAfter: 8, margin: 0 });
pageFoot(s, 12);

/* ---------- 13 · Field app ---------- */
s = p.addSlide(); light(s);
titleBar(s, "The three apps · field mobile", "Offline-first verification — evidence never lost");
frame(s, "screenshots/f1_field_login.png", M, 1.8, 4.1, 2.9, "Bank PKCE sign-in + security notices");
frame(s, "screenshots/f2_field_cpv.png", 4.85, 1.8, 4.1, 2.9, "CPV form — signature canvas, GPS gate, voice ≤5 min");
frame(s, "screenshots/f3_field_map.png", 9.15, 1.8, 3.9, 2.9, "Field map — borrower task pins");
s.addText([
  { text: "Visits idempotent by clientUuid · task state is server-wins · evidence append-only", options: { bullet: bu(), breakLine: true } },
  { text: "App-PIN lock (salted hash) + two-step SOS that never silently drops", options: { bullet: bu(), breakLine: true } },
  { text: "Dedicated /field gateway: delta pull with bundleVersion, visits, PTP, SOS + ack desk", options: { bullet: bu() } },
], { x: M, y: 5.05, w: 12.2, h: 1.3, fontFace: F, fontSize: 13, color: INK, paraSpaceAfter: 8, margin: 0 });
pageFoot(s, 13);

/* ---------- 14 · Deployment ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Deployment", "Three environments, one pipeline");
s.addImage({ path: img("exhibits/E6_topology.png"), x: 0.6, y: 1.75, w: 7.3, h: 3.0 });
s.addText("Get running", { x: 8.35, y: 1.8, w: 4.3, h: 0.4, fontFace: F, fontSize: 16, color: NAVY, bold: true, margin: 0 });
s.addText(
  "npm run mock:api && npm run dev   # zero-Docker dev\n" +
  "docker compose up -d             # 8-service verification\n" +
  "helm upgrade --install ulms deploy/chart/ulms --atomic",
  { x: 8.35, y: 2.25, w: 4.45, h: 1.5, fontFace: "Consolas", fontSize: 11, color: INK,
    fill: { color: "F5F5F5" }, margin: 0.08, lineSpacingMultiple: 1.3 });
s.addText([
  { text: "10 scheduled jobs (SLA */15 · EOD 23:30 · WORM 02:00 · dunning 06:00 …)", options: { bullet: bu(), breakLine: true } },
  { text: "12 runbooks incl. RB-11A flip matrix — mock→bank is values-only", options: { bullet: bu(), breakLine: true } },
  { text: "Mobile: build-apk.sh one command → signed APK (byte-identical rebuild proven)", options: { bullet: bu() } },
], { x: 8.35, y: 3.95, w: 4.45, h: 2.2, fontFace: F, fontSize: 12, color: INK, paraSpaceAfter: 8, margin: 0 });
pageFoot(s, 14);

/* ---------- 15 · Security & compliance ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Security & compliance", "Controls a regulator can trace");
const secs = [
  ["Identity", "Keycloak OIDC · PKCE · MFA on staff login · SSO secondary"],
  ["Authorization", "Role gates per endpoint · ladder-level gates · own-CIF portal rows"],
  ["Dual control", "Maker-checker ladder · triple-gated disbursement · SOS ledger"],
  ["Audit", "WORM audit_entry on every mutation · signatures on approvals"],
  ["Secrets", "Env/Vault only — zero usable literals in the repo (scanned)"],
  ["Regulatory", "BRPD · IFRS-9 · Basel III · BFIU AML (STR/CTR/goAML) · 12 returns"],
];
secs.forEach(([t, d], i) => {
  const x = M + (i % 3) * 4.15, y = 1.9 + Math.floor(i / 3) * 1.75;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.9, h: 1.5, rectRadius: 0.08,
    fill: { color: PALE }, line: { color: LIGHT, width: 0.75 } });
  s.addText(t, { x: x + 0.2, y: y + 0.14, w: 3.5, h: 0.35, fontFace: F, fontSize: 15, color: NAVY, bold: true, margin: 0 });
  s.addText(d, { x: x + 0.2, y: y + 0.52, w: 3.5, h: 0.9, fontFace: F, fontSize: 11.5, color: INK, margin: 0, lineSpacingMultiple: 1.15 });
});
s.addText("Plus: CSP + nosniff + XFO on the web tier · WCAG axe gate in CI · bilingual incl. Bangla numerals.",
  { x: M, y: 5.7, w: 12, h: 0.4, fontFace: F, fontSize: 12.5, color: MUTED, margin: 0 });
pageFoot(s, 15);

/* ---------- 16 · Enhancement recipe ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Enhancement & extension", "The six-step vertical-slice recipe");
const recipe = [
  ["1", "Entity + Flyway V19+", "JPA validates; never generates"],
  ["2", "Repository + service", "Rules + @PreAuthorize + Testcontainers test"],
  ["3", "Controller + OpenAPI", "redocly must stay valid"],
  ["4", "Mock route", "Contract parity for Docker-free e2e"],
  ["5", "Clients + screens", "Web API client · mobile where needed"],
  ["6", "Suites green", "Touched suites rerun in Docker"],
];
recipe.forEach(([n, t, d], i) => {
  const x = M + (i % 3) * 4.15, y = 1.85 + Math.floor(i / 3) * 1.6;
  s.addText(n, { x, y, w: 0.75, h: 1.1, fontFace: F, fontSize: 44, color: LIGHT, bold: true, margin: 0 });
  s.addText(t, { x: x + 0.8, y: y + 0.1, w: 3.15, h: 0.4, fontFace: F, fontSize: 15.5, color: NAVY, bold: true, margin: 0 });
  s.addText(d, { x: x + 0.8, y: y + 0.52, w: 3.15, h: 0.55, fontFace: F, fontSize: 11.5, color: MUTED, margin: 0 });
});
s.addText("Reference slices in repo: collections watchlist + auctions (V17) and the field gateway (V18) each added table → service → controller → spec → mock → screen in one commit series.",
  { x: M, y: 5.35, w: 12.2, h: 0.7, fontFace: F, fontSize: 13, color: INK, margin: 0, lineSpacingMultiple: 1.2 });
pageFoot(s, 16);

/* ---------- 17 · Boundaries & roadmap ---------- */
s = p.addSlide(); light(s);
titleBar(s, "Boundaries & roadmap", "Stated plainly — nothing hidden");
const bnd = [
  ["Externally bound", "CIB/NIDW/rail/CBS credentials · clustered Keycloak · bank CI runner · EAS/MDM signing. Mechanism: values-only RB-11A flip.", ERR],
  ["Deferred by decision", "Multi-tenancy (D3) · Islamic Murabaha (phase 4) · outbox→Kafka · websockets. Revisit triggers documented.", MID],
  ["UX-contract scope", "~120 prototype archetype screens remain badged reference layouts; conversion = the analytics workstream.", MID],
  ["Environment", "Local Docker Desktop is crash-prone under build load — always-on demo should move to the bank k3s cluster.", ERR],
];
bnd.forEach(([t, d, c], i) => {
  const y = 1.85 + i * 1.22;
  s.addShape(p.shapes.OVAL, { x: M, y: y + 0.08, w: 0.28, h: 0.28, fill: { color: c }, line: { type: "none" } });
  s.addText(t, { x: M + 0.45, y, w: 3.1, h: 0.45, fontFace: F, fontSize: 15, color: NAVY, bold: true, margin: 0 });
  s.addText(d, { x: 3.7, y, w: 9.1, h: 1.0, fontFace: F, fontSize: 12.5, color: INK, margin: 0, lineSpacingMultiple: 1.15 });
});
pageFoot(s, 17);

/* ---------- 18 · Closing (dark) ---------- */
s = p.addSlide();
s.background = { color: NAVY };
s.addShape(p.shapes.OVAL, { x: -1.8, y: 4.3, w: 6.2, h: 6.2, fill: { color: MID, transparency: 72 }, line: { type: "none" } });
s.addText("Build stage: complete.", { x: M, y: 2.1, w: 12, h: 0.9, fontFace: F, fontSize: 44, color: "FFFFFF", bold: true, margin: 0 });
s.addText("Deployment execution and bank-bound cutover follow the go-live checklist and the RB-11A flip runbook.",
  { x: M, y: 3.15, w: 11, h: 0.6, fontFace: F, fontSize: 18, color: LIGHT, margin: 0 });
s.addText([
  { text: "Full technical documentation: ULMS_v2_Technical_Documentation.docx (34 tables, 18 exhibits, provenance map)", options: { bullet: bu(), breakLine: true } },
  { text: "Every claim traceable via SOURCES.md — re-verify in minutes", options: { bullet: bu(), breakLine: true } },
  { text: "Working prototypes: localhost:8791/prototype (borrower) · /prototype/field (field ops)", options: { bullet: bu() } },
], { x: M, y: 4.3, w: 11.5, h: 1.6, fontFace: F, fontSize: 14, color: GOLD, paraSpaceAfter: 10, margin: 0 });
s.addText("Unisoft Systems Limited · October 2026", { x: M, y: H - 0.7, w: 6, h: 0.4, fontFace: F, fontSize: 12, color: LIGHT, margin: 0 });

p.writeFile({ fileName: path.join(DIR, "ULMS_v2_Technical_Presentation.pptx") })
  .then(() => console.log("deck written"));
