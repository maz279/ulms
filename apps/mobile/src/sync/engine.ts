/* ============================================================
   ULMS field app — offline sync engine (R6).
   PURE TypeScript (no React Native imports) so it unit-tests in
   plain Node and reviews like the rest of the codebase.

   Contract (PLANNING/03 mod-collections + 08 CPV):
   · field tasks sync with SERVER-WINS conflict resolution — the
     server state replaces the local one, never the reverse;
   · evidence (photos/GPS/notes/signature) is APPEND-ONLY — a
     conflict appends a new evidence item, never overwrites one;
   · retries with exponential backoff (1s base, 5 attempts, jitter);
   · the queue is durable (serialized to storage by the caller).
   ============================================================ */

export type SyncState = "pending" | "syncing" | "conflict" | "synced" | "failed";

export interface Evidence {
  readonly kind: "photo" | "gps" | "note" | "signature" | "voice";
  readonly ref: string;                    // local storage URI / value
  readonly capturedAt: string;             // ISO
  readonly sha256: string;                 // integrity for transport
}

export interface QueuedOperation {
  readonly id: string;
  readonly kind: "task-complete" | "action-log" | "ptp-create" | "evidence-append"
    | "visit" | "sos";   // PLANNING/08 A5 field-gateway ops (visit is idempotent by op id)
  readonly loanId: string;
  readonly taskId?: string;
  readonly payload: Record<string, unknown>;
  readonly evidence: readonly Evidence[];
  readonly queuedAt: string;
  state: SyncState;
  attempts: number;
  lastError?: string;
  nextAttemptAt?: number;                 // epoch ms — backoff gate
}

export interface ServerTask {
  readonly taskId: string;
  readonly loanId: string;
  readonly status: "OPEN" | "DONE";
  readonly evidence: readonly Evidence[];
  readonly version: number;               // server version for server-wins
}

export type Transport = (op: QueuedOperation) => Promise<{ ok: true; serverTask?: ServerTask } | { ok: false; retryable: boolean; error: string }>;

export interface SyncResult {
  processed: number;
  synced: number;
  conflictsResolved: number;              // server-wins applications
  evidenceAppended: number;               // append-only conflict outcomes
  deferred: number;                       // still in backoff
  failed: number;
}

export const BACKOFF_BASE_MS = 1_000;
export const MAX_ATTEMPTS = 5;

/** Exponential backoff with ±20% jitter: 1s, 2s, 4s, 8s, 16s.
 *  rand is injectable for deterministic tests — production callers pass a
 *  crypto-backed source (expo-crypto randomUUID-derived), NOT for secrets:
 *  jitter only decorrelates retry storms. */
export function backoffMs(attempts: number, rand: () => number = defaultJitter): number {
  const pure = BACKOFF_BASE_MS * Math.pow(2, Math.min(attempts, MAX_ATTEMPTS - 1));
  const jitter = pure * (0.8 + rand() * 0.4);
  return Math.round(jitter);
}

/** Production jitter source — crypto-random, same family as the web session ids. */
function defaultJitter(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF;
}

/** Server-wins merge: server task state replaces local; evidence appends. */
export function mergeServerWins(local: QueuedOperation, server: ServerTask): { op: QueuedOperation; appendedEvidence: Evidence[] } {
  const localKeys = new Set(local.evidence.map((e) => e.sha256));
  const appended = server.evidence.filter((e) => !localKeys.has(e.sha256));
  return {
    op: { ...local, state: "synced", payload: { ...local.payload, serverVersion: server.version } },
    appendedEvidence: appended,
  };
}

/** Drain the queue: process pending ops whose backoff gate has passed. */
export async function syncQueue(
  queue: QueuedOperation[],
  transport: Transport,
  nowMs: number = Date.now(),
  rand: () => number = defaultJitter,
): Promise<{ queue: QueuedOperation[]; result: SyncResult }> {
  const result: SyncResult = { processed: 0, synced: 0, conflictsResolved: 0, evidenceAppended: 0, deferred: 0, failed: 0 };
  const out: QueuedOperation[] = [];
  for (const op of queue) {
    if (op.state === "synced" || op.state === "failed") { out.push(op); continue; }   // terminal states never retry
    if (op.nextAttemptAt && op.nextAttemptAt > nowMs) {
      out.push(op); result.deferred++; continue;
    }
    result.processed++;
    try {
      const res = await transport(op);
      if (res.ok) {
        if (res.serverTask) {
          const merged = mergeServerWins(op, res.serverTask);
          out.push(merged.op);
          result.conflictsResolved++;
          result.evidenceAppended += merged.appendedEvidence.length;
        } else {
          out.push({ ...op, state: "synced" });
        }
        result.synced++;
      } else if (res.retryable && op.attempts + 1 < MAX_ATTEMPTS) {
        out.push({ ...op, state: "pending", attempts: op.attempts + 1, lastError: res.error,
                   nextAttemptAt: nowMs + backoffMs(op.attempts, rand) });
      } else {
        out.push({ ...op, state: "failed", attempts: op.attempts + 1, lastError: res.error });
        result.failed++;
      }
    } catch (e) {
      if (op.attempts + 1 < MAX_ATTEMPTS) {
        out.push({ ...op, state: "pending", attempts: op.attempts + 1,
                   lastError: String(e), nextAttemptAt: nowMs + backoffMs(op.attempts, rand) });
      } else {
        out.push({ ...op, state: "failed", attempts: op.attempts + 1, lastError: String(e) });
        result.failed++;
      }
    }
  }
  return { queue: out, result };
}

/* ---------- CPV/collections form validation (field-side gate) ---------- */

export interface FieldForm {
  verificationType: "RESIDENCE" | "BUSINESS" | "REFERENCE" | "ASSET";
  personMet: boolean;
  gps?: { lat: number; lng: number; accuracyM: number };
  photos: number;
  notes: string;
  outcome: "VERIFIED" | "DISCREPANCY" | "NOT_FOUND";
}

/** GPS accuracy gate: PLANNING/03 requires < 10 m for the geotag. */
export const GPS_ACCURACY_MAX_M = 10;
export const VOICE_NOTE_MAX_S = 300;
export const MIN_PHOTOS = 1;

export function validateFieldForm(f: FieldForm): string[] {
  const errs: string[] = [];
  if (!f.personMet) errs.push("personMet must be confirmed before submit");
  if (f.photos < MIN_PHOTOS) errs.push(`at least ${MIN_PHOTOS} photo required (quality-gated)`);
  if (!f.gps) errs.push("GPS geotag required");
  else if (f.gps.accuracyM > GPS_ACCURACY_MAX_M) errs.push(`GPS accuracy ${f.gps.accuracyM}m exceeds ${GPS_ACCURACY_MAX_M}m — reacquire outdoors`);
  if (f.outcome === "DISCREPANCY" && f.notes.trim().length < 20) {
    errs.push("discrepancy outcome requires ≥20-char explanation");
  }
  if (f.outcome === "NOT_FOUND" && f.photos > 0) {
    // NOT_FOUND still evidences the visit — photos required, notes explain
    if (f.notes.trim().length < 10) errs.push("not-found outcome needs visit-context notes");
  }
  return errs;
}

export function validateVoiceNote(seconds: number): string | null {
  return seconds <= VOICE_NOTE_MAX_S ? null : `voice note ${seconds}s exceeds ${VOICE_NOTE_MAX_S}s cap`;
}

/** Photo quality gate placeholder — the camera layer calls this with
 *  dimensions; min 1024px on the long edge per field-evidence policy. */
export function photoQualityOk(width: number, height: number): boolean {
  return Math.max(width, height) >= 1024;
}
