/* ============================================================
   Login — three faces of one contract:
   · oidc  → SSO redirect button (+ PKCE callback handling)
   · token → CI banner (auto-session; this page is informational)
   · open  → dev persona picker (mock stack; also the role
             switcher target after logout)
   ============================================================ */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, DEV_PERSONAS } from "../auth/AuthProvider";
import { issuer, resolveMode } from "../auth/session";
import { ROLE_LABEL, type RealmRole } from "../auth/roles";

export function LoginPage() {
  const { session, login, completeOidc, loginAs, initializing, error } = useAuth();
  const nav = useNavigate();
  const mode = resolveMode();
  const iss = issuer();

  React.useEffect(() => { void completeOidc(); }, [completeOidc]);

  React.useEffect(() => {
    // already signed in (e.g. token mode) — straight to the role center
    if (session && mode === "token") nav("/home", { replace: true });
  }, [session, mode, nav]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--canvas, #f5f5f7)", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "min(480px, 92vw)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#3F51B5", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 20 }}>U</div>
          <div>
            <div style={{ fontWeight: 700 }}>ULMS · Unisoft Loan Management</div>
            <div style={{ fontSize: 12.5, color: "#666" }}>ABC Bank Bangladesh · staff sign-in</div>
          </div>
        </div>

        <div className="card" style={{ background: "#fff", border: "1px solid #e0e0e6", borderRadius: 10, padding: 20 }}>
          {error && <div role="alert" style={{ color: "#C50F1F", fontSize: 13, marginBottom: 12 }}>{error}</div>}

          {mode === "oidc" && (
            <>
              <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={login} disabled={initializing}>
                {initializing ? "Signing in…" : "Sign in with bank SSO (Keycloak)"}
              </button>
              <p style={{ fontSize: 12, color: "#777", margin: "12px 0 0" }}>
                OIDC authorization-code + PKCE · realm <code>ulms</code> · client <code>ulms-web</code>
                {iss ? `` : ""} · MFA (TOTP) enforced by the realm
              </p>
            </>
          )}

          {mode === "token" && (
            <>
              <p style={{ fontSize: 13.5, margin: "0 0 6px" }}>CI static-token session active.</p>
              <p style={{ fontSize: 12.5, color: "#777" }}>Roles come from VITE_ULMS_DEV_ROLES (or the token claims when it is a JWT).</p>
            </>
          )}

          {mode === "open" && (
            <>
              <p style={{ fontSize: 13, margin: "0 0 12px", color: "#555" }}>
                Mock stack (no Keycloak) — continue as a dev persona. Roles gate the UI exactly as in production.
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {DEV_PERSONAS.map((p) => (
                  <button key={p.id} type="button" className="btn btn-2nd" data-persona={p.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
                    onClick={() => { loginAs(p.id); nav("/home"); }}>
                    <span>{p.label}</span>
                    <span style={{ fontSize: 10.5, color: "#777" }}>
                      {p.roles.length > 3 ? `${p.roles.length} roles` : p.roles.map((r) => ROLE_LABEL[r as RealmRole] ?? r).join(" · ")}
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: "#999", margin: "12px 0 0" }}>
                DEV MODE — no authentication. Never available when VITE_USE_MOCK_API=0.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
