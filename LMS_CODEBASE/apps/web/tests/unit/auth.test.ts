/**
 * R2 unit suite — role matrix parity with the backend contract
 * (SecurityConfig.STAFF_ROLES + ApprovalService.ROLE_TO_LADDER), JWT
 * decode, PKCE helpers, and the gating predicates the shell relies on.
 */
import { describe, it, expect } from "vitest";
import {
  REALM_ROLES, STAFF_ROLES, ROLE_TO_LADDER, AREA_ROLES, SYSTEM_LINK_ROLES,
  isStaff, isAdmin, canApprove, ladderRoles,
  DISBURSEMENT_WRITE, REGCON_SIGNOFF, COLLECTIONS_WRITE, SETTINGS_WRITE, DEV_PERSONAS,
} from "@/auth/roles";
import { b64urlDecode, decodeJwt, sessionFromToken, base64url, authorizeUrl, logoutUrl } from "@/auth/session";

/** Hand-rolled HS256-less JWT (header.payload.signature, payload only matters). */
function fakeJwt(payload: object, skewSec = 600): string {
  const enc = (o: object) => base64url(new TextEncoder().encode(JSON.stringify(o)));
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ exp: Math.floor(Date.now() / 1000) + skewSec, ...payload })}.sig`;
}

describe("role model mirrors the backend (drift = defect)", () => {
  it("11 realm roles, exact names", () => {
    expect(REALM_ROLES).toHaveLength(11);
    for (const r of ["branch-officer", "branch-manager", "regional-manager", "divisional-head",
      "credit-analyst", "ho-credit", "credit-committee", "md", "collections", "compliance", "admin"]) {
      expect(REALM_ROLES).toContain(r);
    }
  });
  it("STAFF_ROLES = SecurityConfig URL gate (7 roles)", () => {
    expect([...STAFF_ROLES].sort()).toEqual(["admin", "branch-manager", "branch-officer",
      "collections", "compliance", "credit-analyst", "ho-credit"].sort());
  });
  it("ROLE_TO_LADDER = ApprovalService map, 7 rungs", () => {
    expect(ROLE_TO_LADDER).toEqual({
      "branch-officer": "ladder-1", "branch-manager": "ladder-2", "regional-manager": "ladder-3",
      "divisional-head": "ladder-4", "ho-credit": "ladder-5", "credit-committee": "ladder-6", md: "ladder-7",
    });
  });
});

describe("gating predicates", () => {
  it("canApprove: exact rung match; admin bypass; no cross-rung", () => {
    expect(canApprove(["branch-manager"], "ladder-2")).toBe(true);
    expect(canApprove(["branch-manager"], "ladder-3")).toBe(false);   // equality, not ≥
    expect(canApprove(["md"], "ladder-2")).toBe(false);               // md is ladder-7 only
    expect(canApprove(["ho-credit"], "ladder-5")).toBe(true);
    expect(canApprove(["ho-credit"], "L5")).toBe(true);               // lean rung format tolerance
    expect(canApprove(["regional-manager"], "L3")).toBe(true);
    expect(canApprove(["regional-manager"], "L4")).toBe(false);
    expect(canApprove([], "ladder-1")).toBe(false);
    expect(canApprove(["branch-officer"], null)).toBe(false);
  });
  it("canApprove admin sees every rung (controller parity)", () => {
    for (let i = 1; i <= 7; i++) expect(canApprove(["admin"], `ladder-${i}`)).toBe(true);
  });
  it("ladderRoles: maps + admin marker", () => {
    expect(ladderRoles(["branch-officer", "collections"])).toEqual(["ladder-1"]);
    expect(ladderRoles(["admin"])).toEqual(["admin"]);
    expect(ladderRoles(["ho-credit", "md"])).toEqual(["ladder-5", "ladder-7"]);
  });
  it("staff/admin classification", () => {
    expect(isStaff(["collections"])).toBe(true);
    expect(isStaff(["md"])).toBe(false);        // md is not in the URL STAFF set — mirrors Java
    expect(isAdmin(["compliance", "admin"])).toBe(true);
  });
  it("area + system-link gates hide platform from non-admin", () => {
    expect(AREA_ROLES.H.has("admin")).toBe(true);
    expect(AREA_ROLES.H.has("ho-credit")).toBe(false);
    expect(AREA_ROLES.F.has("collections")).toBe(true);
    expect(AREA_ROLES.F.has("branch-officer")).toBe(false);
    expect(SYSTEM_LINK_ROLES["/settings"].has("admin")).toBe(true);
    expect(SYSTEM_LINK_ROLES["/regcon"].has("compliance")).toBe(true);
    expect(SYSTEM_LINK_ROLES["/regcon"].has("branch-manager")).toBe(false);
  });
  it("write gates: disbursement/regcon/collections/settings sets", () => {
    expect(DISBURSEMENT_WRITE.has("branch-manager")).toBe(true);
    expect(DISBURSEMENT_WRITE.has("branch-officer")).toBe(false);
    expect(REGCON_SIGNOFF.has("compliance")).toBe(true);
    expect(COLLECTIONS_WRITE.has("collections")).toBe(true);
    expect(SETTINGS_WRITE.has("md")).toBe(false);
  });
  it("dev personas cover low/mid/high/admin paths", () => {
    const ids = DEV_PERSONAS.map((p) => p.id);
    for (const need of ["officer", "manager", "collections", "compliance", "admin", "allda"]) {
      expect(ids).toContain(need);
    }
  });
});

describe("JWT decode + session", () => {
  it("decodes realm_access.roles and exp", () => {
    const t = fakeJwt({ preferred_username: "r.islam", realm_access: { roles: ["branch-manager", "admin"] } });
    const c = decodeJwt(t)!;
    expect(c.preferred_username).toBe("r.islam");
    expect(c.realm_access?.roles).toContain("admin");
  });
  it("rejects expired tokens", () => {
    expect(sessionFromToken(fakeJwt({ realm_access: { roles: ["admin"] } }, -60), "oidc")).toBeNull();
  });
  it("garbage tokens → null, never throw", () => {
    expect(decodeJwt("not-a-jwt")).toBeNull();
    expect(decodeJwt("")).toBeNull();
  });
  it("b64url round-trips unicode", () => {
    expect(b64urlDecode(base64url(new TextEncoder().encode('{"bn":"গ্রাহক"}')))).toContain("গ্রাহক");
  });
});

describe("OIDC URL builders (Keycloak contract)", () => {
  const iss = "http://localhost:8082/realms/ulms";
  it("authorize: code + PKCE S256 + state", () => {
    const u = new URL(authorizeUrl(iss, "ulms-web", "http://localhost:5173/login", "chal", "st"));
    expect(u.pathname).toBe("/realms/ulms/protocol/openid-connect/auth");
    const q = u.searchParams;
    expect(q.get("client_id")).toBe("ulms-web");
    expect(q.get("response_type")).toBe("code");
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(q.get("state")).toBe("st");
  });
  it("logout: post_logout_redirect + id_token_hint", () => {
    const u = new URL(logoutUrl(iss, "ulms-web", "http://localhost:5173/login", "idt"));
    expect(u.pathname).toBe("/realms/ulms/protocol/openid-connect/logout");
    expect(u.searchParams.get("id_token_hint")).toBe("idt");
  });
});
