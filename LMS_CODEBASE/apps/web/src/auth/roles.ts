/* ============================================================
   ULMS role model — frontend mirror of the backend contract
   (SecurityConfig STAFF_ROLES + ApprovalService.ROLE_TO_LADDER
   + PLANNING/06 §1). Kept pure for unit testing; drift from the
   Java side is a defect (tested by parity assertions).
   ============================================================ */

/** Realm roles — exact Keycloak names (deploy/seed/realm-ulms.json). */
export const REALM_ROLES = [
  "branch-officer", "branch-manager", "regional-manager", "divisional-head",
  "credit-analyst", "ho-credit", "credit-committee", "md",
  "collections", "compliance", "admin",
] as const;
export type RealmRole = (typeof REALM_ROLES)[number];

export const ROLE_LABEL: Record<RealmRole, string> = {
  "branch-officer": "Branch Officer (L1)",
  "branch-manager": "Branch Manager (L2)",
  "regional-manager": "Regional Manager (L3)",
  "divisional-head": "Divisional Head (L4)",
  "credit-analyst": "Credit Analyst",
  "ho-credit": "Head of Credit (L5)",
  "credit-committee": "Credit Committee (L6)",
  md: "Managing Director (L7)",
  collections: "Collections Officer",
  compliance: "Compliance Officer",
  admin: "Platform Administrator",
};

/** URL-gate staff set — mirror of SecurityConfig.STAFF_ROLES. */
export const STAFF_ROLES: ReadonlySet<string> = new Set([
  "branch-officer", "branch-manager", "credit-analyst", "ho-credit",
  "collections", "compliance", "admin",
]);

/** Approval ladder — mirror of ApprovalService.ROLE_TO_LADDER. */
export const ROLE_TO_LADDER: Readonly<Record<string, string>> = {
  "branch-officer": "ladder-1",
  "branch-manager": "ladder-2",
  "regional-manager": "ladder-3",
  "divisional-head": "ladder-4",
  "ho-credit": "ladder-5",
  "credit-committee": "ladder-6",
  md: "ladder-7",
};

/** Sitemap area visibility (UI-level; the API remains the enforcer). */
export const AREA_ROLES: Record<string, ReadonlySet<string>> = {
  A: STAFF_ROLES,                                                        // Customer & Onboarding
  B: STAFF_ROLES,                                                        // Loan Origination
  C: new Set(["credit-analyst", "ho-credit", "admin"]),                  // Credit Assessment
  D: new Set([...Object.keys(ROLE_TO_LADDER), "admin"]),                 // Approval & Disbursement
  E: STAFF_ROLES,                                                        // Servicing & Payments
  F: new Set(["collections", "compliance", "admin"]),                    // Monitoring & Collections
  G: new Set(["branch-manager", "regional-manager", "divisional-head", "credit-analyst",
              "ho-credit", "credit-committee", "md", "compliance", "admin"]), // Insight & Compliance
  H: new Set(["admin"]),                                                 // Platform & Admin
};

/** System-link visibility (sitemap ⚙ zone). */
export const SYSTEM_LINK_ROLES: Record<string, ReadonlySet<string>> = {
  "/reports": STAFF_ROLES,
  "/regcon": new Set(["compliance", "admin"]),
  "/classification": new Set(["collections", "compliance", "admin"]),
  "/directory": STAFF_ROLES,
  "/coverage": new Set(["ho-credit", "compliance", "md", "admin"]),
  "/portal": STAFF_ROLES,
  "/screen/C3-s1": new Set(["collections", "branch-officer", "branch-manager", "admin"]),
  "/designsystem": STAFF_ROLES,
  "/shortcuts": STAFF_ROLES,
  "/settings": new Set(["admin"]),
};

export type Roles = readonly string[];

export const isStaff = (roles: Roles): boolean => roles.some((r) => STAFF_ROLES.has(r));
export const isAdmin = (roles: Roles): boolean => roles.includes("admin");

/** Normalize a rung identifier — backend says "ladder-3", leaner payloads say "L3". */
export function rungKey(x: string): string {
  return x.replace(/^ladder-/i, "").replace(/^l/i, "").toUpperCase();
}

/** Can act on an approval task assigned to `assigneeRole` (ladder-3 / L3)? */
export function canApprove(roles: Roles, assigneeRole: string | null | undefined): boolean {
  if (!assigneeRole) return false;
  if (isAdmin(roles)) return true;
  const rung = rungKey(assigneeRole);
  return roles.some((r) => ROLE_TO_LADDER[r] && rungKey(ROLE_TO_LADDER[r]) === rung);
}

/** Ladder rungs this session can act on (drives the approvals inbox). */
export function ladderRoles(roles: Roles): string[] {
  const out = roles.map((r) => ROLE_TO_LADDER[r]).filter((x): x is string => !!x);
  if (isAdmin(roles)) out.push("admin");   // admin sees every rung (controller parity)
  return out;
}

/** Disbursement dual-auth writes (credit operations). */
export const DISBURSEMENT_WRITE: ReadonlySet<string> =
  new Set(["branch-manager", "regional-manager", "ho-credit", "admin"]);
/** Regulatory sign-off chain (preparer→checker→compliance). */
export const REGCON_SIGNOFF: ReadonlySet<string> = new Set(["compliance", "admin"]);
/** Collections workbench write actions — mirrors Java WriteOffController
 *  propose gate: hasAnyRole(collections, compliance, admin). */
export const COLLECTIONS_WRITE: ReadonlySet<string> = new Set(["collections", "compliance", "admin"]);
/** Platform settings mutations (maker-checker applies server-side too). */
export const SETTINGS_WRITE: ReadonlySet<string> = new Set(["admin"]);

/** Dev personas for mock/token modes (login screen + role-switcher). */
export interface Persona { id: string; label: string; officer: string; roles: RealmRole[] }
export const DEV_PERSONAS: Persona[] = [
  { id: "officer", label: "Branch Officer — L1, branch scope", officer: "r.islam", roles: ["branch-officer"] },
  { id: "manager", label: "Branch Manager — L2 approvals", officer: "a.rahman", roles: ["branch-manager"] },
  { id: "regional", label: "Regional Manager — L3", officer: "s.chowdhury", roles: ["regional-manager"] },
  { id: "analyst", label: "Credit Analyst — assessments", officer: "f.akter", roles: ["credit-analyst"] },
  { id: "collections", label: "Collections Officer — workbench", officer: "s.mia", roles: ["collections"] },
  { id: "compliance", label: "Compliance Officer — regcon/EOD", officer: "k.chowdhury", roles: ["compliance"] },
  { id: "admin", label: "Administrator — full access", officer: "admin", roles: ["admin"] },
  { id: "allda", label: "R. Islam (dev) — all staff roles", officer: "r.islam", roles: [...REALM_ROLES] },
];
