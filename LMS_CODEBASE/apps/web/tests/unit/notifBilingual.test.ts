/**
 * Q1.6 bilingual notification parity (PLANNING polish sweep): every seeded
 * SMS template type must carry BOTH lang=en and lang=bn rows — a missing
 * Bengali row silently sends English to Bangla-first borrowers (URD §4).
 * Reads the mock seed directly (the Java module is template-driven and
 * takes its rows from the same contract).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const seedPath = join(dirname(fileURLToPath(import.meta.url)),
    "../../scripts/mockApi/r3r4r5.ts");
const seed = readFileSync(seedPath, "utf-8");
const rows = [...seed.matchAll(/\{ type: "([A-Z_]+)", channel: "SMS", lang: "(en|bn)"/g)]
    .map((m) => ({ type: m[1], lang: m[2] }));

describe("notification templates are bilingual (Q1.6)", () => {
  it("the seed parsed has template rows", () => {
    expect(rows.length).toBeGreaterThanOrEqual(16);
  });

  it("every SMS type has both en and bn rows", () => {
    const byType = new Map<string, Set<string>>();
    for (const r of rows) {
      if (!byType.has(r.type)) byType.set(r.type, new Set());
      byType.get(r.type)!.add(r.lang);
    }
    expect(byType.size).toBeGreaterThanOrEqual(8);
    for (const [type, langs] of byType) {
      expect([...langs].sort(), `template ${type} must ship en+bn`).toEqual(["bn", "en"]);
    }
  });

  it("Bengali rows contain Bengali script, not transliteration", () => {
    const bnRows = [...seed.matchAll(/lang: "bn", body: "([^"]+)"/g)].map((m) => m[1]);
    expect(bnRows.length).toBeGreaterThanOrEqual(8);
    for (const body of bnRows) {
      expect(/[\u0980-\u09FF]/.test(body), `body "${body}" has no Bangla glyphs`).toBe(true);
    }
  });
});
