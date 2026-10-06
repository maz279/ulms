import { test, expect } from "@playwright/test";

/**
 * P4 journeys (Gate G4, PLANNING/09 + 12 W11) — the regulatory console and
 * report center through the REAL UI on the dev proxy: EOD primer, returns
 * board statuses, pack generation with the preparer=system chain, checker →
 * compliance sign-off to FILED, submission calendar, portfolio read model,
 * and the IFRS-9 ECL runway statement.
 *
 * Requires: compose stack + demo loans + VITE_ULMS_TOKEN (admin) on the dev server.
 */

test("G4: regcon board renders the 12-row catalog + KPIs", async ({ page }) => {
  await page.goto("/compliance/regcon");
  await expect(page.getByText("Bangladesh Bank Returns — Regulatory Console"))
    .toBeVisible({ timeout: 10_000 });

  // the full prototype catalog
  for (const code of ["CL-1", "CL-2", "CL-3", "CL-4", "CL-5", "CIB-S", "CIB-C", "CIB-R", "CAR", "EDW", "ECL", "LLF"]) {
    await expect(page.locator("td", { hasText: code }).first()).toBeVisible();
  }
  // KPI cards + the live channel chip
  await expect(page.getByText("Returns due 30d")).toBeVisible();
  await expect(page.getByText("IFRS-9 runway")).toBeVisible();
  await expect(page.locator(".MuiChip-root").filter({ hasText: "Live" }).first()).toBeVisible();
});

test("G4: provision JV button posts the EOD total to the Fineract GL", async ({ page }) => {
  // fresh EOD for today, then the board's JV button (03 "JV queue").
  await page.goto("/compliance/board");
  await page.getByRole("button", { name: "Run EOD now" }).click();
  await expect(page.getByText(/Latest EOD/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Provision JV" }).click();

  // Both outcomes are correct system behavior depending on whether another
  // suite run already posted this date at a different total (payments from
  // the p3 journeys drift the portfolio): the idempotent zero-sum post, or
  // the drift 409 demanding a reversing entry. The zero-sum/idempotency/
  // drift math itself is pinned deterministically in ComplianceReturnsTest.
  await expect(page.getByText(/zero-sum .*Fineract txn|reversing entry/).first())
    .toBeVisible({ timeout: 15_000 });
});

test("G4: generate CL-1 → checker → compliance sign-off → Filed (distinct officers)", async ({ page }) => {
  // prime the EOD batch so CL-1/CL-2 have classification data to report
  await page.goto("/compliance/board");
  await page.getByRole("button", { name: "Run EOD now" }).click();
  await expect(page.getByText(/Latest EOD/)).toBeVisible({ timeout: 15_000 });

  await page.goto("/compliance/regcon");
  const row = page.locator("tr", { hasText: "CL-1" }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });

  // 1. generate — preparer=system, staged
  await row.getByRole("button", { name: /Prepare|Regenerate/ }).click();
  await expect(page.getByText(/CL-1 generated for \d{4}-\d{2}/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/staged with preparer=system/)).toBeVisible();

  // 2. checker sign-off (the baked-token officer checks)
  const withChecker = page.locator("tr", { hasText: "CL-1" }).first();
  await withChecker.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText(/checker sign-off recorded/)).toBeVisible({ timeout: 10_000 });

  // 3a. the SAME officer cannot also file — 06 §8 maker-checker separation
  await page.locator("tr", { hasText: "CL-1" }).first()
    .getByRole("button", { name: /Sign off & file/ }).click();
  await expect(page.getByText(/DIFFERENT officer/)).toBeVisible({ timeout: 10_000 });

  // 3b. a distinct compliance officer completes the chain via the API leg
  //     (token from env — never written into the spec)
  const complianceToken = process.env.E2E_COMPLIANCE_TOKEN;
  test.skip(!complianceToken, "needs E2E_COMPLIANCE_TOKEN for the two-officer chain");
  const board = await page.evaluate(async (adminToken) => {
    const res = await fetch("/api/v1/compliance/returns",
      { headers: { Authorization: `Bearer ${adminToken}` } });
    return (await res.json()).entries;
  }, process.env.VITE_ULMS_TOKEN ?? "");
  const entry = (board as { code: string; returnId: string | null }[])
    .find((e) => e.code === "CL-1" && e.returnId);
  expect(entry?.returnId, "CL-1 pack must exist").toBeTruthy();
  const status = await page.evaluate(async (args) => {
    const res = await fetch(`/api/v1/compliance/returns/${args.id}/signoff/file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${args.token}` },
    });
    return res.status;
  }, { id: entry!.returnId, token: complianceToken });
  expect(status, "distinct compliance officer files the return").toBe(200);

  // 4. board reflects FILED
  await page.reload();
  await expect(page.locator("tr", { hasText: "CL-1" }).first()
    .locator(".MuiChip-root").filter({ hasText: "Filed" })).toBeVisible({ timeout: 10_000 });
});

test("G4: submission calendar dialog lists upcoming BB due dates", async ({ page }) => {
  await page.goto("/compliance/regcon");
  await page.getByRole("button", { name: /Submission calendar/ }).click();
  await expect(page.getByText("Submission calendar — next 6 months")).toBeVisible({ timeout: 10_000 });
  // at least the near-month dues are listed with their reporting period
  await expect(page.locator("tbody tr").first()).toBeVisible();
  const rows = await page.locator("tbody tr").count();
  expect(rows).toBeGreaterThan(4);
});

test("G4: report center — ECL statement + portfolio read model", async ({ page }) => {
  await page.goto("/compliance/reports");
  // heading-level pin: the prototype-parity chrome repeats the label in the
  // sitemap link and the breadcrumb, so getByText would be ambiguous
  await expect(page.getByRole("heading", { name: "Report Center" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("td", { hasText: "CL-2" }).first()).toBeVisible();

  // IFRS-9 ECL statement tab — runway alert + per-stage rows
  await page.getByRole("tab", { name: /IFRS-9 ECL statement/ }).click();
  await expect(page.getByText(/IFRS-9 becomes mandatory/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/runway \d+ months/)).toBeVisible();
  await expect(page.locator("th", { hasText: "BRPD stage" })).toBeVisible();

  // portfolio read model — grouped by classification, branch switch works
  await page.getByRole("tab", { name: /Portfolio read model/ }).click();
  await expect(page.locator("th", { hasText: "Classification (BRPD)" })
    .or(page.locator("th", { hasText: "classification" }))).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/active loans/)).toBeVisible();
  await page.getByLabel("Group by").click();
  await page.getByRole("option", { name: "Branch" }).click();
  await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("BR-001").first()).toBeVisible({ timeout: 10_000 });

  // writer slice (12 W11): save a governed report then run it from My reports
  await page.getByRole("tab", { name: /My reports/ }).click();
  await page.getByLabel("Report name").fill(`E2E branch pack ${Date.now() % 10000}`);
  await page.getByRole("button", { name: /Save report/ }).click();
  await expect(page.getByText(/Report ".*" saved/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Run" }).first().click();
  await expect(page.getByText(/groups · outstanding/)).toBeVisible({ timeout: 10_000 });
});
