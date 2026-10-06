import { test, expect } from "@playwright/test";

/**
 * R2 Security Activation (audit/plan/phases/R2) — login → role-gated
 * journeys in mock mode. The dev persona picker drives the same gating
 * logic the Keycloak session drives (realm_access.roles → UI gates); the
 * mock API echoes the session via /auth/me for server-side assertions.
 */

const officer = async (page: import("@playwright/test").Page, persona: string) => {
  await page.goto("/login");
  await page.locator(`button[data-persona="${persona}"]`).click();
  await page.waitForURL("**/home");
};

test("R2: open mode auto-session is staff-wide and labelled DEV", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByTestId("dev-banner")).toHaveText("DEV");
  await expect(page.getByTestId("officer-chip")).toContainText("r.islam");
  // all 8 areas visible for the all-roles dev persona
  const areas = ["Customer & Onboarding", "Loan Origination", "Credit Assessment",
    "Approval & Disbursement", "Servicing & Payments", "Monitoring & Collections",
    "Insight & Compliance", "Platform & Admin"];
  const buttons = page.locator(".usl-nav").getByRole("button", { name: /▮/ });
  await expect(buttons).toHaveCount(areas.length, { timeout: 10_000 });
  for (const a of areas) {
    await expect(page.locator(".usl-nav").getByRole("button", { name: new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  }
});

test("R2: branch officer — Platform/Insight/Collections areas hidden, settings link hidden", async ({ page }) => {
  await officer(page, "officer");
  const nav = page.locator(".usl-nav");
  await expect(nav.getByRole("button", { name: /Platform & Admin/ })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: /Insight & Compliance/ })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: /Monitoring & Collections/ })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "⚙ Settings" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "🏛 Bangladesh Bank Returns — Regulatory Console" })).toHaveCount(0);
  // staff areas remain
  await expect(nav.getByRole("button", { name: /Customer & Onboarding/ })).toBeVisible();
});

test("R2: approvals affordance — L1 officer cannot act on an L2+ task; manager can", async ({ page }) => {
  await officer(page, "officer");
  await page.goto("/approvals");
  // seeded inbox carries ladder-2+ tasks (9Cr/45Cr drafts)
  const locked = page.getByTestId("insufficient-role").first();
  await expect(locked).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("tr span.rowActs button[title='Approve']")).toHaveCount(0);

  await officer(page, "manager");
  await page.goto("/approvals");
  const approveBtn = page.locator("tr span.rowActs button[title='Approve']").first();
  await expect(approveBtn).toBeVisible({ timeout: 10_000 });
  // L2 manager locks out on anything above its rung
  await expect(page.getByTestId("insufficient-role").first()).toBeVisible();
});

test("R2: collections persona sees F area + workbench write; compliance sees regcon", async ({ page }) => {
  await officer(page, "collections");
  const nav = page.locator(".usl-nav");
  await expect(nav.getByRole("button", { name: /Monitoring & Collections/ })).toBeVisible();
  await expect(nav.getByRole("button", { name: /Credit Assessment/ })).toHaveCount(0);

  await officer(page, "compliance");
  await expect(page.locator(".usl-nav").getByRole("link", { name: /Regulatory console/i })).toBeVisible();
  // settings is admin-only — compliance correctly does NOT see it
  await expect(page.locator(".usl-nav").getByRole("link", { name: /Settings/ })).toHaveCount(0);
  await officer(page, "admin");
  await expect(page.locator(".usl-nav").getByRole("link", { name: /Settings/ })).toBeVisible();
});

test("R2: session echo + audit events land in the mock API", async ({ page }) => {
  await officer(page, "compliance");
  const me = await page.evaluate(async () => {
    const res = await fetch("/api/v1/auth/me", { headers: { "X-ULMS-Actor": "k.chowdhury", "X-ULMS-Roles": "compliance" } });
    return res.json();
  });
  expect(me.officer).toBe("k.chowdhury");
  expect(me.roles).toContain("compliance");
  expect(me.staff).toBe(true);
});

test("R2: logout lands on the persona login screen; portal stays public", async ({ page }) => {
  await officer(page, "analyst");
  await page.locator('button[aria-label="Officer session"]').click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("Mock stack (no Keycloak)")).toBeVisible({ timeout: 5_000 });

  // logout STICKS across reloads (R2e fix): deep links to staff routes
  // bounce off the StaffGate back to /login instead of re-minting a session
  await page.goto("/approvals");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Mock stack (no Keycloak)")).toBeVisible({ timeout: 5_000 });

  // borrower portal is not behind the staff gate
  await page.goto("/portal");
  await expect(page.getByText("ULMS Borrower Portal")).toBeVisible({ timeout: 10_000 });
});
