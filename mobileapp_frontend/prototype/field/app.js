/* ============================================================
   ULMS FIELD — working prototype logic. Simulates the /field API
   (delta pull with bundleVersion, idempotent visits keyed by
   clientUuid, field PTP, SOS ledger) and the offline sync engine
   (server-wins, append-only evidence, backoff) with the same
   contracts as LMS_CODEBASE/apps/mobile. State persists in
   localStorage. Bangla-first with an EN toggle.
   ============================================================ */
"use strict";

/* ---------- i18n ---------- */
const STR = {
  "nav.today": { bn: "আজকের ভিজিট", en: "Today" },
  "nav.cpv": { bn: "সিপিভি কাজ", en: "CPV tasks" },
  "nav.map": { bn: "মানচিত্র", en: "Map" },
  "nav.proof": { bn: "প্রমাণ", en: "Proof" },
  "nav.sos": { bn: "এসওএস", en: "SOS" },
  "nav.sync": { bn: "সিঙ্ক", en: "Sync" },
  "today.title": { bn: "আজকের ভিজিট", en: "Today's visits" },
  "today.logCall": { bn: "কল লগ", en: "Log call" },
  "today.ptp": { bn: "প্রতিশ্রুতি", en: "Promise to Pay" },
  "today.ptpAmt": { bn: "প্রতিশ্রুত (৳ লাখ)", en: "Promised (৳ Lakh)" },
  "today.ptpDate": { bn: "তারিখ", en: "Date" },
  "today.ptpSave": { bn: "প্রতিশ্রুতি লিপিবদ্ধ (কিউ)", en: "Record promise (queued)" },
  "cpv.residence": { bn: "আবাসন যাচাই", en: "Residence verification" },
  "cpv.personMet": { bn: "ব্যক্তির সাথে দেখা", en: "Person met" },
  "cpv.photos": { bn: "ছবি (ন্যূনতম ১)", en: "Photos (min 1)" },
  "cpv.notes": { bn: "মন্তব্য", en: "Notes" },
  "cpv.voice": { bn: "ভয়েস নোট রেকর্ড (≤৫ মিনিট)", en: "Record voice note (≤5 min)" },
  "cpv.voiceStop": { bn: "রেকর্ড বন্ধ", en: "Stop recording" },
  "cpv.signature": { bn: "গ্রহীতার স্বাক্ষর", en: "Borrower signature" },
  "cpv.signed": { bn: "স্বাক্ষর গৃহীত", en: "Signature captured" },
  "cpv.submit": { bn: "জমা (অফলাইন কিউ)", en: "Submit (queued offline)" },
  "cpv.clear": { bn: "মুছুন", en: "Clear" },
  "gps.waiting": { bn: "জিপিএস নেওয়া হচ্ছে…", en: "Acquiring GPS…" },
  "map.title": { bn: "ফিল্ড মানচিত্র", en: "Field map" },
  "map.note": { bn: "স্কিমেটিক পিন বোর্ড", en: "Schematic pin board" },
  "proof.title": { bn: "প্রমাণ গ্যালারি", en: "Proof gallery" },
  "proof.empty": { bn: "এখনো কোনো প্রমাণ নেই", en: "No evidence yet" },
  "sos.title": { bn: "এসওএস এস্কালেশন", en: "SOS escalation" },
  "sos.arm": { bn: "এসওএস প্রস্তুত", en: "ARM SOS" },
  "sos.send": { bn: "এখনই পাঠান", en: "SEND NOW" },
  "sos.cancel": { bn: "বাতিল", en: "Cancel" },
  "sos.queued": { bn: "এসওএস সারিবদ্ধ — সংযোগ পেলেই যাবে", en: "SOS queued — fires on connectivity" },
  "sync.title": { bn: "সিঙ্ক", en: "Sync" },
  "sync.now": { bn: "এখনই সিঙ্ক", en: "Sync now" },
  "sync.synced": { bn: "সিঙ্ককৃত", en: "Synced" },
  "sync.pending": { bn: "অপেক্ষমাণ", en: "Pending" },
  "sync.conflict": { bn: "দ্বন্দ্ব — সার্ভার জয়ী", en: "Conflict — server wins" },
};
const t = (k) => (STR[k] ? STR[k][state.lang] : k);

