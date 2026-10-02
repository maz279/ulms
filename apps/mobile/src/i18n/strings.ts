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
};
export function t(lang: Lang, key: string): string {
  const s = STRINGS[key];
  if (!s) return key;
  return lang === "bn" ? s.bn ?? s.en : s.en;
}
