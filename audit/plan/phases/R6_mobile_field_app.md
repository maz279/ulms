# R6 — Mobile Field App (Expo 54)
**Env:** Node/Expo; device/emulator optional for full verify · **Est:** 2–3 weeks

## Deliverables
1. **App scaffold** — Expo 54 (new arch), TypeScript strict, Keycloak auth, secure storage, i18n BN/EN, design tokens shared with web.
2. **CPV module** — assignment list (offline cache), verification forms (residence/business/reference/asset), GPS geotag + accuracy check, camera (Vision Camera) with quality gate, voice notes (≤5 min), customer signature capture, auto report draft.
3. **Collections module** — today's list, call-outcome logging, PTP capture, payment-evidence photo.
4. **Offline sync engine** — queue + conflict resolution (server-wins + append-only evidence per PLANNING/03), background sync, retry/backoff.
5. **MDM notes** — build/distribution pipeline stub for the G5 checklist item.

## Exit criteria
- [ ] TypeScript strict + jest/expo tests for the sync engine + form validation
- [ ] Field APIs already present (field-tasks complete, worklist) — contract-tested from the app client
- [ ] Internal test build (EAS or local APK) documented
