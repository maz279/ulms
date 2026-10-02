/* Durable queue store (R6) — the persistence boundary the sync engine
   assumes: caller-serialized to AsyncStorage. PURE facade so the engine
   stays testable in plain Node. */
import type { QueuedOperation } from "../sync/engine";
import * as AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ulms.sync.queue";

export async function loadQueue(): Promise<QueuedOperation[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as QueuedOperation[]) : [];
}
export async function saveQueue(q: QueuedOperation[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(q));
}
export async function enqueue(op: Omit<QueuedOperation, "queuedAt" | "state" | "attempts">): Promise<void> {
  const q = await loadQueue();
  q.push({ ...op, queuedAt: new Date().toISOString(), state: "pending", attempts: 0 } as QueuedOperation);
  await saveQueue(q);
}
