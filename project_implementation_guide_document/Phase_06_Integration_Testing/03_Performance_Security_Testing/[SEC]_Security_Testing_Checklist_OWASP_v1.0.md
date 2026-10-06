**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Security Testing Checklist - OWASP |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Security Lead, Unisoft Systems Limited |
| **Reviewed By** | CISO |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Security Lead | Initial version |

---

# Security Testing Checklist - OWASP

## Table of Contents

1. [Introduction](#1-introduction)
2. [OWASP Top 10 Checklist](#2-owasp-top-10-checklist)
3. [Authentication Testing](#3-authentication-testing)
4. [Authorization Testing](#4-authorization-testing)
5. [Input Validation Testing](#5-input-validation-testing)
6. [Cryptography Testing](#6-cryptography-testing)
7. [API Security Testing](#7-api-security-testing)
8. [Infrastructure Security](#8-infrastructure-security)
9. [Tools and Automation](#9-tools-and-automation)
10. [Remediation Guidelines](#10-remediation-guidelines)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive security testing checklist based on OWASP Top 10 2021 for ULMS v2.0. It ensures the system meets Bangladesh Bank ICT Security Guidelines V4.0 and international security standards.

### 1.2 Scope

- Web application security
- API security
- Mobile application security
- Infrastructure security
- Database security

---

## 2. OWASP Top 10 Checklist

### 2.1 A01:2021 – Broken Access Control

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A01-001 | Verify role-based access control | Manual + Automated | OWASP ZAP | Critical |
| A01-002 | Test for insecure direct object references | Manual | Burp Suite | Critical |
| A01-003 | Verify JWT token validation | Automated | JWT_Tool | Critical |
| A01-004 | Test CORS configuration | Automated | OWASP ZAP | High |
| A01-005 | Verify session timeout | Manual | Browser DevTools | High |
| A01-006 | Test privilege escalation | Manual | Custom Scripts | Critical |
| A01-007 | Verify URL access controls | Automated | OWASP ZAP | High |
| A01-008 | Test API authorization | Automated | REST Assured | Critical |

```java
// Test: Verify role-based access control
@Test
public void testRoleBasedAccess() {
    // Test RM cannot access admin endpoints
    String rmToken = authenticate("relationship_manager", "password");
    given()
        .header("Authorization", "Bearer " + rmToken)
    .when()
        .get("/api/admin/users")
    .then()
        .statusCode(403);
    
    // Test admin can access
    String adminToken = authenticate("admin", "password");
    given()
        .header("Authorization", "Bearer " + adminToken)
    .when()
        .get("/api/admin/users")
    .then()
        .statusCode(200);
}
```

### 2.2 A02:2021 – Cryptographic Failures

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A02-001 | Verify TLS 1.3 configuration | Automated | SSL Labs | Critical |
| A02-002 | Test certificate validity | Automated | OpenSSL | Critical |
| A02-003 | Verify password hashing (bcrypt) | Manual | Code Review | Critical |
| A02-004 | Test sensitive data encryption | Manual | Code Review | Critical |
| A02-005 | Verify key management | Manual | Audit | Critical |
| A02-006 | Test for hardcoded secrets | Automated | GitLeaks | High |
| A02-007 | Verify database encryption at rest | Manual | AWS/Azure CLI | High |

```bash
# Test: Verify TLS 1.3 configuration
nmap --script ssl-enum-ciphers -p 443 ulms.bank.com

# Test certificate
echo | openssl s_client -servername ulms.bank.com -connect ulms.bank.com:443 2>/dev/null | openssl x509 -noout -dates

# Check for weak ciphers
testssl.sh ulms.bank.com
```

### 2.3 A03:2021 – Injection

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A03-001 | Test SQL injection | Automated | sqlmap | Critical |
| A03-002 | Test NoSQL injection | Manual | Custom Scripts | High |
| A03-003 | Test command injection | Automated | OWASP ZAP | High |
| A03-004 | Test LDAP injection | Manual | Custom Scripts | Medium |
| A03-005 | Verify parameterized queries | Manual | Code Review | Critical |
| A03-006 | Test for XSS | Automated | OWASP ZAP | Critical |

```bash
# SQL Injection Testing with sqlmap
sqlmap -u "https://ulms.bank.com/api/loans?loanId=1" \
  --cookie="session=xxx" \
  --level=5 \
  --risk=3 \
  --batch

# Test specific parameter
sqlmap -u "https://ulms.bank.com/api/loans/search" \
  --data="borrowerName=test" \
  -p borrowerName \
  --dump
```

### 2.4 A04:2021 – Insecure Design

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A04-001 | Verify rate limiting | Manual | Custom Scripts | High |
| A04-002 | Test business logic flaws | Manual | Custom Scripts | High |
| A04-003 | Verify idempotency | Manual | REST Assured | High |
| A04-004 | Test race conditions | Manual | Custom Scripts | Medium |
| A04-005 | Verify secure design patterns | Manual | Code Review | High |

### 2.5 A05:2021 – Security Misconfiguration

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A05-001 | Scan for security headers | Automated | OWASP ZAP | High |
| A05-002 | Verify error handling | Manual | Browser | High |
| A05-003 | Test default configurations | Manual | Configuration Review | High |
| A05-004 | Verify unnecessary features | Manual | Code Review | Medium |
| A05-005 | Test directory listing | Automated | dirb | Medium |
| A05-006 | Verify cloud security posture | Automated | Prowler/ScoutSuite | High |

```bash
# Security Headers Check
curl -I https://ulms.bank.com | grep -i "strict-transport-security\|x-content-type-options\|x-frame-options\|content-security-policy"

# Directory Enumeration
gobuster dir -u https://ulms.bank.com -w /usr/share/wordlists/dirb/common.txt
```

### 2.6 A06:2021 – Vulnerable and Outdated Components

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A06-001 | Scan dependencies | Automated | OWASP Dependency-Check | Critical |
| A06-002 | Check for known CVEs | Automated | Snyk | Critical |
| A06-003 | Verify component versions | Automated | npm audit / gradle dependencyCheck | High |
| A06-004 | Test for unused dependencies | Automated | Retire.js | Medium |

```bash
# Dependency Check for Java
./gradlew dependencyCheckAnalyze

# NPM Audit for Frontend
cd frontend && npm audit --audit-level=high

# OWASP Dependency Check
dependency-check.sh --project ULMS --scan ./ --format HTML
```

### 2.7 A07:2021 – Identification and Authentication Failures

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A07-001 | Test brute force protection | Manual | Hydra | Critical |
| A07-002 | Verify MFA implementation | Manual | Browser | Critical |
| A07-003 | Test password policy | Manual | Custom Scripts | High |
| A07-004 | Test session management | Automated | OWASP ZAP | Critical |
| A07-005 | Verify secure password recovery | Manual | Browser | High |
| A07-006 | Test for credential stuffing | Manual | Custom Scripts | High |

```java
// Test: Brute Force Protection
@Test
public void testBruteForceProtection() {
    String username = "testuser";
    
    // Attempt 5 failed logins
    for (int i = 0; i < 5; i++) {
        given()
            .contentType(ContentType.JSON)
            .body("{\"username\": \"" + username + "\", \"password\": \"wrong\"}")
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }
    
    // 6th attempt should be blocked
    given()
        .contentType(ContentType.JSON)
        .body("{\"username\": \"" + username + "\", \"password\": \"correct\"}")
    .when()
        .post("/api/auth/login")
    .then()
        .statusCode(429); // Too Many Requests
}
```

### 2.8 A08:2021 – Software and Data Integrity Failures

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A08-001 | Verify CSRF protection | Automated | OWASP ZAP | Critical |
| A08-002 | Test deserialization attacks | Manual | ysoserial | High |
| A08-003 | Verify integrity checks | Manual | Code Review | High |
| A08-004 | Test for SSRF | Automated | Burp Suite | High |
| A08-005 | Verify CI/CD security | Manual | Audit | High |

### 2.9 A09:2021 – Security Logging and Monitoring Failures

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A09-001 | Verify audit logging | Manual | Log Review | Critical |
| A09-002 | Test log tampering protection | Manual | File Integrity | High |
| A09-003 | Verify security event alerting | Manual | Test Events | High |
| A09-004 | Test incident response | Manual | Tabletop Exercise | High |
| A09-005 | Verify log retention | Manual | Policy Review | High |

### 2.10 A10:2021 – Server-Side Request Forgery (SSRF)

| ID | Test | Method | Tool | Priority |
|----|------|--------|------|----------|
| A10-001 | Test for SSRF in URL parameters | Manual | Burp Suite | High |
| A10-002 | Verify URL validation | Manual | Custom Scripts | High |
| A10-003 | Test internal resource access | Manual | Custom Scripts | High |

---

## 3. Authentication Testing

### 3.1 Authentication Checklist

```markdown
## Authentication Security Checklist

### Password Security
- [ ] Minimum length 12 characters
- [ ] Complexity requirements (upper, lower, number, special)
- [ ] Password history enforced (last 12 passwords)
- [ ] bcrypt/Argon2 hashing with salt
- [ ] No password in logs or error messages

### Session Management
- [ ] Secure, httpOnly, SameSite cookies
- [ ] Session timeout after 30 minutes idle
- [ ] Absolute timeout after 8 hours
- [ ] Secure session ID generation (128-bit minimum)
- [ ] Session invalidation on logout

### Multi-Factor Authentication
- [ ] MFA available for all users
- [ ] Mandatory for privileged accounts
- [ ] TOTP or hardware token support
- [ ] Backup codes provided
- [ ] MFA bypass requires approval

### Login Security
- [ ] Account lockout after 5 failed attempts
- [ ] Progressive delays between attempts
- [ ] CAPTCHA after 3 failed attempts
- [ ] Login notifications via email/SMS
- [ ] Concurrent session limits
```

---

## 4. Authorization Testing

### 4.1 RBAC Testing Matrix

| Role | Create Loan | Approve Loan | View All Loans | Admin Functions |
|------|-------------|--------------|----------------|-----------------|
| Relationship Manager | Yes | No | No (own only) | No |
| Credit Officer | Yes | Yes (< 5M) | Yes (branch) | No |
| Branch Manager | Yes | Yes (< 50M) | Yes (branch) | Limited |
| CMU Officer | View Only | Yes (all) | Yes (all) | No |
| Admin | No | No | Yes (all) | Yes |

### 4.2 Horizontal Privilege Escalation Test

```java
@Test
public void testHorizontalPrivilegeEscalation() {
    // Login as RM1
    String rm1Token = authenticate("rm1", "password");
    
    // Create a loan
    String loanId = createLoan(rm1Token);
    
    // Login as RM2 (different branch)
    String rm2Token = authenticate("rm2", "password");
    
    // Try to access RM1's loan
    given()
        .header("Authorization", "Bearer " + rm2Token)
    .when()
        .get("/api/loans/" + loanId)
    .then()
        .statusCode(403) // Should be forbidden
        .body("error", containsString("Access denied"));
}
```

---

## 5. Input Validation Testing

### 5.1 Input Validation Matrix

| Field | Type | Min | Max | Pattern | Sanitization |
|-------|------|-----|-----|---------|--------------|
| NID | Numeric | 10 | 17 | ^\d{10,17}$ | Digits only |
| Mobile | Numeric | 11 | 11 | ^01[3-9]\d{8}$ | Digits only |
| Loan Amount | Decimal | 50000 | 999999999 | ^\d+(\.\d{1,2})?$ | Numeric |
| Email | String | 5 | 100 | RFC 5322 | HTML encode |
| Name | String | 2 | 100 | [\p{L}\s.-] | HTML encode |

### 5.2 XSS Testing

```java
@Test
public void testXSSPrevention() {
    String xssPayload = "<script>alert('xss')</script>";
    
    given()
        .contentType(ContentType.JSON)
        .body("{\"borrowerName\": \"" + xssPayload + "\"}")
    .when()
        .post("/api/loans")
    .then()
        .statusCode(400)
        .body(not(containsString("<script>")));
    
    // Verify stored data is sanitized
    String loanId = createLoanWithName("Test User");
    given()
        .get("/api/loans/" + loanId)
    .then()
        .body("borrowerName", not(containsString("<")));
}
```

---

## 6. Cryptography Testing

### 6.1 Cryptography Checklist

```markdown
## Cryptography Security Checklist

### Transport Layer
- [ ] TLS 1.3 enforced
- [ ] HSTS header with max-age 31536000
- [ ] No weak cipher suites
- [ ] Perfect Forward Secrecy enabled
- [ ] Certificate pinning for mobile apps

### Data at Rest
- [ ] AES-256 encryption for sensitive fields
- [ ] Database TDE enabled
- [ ] Key rotation every 90 days
- [ ] HSM or KMS for key storage
- [ ] Encrypted backups

### Passwords
- [ ] bcrypt with work factor 12+
- [ ] Unique salt per password
- [ ] Pepper value stored separately
- [ ] No plaintext password storage

### Tokens
- [ ] JWT signed with RS256
- [ ] Short-lived access tokens (15 min)
- [ ] Refresh tokens with rotation
- [ ] Secure token storage
```

---

## 7. API Security Testing

### 7.1 API Security Checklist

| Test | Method | Expected Result |
|------|--------|-----------------|
| Rate Limiting | Send 1000 req/min | 429 status after limit |
| Content-Type | Send XML to JSON endpoint | 415 Unsupported Media |
| Content-Length | Send 100MB payload | 413 Payload Too Large |
| HTTP Methods | Try TRACE, PUT, DELETE | 405 Method Not Allowed |
| Authentication | Missing/Invalid token | 401 Unauthorized |
| Authorization | Access other user's data | 403 Forbidden |
| SQL Injection | loanId=1' OR '1'='1 | 400 Bad Request |
| Mass Assignment | Send extra fields | Fields ignored |

---

## 8. Infrastructure Security

### 8.1 Kubernetes Security

```yaml
# Security Context Example
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: ulms-api
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      resources:
        limits:
          memory: "512Mi"
          cpu: "500m"
```

### 8.2 Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ulms-api-policy
spec:
  podSelector:
    matchLabels:
      app: ulms-api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
```

---

## 9. Tools and Automation

### 9.1 Security Testing Tool Stack

| Category | Tool | Purpose |
|----------|------|---------|
| DAST | OWASP ZAP | Dynamic scanning |
| DAST | Burp Suite | Manual testing |
| SAST | SonarQube | Code analysis |
| SAST | Semgrep | Pattern matching |
| SCA | Snyk | Dependency scanning |
| SCA | OWASP Dependency-Check | CVE detection |
| Secrets | GitLeaks | Secret detection |
| Secrets | TruffleHog | Secret scanning |
| Container | Trivy | Image scanning |
| IaC | Checkov | Terraform/K8s scanning |

### 9.2 CI/CD Security Pipeline

```yaml
# .github/workflows/security.yml
name: Security Testing

on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        with:
          scanMetadataReportFile: .scannerwork/report-task.txt

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Snyk Security Scan
        uses: snyk/actions/gradle@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  dast:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.7.0
        with:
          target: 'https://ulms-staging.bank.com'

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Secret Detection
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
```

---

## 10. Remediation Guidelines

### 10.1 Severity Levels

| Severity | CVSS Score | Response Time |
|----------|------------|---------------|
| Critical | 9.0-10.0 | 24 hours |
| High | 7.0-8.9 | 7 days |
| Medium | 4.0-6.9 | 30 days |
| Low | 0.1-3.9 | 90 days |

### 10.2 Remediation Template

```markdown
## Security Vulnerability Remediation

### Vulnerability Details
- **ID**: [Vuln-ID]
- **Severity**: [Critical/High/Medium/Low]
- **OWASP Category**: [A01-A10]
- **Component**: [Component]

### Description
[Brief description of the vulnerability]

### Impact
[Description of potential impact]

### Remediation
[Steps to fix the vulnerability]

### Verification
[How to verify the fix]

### References
- [Link to OWASP guidance]
- [Link to CWE entry]
```

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[SEC]_Penetration_Testing_Plan_v1.0.md` | Penetration testing approach |
| `[SEC]_Data_Encryption_Validation_v1.0.md` | Encryption testing |
| `../Technology_Stack_Recommendation_v2.md` | Security architecture |

---

**Document Owner:** Security Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
