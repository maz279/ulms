# ULMS Borrower — Working Prototype (100% interactive)

**Open `http://localhost:8791/prototype/`** (serve the parent folder with
`python -m http.server 8791`; the in-app browser blocks `file://`).

A fully clickable, in-browser prototype of the borrower mobile app — the same
six screens, tokens, Bangla-first copy, and flows as the React Native app in
`../../mobile_app/`, but **actually working**:

| Flow | What really happens |
|---|---|
| **OTP login** | Enter `+8801712345678` → *Send code* → the dev code appears (simulating SMS, like the dev stack) → verify → session persists in localStorage. Wrong code is rejected; unregistered mobile 404s. |
| **Home** | Live loan cards from the embedded DB (2 loans: current + 22-DPD); pay-now navigates to Pay. |
| **Apply** | Amount validated against the retail-personal bounds (৳50k–৳2L) — a real application row is created and appears in the tracker. |
| **Pay** | Rail chips (bKash/Nagad/BEFTN) → payment code required (OTP re-request) → *Confirm & pay* opens the simulated hosted checkout → on confirm the **outstanding drops, payment history gains a UTR row, and paying ≥EMI on the delinquent loan regularizes it (DPD 22 → 0)**. |
| **Statements** | Generates a real CSV from the payment history and downloads it (`statement-LN-300001.csv`). |
| **More** | বাংলা⇄English toggles the whole app live; the early-payoff calculator runs the **same formula as `mobile_app/src/domain/emi.ts`**; logout clears the session. |

## Architecture

- `index.html` — phone shell + the simulated rail-checkout overlay
- `styles.css` — the app's exact design tokens
- `app.js` — three layers, mirroring the real app:
  1. **Embedded `/portal` API simulation** with the same contract the RN app
     speaks (requestOtp/verifyOtp → otpToken, me/tracker/apply/payments/
     initiate/postPayment) — `{data}` envelopes, 401/404/422 on bad input;
  2. **Domain math** — `emiMonthly`/`payoffMonths` copied verbatim from the
     app's domain module (bank-oracle parity);
  3. **Screens** — the six views with live i18n.
- State (session, language, applications, payments, balances) persists in
  localStorage per browser. *reset demo data* on the login screen reseeds.
- Randomness for simulated codes/tokens/UTRs uses `crypto.getRandomValues`.

## Honest boundaries

This simulates the API **in-page** so it works standalone. The real RN app
calls the actual `/api/v1/portal/*` backend (mock in dev, Java+Keycloak in
production, with the documented borrower-role flip). The rail checkout here is
a visual stand-in for the rail's hosted page; in production the bank webhook
posts the payment (the `postPayment` step).
