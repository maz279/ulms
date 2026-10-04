/* Pre-login news carousel (visual-enhancement layer) — the same four bank
 * announcements as the working prototype, one object per slide. */
export interface NewsItem {
  ico: string; tag: string; tagCls?: "warn" | "info" | "ok";
  en: { t: string; s: string }; bn: { t: string; s: string };
}
export const NEWS: NewsItem[] = [
  { ico: "🏦", tag: "notice",
    bn: { t: "সরকারি ছুটিতে শাখা বন্ধ", s: "অ্যাপ ও পোর্টাল ২৪/৭ খোলা — কিস্তি, স্টেটমেন্ট সব অনলাইনে।" },
    en: { t: "Branches closed on public holidays", s: "The app and portal stay open 24/7 — pay, download, track online." } },
  { ico: "🔐", tag: "security", tagCls: "info",
    bn: { t: "OTP কখনো শেয়ার করবেন না", s: "ABC Bank কখনো ফোনে কোড চাইবে না — প্রতারণা সতর্কতা।" },
    en: { t: "Never share your OTP", s: "ABC Bank will never ask for your code over the phone — stay alert." } },
  { ico: "🏡", tag: "rates", tagCls: "ok",
    bn: { t: "আবাসন ঋণ ৯.৫০% থেকে", s: "নতুন হোম লোনে প্রতিযোগী সুদহার — আবেদন করুন অ্যাপেই।" },
    en: { t: "Home loans from 9.50%", s: "Competitive rates on new home loans — apply right in the app." } },
  { ico: "📱", tag: "new",
    bn: { t: "অনলাইন আবেদন এখন অ্যাপে", s: "ঋণের আবেদন, ট্র্যাকিং ও পরিশোধ — সব এক জায়গায়।" },
    en: { t: "Apply for a loan in-app", s: "Application, tracking and repayment — all in one place." } },
];
