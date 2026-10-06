/**
 * ULMS web unit suite (audit R1 — first Vitest layer per PLANNING quality gates).
 * Lives outside tsconfig's src include so production typecheck stays lean;
 * run: npm run test:unit
 */
import { describe, it, expect } from "vitest";
import { formatTk } from "@/api/money";
import { emiMonthly, dbrPercent } from "@/api/applications";
import { BRPD_MATRIX, classifyLocal } from "@/api/compliance";
import { BRPD, stageOf, F, genRows } from "@/shell/demoData";
import { lmSearch } from "@/shell/search";
import { normalizeRoute } from "@/shell/ui";

describe("money formatting (Lakh/Crore, 07 §5)", () => {
  it("renders full taka with en-IN grouping", () => {
    expect(formatTk(2500000, { full: true })).toBe("৳25,000");
    expect(formatTk(150000000, { full: true })).toBe("৳15,00,000");
  });
  it("compacts to Lakh and Crore", () => {
    expect(formatTk(150000000)).toBe("৳15 L");
    expect(formatTk(520000000000)).toBe("৳520 Cr"); // minor: 520 Cr taka = 520×10⁷×100
  });
  it("keeps small amounts whole", () => {
    expect(formatTk(50000)).toBe("৳500");
  });
});

describe("EMI + DBR oracles (09 §3 shared fixtures)", () => {
  it("EMI reducing-balance: ৳15L / 48m @ 11.99% matches the fixture band", () => {
    const emi = emiMonthly(150000000, 48, 0.1199); // minor units
    // backend fixture band: ৳39,000–40,000/month for this shape
    expect(emi / 100).toBeGreaterThan(39000);
    expect(emi / 100).toBeLessThan(40500);
  });
  it("zero-interest falls back to straight-line", () => {
    expect(emiMonthly(120000, 12, 0)).toBe(10000);
  });
  it("DBR: policy max 50% boundary is measurable", () => {
    expect(dbrPercent(100000, 25000, 25000)).toBe(50);
    expect(dbrPercent(0, 1, 1)).toBe(Infinity);
  });
});

describe("BRPD 15/2024 classification parity (frontend mirror vs backend oracle shape)", () => {
  it("matrix covers all 7 stages with the binding rates", () => {
    expect(BRPD_MATRIX.map((b) => b.rateBp)).toEqual([100, 100, 100, 500, 2000, 5000, 10000]);
  });
  it("classifyLocal agrees with the demo-data stage table at every boundary ±1", () => {
    const boundaries = [0, 1, 30, 31, 60, 61, 90, 91, 180, 181, 365, 366, 400];
    for (const dpd of boundaries) {
      expect(classifyLocal(dpd).cls).toBe(BRPD[stageOf(dpd)].k);
    }
  });
  it("interest suspense starts at SS", () => {
    expect(["SS", "DF", "B/L"].includes(classifyLocal(120).cls)).toBe(true);
    expect(["SS", "DF", "B/L"].includes(classifyLocal(45).cls)).toBe(false);
  });
});

describe("demo data determinism (same data every boot)", () => {
  it("genRows is stable per screen id", () => {
    const a = genRows("A1-s4", 5).map((r) => r.id);
    const b = genRows("A1-s4", 5).map((r) => r.id);
    expect(a).toEqual(b);
    expect(a.length).toBe(5);
  });
  it("F.tk compacts like the prototype", () => {
    expect(F.tk(5200000000)).toBe("৳520 Cr");
    expect(F.tk(1500000)).toBe("৳15 L");
  });
});

describe("Tell-ME search index", () => {
  it("finds modules, screens, reports, records with group tags", () => {
    const hits = lmSearch("CL-1");
    expect(hits.some((h) => h.g === "Reports" && h.t.includes("CL-1"))).toBe(true);
  });
  it("empty query returns nothing", () => {
    expect(lmSearch("   ")).toEqual([]);
  });
});

describe("route normalization (prototype grammar → SPA)", () => {
  it("strips hash prefixes and maps html aliases", () => {
    expect(normalizeRoute("#/pipeline")).toBe("/pipeline");
    expect(normalizeRoute("portals.html")).toBe("/portal");
    expect(normalizeRoute("mobile.html")).toBe("/screen/C3-s1");
    expect(normalizeRoute("/home")).toBe("/home");
  });
});