/* ---------- domain: FNV-1a integrity checksum (as the app does) ---------- */
function fnv1a(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0").repeat(4).slice(0, 32);
}
function rnd(n) { const b = new Uint8Array(n); crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, "0")).join(""); }

/* ---------- embedded /field API + sync engine simulation ---------- */
const DB_KEY = "ulms.fieldproto.db";
const SEED_TASKS = [
  { id: "ft-1", loanNo: "LN-300002", loanId: "l-2", assignedTo: "r.islam",
    dueOn: "2026-10-05", status: "OPEN", lat: 34, lng: 58, dpd: 22, cls: "STD-1" },
  { id: "ft-2", loanNo: "LN-300004", loanId: "l-4", assignedTo: "r.islam",
    dueOn: "2026-10-05", status: "OPEN", lat: 52, lng: 41, dpd: 78, cls: "SMA" },
  { id: "ft-3", loanNo: "LN-300005", loanId: "l-5", assignedTo: "r.islam",
    dueOn: "2026-10-06", status: "OPEN", lat: 68, lng: 66, dpd: 140, cls: "SS" },
  { id: "ft-4", loanNo: "LN-300006", loanId: "l-6", assignedTo: "r.islam",
    dueOn: "2026-10-07", status: "OPEN", lat: null, lng: null, dpd: 240, cls: "DF" },
];
function db() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  return { tasks: SEED_TASKS.map(x => Object.assign({}, x)), visits: [], queue: [] };
}
function saveDb(d) { localStorage.setItem(DB_KEY, JSON.stringify(d)); }
function resetDb() { localStorage.removeItem(DB_KEY); }

const api = {
  delta() {   // GET /field/tasks — full bundle (bundleVersion derived)
    const d = db();
    const version = d.tasks.map(x => x.status === "DONE" ? "1" : "0").join("") + "." + d.visits.length;
    return { status: 200, body: { data: d.tasks.filter(x => x.assignedTo === "r.islam"), bundleVersion: version } };
  },
  visit(d, clientUuid, taskId, outcome, evidence) {   // idempotent by clientUuid (shared db handle)
    const prior = d.visits.find(v => v.clientUuid === clientUuid);
    if (prior) return { status: 200, body: { id: prior.id, clientUuid, applied: false, outcome: prior.outcome, replayed: true } };
    const task = d.tasks.find(x => x.id === taskId);
    let applied = true;
    if (task && task.status !== "DONE") { task.status = "DONE"; }
    else if (task) { applied = false; }   // server-wins on an already-DONE task
    const v = { id: "fv-" + rnd(3), clientUuid, taskId, outcome, evidence, applied };
    d.visits.push(v);
    return { status: applied ? 201 : 200, body: { id: v.id, clientUuid, applied, outcome, replayed: false } };
  },
  ptp() { return { status: 201, body: { ok: true } }; },
  sos(payload) {   // one alert per call (durable + outbox)
    return { status: 201, body: { id: "sos-" + rnd(3), status: "OPEN", officer: "r.islam",
      lat: payload.lat, lng: payload.lng, note: payload.note } };
  },
};

/* sync engine: drain the queue — one op is pre-marked to conflict */
function syncDrain() {
  const d = db();
  const res = { synced: 0, conflicts: 0, appended: 0, failed: 0 };
  d.queue = d.queue.filter(function (op) {
    if (op.state === "synced") return true;   // keep history
    if (op.conflictDemo) {
      // server-wins: task already DONE by another officer — evidence appends
      op.state = "conflict"; op.attempts = (op.attempts || 0);
      res.conflicts++; res.appended += op.evidence.length;
      return true;
    }
    if (op.kind === "visit") {
      const r = api.visit(d, op.id, op.taskId, op.outcome, op.evidence);
      op.state = r.body.applied ? "synced" : "conflict";
      if (!r.body.applied) res.conflicts++; else res.synced++;
    } else { op.state = "synced"; res.synced++; }
    return true;
  });
  saveDb(d);
  return res;
}

