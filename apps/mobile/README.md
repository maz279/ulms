# ULMS Field App (R6 — audit/plan/phases/R6_mobile_field_app.md)

Offline-first CPV + collections app for field officers. Expo 54 (new arch), TypeScript strict.

## Layout
```
src/
  sync/engine.ts        PURE TS sync engine — server-wins merge, append-only
                        evidence, exponential backoff (1/2/4/8/16s ±20% jitter,
                        crypto-random), 5-attempt cap, terminal states never
                        reprocess. 14 unit tests in engine.test.ts (vitest).
  queue/store.ts        Durable queue facade (AsyncStorage persistence boundary).
  api/client.ts         Field API contract client (worklist, field-tasks,
                        complete/actions/PTP) + the transport the sync engine
                        drains through (4xx non-retryable, 5xx/network retry).
  auth/auth.ts          Keycloak PKCE (S256); token+refresh in expo-secure-store;
                        ISSUER pinned from EXPO_PUBLIC_OIDC_ISSUER at build time
                        (the ONLY URL the module fetches — no runtime URL input).
  i18n/                 BN/EN strings (one-language-per-element rule; BN falls
                        back to EN until bank translation review clears).
  screens/              TodayScreen (collections list + call/PTP enqueue),
                        CpvTasksScreen (assignment list + gated verification
                        form: GPS <10m, ≥1 photo, person-met, discrepancy ≥20
                        chars), SyncScreen (queue state + manual drain).
```

## Env (ENV ONLY — never literals)
- `EXPO_PUBLIC_API_BASE` — staff API base, e.g. `https://ulms-dev.bank.local`
- `EXPO_PUBLIC_OIDC_ISSUER` — realm URL, e.g. `https://keycloak.bank.local/realms/ulms`
- `EXPO_PUBLIC_OIDC_CLIENT` — default `ulms-mobile`

## Local development
```bash
npm install
npm run test        # sync engine + form validation (vitest, plain Node)
npm run typecheck   # tsc --noEmit (strict)
npm start           # Expo dev server (needs Android/Xcode toolchain for device)
```

## Sync contract (PLANNING/03 + 08)
- **Server-wins**: the server's task state replaces the local one on conflict;
  the local copy is never pushed over server state.
- **Append-only evidence**: photos/GPS/notes/signature dedupe by sha256 and
  append — a conflict adds items, never overwrites one.
- **Retry ladder**: 1s → 2s → 4s → 8s → 16s (±20% crypto-random jitter);
  after 5 attempts the op is `failed` (terminal) and surfaces on SyncScreen.
- 4xx responses are contract problems (fix the form) — not retried;
  5xx and network errors retry.

## Build & distribution (MDM — G5 checklist item)
- Internal test build: `npm run eas:test-build` (EAS build profile `test`,
  Android internal-testing track) or `expo run:android --variant release`
  for a local APK.
- MDM distribution: signed APK → bank MDM (test flight ring → officer
  devices). EAS credentials come from the CI secret store — never committed.
- The login redirect URI `ulmsfield://callback` must be added to the
  `ulms-mobile` Keycloak client before the first device build.
