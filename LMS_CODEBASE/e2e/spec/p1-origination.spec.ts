import { test, expect } from "@playwright/test";

/**
 * P1 journeys (Gate G1, PLANNING/09 journey 2-3) — updated for the
 * audit-iteration UX: submit parks on the wizard's Documents step (uploads
 * before pipeline), customer 360 exposes the e-KYC + screening actions,
 * and autosave chips are visible. Seed-independent: the working CIF is
 * picked from the live list. Requires the compose stack + VITE_ULMS_TOKEN
 * (branch-officer or admin) for the dev proxy.
 */

/** First customer CIF from the live list — works with any seed state. */
async function firstCif(page: import("@playwright/test").Page): Promise<string> {
  await page.goto("/customers");
  const cell = page.locator("td", { hasText: /^CIF-\d+$/ }).first();
  await expect(cell).toBeVisible({ timeout: 10_000 });
  return (await cell.innerText()).trim();
}

test("G1: 360 view + e-KYC + screening actions", async ({ page }) => {
  const cif = await firstCif(page);
  await page.goto(`/customer/${cif}`);
  // pin to the page-header subtitle: the CIF also appears in the statusbar
  // route readout (prototype chrome), so a bare getByText is ambiguous
  await expect(page.getByText(new RegExp(`${cif} · (RETAIL|SME|CORPORATE|AGRI)`))).toBeVisible();

  // e-KYC verify action (mock NIDW)
  await page.getByRole("tab", { name: "Actions" }).click();
  await page.getByRole("button", { name: /Verify KYC/ }).click();
  await page.getByRole("textbox", { name: /NID/ }).fill("1990123456789");
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await expect(page.getByText(/e-KYC VERIFIED/)).toBeVisible({ timeout: 5_000 });

  // screening hook (P1 default list → CLEAR)
  await page.getByRole("button", { name: /Run screening/ }).click();
  await expect(page.getByText(/Screening CLEAR/)).toBeVisible({ timeout: 5_000 });
});

test("G1: apply → autosave chips → submit → documents → pipeline → ladder → sanction", async ({ page }) => {
  const cif = await firstCif(page);
  // 1. wizard: pick customer, finance, product, review + declaration
  await page.goto("/apply");
  await expect(page.getByText(/Draft autosave armed/)).toBeVisible();
  await page.getByLabel("Customer (CIF)").click();
  await page.getByRole("option", { name: new RegExp(cif) }).click();
  await page.getByRole("button", { name: "Next ›" }).click();   // → contact
  await page.getByRole("button", { name: "Next ›" }).click();   // → finance
  await expect(page.getByText(/Live DBR/)).toBeVisible();
  // G2: server DBR counts bureau installments (৳88k) — raise income so the
  // application clears policy and proceeds to CPV
  await page.getByLabel("Monthly income (৳)").fill("600000");
  await page.getByRole("button", { name: "Next ›" }).click();   // → product (server draft created)
  await expect(page.getByText(/EMI \(reducing balance\)/)).toBeVisible();
  await expect(page.getByText(/Server draft created/)).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Next ›" }).click();   // → documents (pre-submit info)
  await page.getByRole("button", { name: "Next ›" }).click();   // → review
  await page.getByText("I confirm the information is true").click();
  await page.getByRole("button", { name: "Submit application ✓" }).click();

  // 2. wizard parks on the Documents step (submit ran CIB+scoring server-side)
  await expect(page.getByText(/stage CPV/))
    .toBeVisible({ timeout: 10_000 });

  // 3. through to the pipeline
  await page.getByRole("button", { name: /Go to pipeline/ }).click();
  await expect(page).toHaveURL(/\/pipeline/);
  const row = page.locator("tr", { hasText: "APP-" }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row.getByText("CPV")).toBeVisible();

  // 3b. CPV pass (G2 gate) → APPROVAL + ladder start
  await row.getByRole("button", { name: "Open" }).click();
  await page.getByRole("button", { name: /CPV pass/ }).click();
  await expect(page.getByText(/ladder started/)).toBeVisible({ timeout: 10_000 });
  await expect(row.getByText("APPROVAL")).toBeVisible({ timeout: 10_000 });

  // 4. open detail, approve through the ladder until stage leaves APPROVAL
  //    (test token carries admin — ladder walk allowed)
  for (let i = 0; i < 8; i++) {
    await row.getByRole("button", { name: "Open" }).click();
    const approve = page.getByRole("button", { name: "Approve", exact: true });
    if (!(await approve.isVisible().catch(() => false))) break;   // no open task
    await approve.click();
    await expect(page.getByText(/done — /)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    if (!(await row.getByText("APPROVAL").isVisible().catch(() => false))) break;
  }
  await expect(row.getByText(/SANCTION|DISBURSEMENT|DISBURSED/).first())
    .toBeVisible({ timeout: 10_000 });
});

test("G1: Zod gate blocks invalid finance entry (validation parity)", async ({ page }) => {
  const cif = await firstCif(page);
  await page.goto("/apply");
  await page.getByLabel("Customer (CIF)").click();
  await page.getByRole("option", { name: new RegExp(cif) }).click();
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByLabel("Monthly income (৳)").fill("0");   // schema: positive
  await page.getByRole("button", { name: "Next ›" }).click();
  await expect(page.getByText(/Monthly income must be > 0/)).toBeVisible();
});

test("G2: server DBR (bureau obligations counted) auto-declines thin income", async ({ page }) => {
  const cif = await firstCif(page);
  await page.goto("/apply");
  await page.getByLabel("Customer (CIF)").click();
  await page.getByRole("option", { name: new RegExp(cif) }).click();
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByLabel("Monthly income (৳)").fill("60000");    // EMI+bureau > 50% of income
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByRole("button", { name: "Next ›" }).click();
  await page.getByText("I confirm the information is true").click();
  await page.getByRole("button", { name: "Submit application ✓" }).click();
  // G2: server-side scoring auto-declines (DBR > 50% → grade D path)
  await expect(page.getByText(/Auto-declined at scoring/)).toBeVisible({ timeout: 10_000 });
});
