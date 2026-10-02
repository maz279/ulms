import { test, expect } from "@playwright/test";

/**
 * i18n separation (PLANNING/09 §2 #8, prototype invariant): EN mode renders
 * ZERO Bengali glyphs anywhere in the app chrome (the ৳ sign and the
 * language-toggle affordance itself are the sanctioned exceptions); BN mode
 * spot-asserts the sourced chrome strings render Bengali. One language per
 * element — mixing on one element is a defect.
 */

const BENGALI = /[\u0980-\u09FF]/;
const TAKR = /৳/;

test("i18n: EN mode — zero Bengali glyphs outside ৳ and the toggle", async ({ page }) => {
  await page.goto("/customers");
  await page.getByRole("button", { name: "Toggle language" }).click();   // → BN
  await expect(page.getByRole("tab", { name: "গ্রাহক" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Toggle language" }).click();   // → EN
  await expect(page.getByRole("tab", { name: "Customers" })).toBeVisible();

  // EN sweep across the staff chrome pages: no Bengali anywhere except the
  // toggle button label and the ৳ currency sign
  for (const path of ["/customers", "/apply", "/pipeline", "/collections",
                      "/compliance/board", "/compliance/regcon", "/compliance/reports"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const offending = await page.evaluate(() => {
      const toggle = document.querySelector('button[aria-label="Toggle language"]');
      const offenders: string[] = [];
      const walk = (el: Element) => {
        for (const child of Array.from(el.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent ?? "";
            if (/[\u0980-\u09FF]/.test(text) && !/৳/.test(text.replace(/[\u0980-\u09FF]/g, ""))) {
              offenders.push(text.trim().slice(0, 40));
            }
          } else if (child.nodeType === Node.ELEMENT_NODE
            && child !== toggle && !(child as Element).contains?.(toggle)) {
            walk(child as Element);
          }
        }
      };
      walk(document.body);
      return offenders;
    });
    expect(offending, `${path} must render zero Bengali in EN mode`).toEqual([]);

    // the toggle affordance itself MAY carry Bengali (the prototype's exemption)
    const toggleText = await page.getByRole("button", { name: "Toggle language" }).innerText();
    expect(BENGALI.test(toggleText) || toggleText === "EN").toBeTruthy();
  }
});

test("i18n: BN mode — sourced chrome strings render Bengali (spot-asserts)", async ({ page }) => {
  await page.goto("/customers");
  await page.getByRole("button", { name: "Toggle language" }).click();   // → BN
  await expect(page.getByRole("tab", { name: "গ্রাহক" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("tab", { name: "প্রয়োগ" })).toBeVisible();

  // compliance sub-nav + page titles carry sourced Bengali
  await page.goto("/compliance/regcon");
  await expect(page.getByRole("link", { name: "রেগুলেটরি কনসোল" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("link", { name: "রিপোর্ট সেন্টার" })).toBeVisible();
  // the language persists across navigation (localStorage-backed)
  await page.goto("/customers");
  await expect(page.getByRole("tab", { name: "গ্রাহক" })).toBeVisible({ timeout: 10_000 });

  // restore EN for the suites that follow
  await page.getByRole("button", { name: "Toggle language" }).click();
  await expect(page.getByRole("tab", { name: "Customers" })).toBeVisible();
});
