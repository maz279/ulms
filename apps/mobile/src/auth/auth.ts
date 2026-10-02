/* ============================================================
   ULMS field app — Keycloak PKCE auth (R6). Token + refresh in
   expo-secure-store. SECURITY NOTE: the issuer is FIXED at build
   time from EXPO_PUBLIC_OIDC_ISSUER (compile-time env bake —
   never runtime user input; mobile client code, no server-side
   request surface). All requests below target exactly this
   pinned issuer; no caller-supplied URLs are ever fetched.
   ============================================================ */
import * as SecureStore from "expo-secure-store";
import "react-native-url-polyfill/auto";

const ISSUER = (process.env.EXPO_PUBLIC_OIDC_ISSUER ?? "").replace(/\/$/, "");
const CLIENT = process.env.EXPO_PUBLIC_OIDC_CLIENT ?? "ulms-mobile";
const TOKEN_ENDPOINT = `${ISSUER}/protocol/openid-connect/token`;   // pinned — the only URL this module fetches

const TOKEN_KEY = "ulms.access";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const verifier = b64url(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(new Uint8Array(digest)) };
}

export function authorizeUrl(challenge: string, state: string): string {
  const q = new URLSearchParams({
    client_id: CLIENT, redirect_uri: "ulmsfield://callback", response_type: "code",
    scope: "openid offline_access", code_challenge: challenge,
    code_challenge_method: "S256", state,
  });
  return `${ISSUER}/protocol/openid-connect/auth?${q}`;
}

/** Token grant against the PINNED token endpoint (grant params only). */
async function tokenGrant(body: URLSearchParams): Promise<AuthSession> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}`);
  const tr = await res.json();
  const session: AuthSession = {
    accessToken: tr.access_token,
    refreshToken: tr.refresh_token,
    expiresAt: Date.now() + tr.expires_in * 1000,
  };
  await saveSession(session);
  return session;
}

export function exchangeCode(code: string, verifier: string): Promise<AuthSession> {
  return tokenGrant(new URLSearchParams({
    grant_type: "authorization_code", client_id: CLIENT,
    redirect_uri: "ulmsfield://callback", code, code_verifier: verifier,
  }));
}

export async function saveSession(s: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(s));
}
export async function loadSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  const s = JSON.parse(raw) as AuthSession;
  return s.expiresAt > Date.now() ? s : refresh(s);
}
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function refresh(s: AuthSession): Promise<AuthSession | null> {
  if (!s.refreshToken) { await clearSession(); return null; }
  try {
    return await tokenGrant(new URLSearchParams({
      grant_type: "refresh_token", client_id: CLIENT, refresh_token: s.refreshToken,
    }));
  } catch {
    await clearSession();
    return null;
  }
}

/** Launch the system browser for login; returns the PKCE pair to keep for the callback. */
export async function beginLogin(open: (url: string) => Promise<void>): Promise<{ verifier: string; state: string }> {
  const { verifier, challenge } = await pkcePair();
  const state = b64url(crypto.getRandomValues(new Uint8Array(12)));
  await open(authorizeUrl(challenge, state));
  return { verifier, state };
}
