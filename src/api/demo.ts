/* ============================================================
   DEMO MODE — the release APK works standalone, exactly like the
   validated working prototype (mobileapp_frontend/prototype/):
   the same embedded /portal API simulation, seed data, OTP dev-code
   behavior, bounds, and posting rules (≥EMI regularizes DPD).
   Active when EXPO_PUBLIC_API_BASE is NOT set; setting it routes
   every call to the real bank backend via client.ts (unchanged).
   ============================================================ */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Me, TrackerRow, PaymentLine, PaymentIntent } from "./client";

const DB_KEY = "ulms.demo.db";
const DEMO_MOBILE = "+8801712345678";

interface DemoLoan {
  loanId: string; loanNo: string; productCode: string;
  outstandingMinor: number; principalMinor: number; tenorMonths: number;
  interestRateBp: number; dpd: number; classification: string; nextDueOn: string;
}
interface DemoDb {
  borrowers: Record<string, { cifNo: string; nameEn: string }>;
  loans: DemoLoan[];
  applications: { appNo: string; stage: string; productCode: string;
    amountMinor: number; createdAt: string }[];
  payments: { loanId: string; paidAt: string; amountMinor: number; rail: string; utr: string }[];
  seq: { app: number };
}

function emiMonthlyMinor(principalMinor: number, months: number, rateBp: number): number {
  // same formula as domain/emi.ts (rate passed in bp here)
  const i = (rateBp / 10000) / 12;
  if (i === 0) return Math.round(principalMinor / months);
  const pow = Math.pow(1 + i, months);
  return Math.round((principalMinor * i * pow) / (pow - 1));
}

function seed(): DemoDb {
  return {
    borrowers: { [DEMO_MOBILE]: { cifNo: "CIF-100871", nameEn: "Rahim Uddin" } },
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
    seq: { app: 8127 },
  };
}

async function loadDb(): Promise<DemoDb> {
  const raw = await AsyncStorage.getItem(DB_KEY);
  return raw ? (JSON.parse(raw) as DemoDb) : seed();
}
async function saveDb(d: DemoDb): Promise<void> {
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(d));
}

export async function resetDemo(): Promise<void> {
  await AsyncStorage.removeItem(DB_KEY);
}

function rnd(n: number): string {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, "0")).join("");
}

let lastCode: string | null = null;

export const demo = {
  DEMO_MOBILE,

  async requestOtp(mobile: string): Promise<string | null> {
    if (!/^\+8801[3-9]\d{8}$/.test(mobile)) {
      throw new Error("Enter a valid mobile (+8801XXXXXXXXX)");
    }
    lastCode = String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
    return lastCode;   // demo: the code is "delivered" back to the app
  },

  async verifyOtp(mobile: string, code: string): Promise<string> {
    const d = await loadDb();
    if (!d.borrowers[mobile]) throw new Error("No borrower with that registered mobile");
    if (code !== lastCode) throw new Error("Wrong code");
    return "pay-" + rnd(5);
  },

  async me(mobile: string): Promise<Me> {
    const d = await loadDb();
    const b = d.borrowers[mobile];
    if (!b) throw new Error("No borrower with that registered mobile");
    const loans = d.loans.map((l) => ({
      loanId: l.loanId, loanNo: l.loanNo, productCode: l.productCode,
      outstandingMinor: l.outstandingMinor, dpd: l.dpd, classification: l.classification,
      nextDueOn: l.nextDueOn,
      emiMinor: emiMonthlyMinor(l.principalMinor, l.tenorMonths, l.interestRateBp),
    }));
    return { cifNo: b.cifNo, nameEn: b.nameEn, loans };
  },

  async tracker(_mobile: string): Promise<TrackerRow[]> {
    const d = await loadDb();
    return d.applications.map((a) => ({
      appNo: a.appNo, stage: a.stage, productCode: a.productCode,
      amountMinor: a.amountMinor, createdAt: a.createdAt,
    }));
  },

  async apply(_mobile: string, productCode: string,
              amountMinor: number, _tenorMonths: number): Promise<{ appNo: string }> {
    if (amountMinor < 5000000 || amountMinor > 20000000) {
      throw new Error("Amount must be between ৳50,000 and ৳200,000");
    }
    const d = await loadDb();
    const a = { appNo: "APP-" + (++d.seq.app), stage: "SUBMITTED", productCode,
                amountMinor, createdAt: new Date().toISOString() };
    d.applications.push(a);
    await saveDb(d);
    return { appNo: a.appNo };
  },

  async payments(_mobile: string, loanId: string): Promise<PaymentLine[]> {
    const d = await loadDb();
    return d.payments
      .filter((p) => p.loanId === loanId)
      .map((p) => ({ paidAt: p.paidAt, amountMinor: p.amountMinor, rail: p.rail, utr: p.utr }));
  },

  /** Demo checkout: OTP is verified, the payment posts immediately, and a
   *  ≥EMI payment on the delinquent loan regularizes it — prototype rules. */
  async initiate(loanId: string, amountMinor: number, rail: string,
                 otpToken: string | null): Promise<PaymentIntent> {
    if (!otpToken) throw new Error("A confirmation code is required — request one first");
    if (!(amountMinor > 0)) throw new Error("Enter a valid amount");
    const d = await loadDb();
    const loan = d.loans.find((l) => l.loanId === loanId);
    if (!loan) throw new Error("Loan not found");
    loan.outstandingMinor = Math.max(0, loan.outstandingMinor - amountMinor);
    const emi = emiMonthlyMinor(loan.principalMinor, loan.tenorMonths, loan.interestRateBp);
    if (loan.dpd > 0 && amountMinor >= emi) {
      loan.dpd = 0; loan.classification = "STD-0";   // regularized
    }
    d.payments.push({ loanId, paidAt: new Date().toISOString(), amountMinor, rail,
                      utr: "TXN" + rnd(3).toUpperCase() });
    await saveDb(d);
    return { intentId: "pi-" + rnd(4), railUrl: null, status: "POSTED" };
  },

  /** Statement as CSV text — the demo screens share it via RN Share. */
  async statementCsv(_mobile: string, loanId: string): Promise<string> {
    const d = await loadDb();
    const loan = d.loans.find((l) => l.loanId === loanId);
    const rows = d.payments.filter((p) => p.loanId === loanId)
      .map((p) => [p.paidAt, String(p.amountMinor), p.rail, p.utr].join(","));
    return ["loanNo,outstandingMinor",
      loan ? `${loan.loanNo},${loan.outstandingMinor}` : "",
      "paidAt,amountMinor,rail,utr", ...rows].join("\n");
  },
};
