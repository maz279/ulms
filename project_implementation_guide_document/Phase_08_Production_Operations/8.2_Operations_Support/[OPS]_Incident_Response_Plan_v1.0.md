# Incident Response Plan

## ULMS v2.0 - Security Incident Management

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-IRP-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Confidential |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | CISO |
| Approver | CTO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Security Team | Initial draft | - |
| 0.5 | 2026-01-20 | Compliance | Added regulatory | - |
| 0.8 | 2026-01-28 | CISO | Final review | - |
| 1.0 | 2026-02-05 | CISO | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Incident Classification](#2-incident-classification)
3. [Incident Response Team](#3-incident-response-team)
4. [Response Procedures](#4-response-procedures)
5. [Communication Plan](#5-communication-plan)
6. [Evidence Preservation](#6-evidence-preservation)
7. [Recovery Procedures](#7-recovery-procedures)
8. [Post-Incident Activities](#8-post-incident-activities)
9. [Regulatory Reporting](#9-regulatory-reporting)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This Incident Response Plan (IRP) establishes procedures for detecting, responding to, and recovering from security incidents affecting the ULMS v2.0 system in compliance with Bangladesh banking regulations.

### 1.2 Scope
- Security breaches and unauthorized access
- Data loss or corruption
- Malware and ransomware attacks
- Denial of Service (DoS) attacks
- Insider threats
- Third-party security incidents

### 1.3 Regulatory Compliance
- Bangladesh Bank ICT Security Guidelines V4.0
- Bangladesh Bank Cyber Security Guidelines
- Money Laundering Prevention Act, 2012
- Digital Security Act, 2018

---

## 2. Incident Classification

### 2.1 Severity Levels

| Severity | Definition | Examples | Response Time |
|----------|------------|----------|---------------|
| **Critical (P1)** | System compromise, data breach | Ransomware, unauthorized root access | Immediate |
| **High (P2)** | Significant security impact | Malware infection, privilege escalation | 30 minutes |
| **Medium (P3)** | Limited security impact | Phishing attempt, port scan | 4 hours |
| **Low (P4)** | Minimal security impact | Failed login attempts, spam | 24 hours |

### 2.2 Incident Types

| Type | Description | Indicators |
|------|-------------|------------|
| **Unauthorized Access** | Unapproved system access | Unknown logins, unusual access patterns |
| **Data Breach** | Sensitive data exposure | Unusual data transfers, unauthorized exports |
| **Malware** | Malicious software | AV alerts, unusual process behavior |
| **DoS/DDoS** | Service disruption | Traffic spikes, resource exhaustion |
| **Insider Threat** | Malicious insider activity | Privilege abuse, data exfiltration |
| **Physical Security** | Unauthorized physical access | Tailgating, badge misuse |

---

## 3. Incident Response Team

### 3.1 Team Structure

```
                    INCIDENT COMMANDER
                    (CISO or Delegate)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   TECHNICAL LEAD      COMMUNICATIONS    LEGAL/COMPLIANCE
        │                  │                  │
   ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
   │         │        │         │        │         │
Forensics  System   Internal External  Legal   Regulatory
 Team     Admin    Comms    Comms     Counsel  Affairs
```

### 3.2 Roles and Responsibilities

| Role | Primary | Responsibilities |
|------|---------|------------------|
| Incident Commander | CISO | Overall coordination, decision authority |
| Technical Lead | Security Architect | Technical response, forensics |
| Communications Lead | PR Manager | Internal/external communications |
| Legal Counsel | Legal Advisor | Legal implications, breach notification |
| System Administrator | DevOps Lead | System recovery, evidence collection |
| Forensics Specialist | Security Analyst | Evidence preservation, analysis |

### 3.3 Contact Information

| Role | Name | Primary Contact | Secondary Contact |
|------|------|-----------------|-------------------|
| Incident Commander | | +880-__________ | +880-__________ |
| Technical Lead | | +880-__________ | +880-__________ |
| Communications | | +880-__________ | +880-__________ |
| Legal Counsel | | +880-__________ | +880-__________ |
| Bangladesh Bank CERT | | +880-__________ | cert@bb.org.bd |

---

## 4. Response Procedures

### 4.1 Incident Response Lifecycle

```
    ┌─────────────┐
    │ PREPARATION │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ IDENTIFICATION│
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  CONTAINMENT │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ ERADICATION │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   RECOVERY  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  LESSONS    │
    │  LEARNED    │
    └─────────────┘
```

### 4.2 Phase 1: Identification

**Detection Methods:**
- Automated monitoring alerts
- User reports
- External notifications
- Log analysis
- Threat intelligence feeds

**Initial Assessment Checklist:**

| Task | Action | Owner | Status |
|------|--------|-------|--------|
| 1 | Confirm incident is genuine | L1 Analyst | ☐ |
| 2 | Document initial findings | L1 Analyst | ☐ |
| 3 | Classify severity | L2 Analyst | ☐ |
| 4 | Notify Incident Commander | L2 Analyst | ☐ |
| 5 | Activate IRT if P1/P2 | Incident Commander | ☐ |
| 6 | Preserve initial evidence | Forensics | ☐ |

### 4.3 Phase 2: Containment

#### Short-term Containment (Immediate)

```bash
# Isolate affected system
kubectl cordon <node-name>
kubectl taint nodes <node-name> incident=response:NoSchedule

# Network isolation
iptables -A INPUT -s <suspicious-ip> -j DROP
iptables -A OUTPUT -d <suspicious-ip> -j DROP

# Disable compromised account
kubectl delete user <compromised-user>

# Revoke certificates
kubectl delete certificate <cert-name> -n ulms-production
```

#### Long-term Containment

| Action | Description | Owner |
|--------|-------------|-------|
| Backup affected systems | Forensic images | Forensics |
| Patch vulnerabilities | Apply security fixes | System Admin |
| Update firewall rules | Block attack vectors | Network Team |
| Rotate credentials | Reset all affected passwords | Security Team |
| Enable enhanced monitoring | Increase log retention | Monitoring |

### 4.4 Phase 3: Eradication

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Remove malware/backdoors | AV scan clean |
| 2 | Delete unauthorized accounts | User audit |
| 3 | Close security gaps | Vulnerability scan |
| 4 | Patch exploited vulnerabilities | Penetration test |
| 5 | Rebuild compromised systems | Clean image deployment |

### 4.5 Phase 4: Recovery

| Phase | Activity | Duration |
|-------|----------|----------|
| Testing | Validate systems in isolation | 2-4 hours |
| Monitoring | Enhanced monitoring for 72 hours | 72 hours |
| Restoration | Return to normal operations | 4-8 hours |
| Normal Ops | Standard monitoring resumes | Ongoing |

---

## 5. Communication Plan

### 5.1 Internal Communication

| Timeframe | Audience | Message | Method |
|-----------|----------|---------|--------|
| Immediate | IRT Team | Incident declared | Phone/Slack |
| 30 minutes | Management | Initial assessment | Email/Call |
| 1 hour | All Staff | Awareness notice | Email |
| 4 hours | Stakeholders | Status update | Conference call |
| Daily | Board | Executive briefing | Written report |

### 5.2 External Communication

| Stakeholder | Trigger | Timeline | Method |
|-------------|---------|----------|--------|
| Bangladesh Bank | P1/P2 incident | Within 1 hour | Phone + Written |
| Affected Customers | Data breach | Within 72 hours | Registered mail |
| Law Enforcement | Criminal activity | As advised | Through legal |
| Media | Public impact | As needed | PR Manager |

### 5.3 Bangladesh Bank Reporting

**Required Notifications:**
- Immediate notification for Critical incidents
- Written report within 24 hours
- Final incident report within 7 days

**Report Contents:**
- Incident description and timeline
- Systems affected
- Data involved
- Containment measures
- Recovery status
- Preventive actions

---

## 6. Evidence Preservation

### 6.1 Evidence Collection

| Type | Method | Storage | Chain of Custody |
|------|--------|---------|------------------|
| System Images | dd/forensic tools | Encrypted storage | Signed transfer |
| Log Files | SIEM export | Write-once media | Hash verification |
| Network Captures | tcpdump | Secure storage | Timestamped |
| Memory Dumps | LiME/Volatility | Encrypted | Documented |

### 6.2 Chain of Custody Form

```
EVIDENCE CHAIN OF CUSTODY

Evidence ID: ________________
Description: ________________
Collected by: ________________ Date/Time: ________________
Location: ________________

Hash (SHA-256): ________________

Transfer History:
From: ________________ To: ________________ Date: ________________
Signature: ________________

From: ________________ To: ________________ Date: ________________
Signature: ________________
```

---

## 7. Recovery Procedures

### 7.1 System Recovery

| System | Recovery Method | RTO | RPO |
|--------|-----------------|-----|-----|
| ULMS Application | Kubernetes redeploy | 30 min | 0 |
| Database | PITR + Replication | 1 hour | < 1 hour |
| File Storage | Backup restore | 2 hours | < 4 hours |
| Configuration | GitOps restore | 15 min | 0 |

### 7.2 Service Restoration Priority

1. **Tier 1 (Critical)**: Authentication, Core Banking Interface
2. **Tier 2 (High)**: Loan Processing, CIB Integration
3. **Tier 3 (Medium)**: Reporting, Analytics
4. **Tier 4 (Low)**: Non-critical features

---

## 8. Post-Incident Activities

### 8.1 Incident Review

**Timing:** Within 5 business days

**Attendees:** IRT members, affected stakeholders

**Agenda:**
- Timeline review
- Response effectiveness
- Communication assessment
- Lessons learned
- Action items

### 8.2 Post-Incident Report

```markdown
# Post-Incident Report

## Executive Summary
[One paragraph summary]

## Incident Details
- Date/Time Detected:
- Date/Time Resolved:
- Severity:
- Systems Affected:

## Timeline
[Detailed chronological events]

## Root Cause Analysis
[5 Whys or similar]

## Impact Assessment
- Customers affected:
- Data compromised:
- Financial impact:
- Regulatory impact:

## Response Evaluation
[What worked, what didn't]

## Corrective Actions
| Action | Owner | Due Date |
|--------|-------|----------|
| | | |

## Appendix
[Evidence, logs, screenshots]
```

---

## 9. Regulatory Reporting

### 9.1 Bangladesh Bank Requirements

| Requirement | Timeline | Responsible |
|-------------|----------|-------------|
| Immediate notification | 1 hour | Incident Commander |
| Initial written report | 24 hours | Compliance Officer |
| Detailed investigation | 7 days | Security Team |
| Final closure report | 14 days | CISO |

### 9.2 Report Template

```
BANGLADESH BANK INCIDENT NOTIFICATION

Date: ________________
Bank Name: [Client Bank]
System: ULMS v2.0

INCIDENT SUMMARY:
[Description]

AFFECTED SYSTEMS:
[List]

POTENTIAL IMPACT:
[Assessment]

CONTAINMENT ACTIONS:
[Measures taken]

STATUS:
[Current state]

CONTACT:
[Incident Commander contact]
```

---

## 10. Appendices

### Appendix A: Incident Response Checklist

| Phase | Task | Status |
|-------|------|--------|
| Detection | Alert received | ☐ |
| | Incident verified | ☐ |
| | Severity assigned | ☐ |
| Containment | Affected systems isolated | ☐ |
| | Evidence preserved | ☐ |
| | Stakeholders notified | ☐ |
| Eradication | Threat removed | ☐ |
| | Vulnerabilities patched | ☐ |
| Recovery | Systems restored | ☐ |
| | Monitoring enhanced | ☐ |
| Post-Incident | Report completed | ☐ |
| | Actions assigned | ☐ |

### Appendix B: Contact List

| Organization | Contact | Phone | Email |
|--------------|---------|-------|-------|
| Bangladesh Bank CERT | Duty Officer | | cert@bb.org.bd |
| Bangladesh Police CID | Cyber Crime Unit | | |
| BFIU | Reporting Officer | | bfiu@bb.org.bd |

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Procedures | ULMS-OPS-IRP-002 | 8.2_Operations_Support/ |
| Business Continuity Plan | ULMS-OPS-BCP-001 | 8.1_Production_Deployment/ |
| Security Operations Guide | ULMS-SEC-SOG-001 | Security/ |

---

**Document Control Footer**

*Classification: Internal - Confidential*
*Next Review: Quarterly*
*Owner: CISO*

**END OF DOCUMENT**
