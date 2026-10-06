# Production Support Runbook

## ULMS v2.0 - Level 1/2 Support Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-PSR-004 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Support |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Support Manager |
| Approver | Operations Manager |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Support Team | Initial draft | - |
| 0.5 | 2026-01-20 | Senior Support | Added procedures | - |
| 0.9 | 2026-01-30 | Training Lead | Added examples | - |
| 1.0 | 2026-02-05 | Support Manager | Final release | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Support Organization](#2-support-organization)
3. [Ticket Management](#3-ticket-management)
4. [Common Issues](#4-common-issues)
5. [Troubleshooting Procedures](#5-troubleshooting-procedures)
6. [Escalation Procedures](#6-escalation-procedures)
7. [User Communication](#7-user-communication)
8. [Knowledge Base](#8-knowledge-base)
9. [Service Level Agreements](#9-service-level-agreements)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This runbook provides Level 1 and Level 2 support staff with procedures for handling common ULMS v2.0 production issues.

### 1.2 Support Levels

| Level | Scope | Skills Required | Escalation To |
|-------|-------|-----------------|---------------|
| L1 | Basic user issues, password resets, navigation | Basic ULMS knowledge | L2 |
| L2 | Technical issues, configuration, data problems | Technical troubleshooting | L3/Development |
| L3 | Complex bugs, code issues, architecture | Development expertise | Engineering |

### 1.3 Support Hours

| Day | Hours | Coverage |
|-----|-------|----------|
| Sunday-Thursday | 09:00-18:00 | Full L1 + L2 |
| Friday-Saturday | 10:00-16:00 | On-call L2 |
| Emergency | 24/7 | On-call rotation |

---

## 2. Support Organization

### 2.1 Team Structure

```
Support Manager
├── L1 Support Team (3 members)
│   ├── L1 Team Lead
│   ├── Support Agent A
│   └── Support Agent B
├── L2 Support Team (2 members)
│   ├── L2 Team Lead
│   └── Technical Specialist
└── On-call Schedule
    ├── Week 1: Agent A
    ├── Week 2: Agent B
    └── Week 3: L2 Specialist
```

### 2.2 Contact Information

| Role | Name | Extension | Mobile |
|------|------|-----------|--------|
| Support Manager | | | +880-__________ |
| L1 Team Lead | | | +880-__________ |
| L2 Team Lead | | | +880-__________ |
| L3 Escalation | | | +880-__________ |

---

## 3. Ticket Management

### 3.1 Ticket Categories

| Category | Description | Examples | Priority |
|----------|-------------|----------|----------|
| LOGIN | Authentication issues | Cannot login, password expired | P2 |
| DATA | Data-related issues | Missing records, incorrect data | P2 |
| PERF | Performance issues | Slow loading, timeouts | P2 |
| BUG | Application bugs | Errors, unexpected behavior | P2/P3 |
| FEATURE | Feature requests | New functionality | P4 |
| TRAINING | User education | How-to questions | P3 |
| INTEGRATION | External system issues | CIB errors, CBS sync | P2 |

### 3.2 Ticket Priority Matrix

| Impact | Urgent | High | Medium | Low |
|--------|--------|------|--------|-----|
| **Enterprise** | P1 | P1 | P2 | P2 |
| **Multiple Users** | P1 | P2 | P2 | P3 |
| **Single User** | P2 | P2 | P3 | P4 |
| **Workflow** | P2 | P2 | P3 | P4 |

### 3.3 Ticket Lifecycle

```
NEW → ASSIGNED → IN_PROGRESS → PENDING → RESOLVED → CLOSED
           ↓           ↓            ↓
        [L1/L2]   [Investigation] [User Verification]
```

---

## 4. Common Issues

### 4.1 Login Issues (40% of tickets)

#### Issue: User Cannot Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify username format | Correct format: user@bank.com |
| 2 | Check if account is locked | Ask user about failed attempts |
| 3 | Verify password expiry | Check in admin console |
| 4 | Check MFA status | Verify TOTP/app is working |
| 5 | Test login with admin account | Confirm system is working |

**Resolution Steps:**

1. **Forgot Password:**
   - Guide user to "Forgot Password" link
   - Verify identity via registered email/phone
   - Send reset link

2. **Account Locked:**
   ```sql
   -- Unlock account in database (if needed)
   UPDATE users SET failed_attempts = 0, locked = false WHERE username = 'user@bank.com';
   ```

3. **Password Expired:**
   - Notify user password has expired
   - Guide through password reset

4. **MFA Issues:**
   - Guide user to re-sync authenticator app
   - Provide backup codes if available
   - Reset MFA if necessary (requires manager approval)

#### Issue: Session Timeout Too Quickly

**Troubleshooting:**
- Check session timeout setting (default: 30 minutes)
- Verify user activity (inactive sessions timeout)
- Check for multiple simultaneous logins

**Resolution:**
- Explain security policy to user
- If legitimate need, escalate to extend timeout temporarily

### 4.2 Data Issues (20% of tickets)

#### Issue: Cannot Find Customer Record

| Check | Action |
|-------|--------|
| 1 | Verify search criteria (NID, name, phone) |
| 2 | Check if customer exists in CIB |
| 3 | Search by partial name with wildcards |
| 4 | Check archived records |
| 5 | Verify user has access to that branch |

**Resolution:**
- If not found: Create new customer record
- If found but wrong branch: Transfer or grant access
- If data incorrect: Submit data correction request

#### Issue: Loan Amount Incorrect

**Investigation:**
1. Check loan history and transactions
2. Verify calculation parameters (interest rate, fees)
3. Check for manual adjustments
4. Review audit trail

**Resolution:**
- Document discrepancy
- If calculation error: Escalate to L2 for correction
- If data entry error: Correct with proper authorization

### 4.3 Performance Issues (15% of tickets)

#### Issue: Page Loading Slowly

**Troubleshooting:**
```
1. Check user's internet connection
   - Ask user to test other websites
   - Check ping to bank servers

2. Check browser
   - Clear cache and cookies
   - Try incognito/private mode
   - Try different browser

3. Check system load
   - Review monitoring dashboards
   - Check for ongoing maintenance

4. Check specific feature
   - Is it one page or all pages?
   - Does it happen at specific times?
```

**Resolution:**
- If user-side: Guide user through troubleshooting
- If system-side: Create incident ticket for Ops team
- If data-related: Check for large datasets causing slowness

#### Issue: Report Generation Timeout

**Common Causes:**
- Date range too large
- Too many filters applied
- High system load

**Resolution:**
- Advise smaller date ranges
- Suggest scheduling large reports
- Check if background report processing is available

### 4.4 Integration Issues (15% of tickets)

#### Issue: CIB Query Fails

**Error Codes:**
| Code | Meaning | Resolution |
|------|---------|------------|
| CIB-001 | Connection timeout | Retry after 5 minutes |
| CIB-002 | Invalid credentials | Escalate to admin |
| CIB-003 | Customer not found | Verify NID, may need manual check |
| CIB-004 | Rate limit exceeded | Wait and retry |
| CIB-005 | Service unavailable | Contact Bangladesh Bank |

**Troubleshooting:**
1. Check CIB service status in admin panel
2. Verify NID format is correct
3. Check if Bangladesh Bank service is down
4. Retry with correct credentials

#### Issue: CBS Sync Failed

**Investigation:**
- Check message queue status
- Verify CBS is available
- Check for data validation errors
- Review sync logs

**Resolution:**
- If temporary: Retry sync
- If data error: Fix data and retry
- If CBS down: Queue for later sync

### 4.5 Feature/How-To Questions (10% of tickets)

#### Common Questions

| Question | Answer |
|----------|--------|
| How to generate a report? | Guide to Reports → Select type → Set filters → Generate |
| How to approve a loan? | Go to Workflows → Pending Approvals → Review → Approve/Reject |
| How to add a guarantor? | Edit Loan → Guarantors → Add New → Fill details → Save |
| How to check repayment schedule? | Loan Details → Repayment Schedule → View/Print |
| How to export data? | Use Export button → Select format → Download |

---

## 5. Troubleshooting Procedures

### 5.1 Systematic Troubleshooting Approach

```
1. IDENTIFY
   - What is the exact error message?
   - When did it start happening?
   - Who is affected?
   - What were they trying to do?

2. REPRODUCE
   - Can you reproduce the issue?
   - Does it happen consistently?
   - What are the exact steps?

3. ISOLATE
   - Is it user-specific or system-wide?
   - Is it browser-specific?
   - Is it time-specific?

4. RESOLVE
   - Apply known fix from KB
   - Or escalate with full information

5. VERIFY
   - Confirm issue is resolved
   - Document solution
```

### 5.2 Diagnostic Commands

```bash
# Check user session
kubectl exec -it deployment/ulms-api -n ulms-production -- \
    psql -U ulms -d ulms_production -c "SELECT * FROM user_sessions WHERE user_id = 'USER_ID';"

# Check recent errors
kubectl logs deployment/ulms-api -n ulms-production --since=1h | grep ERROR

# Check specific user activity
kubectl logs deployment/ulms-api -n ulms-production | grep "user@bank.com"

# Database connectivity test
pg_isready -h prod-db.bank.com -p 5432

# Check service status
curl -s https://api.ulms.bank.com/actuator/health | jq
```

---

## 6. Escalation Procedures

### 6.1 Escalation Criteria

| Scenario | Escalate To | Timeframe |
|----------|-------------|-----------|
| System down | L3/DevOps | Immediate |
| Data corruption | L3/DBA | 15 minutes |
| Security incident | CISO | Immediate |
| Unknown error | L2 | 30 minutes |
| Requires code change | Development | 1 hour |
| External vendor needed | Vendor Management | As needed |

### 6.2 Escalation Process

```
1. Document all troubleshooting steps taken
2. Gather relevant logs and screenshots
3. Create escalation ticket with:
   - Original ticket reference
   - Detailed description
   - Steps to reproduce
   - Error messages/logs
   - User impact
   - Troubleshooting performed
4. Notify next level via phone/Slack
5. Hand over in person if possible
```

### 6.3 Escalation Contacts

| Level | Contact | When to Escalate |
|-------|---------|------------------|
| L2 | L2 Team Lead | Technical issues, data problems |
| L3 | Technical Lead | Code bugs, complex integrations |
| DevOps | DevOps On-call | Infrastructure issues |
| Security | CISO | Security incidents |
| Vendor | Vendor Support | Third-party issues |

---

## 7. User Communication

### 7.1 Communication Templates

#### Acknowledgment

```
Subject: Ticket #[NUMBER] - Acknowledgment

Dear [User Name],

Thank you for contacting ULMS Support. 

Your ticket reference number is: #[NUMBER]
Issue: [Brief description]
Priority: [P1/P2/P3/P4]

We are currently [investigating/working on] your issue.
Expected resolution time: [Timeframe]

You will receive updates every [frequency].

Best regards,
ULMS Support Team
```

#### Status Update

```
Subject: Update on Ticket #[NUMBER]

Dear [User Name],

Update on your support ticket #[NUMBER]:

Status: [Current status]
Progress: [What has been done]
Next Steps: [What will happen next]
Expected Resolution: [Updated timeframe]

[If waiting for user]
Action Required: [What user needs to do]

Best regards,
[Agent Name]
ULMS Support Team
```

#### Resolution

```
Subject: Resolved - Ticket #[NUMBER]

Dear [User Name],

Your issue (Ticket #[NUMBER]) has been resolved.

Resolution: [Description of fix]
Root Cause: [Brief explanation]

Please verify the fix is working and reply to this email.
If no response within 3 days, we will close this ticket.

We appreciate your feedback. Please rate our support:
[Survey Link]

Best regards,
[Agent Name]
ULMS Support Team
```

### 7.2 Communication Guidelines

- **Be Clear**: Use simple language, avoid jargon
- **Be Concise**: Get to the point quickly
- **Be Professional**: Maintain courteous tone
- **Be Timely**: Respond within SLA
- **Be Honest**: If you don't know, say so and escalate
- **Follow Up**: Keep user informed of progress

---

## 8. Knowledge Base

### 8.1 KB Article Template

```markdown
# KB-[NUMBER]: [Title]

## Symptoms
[What the user experiences]

## Cause
[Root cause of the issue]

## Resolution
[Step-by-step fix]

## Prevention
[How to avoid in future]

## Related Articles
- KB-XXX: Related issue

## Last Updated
[Date]
```

### 8.2 Common KB Articles

| Article ID | Title | Views |
|------------|-------|-------|
| KB-001 | How to Reset Your Password | |
| KB-002 | Understanding Loan Workflows | |
| KB-003 | CIB Query Troubleshooting | |
| KB-004 | Report Generation Guide | |
| KB-005 | User Access Management | |
| KB-006 | Mobile App Setup | |
| KB-007 | Data Export Procedures | |
| KB-008 | Common Error Messages | |

---

## 9. Service Level Agreements

### 9.1 Response Times

| Priority | Acknowledgment | Initial Response | Resolution Target |
|----------|----------------|------------------|-------------------|
| P1 - Critical | 15 min | 30 min | 4 hours |
| P2 - High | 30 min | 1 hour | 8 hours |
| P3 - Medium | 2 hours | 4 hours | 24 hours |
| P4 - Low | 4 hours | 8 hours | 72 hours |

### 9.2 Availability Targets

| Service | Target | Measurement |
|---------|--------|-------------|
| Support Portal | 99.5% | Uptime |
| Phone Support | 90% | Call answer rate |
| Email Response | Per SLA | Response time |
| First Contact Resolution | 70% | % resolved by L1 |
| Customer Satisfaction | > 4.0/5 | Survey scores |

---

## 10. Appendices

### Appendix A: Support Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Ticketing System | https://support.bank.com | Ticket management |
| Knowledge Base | https://kb.bank.com | Documentation |
| Remote Support | TeamViewer/AnyDesk | Screen sharing |
| Monitoring | https://grafana.bank.com | System status |

### Appendix B: Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│              ULMS SUPPORT QUICK REFERENCE                    │
├─────────────────────────────────────────────────────────────┤
│ LOGIN ISSUES:                                               │
│ • Check account status in admin panel                       │
│ • Reset password if needed                                  │
│ • Verify MFA is working                                     │
├─────────────────────────────────────────────────────────────┤
│ PERFORMANCE ISSUES:                                         │
│ • Check system status dashboard                             │
│ • Clear browser cache                                       │
│ • Try different browser                                     │
├─────────────────────────────────────────────────────────────┤
│ CIB ERRORS:                                                 │
│ • Check error code in KB                                    │
│ • Verify NID format                                         │
│ • Check Bangladesh Bank status                              │
├─────────────────────────────────────────────────────────────┤
│ ESCALATION:                                                 │
│ L2: Extension XXXX / support-l2@bank.com                    │
│ L3: Extension XXXX / support-l3@bank.com                    │
│ Emergency: +880-XXXXXXXXXX                                  │
└─────────────────────────────────────────────────────────────┘
```

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Procedures | ULMS-OPS-IRP-002 | 8.2_Operations_Support/ |
| User Manual - Branch Staff | ULMS-USER-BR-001 | 8.6_End_User_Documentation/ |
| Troubleshooting Knowledge Base | ULMS-GOV-TKB-001 | 8.3_Risk_Governance/ |

---

**Document Control Footer**

*Classification: Internal - Support*
*Next Review: Monthly*
*Owner: Support Manager*

**END OF DOCUMENT**
