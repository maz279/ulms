# ULMS Borrower — Native Mobile App (Android + iOS)

Borrower-facing native app for ABC Bank's ULMS platform. One codebase → both
platforms (Expo 54 / React Native 0.81 / TypeScript), matching the binding
stack (Technology_Stack_Recommendation_v3.md: "Expo 54+") and the field-officer
app's toolchain, so the 3-dev team maintains a single mobile skillset.

**Location note:** this app lives outside the `LMS_CODEBASE` monorepo per the
project owner's explicit instruction (`C:\...\LMS\mobile_app`). Everything is
self-contained; if it should later join the monorepo, move the folder to
`LMS_CODEBASE/apps/borrower` unchanged.

---

## Why this app, and why these features

Requirements basis: PLANNING/08 Part B (borrower self-service), URD §8/§13,
the validated portal prototype (`Front_end/portals.html`), plus 2026 industry
practice for digital-lending borrower apps:

| Feature (in this app) | Source |
|---|---|
| OTP-only login (mobile + SMS code, no passwords) | BB MFS norm; frictionless onboarding is the #1 conversion practice |
| Home dashboard: outstanding, EMI, next due, DPD status | PLANNING/08 B1; standard EMI-tracker pattern |
| In-app application + stage tracker | URD self-service apply; 2026 "apply and track in-app" standard |
| Payments via bKash/Nagad/BEFTN **redirect** + OTP confirmation | BB MFS rules — no card/wallet credentials on device; PLANNING/08 B2 |
| Statement (CSV) download per loan | URD §"statements & tax certificates download" |
| Early-payoff calculator (months + interest saved) | 2026 borrower-engagement standard feature |
| Bangla-first bilingual (বাংলা default, English toggle) | 07 §6 language rules; Bangladesh market reality |
| Help & branch line, sign out | Baseline support affordance |

Deliberately OUT of scope here (documented decisions): card-data entry
(BB MFS redirect model), staff functions (that's the staff web app), offline
evidence capture (that's the field-officer app).

## Security posture

- **URL discipline (Mimosa-reviewed):** every request is built by
  `buildUrl()` from a validated, env-pinned base — http(s) only, plain http
  permitted only for the local demo stack, fixed route constants, every
  query value `encodeURIComponent`-ed. Rail checkout URLs (server-provided)
  must be `https:` before `Linking.openURL`.
- **No credentials in source:** API base and any secrets come from env only
  (`EXPO_PUBLIC_API_BASE`). OTP tokens live in app storage, never in code.
- **Payments:** OTP-confirmed initiation; posting happens on the bank's
  webhook (idempotent) — the app only opens the rail's hosted checkout.
- Platform hardening (biometric unlock, certificate pinning, Play Integrity /
  App Attest) lands with the EAS build profiles where the native modules run.

## Run / test

```bash
cd mobile_app
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest — EMI parity with the bank oracle + payoff math
npm start           # Expo dev server (scan QR with Expo Go)
EXPO_PUBLIC_API_BASE=http://<your-mock-or-api-host>:8081 npm start
```

Dev default API base is the local mock (`http://localhost:8081`), which
implements the same `/api/v1/portal/*` contract as the Java backend.

## Building the binaries (Android + iOS)

One codebase, both platforms:

```bash
npm install -g eas-cli
eas login                    # the bank's Expo account (provisioning item)
npm run eas:android          # AAB for Play Store / bank MDM
npm run eas:ios              # IPA for App Store / TestFlight
```

`eas.json` ships `production` (store), `preview` (internal UAT), and `test`
(APK for device farms) profiles for both platforms. Store submission targets
are placeholders (`submit.production`) until the bank's developer accounts
exist — same externally-bound category as the field app's EAS/MDM build.

## Backend dependency (one item to flip before UAT)

The Java `PortalController` currently carries a **staff-only** class-level
role gate (branch-officer/collections/admin) — a deliberate earlier design
decision. Before this app faces the real backend, add a borrower-grade
realm role (e.g. `borrower`, bound to CIF via the OTP flow) to that gate.
The mock already serves all `/portal/*` routes this app uses, so development
and e2e are unaffected today.
