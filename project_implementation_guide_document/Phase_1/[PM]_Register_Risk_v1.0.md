# Risk Register
## Unisoft Loan Management System (ULMS) v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Risk Register - ULMS v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Project Manager, Technical Lead |
| **Reviewed By** | Project Sponsor |
| **Classification** | Confidential - Internal Use |
| **Status** | Active |

---

## Table of Contents

1. [Risk Overview](#1-risk-overview)
2. [Risk Scoring Methodology](#2-risk-scoring-methodology)
3. [Identified Risks](#3-identified-risks)
4. [Risk Mitigation Strategies](#4-risk-mitigation-strategies)
5. [Risk Monitoring & Reporting](#5-risk-monitoring--reporting)
6. [Contingency Plans](#6-contingency-plans)
7. [Risk Triggers & Early Warning Signs](#7-risk-triggers--early-warning-signs)
8. [Appendices](#8-appendices)

---

## 1. Risk Overview

### Project Context
The ULMS v2.0 project involves significant technical complexity including:
- Integration with Bangladesh Bank CIB Online system
- NID/e-KYC verification with government systems
- Customization of Apache Fineract for Bangladesh regulations
- Multi-tenant architecture for multiple banks
- Real-time loan processing with strict SLA requirements

### Risk Categories

| Category | Description | Weight |
|----------|-------------|--------|
| **Technical** | Technology, architecture, integration | 30% |
| **Schedule** | Timeline, milestones, dependencies | 25% |
| **Resource** | Team, skills, availability | 20% |
| **External** | Vendors, regulatory, third-party | 15% |
| **Business** | Requirements, scope, acceptance | 10% |

### Current Risk Summary

| Priority | Count | Trend |
|----------|-------|-------|
| Critical | 3 | → |
| High | 5 | ↓ |
| Medium | 8 | → |
| Low | 12 | → |
| **Total** | **28** | **Stable** |

---

## 2. Risk Scoring Methodology

### Risk Matrix

| Probability \ Impact | Negligible (1) | Minor (2) | Moderate (3) | Significant (4) | Severe (5) |
|---------------------|----------------|-----------|--------------|-----------------|------------|
| **Almost Certain (5)** | 5 (Medium) | 10 (High) | 15 (Critical) | 20 (Critical) | 25 (Critical) |
| **Likely (4)** | 4 (Low) | 8 (Medium) | 12 (High) | 16 (Critical) | 20 (Critical) |
| **Possible (3)** | 3 (Low) | 6 (Medium) | 9 (Medium) | 12 (High) | 15 (Critical) |
| **Unlikely (2)** | 2 (Low) | 4 (Low) | 6 (Medium) | 8 (Medium) | 10 (High) |
| **Rare (1)** | 1 (Low) | 2 (Low) | 3 (Low) | 4 (Low) | 5 (Medium) |

### Risk Score Interpretation

| Score | Priority | Action Required | Escalation |
|-------|----------|-----------------|------------|
| 20-25 | Critical | Immediate action | To Sponsor |
| 15-19 | High | Urgent action | To PM |
| 9-14 | Medium | Planned action | Within team |
| 1-8 | Low | Monitor | Log only |

### Probability Scale

| Rating | Description | % Chance |
|--------|-------------|----------|
| 5 - Almost Certain | Will definitely occur | >90% |
| 4 - Likely | Probably will occur | 60-90% |
| 3 - Possible | May occur | 30-60% |
| 2 - Unlikely | Could occur but doubtful | 10-30% |
| 1 - Rare | May occur only in exceptional circumstances | <10% |

### Impact Scale

| Rating | Schedule | Budget | Quality | Business |
|--------|----------|--------|---------|----------|
| 5 - Severe | >1 month delay | >20% overrun | Unusable | Business failure |
| 4 - Significant | 2-4 weeks delay | 10-20% overrun | Major defects | Major loss |
| 3 - Moderate | 1-2 weeks delay | 5-10% overrun | Moderate defects | Moderate loss |
| 2 - Minor | <1 week delay | <5% overrun | Minor defects | Minor impact |
| 1 - Negligible | No delay | No impact | Cosmetic only | No impact |

---

## 3. Identified Risks

### 3.1 Critical Risks (Score 20-25)

#### R-001: CIB Online Integration Failure
| Field | Details |
|-------|---------|
| **Risk ID** | R-001 |
| **Category** | Technical / External |
| **Description** | CIB Online API integration fails or Bangladesh Bank denies access, blocking loan application processing |
| **Probability** | 3 (Possible) |
| **Impact** | 5 (Severe) |
| **Score** | 15 → **High** |
| **Owner** | Technical Lead |

**Detailed Impact:**
- All loan applications blocked (BRD 6.2.1 requirement)
- Regulatory non-compliance
- Bank operations severely impacted
- Project timeline at risk

**Root Causes:**
- BB API technical issues
- Certificate/authentication problems
- Network/connectivity issues
- Regulatory approval delays

**Current Status:** Active Mitigation

---

#### R-002: NID/e-KYC Integration Failure
| Field | Details |
|-------|---------|
| **Risk ID** | R-002 |
| **Category** | Technical / External |
| **Description** | NIDW API unavailable or integration fails, blocking customer onboarding |
| **Probability** | 3 (Possible) |
| **Impact** | 5 (Severe) |
| **Score** | 15 → **High** |
| **Owner** | Backend Developer |

**Detailed Impact:**
- Customer onboarding blocked (BRD 6.1.4 requirement)
- Manual NID verification required
- BFIU e-KYC compliance at risk
- User experience severely degraded

**Root Causes:**
- NIDW API downtime
- Authentication issues
- Rate limiting
- Data format changes

**Current Status:** Active Mitigation

---

#### R-003: Key Developer Unavailability
| Field | Details |
|-------|---------|
| **Risk ID** | R-003 |
| **Category** | Resource |
| **Description** | Technical Lead or senior developer unavailable due to illness, resignation, or other factors |
| **Probability** | 2 (Unlikely) |
| **Impact** | 5 (Severe) |
| **Score** | 10 → **High** |
| **Owner** | Project Manager |

**Detailed Impact:**
- Architecture decisions blocked
- Code review bottleneck
- Knowledge silo impact
- Project velocity reduction

**Root Causes:**
- Health issues
- Resignation
- Family emergencies
- Competing priorities

**Current Status:** Monitoring

---

### 3.2 High Risks (Score 12-19)

#### R-004: Fineract Customization Complexity
| Field | Details |
|-------|---------|
| **Risk ID** | R-004 |
| **Category** | Technical |
| **Description** | Apache Fineract customization proves more complex than estimated, causing delays |
| **Probability** | 4 (Likely) |
| **Impact** | 3 (Moderate) |
| **Score** | 12 → **High** |
| **Owner** | Technical Lead |

**Detailed Impact:**
- Development timeline extended
- Technical debt increase
- Team learning curve
- BRPD compliance complexity

**Root Causes:**
- Insufficient Fineract expertise
- Underestimated BRPD requirements
- Database schema modifications needed
- Integration complexity

**Current Status:** Active Mitigation

---

#### R-005: Regulatory Requirement Changes
| Field | Details |
|-------|---------|
| **Risk ID** | R-005 |
| **Category** | External / Business |
| **Description** | Bangladesh Bank issues new circulars changing loan classification or reporting requirements |
| **Probability** | 3 (Possible) |
| **Impact** | 4 (Significant) |
| **Score** | 12 → **High** |
| **Owner** | Business Analyst |

**Detailed Impact:**
- Architecture changes required
- Additional development work
- Compliance recertification
- Timeline impact

**Root Causes:**
- BB policy changes
- New circulars (BRPD)
- IFRS-9 implementation updates
- ICT Security guideline changes

**Current Status:** Monitoring

---

#### R-006: Performance Issues at Scale
| Field | Details |
|-------|---------|
| **Risk ID** | R-006 |
| **Category** | Technical |
| **Description** | System fails to meet performance requirements under production load |
| **Probability** | 3 (Possible) |
| **Impact** | 4 (Significant) |
| **Score** | 12 → **High** |
| **Owner** | Technical Lead |

**Detailed Impact:**
- SLA breaches (BRD 7.2 requirements)
- User dissatisfaction
- Additional optimization effort
- Infrastructure cost increase

**Root Causes:**
- Insufficient load testing
- Database query optimization needed
- Caching strategy inadequate
- JVM tuning required

**Current Status:** Active Mitigation

---

#### R-007: Security Vulnerabilities
| Field | Details |
|-------|---------|
| **Risk ID** | R-007 |
| **Category** | Technical |
| **Description** | Security audit reveals critical vulnerabilities requiring significant remediation |
| **Probability** | 2 (Unlikely) |
| **Impact** | 5 (Severe) |
| **Score** | 10 → **High** |
| **Owner** | Technical Lead |

**Detailed Impact:**
- Production deployment blocked
- Security certification failure
- Regulatory compliance risk
- Reputation damage

**Root Causes:**
- Insufficient security testing
- Third-party component vulnerabilities
- Misconfiguration
- Insecure coding practices

**Current Status:** Active Mitigation

---

### 3.3 Medium Risks (Score 9-11)

#### R-008: CBS Integration Delays
| Field | Details |
|-------|---------|
| **Risk ID** | R-008 |
| **Category** | Technical / External |
| **Description** | Core Banking System vendor delays integration API delivery |
| **Probability** | 3 (Possible) |
| **Impact** | 3 (Moderate) |
| **Score** | 9 → **Medium** |
| **Owner** | Technical Lead |

**Detailed Impact:**
- Disbursement module delayed
- GL posting blocked
- End-to-end testing delayed

**Current Status:** Monitoring

---

#### R-009: Third-Party Service Outages
| Field | Details |
|-------|---------|
| **Risk ID** | R-009 |
| **Category** | External |
| **Description** | SMS gateway, email service, or cloud provider experiences outage |
| **Probability** | 4 (Likely) |
| **Impact** | 2 (Minor) |
| **Score** | 8 → **Medium** |
| **Owner** | Backend Developer |

**Detailed Impact:**
- Notification delays
- User experience impact
- Recovery effort required

**Current Status:** Accepted (with fallback)

---

#### R-010: Mobile CPV App Development Challenges
| Field | Details |
|-------|---------|
| **Risk ID** | R-010 |
| **Category** | Technical |
| **Description** | React Native CPV app development faces unexpected challenges |
| **Probability** | 3 (Possible) |
| **Impact** | 2 (Minor) |
| **Score** | 6 → **Medium** |
| **Owner** | Backend/Mobile Developer |

**Detailed Impact:**
- Offline sync complexity
- GPS accuracy issues
- Photo upload failures
- Field testing delays

**Current Status:** Monitoring

---

#### R-011: Data Migration Complexity
| Field | Details |
|-------|---------|
| **Risk ID** | R-011 |
| **Category** | Technical |
| **Description** | Legacy system data migration proves complex and error-prone |
| **Probability** | 3 (Possible) |
| **Impact** | 3 (Moderate) |
| **Score** | 9 → **Medium** |
| **Owner** | Technical Lead |

**Detailed Impact:**
- Data quality issues
- Extended migration window
- Rollback complexity

**Current Status:** Monitoring

---

#### R-012: User Acceptance Testing Delays
| Field | Details |
|-------|---------|
| **Risk ID** | R-012 |
| **Category** | Business |
| **Description** | Bank users unavailable for UAT or UAT feedback cycle extends |
| **Probability** | 3 (Possible) |
| **Impact** | 3 (Moderate) |
| **Score** | 9 → **Medium** |
| **Owner** | Business Analyst |

**Detailed Impact:**
- Go-live date at risk
- Defect fixes delayed
- Training schedule compressed

**Current Status:** Monitoring

---

#### R-013: Scope Creep
| Field | Details |
|-------|---------|
| **Risk ID** | R-013 |
| **Category** | Business |
| **Description** | Additional requirements added after project baseline |
| **Probability** | 4 (Likely) |
| **Impact** | 2 (Minor) |
| **Score** | 8 → **Medium** |
| **Owner** | Project Manager |

**Detailed Impact:**
- Timeline pressure
- Resource strain
- Quality compromise

**Current Status:** Active Mitigation

---

### 3.4 Low Risks (Score 1-7)

| Risk ID | Description | Probability | Impact | Score | Owner |
|---------|-------------|-------------|--------|-------|-------|
| R-014 | Development environment issues | 3 | 2 | 6 | Tech Lead |
| R-015 | Third-party library deprecation | 2 | 2 | 4 | Tech Lead |
| R-016 | Documentation gaps | 3 | 1 | 3 | Tech Lead |
| R-017 | Code review bottlenecks | 2 | 2 | 4 | Tech Lead |
| R-018 | Test environment instability | 2 | 2 | 4 | QA Lead |
| R-019 | Requirements ambiguity | 2 | 2 | 4 | Business Analyst |
| R-020 | Network connectivity issues | 2 | 1 | 2 | Tech Lead |

---

## 4. Risk Mitigation Strategies

### 4.1 Technical Risk Mitigations

#### CIB Integration (R-001)

| Mitigation | Description | Owner | Timeline |
|------------|-------------|-------|----------|
| **Early POC** | Develop CIB integration proof-of-concept in Sprint 1 | Tech Lead | Month 1 |
| **Sandbox Testing** | Request BB CIB sandbox environment immediately | PM | Week 1 |
| **Fallback Design** | Design manual CIB entry workflow as fallback | BA | Month 1 |
| **Caching Strategy** | Implement Redis caching for CIB reports | Backend Dev | Month 2 |
| **Retry Logic** | Implement exponential backoff for CIB calls | Backend Dev | Month 2 |

**Responsibilities:**
- Technical Lead: Architecture and POC
- Backend Developer: Implementation
- PM: BB coordination

---

#### NID Integration (R-002)

| Mitigation | Description | Owner | Timeline |
|------------|-------------|-------|----------|
| **NIDW Engagement** | Formal engagement with NID Wing for API access | PM | Week 1 |
| **Mock Service** | Build NID mock service for development | Backend Dev | Sprint 1 |
| **Manual Override** | Design manual NID verification process | BA | Month 1 |
| **Offline Queue** | Queue NID verifications when API unavailable | Backend Dev | Month 2 |

---

#### Fineract Complexity (R-004)

| Mitigation | Description | Owner | Timeline |
|------------|-------------|-------|----------|
| **Spike Stories** | Allocate spike stories for complex areas | Tech Lead | Ongoing |
| **External Consultation** | Engage Fineract community experts | Tech Lead | Month 1 |
| **Phased Approach** | Implement core first, then customize | Tech Lead | Ongoing |
| **Documentation** | Document all customizations thoroughly | Tech Lead | Ongoing |

---

### 4.2 Resource Risk Mitigations

#### Key Developer Unavailability (R-003)

| Mitigation | Description | Owner | Timeline |
|------------|-------------|-------|----------|
| **Knowledge Sharing** | Weekly knowledge transfer sessions | Tech Lead | Ongoing |
| **Pair Programming** | Regular pair programming sessions | Tech Lead | Ongoing |
| **Documentation** | Architecture Decision Records (ADRs) | Tech Lead | Ongoing |
| **Cross-Training** | Cross-train all developers on critical areas | Tech Lead | Month 2 |
| **Backup Assignment** | Identify backup for each critical role | PM | Week 2 |

---

### 4.3 External Risk Mitigations

#### Regulatory Changes (R-005)

| Mitigation | Description | Owner | Timeline |
|------------|-------------|-------|----------|
| **BB Monitoring** | Monitor BB circulars and guidelines | BA | Weekly |
| **Flexible Design** | Design for configurability | Tech Lead | Ongoing |
| **Regulatory Buffer** | Include regulatory buffer in timeline | PM | Planning |
| **Legal Consultation** | Engage regulatory consultant | PM | Month 1 |

---

### 4.4 Schedule Risk Mitigations

#### Scope Creep (R-013)

| Mitigation | Description | Owner | Timeline |
|------------|-------------|-------|----------|
| **Change Control** | Formal change request process | PM | Week 1 |
| **Prioritization** | MoSCoW prioritization with PO | PM | Sprint Planning |
| **Impact Analysis** | Mandatory impact analysis for all changes | Tech Lead | Ongoing |
| **Buffer Management** | Maintain 20% buffer in estimates | Tech Lead | Ongoing |

---

## 5. Risk Monitoring & Reporting

### 5.1 Risk Review Schedule

| Review Type | Frequency | Participants | Focus |
|-------------|-----------|--------------|-------|
| **Daily** | Standup | Dev Team | New risks, blockers |
| **Weekly** | Team Meeting | Full Team | Risk status updates |
| **Bi-weekly** | Sprint Review | All Stakeholders | Risk trends |
| **Monthly** | Steering Committee | Executive | Strategic risks |

### 5.2 Risk Reporting Template

```markdown
## Risk Status Report - [Date]

### Risk Summary
| Priority | Open | Closed | New |
|----------|------|--------|-----|
| Critical | X | Y | Z |
| High | X | Y | Z |
| Medium | X | Y | Z |
| Low | X | Y | Z |

### Top 3 Risks Requiring Attention
1. [Risk ID] - [Status] - [Action Required]
2. [Risk ID] - [Status] - [Action Required]
3. [Risk ID] - [Status] - [Action Required]

### Escalated Risks
[List any escalated risks]

### Closed Risks This Period
[List resolved risks]

### New Risks Identified
[List new risks]
```

### 5.3 Risk Status Definitions

| Status | Definition | Action |
|--------|------------|--------|
| **Active** | Risk identified, mitigation in progress | Monitor regularly |
| **Monitoring** | Risk present but mitigated | Monitor periodically |
| **Escalated** | Requires management attention | Immediate action |
| **Resolved** | Risk no longer applicable | Close and document |
| **Accepted** | Risk acknowledged, no mitigation | Monitor only |

---

## 6. Contingency Plans

### 6.1 CIB Integration Failure Contingency

**Trigger:** CIB API unavailable for >48 hours in production

**Immediate Actions (0-4 hours):**
1. Alert BB CIB department
2. Activate manual CIB workflow
3. Notify all branch users
4. Document all manual entries for backfill

**Short-term Actions (4-24 hours):**
1. Escalate to BB technical team
2. Enable batch CIB processing queue
3. Prepare CIB data upload files

**Long-term Actions (>24 hours):**
1. Daily status calls with BB
2. Alternative CIB inquiry methods
3. Regulatory notification if required

---

### 6.2 Key Developer Unavailability Contingency

**Trigger:** Lead developer unavailable for >3 days

**Immediate Actions:**
1. Reassign critical tasks to other developers
2. Engage external consultant if needed
3. Adjust sprint scope
4. Daily check-ins with absent developer

**Communication Plan:**
- Internal: Immediate team notification
- External: Client notification if timeline impact

---

### 6.3 Performance Issue Contingency

**Trigger:** Load testing reveals SLA breaches

**Immediate Actions:**
1. Performance profiling
2. Database query optimization
3. JVM tuning
4. Caching enhancement

**Fallback:**
1. Infrastructure scaling
2. Feature de-scoping (last resort)
3. Extended performance optimization sprint

---

## 7. Risk Triggers & Early Warning Signs

### 7.1 Key Risk Indicators (KRIs)

| KRI | Threshold | Risk | Monitoring |
|-----|-----------|------|------------|
| Sprint Velocity Drop | >20% decrease | Schedule | Jira |
| Code Review Backlog | >5 pending PRs | Quality | GitLab |
| Open Defect Count | >20 critical/high | Quality | Jira |
| CIB API Errors | >5% error rate | Technical | Monitoring |
| Team Absences | >1 concurrent | Resource | HR/PM |
| Requirements Changes | >3 per sprint | Scope | Jira |

### 7.2 Early Warning Signs

| Risk | Early Warning Signs |
|------|---------------------|
| CIB Integration | Delayed BB responses, API documentation gaps |
| Fineract Complexity | Increasing story estimates, technical debt accumulation |
| Resource Issues | Missed deadlines, knowledge silo complaints |
| Performance | Slow local development, query timeouts |
| Scope Creep | Informal change requests, gold plating |

---

## 8. Appendices

### Appendix A: Risk Register Summary Table

| ID | Risk | Category | P | I | Score | Status | Owner |
|----|------|----------|---|---|-------|--------|-------|
| R-001 | CIB Integration Failure | Technical | 3 | 5 | 15 | Active | Tech Lead |
| R-002 | NID Integration Failure | Technical | 3 | 5 | 15 | Active | Backend Dev |
| R-003 | Key Developer Unavailable | Resource | 2 | 5 | 10 | Monitor | PM |
| R-004 | Fineract Complexity | Technical | 4 | 3 | 12 | Active | Tech Lead |
| R-005 | Regulatory Changes | External | 3 | 4 | 12 | Monitor | BA |
| R-006 | Performance Issues | Technical | 3 | 4 | 12 | Active | Tech Lead |
| R-007 | Security Vulnerabilities | Technical | 2 | 5 | 10 | Active | Tech Lead |
| R-008 | CBS Integration Delays | External | 3 | 3 | 9 | Monitor | Tech Lead |
| R-009 | Third-Party Outages | External | 4 | 2 | 8 | Accept | Backend Dev |
| R-010 | CPV App Challenges | Technical | 3 | 2 | 6 | Monitor | Mobile Dev |

### Appendix B: Risk Response Strategies

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **Avoid** | High probability/impact, alternative exists | Use different technology |
| **Mitigate** | Reduce probability or impact | Add testing, redundancy |
| **Transfer** | Third party can manage better | Insurance, outsourcing |
| **Accept** | Low impact, cost of mitigation exceeds benefit | Minor UI issues |

### Appendix C: Risk Register Change Log

| Date | Change | Risk ID | Updated By |
|------|--------|---------|------------|
| 2026-02-03 | Initial risk register created | All | PM |
| | | | |

---

**Document Version:** 1.0  
**Last Updated:** February 3, 2026  
**Next Review:** Weekly (every Monday)

*Document Classification: Confidential - Internal Use Only*
