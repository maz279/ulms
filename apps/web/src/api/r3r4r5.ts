/** R3/R4/R5 API clients — products, sanctions, BOCC, outbox, write-offs,
 *  recoveries, guarantors, notifications, AML/STR, portal apply, partner. */
import { authHeaders } from "./customers";

async function jw<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error((p as any).detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

/* ---------- R3: products ---------- */
export interface LoanProduct {
  code: string; version: number; status: "DRAFT" | "ACTIVE" | "RETIRED";
  nameEn: string; nameBn?: string;
  minAmountMinor: number; maxAmountMinor: number; defaultAmountMinor?: number; stepMinor?: number;
  tenorMinMonths: number; tenorMaxMonths: number; tenorDefaultMonths?: number;
  rateType: string; rateBp: number; frequency?: string; amortization?: string;
  prepaymentPenaltyBp?: number; charges?: { code: string; rateBp: number }[];
  security: { collateral: boolean; guarantor: boolean; maxLtvBp: number };
}
export async function listProducts(includeInactive = false): Promise<LoanProduct[]> {
  const res = await fetch(`/api/v1/products${includeInactive ? "?includeInactive=true" : ""}`, { headers: authHeaders() });
  return (await jw<{ data: LoanProduct[] }>(res)).data ?? [];
}
export async function createProduct(body: Partial<LoanProduct>): Promise<LoanProduct> {
  return jw(await fetch("/api/v1/products", { method: "POST", headers: authHeaders(crypto.randomUUID()), body: JSON.stringify(body) }));
}
export async function patchProduct(code: string, body: Partial<LoanProduct>): Promise<LoanProduct> {
  return jw(await fetch(`/api/v1/products/${encodeURIComponent(code)}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) }));
}
export async function activateProduct(code: string): Promise<LoanProduct> {
  return jw(await fetch(`/api/v1/products/${encodeURIComponent(code)}/activate`, { method: "POST", headers: authHeaders() }));
}
export interface Eligibility {
  product: string; eligible: boolean; violations: string[];
  emiMinor: number | null; rateBp: number; security: LoanProduct["security"];
}
export async function productEligibility(code: string, amountMinor: number, tenorMonths: number): Promise<Eligibility> {
  const q = `amountMinor=${amountMinor}&tenorMonths=${tenorMonths}`;
  return jw(await fetch(`/api/v1/products/${encodeURIComponent(code)}/eligibility?${q}`, { headers: authHeaders() }));
}

/* ---------- R3: sanction letters ---------- */
export interface SanctionLetter {
  id: string; applicationId: string; appNo: string; cifNo: string; customerNameEn: string;
  amountMinor: number; tenorMonths: number; rateBp: number;
  status: "ISSUED" | "ACCEPTED"; acceptanceToken: string; acceptedAt: string | null;
  issuedAt: string; bodyEn: string; bodyBn?: string;
}
export async function listSanctions(): Promise<SanctionLetter[]> {
  const res = await fetch("/api/v1/sanctions", { headers: authHeaders() });
  return (await jw<{ data: SanctionLetter[] }>(res)).data ?? [];
}
export async function generateSanction(applicationId: string): Promise<SanctionLetter> {
  return jw(await fetch(`/api/v1/sanctions/${encodeURIComponent(applicationId)}/generate`, { method: "POST", headers: authHeaders() }));
}
export async function getSanction(id: string): Promise<SanctionLetter> {
  return jw(await fetch(`/api/v1/sanctions/${encodeURIComponent(id)}`, { headers: authHeaders() }));
}
export async function acceptSanction(id: string, token: string): Promise<SanctionLetter> {
  return jw(await fetch(`/api/v1/sanctions/${encodeURIComponent(id)}/accept?token=${encodeURIComponent(token)}`, { method: "POST", headers: authHeaders() }));
}
export async function resendSanction(id: string): Promise<SanctionLetter> {
  return jw(await fetch(`/api/v1/sanctions/${encodeURIComponent(id)}/resend`, { method: "POST", headers: authHeaders() }));
}

/* ---------- R3: BOCC ---------- */
export interface BoccCase { caseId: string; appNo: string; cifNo: string; amountMinor: number; stage: string }
export interface BoccMeeting {
  id: string; branchCode: string; date: string; members: string[];
  agenda: BoccCase[]; attendance: { member: string; signedAt: string }[];
  votes: { caseId: string; member: string; vote: string; dissent: string | null; votedAt: string }[];
  minutes: { draft: boolean; closedAt: string; text: string; resolutions: { appNo: string; resolution: string; votes: number; dissent: string[] }[] } | null;
  status: "SCHEDULED" | "HELD" | "CLOSED"; quorumNeeded: number;
}
export async function listMeetings(): Promise<BoccMeeting[]> {
  const res = await fetch("/api/v1/bocc/meetings", { headers: authHeaders() });
  return (await jw<{ data: BoccMeeting[] }>(res)).data ?? [];
}
export async function scheduleMeeting(body: { branchCode: string; members: string[]; date?: string }): Promise<BoccMeeting> {
  return jw(await fetch("/api/v1/bocc/meetings", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}
export async function getMeeting(id: string): Promise<BoccMeeting> {
  return jw(await fetch(`/api/v1/bocc/meetings/${encodeURIComponent(id)}`, { headers: authHeaders() }));
}
export async function checkIn(id: string, member: string): Promise<BoccMeeting> {
  return jw(await fetch(`/api/v1/bocc/meetings/${encodeURIComponent(id)}/attendance`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ member }) }));
}
export async function voteCase(id: string, body: { caseId: string; member: string; vote: string; dissent?: string }): Promise<unknown> {
  return jw(await fetch(`/api/v1/bocc/meetings/${encodeURIComponent(id)}/vote`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}
export async function closeMeeting(id: string): Promise<BoccMeeting["minutes"]> {
  return jw(await fetch(`/api/v1/bocc/meetings/${encodeURIComponent(id)}/close`, { method: "POST", headers: authHeaders() }));
}

/* ---------- R3: outbox ---------- */
export interface OutboxEvent {
  id: string; type: string; aggregateType: string; aggregateId: string;
  state: "PENDING" | "RELAYED"; attempts: number; createdAt: string; relayedAt: string | null;
}
export async function listOutbox(): Promise<OutboxEvent[]> {
  const res = await fetch("/api/v1/outbox", { headers: authHeaders() });
  return (await jw<{ data: OutboxEvent[] }>(res)).data ?? [];
}
export async function relayOutbox(): Promise<{ relayed: number; notifications: number }> {
  return jw(await fetch("/api/v1/outbox/relay", { method: "POST", headers: authHeaders() }));
}

/* ---------- R4: write-off / recovery ---------- */
export interface WriteOff {
  id: string; loanId: string; loanNo: string; cifNo: string; amountMinor: number;
  provisionAtProposalMinor: number; classification: string;
  state: "PROPOSED" | "EXECUTED" | "REVERSED"; boardBand: string;
  proposedBy: string; proposedAt: string; approvedAt: string | null; reversedAt: string | null; glRef: string | null;
}
export async function proposeWriteOff(loanId: string, reason: string): Promise<WriteOff> {
  return jw(await fetch(`/api/v1/collections/${encodeURIComponent(loanId)}/write-off`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ reason }) }));
}
export async function listWriteOffs(): Promise<WriteOff[]> {
  const res = await fetch("/api/v1/write-offs", { headers: authHeaders() });
  return (await jw<{ data: WriteOff[] }>(res)).data ?? [];
}
export async function approveWriteOff(id: string): Promise<WriteOff> {
  return jw(await fetch(`/api/v1/write-offs/${encodeURIComponent(id)}/approve`, { method: "POST", headers: authHeaders() }));
}
export async function reverseWriteOff(id: string): Promise<WriteOff> {
  return jw(await fetch(`/api/v1/write-offs/${encodeURIComponent(id)}/reverse`, { method: "POST", headers: authHeaders() }));
}
export interface RecoveryEntry {
  id: string; loanId: string; loanNo: string; cifNo: string; amountMinor: number;
  mode: string; incentiveMinor: number; receivedAt: string; receivedBy: string;
}
export async function listRecoveries(loanId: string): Promise<RecoveryEntry[]> {
  const res = await fetch(`/api/v1/collections/${encodeURIComponent(loanId)}/recoveries`, { headers: authHeaders() });
  return (await jw<{ data: RecoveryEntry[] }>(res)).data ?? [];
}
export async function recordRecovery(loanId: string, amountMinor: number, mode = "CASH"): Promise<RecoveryEntry> {
  return jw(await fetch(`/api/v1/collections/${encodeURIComponent(loanId)}/recoveries`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ amountMinor, mode }) }));
}

/* ---------- R4: guarantors ---------- */
export interface Guarantor {
  id: string; customerId: string; cif: string; name: string; nid: string | null;
  mobile: string; cibScore: number; cibStatus: string; linkedAmountMinor: number;
  status: string; checkedAt: string;
}
export async function listGuarantors(cifOrId: string): Promise<Guarantor[]> {
  const res = await fetch(`/api/v1/customers/${encodeURIComponent(cifOrId)}/guarantors`, { headers: authHeaders() });
  return (await jw<{ data: Guarantor[] }>(res)).data ?? [];
}
export async function addGuarantor(cifOrId: string, body: { name: string; mobile: string; nid?: string; linkedAmountMinor?: number }): Promise<Guarantor> {
  return jw(await fetch(`/api/v1/customers/${encodeURIComponent(cifOrId)}/guarantors`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}

/* ---------- R4: notifications / AML ---------- */
export interface NotifTemplate { type: string; channel: string; lang: string; body: string }
export async function listTemplates(): Promise<NotifTemplate[]> {
  const res = await fetch("/api/v1/notifications/templates", { headers: authHeaders() });
  return (await jw<{ data: NotifTemplate[] }>(res)).data ?? [];
}
export async function upsertTemplate(body: NotifTemplate): Promise<NotifTemplate> {
  return jw(await fetch("/api/v1/notifications/templates", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}
export interface NotifDelivery { id: string; type: string; cif: string | null; mobile: string | null; channel: string; body: string; status: string; sentAt: string }
export async function listDeliveries(): Promise<NotifDelivery[]> {
  const res = await fetch("/api/v1/notifications/outbox", { headers: authHeaders() });
  return (await jw<{ data: NotifDelivery[] }>(res)).data ?? [];
}
export async function sendNotification(body: { type: string; cif?: string; channel?: string }): Promise<NotifDelivery> {
  return jw(await fetch("/api/v1/notifications/send", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}
export interface AmlPosture { cifNo: string; cddLevel: string; risk: string; screeningHits: unknown[]; strs: { id: string; bfiuRef: string; status: string; reason: string }[] }
export async function getAml(cifOrId: string): Promise<AmlPosture> {
  return jw(await fetch(`/api/v1/customers/${encodeURIComponent(cifOrId)}/aml`, { headers: authHeaders() }));
}
export async function fileStr(cifOrId: string, reason: string, amountMinor = 0): Promise<{ id: string; bfiuRef: string }> {
  return jw(await fetch(`/api/v1/customers/${encodeURIComponent(cifOrId)}/str`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ reason, amountMinor }) }));
}

/* ---------- R5: portal & partner ---------- */
export async function portalApply(body: { mobile: string; productCode: string; amountMinor: number; tenorMonths: number; incomeMinor?: number }): Promise<{ appNo: string; id: string }> {
  return jw(await fetch("/api/v1/portal/me/applications", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}
export async function portalUpload(body: { mobile: string; docType: string; sha256: string; sizeBytes?: number; appId?: string }): Promise<{ id: string; scanStatus: string }> {
  return jw(await fetch("/api/v1/portal/me/documents", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }));
}
export async function partnerApply(apiKey: string, body: { cif: string; productCode: string; amountMinor: number; tenorMonths: number }, idemKey?: string): Promise<{ appNo: string; id: string }> {
  const h: Record<string, string> = { "Content-Type": "application/json", "X-Api-Key": apiKey };
  if (idemKey) h["Idempotency-Key"] = idemKey;
  return jw(await fetch("/api/v1/partner/applications", { method: "POST", headers: h, body: JSON.stringify(body) }));
}
