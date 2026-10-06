#!/usr/bin/env python3
"""ULMS Technical Documentation — single-pass docx builder.
Typography contract: Calibri 9.5 body / 9pt callouts / Consolas 8.5 code.
Headings via TRUE Word styles (restyled once). Gate G2 sweeps every run."""
import json, os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = os.path.dirname(os.path.abspath(__file__))
NAVY = RGBColor(0x1E, 0x26, 0x60)
MID = RGBColor(0x3F, 0x51, 0xB5)
GRAY = RGBColor(0x55, 0x55, 0x55)

mods = json.load(open(os.path.join(BASE, "_phase1_modules.json"), encoding="utf-8"))
facts = json.load(open(os.path.join(BASE, "_phase1_facts.json"), encoding="utf-8"))

# ---------- contract helpers ----------
def style_run(run, size=9.5, bold=False, italic=False, color=None, font="Calibri"):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color is not None:
        run.font.color.rgb = color
    run._element.rPr.rFonts.set(qn('w:eastAsia'), font)
    return run

def para(doc, text, size=9.5, bold=False, space_after=4, color=None, align=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if align is not None:
        p.alignment = align
    style_run(p.add_run(text), size=size, bold=bold, color=color)
    return p

def bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        style_run(p.add_run(bold_prefix + " — "), size=9.5, bold=True)
    style_run(p.add_run(text), size=9.5)
    return p

def heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    return h

def setup(doc):
    for name, size in (("Heading 1", 16), ("Heading 2", 13), ("Heading 3", 11)):
        st = doc.styles[name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = NAVY
        st.element.rPr.rFonts.set(qn('w:eastAsia'), "Calibri")
        st.paragraph_format.space_before = Pt(10)
        st.paragraph_format.space_after = Pt(4)
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.top_margin = sec.bottom_margin = Cm(2.0)
    sec.left_margin = sec.right_margin = Cm(2.0)
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    style_run(hp.add_run("ULMS v2.0 — Technical Documentation"), size=8, color=GRAY)
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(fp.add_run("Page "), size=8, color=GRAY)
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'PAGE')
    fp._p.append(fld)
    style_run(fp.add_run(" of "), size=8, color=GRAY)
    fld2 = OxmlElement('w:fldSimple')
    fld2.set(qn('w:instr'), 'NUMPAGES')
    fp._p.append(fld2)

def callout(doc, title, body, fill="EEF0FA"):
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    cell = t.cell(0, 0)
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), fill)
    cell._tc.get_or_add_tcPr().append(shd)
    p = cell.paragraphs[0]
    style_run(p.add_run(title + "  "), size=9, bold=True, color=NAVY)
    style_run(p.add_run(body), size=9)
    return t

def code(doc, text):
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    cell = t.cell(0, 0)
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), "F5F5F5")
    cell._tc.get_or_add_tcPr().append(shd)
    p = cell.paragraphs[0]
    for i, line in enumerate(text.split("\n")):
        if i > 0:
            p = cell.add_paragraph()
        style_run(p.add_run(line), size=8.5, font="Consolas")
    return t

def shade_cell(cell, hexfill):
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), hexfill)
    cell._tc.get_or_add_tcPr().append(shd)

