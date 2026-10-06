/* ============================================================
   ULMS i18n — bilingual shell strings (EN / বাংলা) + statutory
   banking glossary. Screen/module names carry their own bn field
   inside nav_data.js; this file covers shell + system chrome.
   ============================================================ */
window.LMS_I18N = {
  en: {
    search_ph:"Search screens, records, reports (Tell-ME)", home:"Home", recents:"Recent", favorites:"Favorites",
    areas:"Areas", system:"System", pinned:"Pinned", open_tabs:"Open tabs", reopen:"Reopen last session",
    no_recents:"No recent items yet", no_fav:"Star a module to pin it here", filter_nav:"Filter navigation",
    density:"Density", theme:"Theme", saved:"Saved", lang_btn:"বাংলা", company:"Dhaka North Zone",
    form_saved:"Saved — draft posted, audit trail written", form_invalid:"Please fill the highlighted required fields",
    form_cancel:"Cancelled — no changes saved", confirm:"Confirm", cancel:"Cancel", submit:"Submit", close:"Close",
    view_all:"View all", clear:"Clear", apply:"Apply", export:"Export", refresh:"Refresh", columns:"Columns",
    save_view:"Save view", new:"New", search:"Search", results:"results", loading:"Loading…",
    autosave:"Autosave on · 30s", shortcuts:"Keyboard shortcuts", palette:"Command palette",
    notifications:"Notifications", mark_read:"Mark all read", settings:"Settings", signout:"Sign out",
    my_work:"My work", quick_actions:"Quick actions", today:"Today", this_week:"This week",
    loan_apps:"Loan applications", customers:"Customers", reports_lbl:"Reports", help:"Help",
    step_of:"Step {n} of {m}", next:"Next", back:"Back", review:"Review", submit_app:"Submit application",
    powered_by:"Unisoft Systems Limited", env_staging:"STAGING"
  },
  bn: {
    search_ph:"স্ক্রিন, রেকর্ড, রিপোর্ট খুঁজুন (Tell-ME)", home:"হোম", recents:"সাম্প্রতিক", favorites:"প্রিয়",
    areas:"এরিয়া", system:"সিস্টেম", pinned:"পিন করা", open_tabs:"খোলা ট্যাব", reopen:"শেষ সেশন পুনরায় খুলুন",
    no_recents:"এখনো কোনো সাম্প্রতিক আইটেম নেই", no_fav:"মডিউলটি পিন করতে তারায় ক্লিক করুন", filter_nav:"নেভিগেশন ফিল্টার",
    density:"ঘনত্ব", theme:"থিম", saved:"সংরক্ষিত", lang_btn:"EN", company:"ঢাকা উত্তর অঞ্চল",
    form_saved:"সংরক্ষিত — ড্রাফট জমা হয়েছে, অডিট ট্রেইল লেখা হয়েছে", form_invalid:"হাইলাইট করা আবশ্যক ঘরগুলো পূরণ করুন",
    form_cancel:"বাতিল — কোনো পরিবর্তন সংরক্ষিত হয়নি", confirm:"নিশ্চিত করুন", cancel:"বাতিল", submit:"জমা দিন", close:"বন্ধ",
    view_all:"সব দেখুন", clear:"পরিষ্কার", apply:"প্রয়োগ", export:"এক্সপোর্ট", refresh:"রিফ্রেশ", columns:"কলাম",
    save_view:"ভিউ সংরক্ষণ", new:"নতুন", search:"খুঁজুন", results:"ফলাফল", loading:"লোড হচ্ছে…",
    autosave:"অটোসেভ চালু · ৩০ সেকেন্ড", shortcuts:"কীবোর্ড শর্টকাট", palette:"কমান্ড প্যালেট",
    notifications:"বিজ্ঞপ্তি", mark_read:"সব পঠিত হিসেবে চিহ্নিত", settings:"সেটিংস", signout:"সাইন আউট",
    my_work:"আমার কাজ", quick_actions:"দ্রুত কাজ", today:"আজ", this_week:"এই সপ্তাহ",
    loan_apps:"ঋণ আবেদন", customers:"গ্রাহক", reports_lbl:"রিপোর্ট", help:"সহায়তা",
    step_of:"ধাপ {n} / {m}", next:"পরবর্তী", back:"পূর্ববর্তী", review:"রিভিউ", submit_app:"আবেদন জমা দিন",
    powered_by:"ইউনিসফট সিস্টেমস লিমিটেড", env_staging:"স্টেজিং"
  }
};

/* Statutory / domain glossary — enforced in translation QA */
window.LMS_GLOSSARY = {
  "Loan":"ঋণ","Loan Application":"ঋণ আবেদন","Disbursement":"বাতিলকরণ / বিতরণ","Repayment":"পরিশোধ",
  "Interest Rate":"সুদের হার","EMI":"কিস্তি","DPD":"অতিরিক্ত দিন অতিবাহিত (DPD)",
  "Standard Loan":"উত্তম ঋণ","Special Mention":"বিশেষ উল্লেখ (SMA)","Substandard":"অনুত্তম ঋণ",
  "Doubtful":"সন্দেহজনক ঋণ","Bad/Loss":"অবলোপন ঋণ","Provision":"প্রভিশন",
  "NPL / NPA":"খেলাধুলায় অনুপযুক্ত ঋণ","Classification":"শ্রেণিবিন্যাস","Collateral":"জামানত",
  "Guarantor":"গ্যারান্টর","CIB":"ক্রেডিট ইনফরমেশন ব্যুরো","Sanction Letter":"স্যাংকশন লিটার",
  "Write-off":"অবলোপন","Recovery":"পুনরুদ্ধার","Restructure":"পুনর্গঠন","Reschedule":"পুনঃতফসিলী",
  "Customer":"গ্রাহক","Branch":"শাখা","Outstanding":"বকেয়া","Overdue":"অনাদায়ী",
  "e-KYC":"ই-কেওয়াইসি","Nominee":"নমিনি","Taka":"টাকা"
};
