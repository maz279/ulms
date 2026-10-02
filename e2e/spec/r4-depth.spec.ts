import { test, expect } from "@playwright/test";

/**
 * R4 (audit/plan/phases/R4) — write-off/recovery, guarantors, notifications,
 * AML/STR. Mock-stack journeys.
 */

const login = async (page: import("@playwright/test").Page, persona = "allda") => {
  await page.goto("/login");
  await page.locator(`button[data-persona="${persona}"]`).click();
  await page.waitForURL("**/home");
};

test("R4: write-off — SS loan → propose → approve (GL+CIB) → reverse w/ recovery", async ({ page }) => {
  await login(page, "compliance");
  await page.goto("/writeoffs");
  await expect(page.getByText("Write-off & Recovery")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("wo-loan").fill("LN-300005");   // SS seed loan
  await page.getByRole("button", { name: "Propose" }).click();
  await expect(page.getByText(/Proposed LN-300005 — (EXEC_COMMITTEE|BOARD) band/)).toBeVisible({ timeout: 5_000 });
  // compliance persona lacks disbursement-write → approve gated? COLLECTIONS_WRITE includes compliance ✓
  const row = page.locator("tr", { hasText: "LN-300005" });
  await row.locator('button[title="Approve (GL JV + CIB flag)"]').click();
  await expect(page.getByText("Write-off executed — GL JV posted, CIB flagged")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("tr", { hasText: "LN-300005" }).locator(".chip-ok").first()).toBeVisible();
  // reverse + recovery
  await page.locator("tr", { hasText: "LN-300005" }).locator('button[title="Reverse (recovery received)"]').click();
  await expect(page.getByText("Reversed + recovery recorded (10% receipt demo)")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("tr", { hasText: "LN-300005" }).getByText("REVERSED").first()).toBeVisible();
});

test("R4: write-off guard — STD loan is rejected with a problem contract", async ({ page }) => {
  await login(page, "compliance");
  await page.goto("/writeoffs");
  await page.getByTestId("wo-loan").fill("LN-300001");   // STD-0 seed
  await page.getByRole("button", { name: "Propose" }).click();
  await expect(page.getByText(/requires SS\/DF\/B-L classification/)).toBeVisible({ timeout: 5_000 });
});

test("R4: guarantors — registry lists seed; attach runs CIB check", async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const h = { "Content-Type": "application/json", "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "admin" };
    const list = await (await fetch("/api/v1/customers/CIF-100875/guarantors", { headers: h })).json();
    const added = await (await fetch("/api/v1/customers/CIF-100875/guarantors", {
      method: "POST", headers: h,
      body: JSON.stringify({ name: "Test Guarantor", mobile: "+8801799887766", linkedAmountMinor: 5000000 }),
    })).json();
    return { seeded: list.data.length, added };
  });
  expect(res.seeded).toBeGreaterThanOrEqual(1);
  expect(res.added.cibScore).toBeGreaterThanOrEqual(650);
  expect(["CLEAR", "REFER"]).toContain(res.added.cibStatus);
});

test("R4: notifications — templates listed; send renders a delivery; lifecycle fan-out via outbox", async ({ page }) => {
  await login(page);
  await page.goto("/notifications-admin");
  await expect(page.getByText("Notifications", { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("td", { hasText: "APPLICATION_SUBMITTED" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Send test (EMI_REMINDER)" }).click();
  await expect(page.getByText(/Delivered → \+880/)).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".doc-row", { hasText: "EMI_REMINDER" }).first()).toBeVisible({ timeout: 5_000 });
});

test("R4: AML — posture shows CDD level; STR filing with BFIU ref (validation enforced)", async ({ page }) => {
  await login(page, "compliance");
  const posture = await page.evaluate(async () => {
    const h = { "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "compliance" };
    return (await (await fetch("/api/v1/customers/CIF-100871/aml", { headers: h })).json());
  });
  expect(["CDD", "EDD"]).toContain(posture.cddLevel);

  const short = await page.evaluate(async () => {
    const h = { "Content-Type": "application/json", "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "compliance" };
    const res = await fetch("/api/v1/customers/CIF-100871/str", { method: "POST", headers: h, body: JSON.stringify({ reason: "short" }) });
    return res.status;
  });
  expect(short).toBe(422);

  const filed = await page.evaluate(async () => {
    const h = { "Content-Type": "application/json", "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "compliance" };
    const res = await fetch("/api/v1/customers/CIF-100871/str", {
      method: "POST", headers: h,
      body: JSON.stringify({ reason: "structuring pattern across three branch deposits within 48h", amountMinor: 12000000 }),
    });
    return res.json();
  });
  expect(filed.bfiuRef).toMatch(/^BFIU-/);
  const after = await page.evaluate(async () => {
    const h = { "X-ULMS-Actor": "e2e", "X-ULMS-Roles": "compliance" };
    return (await (await fetch("/api/v1/customers/CIF-100871/aml", { headers: h })).json());
  });
  expect(after.strs.length).toBeGreaterThanOrEqual(1);
});
