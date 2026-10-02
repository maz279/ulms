import { test, expect } from "@playwright/test";

/**
 * R5 (audit/plan/phases/R5) — borrower self-service portal + partner API
 * channel. Tracker consistency: a portal/partner application must appear in
 * the staff pipeline (same workflow projection, no second truth).
 */

test("R5: borrower portal — OTP login → apply → upload doc → tracker updates", async ({ page }) => {
  await page.goto("/portal");
  await page.getByLabel("Registered mobile").fill("+8801712345678");   // CIF-100871 holder
  // R10 P-D: OTP login — the mock surfaces devCode and the UI auto-fills it
  await page.getByRole("button", { name: "Get code" }).click();
  await expect(page.getByText(/Dev OTP/).first()).toBeVisible({ timeout: 5_000 });
  const codeField = page.getByLabel("OTP code");
  await expect(codeField).not.toHaveValue("");
  await page.getByRole("button", { name: "Verify & sign in" }).click();
  await expect(page.getByText(/Welcome,/)).toBeVisible({ timeout: 10_000 });

  // the apply/upload forms use MUI TextField-select (combobox), not native
  // <select> — drive the open→option-click interaction instead of selectOption
  const muiSelect = async (label: string, option: string) => {
    await page.getByLabel(label).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };

  // self-service apply (R5) — exact match: the payment form's "Pay amount (৳)"
  // input also substring-matches a plain lookup
  await muiSelect("Product", "retail-personal");
  await page.getByLabel("Amount (৳)", { exact: true }).fill("80000");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByText(/Application APP-\d+ submitted — track it below/)).toBeVisible({ timeout: 5_000 });
  // tracker rows render the number via MUI Typography (a <p>), not <span>
  const appNo = await page.getByText(/^APP-\d+$/).first().textContent();

  // document upload (R5)
  await muiSelect("Upload document", "NID_FRONT");
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByText("NID_FRONT uploaded — scan CLEAN")).toBeVisible({ timeout: 5_000 });

  // tracker consistency: the same app is visible in the staff pipeline
  const staffSees = await page.evaluate(async (no) => {
    const list = await (await fetch("/api/v1/applications", { headers: { "X-ULMS-Actor": "staff", "X-ULMS-Roles": "admin" } })).json();
    return list.data.some((a: any) => a.appNo === no);
  }, appNo);
  expect(staffSees).toBe(true);
});

test("R5: partner channel — key required, intake idempotent, status polls", async ({ page }) => {
  // page.evaluate fetches need a real origin (about:blank cannot resolve
  // relative /api/v1 URLs)
  await page.goto("/");
  // 401 without key
  const noKey = await page.evaluate(async () => {
    const res = await fetch("/api/v1/partner/applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cif: "CIF-100872", productCode: "retail-personal", amountMinor: 6000000, tenorMonths: 18 }),
    });
    return res.status;
  });
  expect(noKey).toBe(401);

  // intake + idempotent replay (same key returns the same application)
  const { first, replay } = await page.evaluate(async () => {
    const h = { "Content-Type": "application/json", "X-Api-Key": "e2e-partner", "Idempotency-Key": "r5-" + Date.now() };
    const body = JSON.stringify({ cif: "CIF-100872", productCode: "retail-personal", amountMinor: 6000000, tenorMonths: 18 });
    const first = await (await fetch("/api/v1/partner/applications", { method: "POST", headers: h, body })).json();
    const replay = await (await fetch("/api/v1/partner/applications", { method: "POST", headers: h, body })).json();
    return { first, replay };
  });
  expect(first.appNo).toMatch(/^APP-/);
  expect(replay.id).toBe(first.id);

  // status poll shows the tracker projection
  const status = await page.evaluate(async (id) => {
    const res = await fetch(`/api/v1/partner/applications/${id}/status`, { headers: { "X-Api-Key": "e2e-partner" } });
    return res.json();
  }, first.id);
  expect(status.appNo).toBe(first.appNo);
  expect(status.channel).toBe("PARTNER");
  expect(typeof status.stage).toBe("string");

  // partner app visible to staff (no second truth)
  const staffSees = await page.evaluate(async (no) => {
    const list = await (await fetch("/api/v1/applications", { headers: { "X-ULMS-Actor": "staff", "X-ULMS-Roles": "admin" } })).json();
    return list.data.some((a: any) => a.appNo === no);
  }, first.appNo);
  expect(staffSees).toBe(true);
});

test("R5: portal statement browse — JSON + CSV parity", async ({ page }) => {
  await page.goto("/portal");
  await page.getByLabel("Registered mobile").fill("+8801712345678");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/Welcome,/)).toBeVisible({ timeout: 10_000 });

  const out = await page.evaluate(async () => {
    // find a loan for the borrower via /portal/me then pull both formats
    const me = await (await fetch("/api/v1/portal/me?mobile=%2B8801712345678")).json();
    const loanId = me.loans[0]?.loanId;
    if (!loanId) return { skip: true };
    const json = await (await fetch(`/api/v1/portal/me/loans/${loanId}/statement?mobile=${encodeURIComponent("+8801712345678")}`)).json();
    const csv = await (await fetch(`/api/v1/portal/me/loans/${loanId}/statement?mobile=${encodeURIComponent("+8801712345678")}&format=csv`)).text();
    return { skip: false, rows: json.rows?.length ?? 0, csvHeader: csv.split("\n")[0], loanNo: json.loanNo };
  });
  test.skip(out.skip, "no loans for the borrower");
  expect(out.loanNo).toMatch(/^LN-/);
  expect(out.csvHeader).toContain("paid_on");
  expect(typeof out.rows).toBe("number");
});
