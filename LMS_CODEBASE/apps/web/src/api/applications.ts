/** Applications + approvals API client (mirrors packages/openapi paths). */
import { authHeaders } from "./customers";

export interface ApplicationView {
  id: string; appNo: string; customerId: string; productCode: string;
  amountMinor: number; tenorMonths: number; rateType: "FIXED" | "FLOATING";
  stage: string; dbrPercent: number | null; incomeMinor: number | null;
  existingEmiMinor: number | null; cibObligationMinor: number | null;
  fineractLoanId: number | null; branchCode: string; createdAt: string;
  version?: number; workflowNode?: string | null;
  workflowPhase?: string | null; workflowSla?: string | null;
}

export interface LadderRung {
  level: number; roleKey: string; roleNameEn: string; minMinor: number; maxMinor: number | null;
}

export interface ApprovalTask {
  taskId: string; node: string; role: string;
  phase: "ACTION" | "CHECK"; status: string; slaDeadline: string | null;
}

export interface ActResult {
  instanceStatus: string; event: string; nextTaskId: string | null;
}

/** Workflow action (03 mod-approval + Q1.3): the two depth actions are
 *  DELEGATE (needs delegateTo) and APPROVE_WITH_CONDITIONS (one condition
 *  per remark line — rows gate disbursement until SATISFIED/WAIVED). */
export type WorkflowAction =
  | "APPROVE" | "REJECT" | "RETURN" | "ESCALATE"
  | "DELEGATE" | "APPROVE_WITH_CONDITIONS";

/** Condition precedent recorded by an APPROVE_WITH_CONDITIONS decision. */
export interface ApprovalConditionView {
  id: string; node: string; conditionText: string;
  status: "PENDING" | "SATISFIED" | "WAIVED";
  createdBy: string; createdAt: string;
  resolvedBy: string | null; resolvedAt: string | null;
}

export async function draftApplication(body: {
  customerId: string; productCode: string; amountMinor: number;
  tenorMonths: number; rateType: "FIXED" | "FLOATING"; branchCode: string;
  incomeMinor?: number; existingEmiMinor?: number;
}): Promise<ApplicationView> {
  const res = await fetch("/api/v1/applications", {
    method: "POST", headers: authHeaders(crypto.randomUUID()),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Draft failed (${res.status})`);
  return res.json();
}

/** G2 submit: CIB pull → scoring → CPV (no client DBR — server-computed). */
export async function submitApplication(id: string): Promise<ApplicationView> {
  const res = await fetch(`/api/v1/applications/${id}/submit`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Submit failed (${res.status})`);
  }
  return res.json();
}

/** CPV gate: pass starts the approval ladder; fail rolls back to screening. */
export async function cpvApplication(
  id: string, passed: boolean, notes: string,
): Promise<ApplicationView> {
  const res = await fetch(`/api/v1/applications/${id}/cpv`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ passed, notes }),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `CPV failed (${res.status})`);
  }
  return res.json();
}

export async function listApplications(stage?: string): Promise<ApplicationView[]> {
  const q = stage ? `?stage=${encodeURIComponent(stage)}` : "";
  const res = await fetch(`/api/v1/applications${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`List failed (${res.status})`);
  return (await res.json()).data ?? [];   // 05 §2 envelope
}

/** Autosave PATCH (07 §4): update draft fields while still SCREENING. */
export async function patchApplication(
  id: string, body: { productCode: string; amountMinor: number; tenorMonths: number;
    rateType: "FIXED" | "FLOATING"; incomeMinor?: number; existingEmiMinor?: number },
): Promise<ApplicationView> {
  const res = await fetch(`/api/v1/applications/${id}`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Patch failed (${res.status})`);
  }
  return res.json();
}

export async function getLadder(): Promise<LadderRung[]> {
  const res = await fetch("/api/v1/approvals/ladder", { headers: authHeaders() });
  if (!res.ok) throw new Error(`Ladder failed (${res.status})`);
  return (await res.json()).data ?? [];
}

export async function currentTask(appId: string): Promise<ApprovalTask | null> {
  const res = await fetch(`/api/v1/approvals/current/${appId}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Task failed (${res.status})`);
  return res.json();
}

export async function actOnTask(
  taskId: string, action: WorkflowAction, actor: string, remark?: string,
  opts?: { delegateTo?: string },
): Promise<ActResult> {
  const res = await fetch(`/api/v1/approvals/${taskId}/act`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ action, actor, remark, delegateTo: opts?.delegateTo }),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Act failed (${res.status})`);
  }
  return res.json();
}

/** Conditions precedent on an application's workflow (Q1.3). */
export async function listConditions(appId: string): Promise<ApprovalConditionView[]> {
  const res = await fetch(`/api/v1/approvals/conditions/${appId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Conditions failed (${res.status})`);
  return (await res.json()).data ?? [];
}

/** SATISFIED (evidence on file) or WAIVED (documented override). */
export async function resolveCondition(
  id: string, status: "SATISFIED" | "WAIVED", remark?: string,
): Promise<ApprovalConditionView> {
  const res = await fetch(`/api/v1/approvals/conditions/${id}/resolve`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ status, remark }),
  });
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Resolve failed (${res.status})`);
  }
  return res.json();
}

/** EMI oracle — the SAME formula as OriginationService.emiMonthly (09 §3 shared fixtures). */
export function emiMonthly(principalMinor: number, months: number, annualRate: number): number {
  const i = annualRate / 12;
  if (i === 0) return Math.round(principalMinor / months); // zero-rate → straight-line (prototype parity; NaN guard — unit suite R1)
  const pow = Math.pow(1 + i, months);
  return Math.round((principalMinor * i * pow) / (pow - 1));
}

/** DBR oracle — policy max 50% (03 mod-origination). */
export function dbrPercent(monthlyIncome: number, existingEmis: number, proposedEmi: number): number {
  if (monthlyIncome <= 0) return Infinity;
  return ((existingEmis + proposedEmi) / monthlyIncome) * 100;
}

export interface ApplicationDocumentView {
  id: string; docType: string; sha256: string; sizeBytes: number;
  scanStatus: "PENDING" | "CLEAN" | "INFECTED";
}

export async function uploadDocument(
  appId: string, docType: string, file: File,
): Promise<ApplicationDocumentView> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `/api/v1/applications/${appId}/documents?docType=${encodeURIComponent(docType)}`,
    { method: "POST", headers: authHeaders(), body: form },
  );
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error(p.detail ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function listDocuments(appId: string): Promise<ApplicationDocumentView[]> {
  const res = await fetch(`/api/v1/applications/${appId}/documents`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Docs failed (${res.status})`);
  return (await res.json()).data ?? [];   // 05 §2 envelope
}
