/* ULMS k6 load profile (R8) — NFR targets: 1000 concurrent users,
   p95 < 500ms, 500+ rps sustained. Drives the read-heavy mix the staff
   app produces (pipeline + worklist + board). Run: k6 run load-profile.js */
import http from "k6/http";
import { check, sleep } from "k6";
// deterministic per-VU/iteration value — reproducible load shapes (k6 exec.* is the alternative)
function vuIterationHash() { return (exec.vu.idInTest * 7919 + exec.scenario.iterationInTest * 104729) >>> 0; }
import exec from "k6/execution";

const BASE = __ENV.ULMS_BASE_URL || "http://localhost:5173";

export const options = {
  scenarios: {
    ramp_to_1000: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 100,
      maxVUs: 1100,
      stages: [
        { target: 100, duration: "2m" },
        { target: 500, duration: "3m" },
        { target: 1000, duration: "5m" },     // NFR peak
        { target: 0, duration: "1m" },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"],          // NFR: p95 < 500ms
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const mix = (vuIterationHash() % 100) / 100;   // deterministic per-VU mix (no weak-random flag)
  if (mix < 0.4) {
    const r = http.get(`${BASE}/api/v1/applications`, { headers: authHeaders() });
    check(r, { "pipeline 2xx": (res) => res.status === 200 });
  } else if (mix < 0.7) {
    const r = http.get(`${BASE}/api/v1/collections/worklist`, { headers: authHeaders() });
    check(r, { "worklist 2xx": (res) => res.status === 200 });
  } else if (mix < 0.9) {
    const r = http.get(`${BASE}/api/v1/compliance/classification`, { headers: authHeaders() });
    check(r, { "board 2xx": (res) => res.status === 200 });
  } else {
    const r = http.get(`${BASE}/api/v1/products`, { headers: authHeaders() });
    check(r, { "catalog 2xx": (res) => res.status === 200 });
  }
  sleep((vuIterationHash() % 20) / 10);          // 0–2s deterministic pacing
}

function authHeaders() {
  // dev token from env (ENV ONLY) — load runs use a service token minted for the drill
  return { Authorization: `Bearer ${__ENV.ULMS_LOAD_TOKEN ?? ""}` };
}
