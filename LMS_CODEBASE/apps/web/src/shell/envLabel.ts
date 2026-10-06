/* ============================================================
   Environment identity — the shell MUST present the truth, never
   a hardcoded stage label (the prototype shipped a "STAGING"
   topbar chip; the production build replaces it with the actual
   mode). Single source for the topbar chip, statusbar, and the
   System > Environment card.
   ============================================================ */

/** "PRODUCTION" when the build targets the real API stack, "DEV" for the
 *  mock/dev build (the shell already shows its separate DEV banner for
 *  unauthenticated sessions — this label is about the BUILD, not the login). */
export const ENV_LABEL: string =
  import.meta.env.VITE_USE_MOCK_API === "0" ? "PRODUCTION" : "DEV";

/** True for the production build (mock API compiled out, real API proxied). */
export const IS_PRODUCTION_BUILD: boolean =
  import.meta.env.VITE_USE_MOCK_API === "0";
