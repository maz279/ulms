/** Disbursement dual-auth API client (03 mod-approval). */
import { authHeaders } from "./customers";

export interface DisbursementView {
  id: string; applicationId: string; amountMinor: number; state: string;
  preparedBy: string; authorizedBy: string | null; fineractTxnId: number | null;
  trail: { action: string; actor: string; actedAt: string }[];
}

export async function prepareDisbursement(applicationId: string): Promise<DisbursementView> {
  const res = await fetch(`/api/v1/disbursements/${applicationId}/prepare`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Prepare failed (${res.status})`);
  }
  return res.json();
}

export async function authorizeDisbursement(id: string): Promise<DisbursementView> {
  const res = await fetch(`/api/v1/disbursements/${id}/authorize`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Authorize failed (${res.status})`);
  }
  return res.json();
}

export async function releaseDisbursement(id: string): Promise<DisbursementView> {
  const res = await fetch(`/api/v1/disbursements/${id}/release`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Release failed (${res.status})`);
  }
  return res.json();
}

export async function getDisbursementByApplication(
  applicationId: string,
): Promise<DisbursementView | null> {
  const res = await fetch(`/api/v1/disbursements/application/${applicationId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Disbursement fetch failed (${res.status})`);
  return res.json();
}
