/**
 * Q1.6 Tell-ME live-record indexing: pages that load real records push them
 * into the search corpus; while anything live is indexed, the demo record
 * corpus stays OUT so Tell-ME never offers fabricated rows beside real ones.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { lmSearch, indexLiveRecords, clearLiveRecords, liveRecordCount,
         type SearchHit } from "@/shell/search";
import { RECORDS } from "@/shell/demoData";

const recordHits = (hits: SearchHit[]) => hits.filter((h) => h.g === "Records");

describe("Tell-ME live-record indexing (Q1.6)", () => {
  beforeEach(() => clearLiveRecords());

  it("empty store falls back to the demo corpus (prototype parity)", () => {
    const demoId = RECORDS[0][0];
    const hits = recordHits(lmSearch(demoId.split(" ")[0].toLowerCase()));
    expect(hits.length).toBeGreaterThan(0);
    expect(liveRecordCount()).toBe(0);
  });

  it("indexed live records are searchable by id and by title text", () => {
    indexLiveRecords([
      { id: "LN-777001", title: "Loan · DISBURSED", sub: "STD-0 · DPD 0", route: "/loans/uuid-1" },
      { id: "CIF-100871", title: "Customer · Rohana Karim", sub: "SME · BR-001",
        route: "/cust/CIF-100871", ico: "👤" },
    ]);
    expect(liveRecordCount()).toBe(2);

    const byId = recordHits(lmSearch("ln-777001"));
    expect(byId).toHaveLength(1);
    expect(byId[0].route).toBe("/loans/uuid-1");

    const byName = recordHits(lmSearch("rohana"));
    expect(byName).toHaveLength(1);
    expect(byName[0].ico).toBe("👤");
  });

  it("while live records exist, demo records are suppressed in the Records group", () => {
    indexLiveRecords([
      { id: "LN-777001", title: "Loan · DISBURSED", sub: "STD-0", route: "/loans/uuid-1" },
    ]);
    // search a token that ONLY exists in the demo corpus records
    const demoOnly = RECORDS.map((r) => r[0]).join(" ");
    const hits = recordHits(lmSearch(demoOnly.slice(0, 24).toLowerCase()));
    expect(hits.every((h) => h.t.startsWith("LN-777001"))).toBe(true);
  });

  it("re-indexing the same id is an idempotent upsert", () => {
    const row = { id: "LN-777001", title: "Loan · DISBURSED", sub: "STD-0", route: "/loans/1" };
    indexLiveRecords([row, { ...row, sub: "STD-1 · DPD 12" }]);
    expect(liveRecordCount()).toBe(1);
    const hits = recordHits(lmSearch("LN-777001"));
    expect(hits).toHaveLength(1);
    expect(hits[0].t).toContain("STD-1");
  });

  it("pages/actions/reports indexing is unaffected by the live store", () => {
    indexLiveRecords([
      { id: "LN-777001", title: "Loan · DISBURSED", sub: "STD-0", route: "/loans/1" },
    ]);
    const pages = lmSearch("application pipeline").filter((h) => h.g === "Pages");
    expect(pages.length).toBeGreaterThan(0);
  });
});
