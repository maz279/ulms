/**
 * Playwright globalSetup (audit R1 verification) — suite determinism.
 * The mock API is a long-lived in-memory DB; journeys accumulate (loans paid
 * to DPD-0 drop off the worklist, same-date provision JVs 409) and made
 * repeat runs flaky. Reset both mock instances before workers start.
 * Mock-only route — never present on the real stack.
 */
export default async function globalSetup(): Promise<void> {
  const targets = [
    process.env.E2E_BASE_URL ?? "http://localhost:5173",
    "http://localhost:8081",   // standalone API-leg mock (best-effort)
  ];
  await Promise.all(targets.map(async (base) => {
    try {
      const res = await fetch(`${base}/api/v1/__test/reset`, { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      // standalone not running (UI-only run) — the vite middleware reset covers it
    }
  }));
}
