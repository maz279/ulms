# ULMS Mobile UX / Front-End Previews

**Open `index.html`** for the landing page linking all four galleries (or serve
this folder with `python -m http.server 8791` — the in-app browser blocks
`file://`). English and বাংলা versions are separate files:

| File | App | Language |
|---|---|---|
| `borrower-english.html` / `borrower-bangla.html` | Borrower app (6 screens) | English / বাংলা (Bangla-first, as shipped) |
| `field-english.html` / `field-bangla.html` | Field app (8 screens) | English / বাংলা (Bangla-first, as shipped) |

**`prototype/`** — the fully working interactive prototype of the borrower app
(embedded /portal API sim, real flows, CSV download, live language toggle) —
see `prototype/README.md`.

**Fidelity rule for the language split:** every `strings.ts`-managed label
switches language exactly as the in-app বাংলা⇄English toggle does. Copy that
is hardcoded English in the React Native source (e.g. "Sign in with bank
account", "Sync now", "Enter PIN", the security fine-prints) stays English in
BOTH gallery versions — that is precisely what the shipped apps display.

## Field app screens (8) (double-click, or the already-open
in-app browser tab). Six phone frames render the borrower app's screens
**exactly as built** in `../mobile_app/` (Expo 54 · React Native · TypeScript)
— this folder is a visual reference of the implemented design, not a new
design.

## What you are looking at

| # | Screen | Implements (source file) |
|---|---|---|
| 1 | লগইন — OTP | `src/screens/LoginScreen.tsx` — mobile → SMS code, passwordless (BB MFS norm); dev stack auto-fills the code |
| 2 | হোম — হিসাবের কার্ড | `src/screens/HomeScreen.tsx` — outstanding / EMI / next due / DPD per loan, pay-now shortcut |
| 3 | আবেদন | `src/screens/TrackerScreen.tsx` — BPF stage tracker + in-app apply (retail-personal bounds) |
| 4 | পরিশোধ | `src/screens/PayScreen.tsx` — bKash/Nagad/BEFTN chips, OTP-confirmed initiate, rail redirect, payment history |
| 5 | স্টেটমেন্ট | `src/screens/StatementsScreen.tsx` — per-loan CSV download |
| 6 | আরও | `src/screens/MoreScreen.tsx` — বাংলা⇄English, early-payoff calculator, help line, sign out |

## Fidelity notes

- **Design tokens are the app's own**: primary `#3F51B5`, deep indigo
  `#1E2660`, canvas `#F7F8FC`, card line `#E1E5F2`, success `#107C10`,
  error `#C50F1F`, logo accent `#F0C441` — extracted from the RN
  `StyleSheet.create` blocks, and in the same indigo family as the validated
  `Front_end/` prototype tokens (`#0D1233`/`#E9ECF8`).
- **Bangla-first copy** is the app's `src/i18n/strings.ts` verbatim
  (English is the in-app toggle).
- **Demo data mirrors the live mock stack**: LN-300001 · retail-home ·
  outstanding ৳24,80,000 · EMI ৳88,958 · next due 2026-10-05 · DPD 0 (the
  second card LN-300002 shows the 22-DPD delinquent state); tracker rows
  APP-8126 (SUBMITTED) and APP-G2-11 (SANCTION); payment history with
  bKash/Nagad UTRs.
- The bottom tab bar mirrors the React Navigation tabs in `App.tsx`.
- Proportions are phone-like (300×620 frames); spacing/radius values follow
  the RN styles (8–12px paddings, 8–12px radii, cards on `#F7F8FC`).

## If the design needs changes

Edit the corresponding screen in `../mobile_app/src/screens/…` (the RN code
is the source of truth), then update this preview to match — or tell the
agent what to change and both will be updated together.
