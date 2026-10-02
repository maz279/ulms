# ULMS ZAP baseline scan plan (R8 — OWASP ZAP in CI)

Baseline (passive + limited active) scan of the staging URL on every main
pipeline; full scan is a scheduled pre-G5 drill. Auth: service token from
CI secret store.

## CI job shape (gitlab-ci stage: security)
```yaml
zap-baseline:
  stage: security
  image: softwaresecurityproject/zap2docker-stable:2.16.0
  script:
    - zap-baseline.py -t https://ulms-staging.bank.local
        -c deploy/security/zap-rules.conf
        -r zap-report.html -I
  artifacts:
    paths: [zap-report.html]
    when: always
  rules: [{ if: $CI_COMMIT_BRANCH == "main" }]
```

## Fail rules (`zap-rules.conf`)
Only rules that matter for a bank API+SPA baseline FAIL the build; the rest
are INFO (tuned to avoid static-SPA noise):
- 10015: "Incomplete or no cache-control and pragma HTTP header" — WARN (SPA assets)
- 10038: "Content Security Policy" — FAIL (must be set on web)
- 10063: "Permissions Policy Header" — WARN
- 10096: "Timestamp - Relative Paths" — WARN
- 10098: "Cross-Domain Misconfiguration" — FAIL (no wildcard CORS)
- 10202: "Anti-CSRF Tokens" — WARN (token-based API, N/A)
- 3: "Session cookie without HttpOnly" — FAIL
- 10035: "Strict-Transport-Security" — FAIL (bank TLS requirement)
- 10017: "Big Redirect Detected" — WARN

## Full-scan drill (pre-G5)
`zap-full-scan.py` with the authenticated context (staff login via the
service account; excluded URLs: /hooks/* — HMAC-verified webhooks reject
scanner traffic by design and would false-positive 401s).
