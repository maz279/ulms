# Business Continuity Plan

## ULMS v2.0 - Disaster Recovery & Business Continuity

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-BCP-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Confidential - Critical |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Operations Manager |
| Approver | CEO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Business Impact Analysis](#2-business-impact-analysis)
3. [Recovery Strategies](#3-recovery-strategies)
4. [Disaster Recovery Procedures](#4-disaster-recovery-procedures)
5. [Communication Plan](#5-communication-plan)
6. [Testing and Maintenance](#6-testing-and-maintenance)
7. [Appendices](#7-appendices)

---

## 1. Introduction

### 1.1 Purpose
This Business Continuity Plan (BCP) ensures ULMS v2.0 can recover from disasters and continue critical operations with minimal disruption.

### 1.2 Scope
- System downtime recovery
- Data center failures
- Natural disasters
- Cyber attacks
- Supplier failures

### 1.3 Objectives

| Metric | Target | Measurement |
|--------|--------|-------------|
| Recovery Time Objective (RTO) | < 4 hours | Time to restore service |
| Recovery Point Objective (RPO) | < 1 hour | Data loss tolerance |
| Maximum Tolerable Downtime | 8 hours | Business threshold |

---

## 2. Business Impact Analysis

### 2.1 Critical Functions

| Function | Impact if Lost | Max Downtime | Priority |
|----------|----------------|--------------|----------|
| Loan Processing | Cannot disburse loans | 4 hours | Critical |
| Repayment Recording | Cannot collect payments | 4 hours | Critical |
| CIB Integration | Cannot check credit | 24 hours | High |
| Reporting | Management decisions | 48 hours | Medium |

### 2.2 Impact Scenarios

| Scenario | Probability | Impact | Risk Level |
|----------|-------------|--------|------------|
| Primary DC failure | Low | High | High |
| Database corruption | Low | Critical | High |
| Ransomware attack | Medium | Critical | High |
| Network outage | Medium | Medium | Medium |
| Staff unavailability | Medium | Medium | Medium |

---

## 3. Recovery Strategies

### 3.1 Infrastructure

| Component | Strategy | RTO | RPO |
|-----------|----------|-----|-----|
| Application | Active-Active | 15 min | 0 |
| Database | Hot Standby | 1 hour | < 1 hour |
| File Storage | Geo-replicated | 15 min | 0 |
| Network | Redundant links | 5 min | 0 |

### 3.2 DR Site Architecture

```
Primary Site (Dhaka)          DR Site (Chittagong)
┌──────────────────┐          ┌──────────────────┐
│  Application     │◄────────►│  Application     │
│  (Active)        │   Sync   │  (Standby)       │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
┌────────▼─────────┐          ┌────────▼─────────┐
│  Database        │◄────────►│  Database        │
│  (Primary)       │  Async   │  (Replica)       │
└──────────────────┘          └──────────────────┘
```

---

## 4. Disaster Recovery Procedures

### 4.1 Activation Criteria

Activate DR when:
- Primary site unavailable > 30 minutes
- Data corruption detected
- Security breach confirmed
- Natural disaster affecting primary
- Mandated by Bangladesh Bank

### 4.2 DR Activation Steps

**Step 1: Assessment (0-15 minutes)**
1. Verify disaster scope
2. Notify DR team
3. Assess primary site status
4. Document decision to activate

**Step 2: Notification (15-30 minutes)**
1. Alert stakeholders
2. Activate DR team
3. Notify Bangladesh Bank
4. Prepare customer communication

**Step 3: Failover (30-90 minutes)**
1. Promote DR database
2. Update DNS to DR
3. Activate DR applications
4. Verify service availability

**Step 4: Verification (90-120 minutes)**
1. Run smoke tests
2. Verify data integrity
3. Confirm all services
4. Notify users of restored service

### 4.3 Failback Procedures

When primary site is restored:
1. Sync data from DR to primary
2. Schedule maintenance window
3. Switch traffic back to primary
4. Verify primary operation
5. Resume DR replication

---

## 5. Communication Plan

### 5.1 Internal Communication

| Time | Audience | Message | Method |
|------|----------|---------|--------|
| 0 min | DR Team | DR Activated | Phone/SMS |
| 15 min | Management | Status update | Email/Slack |
| 30 min | All Staff | Service disruption | Email |
| 60 min | Board | Executive briefing | Phone |
| Recovery | All | Service restored | Email |

### 5.2 External Communication

| Stakeholder | Timing | Method |
|-------------|--------|--------|
| Bangladesh Bank | Within 1 hour | Phone + Written |
| Customers | If > 4 hours | Email/SMS |
| Regulators | As required | Formal report |

---

## 6. Testing and Maintenance

### 6.1 Testing Schedule

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Tabletop | Quarterly | Walkthrough |
| Technical | Semi-annually | DR site activation |
| Full DR Drill | Annually | Complete failover |

### 6.2 Maintenance Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| DR site health check | Weekly | Operations |
| Replication verification | Daily | DBA |
| Documentation review | Quarterly | BCP Coordinator |
| Contact list update | Monthly | HR |

---

## 7. Appendices

### Appendix A: DR Team Contacts

| Role | Primary | Alternate |
|------|---------|-----------|
| DR Coordinator | | |
| Technical Lead | | |
| Communications | | |
| Business Lead | | |

### Appendix B: Critical Vendor Contacts

| Vendor | Service | Contact |
|--------|---------|---------|
| Cloud Provider | Infrastructure | |
| Network Provider | Connectivity | |
| Bangladesh Bank | CIB | |

### Appendix C: DR Site Information

| Item | Details |
|------|---------|
| Location | Chittagong |
| Address | |
| Network | |
| Capacity | |

---

**Document Control Footer**

*Classification: Confidential - Critical*
*Next Review: Quarterly*
*Owner: Operations Manager*

**END OF DOCUMENT**
