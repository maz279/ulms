package com.uslbd.ulms.platform;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * OIDC resource server (PLANNING/06 §1). Actuator health is public for probes;
 * everything else requires a Keycloak-issued JWT. Keycloak realm roles arrive
 * in `realm_access.roles` (NOT `scope`) — mapped to ROLE_ authorities so
 * @PreAuthorize("hasAnyRole(...)") works.
 *
 * <p>Two-layer model (P5 audit F2/F6): (1) URL layer — every staff-data
 * prefix below requires a STAFF role, so a borrower token (or any future
 * narrower client) is denied by default even on endpoints added later without
 * their own @PreAuthorize; the method layer then narrows further where the
 * role table does. (2) actuator prometheus is admin-only — health/info stay
 * public for probes. Branch-scope row filters: see BranchScope comments.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /** 06 §1 staff role vocabulary — every role trusted with customer data. */
    static final String STAFF_ROLES =
            "hasAnyRole('branch-officer','branch-manager','credit-analyst','ho-credit','collections','compliance','admin')";

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter realmRoles = new JwtAuthenticationConverter();
        realmRoles.setJwtGrantedAuthoritiesConverter(new RealmRolesAuthorities());
        http
            .csrf(csrf -> csrf.disable())                    // pure API, bearer-token auth
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/actuator/prometheus").hasRole("admin")   // P5 F6: metrics are admin-only
                .requestMatchers("/hooks/**").permitAll()   // rails cannot mint JWTs — HMAC IS the auth (05 §7)
                // P5 F2: staff-data prefixes default-deny non-staff roles (incl. borrower)
                .requestMatchers("/api/v1/customers/**", "/api/v1/applications/**",
                                 "/api/v1/assessments/**", "/api/v1/loans/**",
                                 "/api/v1/collections/**", "/api/v1/disbursements/**",
                                 "/api/v1/approvals/**", "/api/v1/certificates/**")
                .access(new org.springframework.security.web.access.expression.WebExpressionAuthorizationManager(STAFF_ROLES))
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(realmRoles)));
        return http.build();
    }

    /** realm_access.roles → ROLE_xxx (06 §1 role vocabulary). */
    static final class RealmRolesAuthorities
            implements Converter<Jwt, Collection<GrantedAuthority>> {
        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Object realmAccess = jwt.getClaims().get("realm_access");
            if (!(realmAccess instanceof Map<?, ?> map) || !(map.get("roles") instanceof List<?> roles)) {
                return List.of();
            }
            return roles.stream()
                    .filter(String.class::isInstance)
                    .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r))
                    .toList();
        }
    }
}
