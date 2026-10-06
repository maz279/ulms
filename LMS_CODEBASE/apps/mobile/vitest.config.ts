import { defineConfig } from "vitest/config";
import path from "node:path";

// Mobile unit suite — the sync engine + form validation are pure TS (no
// React Native imports) so they run in plain Node like the web suite.
export default defineConfig({
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
