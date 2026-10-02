/** Lakh/Crore formatting — ৳ amounts stay language-neutral (prototype F.tk). */
export function formatTk(minor: number, opts?: { full?: boolean }): string {
  const taka = minor / 100;
  if (opts?.full) {
    return "৳" + taka.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  if (taka >= 1e7) return `৳${(taka / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (taka >= 1e5) return `৳${(taka / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
  return "৳" + taka.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