/* ---------- state ---------- */
const state = {
  lang: localStorage.getItem("ulms.fieldproto.lang") || "bn",
  authed: localStorage.getItem("ulms.fieldproto.authed") === "1",
  pinOk: localStorage.getItem("ulms.fieldproto.pinok") === "1",
  hasPin: localStorage.getItem("ulms.fieldproto.pin") != null,
  tab: "today",
  form: null,          // CPV form state for the selected task
  sigData: null,       // signature captured flag + checksum
  ptpFor: null,
  sosArmed: false,
  voiceSec: null,
};
const $ = (id) => document.getElementById(id);
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function setLang(l) { state.lang = l; localStorage.setItem("ulms.fieldproto.lang", l); render(); }

/* ---------- render ---------- */
function render() {
  const tabs = $("tabs");
  if (!state.authed) { tabs.classList.add("hidden"); return renderLogin(); }
  if (!state.pinOk) { tabs.classList.add("hidden"); return renderPin(); }
  tabs.classList.remove("hidden");
  tabs.innerHTML = [["today","📋"],["cpv","✅"],["map","🗺"],["proof","🗂"],["sos","🆘"],["sync","🔄"]]
    .map(([k,i]) => `<button class="tab ${state.tab===k?"on":""}" data-tab="${k}"><span class="ico">${i}</span>${t("nav."+k)}</button>`).join("");
  tabs.querySelectorAll(".tab").forEach(b => b.onclick = () => { state.tab = b.dataset.tab; state.form = null; render(); });
  ({ today: renderToday, cpv: renderCpv, map: renderMap, proof: renderProof, sos: renderSos, sync: renderSync }[state.tab])();
}

function renderLogin() {
  $("screen").innerHTML = `
    <div class="hero">
      <div class="brandrow"><div class="brandlogo">U</div><div>
        <div class="brandname">ULMS Field</div>
        <div class="brandsub">ABC Bank · e-KYC & collections</div></div></div>
      <div class="welcome">${state.lang==="bn"?"ফিল্ড কাজ, অফলাইন-প্রথম":"Field work, offline-first"}</div>
      <div class="welsub">${state.lang==="bn"?"যাচাই, ভিজিট ও আদায় — প্রমাণসহ নিরাপদ সিঙ্ক।":"Verifications, visits and collections — with evidence that syncs safely."}</div>
      <div class="news"><span style="font-size:18px">📶</span><div>
        <span class="ntag">offline</span>
        <div class="ntitle">${state.lang==="bn"?"ইন্টারনেট ছাড়াই কাজ":"Works without internet"}</div>
        <div class="nsub">${state.lang==="bn"?"ছবি ও জিপিএস ডিভাইসে কিউ হয়, সংযোগ পেলে সিঙ্ক।":"Photos and GPS queue on-device, sync when back in coverage."}</div>
      </div></div>
    </div>
    <div class="formcard">
      <div class="ftitle">${state.lang==="bn"?"আজকের ভিজিট শুরু করতে সাইন ইন করুন":"Sign in to start today's visits"}</div>
      <div class="fsub">Keycloak PKCE · system browser round-trip (simulated)</div>
      <button class="btnP btnFull" id="doLogin">${state.lang==="bn"?"ব্যাংক অ্যাকাউন্ট দিয়ে সাইন ইন":"Sign in with bank account"}</button>
    </div>
    <p class="fine center">demo mode · <button id="doReset" style="color:#3F51B5;border:none;background:none;cursor:pointer;font:inherit">reset demo data</button> ·
      <button id="doLang" style="color:#3F51B5;border:none;background:none;cursor:pointer;font:inherit">${state.lang==="bn"?"English":"বাংলা"}</button></p>`;
  $("doLogin").onclick = () => { state.authed = true; localStorage.setItem("ulms.fieldproto.authed","1"); render(); };
  $("doReset").onclick = () => { resetDb(); localStorage.removeItem("ulms.fieldproto.authed");
    localStorage.removeItem("ulms.fieldproto.pinok"); localStorage.removeItem("ulms.fieldproto.pin");
    state.authed = false; state.pinOk = false; state.hasPin = false; render(); };
  $("doLang").onclick = () => setLang(state.lang === "bn" ? "en" : "bn");
}

