import json

with open('audit/all_166_screens.json', 'r', encoding='utf-8') as f:
    screens = json.load(f)

with open('audit/backend_endpoints.json', 'r', encoding='utf-8') as f:
    endpoints = json.load(f)

# Module to Controller mapping heuristic
mod_controller_map = {
    "A1": "CustomerController / Customer360Controller / AmlController",
    "A2": "CustomerController / NidMockAdapter",
    "A3": "ApplicationController (/api/v1/applications/{id}/documents)",
    "B1": "ApplicationController",
    "B2": "ProductController",
    "B3": "CollateralController / CibReport",
    "B4": "PartnerController / PortalController",
    "C1": "AssessmentController (CIB Inquiries)",
    "C2": "AssessmentController (Financial Spreading & Scoring)",
    "C3": "AssessmentController / FieldGatewayController",
    "C4": "AssessmentController (Legal & Valuation)",
    "D1": "ApprovalController / BoccController",
    "D2": "DisbursementController",
    "D3": "SanctionController",
    "E1": "ServicingController / LoanDetailPage",
    "E2": "ServicingController (Payment Intents & Reconcile)",
    "E3": "ServicingController (Statements & Certificates)",
    "E4": "ServicingOpsController (Moratorium & Top-Up)",
    "F1": "ComplianceController (BRPD 15/2024 Classification)",
    "F2": "CollectionsController / FieldGatewayController",
    "F3": "WatchlistController / AuctionController",
    "F4": "WriteOffController / RecoveryEntry",
    "G1": "ComplianceController / RegconController",
    "G2": "BaselOpsController / CapitalBase",
    "G3": "ComplianceController (IFRS-9 ECL)",
    "G4": "ReportingController",
    "H1": "OutboxController / AuditLogService",
    "H2": "ApprovalBand / SlaPolicy",
    "H3": "RailWebhookController / OutboxRelay",
    "H4": "NotificationController",
    "H5": "CustomerHygieneController"
}

md = []
md.append("# 06. Exhaustive 166-Screen Wiring & Data Lineage Matrix")
md.append("\n**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  ")
md.append("**Audit Standard:** ISO/IEC 5055 & Enterprise UX Contract Verification  ")
md.append("**Monorepo Scope:** `apps/web/src/shell/navData.ts` vs `apps/api/src/main/java/com/uslbd/ulms/`  \n")
md.append("---\n")
md.append("## 1. Summary Statistics\n")
md.append(f"- **Total Functional Screens Audited:** {len(screens)}")
wired_count = sum(1 for s in screens if s['is_wired'])
unwired_count = len(screens) - wired_count
md.append(f"- **Wired Dedicated Screens (Real API Client):** {wired_count} ({wired_count/len(screens)*100:.1f}%)")
md.append(f"- **Unwired Archetype Screens (Prototype Reference / genRows):** {unwired_count} ({unwired_count/len(screens)*100:.1f}%)\n")
md.append("---\n")
md.append("## 2. Complete Screen-by-Screen Inventory\n")
md.append("| Screen ID | Module | Title (English / Bengali) | Type | Status | Current Backing Source | Target Backend Controller & Endpoint |")
md.append("| :--- | :--- | :--- | :---: | :---: | :--- | :--- |")

for s in screens:
    sid = s['screen_id']
    mid = s['module_id']
    title = f"{s['title_en']} <br>*{s['title_bn']}*"
    t = s['archetype']
    target_ctrl = mod_controller_map.get(mid, "Pending Controller")
    
    if s['is_wired']:
        status = "✅ **WIRED**"
        backing = f"Live Route: `{s['route']}`<br>via `api/client.ts`"
    else:
        status = "⚠️ **PROTOTYPE**"
        backing = f"Archetype `{t}`<br>`demoData.ts:genRows()`"
    
    md.append(f"| `{sid}` | **{mid}** ({s['module_title']}) | {title} | `{t}` | {status} | {backing} | `{target_ctrl}` |")

with open('audit/06_EXHAUSTIVE_166_SCREEN_WIRING_MATRIX.md', 'w', encoding='utf-8') as out:
    out.write('\n'.join(md))

print("Created audit/06_EXHAUSTIVE_166_SCREEN_WIRING_MATRIX.md successfully!")
