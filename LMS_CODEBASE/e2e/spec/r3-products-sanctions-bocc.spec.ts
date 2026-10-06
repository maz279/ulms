import { test, expect } from "@playwright/test";

/**
 * R3 (audit/plan/phases/R3) — product engine, sanction letters, BOCC,
 * transactional outbox. Mock-stack journeys against the live pages.
 */

const login = async (page: import("@playwright/test").Page, persona = "allda") => {
  await page.goto("/login");
  await page.locator(`button[data-persona="${persona}"]`).click();
  await page.waitForURL("**/home");
};

test("R3: product catalog — seeded bilingual rows + eligibility oracle", async ({ page }) => {
  await login(page);
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: /Product Catalog/ })).toBeVisible({ timeout: 10_000 });
  // seeded catalog rows render (bilingual name in sub-line)
  await expect(page.locator("td", { hasText: "sme-term" }).first()).toBeVisible();
  await expect(page.locator("td", { hasText: "ক্ষুদ্র ঋণ" }).first()).toBeVisible();
  // eligibility from the row action → verdict card appears
  await page.locator('tr span.rowActs button[title="Eligibility check"]').first().click();
  await expect(page.getByText(/Eligibility — sme-term/)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/EMI ৳/)).toBeVisible();
});

test("R3: product admin — draft → activate → appears ACTIVE (admin persona)", async ({ page }) => {
  await login(page, "admin");
  await page.goto("/products");
  const stamp = Date.now() % 10000;
  await page.getByTestId("product-code").fill(`test-${stamp}`);
  await page.getByTestId("product-nameEn").fill(`E2E Product ${stamp}`);
  await page.getByTestId("product-min").fill("5");
  await page.getByTestId("product-max").fill("50");
  await page.getByTestId("product-rate").fill("1150");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText(`Draft test-${stamp} created`)).toBeVisible({ timeout: 5_000 });
  // activate from the row action
  const row = page.locator("tr", { hasText: `test-${stamp}` });
  await row.locator('button[title="Activate"]').click();
  await expect(page.getByText(`test-${stamp} v1 activated`)).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("tr", { hasText: `test-${stamp}` }).locator(".chip-ok").first()).toBeVisible();
});

test("R3: sanction letter — generate on SANCTION app → tokenized acceptance", async ({ page }) => {
  await login(page);
  // drive an app to SANCTION via the API (UI journey is covered by p1 spec)
  const app = await page.evaluate(async () => {
    const h = { "Content-Type": "application/json", "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "admin" };
    const list = await (await fetch("/api/v1/applications", { headers: h })).json();
    const at = list.data.find((a: any) => a.stage === "SANCTION") ?? null;
    if (at) return at;
    // walk one: pick a CPV app and push through
    const cpv = list.data.find((a: any) => a.stage === "CPV");
    if (!cpv) return null;
    await fetch(`/api/v1/applications/${cpv.id}/cpv`, { method: "POST", headers: h, body: JSON.stringify({ passed: true, notes: "r3" }) });
    const l2 = await (await fetch("/api/v1/applications", { headers: h })).json();
    return l2.data.find((a: any) => a.stage === "APPROVAL") ?? null;
  });
  test.skip(!app, "no SANCTION-stage app in seed");
  // ladder-walk to SANCTION via approvals act (admin role)
  await page.evaluate(async (appId) => {
    const h = { "Content-Type": "application/json", "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "admin" };
    for (let i = 0; i < 8; i++) {
      const t = await (await fetch(`/api/v1/approvals/current/${appId}`, { headers: h })).json();
      if (!t.taskId) break;
      const res = await fetch(`/api/v1/approvals/${t.taskId}/act`, {
        method: "POST", headers: h, body: JSON.stringify({ action: "APPROVE", actor: "e2e" }),
      });
      if (!res.ok) break;
    }
  }, app.id);

  await page.goto("/sanctions");
  await expect(page.getByText("Sanction Letters")).toBeVisible({ timeout: 10_000 });
  const genBtn = page.getByRole("button", { name: "Generate letter" }).first();
  await expect(genBtn).toBeVisible({ timeout: 10_000 });
  await genBtn.click();
  await expect(page.getByText(/Letter issued for APP-/)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId("sanction-body-en").first()).toContainText("SANCTION LETTER");
  // tokenized acceptance (the portal-side action)
  await page.getByRole("button", { name: "Simulate customer acceptance" }).first().click();
  await expect(page.getByText("Acceptance recorded — signed via tokenized link")).toBeVisible({ timeout: 5_000 });
});

test("R3: BOCC — schedule → check-in quorum → vote → close → auto-minutes", async ({ page }) => {
  await login(page);
  await page.goto("/bocc");
  await expect(page.getByText("BOCC Console")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("bocc-branch").fill("BR-001");
  await page.getByTestId("bocc-members").fill("bm-1, bm-2, bm-3");
  await page.getByRole("button", { name: "Schedule + build agenda" }).click();
  await expect(page.getByText(/Sitting scheduled — \d+ cases listed/)).toBeVisible({ timeout: 5_000 });
  // quorum = 2 for 3 members
  const checkins = page.getByRole("button", { name: "Check in" });
  await checkins.nth(0).click();
  await expect(page.getByText("bm-1 signed in")).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Check in" }).first().click();
  await expect(page.getByText("bm-2 signed in")).toBeVisible({ timeout: 5_000 });
  // close without votes → HOLD resolutions allowed; minutes must appear
  await page.getByRole("button", { name: /Close sitting/ }).click();
  await expect(page.getByText("Sitting closed — minutes drafted, resolutions routed")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId("bocc-minutes").first()).toContainText("BOCC minutes");
});

test("R3: outbox — lifecycle events accumulate; relay fans out notifications", async ({ page }) => {
  await login(page, "admin");
  // generate an outbox event through the API (payment posted)
  await page.evaluate(async () => {
    await fetch("/api/v1/__test/reset", { method: "POST" });
    const h = { "Content-Type": "application/json", "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "admin" };
    await fetch("/api/v1/loans/l-2/payments", { method: "POST", headers: h, body: JSON.stringify({ amountMinor: 500000, externalRef: "OUTBOX-E2E-1", rail: "COUNTER" }) });
  });
  await page.goto("/outbox");
  await expect(page.getByText("Transactional Outbox")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("td", { hasText: "PAYMENT_POSTED" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Relay now" }).click();
  await expect(page.getByText(/Relayed \d+ events → \d+ notifications/)).toBeVisible({ timeout: 5_000 });
  // deliveries page shows the rendered notification
  await page.goto("/notifications-admin");
  await expect(page.locator(".doc-row", { hasText: "PAYMENT_POSTED" }).first()).toBeVisible({ timeout: 10_000 });
});
