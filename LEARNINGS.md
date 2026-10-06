# ULMS v2.0 Operational Learnings & Conventions (Fable 5.1 Standard)
**System:** Unisoft Loan Management System · ABC Bank Bangladesh  
**Machine:** Windows 11 · PowerShell 5.1  

---

## 1. Environment & Toolchain Conventions

* **PowerShell ExecutionPolicy:** On this Windows machine, `.ps1` execution is restricted by security policy. Never invoke `npm` or `npx` directly in PowerShell as it will resolve to `npm.ps1`.
  * **Rule:** Always use `npm.cmd` and `npx.cmd`.
* **Host Runtimes:**
  * Node.js: `v24.19.0` (Active)
  * npm: `11.17.0` (Active via `npm.cmd`)
  * Python: `3.14.7` (Active for zero-dependency HTTP serving)
  * Java 21 / Docker: Not yet installed on this workstation. To launch the Spring Boot backend (`LMS_CODEBASE/apps/api`) and the database compose stack (`LMS_CODEBASE/deploy/compose`), OpenJDK 21 and Docker Desktop must be installed.
* **Browser Automation / DevTools:**
  * The local Chrome profile does not run with `--remote-debugging-port` active by default.
  * Internal testing utilizes the Node headless DOM harness (`Front_end/_tools/route_test.js`) and link crawler (`Front_end/_tools/link_audit.js`), ensuring 100% test pass rates without external browser socket dependencies.

---

## 2. Frontend Topography & Navigation

* **Dynamics 365 Shell (`Front_end`):**
  * Fully self-contained, zero external network calls, zero build steps.
  * Served via Python HTTP server on **Port 8080**.
  * Primary navigation endpoints:
    * Landing & Persona Picker: `http://localhost:8080/index.html`
    * Application Shell: `http://localhost:8080/app.html#/home`
    * Origination Pipeline: `http://localhost:8080/app.html#/pipeline`
    * Credit Approvals Ladder: `http://localhost:8080/app.html#/approvals`
    * Bangladesh Bank CIB Viewer: `http://localhost:8080/app.html#/cib/CIF-100875`
    * BRPD 15/2024 Classification Board: `http://localhost:8080/app.html#/compliance/board`
    * Collections & Recovery Console: `http://localhost:8080/app.html#/collections`
    * Borrower Self-Service Portal: `http://localhost:8080/portals.html`
    * Field Officer / CPV Mobile App: `http://localhost:8080/mobile.html`
    * Automated Route Selftest: `http://localhost:8080/_selftest.html`
* **React 19 Staff App (`LMS_CODEBASE/apps/web`):**
  * Production bundle built successfully with Vite 7 (`tsc -b && vite build`).
  * Served via Vite preview on **Port 5173**.
  * Base URL: `http://localhost:5173/`

---

## 3. Testing & Verification Baselines

* `route_test.js`: Validated 405/405 routes (0 failures).
* `link_audit.js`: Audited 1,327 distinct hash links (0 broken).
* React bundle build: 1,059 modules transformed, zero typecheck errors (`tsc -b && vite build` green).

---

## 4. Frontend & Dev Server Operational Patterns

* **Encoding & AST Preservation:**
  * When translating large JavaScript objects (like `nav_data.js`, 535 lines) to TypeScript, never use PowerShell stream operators (`>`) as they default to UTF-16LE with BOM on Windows PowerShell 5.1.
  * Always use a dedicated Node.js script (`fs.writeFileSync(..., 'utf8')`) to preserve multi-byte UTF-8 Bengali characters and avoid unexpected end-of-file compilation errors in esbuild.
* **Port Conflict & Zombie Processes:**
  * If a Vite dev server is restarted while another process holds port 5173, Vite silently increments to port 5174. Always inspect active listening sockets (`Get-NetTCPConnection`) and terminate stale Node processes before starting the primary server.
* **Detached Frontend Execution:**
  * When executing on host environments without Docker or active database services, intercepting `window.fetch` at the root of `main.tsx` enables end-to-end UI navigation, form creation, and UX testing without network error cascades.