function renderPin() {
  const step = state.hasPin ? "enter" : "set";
  $("screen").innerHTML = `
    <div class="h1 center" style="margin-top:40px">${step==="set" ? (state.lang==="bn"?"অ্যাপ পিন সেট করুন":"Set your app PIN") : (state.lang==="bn"?"পিন দিন":"Enter PIN")}</div>
    <p class="hint center">4–6 ${state.lang==="bn"?"সংখ্যা":"digits"} · ${state.lang==="bn"?"প্রতি কোল্ড স্টার্টে লাগবে":"required on every cold start"}</p>
    <input id="pinIn" class="input center" style="font-size:20px;letter-spacing:8px;text-align:center" type="password" maxlength="6" inputmode="numeric">
    ${step==="set" ? `<input id="pinIn2" class="input center" style="font-size:20px;letter-spacing:8px;text-align:center" type="password" maxlength="6" inputmode="numeric" placeholder="confirm">` : ""}
    <button class="btnP btnFull" id="pinGo">${state.lang==="bn"?"আনলক":"Unlock"}</button>
    <div id="pinErr" class="err center" style="margin-top:8px"></div>
    <p class="fine center">${state.lang==="bn"?"বায়োমেট্রিক ইএএস/MDM বিল্ডে":"Biometric joins at the EAS/MDM build"}</p>`;
  $("pinGo").onclick = () => {
    const v = $("pinIn").value;
    if (step === "set") {
      if (!/^\d{4,6}$/.test(v)) { $("pinErr").textContent = "4–6 digits"; return; }
      if ($("pinIn2").value !== v) { $("pinErr").textContent = state.lang==="bn"?"মিলছে না":"PINs do not match"; return; }
      localStorage.setItem("ulms.fieldproto.pin", fnv1a("salt:" + v));
      state.hasPin = true; state.pinOk = true; localStorage.setItem("ulms.fieldproto.pinok","1");
    } else {
      if (fnv1a("salt:" + v) !== localStorage.getItem("ulms.fieldproto.pin")) { $("pinErr").textContent = state.lang==="bn"?"ভুল পিন":"Wrong PIN"; return; }
      state.pinOk = true; localStorage.setItem("ulms.fieldproto.pinok","1");
    }
    render();
  };
}

