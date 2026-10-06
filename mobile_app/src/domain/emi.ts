/* Domain math for the borrower app — the SAME formula as the bank's
 * OriginationService.emiMonthly (09 §3 shared fixtures) so the app's
 * numbers always match the statement. */
export function emiMonthly(principalMinor: number, months: number,
                           annualRatePercent: number): number {
  const i = annualRatePercent / 12 / 100;
  if (i === 0) return Math.round(principalMinor / months);
  const pow = Math.pow(1 + i, months);
  return Math.round((principalMinor * i * pow) / (pow - 1));
}

/** Months until payoff at a given extra monthly payment (research: payoff
 * calculators are a 2026 standard borrower feature). */
export function payoffMonths(outstandingMinor: number, emiMinor: number,
                             extraMinor: number, annualRatePercent: number): number | null {
  const payment = emiMinor + extraMinor;
  if (payment <= 0) return null;
  const i = annualRatePercent / 12 / 100;
  if (i === 0) return Math.ceil(outstandingMinor / payment);
  if (payment <= outstandingMinor * i) return null;   // never covers interest
  const n = -Math.log(1 - (outstandingMinor * i) / payment) / Math.log(1 + i);
  return Math.ceil(n);
}

/** Interest saved by paying extra (approximation on the same formula). */
export function interestSaved(outstandingMinor: number, emiMinor: number,
                              extraMinor: number, annualRatePercent: number): number | null {
  const base = payoffMonths(outstandingMinor, emiMinor, 0, annualRatePercent);
  const faster = payoffMonths(outstandingMinor, emiMinor, extraMinor, annualRatePercent);
  if (base == null || faster == null) return null;
  const paid = (months: number) => months * (emiMinor + (months === base ? 0 : extraMinor));
  return Math.max(0, paid(base) - paid(faster));
}
