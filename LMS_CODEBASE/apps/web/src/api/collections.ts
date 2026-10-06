/** Collections API client — worklist, actions, PTP, field tasks (03). */
import { authHeaders } from "./customers";

export interface WorklistRow {
  loanId: string; loanNo: string; customerId: string; dpd: number;
  classification: string; outstandingMinor: number; priority: string;
  hasBrokenPtp: boolean;
}

export interface PtpView {
  id: string; loanId: string; promisedAmountMinor: number; promisedOn: string;
  confidence: string; contactName: string | null; contactRelation: string | null;
  contactPhoneMasked: string | null; remark: string | null; dpdAtPromise: number;
  classificationAtPromise: string; kept: string;
}

async function jw<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function worklist(): Promise<WorklistRow[]> {
  const res = await fetch("/api/v1/collections/worklist", { headers: authHeaders() });
  return (await jw<{ data: WorklistRow[] }>(res)).data ?? [];
}

export async function recordAction(loanId: string, actionType: string,
  outcome: string, notes: string): Promise<void> {
  await jw(await fetch(`/api/v1/collections/${loanId}/actions/${actionType}`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ outcome, notes }),
  }));
}

export async function createPtp(loanId: string, body: {
  promisedAmountMinor: number; promisedOn: string; confidence: string;
  contactName?: string; contactRelation?: string; contactPhone?: string; remark?: string;
}): Promise<PtpView> {
  return jw(await fetch(`/api/v1/collections/${loanId}/ptp`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  }));
}

export async function ptpOutcome(ptpId: string, kept: boolean): Promise<PtpView> {
  return jw(await fetch(`/api/v1/collections/ptp/${ptpId}/outcome`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ kept }),
  }));
}

export async function ptpCalendar(from: string, to: string): Promise<PtpView[]> {
  const res = await fetch(
    `/api/v1/collections/ptp/calendar?from=${from}&to=${to}`, { headers: authHeaders() });
  return (await jw<{ data: PtpView[] }>(res)).data ?? [];
}

export async function assignFieldTask(loanId: string, assignedTo: string,
  dueOn: string): Promise<void> {
  await jw(await fetch("/api/v1/collections/field-tasks", {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ loanId, assignedTo, dueOn }),
  }));
}

export async function completeFieldTask(taskId: string, evidence: string): Promise<void> {
  await jw(await fetch(`/api/v1/collections/field-tasks/${taskId}/complete`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ evidence }),
  }));
}

// ── dunning ladder timers (03) + legal cases + waiver ─────────────────────

export interface QueuedDunning {
  id: string; loanId: string; actionType: string; outcome: string;
  dueOn: string | null; notes: string | null;
}

export async function dunningQueue(): Promise<QueuedDunning[]> {
  const res = await fetch("/api/v1/collections/dunning/queue", { headers: authHeaders() });
  return (await jw<{ data: QueuedDunning[] }>(res)).data ?? [];
}

export async function dunningRun(): Promise<number> {
  const res = await jw(await fetch("/api/v1/collections/dunning/run", {
    method: "POST", headers: authHeaders(),
  })) as { queued: number };
  return res.queued;
}

export async function resolveDunning(actionId: string, outcome: string,
  notes: string): Promise<void> {
  await jw(await fetch(`/api/v1/collections/dunning/${actionId}/resolve`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ outcome, notes }),
  }));
}

export interface LegalCaseView {
  id: string; loanId: string; caseNo: string; court: string | null;
  filedOn: string | null; status: string; claimMinor: number; lawyer: string | null;
}

export async function fileLegalCase(loanId: string, body: {
  court?: string; filedOn?: string; claimMinor: number; lawyer?: string; notes?: string;
}): Promise<LegalCaseView> {
  return jw(await fetch(`/api/v1/collections/${loanId}/legal-case`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  }));
}

export async function waiveInterest(loanId: string, amountMinor: number): Promise<void> {
  await jw(await fetch(`/api/v1/collections/${loanId}/waive-interest`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ amountMinor }),
  }));
}

// ── Q1.4 early-warning watchlist (PLAN-03 mod-collections) ────────────────

export interface WatchlistEntryView {
  id: string; loanId: string; cifNo: string; loanNo: string;
  reasonCode: string; note: string | null; status: "OPEN" | "CLEARED";
  reviewBy: string; addedBy: string; addedAt: string;
  clearedBy: string | null; clearedAt: string | null; clearNote: string | null;
}

export const WATCHLIST_REASONS = [
  "DPD_RISING", "CHEQUE_BOUNCE", "CIB_ALERT", "FIELD_INTEL", "BANKING_INACTIVITY", "AUTO_STD2",
] as const;

export async function listWatchlist(status?: "OPEN" | "CLEARED" | "ALL"): Promise<WatchlistEntryView[]> {
  const qs = status ? `?status=${status}` : "";
  return jw<{ data?: WatchlistEntryView[] }>(
      await fetch(`/api/v1/collections/watchlist${qs}`, { headers: authHeaders() }))
    .then((r) => r.data ?? []);
}

export async function addToWatchlist(loanId: string, reasonCode: string,
                                     note?: string, reviewWithinDays?: number): Promise<WatchlistEntryView> {
  return jw(await fetch("/api/v1/collections/watchlist", {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ loanId, reasonCode, note, reviewWithinDays }),
  }));
}

export async function clearWatchlistEntry(id: string, note: string): Promise<WatchlistEntryView> {
  return jw(await fetch(`/api/v1/collections/watchlist/${id}/clear`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ note }),
  }));
}

// ── Q1.5 collateral auction ledger (ULS-01 §6.3) ─────────────────────────

export interface AuctionEntryView {
  id: string; loanId: string; cifNo: string; loanNo: string;
  collateralRef: string | null; venue: string;
  scheduledFor: string; heldOn: string | null;
  status: "SCHEDULED" | "HELD" | "SOLD" | "UNSOLD" | "CANCELLED";
  reserveMinor: number; proceedsMinor: number | null; buyer: string | null;
  recoveryId: string | null; createdBy: string; createdAt: string;
}

export async function listAuctions(status?: string, loanId?: string): Promise<AuctionEntryView[]> {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (loanId) qs.set("loanId", loanId);
  const suffix = qs.size ? `?${qs}` : "";
  return jw<{ data?: AuctionEntryView[] }>(
      await fetch(`/api/v1/collections/auctions${suffix}`, { headers: authHeaders() }))
    .then((r) => r.data ?? []);
}

export async function scheduleAuction(loanId: string, body: {
  collateralRef?: string; venue: string; scheduledFor: string; reserveMinor: number;
}): Promise<AuctionEntryView> {
  return jw(await fetch("/api/v1/collections/auctions", {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ loanId, ...body }),
  }));
}

export async function auctionHeld(id: string): Promise<AuctionEntryView> {
  return jw(await fetch(`/api/v1/collections/auctions/${id}/held`, {
    method: "POST", headers: authHeaders(),
  }));
}

export async function auctionSold(id: string, proceedsMinor: number,
                                  buyer: string): Promise<AuctionEntryView> {
  return jw(await fetch(`/api/v1/collections/auctions/${id}/sold`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ proceedsMinor, buyer }),
  }));
}

export async function auctionUnsold(id: string): Promise<AuctionEntryView> {
  return jw(await fetch(`/api/v1/collections/auctions/${id}/unsold`, {
    method: "POST", headers: authHeaders(),
  }));
}

export async function auctionCancel(id: string): Promise<AuctionEntryView> {
  return jw(await fetch(`/api/v1/collections/auctions/${id}/cancel`, {
    method: "POST", headers: authHeaders(),
  }));
}