def table(doc, headers, rows, widths=None, code_col=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    hdr = t.rows[0]
    trPr = hdr._tr.get_or_add_trPr()
    tblHeader = OxmlElement('w:tblHeader'); tblHeader.set(qn('w:val'), "true")
    trPr.append(tblHeader)
    for i, h in enumerate(headers):
        shade_cell(hdr.cells[i], "1E2660")
        p = hdr.cells[i].paragraphs[0]
        style_run(p.add_run(h), size=9.5, bold=True, color=RGBColor(255, 255, 255))
    for r_i, row in enumerate(rows):
        cells = t.add_row().cells
        for i, v in enumerate(row):
            if r_i % 2 == 1:
                shade_cell(cells[i], "F0F2FB")
            p = cells[i].paragraphs[0]
            if code_col is not None and i == code_col:
                style_run(p.add_run(str(v)), size=8.5, font="Consolas")
            else:
                style_run(p.add_run(str(v)), size=9.5)
    return t

def exhibit(doc, png, caption, alt, width=16.0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(os.path.join(BASE, "exhibits", png) if os.path.exists(os.path.join(BASE, "exhibits", png))
                    else os.path.join(BASE, "screenshots", png), width=Cm(width))
    # alt text via docPr descr
    try:
        docPr = run._element.findall(qn('w:drawing'))[0][0].findall(qn('wp:docPr'))[0] if run._element.findall(qn('w:drawing')) else None
    except Exception:
        docPr = None
    if docPr is not None:
        docPr.set('descr', alt)
    cp = doc.add_paragraph()
    cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(cp.add_run(caption), size=8.5, italic=True, color=GRAY)
    cp.paragraph_format.space_after = Pt(8)

def toc(doc):
    p = doc.add_paragraph()
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'TOC \\o "1-2" \\h \\z \\u')
    r = OxmlElement('w:r')
    fld.append(r)
    p._p.append(fld)
    ph = doc.add_paragraph()
    style_run(ph.add_run("(Open in Word → Ctrl+A → F9 to populate)"), size=8.5, italic=True, color=GRAY)

# ---------- build ----------
doc = Document()
setup(doc)

# Cover
para(doc, "UNISOFT SYSTEMS LIMITED", size=12, bold=True, color=MID,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
for _ in range(4):
    doc.add_paragraph()
para(doc, "ULMS — Unisoft Loan Management System", size=30, bold=True, color=NAVY,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
para(doc, "Comprehensive Technical Documentation", size=16, color=MID,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
para(doc, "Version 2.0 · October 2026", size=11, color=GRAY,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
para(doc, "Prepared for ABC Bank Bangladesh (pilot) — staff web, borrower and field mobile apps, Fineract core",
     size=9.5, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_page_break()

toc(doc)
doc.add_page_break()

# 1 Executive summary
heading(doc, "1. Executive Summary", 1)
para(doc, "ULMS is a bank-grade loan management system for Bangladesh scheduled commercial banks: "
          "a Java 21 / Spring Boot 4 modular-monolith backend, a React 19 staff web application, two "
          "Expo 54 mobile apps (borrower + field officer), Apache Fineract CE as the core ledger, "
          "PostgreSQL 17, and Keycloak 26 identity — deployable from Docker Compose to k3s via a Helm chart. "
          "The build implements the full Bangladesh regulatory core: BRPD Circular 15/2024 seven-stage "
          "classification and provisioning, IFRS-9 ECL staging, Basel III capital adequacy, BFIU AML/CTRF "
          "(STR/CTR/goAML), and a 12-return regulatory reporting catalog.")
exhibit(doc, "E7_kpis.png", "Exhibit 1 — Program KPIs at a glance",
        "Seven KPI cards: 16 modules, 162 endpoints, 18 migrations, 193 Java tests, 44 e2e, 2 mobile apps, 12 runbooks", 16.5)
callout(doc, "SCOPE NOTE",
        "This document covers the shipped build (build stage complete). Live-bank cutover items — "
        "external credentials, clustered Keycloak, production k3s rollout — follow the go-live checklist and RB-11A flip runbook.")

# 2 Architecture
heading(doc, "2. System Overview & Architecture", 1)
para(doc, "The system is a modular monolith by binding decision (Technology Stack v3): all sixteen "
          "business modules run in one deployable Spring Boot 4 unit — module boundaries enforced by "
          "Spring Modulith with owned ports for the two historically cyclic edges — fronted by an "
          "nginx-served React SPA and two native mobile clients. Apache Fineract CE is the immutable "
          "loan subledger; ULMS mirrors loan state for its BRPD/boards projections.")
exhibit(doc, "E1_architecture.png", "Exhibit 2 — Component architecture",
        "Architecture: three clients left (staff web, borrower app, field app), Spring Boot monolith center, "
        "PostgreSQL/Keycloak/Fineract/bank rails right")

heading(doc, "2.1 Technology Stack (binding — v3)", 2)
table(doc, ["Layer", "Technology", "Notes"], [
    ["Backend", "Java 21 · Spring Boot 4 · Gradle 8", "Modular monolith · Spring Modulith verification"],
    ["Database", "PostgreSQL 17 · Flyway", f"{facts['flyway_migrations']} migrations V1–V18"],
    ["Identity", "Keycloak 26 (OIDC + PKCE)", "Realm ulms; direct-grant MFA on staff login"],
    ["Web", "React 19 · MUI v7 · Vite 7 · TS 5.8", "Dynamics-365 shell, bilingual EN/BN"],
    ["Mobile", "Expo 54 · React Native 0.81", "Borrower app (signed APK) + field app (offline-first)"],
    ["Core ledger", "Apache Fineract CE (pinned SHA)", "Loan lifecycle subledger"],
    ["Ops", "Compose → k3s · Helm · Prometheus/Grafana", f"{facts['ci_stages']} CI stages, {facts['ci_jobs']} jobs (GitLab)"],
    ["Docs/spec", "OpenAPI 3.0 (redocly-valid)", f"{facts['openapi_paths']} documented paths"],
])

# 3 Modules
heading(doc, "3. Modules & Functions", 1)
para(doc, f"Sixteen backend packages implement the platform ({sum(len(m['endpoints']) for m in mods.values())} "
          "REST endpoints total). Each module section: purpose, endpoints, and the business rules its "
          "service layer enforces; the endpoint table lists verb, path, and the role gate.")
exhibit(doc, "E2_endpoints.png", "Exhibit 3 — REST endpoints by module",
        "Horizontal bar chart of endpoint counts per module; collections largest at 37")

MODULE_NOTES = {
 "customer": ("Customer master, e-KYC/NID screening, branch scoping, merge-duplicate hygiene, risk classification.",
   ["BD mobile format enforced (+8801…); screening consults the AML watchlist port",
    "KYC refresh cadence 1/2/3 years by risk band; merges are idempotent by canonical CIF"]),
 "origination": ("Loan application lifecycle: draft → submit (CIB pull + scoring) → CPV gate → approval ladder entry.",
   ["Server-computed DBR ceiling 50%; product bounds enforced at draft and portal apply",
    "CPV pass starts the ladder; fail rolls the application back to screening"]),
 "assessment": ("Credit assessment: CIB bureau parsing (stock+flow), scorecard, DBR, collateral valuation & LTV.",
   ["Scorecard grades A≥680 / B≥620 / C≥540 (recalibrated — 760+ was unreachable)",
    "CIB retries: 429 non-retryable; 5xx retried 1+3 with circuit breaker to RB-05 queue"]),
 "approval": ("7-level maker-checker ladder, dual-phase nodes, DELEGATE, APPROVE_WITH_CONDITIONS, disbursement dual-auth.",
   ["Bands (V2 seed): L1 ≤৳5L … L6 ≤৳10Cr, L7 above — ladder level derived from amount",
    "Dual-auth disbursement: preparer ≠ authorizer ≠ releaser (three distinct pairs of hands)",
    "Conditions precedent block disbursement until SATISFIED/WAIVED"]),
 "servicing": ("Loan book: schedules, payments, statements, settle quotes, fees, reschedule, top-up, moratorium, BLR.",
   ["Payments idempotent by external ref; statements as JSON + CSV",
    "BLR (base lending rate) admin + re-price; moratorium is collections/compliance-gated"]),
 "collections": ("Delinquency engine: worklist priority, dunning ladder, PTP lifecycle, field tasks + /field gateway, watchlist, legal, write-off, recovery, auctions.",
   ["Dunning timers by DPD bucket; PTP kept/broken derives from payments at promise date",
    "Field visits idempotent by clientUuid with server-wins task state; SOS ledger + ack",
    "≥EMI payment regularizes DPD; auction proceeds post as 5%-incentive recovery"]),
 "compliance": ("EOD batch, BRPD classification board, provisions, IFRS-9 ECL, Basel III CAR, Regcon returns, parallel-run.",
   ["BRPD stages STD-0/1/2 → SMA → SS → DF → B/L with 1/1/1/5/20/50/100% provisioning",
    "Regcon: 12-return catalog with maker-checker sign-off and WORM pack generation"]),
 "aml": ("AML/CFT: screening lists, monitoring alerts, CTR/STR, goAML submission, sanctions screening port.",
   ["STR ≥৳20L cash threshold alert; goAML env-gated with ack bookkeeping",
    "Screening normalize folds diacritics; EDD on hits"]),
 "product": ("Versioned loan-product catalog with maker-checker activation and eligibility oracle.",
   ["One live version per code (DRAFT→ACTIVE→RETIRED); PATCH amends drafts only",
    "Eligibility = bounds + tenor + EMI parity with MoneyMath"]),
 "sanction": ("Sanction letter generation with tokenized acceptance and resend (replaces prior)."),
 "bocc": ("Board of Directors credit committee: schedule, attendance, quorum (simple majority), votes, auto-minutes."),
 "notification": ("Bilingual (BN/EN) SMS/email templates, delivery outbox with provider fallback chain — all-fail is recorded FAILED, never dropped."),
 "portal": ("Borrower self-service: OTP login, own-CIF loans/tracker/payments/apply/statements — strictly own-CIF row scope."),
 "partner": ("Lending-partner API channel: hashed API keys, 60/min token bucket, Idempotency-Key replay."),
 "platform": ("Shared kernel: workflow engine, audit (WORM), outbox (ADR-004), security principal, money math."),
 "customer360": ("Aggregated 360 view projection over the customer aggregate."),
}
for name in sorted(mods):
    m = mods[name]
    heading(doc, f"3.{sorted(mods).index(name)+1} {name.capitalize()}", 2)
    note = MODULE_NOTES.get(name, ("", []))
    if isinstance(note, tuple):
        desc, rules = note[0], note[1]
    else:
        desc, rules = note, []
    if desc:
        para(doc, desc)
    if m["endpoints"]:
        table(doc, ["Verb", "Path", "Roles"], [
            [e.split(" ")[0], e.split(" ", 1)[1], ", ".join(m["roles"])[:60] or "staff JWT"] for e in m["endpoints"]
        ][:12], code_col=1)
    for r in rules:
        bullet(doc, r)
doc.add_page_break()

# 4 Workflows
heading(doc, "4. End-to-End Workflows", 1)
heading(doc, "4.1 Credit-to-Cash (origination → disbursement)", 2)
for i, s in enumerate([
 "Officer drafts an application (product bounds + DBR guardrail server-enforced).",
 "Submit triggers the CIB ONLINE pull (cached 1h; 429 non-retryable; circuit breaker on sustained 5xx) and scorecard computation.",
 "CPV verification (field app or branch) gates ladder entry — fail rolls back to screening.",
 "Ladder approval at the amount-derived level; L1 nodes are maker-checker dual; higher-value files can be DELEGATED within level or approved WITH CONDITIONS (conditions block disbursement until SATISFIED/WAIVED).",
 "Sanction letter issued with a tokenized acceptance link (resend replaces).",
 "Disbursement is triple-gated: prepare ≠ authorize ≠ release; release executes Fineract disbursement and writes the ULMS loan mirror.",
 "STR alert raised automatically if cash disbursed ≥ ৳10L (BFIU threshold)."], 1):
    para(doc, f"Step {i}. {s}")
heading(doc, "4.2 Nightly EOD & classification", 2)
para(doc, "23:30 Asia/Dhaka: payments recompute DPD; BrpdClassifier assigns the 7-stage classification; "
          "provisions post per the 1/1/1/5/20/50/100% schedule; interest suspense applies SS+; the board "
          "projection and IFRS-9 ECL stages refresh; Regcon WORM packs regenerate after (02:00/02:20).")
exhibit(doc, "E4_brpd.png", "Exhibit 4 — BRPD 15/2024 stages and provisioning",
        "Bar chart of seven BRPD stages from STD-0 0 DPD 1 percent to B/L over 365 DPD 100 percent")
heading(doc, "4.3 Approval ladder mechanics", 2)
exhibit(doc, "E5_ladder.png", "Exhibit 5 — 7-level approval ladder",
        "Timeline of ladder levels L1 through L7 with amount bands and roles")
callout(doc, "LADDER DATA",
        "Bands are configuration rows (approval_band, V2 seed), not code — the bank can retune limits "
        "with a data change. L1 nodes are maker-checker dual; SLA 48h/level with 02:15 nightly escalation.")

# 5 User journeys (screenshots)
heading(doc, "5. User Journeys (production screens)", 1)
heading(doc, "5.1 Staff — sign-in and daily cockpit", 2)
para(doc, "Staff sign in at the production web (nginx + Keycloak direct-grant, MFA step, SSO as secondary). "
          "The environment chip reads PRODUCTION — the real build mode, never a hardcoded label.")
exhibit(doc, "s00_staff_login.png", "Exhibit 6a — Staff sign-in (production, MFA step)",
        "Production staff login: gradient hero with brand row and MFA code entry", 13.5)
exhibit(doc, "s01_home.png", "Exhibit 6 — Staff home, signed in (production)",
        "Staff home with top bar, environment chip PRODUCTION, KPI cards and workspace tiles", 13.5)
exhibit(doc, "s02_pipeline.png", "Exhibit 7 — Application pipeline & approval drawer",
        "Pipeline list with stage chips, DBR column, branch and drawer actions", 13.5)
exhibit(doc, "s03_classification.png", "Exhibit 8 — BRPD classification board",
        "Classification board showing stage distribution and provisioning", 13.5)
exhibit(doc, "s04_collections.png", "Exhibit 9 — Collections workbench",
        "Collections worklist with DPD buckets, priority boost and PTP actions", 13.5)
heading(doc, "5.2 Borrower — OTP to payment (mobile app)", 2)
para(doc, "The borrower app ships as a signed Android APK (iOS project verified for the bank's Mac/EAS "
          "step). Its demo mode embeds the same simulation as the validated prototype, so the journey "
          "below is executable on any phone without a backend.")
exhibit(doc, "b1_borrower_login.png", "Exhibit 10 — Borrower app: OTP sign-in",
        "Borrower login with gradient hero and SMS code entry", 13.5)
exhibit(doc, "b2_borrower_home.png", "Exhibit 11 — Borrower home: hero balance card",
        "Borrower home with avatar, gradient balance card, EMI and DPD facts, quick actions", 13.5)
exhibit(doc, "b3_borrower_pay.png", "Exhibit 12 — Borrower pay: rail selection + OTP confirmation",
        "Pay screen with bKash/Nagad/BEFTN chips, payment code and history", 13.5)
heading(doc, "5.3 Field officer — offline-first verification", 2)
para(doc, "The field app runs the six-tab offline cockpit: today's visits, CPV form (signature canvas, "
          "voice note, GPS gate), schematic map, proof gallery, two-step SOS, and the sync center whose "
          "drain demonstrates server-wins conflict handling.")
exhibit(doc, "f1_field_login.png", "Exhibit 13 — Field app login (bank PKCE)",
        "Field app login hero with bank sign-in and security notices", 13.5)
exhibit(doc, "f2_field_cpv.png", "Exhibit 14 — CPV verification form with signature canvas",
        "CPV form showing person-met switch, GPS accuracy, photo and voice counters, signature box", 13.5)
exhibit(doc, "f3_field_map.png", "Exhibit 15 — Field map with borrower pins",
        "Schematic pin board of open tasks with grid and unpinned list", 13.5)

# 6 Database
heading(doc, "6. Database Schema", 1)
para(doc, f"{facts['flyway_migrations']} Flyway migrations (V1__origination_workflow → V18__field_gateway) "
          "own the schema — JPA validates, never generates. Key aggregates: customers + KYC/screening, "
          "applications + workflow tasks/transitions (signature evidence on approvals), loans + payments, "
          "approval_band config, watchlist/auction/field_visit/SOS ledgers, outbox_event (ADR-004) and "
          "the WORM audit_entry.")
table(doc, ["Migration", "Introduces"], [
    ["V1–V4", "Origination + workflow, CIB/compliance, concurrency & audit, actor widths"],
    ["V5–V9", "Collateral, CIB pull tables, concurrency, servicing/collections, collections parity"],
    ["V10–V14", "R3-R5 modules (products/sanctions/BOCC/outbox), R10 business logic depth"],
    ["V15", "Q3 UAT flips: signature evidence, goAML, Basel parallel-run"],
    ["V16–V17", "Q1 depth: approval conditions, watchlist, auctions"],
    ["V18", "Field gateway: idempotent visits, SOS ledger, task pins"],
], code_col=None)

# 7 Deployment
heading(doc, "7. Deployment Guide (step by step)", 1)
para(doc, "Three environments ship: local dev (mock, zero Docker), verification compose (8 services), and "
          "the bank k3s cluster via Helm. Prerequisites: Docker, Node 20+, and the .env values from .env.example.")
exhibit(doc, "E6_topology.png", "Exhibit 16 — Environments and pipeline",
        "Developer, compose, docker build, k3s and CI boxes with arrows")
heading(doc, "7.1 Local development (mock API)", 2)
code(doc, "cd LMS_CODEBASE/apps/web\nnpm install\nnpm run mock:api   # in-memory OpenAPI mock on :8081\nnpm run dev         # Vite on :5173 (mock wired in)")
heading(doc, "7.2 Verification stack (real services)", 2)
code(doc, "cd LMS_CODEBASE/deploy/compose\ncp ../../.env.example .env   # fill values\ndocker compose up -d         # 8 services; healthchecks gate readiness\n# staff web → http://localhost:4173  (Keycloak MFA login)")
heading(doc, "7.3 Bank cluster (k3s + Helm)", 2)
code(doc, "docker build -t ulms-api:p1 LMS_CODEBASE/apps/api\ndocker build -t ulms-web:p1 LMS_CODEBASE/apps/web\nhelm upgrade --install ulms deploy/chart/ulms --atomic")
heading(doc, "7.3a Scheduled jobs (Asia/Dhaka)", 2)
table(doc, ["Schedule", "Job"], [
    ["*/15 min", "Workflow SLA scan — warn 80%, breach, auto-escalate at SLA+50%"],
    ["23:30", "EOD batch — DPD, BRPD classification, provisions, interest suspense"],
    ["02:00", "Regcon WORM pack generation"],
    ["02:15", "Collections watchlist nightly scan (auto STD-2 flags)"],
    ["02:20", "Regcon return refresh after WORM anchor"],
    ["03:15", "KYC refresh due-dates (1/2/3-year cadence)"],
    ["04:00", "Regulatory push drill trigger"],
    ["06:00", "Dunning-ladder pass (DPD buckets)"],
    ["08:00", "EMI-D3 reminders (ahead of the banking day)"],
    ["every 5s", "Outbox relay (ADR-004) — at-least-once, idempotent consumers"],
], code_col=0)
heading(doc, "7.3b Operational runbooks (RB-01–RB-12)", 2)
table(doc, ["Runbook", "Covers"], [
    ["RB-02", "Database backup & restore (verified drill)"],
    ["RB-03", "EOD rerun"],
    ["RB-05", "CIB outage queue handling"],
    ["RB-06", "Secret rotation"],
    ["RB-08", "Release rollback"],
    ["RB-11/11A", "Live-integration flip matrix (mock→bank, values-only)"],
    ["RB-12", "Data migration rehearsal (45k loans, zero-sum verified)"],
], code_col=0)

heading(doc, "7.4 Mobile release builds", 2)
code(doc, "# Android (signed APK — produced)\ncd mobile_app && bash mobileapp_apk/android/build-apk.sh\n# → mobileapp_apk/android/ulms-borrower-release.apk\n# iOS: expo prebuild project at mobileapp_apk/apple/ios-project (needs Mac/EAS)")
callout(doc, "FLIP RUNBOOK",
        "Mock→live cutover is values-only per RB-11A: profile flips (cib-live, nidw-live, rails-live, "
        "cbs-live, sms-live) + build-time VITE_USE_MOCK_API=0 — no code changes.")

# 8 Testing
heading(doc, "8. Testing & Quality Gates", 1)
para(doc, "Every layer has an executable gate; the numbers below are from the recorded full runs in this "
          "workspace (Java full suite re-run at each phase gate; latest 193/0 across 52 classes).")
exhibit(doc, "E3_tests.png", "Exhibit 17 — Automated gates by suite",
        "Bar chart: Java 193, web unit 44, e2e 44, field 20, borrower 10 — all green")
table(doc, ["Suite", "Scope", "How to run"], [
    ["Java (193)", "Modulith, BRPD/ECL/Basel oracles, WireMock contracts, journeys", "Docker gradle:8-jdk21 test (Testcontainers PG17)"],
    ["Web unit (44)", "Money math parity, search indexing, PIN, bilingual templates", "npm run test:unit"],
    ["e2e (44)", "Login→sanction→disburse, portal OTP, WCAG axe gate (7 surfaces)", "cd e2e && npx playwright test"],
    ["Field app (20)", "Offline sync engine, backoff, PIN core, field-gateway ops", "cd apps/mobile && npm test"],
    ["Borrower app (10)", "EMI parity with bank oracle, demo brain (OTP/bounds/pay)", "cd mobile_app && npm test"],
], code_col=2)

# 9 Enhancement
heading(doc, "9. Enhancement & Extension Guide", 1)
para(doc, "The vertical-slice recipe for a new capability (the same path every R10/Q1 module followed):")
for i, s in enumerate([
 "Entity + Flyway migration (V19+) — JPA validates; never generate.",
 "Repository + service (business rules + @PreAuthorize gate), unit test with Testcontainers PG17.",
 "Controller endpoint; add the path to packages/openapi/ulms-api.yaml (redocly must stay valid).",
 "Mock route in apps/web/scripts/mockApi (contract parity for e2e without Docker).",
 "Web API client + screen; mobile client where the journey needs it.",
 "Playwright/vitest coverage; run the touched suites in Docker.",], 1):
    para(doc, f"{i}. {s}")
callout(doc, "EXAMPLES IN REPO",
        "Collections watchlist/auctions (V17) and the field gateway (V18) are recent reference slices — "
        "each added table + service + controller + spec + mock + screen in one commit series.")

# 10 Security
heading(doc, "10. Security & Compliance", 1)
table(doc, ["Control", "Implementation"], [
    ["Identity", "Keycloak 26 OIDC; staff single-page login = direct grant + MFA; SSO PKCE secondary"],
    ["Authorization", "Role gates per endpoint; ladder-level gates on approvals; own-CIF row scope on portal"],
    ["Dual control", "Maker-checker ladder; triple-gated disbursement; field SOS ledger"],
    ["Audit", "WORM audit_entry on every mutation; workflow transitions carry signature evidence"],
    ["Secrets", "Env/Vault only — repo has zero usable credential literals (verified by scans)"],
    ["Regulatory", "BRPD 15/2024, IFRS-9, Basel III, BFIU AML (STR/CTR/goAML), 12-return Regcon"],
    ["Web", "CSP + nosniff + XFO headers; WCAG axe gate in e2e; bilingual including Bangla numerals"],
])

# 11 Mobile appendix
heading(doc, "11. Mobile Applications Appendix", 1)
heading(doc, "11.1 Borrower app (Android release shipped)", 2)
table(doc, ["Artifact", "Detail"], [
    ["APK", "ulms-borrower-release.apk — signed (demo key), com.uslbd.ulmsborrower v0.1.0, minSdk 24, arm64"],
    ["Demo login", "+8801712345678 · OTP auto-fills (demo mode simulates SMS)"],
    ["Modes", "No EXPO_PUBLIC_API_BASE → embedded prototype simulation; set it → real /portal backend"],
    ["iOS", "Verified Xcode project at mobileapp_apk/apple (IPA needs Mac/EAS per Apple licensing)"],
])
heading(doc, "11.2 Field app", 2)
table(doc, ["Capability", "Detail"], [
    ["Offline queue", "Durable AsyncStorage queue; backoff 1/2/4/8/16s + jitter; 5-attempt cap; terminal states never reprocess"],
    ["Sync rules", "Task status server-wins; evidence append-only; visits idempotent by clientUuid"],
    ["Security", "Bank PKCE login + app-PIN lock (salted hash, 30s lockout/3 misses); biometric at EAS build"],
    ["Gateway", "GET /field/tasks delta + bundleVersion; POST /field/visits|ptp|sos; SOS ack desk"],
])

# 11a Known limitations & roadmap
heading(doc, "11.3 Known limitations, deferrals, and roadmap", 2)
para(doc, "Stated plainly so reviewers can plan around them — none are hidden:")
bullet(doc, "Live-bank cutover requires external items: CIB/NIDW/rail/CBS credentials, clustered production Keycloak, bank GitLab CI runner, EAS/MDM signing. Mechanism is the values-only RB-11A flip matrix.", "Externally bound")
bullet(doc, "Multi-tenancy (decision D3), Islamic Murabaha (phase 4), outbox→Kafka bridge, websockets — recorded architecture decisions, revisit triggers documented.", "Deferred by decision")
bullet(doc, "~120 prototype archetype screens remain reference layouts (binding UX contract, badged as such); converting them to live aggregates is the analytics workstream.", "UX contract scope")
bullet(doc, "Local Docker Desktop (host) has proven crash-prone under sustained build load; always-on demo should move to the bank k3s cluster.", "Environment")
para(doc, "")
heading(doc, "11.4 Glossary", 2)
table(doc, ["Term", "Meaning"], [
    ["BRPD 15/2024", "Bangladesh Bank circular defining the 7-stage loan classification and provisioning"],
    ["DPD", "Days Past Due — drives classification stage"],
    ["SMA / SS / DF / B/L", "Special Mention, Substandard, Doubtful, Bad/Loss classification stages"],
    ["ECL", "Expected Credit Loss (IFRS-9) provisioning model"],
    ["CAR / RWA", "Capital Adequacy Ratio / Risk-Weighted Assets (Basel III)"],
    ["STR / CTR", "Suspicious / Currency Transaction Report (BFIU AML)"],
    ["goAML", "BFIU's XML reporting standard for AML submissions"],
    ["DBR", "Debt Burden Ratio — instalments over income, 50% guardrail"],
    ["CPV", "Contact Point Verification (field or branch)"],
    ["PTP", "Promise To Pay (collections)"],
    ["EMI / LTV", "Equated Monthly Instalment / Loan-To-Value"],
    ["BOCC", "Board of Directors Credit Committee"],
    ["Regcon", "Regulatory reporting & control (12-return catalog, WORM packs)"],
    ["NIDW", "National ID Wing (Election Commission e-KYC)"],
    ["CBS", "Core Banking System (Finacle facade with SAGA compensation)"],
    ["Maker-checker", "Four-eyes control: one user prepares, a different user approves"],
], code_col=None)
para(doc, "")
heading(doc, "11.5 Document control", 2)
table(doc, ["Version", "Date", "Author", "Change"], [
    ["1.0", "2026-10-05", "ULMS build agent (ZCode)", "First comprehensive release — architecture, 16 modules, workflows, journeys, deploy/test/enhance guides, mobile appendix, glossary"],
], code_col=None)

# 12 Index
heading(doc, "12. Exhibits Index", 1)
table(doc, ["Exhibit", "Content"], [
    ["1 / 17", "Program KPIs · automated gates"],
    ["2", "Component architecture"],
    ["3", "Endpoints by module"],
    ["4", "BRPD stages & provisioning"],
    ["5", "Approval ladder"],
    ["6–9", "Staff production screens (home, pipeline, board, collections)"],
    ["10–12", "Borrower app (login, home, pay)"],
    ["13–15", "Field app (login, CPV form, map)"],
    ["16", "Environments & pipeline"],
])

out = os.path.join(BASE, "ULMS_v2_Technical_Documentation.docx")
doc.save(out)
print("saved:", out, os.path.getsize(out), "bytes")

# ---- GATE G2: font sweep ----
d2 = Document(out)
bad = []
def sweep(paragraphs, where):
    for p in paragraphs:
        if (p.style.name or "").startswith("Heading"):
            continue   # covered by sweep_headings (style-inherited Calibri)
        for r in p.runs:
            if r.text and r.font.name not in ("Calibri", "Consolas"):
                bad.append((where, r.font.name, r.text[:30]))
            if r.text and r.font.size and r.font.size.pt not in (8, 8.5, 9, 9.5, 11, 12, 13, 16, 30):
                bad.append((where + ":size", r.font.size.pt, r.text[:30]))
# heading runs inherit from the (Calibri) heading style — check inheritance
style_fonts = {n: d2.styles[n].font.name for n in ("Heading 1", "Heading 2", "Heading 3")}
print("heading style fonts:", style_fonts)
def sweep_headings(paragraphs):
    for p_ in paragraphs:
        if not (p_.style.name or "").startswith("Heading"):
            continue
        st = p_.style.name
        if style_fonts.get(st) != "Calibri":
            bad.append(("heading-style", st, style_fonts.get(st)))
sweep(d2.paragraphs, "body")
sweep_headings(d2.paragraphs)
for t in d2.tables:
    for row in t.rows:
        for c in row.cells:
            sweep(c.paragraphs, "table")
sweep(d2.sections[0].header.paragraphs, "header")
sweep(d2.sections[0].footer.paragraphs, "footer")
print("G2 font violations:", len(bad), bad[:5] if bad else "")

# G1 reopen + counts
print("G1 reopen OK | paragraphs:", len(d2.paragraphs), "| tables:", len(d2.tables))
heads = [p.style.name for p in d2.paragraphs if p.style.name.startswith("Heading")]
skips = [heads[i] for i in range(1, len(heads)) if
         heads[i] == "Heading 3" and heads[i-1] == "Heading 1"]
print("G6 heading outline:", len(heads), "headings | skips:", len(skips))
import zipfile
z = zipfile.ZipFile(out)
imgs = [n for n in z.namelist() if n.startswith("word/media/")]
print("G3 embedded images:", len(imgs))
