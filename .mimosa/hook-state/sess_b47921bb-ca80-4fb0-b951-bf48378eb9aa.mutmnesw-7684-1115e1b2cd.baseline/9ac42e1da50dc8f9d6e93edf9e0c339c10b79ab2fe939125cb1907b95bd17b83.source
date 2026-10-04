/**
 * EMI parity with the bank oracle (09 §3 shared fixtures) — the app must
 * show the same number the sanction letter and statement carry.
 */
import { describe, it, expect } from "vitest";
import { emiMonthly, payoffMonths, interestSaved } from "./emi";

describe("borrower EMI oracle parity", () => {
  it("matches the bank formula on the shared fixtures", () => {
    // ৳500,000 @ 13% for 36m → ৳16,846.98 ≈ 1,684,698 minor
    expect(emiMonthly(50_000_000, 36, 13)).toBe(1_684_698);
    // ৳100,000 @ 0% — straight-line: ৳5,000 = 500,000 minor
    expect(emiMonthly(10_000_000, 20, 0)).toBe(500_000);
    // rounding boundary sanity
    expect(emiMonthly(10_000_000, 12, 12)).toBeGreaterThan(0);
  });

  it("zero-rate payoff is exact division", () => {
    expect(payoffMonths(10_000_000, 500000, 0, 0)).toBe(20);
    expect(payoffMonths(10_000_000, 500000, 500000, 0)).toBe(10);
  });

  it("payoff is null when the payment never covers interest", () => {
    expect(payoffMonths(1_000_000_00, 1000, 0, 24)).toBeNull();
  });

  it("paying extra always shortens the payoff", () => {
    const base = payoffMonths(50_000_000, 1_687_100, 0, 13);
    const faster = payoffMonths(50_000_000, 1_687_100, 500_000, 13);
    expect(base).not.toBeNull();
    expect(faster!).toBeLessThan(base!);
    expect(interestSaved(50_000_000, 1_687_100, 500_000, 13)).toBeGreaterThan(0);
  });
});
