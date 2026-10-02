import { describe, it, expect } from "vitest";
import {
  syncQueue, backoffMs, mergeServerWins, validateFieldForm, validateVoiceNote,
  photoQualityOk, BACKOFF_BASE_MS, MAX_ATTEMPTS, GPS_ACCURACY_MAX_M,
  type QueuedOperation, type ServerTask, type Transport,
} from "./engine";

const op = (over: Partial<QueuedOperation> = {}): QueuedOperation => ({
  id: "op-1", kind: "task-complete", loanId: "l-1", taskId: "t-1",
  payload: { outcome: "VERIFIED" },
  evidence: [{ kind: "gps", ref: "gps:23.79,90.40", capturedAt: "2026-10-02T10:00:00Z", sha256: "aaa" }],
  queuedAt: "2026-10-02T10:00:00Z", state: "pending", attempts: 0, ...over,
});

const ok: Transport = async () => ({ ok: true });
const retryable: Transport = async () => ({ ok: false, retryable: true, error: "offline" });
const fatal: Transport = async () => ({ ok: false, retryable: false, error: "422 bad payload" });

describe("offline sync engine (R6)", () => {
  it("happy path: pending → synced", async () => {
    const { queue, result } = await syncQueue([op()], ok);
    expect(queue[0].state).toBe("synced");
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("server-wins merge: server payload replaces local; evidence appends, never overwrites", () => {
    const local = op({ payload: { outcome: "VERIFIED", stale: true } });
    const server: ServerTask = {
      taskId: "t-1", loanId: "l-1", status: "DONE", version: 7,
      evidence: [
        { kind: "gps", ref: "gps:23.79,90.40", capturedAt: "2026-10-02T10:00:00Z", sha256: "aaa" },      // dup
        { kind: "photo", ref: "file://p2.jpg", capturedAt: "2026-10-02T11:00:00Z", sha256: "bbb" },        // new
      ],
    };
    const merged = mergeServerWins(local, server);
    expect(merged.op.payload.serverVersion).toBe(7);
    expect(merged.appendedEvidence.map((e) => e.sha256)).toEqual(["bbb"]);   // dedupe by sha
  });

  it("retryable failures back off exponentially and defer until the gate passes", async () => {
    const deterministic = () => 0;                                          // jitter floor (0.8×)
    let { queue } = await syncQueue([op()], retryable, 1_000_000, deterministic);
    expect(queue[0].state).toBe("pending");
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].nextAttemptAt).toBe(1_000_000 + Math.round(BACKOFF_BASE_MS * 0.8));

    // second failure → next ladder step (2s pure), gated from the new now
    const now2 = queue[0].nextAttemptAt! + 1;
    ({ queue } = await syncQueue(queue, retryable, now2, deterministic));
    expect(queue[0].attempts).toBe(2);
    expect(queue[0].nextAttemptAt).toBe(now2 + Math.round(2 * BACKOFF_BASE_MS * 0.8));

    // before the gate: deferred, untouched
    const early = await syncQueue(queue, retryable, queue[0].nextAttemptAt! - 1);
    expect(early.result.deferred).toBe(1);
    expect(early.queue[0].attempts).toBe(2);
  });

  it("exhausted retries → failed; fatal errors fail immediately", async () => {
    let q = [op()];
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) {
      const now = q[0].nextAttemptAt ?? 0;
      q = (await syncQueue(q, retryable, now + 1)).queue;
    }
    expect(q[0].state).toBe("failed");
    expect(q[0].attempts).toBe(MAX_ATTEMPTS);

    const fatalOut = await syncQueue([op()], fatal);
    expect(fatalOut.queue[0].state).toBe("failed");     // no retry on non-retryable
    expect(fatalOut.queue[0].attempts).toBe(1);
  });

  it("backoff caps at the 5th ladder step with bounded jitter", () => {
    expect(backoffMs(0, () => 0)).toBe(800);            // 1s × 0.8
    expect(backoffMs(4, () => 0)).toBe(12_800);         // 16s × 0.8
    expect(backoffMs(9, () => 0)).toBe(12_800);         // capped at 16s step
    expect(backoffMs(2, () => 1)).toBe(4_800);          // 4s × 1.2 jitter ceiling
  });

  it("backoff jitter bounds: 0.8×–1.2× of the pure delay", () => {
    const pure2s = 2 * BACKOFF_BASE_MS;
    expect(backoffMs(1, () => 0)).toBe(pure2s * 0.8);
    expect(backoffMs(1, () => 1)).toBe(pure2s * 1.2);
  });
});

describe("field form validation (R6)", () => {
  const base = {
    verificationType: "RESIDENCE" as const, personMet: true,
    gps: { lat: 23.79, lng: 90.4, accuracyM: 8 }, photos: 2,
    notes: "matched NIDW address", outcome: "VERIFIED" as const,
  };
  it("valid form passes", () => expect(validateFieldForm(base)).toEqual([]));
  it("no person met → error", () =>
    expect(validateFieldForm({ ...base, personMet: false })).toContain("personMet must be confirmed before submit"));
  it("zero photos → error", () =>
    expect(validateFieldForm({ ...base, photos: 0 })[0]).toContain("at least 1 photo"));
  it(`GPS accuracy beyond ${GPS_ACCURACY_MAX_M}m → reacquire`, () =>
    expect(validateFieldForm({ ...base, gps: { ...base.gps, accuracyM: 35 } })[0]).toContain("reacquire"));
  it("discrepancy needs a ≥20-char explanation", () =>
    expect(validateFieldForm({ ...base, outcome: "DISCREPANCY", notes: "short" })[0]).toContain("≥20-char"));
  it("not-found needs visit-context notes", () =>
    expect(validateFieldForm({ ...base, outcome: "NOT_FOUND", notes: "x" })[0]).toContain("visit-context"));
  it("voice note cap at 5 minutes", () => {
    expect(validateVoiceNote(299)).toBeNull();
    expect(validateVoiceNote(301)).toContain("exceeds 300s");
  });
  it("photo quality gate: ≥1024px long edge", () => {
    expect(photoQualityOk(1080, 1920)).toBe(true);
    expect(photoQualityOk(640, 480)).toBe(false);       // long edge 640 < 1024
  });
});
