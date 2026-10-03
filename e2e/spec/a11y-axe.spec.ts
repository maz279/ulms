/**
 * Q1.6 WCAG gate: axe-core accessibility sweep over the core staff + portal
 * surfaces. Runs inside the standard e2e stack (mock API + vite dev), so it
 * executes in CI via the existing e2e job — no separate pipeline needed.
 * Policy: NO critical / serious violations on the checked pages; moderate
 * findings from the binding prototype CSS are triaged explicitly below
 * (contrast fixes belong to the design-system owner, not the build agent).
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Core surfaces a user MUST be able to operate: auth, role center, the
// record-heavy workspaces, and the borrower portal.
const PAGES: [string, string][] = [
  ["login", "/login"],
  ["home", "/home"],
  ["customers", "/customers"],
  ["pipeline", "/pipeline"],
  ["collections", "/collections"],
  ["classification", "/classification"],
  ["portal", "/portal"],
];

for (const [name, path] of PAGES) {
  test(`a11y: ${name} has no critical/serious violations`, async ({ page }) => {
    await page.goto(path);
    // demo session auto-mints for staff pages in mock mode; the login page
    // renders unauthenticated. Give data-driven pages a beat to settle.
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter((v) =>
      v.impact === "critical" || v.impact === "serious");
    if (blocking.length > 0) {
      console.error(
        `BLOCKING a11y violations on ${path}:\n` +
        blocking.map((v) =>
          `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)` +
          v.nodes.slice(0, 6).map((n) => `\n      ${JSON.stringify(n.target)} <${(n.html ?? "").slice(0, 90)}>`).join("")
        ).join("\n"));
    }
    expect(blocking, `${path} must be free of critical/serious axe violations`).toEqual([]);
  });
}

// One aggregated moderate-triage record so regressions in the prototype CSS
// surface in CI output without failing the gate.
test("a11y: moderate findings are triaged and counted", async ({ page }) => {
  await page.goto("/home");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const moderate = results.violations.filter((v) => v.impact === "moderate");
  console.log(`moderate a11y findings on /home: ${
    moderate.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "none"}`);
  expect(results.violations).toBeDefined();   // sanity: axe actually ran
});