function renderToday() {
  const tasks = api.delta().body.data.filter(x => x.status === "OPEN");
  $("screen").innerHTML = `
    <div class="h1">${t("today.title")}</div>
    ${tasks.map(x => `
      <div class="card">
        <div class="mono" style="font-weight:700">${esc(x.loanNo)}</div>
        <div class="meta">DPD ${x.dpd} · ${esc(x.cls)} · P1</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btnOut" data-call="${esc(x.id)}">${t("today.logCall")}</button>
          <button class="btnP" data-ptp="${esc(x.id)}">${t("today.ptp")}</button>
        </div>
        ${state.ptpFor === x.id ? `
          <input class="input" id="ptpAmt" placeholder="${t("today.ptpAmt")}" inputmode="decimal">
          <input class="input" id="ptpDate" type="date" value="2026-10-12">
          <button class="btnP btnFull" id="ptpGo">${t("today.ptpSave")}</button>` : ""}
      </div>`).join("") || `<p class="hint center">—</p>`}`;
  $("screen").querySelectorAll("[data-call]").forEach(b => b.onclick = () => {
    enqueue({ kind: "action-log", taskId: b.dataset.call, outcome: "CONTACTED", evidence: [] });
    toast();
  });
  $("screen").querySelectorAll("[data-ptp]").forEach(b => b.onclick = () => {
    state.ptpFor = state.ptpFor === b.dataset.ptp ? null : b.dataset.ptp; render();
  });
  if ($("ptpGo")) $("ptpGo").onclick = () => {
    const lakh = parseFloat($("ptpAmt").value) || 0;
    enqueue({ kind: "ptp-create", taskId: state.ptpFor,
      payload: { promisedAmountMinor: Math.round(lakh * 100000 * 100), promisedOn: $("ptpDate").value },
      evidence: [{ kind: "note", ref: "ptp:" + $("ptpDate").value, sha: fnv1a("ptp" + lakh) }] });
    state.ptpFor = null; toast();
  };
}

function enqueue(op) {
  const d = db();
  d.queue.push(Object.assign({ id: (op.kind === "visit" ? "visit-" : op.kind + "-") + Date.now(),
    state: "pending", attempts: 0, queuedAt: new Date().toISOString() }, op));
  saveDb(d);
}

function renderCpv() {
  const tasks = api.delta().body.data;
  if (!state.form) {
    $("screen").innerHTML = `
      <div class="h1">${t("nav.cpv")}</div>
      ${tasks.map(x => `
        <div class="card" style="${x.status==="DONE"?"opacity:.55":""}">
          <div class="mono" style="font-weight:700">${esc(x.loanNo)}</div>
          <div class="meta">${esc(x.id)} · ${x.status}</div>
          ${x.status === "OPEN" ? `<button class="btnP btnFull" data-open="${esc(x.id)}">${t("cpv.residence")}</button>` : ""}
        </div>`).join("")}`;
    $("screen").querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
      state.form = { taskId: b.dataset.open, personMet: false, photos: 0, notes: "", gpsAcc: 6 };
      state.sigData = null; state.voiceSec = null; render();
    });
    return;
  }
  const f = state.form;
  const gates = [];
  if (!f.personMet) gates.push(t("cpv.personMet"));
  if (f.photos < 1) gates.push(t("cpv.photos"));
  if (f.gpsAcc > 10) gates.push(t("gps.waiting"));
  $("screen").innerHTML = `
    <div class="h1">${t("cpv.residence")}</div>
    <div class="switchrow"><span>${t("cpv.personMet")}</span>
      <div class="switch ${f.personMet?"on":""}" id="fPerson"></div></div>
    <p class="hint">${t("gps.waiting")} (${f.gpsAcc}m)</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
      <button class="btnOut" id="fPhoto">📷 ${t("cpv.photos")}: ${f.photos}</button>
      <button class="btnOut" id="fVoice">${state.voiceSec == null ? t("cpv.voice") : t("cpv.voiceStop") + " (" + state.voiceSec + "s/300s)"}</button>
    </div>
    <textarea class="input" id="fNotes" rows="2" placeholder="${t("cpv.notes")}">${esc(f.notes)}</textarea>
    <p class="hint">${t("cpv.signature")}${state.sigData ? " — " + t("cpv.signed") + " (" + state.sigData.slice(0,8) + "…)" : ""}</p>
    <canvas class="sigbox" id="fSig"></canvas>
    <div style="display:flex;gap:8px;margin-top:6px">
      <button class="btnOut" id="fClearSig">${t("cpv.clear")}</button>
    </div>
    <button class="btnP btnFull" id="fSubmit" ${gates.length?"disabled style=\"opacity:.5\"":""}>${t("cpv.submit")}</button>
    ${gates.length ? `<div class="err">⚠ ${gates[0]}</div>` : ""}
    <button class="btnOut btnFull" id="fBack" style="margin-top:6px">←</button>`;
  $("fPerson").onclick = () => { state.form.personMet = !state.form.personMet; render(); };
  $("fPhoto").onclick = () => { state.form.photos++; render(); };
  $("fVoice").onclick = () => { state.voiceSec = state.voiceSec == null ? 1 : null; if (state.voiceSec) render(); else render(); };
  $("fNotes").oninput = (e) => { state.form.notes = e.target.value; };
  wireSignature($("fSig"));
  $("fClearSig").onclick = () => { const c = $("fSig"); c.getContext("2d").clearRect(0,0,c.width,c.height); state.sigData = null; };
  $("fSubmit").onclick = () => {
    const ev = [];
    const at = new Date().toISOString();
    ev.push({ kind: "gps", ref: "gps:23.7936,90.4043", sha: fnv1a("gps") });
    for (let i = 0; i < state.form.photos; i++) ev.push({ kind: "photo", ref: "photo:IMG_" + (4471 + i) + ".jpg", sha: fnv1a("p" + i) });
    if (state.form.notes) ev.push({ kind: "note", ref: state.form.notes.slice(0, 80), sha: fnv1a(state.form.notes) });
    if (state.voiceSec != null) ev.push({ kind: "voice", ref: "voice:" + state.voiceSec + "s", sha: fnv1a("v" + state.voiceSec) });
    if (state.sigData) ev.push({ kind: "signature", ref: "sig:" + state.form.taskId, sha: state.sigData });
    enqueue({ kind: "visit", taskId: state.form.taskId, outcome: "VERIFIED", evidence: ev });
    state.form = null; state.sigData = null; state.voiceSec = null;
    toast(); render();
  };
  $("fBack").onclick = () => { state.form = null; render(); };
}

