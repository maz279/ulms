import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./spec",
  timeout: 30_000,
  retries: 1,
  // suite determinism (audit R1): reset the mock DBs before workers start
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
  },
  // LOCAL constraint: the Playwright CDN download is blocked on this network —
  // drive the system Edge channel instead (CI keeps downloaded chromium).
  projects: [{ name: "chromium", use: { browserName: "chromium", channel: "msedge" } }],
});
