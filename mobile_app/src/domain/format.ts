/** BDT money display — ৳ with lakh/crore grouping per Bangladesh convention. */
export function tk(minor: number): string {
  const taka = minor / 100;
  const s = taka.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return "৳" + s;
}
