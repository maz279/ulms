/* ============================================================
   ULMS mock API — standalone listener for the API-leg e2e specs.
   The Playwright suites that talk to the Java service directly use
   baseURL http://localhost:8081 (packages/openapi server entry).
   When the Java stack is absent, this process answers on 8081 with
   the SAME routeMock the Vite middleware uses, so the API contracts
   (health, provision-calculator oracle, webhooks) stay exercisable.
   Run: npm run mock:api   (Node ≥ 23 type-stripping; no build step)
   ============================================================ */
import { createServer } from "node:http";
import { routeMock, readMockRequest, writeMockResponse } from "./plugin.ts";

const PORT = Number(process.env.MOCK_API_PORT ?? 8081);

const server = createServer(async (req, res) => {
  try {
    // /api/v1/…, /hooks/… and the root /actuator probe all pass through
    // as-is — routeMock normalizes the API prefix itself
    writeMockResponse(res, routeMock(await readMockRequest(req)));
  } catch (e: any) {
    writeMockResponse(res, { status: 500, body: { status: 500, code: "ULMS-MOCK-ERROR", detail: String(e?.message ?? e) } });
  }
});

server.listen(PORT, () => {
  console.log(`[ulms-mock-api] listening on http://localhost:${PORT} (OpenAPI contract, in-memory seed)`);
});
