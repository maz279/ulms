/** Compliance API client — BRPD EOD, classification board, calculator oracle. */
import { authHeaders } from "./customers";

export interface EodRunResult {
  runDate: string; loansClassified: number;
  totalOutstandingMinor: number; totalProvisionMinor: number;
  provisionsByClass: Record<string, number>;
}

export async function runEod(date?: string): Promise<EodRunResult> {
  const res = await fetch("/api/v1/compliance/eod/run", {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify(date ? { date } : {}),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `EOD run failed (${res.status})`);
  }
  return res.json();
}

export interface BoardLoan {
  id: string; loanNo: string; customerId: string; principalMinor: number;
  outstandingMinor: number; dpd: number; classification: string;
  interestSuspense: boolean;
}

export interface BoardData {
  latestRun: {
    runDate: string; loansClassified: number;
    totalOutstandingMinor: number; totalProvisionMinor: number; detail: string;
  } | null;
  loans: BoardLoan[];
  openAlerts: { id: string; type: string; detail: string; createdAt: string }[];
}

export async function getBoard(): Promise<BoardData> {
  const res = await fetch("/api/v1/compliance/classification", { headers: authHeaders() });
  if (!res.ok) throw new Error(`Board failed (${res.status})`);
  return res.json();
}

export interface CalculatorResult {
  classification: string; provisionRateBp: number;
  interestSuspense: boolean; provisionMinor: number;
}

/** The shared policy oracle (03): provision = outstanding × rate_bp / 10000. */
export async function provisionCalculator(
  classification: string, outstandingMinor: number,
): Promise<CalculatorResult> {
  const q = `classification=${encodeURIComponent(classification)}&outstandingMinor=${outstandingMinor}`;
  const res = await fetch(`/api/v1/compliance/provision-calculator?${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Calculator failed (${res.status})`);
  return res.json();
}

/** Frontend mirror of the BRPD matrix — parity asserted against the backend oracle. */
export const BRPD_MATRIX: { cls: string; maxDpd: number; rateBp: number }[] = [
  { cls: "STD-0", maxDpd: 0, rateBp: 100 },
  { cls: "STD-1", maxDpd: 30, rateBp: 100 },
  { cls: "STD-2", maxDpd: 60, rateBp: 100 },
  { cls: "SMA", maxDpd: 90, rateBp: 500 },
  { cls: "SS", maxDpd: 180, rateBp: 2000 },
  { cls: "DF", maxDpd: 365, rateBp: 5000 },
  { cls: "B/L", maxDpd: Number.MAX_SAFE_INTEGER, rateBp: 10000 },
];

export function classifyLocal(dpd: number) {
  return BRPD_MATRIX.find((b) => dpd <= b.maxDpd) ?? BRPD_MATRIX[BRPD_MATRIX.length - 1];
}

export interface ProvisionJvResult {
  id: string; runDate: string;
  totalMinor: number; debitsMinor: number; creditsMinor: number;
  zeroSum: boolean; fineractTxnId: string; referenceNumber: string;
}

/** Post the EOD provision total to the Fineract GL as a zero-sum JV (03). */
export async function postProvisionJv(date?: string): Promise<ProvisionJvResult> {
  const res = await fetch("/api/v1/compliance/provision-jv", {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify(date ? { date } : {}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? `Provision JV failed (${res.status})`);
  return body;
}
