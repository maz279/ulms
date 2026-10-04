/* ============================================================
   ULMS field app — bilingual strings (R6). Same one-language-
   per-element rule as the web app; BN falls back to EN until
   the bank translation review clears the mobile pack.
   ============================================================ */
export type Lang = "en" | "bn";
export const STRINGS: Record<string, { en: string; bn?: string }> = {
  "app.title": { en: "ULMS Field", bn: "ইউএলএমএস ফিল্ড" },
  "nav.today": { en: "Today's visits", bn: "আজকের ভিজিট" },
  "nav.tasks": { en: "CPV tasks", bn: "সিপিভি কাজ" },
  "nav.sync": { en: "Sync", bn: "সিঙ্ক" },
  "cpv.residence": { en: "Residence verification", bn: "আবাসন যাচাই" },
  "cpv.business": { en: "Business verification", bn: "ব্যবসা যাচাই" },
  "cpv.reference": { en: "Reference check", bn: "রেফারেন্স যাচাই" },
  "cpv.asset": { en: "Asset verification", bn: "সম্পদ যাচাই" },
  "cpv.personMet": { en: "Person met", bn: "ব্যক্তির সাথে দেখা" },
  "cpv.photos": { en: "Photos (min 1)", bn: "ছবি (ন্যূনতম ১)" },
  "cpv.notes": { en: "Notes", bn: "মন্তব্য" },
  "cpv.outcome.VERIFIED": { en: "Verified", bn: "যাচাইকৃত" },
  "cpv.outcome.DISCREPANCY": { en: "Discrepancy", bn: "অসঙ্গতি" },
  "cpv.outcome.NOT_FOUND": { en: "Not found", bn: "পাওয়া যায়নি" },
  "cpv.submit": { en: "Submit (queued offline)", bn: "জমা (অফলাইন কিউ)" },
  "sync.pending": { en: "Pending", bn: "অপেক্ষমাণ" },
  "sync.syncing": { en: "Syncing…", bn: "সিঙ্ক হচ্ছে…" },
  "sync.conflict": { en: "Conflict — server wins", bn: "দ্বন্দ্ব — সার্ভার জয়ী" },
  "sync.failed": { en: "Failed (max retries)", bn: "ব্যর্থ" },
  "sync.ok": { en: "Synced", bn: "সিঙ্ককৃত" },
  "gps.waiting": { en: "Acquiring GPS (<10m)…", bn: "জিপিএস নেওয়া হচ্ছে…" },
  "collections.logCall": { en: "Log call", bn: "কল লগ" },
  "collections.ptp": { en: "Promise to Pay", bn: "প্রতিশ্রুতি" },
  "nav.map": { en: "Map", bn: "মানচিত্র" },
  "nav.proof": { en: "Proof", bn: "প্রমাণ" },
  "nav.sos": { en: "SOS", bn: "এসওএস" },
  "map.title": { en: "Field map", bn: "ফিল্ড মানচিত্র" },
  "map.noPins": { en: "No open tasks with coordinates", bn: "স্থানাঙ্কসহ কোনো কাজ নেই" },
  "map.schematicNote": { en: "Schematic pin board — native tiles arrive with the EAS build", bn: "স্কিমেটিক পিন বোর্ড — ইএএস বিল্ডে নেটিভ মানচিত্র" },
  "map.unpinned": { en: "Needs geocoding", bn: "জিওকোডিং প্রয়োজন" },
  "map.needsGeo": { en: "no coordinates on task", bn: "কাজে স্থানাঙ্ক নেই" },
  "proof.title": { en: "Proof gallery", bn: "প্রমাণ গ্যালারি" },
  "proof.hint": { en: "Every queued and synced evidence item, with integrity sha", bn: "প্রতিটি প্রমাণ, সততা শা-সহ" },
  "proof.empty": { en: "No evidence captured yet", bn: "এখনো কোনো প্রমাণ নেই" },
  "sos.title": { en: "SOS escalation", bn: "এসওএস এস্কালেশন" },
  "sos.hint": { en: "One tap alerts branch security and sends your location by SMS", bn: "এক ট্যাপে শাখা নিরাপত্তা সতর্কতা ও এসএমএস" },
  "sos.note": { en: "Note (optional)", bn: "মন্তব্য (ঐচ্ছিক)" },
  "sos.arm": { en: "ARM SOS", bn: "এসওএস প্রস্তুত" },
  "sos.send": { en: "SEND NOW", bn: "এখনই পাঠান" },
  "sos.cancel": { en: "Cancel", bn: "বাতিল" },
  "sos.queuedTitle": { en: "SOS queued", bn: "এসওএস সারিবদ্ধ" },
  "sos.queuedBody": { en: "Alert will fire the moment a connection is available", bn: "সংযোগ পাওয়া মাত্র সতর্কতা যাবে" },
  "sos.finePrint": { en: "SOS is never silently dropped — the queue retries with backoff", bn: "এসওএস কখনো নীরবে বাদ যায় না" },
  "cpv.signature": { en: "Borrower signature", bn: "গ্রহীতার স্বাক্ষর" },
  "cpv.signed": { en: "Signature captured", bn: "স্বাক্ষর গৃহীত" },
  "ptp.amountLakh": { en: "Promised (৳ Lakh)", bn: "প্রতিশ্রুত (৳ লাখ)" },
  "ptp.date": { en: "Promise date", bn: "প্রতিশ্রুতির তারিখ" },
  "ptp.save": { en: "Record promise (queued)", bn: "প্রতিশ্রুতি লিপিবদ্ধ (কিউ)" },
};
export function t(lang: Lang, key: string): string {
  const s = STRINGS[key];
  if (!s) return key;
  return lang === "bn" ? s.bn ?? s.en : s.en;
}
