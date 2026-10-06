/* ============================================================
   ULMS Borrower — WORKING prototype logic.
   Simulates the /portal API in-page with the SAME contract the
   React Native app speaks (requestOtp/verifyOtp → otpToken,
   /portal/me, applications, payments/initiate + rail redirect,
   statement CSV), and the SAME domain math as mobile_app/src/
   domain/emi.ts. State persists in localStorage (per browser).
   ============================================================ */
"use strict";

/* ---------- i18n (both languages, like the app's strings.ts) ---------- */
const STR = {
  "app.title":   { bn: "ইউএলএমএস গ্রহীতা", en: "ULMS Borrower" },
  "login.title": { bn: "আসসালামু আলাইকুম", en: "Welcome" },
  "login.sendOtp": { bn: "কোড পাঠান", en: "Send code" },
  "login.otp":   { bn: "এসএমএস কোড", en: "SMS code" },
  "login.verify": { bn: "সাইন ইন", en: "Sign in" },
  "login.otpSent": { bn: "কোড পাঠানো হয়েছে — এসএমএস দেখুন", en: "Code sent — check your SMS" },
  "login.devCode": { bn: "ডেভ কোড স্বয়ংক্রিয় — প্রোডাকশনে এসএমএস আসবে", en: "Dev OTP auto-filled — production delivers by SMS" },
  "home.greeting": { bn: "আসসালামু আলাইকুম", en: "Hello" },
  "home.outstanding": { bn: "বকেয়া পরিমাণ", en: "Outstanding balance" },
  "home.emi":    { bn: "মাসিক কিস্তি", en: "Monthly instalment" },
  "home.nextDue": { bn: "পরবর্তী দেয়তারিখ", en: "Next due" },
  "home.dpd":    { bn: "দিন অতিবাহিত", en: "days past due" },
  "home.current": { bn: "হিসাব চলতি", en: "Your account is current" },
  "home.payNow": { bn: "এখনই পরিশোধ", en: "Pay now" },
  "track.title": { bn: "আমার আবেদন", en: "My applications" },
  "track.apply": { bn: "ঋণের আবেদন", en: "Apply for a loan" },
  "track.amount": { bn: "পরিমাণ (৳ লাখ)", en: "Amount (৳ Lakh)" },
  "track.submit": { bn: "আবেদন জমা দিন", en: "Submit application" },
  "pay.title":   { bn: "পরিশোধ করুন", en: "Make a payment" },
  "pay.amount":  { bn: "পরিমাণ (৳)", en: "Amount (৳)" },
  "pay.otpNeeded": { bn: "পরিশোধ নিশ্চিত করতে কোড লাগবে — উপরে কোড পাঠান", en: "A confirmation code is required — request one above" },
  "pay.requestOtp": { bn: "পরিশোধের কোড পাঠান", en: "Request payment code" },
  "pay.confirm": { bn: "নিশ্চিত ও পরিশোধ", en: "Confirm & pay" },
  "pay.redirect": { bn: "নিরাপদ চেকআউট খোলা হচ্ছে…", en: "Opening secure checkout…" },
  "pay.history": { bn: "পরিশোধের ইতিহাস", en: "Payment history" },
  "pay.empty":   { bn: "এখনো কোনো পরিশোধ নেই", en: "No payments yet" },
  "stmt.title":  { bn: "স্টেটমেন্ট", en: "Statements" },
  "stmt.download": { bn: "স্টেটমেন্ট ডাউনলোড (সিএসভি)", en: "Download statement (CSV)" },
  "more.title":  { bn: "আরও", en: "More" },
  "more.lang":   { bn: "ভাষা", en: "Language" },
  "more.payoff": { bn: "আগাম পরিশোধ ক্যালকুলেটর", en: "Early payoff calculator" },
  "more.payoffExtra": { bn: "অতিরিক্ত মাসিক (৳)", en: "Extra per month (৳)" },
  "more.help":   { bn: "সহায়তা", en: "Help & support" },
  "more.logout": { bn: "সাইন আউট", en: "Sign out" },
  "more.branch": { bn: "আপনার শাখা: বিআর-০০১ · +৮৮০ ২ ৫৫৬৬ ০০০০", en: "Your branch: BR-001 · +880 2 5566 0000" },
  "nav.home":    { bn: "হোম", en: "Home" },
  "nav.track":   { bn: "আবেদন", en: "Applications" },
  "nav.pay":     { bn: "পরিশোধ", en: "Pay" },
  "nav.statements": { bn: "স্টেটমেন্ট", en: "Statements" },
  "nav.more":    { bn: "আরও", en: "More" },
  "err.mobile":  { bn: "সঠিক মোবাইল নম্বর দিন (+8801…)", en: "Enter a valid mobile (+8801…)" },
  "err.otp":     { bn: "ভুল কোড", en: "Wrong code" },
  "err.amount":  { bn: "সঠিক পরিমাণ দিন", en: "Enter a valid amount" },
  "err.bounds":  { bn: "পরিমাণ ৳৫০,০০০–৳২,০০,০০০ মধ্যে হতে হবে", en: "Amount must be between ৳50,000 and ৳200,000" },
};
/* crypto-grade randomness (never Math.random for code-shaped values) */
function rnd(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, "0")).join("");
}

