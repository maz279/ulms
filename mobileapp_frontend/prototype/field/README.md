# ULMS Field — Working Prototype (100% interactive)

**Open `http://localhost:8791/prototype/field/`** (serve the parent
`mobileapp_frontend` folder with `python -m http.server 8791`).

A fully clickable, in-browser prototype of the **field-officer app** — the
same six tabs, tokens, Bangla-first copy, and contracts as the React Native
app in `LMS_CODEBASE/apps/mobile/`, but actually working:

| Flow | What really happens |
|---|---|
| **Login → PIN** | Bank PKCE sign-in (simulated round-trip) → set/enter a 4–6 digit PIN on every cold start (salted-hash at rest, wrong-PIN rejected). |
| **Today** | Live task list from the embedded `/field/tasks` delta; log-call and PTP capture enqueue offline (toast confirmation). |
| **CPV form** | Real gates before submit (person met, ≥1 photo, GPS ≤10m); **draw an actual signature on the canvas** (checksummed); voice note (300s cap shown); every item becomes evidence with an integrity sha. |
| **Map** | Schematic pin board of open tasks (Bangladesh-bbox normalized); unpinned tasks listed. |
| **Proof gallery** | Every queued/synced evidence item with its sha and state. |
| **SOS** | Two-step arm→send; GPS attached but never blocking; queued (never silently dropped). |
| **Sync center** | *Sync now* drains the queue through the embedded engine — visits post idempotently (op id = clientUuid), and completing a task that's already DONE demonstrates the **server-wins conflict with appended evidence**, exactly like the shipped service. |

State (tasks, queue, PIN hash) persists in localStorage per browser;
*reset demo data* on the login screen reseeds. Randomness via
`crypto.getRandomValues`; checksums FNV-1a (same as the app pre-EAS).

## Honest boundaries

The API and sync engine are simulated in-page so this runs standalone; the
real app calls `/api/v1/field/*` on the Java backend with Keycloak auth.
Voice/photos/GPS are counters and fixed coordinates here — hardware capture
lives in the native app (expo-av/camera/location).
