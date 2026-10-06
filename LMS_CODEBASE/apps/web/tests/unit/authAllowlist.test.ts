/**
 * Auth-origin allowlist (security remediation for the mimosa medium finding):
 * every constructed auth URL — authorize, logout, direct grant, exchange,
 * refresh — must be http(s) AND on the pinned issuer's origin (plus optional
 * VITE_OIDC_ALLOWED_ORIGINS). A tampered/misconfigured issuer must fail
 * CLOSED before any navigation or fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const env = import.meta.env as Record<string, string | undefined>;

describe("auth URL allowlist", () => {
  beforeEach(() => {
    env.VITE_OIDC_ISSUER = "https://sso.bank.local/realms/ulms";
    env.VITE_USE_MOCK_API = "0";
    env.VITE_OIDC_ALLOWED_ORIGINS = undefined;
  });
  afterEach(() => {
    vi.resetModules();
  });

  // import fresh so module-level env reads see the stubbed values
  async function fresh() {
    const mod = await import("@/auth/session");
    return mod;
  }

  it("issuer's own origin is trusted", async () => {
    const { assertTrustedAuthUrl } = await fresh();
    expect(assertTrustedAuthUrl("https://sso.bank.local/realms/ulms/protocol/openid-connect/token").href)
      .toContain("https://sso.bank.local");
  });

  it("a different origin is rejected (fail closed)", async () => {
    const { assertTrustedAuthUrl } = await fresh();
    expect(() => assertTrustedAuthUrl("https://evil.example/realms/ulms/token"))
      .toThrow(/not allowlisted/);
    expect(() => assertTrustedAuthUrl("javascript://evil.example/x"))
      .toThrow(/http\(s\)/);
  });

  it("extra origins come from VITE_OIDC_ALLOWED_ORIGINS only", async () => {
    env.VITE_OIDC_ALLOWED_ORIGINS = "https://idp2.bank.local, https://bad entry,, https://idp3.bank.local";
    const { trustedAuthOrigins, assertTrustedAuthUrl } = await fresh();
    const origins = trustedAuthOrigins();
    expect(origins).toContain("https://sso.bank.local");
    expect(origins).toContain("https://idp2.bank.local");
    expect(origins).toContain("https://idp3.bank.local");
    expect(origins).not.toContain("https://evil.example");
    expect(assertTrustedAuthUrl("https://idp2.bank.local/anything").origin)
      .toBe("https://idp2.bank.local");
  });

  it("authorizeUrl refuses an off-allowlist issuer instead of building the URL", async () => {
    const { authorizeUrl } = await fresh();
    expect(() => authorizeUrl("https://attacker.local", "ulms-web",
      "https://app.local/login", "challenge", "state"))
      .toThrow(/not allowlisted/);
  });
});