const t = (k) => (STR[k] ? STR[k][state.lang] : k);

/* ---------- pre-login news carousel (bank announcements) ---------- */
const NEWS = [
  { ico: "🏦", tag: "notice", tagCls: "",
    bn: { t: "সরকারি ছুটিতে শাখা বন্ধ", s: "অ্যাপ ও পোর্টাল ২৪/৭ খোলা — কিস্তি, স্টেটমেন্ট সব অনলাইনে।" },
    en: { t: "Branches closed on public holidays", s: "The app and portal stay open 24/7 — pay, download, track online." } },
  { ico: " OTP", tag: "security", tagCls: "info",
    bn: { t: "OTP কখনো শেয়ার করবেন না", s: "ABC Bank কখনো ফোনে কোড চাইবে না — প্রতারণা সতর্কতা।" },
    en: { t: "Never share your OTP", s: "ABC Bank will never ask for your code over the phone — stay alert." } },
  { ico: "🏡", tag: "rates", tagCls: "ok",
    bn: { t: "আবাসন ঋণ ৯.৫০% থেকে", s: "নতুন হোম লোনে প্রতিযোগী সুদহার — আবেদন করুন অ্যাপেই।" },
    en: { t: "Home loans from 9.50%", s: "Competitive rates on new home loans — apply right in the app." } },
  { ico: "📱", tag: "new", tagCls: "",
    bn: { t: "অনলাইন আবেদন এখন অ্যাপে", s: "ঋণের আবেদন, ট্র্যাকিং ও পরিশোধ — সব এক জায়গায়।" },
    en: { t: "Apply for a loan in-app", s: "Application, tracking and repayment — all in one place." } },
];
let newsIdx = 0, newsTimer = null;
function newsSlide() {
  const n = NEWS[newsIdx]; const c = n.bn && n.en ? n[state.lang] : n.en;
  return { ico: n.ico, tag: n.tag, cls: n.tagCls || "", t: c.t, s: c.s };
}
function startNews() {
  stopNews();
  newsTimer = setInterval(function () {
    const box = document.getElementById("newsBox");
    if (!box) return stopNews();
    newsIdx = (newsIdx + 1) % NEWS.length;
    paintNews();
  }, 3800);
}
function stopNews() { if (newsTimer) { clearInterval(newsTimer); newsTimer = null; } }
function paintNews() {
  const box = document.getElementById("newsBox");
  if (!box) return;
  const n = newsSlide();
  box.innerHTML = '<span class="nico">' + n.ico + '</span><div style="flex:1">' +
    '<span class="ntag ' + n.cls + '">' + n.tag + "</span>" +
    '<div class="ntitle">' + esc(n.t) + '</div><div class="nsub">' + esc(n.s) + "</div></div>";
  const dots = document.getElementById("newsDots");
  if (dots) dots.innerHTML = NEWS.map(function (_, i) {
    return '<i class="' + (i === newsIdx ? "on" : "") + '"></i>';
  }).join("");
  box.style.animation = "none"; void box.offsetWidth; box.style.animation = "fade .4s ease";
}

