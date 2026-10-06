import { defineConfig } from "vitest/config";
import path from "node:path";

// Borrower-app unit suite — domain logic (EMI parity, formatting) is pure TS
// (no React Native imports) so it runs in plain Node.
export default defineConfig({
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
