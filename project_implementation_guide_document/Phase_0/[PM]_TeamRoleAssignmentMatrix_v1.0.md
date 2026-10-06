# Team Role Assignment Matrix

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-PM-0.1.2 |
| **Document Title** | Team Role Assignment Matrix |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Project Manager |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | PM | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Team Structure](#2-team-structure)
3. [Role Definitions](#3-role-definitions)
4. [RACI Matrix](#4-raci-matrix)
5. [Skills Matrix](#5-skills-matrix)
6. [Escalation Paths](#6-escalation-paths)
7. [Communication Channels](#7-communication-channels)
8. [Backup & Coverage](#8-backup--coverage)
9. [Decision Authority Matrix](#9-decision-authority-matrix)

---

## 1. Introduction

### 1.1 Purpose

This document defines the team structure, roles, responsibilities, and accountability matrix for the ULMS v2.0 project. It ensures clear understanding of who is responsible for each aspect of the project delivery.

### 1.2 Scope

This matrix applies to all team members involved in the development, testing, and deployment of ULMS v2.0, including:
- Core development team (3 full-stack developers)
- Extended stakeholders (client representatives)
- Support functions (QA, DevOps)

### 1.3 References

| Document | Description |
|----------|-------------|
| RFP LMS-BD-2026-001 | Request for Proposal |
| BRD v1.0 | Business Requirements Document |
| Technology Stack v2.0 | Technical Architecture Specification |

---

## 2. Team Structure

### 2.1 Organization Chart

```
                    ┌─────────────────────┐
                    │   Project Manager   │
                    │       (PM)          │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐ ┌────▼────┐ ┌────────▼────────┐
    │   Technical Lead  │ │  Dev 1  │ │      Dev 2      │
    │    (Lead Dev)     │ │Frontend │ │ Backend/Mobile  │
    └───────────────────┘ └─────────┘ └─────────────────┘
```

### 2.2 Team Composition

| Role | Name/Designation | Allocation | Location |
|------|------------------|------------|----------|
| Project Manager | TBD | 50% | Dhaka HQ |
| Technical Lead (Lead Dev) | TBD | 100% | Dhaka HQ |
| Frontend Developer (Dev 1) | TBD | 100% | Dhaka HQ |
| Backend/Mobile Developer (Dev 2) | TBD | 100% | Dhaka HQ |
| Business Analyst | TBD | 50% | Dhaka HQ |
| QA Engineer | TBD | As needed | Dhaka HQ |

### 2.3 Working Hours

| Parameter | Value |
|-----------|-------|
| Standard Hours | 9:00 AM - 6:00 PM (BST, GMT+6) |
| Core Hours | 10:00 AM - 4:00 PM |
| Sprint Duration | 2 weeks |
| Daily Standup | 10:00 AM (15 minutes) |

---

## 3. Role Definitions

### 3.1 Project Manager (PM)

**Primary Function:** Overall project delivery, stakeholder management, and resource coordination.

| Category | Details |
|----------|---------|
| **Key Responsibilities** | - Project planning and scheduling |
| | - Stakeholder communication |
| | - Risk management |
| | - Budget tracking |
| | - Sprint planning facilitation |
| | - Progress reporting |
| | - Resource allocation |
| | - Change management |
| **Required Skills** | - PMP/Agile certification preferred |
| | - Banking domain experience |
| | - Strong communication |
| | - MS Project/Jira proficiency |
| **Authority** | - Approve scope changes < 5% |
| | - Approve resource reallocation |
| | - Escalate to steering committee |
| **Reporting To** | Steering Committee / Client |

### 3.2 Technical Lead (Lead Dev)

**Primary Function:** Technical architecture, code quality, and development leadership.

| Category | Details |
|----------|---------|
| **Key Responsibilities** | - System architecture design |
| | - Code review and quality assurance |
| | - Technical decision making |
| | - Backend microservices development |
| | - Apache Fineract customization |
| | - DevOps and CI/CD pipeline |
| | - Database design and optimization |
| | - Security implementation |
| | - Integration architecture (CIB, NID, CBS) |
| | - Performance optimization |
| | - Technical documentation |
| | - Mentoring Dev 1 and Dev 2 |
| **Required Skills** | - Java 21 / Spring Boot 3.2 expert |
| | - Apache Fineract experience |
| | - PostgreSQL / Redis expertise |
| | - Kubernetes / Docker proficiency |
| | - API design (REST/OpenAPI) |
| | - Security best practices |
| **Authority** | - Approve technical designs |
| | - Approve code merges to main |
| | - Select tools and libraries |
| | - Define coding standards |
| **Reporting To** | Project Manager |

### 3.3 Frontend Developer (Dev 1)

**Primary Function:** Web application development using React/TypeScript.

| Category | Details |
|----------|---------|
| **Key Responsibilities** | - React 18 frontend development |
| | - TypeScript implementation |
| | - UI/UX implementation (MUI components) |
| | - State management (Redux Toolkit) |
| | - API integration (TanStack Query) |
| | - Form handling (React Hook Form + Zod) |
| | - Internationalization (Bengali/English) |
| | - Frontend testing (Vitest, Playwright) |
| | - Accessibility compliance (WCAG 2.1 AA) |
| | - Performance optimization |
| | - Component library development |
| **Required Skills** | - React 18 / TypeScript 5.x |
| | - Redux Toolkit / RTK Query |
| | - Material-UI (MUI) 5.x |
| | - React Hook Form / Zod |
| | - Vite build tooling |
| | - Testing (Vitest, Testing Library) |
| **Authority** | - UI/UX decisions within guidelines |
| | - Frontend library selection |
| | - Component architecture |
| **Reporting To** | Technical Lead |

### 3.4 Backend/Mobile Developer (Dev 2)

**Primary Function:** Backend services and mobile application development.

| Category | Details |
|----------|---------|
| **Key Responsibilities** | - Spring Boot microservices |
| | - NID/e-KYC service development |
| | - Document management service |
| | - Notification service (SMS/Email) |
| | - React Native CPV mobile app |
| | - Offline data sync implementation |
| | - GPS and camera integration |
| | - Backend testing (JUnit, Testcontainers) |
| | - API implementation |
| | - Payment gateway integration |
| **Required Skills** | - Java 21 / Spring Boot 3.2 |
| | - React Native 0.73 |
| | - REST API development |
| | - PostgreSQL / Redis |
| | - Mobile development (Android/iOS) |
| | - JUnit 5 / Mockito |
| **Authority** | - Mobile app architecture |
| | - Service implementation decisions |
| **Reporting To** | Technical Lead |

### 3.5 Business Analyst (BA)

**Primary Function:** Requirements analysis and Bangladesh banking domain expertise.

| Category | Details |
|----------|---------|
| **Key Responsibilities** | - Requirements gathering and analysis |
| | - Bangladesh banking domain training |
| | - BRPD compliance verification |
| | - User story creation |
| | - UAT coordination |
| | - Business process documentation |
| | - Stakeholder liaison |
| **Required Skills** | - Banking domain expertise |
| | - BRPD/Bangladesh Bank regulations |
| | - Requirements documentation |
| | - Process modeling |
| **Authority** | - Clarify business requirements |
| | - Validate compliance mapping |
| **Reporting To** | Project Manager |

---

## 4. RACI Matrix

### 4.1 Legend

| Code | Meaning |
|------|---------|
| **R** | Responsible - Does the work |
| **A** | Accountable - Final authority, approves |
| **C** | Consulted - Provides input before decision |
| **I** | Informed - Notified after decision |

### 4.2 Project Management Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| Project Planning | A/R | C | I | I | C |
| Sprint Planning | A | R | R | R | C |
| Daily Standups | A | R | R | R | I |
| Sprint Review | A | R | R | R | C |
| Sprint Retrospective | A | R | R | R | I |
| Risk Management | A/R | C | I | I | C |
| Stakeholder Communication | A/R | C | I | I | C |
| Progress Reporting | A/R | C | I | I | I |
| Change Management | A | C | I | I | C |
| Resource Allocation | A/R | C | I | I | I |

### 4.3 Architecture & Design Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| System Architecture Design | I | A/R | C | C | C |
| Database Design | I | A/R | I | C | C |
| API Design | I | A/R | C | C | C |
| Security Architecture | I | A/R | C | C | I |
| UI/UX Design | I | A | R | I | C |
| Mobile App Architecture | I | A | I | R | C |
| Integration Design (CIB/NID) | I | A/R | I | C | C |
| Workflow Design (Camunda) | I | A/R | C | C | C |

### 4.4 Development Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| Fineract Customization | I | A/R | I | C | I |
| CIB Service Development | I | A/R | I | C | I |
| BRPD Compliance Service | I | A/R | I | C | C |
| Workflow Engine Integration | I | A/R | C | C | C |
| React Frontend Development | I | A | R | I | C |
| Component Library | I | A | R | I | I |
| State Management (Redux) | I | A | R | I | I |
| NID/e-KYC Service | I | A | I | R | C |
| Document Service | I | A | I | R | I |
| Notification Service | I | A | I | R | I |
| Mobile CPV App | I | A | I | R | C |
| Offline Sync Implementation | I | A | I | R | I |
| API Development | I | A | C | R | I |
| Database Implementation | I | A/R | I | C | I |

### 4.5 Quality Assurance Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| Code Review | I | A/R | R | R | I |
| Unit Testing | I | A | R | R | I |
| Integration Testing | I | A/R | R | R | I |
| E2E Testing | I | A | R | C | C |
| Performance Testing | I | A/R | C | C | I |
| Security Testing | I | A/R | C | C | I |
| UAT Coordination | A | C | C | C | R |
| Bug Fixing | I | A | R | R | I |

### 4.6 DevOps & Deployment Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| CI/CD Pipeline Setup | I | A/R | C | C | I |
| Kubernetes Configuration | I | A/R | I | C | I |
| Docker Containerization | I | A/R | C | C | I |
| Environment Setup | I | A/R | C | C | I |
| Production Deployment | A | R | C | C | I |
| Monitoring Setup | I | A/R | I | C | I |
| Backup Configuration | I | A/R | I | I | I |

### 4.7 Documentation Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| Technical Architecture Docs | I | A/R | C | C | I |
| API Documentation | I | A | C | R | I |
| User Documentation | C | A | R | I | R |
| Operations Runbook | I | A/R | I | C | I |
| Training Materials | C | C | C | C | A/R |
| Compliance Documentation | C | C | I | I | A/R |

### 4.8 Compliance & Regulatory Activities

| Activity | PM | Lead Dev | Dev 1 | Dev 2 | BA |
|----------|:--:|:--------:|:-----:|:-----:|:--:|
| BRPD Compliance Verification | C | C | I | I | A/R |
| CIB Integration Validation | I | A/R | I | C | C |
| Security Audit Preparation | C | A/R | C | C | C |
| Bangladesh Bank Reporting | I | C | I | I | A/R |
| IFRS-9 ECL Implementation | I | A/R | I | C | C |

---

## 5. Skills Matrix

### 5.1 Technical Skills Assessment

| Skill Area | Lead Dev | Dev 1 | Dev 2 | Required Level |
|------------|:--------:|:-----:|:-----:|:--------------:|
| **Backend** |
| Java 21 | Expert | Intermediate | Advanced | Advanced |
| Spring Boot 3.2 | Expert | Intermediate | Advanced | Advanced |
| Apache Fineract | Advanced | Basic | Intermediate | Advanced |
| PostgreSQL 16 | Expert | Intermediate | Advanced | Advanced |
| Redis | Advanced | Intermediate | Intermediate | Intermediate |
| Kafka | Advanced | Basic | Intermediate | Intermediate |
| **Frontend** |
| React 18 | Advanced | Expert | Intermediate | Expert |
| TypeScript 5.x | Advanced | Expert | Intermediate | Expert |
| Redux Toolkit | Intermediate | Expert | Intermediate | Advanced |
| Material-UI | Intermediate | Expert | Basic | Advanced |
| **Mobile** |
| React Native | Intermediate | Advanced | Expert | Expert |
| Offline Storage | Intermediate | Intermediate | Expert | Advanced |
| GPS/Camera | Basic | Intermediate | Expert | Advanced |
| **DevOps** |
| Docker | Expert | Intermediate | Intermediate | Advanced |
| Kubernetes | Expert | Basic | Intermediate | Advanced |
| GitLab CI | Expert | Intermediate | Intermediate | Advanced |
| **Security** |
| OAuth 2.0/JWT | Expert | Advanced | Intermediate | Advanced |
| Keycloak | Expert | Intermediate | Intermediate | Advanced |
| Encryption | Expert | Intermediate | Intermediate | Advanced |

### 5.2 Domain Skills Assessment

| Domain Area | Lead Dev | Dev 1 | Dev 2 | BA | Required |
|-------------|:--------:|:-----:|:-----:|:--:|:--------:|
| Bangladesh Banking | Intermediate | Basic | Basic | Expert | Expert |
| BRPD Regulations | Intermediate | Basic | Basic | Expert | Expert |
| CIB Operations | Intermediate | Basic | Basic | Expert | Expert |
| Loan Processing | Advanced | Intermediate | Intermediate | Expert | Advanced |
| Credit Scoring | Intermediate | Basic | Basic | Advanced | Advanced |
| IFRS-9/Basel III | Basic | Basic | Basic | Advanced | Intermediate |

### 5.3 Skill Development Plan

| Team Member | Skill Gap | Training Required | Timeline |
|-------------|-----------|-------------------|----------|
| Lead Dev | Bangladesh Banking | Domain training | Week 1-2 |
| Dev 1 | Apache Fineract | Fineract learning path | Week 1-2 |
| Dev 1 | Banking domain | Domain overview | Week 2 |
| Dev 2 | Apache Fineract | Fineract learning path | Week 1-2 |
| Dev 2 | BRPD compliance | Regulatory training | Week 2 |

---

## 6. Escalation Paths

### 6.1 Technical Escalation

```
┌─────────────────────────────────────────────────────────┐
│                    TECHNICAL ISSUES                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Level 1: Developer (Dev 1 / Dev 2)                    │
│      │     Resolution: < 4 hours                        │
│      ▼                                                  │
│   Level 2: Technical Lead                               │
│      │     Resolution: < 8 hours                        │
│      ▼                                                  │
│   Level 3: External Consultant / Vendor Support         │
│            Resolution: < 24 hours                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Project Escalation

```
┌─────────────────────────────────────────────────────────┐
│                    PROJECT ISSUES                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Level 1: Team Lead / Technical Lead                   │
│      │     Resolution: < 1 day                          │
│      ▼                                                  │
│   Level 2: Project Manager                              │
│      │     Resolution: < 2 days                         │
│      ▼                                                  │
│   Level 3: Steering Committee                           │
│            Resolution: < 1 week                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Escalation Matrix

| Issue Type | Severity | First Contact | Escalation Time | Final Authority |
|------------|----------|---------------|-----------------|-----------------|
| Code bug | Low | Developer | 8 hours | Technical Lead |
| Code bug | High | Technical Lead | 4 hours | PM + External |
| Integration failure | Critical | Technical Lead | 2 hours | PM + Vendor |
| Security issue | Critical | Technical Lead | 1 hour | PM + Security |
| Scope change | Medium | PM | 24 hours | Steering Committee |
| Resource conflict | Medium | PM | 24 hours | Steering Committee |
| Timeline risk | High | PM | 4 hours | Steering Committee |
| Budget overrun | High | PM | 4 hours | Steering Committee |

---

## 7. Communication Channels

### 7.1 Internal Communication

| Channel | Purpose | Participants | Frequency |
|---------|---------|--------------|-----------|
| Daily Standup | Status sync | All dev team | Daily 10:00 AM |
| Slack/Teams | Quick questions | All team | Real-time |
| Sprint Planning | Work planning | All team | Bi-weekly |
| Sprint Review | Demo & feedback | All + stakeholders | Bi-weekly |
| Retrospective | Process improvement | Dev team | Bi-weekly |
| Technical Sync | Architecture decisions | Lead Dev + Devs | Weekly |
| 1:1 Meetings | Individual check-in | PM + each member | Weekly |

### 7.2 External Communication

| Channel | Purpose | Participants | Frequency |
|---------|---------|--------------|-----------|
| Steering Committee | Major decisions | PM + Client leadership | Monthly |
| Status Report | Progress update | PM + Client PM | Weekly |
| UAT Meetings | User acceptance | BA + Client users | As scheduled |
| Change Board | Change approval | PM + Client + Lead | As needed |

### 7.3 Communication Matrix

| From/To | PM | Lead Dev | Dev 1 | Dev 2 | BA | Client |
|---------|:--:|:--------:|:-----:|:-----:|:--:|:------:|
| PM | - | Direct | Direct | Direct | Direct | Direct |
| Lead Dev | Direct | - | Direct | Direct | Direct | Via PM |
| Dev 1 | Direct | Direct | - | Direct | Direct | Via PM |
| Dev 2 | Direct | Direct | Direct | - | Direct | Via PM |
| BA | Direct | Direct | Direct | Direct | - | Via PM |
| Client | Direct | Via PM | Via PM | Via PM | Direct | - |

---

## 8. Backup & Coverage

### 8.1 Primary and Backup Assignments

| Role | Primary | Backup | Coverage Scope |
|------|---------|--------|----------------|
| Project Manager | PM | Lead Dev | Meetings, decisions |
| Technical Lead | Lead Dev | Dev 2 | Code review, architecture |
| Frontend Lead | Dev 1 | Lead Dev | UI decisions, React |
| Backend Lead | Lead Dev | Dev 2 | APIs, services |
| Mobile Lead | Dev 2 | Dev 1 | React Native |
| DevOps | Lead Dev | Dev 2 | CI/CD, deployment |
| BA/Domain | BA | PM | Requirements, compliance |

### 8.2 Vacation/Leave Coverage

| Scenario | Duration | Coverage Plan |
|----------|----------|---------------|
| PM absent | < 3 days | Lead Dev handles standups, status |
| PM absent | > 3 days | Escalate to steering committee |
| Lead Dev absent | < 3 days | Dev 2 handles code reviews |
| Lead Dev absent | > 3 days | Split duties: Dev 1 (FE), Dev 2 (BE) |
| Dev 1 absent | Any | Lead Dev covers critical frontend |
| Dev 2 absent | Any | Lead Dev covers critical backend |
| BA absent | < 1 week | PM handles requirements clarification |

### 8.3 Knowledge Transfer Requirements

| Area | Primary Owner | Documentation Required | Backup Training |
|------|---------------|----------------------|-----------------|
| Fineract customization | Lead Dev | Architecture docs | Dev 2 |
| CIB integration | Lead Dev | Integration guide | Dev 2 |
| React frontend | Dev 1 | Component docs | Lead Dev |
| Mobile app | Dev 2 | Mobile architecture | Dev 1 |
| DevOps/CI | Lead Dev | Runbook | Dev 2 |
| Bangladesh regulations | BA | Training materials | PM |

---

## 9. Decision Authority Matrix

### 9.1 Technical Decisions

| Decision Type | Decider | Consulted | Approval Required |
|---------------|---------|-----------|-------------------|
| Technology selection | Lead Dev | Team | PM awareness |
| Architecture changes | Lead Dev | Team | PM approval |
| Library/framework choice | Lead Dev | Dev 1/2 | None |
| Database schema changes | Lead Dev | BA | PM awareness |
| API contract changes | Lead Dev | Dev 1/2, BA | PM awareness |
| Security implementation | Lead Dev | External | PM approval |
| Performance optimization | Lead Dev | Team | None |
| Code merge to main | Lead Dev | Reviewer | None |
| Code merge to release | Lead Dev | PM | PM approval |

### 9.2 Project Decisions

| Decision Type | Decider | Consulted | Approval Required |
|---------------|---------|-----------|-------------------|
| Sprint scope | PM | Team | Lead Dev agreement |
| Timeline changes | PM | Lead Dev | Steering Committee |
| Budget reallocation | PM | Lead Dev | Steering Committee |
| Resource changes | PM | Lead Dev | Steering Committee |
| Scope changes (< 5%) | PM | Lead Dev, BA | Client PM |
| Scope changes (> 5%) | Steering Committee | PM, Team | Client leadership |
| Risk mitigation | PM | Lead Dev | None |
| Process changes | PM | Team | None |

### 9.3 Approval Thresholds

| Category | PM Authority | Steering Authority |
|----------|--------------|---------------------|
| Budget variance | < 5% | > 5% |
| Timeline change | < 1 week | > 1 week |
| Scope change | < 5% effort | > 5% effort |
| Resource addition | Temporary (< 2 weeks) | Permanent |
| Technical debt | < 2 sprints | > 2 sprints |
| External dependency | Evaluation only | Contract/Purchase |

---

## Appendix A: Role Contact Information

| Role | Name | Email | Phone | Slack/Teams |
|------|------|-------|-------|-------------|
| Project Manager | TBD | pm@unisoft.com | +880-xxx | @pm |
| Technical Lead | TBD | lead@unisoft.com | +880-xxx | @lead-dev |
| Frontend Dev (Dev 1) | TBD | dev1@unisoft.com | +880-xxx | @dev1 |
| Backend Dev (Dev 2) | TBD | dev2@unisoft.com | +880-xxx | @dev2 |
| Business Analyst | TBD | ba@unisoft.com | +880-xxx | @ba |

---

## Appendix B: ULMS Module Ownership

| Module | Primary Owner | Secondary | Reviewer |
|--------|---------------|-----------|----------|
| **Backend Services** |
| Fineract Core | Lead Dev | Dev 2 | - |
| CIB Service | Lead Dev | Dev 2 | - |
| BRPD Service | Lead Dev | Dev 2 | BA |
| NID/e-KYC Service | Dev 2 | Lead Dev | - |
| Workflow Service | Lead Dev | Dev 2 | - |
| Document Service | Dev 2 | Lead Dev | - |
| Notification Service | Dev 2 | Lead Dev | - |
| Analytics Service | Lead Dev | Dev 2 | - |
| **Frontend Modules** |
| LOS Module | Dev 1 | Lead Dev | BA |
| Credit Module | Dev 1 | Lead Dev | BA |
| Workflow UI | Dev 1 | Lead Dev | - |
| Reporting Module | Dev 1 | Lead Dev | BA |
| Admin Module | Dev 1 | Lead Dev | - |
| Component Library | Dev 1 | Lead Dev | - |
| **Mobile** |
| CPV Mobile App | Dev 2 | Dev 1 | Lead Dev |
| **Infrastructure** |
| CI/CD Pipeline | Lead Dev | Dev 2 | - |
| Kubernetes Config | Lead Dev | Dev 2 | - |
| Monitoring | Lead Dev | Dev 2 | - |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |
| Client Representative | | | |

---

**Document End**

*ULMS v2.0 - Team Role Assignment Matrix v1.0*

*Unisoft Systems Limited - Confidential*
