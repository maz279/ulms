/* ============================================================
   ULMS web session — OIDC PKCE against Keycloak 26 (realm
   `ulms`, public client `ulms-web`, S256) with two dev modes:
   'token' (VITE_ULMS_TOKEN static — CI) and 'open' (mock stack,
   auto persona session). Roles come from `realm_access.roles`
   (backend parity). Pure helpers are unit-tested.
   ============================================================ */
import type { Roles } from "./roles";

export type AuthMode = "oidc" | "token" | "open";

export interface AuthSession {
  mode: AuthMode;
  officer: string;              // display/audit actor
  roles: Roles;
  accessToken?: string;         // opaque in dev modes
  refreshToken?: string;        // oidc only
  idToken?: string;             // oidc only (logout hint)
  expiresAt: number;            // epoch ms
  personaId?: string;           // dev persona provenance
}

const STORE_KEY = "ulms-auth";
const PKCE_KEY = "ulms-pkce";
const SIGNEDOUT_KEY = "ulms-signedout";

/** Open-mode logout must STICK: without this marker a refresh of /home would
 *  silently re-mint the all-roles dev session and defeat the StaffGate. */
export function markSignedOut(): void {
  try { localStorage.setItem(SIGNEDOUT_KEY, "1"); } catch { /* private mode */ }
}
export function clearSignedOut(): void {
  try { localStorage.removeItem(SIGNEDOUT_KEY); } catch { /* private mode */ }
}
export function isSignedOut(): boolean {
  try { return localStorage.getItem(SIGNEDOUT_KEY) === "1"; } catch { return false; }
}

/** All dev personas carry every staff role by default so the UI stays
 *  fully explorable in mock mode; VITE_ULMS_DEV_ROLES narrows it. */
function envRoles(): Roles {
  const raw = import.meta.env.VITE_ULMS_DEV_ROLES as string | undefined;
  if (!raw) return ["branch-officer", "branch-manager", "regional-manager", "divisional-head",
    "credit-analyst", "ho-credit", "credit-committee", "md", "collections", "compliance", "admin"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function issuer(): string | null {
  const raw = import.meta.env.VITE_OIDC_ISSUER as string | undefined;
  if (raw) return raw.replace(/\/$/, "");
  // compose/prod build (mock off) — the seeded realm default
  if (import.meta.env.VITE_USE_MOCK_API === "0") return "http://localhost:8082/realms/ulms";
  return null;
}

export function resolveMode(): AuthMode {
  if (import.meta.env.VITE_ULMS_TOKEN) return "token";
  return issuer() ? "oidc" : "open";
}

/* ---------- JWT (decode only — never trust client-side for authz) ---------- */

export function b64urlDecode(s: string): string {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(b64)));
}

export interface JwtClaims {
  sub?: string;
  exp?: number;
  preferred_username?: string;
  name?: string;
  realm_access?: { roles?: string[] };
  [k: string]: unknown;
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(b64urlDecode(payload)) as JwtClaims;
  } catch {
    return null;
  }
}

export function sessionFromToken(token: string, mode: AuthMode): AuthSession | null {
  const claims = decodeJwt(token);
  if (!claims?.exp || claims.exp * 1000 < Date.now()) return null;
  return {
    mode,
    officer: claims.preferred_username ?? claims.name ?? claims.sub ?? "officer",
    roles: claims.realm_access?.roles ?? [],
    accessToken: token,
    expiresAt: claims.exp * 1000,
  };
}

/* ---------- PKCE (S256) — standard-issuer endpoints ---------- */

export async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const verifier = base64url(new Uint8Array(bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

export function base64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function authorizeUrl(iss: string, clientId: string, redirectUri: string, challenge: string, state: string): string {
  const q = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: "code",
    scope: "openid", code_challenge: challenge, code_challenge_method: "S256", state,
  });
  return `${iss}/protocol/openid-connect/auth?${q}`;
}

export function logoutUrl(iss: string, clientId: string, redirectUri: string, idToken?: string): string {
  const q = new URLSearchParams({ client_id: clientId, post_logout_redirect_uri: redirectUri });
  if (idToken) q.set("id_token_hint", idToken);
  return `${iss}/protocol/openid-connect/logout?${q}`;
}

export interface TokenResponse {
  access_token: string; refresh_token?: string; id_token?: string; expires_in: number;
}

export async function tokenExchange(iss: string, clientId: string, redirectUri: string, code: string, verifier: string): Promise<TokenResponse> {
  const res = await fetch(`${iss}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code", client_id: clientId,
      redirect_uri: redirectUri, code, code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed (${res.status})`);
  return res.json();
}

export async function refreshToken(iss: string, clientId: string, refreshTokenValue: string): Promise<TokenResponse> {
  const res = await fetch(`${iss}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token", client_id: clientId, refresh_token: refreshTokenValue,
    }),
  });
  if (!res.ok) throw new Error(`refresh failed (${res.status})`);
  return res.json();
}

export const CLIENT_ID = "ulms-web";
export function redirectUri(): string { return `${location.origin}/login`; }

/* ---------- storage ---------- */

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (s.expiresAt && s.expiresAt < Date.now()) return null;
    return s;
  } catch { return null; }
}
export function saveSession(s: AuthSession | null): void {
  try { s ? localStorage.setItem(STORE_KEY, JSON.stringify(s)) : localStorage.removeItem(STORE_KEY); } catch { /* private mode */ }
}
export function stashPkce(v: { verifier: string; state: string } | null): void {
  try { v ? sessionStorage.setItem(PKCE_KEY, JSON.stringify(v)) : sessionStorage.removeItem(PKCE_KEY); } catch { /* noop */ }
}
export function readPkce(): { verifier: string; state: string } | null {
  try {
    const raw = sessionStorage.getItem(PKCE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ---------- dev sessions ---------- */

export function devSession(persona: { officer: string; roles: Roles; id?: string }): AuthSession {
  return {
    mode: resolveMode(),
    officer: persona.officer,
    roles: persona.roles,
    expiresAt: Date.now() + 8 * 3600_000,   // mirror ssoSessionMaxLifespan
    personaId: persona.id,
  };
}

/** token mode — static bearer from env; roles from the JWT if it is one,
 *  else VITE_ULMS_DEV_ROLES (default: full staff set). */
export function tokenSession(): AuthSession | null {
  const token = import.meta.env.VITE_ULMS_TOKEN as string;
  const fromJwt = sessionFromToken(token, "token");
  if (fromJwt) return fromJwt;
  return {
    mode: "token",
    officer: (import.meta.env.VITE_ULMS_ACTOR as string | undefined) ?? "ci-officer",
    roles: envRoles(),
    accessToken: token,
    expiresAt: Number.MAX_SAFE_INTEGER,
  };
}

/** open mode — auto session so the mock stack stays frictionless;
 *  the login screen / role switcher narrows it on demand. */
export function openSession(): AuthSession {
  return devSession({ officer: "r.islam", roles: envRoles(), id: "allda" });
}

export async function postAuthEvent(type: "LOGIN" | "LOGOUT" | "REFRESH", session: AuthSession): Promise<void> {
  try {
    await fetch("/api/v1/auth/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ULMS-Actor": session.officer, "X-ULMS-Roles": session.roles.join(",") },
      body: JSON.stringify({ type, mode: session.mode }),
    });
  } catch { /* best-effort audit trail */ }
}
