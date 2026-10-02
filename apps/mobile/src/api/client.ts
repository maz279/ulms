/* ============================================================
   ULMS field app — API client (R6). Points at the staff API
   (/api/v1) through the same contract the web app uses; the
   token comes from SecureStore after Keycloak PKCE login.
   The base URL is env-configured (ENV ONLY — no literals):
     EXPO_PUBLIC_API_BASE  e.g. https://ulms-dev.bank.local
   ============================================================ */
import type { QueuedOperation } from "./engine";

const BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8081").replace(/\/$/, "");

export function authFetch(token: string | null): typeof fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      headers: {
        ...(init?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
    })) as typeof fetch;
}

export interface WorklistItem {
  loanId: string; loanNo: string; dpd: number; classification: string;
  outstandingMinor: number; priority: string;
}
export interface FieldTaskView {
  id: string; loanId: string; assignedTo: string; dueOn: string;
  status: "OPEN" | "DONE"; evidence: unknown[] | null;
}

export async function fetchWorklist(token: string | null): Promise<WorklistItem[]> {
  const res = await authFetch(token)(`${BASE}/api/v1/collections/worklist`);
  if (!res.ok) throw new Error(`worklist ${res.status}`);
  return (await res.json()).data ?? [];
}

export async function fetchFieldTasks(token: string | null): Promise<FieldTaskView[]> {
  const res = await authFetch(token)(`${BASE}/api/v1/collections/field-tasks`);
  if (!res.ok) throw new Error(`field-tasks ${res.status}`);
  return (await res.json()).data ?? [];
}

/** Drain transport for the sync engine — maps queued ops to API calls. */
export function apiTransport(token: string | null) {
  return async (op: QueuedOperation): Promise<{ ok: true } | { ok: false; retryable: boolean; error: string }> => {
    try {
      let res: Response;
      switch (op.kind) {
        case "task-complete":
          res = await authFetch(token)(`${BASE}/api/v1/collections/field-tasks/${op.taskId}/complete`, {
            method: "POST", body: JSON.stringify({ evidence: JSON.stringify(op.evidence) }),
          });
          break;
        case "action-log":
          res = await authFetch(token)(`${BASE}/api/v1/collections/${op.loanId}/actions/CALL`, {
            method: "POST", body: JSON.stringify(op.payload),
          });
          break;
        case "ptp-create":
          res = await authFetch(token)(`${BASE}/api/v1/collections/${op.loanId}/ptp`, {
            method: "POST", body: JSON.stringify(op.payload),
          });
          break;
        case "evidence-append":
          res = await authFetch(token)(`${BASE}/api/v1/collections/${op.loanId}/actions/VISIT`, {
            method: "POST", body: JSON.stringify({ outcome: "EVIDENCE", notes: JSON.stringify(op.evidence) }),
          });
          break;
      }
      if (res.ok) return { ok: true };
      // 4xx = contract problem (fix the form) — not retryable; 5xx/网络 = retryable
      const retryable = res.status >= 500 || res.status === 0;
      return { ok: false, retryable, error: `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, retryable: true, error: String(e) };   // offline
    }
  };
}
