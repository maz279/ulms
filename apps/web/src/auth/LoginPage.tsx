/* ============================================================
   Login — ONE page, three modes of one contract:
   · open  → username + password → MFA (TOTP-style; any word
             accepted in the mock stack) → session
   · oidc  → same visual shell; SSO button drives the real
             OIDC auth-code + PKCE flow (credentials live in
             Keycloak — nothing is checked or stored here)
   · token → CI banner (auto-session; informational)
   The dev role quick-chips below keep the e2e persona
   selectors working and double as the role switcher target.
   ============================================================ */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, DEV_PERSONAS } from "../auth/AuthProvider";
import { issuer, resolveMode } from "../auth/session";

export function LoginPage() {
  const { session, login, completeOidc, loginAs, initializing, error } = useAuth();
  const nav = useNavigate();
  const mode = resolveMode();
  const iss = issuer();

  const [user, setUser] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [mfa, setMfa] = React.useState("");
  const [step, setStep] = React.useState<"creds" | "mfa">("creds");
  const [formErr, setFormErr] = React.useState<string | null>(null);

  React.useEffect(() => { void completeOidc(); }, [completeOidc]);

  React.useEffect(() => {
    // already signed in (e.g. token mode) — straight to the role center
    if (session && mode === "token") nav("/home", { replace: true });
  }, [session, mode, nav]);

  function submitCreds(e: React.FormEvent) {
    e.preventDefault();
    if (!user.trim() || !pass.trim()) {
      setFormErr("Enter your username and password");
      return;
    }
    setFormErr(null);
    setStep("mfa");
  }

  function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfa.trim()) {
      setFormErr("Enter the code from your authenticator app");
      return;
    }
    // Mock stack: credentials and the MFA word are accepted as typed (the
    // real flow validates them in Keycloak + TOTP). The all-roles persona
    // carries the session — production builds never reach this branch.
    loginAs("allda");
    nav("/home");
  }

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "linear-gradient(135deg, #1a237e 0%, #283593 45%, #3949ab 100%)",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", padding: 16,
    }}>
      <div style={{
        width: "min(880px, 96vw)", display: "grid",
        gridTemplateColumns: "minmax(280px, 1fr) minmax(300px, 1.2fr)",
        borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(10,16,60,.45)",
      }}>
        {/* brand panel */}
        <div style={{
          background: "linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.04))",
          color: "#fff", padding: "36px 30px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#5C6BC0,#7986CB)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 21 }}>U</div>
            <div>
              <div style={{ fontWeight: 700, letterSpacing: .2 }}>ULMS</div>
              <div style={{ fontSize: 12, opacity: .8 }}>Unisoft Loan Management</div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, opacity: .92 }}>
            ABC Bank Bangladesh · staff access to origination, servicing,
            collections, compliance and regulatory reporting.
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.9, opacity: .85 }}>
            <li>Role-gated modules — exactly as production</li>
            <li>Multi-factor sign-in (TOTP-style)</li>
            <li>Session expires automatically · audit-logged</li>
          </ul>
          <div style={{ marginTop: "auto", fontSize: 11, opacity: .6 }}>
            {iss ? <>realm <code style={{ color: "#c5cae9" }}>ulms</code> · client <code style={{ color: "#c5cae9" }}>ulms-web</code></> : "internal use only"}
          </div>
        </div>

        {/* form panel */}
        <div style={{ background: "#fff", padding: "34px 32px" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 700, color: "#1a237e" }}>
            {step === "creds" ? "Staff sign-in" : "Two-step verification"}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#5f6368" }}>
            {step === "creds"
              ? "Use your ULMS staff credentials to continue."
              : "Enter the code from your authenticator app to finish signing in."}
          </p>

          {(error || formErr) && (
            <div role="alert" style={{
              background: "#fdecea", color: "#C50F1F", borderRadius: 8,
              padding: "9px 12px", fontSize: 12.5, marginBottom: 14,
            }}>{formErr ?? error}</div>
          )}

          {mode === "oidc" && (
            <>
              <button type="button" onClick={login} disabled={initializing}
                style={{
                  width: "100%", padding: "12px 16px", border: 0, borderRadius: 8,
                  background: "linear-gradient(135deg,#3949ab,#1a237e)", color: "#fff",
                  fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                }}>
                {initializing ? "Signing in…" : "Sign in with bank SSO (Keycloak)"}
              </button>
              <p style={{ fontSize: 12, color: "#777", margin: "14px 0 0", lineHeight: 1.5 }}>
                OIDC authorization-code + PKCE · MFA (TOTP) enforced by the realm —
                staff credentials are validated by the bank identity provider.
              </p>
            </>
          )}

          {mode === "token" && (
            <>
              <p style={{ fontSize: 13.5, margin: "0 0 6px" }}>CI static-token session active.</p>
              <p style={{ fontSize: 12.5, color: "#777" }}>Roles come from VITE_ULMS_DEV_ROLES (or the token claims when it is a JWT).</p>
            </>
          )}

          {mode === "open" && step === "creds" && (
            <form onSubmit={submitCreds}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3949ab", margin: "0 0 6px" }}>Username</label>
              <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username"
                placeholder="e.g. r.islam"
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 8,
                  border: "1px solid #d5d8e4", fontSize: 14, marginBottom: 14, outline: "none",
                  background: "#f8f9fc" }} />
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3949ab", margin: "0 0 6px" }}>Password</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password"
                placeholder="••••••••"
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 8,
                  border: "1px solid #d5d8e4", fontSize: 14, marginBottom: 18, outline: "none",
                  background: "#f8f9fc" }} />
              <button type="submit"
                style={{
                  width: "100%", padding: "12px 16px", border: 0, borderRadius: 8,
                  background: "linear-gradient(135deg,#3949ab,#1a237e)", color: "#fff",
                  fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                }}>Continue</button>
            </form>
          )}

          {mode === "open" && step === "mfa" && (
            <form onSubmit={submitMfa}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, background: "#eef0fa",
                borderRadius: 8, padding: "9px 12px", fontSize: 12.5, color: "#3949ab", marginBottom: 14,
              }}>
                <span style={{ fontSize: 16 }}>🔐</span> Signed in as <b>{user}</b> — verification required
              </div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3949ab", margin: "0 0 6px" }}>
                Authenticator code
              </label>
              <input value={mfa} onChange={(e) => setMfa(e.target.value)} autoFocus
                placeholder="6-digit code (any word accepted in this demo stack)"
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 8,
                  border: "1px solid #d5d8e4", fontSize: 14, marginBottom: 18, outline: "none",
                  background: "#f8f9fc", letterSpacing: 1.5 }} />
              <button type="submit"
                style={{
                  width: "100%", padding: "12px 16px", border: 0, borderRadius: 8,
                  background: "linear-gradient(135deg,#3949ab,#1a237e)", color: "#fff",
                  fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                }}>Verify & sign in</button>
              <button type="button" onClick={() => { setStep("creds"); setMfa(""); setFormErr(null); }}
                style={{ width: "100%", marginTop: 8, padding: "9px 16px", border: 0, background: "none",
                  color: "#5f6368", fontSize: 12.5, cursor: "pointer" }}>← Use a different account</button>
            </form>
          )}

          {mode === "open" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 10px" }}>
                <div style={{ flex: 1, height: 1, background: "#e6e8f0" }} />
                <span style={{ fontSize: 11, color: "#9aa0b5" }}>DEV QUICK ROLE ACCESS</span>
                <div style={{ flex: 1, height: 1, background: "#e6e8f0" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DEV_PERSONAS.map((p) => (
                  <button key={p.id} type="button" data-persona={p.id}
                    onClick={() => { loginAs(p.id); nav("/home"); }}
                    style={{
                      border: "1px solid #d5d8e4", background: "#f8f9fc", color: "#3949ab",
                      borderRadius: 999, padding: "5px 11px", fontSize: 11.5, cursor: "pointer",
                    }}>
                    {p.label.split(" — ")[0]}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#9aa0b5", margin: "10px 0 0" }}>
                Mock stack (no Keycloak) — the quick chips grant a role session directly
                for testing. Never available when VITE_USE_MOCK_API=0.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
