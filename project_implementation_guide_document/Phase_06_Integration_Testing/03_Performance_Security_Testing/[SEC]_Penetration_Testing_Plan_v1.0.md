**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Penetration Testing Plan |
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

# Penetration Testing Plan

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope and Objectives](#2-scope-and-objectives)
3. [Testing Methodology](#3-testing-methodology)
4. [Tools and Resources](#4-tools-and-resources)
5. [Test Scenarios](#5-test-scenarios)
6. [Reporting Template](#6-reporting-template)
7. [Remediation Process](#7-remediation-process)
8. [Related Documents](#8-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines the penetration testing approach for ULMS v2.0, ensuring the system can withstand real-world cyber attacks and meets Bangladesh Bank security requirements.

### 1.2 Engagement Rules

| Rule | Description |
|------|-------------|
| **Authorization** | Written approval from CIO and CISO required |
| **Scope** | Only systems defined in scope |
| **Business Hours** | Testing during off-peak hours (8 PM - 6 AM) |
| **Data Protection** | No production PII exfiltration |
| **Communication** | Daily status calls with security team |
| **Emergency Stop** | Immediate halt capability |

---

## 2. Scope and Objectives

### 2.1 In-Scope Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PENETRATION TESTING SCOPE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   APPLICATION LAYER                                                          │
│   ✓ ULMS Web Application (https://ulms.bank.com)                            │
│   ✓ Mobile Application (iOS/Android)                                         │
│   ✓ API Gateway (Kong)                                                       │
│   ✓ Microservices (Loan, Payment, CIB, NID)                                  │
│                                                                              │
│   INFRASTRUCTURE LAYER                                                       │
│   ✓ Kubernetes Cluster                                                       │
│   ✓ PostgreSQL Database                                                      │
│   ✓ Redis Cache                                                              │
│   ✓ Kafka Message Queue                                                      │
│                                                                              │
│   NETWORK LAYER                                                              │
│   ✓ External Perimeter                                                       │
│   ✓ Internal Network Segmentation                                            │
│                                                                              │
│   OUT OF SCOPE                                                               │
│   ✗ Core Banking System (CBS)                                               │
│   ✗ Bangladesh Bank Infrastructure                                          │
│   ✗ Third-party payment gateways (bKash/Nagad)                              │
│   ✗ Physical security                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Test Objectives

| Objective | Target |
|-----------|--------|
| Identify vulnerabilities | OWASP Top 10 coverage |
| Assess business impact | Critical risk identification |
| Test detection capability | SOC alert validation |
| Validate controls | Security control effectiveness |
| Compliance verification | Bangladesh Bank requirements |

---

## 3. Testing Methodology

### 3.1 PTES Methodology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PENETRATION TESTING EXECUTION STANDARD                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase 1: Pre-Engagement                                                    │
│   ├── Scope definition                                                       │
│   ├── Rules of engagement                                                    │
│   ├── Legal agreements                                                       │
│   └── Communication plan                                                     │
│                                                                              │
│   Phase 2: Intelligence Gathering                                            │
│   ├── Open source intelligence                                               │
│   ├── Network discovery                                                      │
│   └── Application mapping                                                    │
│                                                                              │
│   Phase 3: Threat Modeling                                                   │
│   ├── Asset classification                                                   │
│   ├── Threat actor analysis                                                  │
│   └── Attack surface mapping                                                 │
│                                                                              │
│   Phase 4: Vulnerability Analysis                                            │
│   ├── Automated scanning                                                     │
│   ├── Manual verification                                                    │
│   └── False positive elimination                                             │
│                                                                              │
│   Phase 5: Exploitation                                                      │
│   ├── Proof of concept development                                           │
│   ├── Privilege escalation                                                   │
│   └── Pivot testing                                                          │
│                                                                              │
│   Phase 6: Post-Exploitation                                                 │
│   ├── Data access assessment                                                 │
│   ├── Persistence testing                                                    │
│   └── Lateral movement                                                       │
│                                                                              │
│   Phase 7: Reporting                                                         │
│   ├── Executive summary                                                      │
│   ├── Technical findings                                                     │
│   └── Remediation roadmap                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Testing Phases

| Phase | Duration | Activities |
|-------|----------|------------|
| Reconnaissance | 2 days | OSINT, network mapping |
| Scanning | 3 days | Vulnerability scanning |
| Exploitation | 5 days | Manual testing, PoC |
| Post-Exploitation | 3 days | Lateral movement |
| Reporting | 2 days | Report preparation |

---

## 4. Tools and Resources

### 4.1 Tool Inventory

| Category | Tool | Version | Purpose |
|----------|------|---------|---------|
| **Network** | Nmap | 7.94 | Port scanning |
| **Network** | Masscan | 1.3.2 | Mass port scanning |
| **Web** | Burp Suite | 2023.x | Web proxy, manual testing |
| **Web** | OWASP ZAP | 2.14 | Automated scanning |
| **Web** | SQLMap | 1.7 | SQL injection testing |
| **Mobile** | MobSF | 3.7 | Mobile app analysis |
| **Mobile** | Frida | 16.x | Runtime manipulation |
| **Infrastructure** | Nessus | 10.7 | Vulnerability scanning |
| **Infrastructure** | Metasploit | 6.3 | Exploitation framework |
| **Wireless** | Aircrack-ng | 1.7 | WiFi testing (if in scope) |
| **Social** | Gophish | Latest | Phishing simulation |

### 4.2 Testing Environment

```yaml
# Kali Linux Testing Environment
environment:
  os: Kali Linux 2023.4
  resources:
    cpu: 8 cores
    memory: 16 GB
    disk: 100 GB SSD
  
  networking:
    vpn: OpenVPN to target network
    proxy: Burp Suite proxy
    dns: Custom DNS for testing
  
  tools:
    preinstalled:
      - nmap
      - metasploit-framework
      - burpsuite
      - sqlmap
      - nikto
      - dirb
      - gobuster
      - hydra
      - john
      - hashcat
```

---

## 5. Test Scenarios

### 5.1 Web Application Testing

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| WEB-001 | Authentication Bypass | Test for authentication weaknesses | 401/403 responses |
| WEB-002 | Session Hijacking | Test session fixation, prediction | Session invalidation |
| WEB-003 | SQL Injection | Test all input vectors | Parameterized queries |
| WEB-004 | XSS | Reflected, Stored, DOM XSS | Output encoding |
| WEB-005 | CSRF | Cross-site request forgery | Token validation |
| WEB-006 | File Upload | Malicious file uploads | Type validation |
| WEB-007 | IDOR | Insecure direct object references | Authorization checks |
| WEB-008 | Business Logic | Workflow bypass attempts | Business rules enforced |

### 5.2 API Testing

```bash
#!/bin/bash
# api-pentest.sh

TARGET="https://ulms-api.bank.com"
TOKEN=""

# Test 1: JWT Token Analysis
echo "[*] Testing JWT tokens..."
jwt_tool.py "$TOKEN" -t

# Test 2: Rate Limiting
echo "[*] Testing rate limiting..."
for i in {1..100}; do
    curl -s "$TARGET/api/loans" -H "Authorization: Bearer $TOKEN" &
done
wait

# Test 3: Mass Assignment
echo "[*] Testing mass assignment..."
curl -X POST "$TARGET/api/loans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 100000,
    "status": "APPROVED",
    "approvedBy": "attacker"
  }'

# Test 4: SQL Injection
echo "[*] Testing SQL injection..."
sqlmap -u "$TARGET/api/loans?id=1" \
  --headers="Authorization: Bearer $TOKEN" \
  --level=5 --risk=3 --batch

# Test 5: IDOR
echo "[*] Testing IDOR..."
for id in {1..100}; do
    curl -s "$TARGET/api/loans/LOAN-$id" \
      -H "Authorization: Bearer $TOKEN" \
      -w "%{http_code}\n" | grep -v "403"
done
```

### 5.3 Infrastructure Testing

```bash
#!/bin/bash
# infrastructure-pentest.sh

TARGET_RANGE="10.0.0.0/24"
TARGET_HOST="ulms-app.bank.internal"

# Phase 1: Network Discovery
echo "[*] Network discovery..."
nmap -sn $TARGET_RANGE -oG live_hosts.txt

# Phase 2: Port Scanning
echo "[*] Port scanning..."
nmap -sS -sV -O -p- --script vuln \
  -iL live_hosts.txt \
  -oA nmap_full_scan

# Phase 3: Service Enumeration
echo "[*] Service enumeration..."
nmap -sV --script banner,ssl-enum-ciphers \
  -p 80,443,8080,8443,5432,6379,9092 \
  $TARGET_HOST

# Phase 4: Kubernetes Testing
echo "[*] Kubernetes security testing..."
# Check for exposed API
kubectl --server=https://$TARGET_HOST:6443 version 2>/dev/null

# Check etcd
etcdctl --endpoints=https://$TARGET_HOST:2379 \
  --cacert=ca.crt \
  --cert=client.crt \
  --key=client.key \
  get / --prefix --keys-only

# Phase 5: Container Testing
echo "[*] Container security testing..."
# Check for container escape
kubectl exec -it pod -- /bin/sh -c "cat /proc/self/cgroup"

# Check secrets
kubectl get secrets -o json | jq '.items[] | select(.data)'
```

### 5.4 Mobile Application Testing

```python
# mobile_pentest.py
import frida
import sys

def test_root_detection():
    """Test root/jailbreak detection"""
    device = frida.get_usb_device()
    pid = device.spawn(["com.unisoft.ulms"])
    session = device.attach(pid)
    
    script = session.create_script("""
    // Hook root detection functions
    Java.perform(function() {
        var RootCheck = Java.use("com.unisoft.ulms.security.RootCheck");
        RootCheck.isRooted.implementation = function() {
            console.log("[*] Root check bypassed");
            return false;
        };
    });
    """)
    script.load()
    device.resume(pid)

def test_certificate_pinning():
    """Test SSL certificate pinning"""
    device = frida.get_usb_device()
    session = device.attach("ULMS")
    
    script = session.create_script("""
    Java.perform(function() {
        // Bypass certificate pinning
        var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
        var SSLContext = Java.use('javax.net.ssl.SSLContext');
        
        var TrustManager = Java.registerClass({
            name: 'com.unisoft.TrustManager',
            implements: [X509TrustManager],
            methods: {
                checkClientTrusted: function() {},
                checkServerTrusted: function() {},
                getAcceptedIssuers: function() { return []; }
            }
        });
        
        var TrustManagers = [TrustManager.$new()];
        var SSLContext_init = SSLContext.init.overload(
            '[Ljavax.net.ssl.KeyManager;', 
            '[Ljavax.net.ssl.TrustManager;', 
            'java.security.SecureRandom'
        );
        
        SSLContext_init.implementation = function(km, tm, random) {
            console.log("[*] SSL Pinning bypassed");
            SSLContext_init.call(this, km, TrustManagers, random);
        };
    });
    """)
    script.load()

def test_hardcoded_secrets():
    """Test for hardcoded secrets in APK/IPA"""
    import subprocess
    
    # Extract APK
    subprocess.run(["apktool", "d", "ulms.apk", "-o", "ulms_decompiled"])
    
    # Search for secrets
    patterns = [
        r'api[_-]?key["\']?\s*[:=]\s*["\']?[\w-]+',
        r'secret["\']?\s*[:=]\s*["\']?[\w-]+',
        r'password["\']?\s*[:=]\s*["\']?[^\s"\']+',
        r'-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----'
    ]
    
    for pattern in patterns:
        result = subprocess.run(
            ["grep", "-r", "-i", "-E", pattern, "ulms_decompiled/"],
            capture_output=True, text=True
        )
        if result.stdout:
            print(f"[!] Potential secret found: {result.stdout}")

if __name__ == "__main__":
    test_root_detection()
    test_certificate_pinning()
    test_hardcoded_secrets()
```

---

## 6. Reporting Template

### 6.1 Executive Summary Template

```markdown
# Penetration Test Report - ULMS v2.0

## Executive Summary

**Engagement Period**: [Start Date] - [End Date]  
**Testers**: [Names]  
**Version**: 1.0

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | [X] | Immediate action required |
| High | [X] | Action within 7 days |
| Medium | [X] | Action within 30 days |
| Low | [X] | Action within 90 days |
| Informational | [X] | Best practice |

### Key Findings

1. **[Critical] SQL Injection in Loan Search**
   - Impact: Complete database compromise
   - Recommendation: Implement parameterized queries

2. **[High] Weak Authentication Controls**
   - Impact: Account takeover possible
   - Recommendation: Implement MFA

### Risk Matrix

```
     Impact
       │
   High│ ■ Critical ■ High
       │
Medium│ ■ Medium
       │
   Low│ ■ Low
       └────────────────────
          Low   Medium   High
                    Likelihood
```

### Remediation Priority

1. Immediate (24 hours): Critical vulnerabilities
2. Short-term (7 days): High vulnerabilities  
3. Medium-term (30 days): Medium vulnerabilities
4. Long-term (90 days): Low vulnerabilities
```

### 6.2 Technical Finding Template

```markdown
## Finding [ID]: [Title]

### Information
- **Severity**: [Critical/High/Medium/Low/Info]
- **CVSS Score**: [X.X]
- **Category**: [OWASP Category]
- **Affected Component**: [Component]

### Description
[Detailed description of the vulnerability]

### Evidence
```
[Proof of concept code/screenshots]
```

### Impact
[Business impact assessment]

### Remediation
[Step-by-step remediation instructions]

### References
- CWE-XXX: [Link]
- OWASP: [Link]
```

---

## 7. Remediation Process

### 7.1 Remediation Workflow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ IDENTIFY │───▶│ ASSESS   │───▶│  FIX     │───▶│  VERIFY  │
│          │    │ PRIORITY │    │          │    │          │
└──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘
                                     │               │
                                     ▼               ▼
                              ┌──────────┐    ┌──────────┐
                              │  DEPLOY  │    │  CLOSE   │
                              │  PATCH   │    │  TICKET  │
                              └──────────┘    └──────────┘
```

### 7.2 Remediation Timeline

| Severity | Fix Deadline | Verification Deadline |
|----------|--------------|----------------------|
| Critical | 24 hours | 48 hours |
| High | 7 days | 10 days |
| Medium | 30 days | 35 days |
| Low | 90 days | 100 days |

---

## 8. Related Documents

| Document | Purpose |
|----------|---------|
| `[SEC]_Security_Testing_Checklist_OWASP_v1.0.md` | OWASP testing checklist |
| `[SEC]_Data_Encryption_Validation_v1.0.md` | Encryption validation |

---

**Document Owner:** Security Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