/* ---------- domain math — verbatim from mobile_app/src/domain/emi.ts ---------- */
function emiMonthly(principalMinor, months, annualRatePercent) {
  const i = annualRatePercent / 12 / 100;
  if (i === 0) return Math.round(principalMinor / months);
  const pow = Math.pow(1 + i, months);
  return Math.round((principalMinor * i * pow) / (pow - 1));
}
function payoffMonths(outstandingMinor, emiMinor, extraMinor, annualRatePercent) {
  const payment = emiMinor + extraMinor;
  if (payment <= 0) return null;
  const i = annualRatePercent / 12 / 100;
  if (i === 0) return Math.ceil(outstandingMinor / payment);
  if (payment <= outstandingMinor * i) return null;
  return Math.ceil(-Math.log(1 - (outstandingMinor * i) / payment) / Math.log(1 + i));
}
function tk(minor) { return "৳" + (minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 }); }
const BD_LKR = 100000 * 100;   // 1 lakh in minor

/* ---------- embedded /portal API simulation (same contract) ---------- */
const DB_KEY = "ulms.proto.db";
function db() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  // seed mirrors the mock stack: two loans, one current + one 22-DPD
  return {
    borrowers: {
      "+8801712345678": { cifNo: "CIF-100871", nameEn: "Rahim Uddin" },
    },
    loans: [
      { loanId: "l-1", loanNo: "LN-300001", productCode: "retail-home",
        outstandingMinor: 248000000, principalMinor: 400000000, tenorMonths: 60,
        interestRateBp: 1199, dpd: 0, classification: "STD-0", nextDueOn: "2026-10-05" },
      { loanId: "l-2", loanNo: "LN-300002", productCode: "sme-term",
        outstandingMinor: 187500000, principalMinor: 250000000, tenorMonths: 60,
        interestRateBp: 1300, dpd: 22, classification: "STD-1", nextDueOn: "2026-10-13" },
    ],
    applications: [
      { appNo: "APP-G2-11", stage: "SANCTION", productCode: "sme-term",
        amountMinor: 150000000, createdAt: "2026-10-01T10:00:00Z" },
    ],
    payments: [
      { loanId: "l-1", paidAt: "2026-09-05T09:12:00Z", amountMinor: 8895758, rail: "BKASH", utr: "TXN9F2K1" },
      { loanId: "l-1", paidAt: "2026-08-05T09:02:00Z", amountMinor: 8895758, rail: "NAGAD", utr: "TXN4A7C9" },
    ],
    seq: { app: 8127, pay: 1 },
  };
}
function saveDb(d) { localStorage.setItem(DB_KEY, JSON.stringify(d)); }
function resetDb() { localStorage.removeItem(DB_KEY); }

