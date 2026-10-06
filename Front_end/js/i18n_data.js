/* ============================================================
   ULMS i18n DATA — Bengali term layer (v1.0, Sept 2026)
   Keeps the two languages 100% separate:
   - LMSPick(en,bn)  : choose ONE name by current language
   - LMSLabel(en)    : translate a known English label at render time
   Codes (LN-, CIF, A1, CL-1), amounts and dates stay Latin by
   banking convention in BOTH languages.
   ============================================================ */
window.LMS_BN_GROUPS = {
  "AML & Screening":"এএমএল ও স্ক্রিনিং","Account Ops":"হিসাব পরিচালনা","Author":"রচক","Browse":"ব্রাউজ",
  "CBS":"সিবিএস","Catalog":"ক্যাটালগ","Certificates":"সনদপত্র","Commercials":"বাণিজ্যিক শর্ত","Comms":"যোগাযোগ",
  "Configuration":"কনফিগারেশন","Control":"নিয়ন্ত্রণ","Cover":"কভার","Customer Records":"গ্রাহক রেকর্ড",
  "Design":"ডিজাইন","Engine":"ইঞ্জিন","Exceptions":"ব্যতিক্রম","Execution":"বাস্তবায়ন","Executive":"নির্বাহী",
  "External":"বহিঃস্থ","Field":"ফিল্ড","Financials":"আর্থিক","Frameworks":"ফ্রেমওয়ার্ক","Gateway Ops":"গেটওয়ে পরিচালনা",
  "General":"সাধারণ","Generation":"জেনারেশন","Health":"স্বাস্থ্য সূচক","History":"ইতিহাস","Identity":"পরিচয়",
  "Inbox":"ইনবক্স","Inquiry":"অনুসন্ধান","Intake":"গ্রহণ","Meetings":"সভা","Models":"মডেল","Onboarding":"অনবোর্ডিং",
  "Ops":"পরিচালনা","Org":"সংগঠন","Performance":"পারফরম্যান্স","Portfolio":"পোর্টফোলিও","Posting":"পোস্টিং",
  "Registry":"রেজিস্ট্রি","Reporting":"রিপোর্টিং","Repository":"রিপোজিটরি","Resolution":"নিষ্পত্তি",
  "Restructuring":"পুনর্গঠন","Returns":"রিটার্ন","Review":"পর্যালোচনা","Runs":"রান","Schedule":"সময়সূচি",
  "Scoring":"স্কোরিং","Security":"নিরাপত্তা","Signals":"সংকেত","Track":"ট্র্যাক","Tracking":"ট্র্যাকিং",
  "Trail":"ট্রেইল","Verification":"যাচাই","Watchlist":"ওয়াচলিস্ট","Work":"কর্ম"
};
window.LMS_BN_TERM = {
  /* KPI labels */
  "Acceptance rate":"গ্রহণের হার","Active customers":"সক্রিয় গ্রাহক","Active loans":"সক্রিয় ঋণ","Active products":"সক্রিয় পণ্য",
  "Active signals":"সক্রিয় সংকেত","Active users":"সক্রিয় ব্যবহারকারী","All systems":"সব সিস্টেম","Auto-alloc accuracy":"স্বয়ংক্রিয় বণ্টন নির্ভুলতা",
  "Auto-decision":"স্বয়ংক্রিয় সিদ্ধান্ত","Auto-escalations":"স্বয়ংক্রিয় এসকালেশন","Auto-fill rate":"স্বয়ংক্রিয় পূরণ হার","Avg TAT":"গড় ট্যাট",
  "Avg decision":"গড় সিদ্ধান্ত","Avg score":"গড় স্কোর","Avg verify TAT":"গড় যাচাই ট্যাট","Back-test drift":"ব্যাক-টেস্ট ড্রিফট",
  "Batch status":"ব্যাচ স্ট্যাটাস","Board pack":"বোর্ড প্যাক","Broken promises":"ভাঙা প্রতিশ্রুতি","CAR (Q3)":"সিএআর (কিউ৩)",
  "CIB p95 latency":"সিআইবি p95 বিলম্ব","Collection efficiency":"আদায় দক্ষতা","Collections today":"আজকের আদায়","Config drift":"কনফিগ ড্রিফট",
  "Dashboards live":"লাইভ ড্যাশবোর্ড","Dead-letter queue":"ডেড-লেটার কিউ","Docs verified (7d)":"যাচাইকৃত দলিল (৭দিন)","Dormant accounts":"নিষ্ক্রিয় হিসাব",
  "Due today":"আজ দেয়","Duplicates flagged":"চিহ্নিত ডুপ্লিকেট","ECL coverage":"ইসিএল কভারেজ","Early closure req":"পূর্ব পরিশোধের আবেদন",
  "Eligibility passes":"যোগ্যতা উত্তীর্ণ","Events (24h)":"ইভেন্ট (২৪ঘা)","Excess parked":"উদ্বৃত্ত পার্কড","Expiring in 30d":"৩০দিনে মেয়াদোত্তীর্ণ",
  "Failed & retrying":"ব্যর্থ ও পুনঃচেষ্টা","GPS accuracy":"জিপিএস নির্ভুলতা","Gen failure":"জেনারেশন ব্যর্থ","Gross NPL":"মোট এনপিএল",
  "Hit rate":"হিট রেট","Holidays loaded":"লোডকৃত ছুটি","In pipeline":"পাইপলাইনে","Inquiries (24h)":"অনুসন্ধান (২৪ঘা)",
  "Insurance expiring":"বিমা মেয়াদোত্তীর্ণ","Issued (Sep)":"ইস্যু (সেপ্ট)","Legal cases open":"চলমান মামলা","Limits loaded (Sep)":"লোডকৃত লিমিট (সেপ্ট)",
  "Maker-checker blocks":"মেকার-চেকার ব্লক","Manual review":"ম্যানুয়াল পর্যালোচনা","Migrations (24h)":"মাইগ্রেশন (২৪ঘা)","Minutes TAT":"মিনিট ট্যাট",
  "Model count":"মডেল সংখ্যা","My approvals":"আমার অনুমোদন","NID verify p95":"এনআইডি যাচাই p95","Next sitting":"পরবর্তী বসা",
  "On-time completion":"সময়মতো সম্পন্ন","On-time record":"সময়মতো রেকর্ড","Open findings":"উন্মুক্ত ফাইন্ডিং","Overrides (30d)":"ওভাররাইড (৩০দিন)",
  "PTP kept rate":"পিটিপি রক্ষা হার","Password resets (7d)":"পাসওয়ার্ড রিসেট (৭দিন)","Pending signature":"অপেক্ষমান স্বাক্ষর",
  "Prevented migrations":"প্রতিরোধিত মাইগ্রেশন","Processes live":"লাইভ প্রসেস","Provision held":"সঞ্চিত প্রভিশন","Provision impact":"প্রভিশন প্রভাব",
  "Ready to disburse":"বিতরণে প্রস্তুত","Recon variance":"রেকন ব্যবধান","Recovery rate":"পুনরুদ্ধার হার","Report gen p95":"রিপোর্ট জেন p95",
  "Reports configured":"কনফিগারকৃত রিপোর্ট","Requests open":"অপেক্ষমান অনুরোধ","Returns due (30d)":"৩০দিনে দেয় রিটার্ন","SLA at risk":"এসএলএ ঝুঁকিতে",
  "SLA breaches (30d)":"এসএলএ ভাঙন (৩০দিন)","Scheduled runs (24h)":"নির্ধারিত রান (২৪ঘা)","Schedules generated":"জেনারেটেড শিডিউল",
  "Secured exposure":"জামানতের ঝুঁকি","Settings changes (30d)":"সেটিংস পরিবর্তন (৩০দিন)","Statements (24h)":"স্টেটমেন্ট (২৪ঘা)",
  "Sync exceptions":"সিঙ্ক ব্যতিক্রম","Tasks open":"অপেক্ষমান কাজ","Tax certs issued":"ইস্যুকৃত কর সনদ","Templates live":"লাইভ টেমপ্লেট",
  "Title exceptions":"টাইটেল ব্যতিক্রম","Today's payout":"আজকের পেমেন্ট","Top seller":"শীর্ষ বিক্রেতা","Top-up volume (Sep)":"টপ-আপ ভলিউম (সেপ্ট)",
  "Watchlist size":"ওয়াচলিস্ট আকার","Write-offs (Sep)":"রাইট-অফ (সেপ্ট)","e-KYC verified":"ই-কেওয়াইসি যাচাই",
  /* segments & common domain values */
  "Retail":"রিটেইল","SME":"এসএমই","Corporate":"কর্পোরেট","Agri":"কৃষি","Salaried":"বেতনভোগী",
  "Self-employed":"স্ব-নিযুক্ত","Business owner":"ব্যবসায়ী","Dhaka North":"ঢাকা উত্তর","Dhaka South":"ঢাকা দক্ষিণ",
  /* high-frequency page phrases */
  "Outstanding balance":"বকেয়া ব্যালেন্স","Instalment":"কিস্তি","due":"দেয়","Open module":"মডিউল খুলুন",
  "Filter modules & screens":"মডিউল ও স্ক্রিন ফিল্টার","groups":"গ্রুপ","screens":"স্ক্রিন","reports":"রিপোর্ট","forms":"ফর্ম",
  "Instant · no fee":"তাৎক্ষণিক · ফি নেই","Pay EMI now":"এখনই কিস্তি পরিশোধ করুন","Sign in":"প্রবেশ করুন"
};
window.LMS_BN_PLACES = {
  "Gulshan":"গুলশান","Dhanmondi":"ধানমন্ডি","Motijheel":"মতিঝিল","Uttara":"উত্তরা","Chattogram":"চট্টগ্রাম",
  "Sylhet":"সিলেট","Khulna":"খুলনা","Rajshahi":"রাজশাহী","Bogura":"বগুড়া","Narayanganj":"নারায়ণগঞ্জ",
  "Dhaka":"ঢাকা"
};
/* helpers — read the live language at render time */
window.LMSPick = function(en, bn){
  var lang = (window.LMS_SHELL && window.LMS_SHELL.lang) ||
             (localStorage.getItem("lms-lang") || "").replace(/"/g,"") || "en";
  if (lang === "bn") return bn || en || "";
  return en || bn || "";
};
window.LMSLabel = function(en){
  if (en == null) return "";
  var lang = (window.LMS_SHELL && window.LMS_SHELL.lang) ||
             (localStorage.getItem("lms-lang") || "").replace(/"/g,"") || "en";
  if (lang !== "bn") return en;
  var t = window.LMS_BN_TERM && window.LMS_BN_TERM[en];
  return t || en;
};
window.LMSPlace = function(en){
  if (en == null) return "";
  var lang = (window.LMS_SHELL && window.LMS_SHELL.lang) ||
             (localStorage.getItem("lms-lang") || "").replace(/"/g,"") || "en";
  if (lang !== "bn") return en;
  var p = window.LMS_BN_PLACES && window.LMS_BN_PLACES[en];
  if (p) return p;
  // try label dictionary too (regions etc.)
  return window.LMSLabel(en);
};
/* attach Bengali names to the 62 sub-module groups (nav model loads first) */
(function(){
  if (!window.LMS_MODULES) return;
  Object.keys(window.LMS_MODULES).forEach(function(mid){
    var m = window.LMS_MODULES[mid];
    m.groups.forEach(function(g){
      if (!g.bn) g.bn = window.LMS_BN_GROUPS[g.en] || g.en;
    });
  });
})();
