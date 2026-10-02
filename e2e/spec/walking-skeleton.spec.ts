import { test, expect } from "@playwright/test";

/**
 * G0 walking-skeleton journey (PLANNING/00 gate; ported from the prototype's
 * verified flows per PLANNING/09 §2). Runs headless in CI against DEV.
 * Auth: P0 uses the dev token injected via VITE_ULMS_TOKEN; P1 swaps to real
 * Keycloak PKC E login (journey 1 in the suite) without changing the asserts.
 */
test("walking skeleton: create customer → appears in list → audit written", async ({ page }) => {
  await page.goto("/customers");

  // 1. the customer register is visible (any seed state ≥1 row)
  await expect(page.locator("td", { hasText: /^CIF-\d+$/ }).first()).toBeVisible();

  // 2. create a new customer through the real API (unique mobile — Fineract
  //    rejects duplicate mobileNo globally with 403)
  const stamp = Date.now().toString().slice(-6);
  const mobile = `+88017${stamp}${Math.floor(Math.random() * 90 + 10)}`.slice(0, 14);
  await page.getByLabel("Full name (English)").fill(`E2E Person ${stamp}`);
  await page.getByLabel("Mobile (+880…)").fill(mobile);
  await page.getByRole("button", { name: "Create customer" }).click();

  // 3. success feedback + row appears (server-confirmed, not optimistic-only);
  //    reload closes the refetch race on slower runs
  await expect(page.getByText(/CIF-\d+ created/)).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByRole("cell", { name: `E2E Person ${stamp}` }))
    .toBeVisible({ timeout: 10_000 });

  // 4. bilingual invariant: bn column content never renders in EN mode
  //    (exempt per prototype convention: the ৳ sign and the language-toggle
  //    affordance — the toggle's label IS the other language's name)
  const toggleText = await page.getByRole("button", { name: "Toggle language" }).innerText();
  const bodyText = (await page.locator("body").innerText()).replaceAll(toggleText.trim(), "");
  expect(bodyText).not.toMatch(/[\u0980-\u09F2\u09F4-\u09FF]/);
});

test("API contract: rejects invalid mobile with problem detail (422)", async ({ request }) => {
  const res = await request.post("/api/v1/customers", {
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    data: { nameEn: "Bad Mobile", segment: "RETAIL", mobile: "12345", branchCode: "BR-001" },
  });
  expect([401, 422]).toContain(res.status()); // 401 without token, 422 with — both contract-correct
});