/* server-side shaped like the mock: {data} envelopes, 4xx on bad input */
const api = {
  requestOtp(mobile) {
    if (!/^\+8801[3-9]\d{8}$/.test(mobile)) return { status: 422, body: { detail: t("err.mobile") } };
    const code = String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
    api._lastCode = code;
    return { status: 200, body: { devCode: code } };   // dev stack returns it
  },
  verifyOtp(mobile, code) {
    if (!db().borrowers[mobile]) return { status: 404, body: { detail: "no borrower with that registered mobile" } };
    if (code !== api._lastCode) return { status: 401, body: { detail: t("err.otp") } };
    return { status: 200, body: { otpToken: "pay-" + rnd(5) } };
  },
  me(mobile) {
    const b = db().borrowers[mobile];
    if (!b) return { status: 404, body: { detail: "no borrower with that registered mobile" } };
    const loans = db().loans.filter((l) => !l.closed).map((l) => ({
      loanId: l.loanId, loanNo: l.loanNo, productCode: l.productCode,
      outstandingMinor: l.outstandingMinor, dpd: l.dpd, classification: l.classification,
      nextDueOn: l.nextDueOn,
      emiMinor: emiMonthly(l.principalMinor, l.tenorMonths, l.interestRateBp / 10000),
    }));
    return { status: 200, body: { cifNo: b.cifNo, nameEn: b.nameEn, loans } };
  },
  tracker(mobile) {
    const b = db().borrowers[mobile];
    return { status: 200, body: { data: db().applications.map((a) => ({
      appNo: a.appNo, stage: a.stage, productCode: a.productCode,
      amountMinor: a.amountMinor, createdAt: a.createdAt })) } };
  },
  apply(mobile, productCode, amountMinor) {
    if (amountMinor < 5000000 || amountMinor > 20000000)
      return { status: 422, body: { detail: t("err.bounds") } };   // retail-personal bounds
    const d = db();
    const a = { appNo: "APP-" + (++d.seq.app), stage: "SUBMITTED", productCode,
                amountMinor, createdAt: new Date().toISOString() };
    d.applications.push(a); saveDb(d);
    return { status: 201, body: a };
  },
  payments(mobile, loanId) {
    return { status: 200, body: { data: db().payments
      .filter((p) => p.loanId === loanId)
      .map((p) => ({ paidAt: p.paidAt, amountMinor: p.amountMinor, rail: p.rail, utr: p.utr })) } };
  },
  initiate(loanId, amountMinor, rail, otpToken) {
    if (!otpToken) return { status: 401, body: { detail: t("pay.otpNeeded") } };
    if (!(amountMinor > 0)) return { status: 422, body: { detail: t("err.amount") } };
    return { status: 200, body: { intentId: "pi-" + rnd(4),
            railUrl: "#checkout", status: "INITIATED" } };
  },
  postPayment(loanId, amountMinor, rail) {   // the bank-webhook step, simulated on confirm
    const d = db();
    const loan = d.loans.find((l) => l.loanId === loanId);
    loan.outstandingMinor = Math.max(0, loan.outstandingMinor - amountMinor);
    if (loan.dpd > 0 && amountMinor >= emiMonthly(loan.principalMinor, loan.tenorMonths, loan.interestRateBp / 10000)) {
      loan.dpd = 0; loan.classification = "STD-0";   // regularized
    }
    d.payments.push({ loanId, paidAt: new Date().toISOString(), amountMinor, rail,
                      utr: ("TXN" + rnd(4)).toUpperCase() });
    saveDb(d);
  },
};

/* ---------- app state ---------- */
const state = {
  lang: localStorage.getItem("ulms.proto.lang") || "bn",
  session: JSON.parse(localStorage.getItem("ulms.proto.session") || "null"),
  otpSent: false, devCode: null, otpToken: null,
  tab: "home", selectedLoanId: null, payRail: "BKASH", payOtp: null, payAmount: "",
};
function setLang(l) { state.lang = l; localStorage.setItem("ulms.proto.lang", l); render(); }
function logout() { state.session = null; state.otpSent = false; state.otpToken = null;
  state._msg = null; state._err = false;
  localStorage.removeItem("ulms.proto.session"); render(); }

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function loan() { return state.session.me.loans.find((l) => l.loanId === state.selectedLoanId)
  || state.session.me.loans[0]; }

/* ---------- render ---------- */
function render() {
  const screen = $("screen"), tabs = $("tabs");
  if (!state.session) { tabs.classList.add("hidden"); renderLogin(); startNews(); return; }
  stopNews();
  tabs.classList.remove("hidden");
  tabs.innerHTML = [
    ["home", "🏠"], ["track", "📄"], ["pay", "💳"], ["statements", "🧾"], ["more", "⚙"],
  ].map(([k, ico]) =>
    `<button class="tab ${state.tab === k ? "on" : ""}" data-tab="${k}">
       <span class="ico">${ico}</span>${t("nav." + k)}</button>`).join("");
  tabs.querySelectorAll(".tab").forEach((b) =>
    b.onclick = () => { state.tab = b.dataset.tab; render(); });
  ({ home: renderHome, track: renderTracker, pay: renderPay,
     statements: renderStatements, more: renderMore }[state.tab])();
}

