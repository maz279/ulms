/* ============================================================
   AuthProvider — session lifecycle for the three modes:
   oidc (PKCE redirect loop), token (static CI bearer),
   open (mock auto-session). Exposes useAuth() with the role
   helpers so the shell can gate navigation and actions.
   ============================================================ */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthSession, resolveMode, issuer, loadSession, saveSession, openSession, tokenSession, markSignedOut, clearSignedOut, isSignedOut,
  pkcePair, stashPkce, readPkce, authorizeUrl, tokenExchange, refreshToken, redirectUri,
  CLIENT_ID, postAuthEvent, sessionFromToken, devSession, passwordGrant,
} from "./session";
import { DEV_PERSONAS } from "./roles";

interface AuthCtx {
  session: AuthSession | null;
  initializing: boolean;
  error: string | null;
  login: () => void;                                   // oidc: redirect; others: no-op
  completeOidc: () => Promise<void>;                   // ?code callback handling
  loginAs: (personaId: string) => void;                // dev persona login/switch
  loginWithPassword: (username: string, password: string, totp: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = React.createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const mode = resolveMode();
  const iss = issuer();
  const [session, setSessionState] = React.useState<AuthSession | null>(() => {
    // open mode starts with the auto dev session (mock stack stays frictionless);
    // a stored narrower persona survives reloads so gating tests are stable
    if (mode === "open") return loadSession() ?? (isSignedOut() ? null : openSession());
    return loadSession();
  });
  const [initializing, setInitializing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = (s: AuthSession | null, event?: "LOGIN" | "LOGOUT" | "REFRESH") => {
    setSessionState(s);
    saveSession(s);
    if (s && event) void postAuthEvent(event, s);
  };

  const login = React.useCallback(() => {
    if (mode !== "oidc" || !iss) return;
    void (async () => {
      const { verifier, challenge } = await pkcePair();
      const state = crypto.randomUUID();
      stashPkce({ verifier, state });
      location.assign(authorizeUrl(iss, CLIENT_ID, redirectUri(), challenge, state));
    })();
  }, [mode, iss]);

  const completeOidc = React.useCallback(async () => {
    if (mode !== "oidc" || !iss) return;
    const url = new URL(location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");
    if (errorParam) { setError(`Keycloak: ${errorParam}`); return; }
    if (!code) return;                                   // plain visit to /login
    const stashed = readPkce();
    stashPkce(null);
    if (!stashed || stashed.state !== state) { setError("OIDC state mismatch — retry sign-in"); return; }
    setInitializing(true);
    try {
      const tr = await tokenExchange(iss, CLIENT_ID, redirectUri(), code, stashed.verifier);
      const s = sessionFromToken(tr.access_token, "oidc");
      if (!s) throw new Error("token missing realm roles/exp");
      set({ ...s, refreshToken: tr.refresh_token, idToken: tr.id_token, expiresAt: Date.now() + tr.expires_in * 1000 }, "LOGIN");
      history.replaceState(null, "", "/login");
      nav("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setInitializing(false); }
  }, [mode, iss, nav]);

  const loginAs = React.useCallback((personaId: string) => {
    const p = DEV_PERSONAS.find((x) => x.id === personaId);
    if (!p) return;
    clearSignedOut();
    set(devSession({ officer: p.officer, roles: p.roles, id: p.id }), "LOGIN");
  }, []);

  /** Single-page production login: direct grant against the pinned issuer
   *  (no redirect to the IdP's hosted page). The `totp` word is validated
   *  by Keycloak for TOTP-enrolled users and ignored otherwise. */
  const loginWithPassword = React.useCallback(async (username: string, password: string, totp: string) => {
    if (mode !== "oidc" || !iss) throw new Error("SSO not configured");
    const tr = await passwordGrant(iss, CLIENT_ID, username, password, totp);
    const s = sessionFromToken(tr.access_token, "oidc");
    if (!s) throw new Error("identity provider returned an unusable token");
    clearSignedOut();
    set({ ...s, refreshToken: tr.refresh_token, idToken: tr.id_token,
          expiresAt: Date.now() + tr.expires_in * 1000 }, "LOGIN");
  }, [mode, iss]);

  const logout = React.useCallback(() => {
    const prev = session;
    set(null);
    if (mode !== "oidc") markSignedOut();   // open/token: make it stick across reloads
    if (prev) void postAuthEvent("LOGOUT", prev);
    if (mode === "oidc" && iss && prev?.idToken) {
      location.assign(`${iss}/protocol/openid-connect/logout?` + new URLSearchParams({
        client_id: CLIENT_ID, post_logout_redirect_uri: location.origin + "/login", id_token_hint: prev.idToken,
      }));
      return;
    }
    nav("/login");
  }, [session, mode, iss, nav]);

  const refresh = React.useCallback(async () => {
    if (mode !== "oidc" || !iss || !session?.refreshToken) return;
    try {
      const tr = await refreshToken(iss, CLIENT_ID, session.refreshToken);
      const base = sessionFromToken(tr.access_token, "oidc") ?? session;
      set({ ...base, accessToken: tr.access_token, refreshToken: tr.refresh_token ?? session.refreshToken,
            idToken: tr.id_token ?? session.idToken, expiresAt: Date.now() + tr.expires_in * 1000 }, "REFRESH");
    } catch {
      set(null);
      nav("/login");
    }
  }, [mode, iss, session, nav]);

  // token mode: mint the CI session once on mount
  React.useEffect(() => {
    if (mode === "token" && !session) {
      const s = tokenSession();
      if (s) set(s, "LOGIN");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // oidc: silent refresh 60s before expiry
  React.useEffect(() => {
    if (mode !== "oidc" || !session?.refreshToken || !session.expiresAt) return;
    const ms = Math.max(0, session.expiresAt - Date.now() - 60_000);
    const t = setTimeout(() => { void refresh(); }, ms);
    return () => clearTimeout(t);
  }, [mode, session, refresh]);

  return (
    <Ctx.Provider value={{ session, initializing, error, login, completeOidc, loginAs, loginWithPassword, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export { DEV_PERSONAS };
