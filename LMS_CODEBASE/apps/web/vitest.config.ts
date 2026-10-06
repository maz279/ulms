import { defineConfig } from "vitest/config";
import path from "node:path";

// ULMS unit suite config (audit R1). Node environment — the suite tests pure
// domain helpers (money, oracles, classification parity, search, routing).
export default defineConfig({
  resolve: {
    extensions: [".ts", ".tsx", ".mts", ".js", ".mjs", ".json"],
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environmentMatchGlobs: [["tests/unit/errorBoundary.test.tsx", "jsdom"]],
    environment: "node",
  },
});
