package com.uslbd.ulms.platform;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JWT principal helpers (PLANNING/06 §1): the audit actor is ALWAYS the token
 * subject — a client-supplied actor string is never trusted. Roles are the
 * Keycloak realm roles (mapped to ROLE_ authorities by SecurityConfig).
 */
public final class AuthPrincipal {

    private AuthPrincipal() {}

    public static String actorOf(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return "user:" + jwt.getSubject();
        }
        return "user:anonymous";   // dev fallback; branch-scope filter rejects before here in prod
    }

    public static String actorOf() {
        return actorOf(SecurityContextHolder.getContext().getAuthentication());
    }

    /** Realm roles with the ROLE_ prefix stripped (ladder gate input). */
    public static Set<String> rolesOf(Authentication auth) {
        if (auth == null) return Set.of();
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .collect(Collectors.toUnmodifiableSet());
    }

    /** Request id rides the token claim set by the gateway, else fresh per call. */
    public static UUID requestIdOf(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            Object rid = jwt.getClaims().get("request_id");
            if (rid instanceof String s && !s.isBlank()) return UUID.fromString(s);
        }
        return UUID.randomUUID();
    }

    // ── branch scope (06 §1: roles + branch claim; P5 audit F4) ─────────────

    /** Roles exempt from branch scoping — head-office vantage (06 §1). */
    static final Set<String> BRANCH_SCOPE_EXEMPT = Set.of("admin", "compliance", "ho-credit");

    /** The caller's branch_code claim (Keycloak user attribute mapper), or null. */
    public static String branchCodeOf(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            Object branch = jwt.getClaims().get("branch_code");
            if (branch instanceof String s && !s.isBlank()) return s;
        }
        return null;
    }

    /**
     * Branch-scope decision for list/detail endpoints (P5 audit F4): HO roles
     * see the whole book; a branch-scoped role MUST carry a branch_code claim
     * (missing claim on a branch role = misconfigured principal → 403), and is
     * then restricted to that branch; a null result means "no restriction"
     * (branch scoping disabled by config).
     */
    public static String requiredBranchOf(Authentication auth, boolean branchScopeRequired) {
        if (!branchScopeRequired) return null;
        Set<String> roles = rolesOf(auth);
        if (roles.stream().anyMatch(BRANCH_SCOPE_EXEMPT::contains)) return null;
        boolean branchScoped = roles.contains("branch-officer") || roles.contains("branch-manager");
        if (!branchScoped) return null;   // central teams (credit/collections) see the book
        String branch = branchCodeOf(auth);
        if (branch == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "branch-scoped role without a branch_code claim — principal misconfigured (06 §1)");
        }
        return branch;
    }

    /** Throwing form used by controllers that have the Authentication handy. */
    public static String requireBranchFor(boolean branchScopeRequired) {
        return requiredBranchOf(SecurityContextHolder.getContext().getAuthentication(),
                branchScopeRequired);
    }
}