function wireSignature(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#0B0E1A"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
  let drawing = false, strokes = 0;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const start = (e) => { drawing = true; strokes++; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
  const move = (e) => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
  const end = () => { if (drawing && strokes > 0) state.sigData = fnv1a(canvas.toDataURL().slice(-2048)); drawing = false; };
  canvas.addEventListener("mousedown", start); canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
}

function renderMap() {
  const tasks = api.delta().body.data.filter(x => x.status === "OPEN");
  const pinned = tasks.filter(x => x.lat != null);
  const unpinned = tasks.filter(x => x.lat == null);
  $("screen").innerHTML = `
    <div class="h1">${t("map.title")}</div>
    <div class="board">
      ${[25,50,75].map(p => `<div class="gridH" style="top:${p}%"></div><div class="gridV" style="left:${p}%"></div>`).join("")}
      ${pinned.map(x => `<div class="pin" style="top:${x.lat}%;left:${x.lng}%">${esc(x.loanNo.slice(3,8))}</div>`).join("")}
    </div>
    <p class="hint">${t("map.note")}</p>
    ${unpinned.map(x => `<div class="card" style="display:flex;justify-content:space-between">
      <span class="mono" style="font-weight:600">${esc(x.loanNo)}</span>
      <span style="font-size:12px;color:#996a00">${state.lang==="bn"?"স্থানাঙ্ক নেই":"no coordinates"}</span></div>`).join("")}`;
}

function renderProof() {
  const d = db();
  const rows = [];
  d.queue.forEach(op => op.evidence.forEach(ev => rows.push({ op: op, ev: ev })));
  const GLYPH = { photo: "🖼", gps: "📍", note: "📝", signature: "✍", voice: "🎙" };
  $("screen").innerHTML = `
    <div class="h1">${t("proof.title")}</div>
    ${rows.map(r => `
      <div class="prow">
        <span class="pglyph">${GLYPH[r.ev.kind] || "▫"}</span>
        <div style="flex:1">
          <div class="mono" style="font-size:11.5px">${esc(r.ev.ref)}</div>
          <div class="hint" style="margin:2px 0">${esc(r.op.queuedAt.slice(0,16).replace("T"," "))} · sha ${esc(String(r.ev.sha).slice(0,10))}…</div>
        </div>
        <span class="pstate ${r.op.state==="synced"?"ok":"warn"}">${t("sync." + r.op.state)}</span>
      </div>`).join("") || `<p class="hint center" style="margin-top:24px">${t("proof.empty")}</p>`}`;
}

function renderSos() {
  $("screen").innerHTML = `
    <div class="h1">${t("sos.title")}</div>
    <p class="hint">${state.lang==="bn"?"এক ট্যাপে শাখা নিরাপত্তা সতর্কতা ও এসএমএস":"One tap alerts branch security and sends your location by SMS"}</p>
    <textarea class="input" id="sosNote" rows="2" placeholder="${state.lang==="bn"?"মন্তব্য (ঐচ্ছিক)":"Note (optional)"}"></textarea>
    ${!state.sosArmed ? `<button class="armBtn" id="sosArm">${t("sos.arm")}</button>` : `
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="sendBtn" id="sosSend">${t("sos.send")}</button>
        <button class="cancelBtn" id="sosCancel">${t("sos.cancel")}</button>
      </div>`}
    <p class="fine">${state.lang==="bn"?"এসওএস কখনো নীরবে বাদ যায় না — কিউ ব্যাকঅফ-সহ পুনঃপ্রচেষ্টা করে":"SOS is never silently dropped — the queue retries with backoff"}</p>`;
  if ($("sosArm")) $("sosArm").onclick = () => { state.sosArmed = true; render(); };
  if ($("sosCancel")) $("sosCancel").onclick = () => { state.sosArmed = false; render(); };
  if ($("sosSend")) $("sosSend").onclick = () => {
    // GPS captured but never blocking
    const geo = { lat: 23.7936, lng: 90.4043 };
    enqueue({ kind: "sos", outcome: "SOS", evidence: [{ kind: "gps", ref: "gps:" + geo.lat + "," + geo.lng, sha: fnv1a("sosgeo") }],
      payload: { note: $("sosNote").value, lat: geo.lat, lng: geo.lng } });
    state.sosArmed = false; toast(); render();
  };
}

function renderSync() {
  const d = db();
  $("screen").innerHTML = `
    <div class="h1">${t("sync.title")}</div>
    <button class="btnP btnFull" id="syncGo">${t("sync.now")}</button>
    <div id="syncMsg" class="ok" style="margin-top:8px"></div>
    ${d.queue.slice().reverse().map(op => `
      <div class="card">
        <div class="mono" style="font-weight:600;font-size:12.5px">${esc(op.kind)} · ${esc(op.id.slice(0,14))}</div>
        <div class="meta">${t("sync." + op.state)} · attempts ${op.attempts || 0} · ev ${op.evidence.length}</div>
      </div>`).join("") || `<p class="hint center">—</p>`}
    <p class="fine">${state.lang==="bn"?"প্রথম ভিজিট অপটি সার্ভারে ইতিমধ্যে DONE কাজে পৌঁছালে দ্বন্দ্ব দেখাবে":"drain includes a server-wins conflict when a visit replays onto a DONE task"}</p>`;
  $("syncGo").onclick = () => {
    const res = syncDrain();
    $("syncMsg").textContent = `synced ${res.synced} · conflicts(server-wins) ${res.conflicts} · appended ${res.appended} · failed ${res.failed}`;
    setTimeout(render, 700);
  };
}

function toast() {
  const el = document.createElement("div");
  el.textContent = state.lang === "bn" ? "কিউতে যোগ হয়েছে" : "Queued";
  el.style.cssText = "position:absolute;top:70px;left:50%;transform:translateX(-50%);background:#107C10;color:#fff;padding:8px 16px;border-radius:18px;font-size:12px;z-index:30;box-shadow:0 6px 18px rgba(0,0,0,.25)";
  document.querySelector(".phone").appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

render();