function renderLogin() {
  const mobile = localStorage.getItem("ulms.proto.mobile") || "";
  const n = newsSlide();
  $("screen").innerHTML = `
    <div class="hero">
      <div class="brandrow">
        <div class="brandlogo">U</div>
        <div>
          <div class="brandname">ULMS Borrower</div>
          <div class="brandsub">ABC Bank Bangladesh · Digital Lending</div>
        </div>
      </div>
      <div class="welcome">${state.lang === "bn" ? "আপনার ঋণ, আপনার হাতের মুঠোয়" : "Your loan, in your hands"}</div>
      <div class="welsub">${state.lang === "bn"
        ? "কিস্তি পরিশোধ, আবেদন ট্র্যাকিং, স্টেটমেন্ট — সব কিছু নিরাপদে, যেকোনো সময়।"
        : "Repay, track and download statements — securely, any time."}</div>
      <div class="news" id="newsBox">
        <span class="nico">${n.ico}</span><div style="flex:1">
          <span class="ntag ${n.cls}">${n.tag}</span>
          <div class="ntitle">${esc(n.t)}</div><div class="nsub">${esc(n.s)}</div>
        </div>
      </div>
      <div class="dots" id="newsDots">${NEWS.map((_, i) => `<i class="${i === newsIdx ? "on" : ""}"></i>`).join("")}</div>
    </div>
    <div class="formcard">
      <div class="ftitle">${state.lang === "bn" ? "মোবাইল দিয়ে সাইন ইন করুন" : "Sign in with your mobile"}</div>
      <div class="fsub">${state.lang === "bn" ? "রেজিস্টার্ড নম্বরে এসএমএস কোড যাবে" : "We text a code to your registered number"}</div>
      <input id="fMobile" class="input" placeholder="+8801XXXXXXXXX" value="${esc(mobile)}">
      ${state.otpSent ? `
        <input id="fOtp" class="input mono" placeholder="${t("login.otp")}" value="${esc(state.devCode || "")}">
        <button id="fVerify" class="btn">${t("login.verify")}</button>` : `
        <button id="fSend" class="btn">${t("login.sendOtp")}</button>`}
      <div id="fMsg" class="${state._err ? "err" : "ok"} center">${state._msg || ""}</div>
    </div>
    <div class="trust">
      <span>Bangladesh Bank regulated</span><span>OTP secured</span><span>No card data on device</span>
    </div>
    <p class="fine center">
      demo borrower: <span class="mono">+8801712345678</span> ·
      <button id="fReset" style="color:#3F51B5;border:none;background:none;cursor:pointer;font:inherit">reset demo data</button>
    </p>`;
  if ($("fSend")) $("fSend").onclick = () => {
    const m = $("fMobile").value.trim();
    localStorage.setItem("ulms.proto.mobile", m);
    const r = api.requestOtp(m);
    if (r.status !== 200) { state._err = true; state._msg = r.body.detail; }
    else { state.otpSent = true; state.devCode = r.body.devCode; state._err = false;
           state._msg = t("login.devCode"); }
    render(); paintNews();
  };
  if ($("fVerify")) $("fVerify").onclick = () => {
    const m = $("fMobile").value.trim(), c = $("fOtp").value.trim();
    const v = api.verifyOtp(m, c);
    if (v.status !== 200) { state._err = true; state._msg = v.body.detail; render(); paintNews(); return; }
    const meR = api.me(m);
    if (meR.status !== 200) { state._err = true; state._msg = meR.body.detail; render(); paintNews(); return; }
    state.session = { mobile: m, otpToken: v.body.otpToken, me: meR.body };
    state.selectedLoanId = state.session.me.loans[0] && state.session.me.loans[0].loanId;
    state.otpSent = false; state.devCode = null; state._msg = null; state.tab = "home";
    localStorage.setItem("ulms.proto.session", JSON.stringify(state.session));
    render();
  };
  if ($("fReset")) $("fReset").onclick = () => { resetDb(); state._msg = null; render(); paintNews(); };
}

