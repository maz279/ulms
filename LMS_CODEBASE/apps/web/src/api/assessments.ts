/** Assessment API client — CIB, scoring, collateral (03 mod-assessment). */
import { authHeaders } from "./customers";

export interface CibFacilityView {
  lenderCode: string; lenderName: string; facilityType: string;
  limitMinor: number; outstandingMinor: number; overdueMinor: number;
  installmentMinor: number; dpd: number; classification: string;
  lastPaymentDate: string | null; repaymentTrack: string;
}

export interface CibDetailView {
  id: string; status: string; period: string; pulledAt: string;
  facilities: CibFacilityView[];
  pullHistory: { period: string; status: string; source: string; pulledAt: string }[];
}

export async function pullCib(cif: string): Promise<{ status: string; period: string }> {
  const res = await fetch(`/api/v1/assessments/cib/${encodeURIComponent(cif)}`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `CIB pull failed (${res.status})`);
  }
  return res.json();
}

export async function getCib(cif: string): Promise<CibDetailView | null> {
  const res = await fetch(`/api/v1/assessments/cib/${encodeURIComponent(cif)}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`CIB fetch failed (${res.status})`);
  return res.json();
}

export interface ScoreView {
  score: number; grade: string; decision: string; version: number;
  dbrPercent: string | null; cibObligationMinor: number; proposedEmiMinor: number;
}

export async function getScore(applicationId: string): Promise<ScoreView | null> {
  const res = await fetch(`/api/v1/assessments/${applicationId}/score`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Score fetch failed (${res.status})`);
  return res.json();
}

export async function addCollateral(applicationId: string, body: {
  type: string; description?: string; valueMinor: number;
  valuedOn?: string; insuredUntil?: string;
}): Promise<void> {
  const res = await fetch(`/api/v1/assessments/${applicationId}/collateral`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Collateral failed (${res.status})`);
  }
}
