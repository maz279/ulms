import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ulmsMockApi } from "./scripts/mockApi/plugin";

// Vite 7 (PLANNING/07). Dev proxies /api and /oidc to the compose stack so the
// browser sees one origin — no CORS dance in development. When the Java stack
// is absent (local UI work / CI UI suites), VITE_USE_MOCK_API serves the same
// OpenAPI contract from the seeded in-memory DB (scripts/mockApi) — default
// ON here; set VITE_USE_MOCK_API=0 with the compose stack to proxy instead.
const useMockApi = process.env.VITE_USE_MOCK_API !== "0";
export default defineConfig({
  plugins: [react(), ulmsMockApi({ enabled: useMockApi })],
  server: {
    port: 5173,
    proxy: useMockApi ? {} : {
      "/api": { target: "http://localhost:8081", changeOrigin: true },
      "/hooks": { target: "http://localhost:8081", changeOrigin: true },   // rail callbacks (05 §7)
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          mui: ["@mui/material"],
        },
      },
    },
  },
});