function renderHome() {
  const me = state.session.me;
  const l0 = me.loans[0];
  const others = me.loans.slice(1);
  const n = newsSlide();
  const initial = (me.nameEn || "?").trim().charAt(0).toUpperCase();
  $("screen").innerHTML = `
    <div class="topbar">
      <div class="avatar">${esc(initial)}</div>
      <div class="who">
        <div class="hi">${t("home.greeting")}</div>
        <div class="nm">${esc(me.nameEn)}</div>
      </div>
      <button class="langchip" id="tbLang">${state.lang === "bn" ? "EN" : "বাংলা"}</button>
    </div>
    ${l0 ? `
    <div class="herocard">
      <div class="hlabel">${t("home.outstanding")} · ${esc(l0.loanNo)}</div>
      <div class="hamount">${tk(l0.outstandingMinor)}</div>
      <div class="hrow">
        <div class="hf"><div class="hfv">${tk(l0.emiMinor)}</div><div class="hfl">${t("home.emi")}</div></div>
        <div class="hf"><div class="hfv">${esc(l0.nextDueOn)}</div><div class="hfl">${t("home.nextDue")}</div></div>
        <div class="hf"><div class="hfv" style="${l0.dpd > 0 ? "color:#F0C441" : "color:#A5D6A7"}">${l0.dpd > 0 ? l0.dpd : "✓"}</div>
          <div class="hfl">${l0.dpd > 0 ? t("home.dpd") : t("home.current")}</div></div>
      </div>
      <button class="hpay" data-pay="${esc(l0.loanId)}">${t("home.payNow")}</button>
    </div>` : ""}
    <div class="quickgrid">
      <button class="qa" data-qa="pay"><span class="qi">💳</span><span class="qt">${t("home.payNow")}</span></button>
      <button class="qa" data-qa="track"><span class="qi">📄</span><span class="qt">${t("track.title")}</span></button>
      <button class="qa" data-qa="statements"><span class="qi">🧾</span><span class="qt">${t("stmt.title")}</span></button>
      <button class="qa" data-qa="more"><span class="qi">➕</span><span class="qt">${t("track.apply")}</span></button>
    </div>
    <div class="strip">
      <span class="sico">${n.ico}</span>
      <span class="stxt" style="flex:1"><b>${esc(n.t)}</b> — ${esc(n.s)}</span>
      <span class="smore" id="stripNext">›</span>
    </div>
    ${others.map((l) => `
      <div class="card">
        <div class="mono muted">${esc(l.loanNo)} · ${esc(l.productCode)}</div>
        <div style="font-size:20px;font-weight:800;color:#1E2660;margin-top:2px">${tk(l.outstandingMinor)}</div>
        <div class="facts">
          <div class="fact"><div class="factV">${tk(l.emiMinor)}</div><div class="label">${t("home.emi")}</div></div>
          <div class="fact"><div class="factV">${esc(l.nextDueOn)}</div><div class="label">${t("home.nextDue")}</div></div>
          <div class="fact"><div class="factV" style="${l.dpd > 0 ? "color:#C50F1F" : "color:#107C10"}">${l.dpd > 0 ? l.dpd : "✓"}</div>
            <div class="label">${l.dpd > 0 ? t("home.dpd") : t("home.current")}</div></div>
        </div>
        <button class="btn" data-pay="${esc(l.loanId)}">${t("home.payNow")}</button>
      </div>`).join("")}
    ${me.loans.length === 0 ? `<p class="muted center" style="margin-top:24px">—</p>` : ""}`;
  $("tbLang").onclick = () => setLang(state.lang === "bn" ? "en" : "bn");
  $("stripNext").onclick = () => { newsIdx = (newsIdx + 1) % NEWS.length; render(); };
  $("screen").querySelectorAll("[data-pay]").forEach((b) =>
    b.onclick = () => { state.selectedLoanId = b.dataset.pay; state.tab = "pay"; render(); });
  $("screen").querySelectorAll("[data-qa]").forEach((b) =>
    b.onclick = () => {
      const qa = b.dataset.qa;
      if (qa === "more") { state.tab = "track"; render();
        setTimeout(function () { const a = document.getElementById("aAmt"); if (a) a.focus(); }, 60); }
      else { state.tab = qa; render(); }
    });
}

