/** Servicing API client — loans, payments, schedule, statement, quote, reschedule (03). */
import { authHeaders } from "./customers";

export interface LoanView {
  id: string; loanNo: string; customerId: string; principalMinor: number;
  outstandingMinor: number; dpd: number; stage: string; classification: string;
  interestSuspense: boolean; tenorMonths: number; interestRateBp: number;
  disbursedAt: string;
}

export interface PaymentView {
  id: string; loanId: string; amountMinor: number; externalRef: string;
  rail: string; utr: string | null; fineractTxnId: number | null; paidAt: string;
}

export interface IntentView {
  id: string; rail: string; railUrl: string; status: string;
}

export interface ScheduleLine {
  no: number; dueDate: string; emiMinor: number; principalMinor: number;
  interestMinor: number; balanceAfterMinor: number;
}

export interface StatementRow {
  paidOn: string; reference: string; rail: string;
  paidInMinor: number; outstandingAfterMinor: number;
}

async function jw<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listLoans(): Promise<LoanView[]> {
  const res = await fetch("/api/v1/loans", { headers: authHeaders() });
  return (await jw<{ data: LoanView[] }>(res)).data ?? [];
}

export async function getLoan(id: string): Promise<LoanView> {
  return jw(await fetch(`/api/v1/loans/${id}`, { headers: authHeaders() }));
}

export async function postCounterPayment(loanId: string, amountMinor: number,
  externalRef: string): Promise<PaymentView> {
  return jw(await fetch(`/api/v1/loans/${loanId}/payments`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ amountMinor, externalRef, rail: "COUNTER" }),
  }));
}

export async function listPayments(loanId: string): Promise<PaymentView[]> {
  const res = await fetch(`/api/v1/loans/${loanId}/payments`, { headers: authHeaders() });
  return (await jw<{ data: PaymentView[] }>(res)).data ?? [];
}

export async function initiatePayment(loanId: string, amountMinor: number,
  rail: string): Promise<IntentView> {
  return jw(await fetch(`/api/v1/loans/${loanId}/payment-intents`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ amountMinor, rail }),
  }));
}

export async function getSchedule(loanId: string): Promise<ScheduleLine[]> {
  const res = await fetch(`/api/v1/loans/${loanId}/schedule`, { headers: authHeaders() });
  return (await jw<{ data: ScheduleLine[] }>(res)).data ?? [];
}

export async function getStatement(loanId: string, page = 1): Promise<{
  loanNo: string; rows: StatementRow[]; page: number; size: number; total: number;
}> {
  return jw(await fetch(`/api/v1/loans/${loanId}/statement?page=${page}`, {
    headers: authHeaders(),
  }));
}

export interface QuoteView {
  id: string; outstandingMinor: number; penaltyMinor: number; rebateMinor: number;
  totalMinor: number; validUntil: string;
}

export async function settleQuote(loanId: string): Promise<QuoteView> {
  return jw(await fetch(`/api/v1/loans/${loanId}/settle-quote`, {
    method: "POST", headers: authHeaders(),
  }));
}

export async function requestReschedule(loanId: string, newTenorMonths: number,
  reason: string): Promise<void> {
  await jw(await fetch(`/api/v1/loans/${loanId}/reschedule-request`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ newTenorMonths, reason }),
  }));
}
