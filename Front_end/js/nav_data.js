/* ============================================================
   ULMS navigation-as-data — drives the sitemap, mega menu,
   A–Z directory, Tell-ME search, coverage accounting and the
   workspace pages. Generated from the ULMS v2.0 functional
   blueprint (BRD §7 / SRS module map).

   Screen types (D365 model-driven archetypes):
     g = grid/list   f = form/record   x = 360° view
     c = console     d = dashboard     r = report
   ============================================================ */
(function(){
"use strict";

window.LMS_AREAS = [
  {id:"A", key:"customer",    rail:"var(--rail-customer)",    en:"Customer & Onboarding",   bn:"গ্রাহক ও অনবোর্ডিং",        mods:["A1","A2","A3"]},
  {id:"B", key:"origination", rail:"var(--rail-origination)", en:"Loan Origination (LOS)",  bn:"ঋণ উৎপত্তি (এলওএস)",        mods:["B1","B2","B3","B4"]},
  {id:"C", key:"credit",      rail:"var(--rail-credit)",      en:"Credit Assessment",       bn:"ঋণ মূল্যায়ন",               mods:["C1","C2","C3","C4"]},
  {id:"D", key:"approval",    rail:"var(--rail-approval)",    en:"Approval & Disbursement", bn:"অনুমোদন ও বিতরণ",           mods:["D1","D2","D3"]},
  {id:"E", key:"servicing",   rail:"var(--rail-servicing)",   en:"Servicing & Payments",    bn:"ঋণ পরিচালনা ও পরিশোধ",     mods:["E1","E2","E3","E4"]},
  {id:"F", key:"collections", rail:"var(--rail-collections)", en:"Monitoring & Collections",bn:"নজরদারি ও আদায়",            mods:["F1","F2","F3","F4"]},
  {id:"G", key:"insight",     rail:"var(--rail-insight)",     en:"Insight & Compliance",    bn:"বিশ্লেষণ ও কমপ্লায়েন্স",    mods:["G1","G2","G3","G4"]},
  {id:"H", key:"platform",    rail:"var(--rail-platform)",    en:"Platform & Admin",        bn:"প্ল্যাটফর্ম ও অ্যাডমিন",     mods:["H1","H2","H3","H4","H5"]}
];

window.LMS_MODULES = {

/* ============ A · CUSTOMER & ONBOARDING ============ */
"A1":{area:"A", en:"Customer Management", bn:"গ্রাহক ব্যবস্থাপনা", icon:"👤", desc:"Client register, 360° profile, lifecycle and dedupe on the Fineract client core.",
  kpis:[{l:"Active customers",v:"512,480",d:"<b class='up'>+2,140</b> this month",st:"ok"},
        {l:"e-KYC verified",v:"96.4%",d:"SLA target 95%",st:"ok"},
        {l:"Duplicates flagged",v:"7",d:"Awaiting merge review",st:"warn"}],
  groups:[
    {en:"Onboarding", screens:[
      {id:"A1-s1", en:"New Customer Registration", bn:"নতুন গ্রাহক নিবন্ধন", t:"f"},
      {id:"A1-s2", en:"e-KYC Verification Queue", bn:"ই-কেওয়াইসি যাচাই কিউ", t:"g"},
      {id:"A1-s3", en:"Duplicate Check & Merge", bn:"ডুপ্লিকেট যাচাই ও একত্রীকরণ", t:"g"}]},
    {en:"Customer Records", screens:[
      {id:"A1-s4", en:"Customer Search", bn:"গ্রাহক অনুসন্ধান", t:"g"},
      {id:"A1-s5", en:"Customer 360°", bn:"গ্রাহক ৩৬০°", t:"x", route:"#/cust/CIF-100871"},
      {id:"A1-s6", en:"Customer Lifecycle Actions", bn:"জীবনচক্র কার্যক্রম", t:"f"}]},
    {en:"AML & Screening", screens:[
      {id:"A1-s7", en:"CDD / EDD Screening", bn:"সিডিডি / ইডিডি স্ক্রিনিং", t:"g"},
      {id:"A1-s8", en:"PEP & Sanctions Watchlist", bn:"পিইপি ও নিষেধাজ্ঞা তালিকা", t:"g"},
      {id:"A1-s9", en:"STR Reporting", bn:"এসটিআর রিপোর্টিং", t:"f"}]}],
  reports:["New customers by branch","KYC expiry register","e-KYC success rate","AML screening summary"],
  forms:["New Individual Customer","KYC refresh","Customer deactivate","Blacklist entry","Merge duplicates"],
  cross:["C1 CIB inquiry","B1 customer applications","E1 loans of customer"], frs:31},

"A2":{area:"A", en:"e-KYC & NID Gateway", bn:"ই-কেওয়াইসি ও এনআইডি গেটওয়ে", icon:"🪪", desc:"NIDW real-time verification, biometrics, OCR extraction and audit of every NID query.",
  kpis:[{l:"NID verify p95",v:"3.2s",d:"SLA < 5s",st:"ok"},
        {l:"Auto-fill rate",v:"89%",d:"Name/DOB/address populated",st:"ok"},
        {l:"Manual review",v:"2",d:"Failed photo-match today",st:"warn"}],
  groups:[
    {en:"Verification", screens:[
      {id:"A2-s1", en:"NID Verification Console", bn:"এনআইডি যাচাই কনসোল", t:"c"},
      {id:"A2-s2", en:"Biometric Capture", bn:"বায়োমেট্রিক ক্যাপচার", t:"f"},
      {id:"A2-s3", en:"OCR Extraction Review", bn:"ওসিআর নিষ্কাশন রিভিউ", t:"g"}]},
    {en:"Gateway Ops", screens:[
      {id:"A2-s4", en:"Gateway Health", bn:"গেটওয়ে স্বাস্থ্য", t:"d"},
      {id:"A2-s5", en:"NID Query Audit", bn:"এনআইডি কোয়েরি অডিট", t:"g"}]}],
  reports:["NID success rate by channel","Verification turnaround","Failed verification log"],
  forms:["Manual NID entry","Photo-match exception"], cross:["A1 onboarding","H3 integration hub"], frs:14},

"A3":{area:"A", en:"Document Management", bn:"ডকুমেন্ট ব্যবস্থাপনা", icon:"🗂", desc:"AES-256 encrypted repository with product-aware checklists, verification workflow and expiry alerts.",
  kpis:[{l:"Docs verified (7d)",v:"1,204",d:"<b class='up'>+8%</b> vs prior",st:"ok"},
        {l:"Avg verify TAT",v:"4.1h",d:"From upload",st:"ok"},
        {l:"Expiring in 30d",v:"34",d:"Insurance & trade licenses",st:"warn"}],
  groups:[
    {en:"Repository", screens:[
      {id:"A3-s1", en:"Document Repository", bn:"ডকুমেন্ট রিপোজিটরি", t:"g"},
      {id:"A3-s2", en:"Full-text Search", bn:"পূর্ণ-টেক্সট অনুসন্ধান", t:"g"}]},
    {en:"Verification", screens:[
      {id:"A3-s3", en:"Verification Workflow", bn:"যাচাই ওয়ার্কফ্লো", t:"c"},
      {id:"A3-s4", en:"Checklist Templates", bn:"চেকলিস্ট টেমপ্লেট", t:"f"},
      {id:"A3-s5", en:"Expiry & Missing Alerts", bn:"মেয়াদ ও অনুপস্থিতি সতর্কতা", t:"g"}]}],
  reports:["Document turnaround","Rejected documents by type","Storage utilisation"],
  forms:["Upload document","Resubmission request","Template editor"], cross:["B1 application docs","F1 collateral papers"], frs:19},

/* ============ B · LOAN ORIGINATION ============ */
"B1":{area:"B", en:"Applications & Pipeline", bn:"আবেদন ও পাইপলাইন", icon:"▤", desc:"Multi-channel intake, 6-step application wizard, stage pipeline with SLA tracking and TAT analytics.",
  kpis:[{l:"In pipeline",v:"128",d:"across 65 branches",st:"info"},
        {l:"Avg TAT",v:"1.9d",d:"Target < 2d",st:"ok"},
        {l:"SLA at risk",v:"6",d:"Escalate within 24h",st:"err"}],
  groups:[
    {en:"Intake", screens:[
      {id:"B1-s1", en:"New Application Wizard", bn:"নতুন আবেদন উইজার্ড", t:"f", route:"#/apply"},
      {id:"B1-s2", en:"Application Pipeline", bn:"আবেদন পাইপলাইন", t:"g", route:"#/pipeline"},
      {id:"B1-s3", en:"Bulk Import (Excel/CSV)", bn:"বাল্ক ইমপোর্ট", t:"f"},
      {id:"B1-s4", en:"Partner API Channel", bn:"পার্টনার এপিআই চ্যানেল", t:"g"}]},
    {en:"Tracking", screens:[
      {id:"B1-s5", en:"Application Tracker", bn:"আবেদন ট্র্যাকার", t:"x"},
      {id:"B1-s6", en:"My Applications", bn:"আমার আবেদনসমূহ", t:"g"},
      {id:"B1-s7", en:"Customer Self-Service Tracker", bn:"গ্রাহক সেলফ-সার্ভিস ট্র্যাকার", t:"x", route:"portals.html"}]}],
  reports:["Pipeline funnel by stage","TAT by stage & branch","Approval rate trend","Drop-off analysis","Channel mix"],
  forms:["New application (6-step)","Return to maker","Bulk intake mapping"], cross:["C1 CIB","C3 CPV","D1 approvals"], frs:42},

"B2":{area:"B", en:"Product & Eligibility", bn:"পণ্য ও যোগ্যতা", icon:"◈", desc:"23-product bilingual catalog with rate cards, eligibility pre-check and side-by-side comparison.",
  kpis:[{l:"Active products",v:"23",d:"Retail · SME · Agri · Islamic",st:"info"},
        {l:"Top seller",v:"Personal Loan",d:"38% of Sep disbursal",st:"ok"},
        {l:"Eligibility passes",v:"74%",d:"Pre-check calculator",st:"ok"}],
  groups:[
    {en:"Catalog", screens:[
      {id:"B2-s1", en:"Product Catalog", bn:"পণ্য ক্যাটালগ", t:"g"},
      {id:"B2-s2", en:"Product Comparison", bn:"পণ্য তুলনা", t:"g"},
      {id:"B2-s3", en:"Islamic Products (Shariah)", bn:"ইসলামিক পণ্য", t:"g"}]},
    {en:"Configuration", screens:[
      {id:"B2-s4", en:"Product Setup", bn:"পণ্য সেটআপ", t:"f"},
      {id:"B2-s5", en:"Eligibility Calculator", bn:"যোগ্যতা ক্যালকুলেটর", t:"c"},
      {id:"B2-s6", en:"Charge & Fee Schedule", bn:"চার্জ ও ফি সূচি", t:"f"}]}],
  reports:["Product mix by volume","Yield by product","Product-wise approval rate"],
  forms:["New product","Rate revision","Deactivate product"], cross:["B1 wizard step 4","H2 workflow binding"], frs:26},

"B3":{area:"B", en:"BOCC Committee", bn:"বিওসিসি কমিটি", icon:"⚖", desc:"Branch Officers Credit Committee — agenda from pending cases, one-page review, voting, minutes in 10 minutes.",
  kpis:[{l:"Next sitting",v:"Tomorrow 10:00",d:"Gulshan · 9 cases listed",st:"info"},
        {l:"Avg decision",v:"6.2 min/case",d:"Last sitting",st:"ok"},
        {l:"Minutes TAT",v:"8 min",d:"From close to draft",st:"ok"}],
  groups:[
    {en:"Meetings", screens:[
      {id:"B3-s1", en:"Meeting Calendar", bn:"সভার ক্যালেন্ডার", t:"d"},
      {id:"B3-s2", en:"Agenda Builder", bn:"এজেন্ডা নির্মাণ", t:"f"},
      {id:"B3-s3", en:"Attendance & Check-in", bn:"উপস্থিতি", t:"f"}]},
    {en:"Review", screens:[
      {id:"B3-s4", en:"Committee Review Interface", bn:"কমিটি রিভিউ", t:"c"},
      {id:"B3-s5", en:"Voting & Resolutions", bn:"ভোট ও প্রস্তাব", t:"f"},
      {id:"B3-s6", en:"Minutes Archive", bn:"মিনিট আর্কাইভ", t:"g"}]}],
  reports:["Committee throughput","Approval vs rejection mix","Dissenting opinions log"],
  forms:["Schedule sitting","Record resolution","Digital sign-off"], cross:["D1 approval L5","B1 pipeline"], frs:18},

"B4":{area:"B", en:"Sanction & Letters", bn:"স্যাংকশন ও চিঠি", icon:"📜", desc:"Auto-generated bilingual sanction letters with acceptance tracking and branch copy distribution.",
  kpis:[{l:"Issued (Sep)",v:"214",d:"BN+EN bilingual",st:"ok"},
        {l:"Acceptance rate",v:"93%",d:"Within 15-day window",st:"ok"},
        {l:"Pending signature",v:"11",d:"Customer acceptance due",st:"warn"}],
  groups:[
    {en:"Generation", screens:[
      {id:"B4-s1", en:"Sanction Letter Generator", bn:"স্যাংকশন লিটার জেনারেটর", t:"c"},
      {id:"B4-s2", en:"Template Library", bn:"টেমপ্লেট লাইব্রেরি", t:"g"}]},
    {en:"Tracking", screens:[
      {id:"B4-s3", en:"Delivery & Acceptance", bn:"বিতরণ ও গ্রহণ", t:"g"},
      {id:"B4-s4", en:"Disbursement Memo", bn:"বিতরণ মেমো", t:"f"}]}],
  reports:["Issuance register","Acceptance aging"], forms:["Edit template","Regenerate letter","Send reminder"], cross:["D2 pre-disbursement"], frs:11},

/* ============ C · CREDIT ASSESSMENT ============ */
"C1":{area:"C", en:"CIB Bureau", bn:"সিআইবি ব্যুরো", icon:"🛡", desc:"Bangladesh Bank CIB — real-time inquiries, facility-wise report viewer, monthly fixed-width batch files, event-driven updates.",
  kpis:[{l:"Inquiries (24h)",v:"64",d:"p95 = 88s",st:"ok"},
        {l:"Hit rate",v:"58%",d:"Existing facilities found",st:"info"},
        {l:"Batch status",v:"Sep ✓ filed",d:"Oct due 05 Nov",st:"ok"}],
  groups:[
    {en:"Inquiry", screens:[
      {id:"C1-s1", en:"Individual Inquiry", bn:"ব্যক্তিগত জিজ্ঞাসা", t:"f"},
      {id:"C1-s2", en:"Corporate Inquiry", bn:"কর্পোরেট জিজ্ঞাসা", t:"f"},
      {id:"C1-s3", en:"Guarantor Check", bn:"গ্যারান্টর যাচাই", t:"f"},
      {id:"C1-s4", en:"CIB Report Viewer", bn:"সিআইবি রিপোর্ট ভিউয়ার", t:"x", route:"#/cib/CIF-100875"}]},
    {en:"Reporting", screens:[
      {id:"C1-s5", en:"Inquiry History", bn:"জিজ্ঞাসার ইতিহাস", t:"g"},
      {id:"C1-s6", en:"Monthly Batch Files", bn:"মাসিক ব্যাচ ফাইল", t:"c"},
      {id:"C1-s7", en:"Real-time Event Feed", bn:"রিয়েল-টাইম ইভেন্ট", t:"d"}]}],
  reports:["CIB hit rate","Inquiry turnaround","Classified-exposure found","Batch file reconciliation"],
  forms:["New inquiry","Dispute logging"], cross:["A1 customer 360","C2 scoring"], frs:23},

"C2":{area:"C", en:"Scoring & Financials", bn:"স্কোরিং ও আর্থিক", icon:"✦", desc:"5-component weighted scoring, live DBR gauges, what-if simulation and governed overrides.",
  kpis:[{l:"Avg score",v:"724",d:"From 685 baseline",st:"ok"},
        {l:"Auto-decision",v:"46%",d:"Straight-through AAA–A band",st:"ok"},
        {l:"Overrides (30d)",v:"9",d:"All with justification",st:"warn"}],
  groups:[
    {en:"Scoring", screens:[
      {id:"C2-s1", en:"Credit Score Card", bn:"ক্রেডিট স্কোর কার্ড", t:"x"},
      {id:"C2-s2", en:"What-if Simulator", bn:"হোয়াট-ইফ সিমুলেটর", t:"c"},
      {id:"C2-s3", en:"Override Register", bn:"ওভাররাইড রেজিস্টার", t:"g"}]},
    {en:"Financials", screens:[
      {id:"C2-s4", en:"DBR Calculator", bn:"ডিবিআর ক্যালকুলেটর", t:"c"},
      {id:"C2-s5", en:"Cash-flow Analysis", bn:"নগদ প্রবাহ বিশ্লেষণ", t:"d"},
      {id:"C2-s6", en:"Credit Memo Generator", bn:"ক্রেডিট মেমো", t:"f"}]}],
  reports:["Score-band distribution","DBR exceptions","Override audit","Model performance (KS/Gini)"],
  forms:["Override with justification","Income re-computation"], cross:["C1 CIB data","D1 approval"], frs:20},

"C3":{area:"C", en:"CPV Verification", bn:"সিপিভি যাচাই", icon:"📍", desc:"Contact-point verification — GPS-tagged offline field app, photo & signature evidence, manager review.",
  kpis:[{l:"Tasks open",v:"23",d:"3-day SLA default",st:"info"},
        {l:"On-time completion",v:"94%",d:"Rolling 30 days",st:"ok"},
        {l:"GPS accuracy",v:"< 10m",d:"Auto-capture",st:"ok"}],
  groups:[
    {en:"Field", screens:[
      {id:"C3-s1", en:"CPV Task Queue", bn:"সিপিভি কাজের কিউ", t:"g"},
      {id:"C3-s2", en:"Mobile CPV App", bn:"মোবাইল সিপিভি অ্যাপ", t:"x", route:"mobile.html"},
      {id:"C3-s3", en:"Assignment Console", bn:"অ্যাসাইনমেন্ট কনসোল", t:"c"}]},
    {en:"Review", screens:[
      {id:"C3-s4", en:"Field Report Review", bn:"ফিল্ড রিপোর্ট রিভিউ", t:"x"},
      {id:"C3-s5", en:"CPV Analytics", bn:"সিপিভি বিশ্লেষণ", t:"d"}]}],
  reports:["CPV TAT by officer","Pass/exception rate","Visit coverage map"],
  forms:["Assign task","Approve report","Re-verify"], cross:["B1 pipeline gate","H3 device sync"], frs:15},

"C4":{area:"C", en:"Collateral & Guarantors", bn:"জামানত ও গ্যারান্টর", icon:"🔒", desc:"Security registry with valuation tracking, insurance renewals, LTV monitoring and auction lots.",
  kpis:[{l:"Secured exposure",v:"68%",d:"Of gross portfolio",st:"ok"},
        {l:"Insurance expiring",v:"34",d:"Within 60 days",st:"warn"},
        {l:"Title exceptions",v:"5",d:"Land Registry mismatch",st:"err"}],
  groups:[
    {en:"Registry", screens:[
      {id:"C4-s1", en:"Collateral Registry", bn:"জামানত রেজিস্ট্রি", t:"g"},
      {id:"C4-s2", en:"Valuation Tracking", bn:"মূল্যায়ন ট্র্যাকিং", t:"f"},
      {id:"C4-s3", en:"Legal Verification (Land/BRTA)", bn:"আইনি যাচাই", t:"g"}]},
    {en:"Cover", screens:[
      {id:"C4-s4", en:"Insurance & Renewals", bn:"বিমা ও নবায়ন", t:"g"},
      {id:"C4-s5", en:"Guarantor Management", bn:"গ্যারান্টর ব্যবস্থাপনা", t:"g"},
      {id:"C4-s6", en:"Auction Lots", bn:"নিলামের লট", t:"g"}]}],
  reports:["LTV by collateral type","Insurance expiry register","Guarantor CIB exposure","Auction recovery"],
  forms:["Register collateral","Revalue","Attach guarantor","List auction lot"], cross:["F3 recovery","D2 checklist"], frs:24},

/* ============ D · APPROVAL & DISBURSEMENT ============ */
"D1":{area:"D", en:"Approval Workflow", bn:"অনুমোদন ওয়ার্কফ্লো", icon:"✅", desc:"Camunda-driven 7-level ladder (L1 Branch ≤5L → L7 MD >10Cr) with SLA escalation, delegation and digital signatures.",
  kpis:[{l:"My approvals",v:"6",d:"2 approaching SLA",st:"warn"},
        {l:"Avg decision",v:"3.4h",d:"All levels blended",st:"ok"},
        {l:"Auto-escalations",v:"2",d:"This week",st:"err"}],
  groups:[
    {en:"Inbox", screens:[
      {id:"D1-s1", en:"My Approvals", bn:"আমার অনুমোদন", t:"g", route:"#/approvals"},
      {id:"D1-s2", en:"Pending with Others", bn:"অন্যের কাছে অপেক্ষমাণ", t:"g"},
      {id:"D1-s3", en:"SLA & Escalation Board", bn:"এসএলএ ও এসকালেশন", t:"d"}]},
    {en:"Control", screens:[
      {id:"D1-s4", en:"Workflow Tracker", bn:"ওয়ার্কফ্লো ট্র্যাকার", t:"x"},
      {id:"D1-s5", en:"Delegation of Authority", bn:"ক্ষমতা প্রতিনিধিত্ব", t:"f"},
      {id:"D1-s6", en:"Digital Signature Console", bn:"ডিজিটাল স্বাক্ষর", t:"c"},
      {id:"D1-s7", en:"Approval Limit Matrix", bn:"অনুমোদন সীমা ম্যাট্রিক্স", t:"g"}]}],
  reports:["Approval TAT by level","Aging of pending","Conditional approvals","Escalation log"],
  forms:["Approve / Reject / Return","Approve with conditions","Delegate","Escalate"], cross:["B1 pipeline","B3 BOCC","H2 SLA rules"], frs:29},

"D2":{area:"D", en:"Disbursement", bn:"বিতরণ", icon:"💸", desc:"Pre-disbursement checklist with dual-auth override, multi-rail payout (CBS · BEFTN · bKash · Nagad · cheque) and retry handling.",
  kpis:[{l:"Ready to disburse",v:"18",d:"৳6.8 Cr queued",st:"info"},
        {l:"Today's payout",v:"৳1.42 Cr",d:"Across 12 branches",st:"ok"},
        {l:"Failed & retrying",v:"1",d:"bKash timeout",st:"warn"}],
  groups:[
    {en:"Control", screens:[
      {id:"D2-s1", en:"Pre-Disbursement Checklist", bn:"প্রাক-বিতরণ চেকলিস্ট", t:"c", route:"#/disburse"},
      {id:"D2-s2", en:"Dual Authorization", bn:"দ্বৈত অনুমোদন", t:"f"}]},
    {en:"Execution", screens:[
      {id:"D2-s3", en:"Disbursement Execution", bn:"বিতরণ সম্পাদন", t:"c"},
      {id:"D2-s4", en:"Disbursed Today", bn:"আজ বিতরণকৃত", t:"g"},
      {id:"D2-s5", en:"Failed & Retries", bn:"ব্যর্থ ও পুনঃচেষ্টা", t:"g"}]}],
  reports:["Disbursement register","Rail-wise payout","Failure analysis"],
  forms:["Execute payout","Override checklist item","Cancel & re-route"], cross:["B4 sanction","E1 loan activation"], frs:17},

"D3":{area:"D", en:"Limits & CBS Sync", bn:"লিমিট ও সিবিএস সিঙ্ক", icon:"🏦", desc:"Limit loading into Finacle CBS with reconciliation and exception dashboard.",
  kpis:[{l:"Limits loaded (Sep)",v:"214",d:"100% same-day",st:"ok"},
        {l:"Sync exceptions",v:"0",d:"Rolling 7 days",st:"ok"},
        {l:"Recon variance",v:"৳0",d:"vs GL",st:"ok"}],
  groups:[
    {en:"CBS", screens:[
      {id:"D3-s1", en:"Limit Loading", bn:"লিমিট লোডিং", t:"g"},
      {id:"D3-s2", en:"Finacle Sync Health", bn:"ফিনাকেল সিঙ্ক", t:"d"},
      {id:"D3-s3", en:"GL Reconciliation", bn:"জিএল রিকনসিলিয়েশন", t:"g"}]}],
  reports:["Sync exception log","GL variance report"], forms:["Manual limit push","Exception resolve"], cross:["H3 integration hub"], frs:9},

/* ============ E · SERVICING & PAYMENTS ============ */
"E1":{area:"E", en:"Loan Accounts", bn:"ঋণ হিসাব", icon:"◉", desc:"Loan 360° — outstanding, schedule, transactions, classification history, documents and collection log in one page.",
  kpis:[{l:"Active loans",v:"45,230",d:"৳5,200 Cr outstanding",st:"info"},
        {l:"Due today",v:"1,842",d:"৳7.1 Cr EMI",st:"info"},
        {l:"Early closure req",v:"7",d:"Awaiting quote",st:"warn"}],
  groups:[
    {en:"Portfolio", screens:[
      {id:"E1-s1", en:"Loan 360°", bn:"ঋণ ৩৬০°", t:"x", route:"#/loan/LN-40118"},
      {id:"E1-s2", en:"Portfolio List", bn:"পোর্টফোলিও তালিকা", t:"g"},
      {id:"E1-s3", en:"Due Today / Overdue", bn:"আজকের ও অনাদায়ী", t:"g"}]},
    {en:"Account Ops", screens:[
      {id:"E1-s4", en:"Closed & Settled", bn:"পরিশোধিত হিসাব", t:"g"},
      {id:"E1-s5", en:"Lien & Hold Management", bn:"লিয়েন ও হোল্ড", t:"f"}]}],
  reports:["Portfolio snapshot","Due & overdue calendar","Closure register"],
  forms:["Place hold","Release lien"], cross:["E2 payments","F1 classification"], frs:27},

"E2":{area:"E", en:"Payments & Receipts", bn:"পরিশোধ ও রিসিট", icon:"৳", desc:"EMI posting with auto-allocation, partial & excess handling, prepayment rebate and instant bilingual receipts.",
  kpis:[{l:"Collections today",v:"৳5.9 Cr",d:"91.4% of target",st:"ok"},
        {l:"Excess parked",v:"12",d:"₹ refund or adjust",st:"warn"},
        {l:"Auto-alloc accuracy",v:"99.6%",d:"Principal→interest→fee",st:"ok"}],
  groups:[
    {en:"Posting", screens:[
      {id:"E2-s1", en:"Payment Posting", bn:"পরিশোধ জমা", t:"f"},
      {id:"E2-s2", en:"Receipts Today", bn:"আজকের রিসিট", t:"g"},
      {id:"E2-s3", en:"Batch & Day-end", bn:"ব্যাচ ও দিন-শেষ", t:"c"}]},
    {en:"Exceptions", screens:[
      {id:"E2-s4", en:"Excess & Refunds", bn:"অতিরিক্ত ও ফেরত", t:"g"},
      {id:"E2-s5", en:"Prepayment & Foreclosure", bn:"প্রি-পেমেন্ট ও ফোরক্লোজার", t:"c"},
      {id:"E2-s6", en:"Late Fee & Waivers", bn:"বিলম্ব ফি ও মওকুফ", t:"f"}]}],
  reports:["Daily collection","Mode-of-payment mix","Fee income","Refund aging"],
  forms:["Post payment","Waive fee","Issue refund","Reprint receipt"], cross:["E1 loan 360","F2 collections"], frs:22},

"E3":{area:"E", en:"Schedules & Statements", bn:"তফসিলি ও স্টেটমেন্ট", icon:"🗓", desc:"Amortization engine (reducing / flat / rule-of-78), on-demand statements, tax & no-due certificates.",
  kpis:[{l:"Schedules generated",v:"45.2K",d:"Auto at disbursal",st:"ok"},
        {l:"Statements (24h)",v:"312",d:"Self-service + branch",st:"info"},
        {l:"Tax certs issued",v:"38K",d:"FY 2025-26",st:"ok"}],
  groups:[
    {en:"Schedule", screens:[
      {id:"E3-s1", en:"Schedule Generator", bn:"তফসিলি জেনারেটর", t:"c"},
      {id:"E3-s2", en:"Schedule Compare (restructure)", bn:"তফসিলি তুলনা", t:"g"}]},
    {en:"Certificates", screens:[
      {id:"E3-s3", en:"Account Statement", bn:"হিসাব স্টেটমেন্ট", t:"r"},
      {id:"E3-s4", en:"Annual Tax Certificate", bn:"বার্ষিক কর সনদ", t:"r"},
      {id:"E3-s5", en:"No-Due Certificate", bn:"ঋণমুক্তি সনদ", t:"r"}]}],
  reports:["Statement issuance log","Certificate register"], forms:["Regenerate schedule","Issue certificate"], cross:["E4 modification preview"], frs:12},

"E4":{area:"E", en:"Loan Modifications", bn:"ঋণ পরিবর্তন", icon:"🔧", desc:"Reschedule, restructure, top-up, rate change, moratorium — every action with impact preview and maker-checker.",
  kpis:[{l:"Requests open",v:"14",d:"4 restructures at HO",st:"info"},
        {l:"Provision impact",v:"৳42 L",d:"From restructures",st:"warn"},
        {l:"Top-up volume (Sep)",v:"৳3.1 Cr",d:"31 accounts",st:"ok"}],
  groups:[
    {en:"Restructuring", screens:[
      {id:"E4-s1", en:"Reschedule Request", bn:"পুনঃতফসিলী অনুরোধ", t:"f"},
      {id:"E4-s2", en:"Restructure (BRPD compliant)", bn:"পুনর্গঠন", t:"f"},
      {id:"E4-s3", en:"Moratorium", bn:"মোরাটোরিয়াম", t:"f"}]},
    {en:"Commercials", screens:[
      {id:"E4-s4", en:"Top-up Loan", bn:"টপ-আপ ঋণ", t:"f"},
      {id:"E4-s5", en:"Rate Change (floating reset)", bn:"সুদের হার পরিবর্তন", t:"f"},
      {id:"E4-s6", en:"Modification Register", bn:"পরিবর্তন রেজিস্টার", t:"g"}]}],
  reports:["Modification register","Provision impact of restructures","Top-up performance"],
  forms:["New modification","Approve modification"], cross:["F1 CL-5 report","D1 workflow"], frs:16},

/* ============ F · MONITORING & COLLECTIONS ============ */
"F1":{area:"F", en:"Classification & Provisioning", bn:"শ্রেণিবিন্যাস ও প্রভিশন", icon:"🏷", desc:"BRPD 15/2024 seven-stage engine — daily 02:30 EOD batch, provision GL posting, interest suspense, migration tracking.",
  kpis:[{l:"Gross NPL",v:"4.6%",d:"Target ≤ 5%",st:"ok"},
        {l:"Provision held",v:"৳212 Cr",d:"Coverage 68.5%",st:"ok"},
        {l:"Migrations (24h)",v:"+4",d:"STD-2 → SMA",st:"err"}],
  groups:[
    {en:"Engine", screens:[
      {id:"F1-s1", en:"BRPD Classification Board", bn:"বিআরপিডি বোর্ড", t:"c", route:"#/classification"},
      {id:"F1-s2", en:"Provisioning Calculator", bn:"প্রভিশন ক্যালকুলেটর", t:"c"},
      {id:"F1-s3", en:"EOD Batch Monitor", bn:"ইওডি ব্যাচ মনিটর", t:"d"}]},
    {en:"History", screens:[
      {id:"F1-s4", en:"Classification Change History", bn:"শ্রেণি পরিবর্তনের ইতিহাস", t:"g"},
      {id:"F1-s5", en:"Interest Suspense Entries", bn:"সুদ সাসপেন্স", t:"g"},
      {id:"F1-s6", en:"NPA Migration Tracker", bn:"এনপিএ মাইগ্রেশন", t:"d"}]}],
  reports:["CL-1 Classified loan details","CL-2 Provisioning details","CL-3 Recovery position","CL-4 Write-off details","CL-5 Restructured loans","NPA movement statement"],
  forms:["Reclassify with reason","Post provision JV","Reverse classification"], cross:["G3 regulatory console","E4 restructure"], frs:33},

"F2":{area:"F", en:"Collections Workbench", bn:"আদায় ওয়ার্কবেঞ্চ", icon:"🎧", desc:"DPD buckets, priority-ranked call lists, PTP tracking, field visits with GPS and dunning ladder automation.",
  kpis:[{l:"Collection efficiency",v:"91.4%",d:"Target 90%",st:"ok"},
        {l:"PTP kept rate",v:"72%",d:"Last 30 days",st:"ok"},
        {l:"Broken promises",v:"9",d:"Follow-up today",st:"err"}],
  groups:[
    {en:"Work", screens:[
      {id:"F2-s1", en:"Collections Workbench", bn:"আদায় ওয়ার্কবেঞ্চ", t:"c", route:"#/collections"},
      {id:"F2-s2", en:"DPD Bucket Lists", bn:"ডিপিডি বাকেট", t:"g"},
      {id:"F2-s3", en:"Daily Call List", bn:"দৈনিক কল তালিকা", t:"g"}]},
    {en:"Track", screens:[
      {id:"F2-s4", en:"PTP Tracker", bn:"পিটিপি ট্র্যাকার", t:"g"},
      {id:"F2-s5", en:"Field Visit Scheduler", bn:"ফিল্ড ভিজিট শিডিউল", t:"d"},
      {id:"F2-s6", en:"Dunning Ladder Setup", bn:"ডানিং ল্যাডার", t:"c"}]}],
  reports:["Collection efficiency","Bucket movement","Promise conversion","Field productivity"],
  forms:["Log call outcome","Create PTP","Schedule visit","Send SMS/email"], cross:["E2 receipts","F3 recovery"], frs:28},

"F3":{area:"F", en:"NPA Recovery", bn:"এনপিএ পুনরুদ্ধার", icon:"♺", desc:"Write-off workflow, recovery accounting & incentives, legal case tracking and agency assignment.",
  kpis:[{l:"Recovery rate",v:"58%",d:"From 42% baseline",st:"ok"},
        {l:"Legal cases open",v:"47",d:"Artha Rin Adalat",st:"info"},
        {l:"Write-offs (Sep)",v:"৳1.8 Cr",d:"Board-approved",st:"warn"}],
  groups:[
    {en:"Resolution", screens:[
      {id:"F3-s1", en:"Write-off Processing", bn:"অবলোপন প্রক্রিয়াকরণ", t:"c"},
      {id:"F3-s2", en:"Recovery Tracking", bn:"পুনরুদ্ধার ট্র্যাকিং", t:"g"},
      {id:"F3-s3", en:"Recovery Accounting", bn:"পুনরুদ্ধার হিসাব", t:"g"}]},
    {en:"External", screens:[
      {id:"F3-s4", en:"Legal Case Register", bn:"আইনি মামলা রেজিস্টার", t:"g"},
      {id:"F3-s5", en:"Agency Assignment", bn:"এজেন্সি নিয়োগ", t:"f"}]}],
  reports:["CL-3 recovery position","Legal case aging","Agency performance","Recovery incentive"],
  forms:["Initiate write-off","File legal case","Assign agency"], cross:["C4 auction","F1 CL-4"], frs:21},

"F4":{area:"F", en:"Early Warning (EWS)", bn:"প্রাথমিক সতর্কতা", icon:"⚠", desc:"Real-time risk signals ahead of DPD — bounce rates, utilisation spikes, sector stress and watchlist management.",
  kpis:[{l:"Active signals",v:"61",d:"Across 5 signal families",st:"warn"},
        {l:"Prevented migrations",v:"17",d:"Signal → action → cured",st:"ok"},
        {l:"Watchlist size",v:"88",d:"৳310 Cr exposure",st:"info"}],
  groups:[
    {en:"Signals", screens:[
      {id:"F4-s1", en:"EWS Dashboard", bn:"ইডাব্লিউএস ড্যাশবোর্ড", t:"d"},
      {id:"F4-s2", en:"Signal Explorer", bn:"সিগন্যাল এক্সপ্লোরার", t:"g"}]},
    {en:"Watchlist", screens:[
      {id:"F4-s3", en:"Watchlist Management", bn:"ওয়াচলিস্ট ব্যবস্থাপনা", t:"g"},
      {id:"F4-s4", en:"Cured Accounts", bn:"নিরাময় হিসাব", t:"g"}]}],
  reports:["Signal precision report","Watchlist movement","Sector stress map"],
  forms:["Add to watchlist","Escalate signal"], cross:["F2 collections","G1 analytics"], frs:13},

/* ============ G · INSIGHT & COMPLIANCE ============ */
"G1":{area:"G", en:"Dashboards & Analytics", bn:"ড্যাশবোর্ড ও বিশ্লেষণ", icon:"▦", desc:"Seven management dashboards — portfolio, pipeline, disbursement, collection, NPA, product and branch performance.",
  kpis:[{l:"Dashboards live",v:"7",d:"Real-time / daily refresh",st:"info"},
        {l:"Report gen p95",v:"11s",d:"SLA < 30s",st:"ok"},
        {l:"Board pack",v:"Auto",d:"Monthly, PDF + PPT",st:"ok"}],
  groups:[
    {en:"Executive", screens:[
      {id:"G1-s1", en:"Executive Dashboard", bn:"নির্বাহী ড্যাশবোর্ড", t:"d", route:"#/home"},
      {id:"G1-s2", en:"Portfolio Analytics", bn:"পোর্টফোলিও বিশ্লেষণ", t:"d", route:"#/analytics"}]},
    {en:"Performance", screens:[
      {id:"G1-s3", en:"Branch Performance", bn:"শাখা পারফরম্যান্স", t:"d"},
      {id:"G1-s4", en:"Product Performance", bn:"পণ্য পারফরম্যান্স", t:"d"},
      {id:"G1-s5", en:"Officer Productivity", bn:"কর্মকর্তা উৎপাদনশীলতা", t:"d"}]}],
  reports:["Disbursement trend","Vintage analysis","Roll-rate matrix","Branch ranking"],
  forms:["Schedule board pack"], cross:["G2 report center","F1 NPA"], frs:18},

"G2":{area:"G", en:"Report Center", bn:"রিপোর্ট সেন্টার", icon:"📄", desc:"45 configured reports — regulatory, operational and management — with parameters, scheduling, PDF/Excel export and a 7-step writer.",
  kpis:[{l:"Reports configured",v:"45",d:"BN/EN bilingual output",st:"info"},
        {l:"Scheduled runs (24h)",v:"96",d:"Auto email delivery",st:"ok"},
        {l:"Gen failure",v:"0",d:"Rolling 30 days",st:"ok"}],
  groups:[
    {en:"Browse", screens:[
      {id:"G2-s1", en:"All Reports", bn:"সকল রিপোর্ট", t:"g", route:"#/reports"},
      {id:"G2-s2", en:"My Scheduled", bn:"আমার শিডিউল", t:"g"}]},
    {en:"Author", screens:[
      {id:"G2-s3", en:"Report Writer (7-step)", bn:"রিপোর্ট রাইটার", t:"c", route:"#/writer"},
      {id:"G2-s4", en:"Report Viewer", bn:"রিপোর্ট ভিউয়ার", t:"r", route:"#/report/F1/0"}]}],
  reports:["Report catalogue","Run statistics","Export audit"],
  forms:["New schedule","Share report"], cross:["G3 regulatory returns","H4 audit"], frs:36},

"G3":{area:"G", en:"Regulatory Console", bn:"রেগুলেটরি কনসোল", icon:"🏛", desc:"Bangladesh Bank returns (CL-1…CL-5, CIB files, Basel III CAR 12.5%, EDW) with submission calendar and sign-off chain.",
  kpis:[{l:"Returns due (30d)",v:"6",d:"CL series + CIB batch",st:"info"},
        {l:"On-time record",v:"23/23",d:"24 months unbroken",st:"ok"},
        {l:"CAR (Q3)",v:"13.2%",d:"Floor 12.5%",st:"ok"}],
  groups:[
    {en:"Returns", screens:[
      {id:"G3-s1", en:"BB Returns Console", bn:"বাংলাদেশ ব্যাংক রিটার্ন", t:"c", route:"#/regcon"},
      {id:"G3-s2", en:"Submission Calendar", bn:"জমা দেওয়ার ক্যালেন্ডার", t:"d"}]},
    {en:"Frameworks", screens:[
      {id:"G3-s3", en:"Basel III Capital Adequacy", bn:"বাসেল-৩", t:"d"},
      {id:"G3-s4", en:"IFRS-9 / ECL Workspace", bn:"আইএফআরএস-৯ / ইসিএল", t:"c"},
      {id:"G3-s5", en:"Green Finance Tagging", bn:"সবুজ অর্থায়ন", t:"g"}]}],
  reports:["CL-1 … CL-5 series","CIB Subject & Contract files","Basel III CAR","EDW submission"],
  forms:["Prepare return","Compliance sign-off"], cross:["F1 classification","G4 ECL models"], frs:20},

"G4":{area:"G", en:"Risk Models (IFRS-9)", bn:"ঝুঁকি মডেল", icon:"🧮", desc:"PD/LGD/EAD model registry, 3-stage ECL runs, macro scenario lab and SICR back-testing (deadline Dec 2027).",
  kpis:[{l:"ECL coverage",v:"Stage 1-3",d:"Monthly run 1 Oct",st:"ok"},
        {l:"Model count",v:"6",d:"Retail, SME, Agri…",st:"info"},
        {l:"Back-test drift",v:"Low",d:"Q3 validation",st:"ok"}],
  groups:[
    {en:"Models", screens:[
      {id:"G4-s1", en:"PD / LGD / EAD Registry", bn:"পিডি/এলজিডি/ইএডি", t:"g"},
      {id:"G4-s2", en:"Model Documentation", bn:"মডেল ডকুমেন্টেশন", t:"x"}]},
    {en:"Runs", screens:[
      {id:"G4-s3", en:"ECL Run Console", bn:"ইসিএল রান কনসোল", t:"c"},
      {id:"G4-s4", en:"Scenario Lab", bn:"পরিস্থিতি ল্যাব", t:"c"},
      {id:"G4-s5", en:"Stage Migration Report", bn:"পর্যায় স্থানান্তর", t:"d"}]}],
  reports:["ECL movement","Model performance","Scenario comparison"],
  forms:["Approve model version","Run what-if"], cross:["G3 IFRS-9 report","F1 provisioning"], frs:14},

/* ============ H · PLATFORM & ADMIN ============ */
"H1":{area:"H", en:"Admin & Security", bn:"অ্যাডমিন ও নিরাপত্তা", icon:"👤", desc:"Users, RBAC roles, approval limits and the 65-branch organisation hierarchy on Keycloak SSO.",
  kpis:[{l:"Active users",v:"412",d:"400 branch + 50 HO",st:"info"},
        {l:"Password resets (7d)",v:"9",d:"Auto-service 71%",st:"ok"},
        {l:"Dormant accounts",v:"3",d:"30-day lock due",st:"warn"}],
  groups:[
    {en:"Identity", screens:[
      {id:"H1-s1", en:"User Management", bn:"ব্যবহারকারী ব্যবস্থাপনা", t:"g"},
      {id:"H1-s2", en:"Roles & Permissions (RBAC)", bn:"ভূমিকা ও অনুমতি", t:"f"},
      {id:"H1-s3", en:"Approval Limits", bn:"অনুমোদন সীমা", t:"g"}]},
    {en:"Org", screens:[
      {id:"H1-s4", en:"Organisation Hierarchy", bn:"প্রাতিষ্ঠানিক কাঠামো", t:"g"},
      {id:"H1-s5", en:"Session & Device Policy", bn:"সেশন ও ডিভাইস নীতি", t:"f"}]}],
  reports:["User activity summary","Role assignment matrix","Failed logins"],
  forms:["Create user","Assign role","Reset password","Deactivate"], cross:["D1 limit matrix","H4 audit"], frs:22},

"H2":{area:"H", en:"Workflow & SLA", bn:"ওয়ার্কফ্লো ও এসএলএ", icon:"⏱", desc:"Camunda BPMN deployment, DMN routing tables, SLA rules with escalation and the Bangladesh holiday calendar.",
  kpis:[{l:"Processes live",v:"11",d:"BPMN 2.0",st:"info"},
        {l:"SLA breaches (30d)",v:"4",d:"All escalated",st:"warn"},
        {l:"Holidays loaded",v:"2026 ✓",d:"BB + lunar calendar",st:"ok"}],
  groups:[
    {en:"Design", screens:[
      {id:"H2-s1", en:"Workflow Designer", bn:"ওয়ার্কফ্লো ডিজাইনার", t:"c"},
      {id:"H2-s2", en:"Routing Table (DMN)", bn:"রাউটিং টেবিল", t:"g"}]},
    {en:"Ops", screens:[
      {id:"H2-s3", en:"SLA Rules", bn:"এসএলএ নিয়ম", t:"g"},
      {id:"H2-s4", en:"Holiday Calendar", bn:"ছুটির ক্যালেন্ডার", t:"f"},
      {id:"H2-s5", en:"Job Scheduler", bn:"জব শিডিউলার", t:"d"}]}],
  reports:["Workflow throughput","SLA compliance","Job run history"],
  forms:["Deploy process","Edit SLA","Load holidays"], cross:["D1 approvals","F1 EOD batch"], frs:16},

"H3":{area:"H", en:"Integration Hub", bn:"ইন্টিগ্রেশন হাব", icon:"⇄", desc:"Health of CBS (Finacle), CIB, NIDW, bKash/Nagad/Rocket, SMS & email gateways — mTLS, keys and replay queues.",
  kpis:[{l:"All systems",v:"Operational",d:"9 of 9 up",st:"ok"},
        {l:"CIB p95 latency",v:"88s",d:"Threshold 120s",st:"ok"},
        {l:"Dead-letter queue",v:"0",d:"Rolling 24h",st:"ok"}],
  groups:[
    {en:"Health", screens:[
      {id:"H3-s1", en:"Integration Health", bn:"ইন্টিগ্রেশন স্বাস্থ্য", t:"d"},
      {id:"H3-s2", en:"Endpoint Registry", bn:"এন্ডপয়েন্ট রেজিস্ট্রি", t:"g"}]},
    {en:"Security", screens:[
      {id:"H3-s3", en:"Keys & Certificates", bn:"কী ও সার্টিফিকেট", t:"g"},
      {id:"H3-s4", en:"Replay & DLQ", bn:"রিপ্লে ও ডিএলকিউ", t:"g"}]}],
  reports:["Integration SLA","Error rate by endpoint","Cert expiry forecast"],
  forms:["Rotate key","Replay message","Add endpoint"], cross:["C1 CIB","A2 NIDW","D2 payout rails"], frs:13},

"H4":{area:"H", en:"Audit & Governance", bn:"অডিট ও গভর্নেন্স", icon:"🧾", desc:"Immutable audit trail on every approve/modify/override, user activity analytics and maker-checker log.",
  kpis:[{l:"Events (24h)",v:"18.4K",d:"100% captured",st:"ok"},
        {l:"Open findings",v:"2",d:"Both ICT V4.0",st:"warn"},
        {l:"Maker-checker blocks",v:"100%",d:"Sensitive actions",st:"ok"}],
  groups:[
    {en:"Trail", screens:[
      {id:"H4-s1", en:"Audit Trail Viewer", bn:"অডিট ট্রেইল ভিউয়ার", t:"g", route:"#/audit"},
      {id:"H4-s2", en:"Maker-Checker Log", bn:"মেকার-চেকার লগ", t:"g"}]},
    {en:"Review", screens:[
      {id:"H4-s3", en:"User Activity Analytics", bn:"ব্যবহারকারী কার্যক্রম", t:"d"},
      {id:"H4-s4", en:"Compliance Findings", bn:"কমপ্লায়েন্স ফাইন্ডিংস", t:"g"}]}],
  reports:["Audit export","Sensitive action log","Segregation-of-duties check"],
  forms:["Raise finding","Remediate"], cross:["D1 approvals","H1 users"], frs:12},

"H5":{area:"H", en:"System Settings", bn:"সিস্টেম সেটিংস", icon:"⚙", desc:"Working days, ৳ Lakh/Crore formatting, SMS/email templates, notification rules and bilingual document config.",
  kpis:[{l:"Config drift",v:"None",d:"vs approved baseline",st:"ok"},
        {l:"Templates live",v:"28",d:"BN + EN pairs",st:"info"},
        {l:"Settings changes (30d)",v:"5",d:"All maker-checkered",st:"ok"}],
  groups:[
    {en:"General", screens:[
      {id:"H5-s1", en:"General Settings", bn:"সাধারণ সেটিংস", t:"f", route:"#/settings"},
      {id:"H5-s2", en:"Number & Currency Format", bn:"সংখ্যা ও মুদ্রা ফরম্যাট", t:"f"}]},
    {en:"Comms", screens:[
      {id:"H5-s3", en:"SMS / Email Templates", bn:"এসএমএস / ইমেইল টেমপ্লেট", t:"g"},
      {id:"H5-s4", en:"Notification Rules", bn:"বিজ্ঞপ্তি নিয়ম", t:"g"},
      {id:"H5-s5", en:"Design System & Branding", bn:"ডিজাইন সিস্টেম", t:"x", route:"#/designsystem"}]}],
  reports:["Settings change log","Template usage"],
  forms:["Edit setting (maker-checker)","New template"], cross:["H4 audit","H1 admin"], frs:11}
};

/* Home tiles (role-center quick actions) */
window.LMS_HOME_TILES = [
  {label:"Application Pipeline", route:"#/pipeline", icon:"▤", badge:"128"},
  {label:"New Application", route:"#/apply", icon:"✚", badge:""},
  {label:"My Approvals", route:"#/approvals", icon:"✅", badge:"6"},
  {label:"Collections Workbench", route:"#/collections", icon:"🎧", badge:"61"},
  {label:"BRPD Classification", route:"#/classification", icon:"🏷", badge:""},
  {label:"Report Center", route:"#/reports", icon:"📄", badge:"45"},
  {label:"Customer Search", route:"#/screen/A1-s4", icon:"🔍", badge:""},
  {label:"Disbursement Queue", route:"#/disburse", icon:"💸", badge:"18"}
];

/* counts (computed once, used by coverage + statusbar) */
(function(){
  var screens=0, groups=0, reports=0, forms=0, frs=0, mods=0;
  Object.keys(window.LMS_MODULES).forEach(function(k){
    var m=window.LMS_MODULES[k]; mods++;
    m.groups.forEach(function(g){ groups++; screens+=g.screens.length; });
    reports+=m.reports.length; forms+=m.forms.length; frs+=m.frs||0;
  });
  window.LMS_COUNTS={areas:window.LMS_AREAS.length, modules:mods, groups:groups,
    screens:screens, reports:reports, forms:forms, frs:frs};
})();

})();