function renderTracker() {
  const rows = api.tracker(state.session.mobile).body.data;
  $("screen").innerHTML = `
    <div class="h1">${t("track.title")}</div>
    ${rows.map((r) => `
      <div class="card">
        <div class="mono" style="font-weight:700">${esc(r.appNo)}</div>
        <div class="stage-pill">${esc(r.stage)}</div>
        <div class="muted">${esc(r.productCode)} · ${tk(r.amountMinor)} · ${r.createdAt.slice(0, 10)}</div>
      </div>`).join("")}
    <div class="card">
      <div style="font-weight:700;font-size:13.5px">${t("track.apply")}</div>
      <input id="aAmt" class="input" placeholder="${t("track.amount")} (০.৫–২ লাখ / 0.5–2 lakh)" inputmode="decimal">
      <button id="aGo" class="btn">${t("track.submit")}</button>
      <div id="aMsg" class="err"></div>
    </div>`;
  $("aGo").onclick = () => {
    const lakh = parseFloat($("aAmt").value);
    const r = api.apply(state.session.mobile, "retail-personal",
      Math.round((lakh || 0) * BD_LKR));
    if (r.status !== 201) { $("aMsg").textContent = r.body.detail; return; }
    $("aMsg").className = "ok"; $("aMsg").textContent = r.body.appNo + " ✓";
    $("aAmt").value = "";
    setTimeout(render, 600);
  };
}

function renderPay() {
  const me = api.me(state.session.mobile).body;   // fresh balances
  state.session.me = me;
  const l = loan();
  const hist = api.payments(state.session.mobile, l.loanId).body.data;
  $("screen").innerHTML = `
    <div class="h1">${t("pay.title")} — ${esc(l.loanNo)}</div>
    <p class="muted">${t("home.emi")} ${tk(l.emiMinor)} · ${t("home.outstanding")} ${tk(l.outstandingMinor)}</p>
    <input id="pAmt" class="input" placeholder="${t("pay.amount")}" inputmode="decimal" value="${esc(state.payAmount)}" oninput="protoState().payAmount=this.value">
    <div>
      ${["BKASH", "NAGAD", "BEFTN"].map((r) =>
        `<button class="chip ${state.payRail === r ? "on" : ""}" data-rail="${r}">${r}</button>`).join("")}
    </div>
    ${!state.payOtp ? `
      <button id="pOtp" class="btn">${t("pay.requestOtp")}</button>` : `
      <button id="pGo" class="btn green">${t("pay.confirm")}</button>`}
    <div id="pMsg" class="err"></div>
    <div id="pOk" class="ok"></div>
    <div style="font-weight:700;font-size:13px;margin-top:10px">${t("pay.history")}</div>
    ${hist.length ? hist.map((p) => `
      <div class="card"><div style="font-weight:700">${tk(p.amountMinor)}</div>
      <div class="muted">${p.paidAt.slice(0, 10)} · ${p.rail} · ${esc(p.utr || "—")}</div></div>`).join("")
      : `<p class="muted">${t("pay.empty")}</p>`}`;
  $("screen").querySelectorAll("[data-rail]").forEach((b) =>
    b.onclick = () => { state.payRail = b.dataset.rail; render(); });
  if ($("pOtp")) $("pOtp").onclick = () => {
    const r = api.requestOtp(state.session.mobile);
    state.payOtp = r.body.devCode; render();
  };
  if ($("pGo")) $("pGo").onclick = () => {
    const amt = Math.round((parseFloat($("pAmt").value) || 0) * 100);
    const r = api.initiate(l.loanId, amt, state.payRail, state.payOtp && api.verifyOtp(state.session.mobile, state.payOtp).body.otpToken);
    if (r.status !== 200) { $("pMsg").textContent = r.body.detail; return; }
    $("pOk").textContent = t("pay.redirect");
    openCheckout(l, amt, state.payRail);
  };
}

function openCheckout(l, amountMinor, rail) {
  const ov = $("checkout");
  ov.classList.remove("hidden");
  $("coRail").textContent = rail === "BKASH" ? "bKash" : rail === "NAGAD" ? "Nagad" : "BEFTN";
  $("coRail").className = "co-head " + rail.toLowerCase();
  $("coAmount").textContent = tk(amountMinor);
  $("coAcc").value = "";
  $("coPay").onclick = () => {
    api.postPayment(l.loanId, amountMinor, rail);   // simulated webhook post
    ov.classList.add("hidden");
    state.payOtp = null; state.payAmount = "";      // fresh form for the next payment
    state.tab = "pay"; render();
  };
  $("coCancel").onclick = () => ov.classList.add("hidden");
}

function renderStatements() {
  const me = state.session.me;
  $("screen").innerHTML = `
    <div class="h1">${t("stmt.title")}</div>
    ${me.loans.map((l) => `
      <div class="card">
        <div class="mono" style="font-weight:700">${esc(l.loanNo)}</div>
        <div class="muted">${tk(l.outstandingMinor)}</div>
        <button class="btn" data-csv="${esc(l.loanId)}">${t("stmt.download")}</button>
      </div>`).join("")}`;
  $("screen").querySelectorAll("[data-csv]").forEach((b) =>
    b.onclick = () => downloadCsv(b.dataset.csv));
}

function downloadCsv(loanId) {
  const l = api.me(state.session.mobile).body.loans.find((x) => x.loanId === loanId);
  const rows = [["paidAt", "amountMinor", "rail", "utr"]]
    .concat(db().payments.filter((p) => p.loanId === loanId)
      .map((p) => [p.paidAt, p.amountMinor, p.rail, p.utr]));
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "statement-" + l.loanNo + ".csv";
  a.click(); URL.revokeObjectURL(a.href);
}

function renderMore() {
  const l = loan();
  const extra = parseFloat($("xExtra") ? $("xExtra").value : "") || 0;
  const extraMinor = Math.round(extra * 100);
  const base = payoffMonths(l.outstandingMinor, l.emiMinor, 0, 13);
  const faster = payoffMonths(l.outstandingMinor, l.emiMinor, extraMinor, 13);
  $("screen").innerHTML = `
    <div class="h1">${t("more.title")}</div>
    <div class="card">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px">${t("more.lang")}</div>
      <button class="chip ${state.lang === "bn" ? "on" : ""}" id="lBn">বাংলা</button>
      <button class="chip ${state.lang === "en" ? "on" : ""}" id="lEn">English</button>
    </div>
    <div class="card">
      <div style="font-weight:700;font-size:13px">${t("more.payoff")}</div>
      <input id="xExtra" class="input" placeholder="${t("more.payoffExtra")}" inputmode="decimal" value="${extra || ""}">
      <div class="ok" style="font-weight:700;margin-top:8px">${base ?? "—"} → ${faster ?? "—"} mo</div>
      <div class="muted">EMI ${tk(l.emiMinor)} @ 13% p.a.</div>
    </div>
    <div class="card">
      <div style="font-weight:700;font-size:13px">${t("more.help")}</div>
      <div class="muted" style="margin-top:3px">${t("more.branch")}</div>
    </div>
    <button class="btn ghost" id="doLogout">${t("more.logout")}</button>`;
  $("lBn").onclick = () => setLang("bn");
  $("lEn").onclick = () => setLang("en");
  $("xExtra").oninput = render;
  $("doLogout").onclick = logout;
}

// expose state for the inline oninput persistence bridge
window.protoState = function () { return state; };

render();
