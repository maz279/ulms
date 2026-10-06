# Sprint Planning Template
## Unisoft Loan Management System (ULMS) v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Sprint Planning Template - ULMS v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Project Manager |
| **Reviewed By** | Technical Lead |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

---

## Table of Contents

1. [Sprint Information](#1-sprint-information)
2. [Sprint Goal](#2-sprint-goal)
3. [Team Capacity](#3-team-capacity)
4. [Sprint Backlog](#4-sprint-backlog)
5. [Story Estimation](#5-story-estimation)
6. [Task Breakdown](#6-task-breakdown)
7. [Definition of Ready](#7-definition-of-ready)
8. [Definition of Done](#8-definition-of-done)
9. [Risks & Dependencies](#9-risks--dependencies)
10. [Commitment](#10-commitmitment)

---

## 1. Sprint Information

| Field | Value |
|-------|-------|
| **Sprint Number** | Sprint [X] |
| **Sprint Name** | [Descriptive Name] |
| **Duration** | 2 weeks |
| **Start Date** | [YYYY-MM-DD] |
| **End Date** | [YYYY-MM-DD] |
| **Sprint Review** | [YYYY-MM-DD] at [Time] |
| **Sprint Retrospective** | [YYYY-MM-DD] at [Time] |

### Previous Sprint Summary

| Metric | Sprint [X-1] | Trend |
|--------|--------------|-------|
| Committed Story Points | [X] | - |
| Completed Story Points | [Y] | ↑/↓/→ |
| Sprint Velocity | [Z] | ↑/↓/→ |
| Completion Rate | [X]% | ↑/↓/→ |
| Defects Closed | [N] | ↑/↓/→ |

---

## 2. Sprint Goal

### Primary Goal
> [One-sentence statement of what the sprint aims to achieve]

Example:  
*"Implement the core loan application submission workflow with NID verification and CIB inquiry integration, enabling end-to-end loan origination for retail products."*

### Success Criteria
- [ ] [Specific, measurable outcome 1]
- [ ] [Specific, measurable outcome 2]
- [ ] [Specific, measurable outcome 3]

### Business Value
[Description of business value delivered by this sprint]

---

## 3. Team Capacity

### 3.1 Team Availability

| Role | Name | Capacity % | Days Available | Notes |
|------|------|------------|----------------|-------|
| Technical Lead | [Name] | [X]% | [Y] days | [Leave/Training] |
| Frontend Developer | [Name] | [X]% | [Y] days | [Leave/Training] |
| Backend Developer | [Name] | [X]% | [Y] days | [Leave/Training] |
| QA Lead | [Name] | [X]% | [Y] days | [Leave/Training] |
| **Total Capacity** | | **[X]%** | **[Y] days** | |

### 3.2 Working Days Calculation

```
Sprint Duration: 10 working days (2 weeks)
Holidays: [List any public holidays]
Team Events: [List any planned events]
Effective Capacity: [X] person-days
```

### 3.3 Capacity Adjustment Factors

| Factor | Impact | Adjustment |
|--------|--------|------------|
| New team member onboarding | -10% | [X] points |
| Technical debt sprint | -15% | [X] points |
| Production support | -10% | [X] points |
| **Total Adjustment** | | **[X]%** |

### 3.4 Velocity Forecast

```
Average Velocity (last 3 sprints): [X] points
Adjusted for Capacity: [Y] points
Buffer (20%): [Z] points
RECOMMENDED COMMITMENT: [Y - Z] points
```

---

## 4. Sprint Backlog

### 4.1 User Stories

#### Story 1: [Story Title]
| Field | Value |
|-------|-------|
| **Jira ID** | ULMS-[XXX] |
| **As a** | [Role] |
| **I want** | [Action] |
| **So that** | [Benefit] |
| **Priority** | [P0/P1/P2] |
| **Story Points** | [1/2/3/5/8/13] |
| **Assignee** | [Name] |
| **Status** | Ready/Needs Refinement |

**Acceptance Criteria:**
- [ ] [Criterion 1 - Given/When/Then format]
- [ ] [Criterion 2 - Given/When/Then format]
- [ ] [Criterion 3 - Given/When/Then format]

**Notes:**
[Additional context, technical notes, dependencies]

---

#### Story 2: [Story Title]
| Field | Value |
|-------|-------|
| **Jira ID** | ULMS-[XXX] |
| **As a** | [Role] |
| **I want** | [Action] |
| **So that** | [Benefit] |
| **Priority** | [P0/P1/P2] |
| **Story Points** | [1/2/3/5/8/13] |
| **Assignee** | [Name] |

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

### 4.2 Sprint Backlog Summary

| Priority | Jira ID | Story | Points | Assignee | Status |
|----------|---------|-------|--------|----------|--------|
| P0 | ULMS-XXX | [Title] | 5 | [Name] | Ready |
| P0 | ULMS-XXX | [Title] | 8 | [Name] | Ready |
| P1 | ULMS-XXX | [Title] | 3 | [Name] | Ready |
| P1 | ULMS-XXX | [Title] | 5 | [Name] | Ready |
| P2 | ULMS-XXX | [Title] | 3 | [Name] | Ready |

**Total Story Points Committed:** [X]  
**Number of Stories:** [Y]

### 4.3 Sprint Backlog Visualization

```
Story Point Distribution:
┌─────────────────────────────────────────────────────────────┐
│ Frontend (40%)  ████████████████████░░░░░░░░░░░░░░░░░░░░░ │
│ Backend (45%)   ███████████████████████░░░░░░░░░░░░░░░░░░ │
│ QA (10%)        █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ DevOps (5%)     ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────┘

Priority Distribution:
┌─────────────────────────────────────────────────────────────┐
│ P0 (Critical)  ████████████████████████████░░░░░░░░░░░░░░ │
│ P1 (High)      ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ P2 (Medium)    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Story Estimation

### 5.1 Estimation Scale (Fibonacci)

| Points | Complexity | Time (approx) | Example |
|--------|------------|---------------|---------|
| 1 | Trivial | < 2 hours | Text change, config update |
| 2 | Simple | 0.5 day | Simple UI component |
| 3 | Easy | 1 day | Standard API endpoint |
| 5 | Medium | 2-3 days | Feature with integration |
| 8 | Complex | 1 week | Multi-component feature |
| 13 | Very Complex | 1.5-2 weeks | Epic-level work |

### 5.2 Estimation Criteria

We consider:
- **Complexity:** Technical difficulty
- **Uncertainty:** Known vs. unknown factors
- **Effort:** Amount of work required

### 5.3 Estimation Log

| Story | Round 1 | Round 2 | Round 3 | Final | Notes |
|-------|---------|---------|---------|-------|-------|
| ULMS-XXX | 3,5,3 | 3,3,3 | - | 3 | Consensus |
| ULMS-XXX | 5,8,5 | 5,5,5 | - | 5 | Consensus |
| ULMS-XXX | 8,13,8 | - | - | 8 | May need splitting |

---

## 6. Task Breakdown

### 6.1 Story: [ULMS-XXX - Story Title]

| Task ID | Task Description | Assignee | Hours | Status |
|---------|------------------|----------|-------|--------|
| T1 | [Task description] | [Name] | 4 | To Do |
| T2 | [Task description] | [Name] | 6 | To Do |
| T3 | [Task description] | [Name] | 4 | To Do |
| T4 | Code review | [Name] | 2 | To Do |
| T5 | Testing | [Name] | 4 | To Do |

**Total Hours:** [X]

---

### 6.2 Task Board Setup

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│    TODO     │  IN PROGRESS│   REVIEW    │    TEST     │    DONE     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Task 1      │ Task 3      │ Task 2      │             │             │
│ Task 4      │             │             │             │             │
│ Task 5      │             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 7. Definition of Ready

### 7.1 Story Readiness Checklist

| Criterion | ULMS-XXX | ULMS-XXX | ULMS-XXX |
|-----------|----------|----------|----------|
| Story follows INVEST principles | ✓ | ✓ | ✓ |
| Acceptance criteria are clear and testable | ✓ | ✓ | ✓ |
| Story is estimated by the team | ✓ | ✓ | ✓ |
| Dependencies are identified and manageable | ✓ | ✓ | ✓ |
| UI/UX designs are attached (if applicable) | ✓ | N/A | ✓ |
| API contracts defined (if applicable) | ✓ | ✓ | ✓ |
| Technical approach discussed | ✓ | ✓ | ✓ |
| External dependencies resolved | ✓ | ✓ | ⚠ |
| No blocking questions remain | ✓ | ✓ | ✓ |

**Legend:** ✓ = Ready | ⚠ = Needs Work | ✗ = Not Ready

### 7.2 INVEST Check

| Principle | Description | Status |
|-----------|-------------|--------|
| **I**ndependent | Can be developed independently | ✓ |
| **N**egotiable | Details can be discussed | ✓ |
| **V**aluable | Delivers business value | ✓ |
| **E**stimable | Can be estimated by team | ✓ |
| **S**mall | Fits in one sprint | ✓ |
| **T**estable | Has clear acceptance criteria | ✓ |

---

## 8. Definition of Done

### 8.1 Universal Definition of Done

#### Code Quality
- [ ] Code written and follows style guidelines
- [ ] Code reviewed and approved by peer
- [ ] Unit tests written (coverage > 80%)
- [ ] Integration tests written
- [ ] No critical/high SonarQube issues
- [ ] No security vulnerabilities

#### Documentation
- [ ] API documentation updated (OpenAPI)
- [ ] Code comments added for complex logic
- [ ] README updated (if applicable)
- [ ] Architecture Decision Record (if applicable)

#### Testing
- [ ] All acceptance criteria verified
- [ ] QA testing completed
- [ ] Cross-browser testing (frontend)
- [ ] Mobile responsive testing (frontend)

#### Deployment
- [ ] Deployed to staging environment
- [ ] Smoke tests passed in staging
- [ ] Database migrations tested (if applicable)
- [ ] Rollback plan documented (if applicable)

### 8.2 Story-Specific Done Criteria

| Story | Additional Done Criteria |
|-------|-------------------------|
| ULMS-XXX | [Specific criteria] |
| ULMS-XXX | [Specific criteria] |

---

## 9. Risks & Dependencies

### 9.1 Identified Risks

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | [Risk description] | High/Med/Low | High/Med/Low | [Mitigation] | [Name] |
| R2 | [Risk description] | High/Med/Low | High/Med/Low | [Mitigation] | [Name] |

### 9.2 External Dependencies

| Dependency | Needed By | Owner | Status | Contingency |
|------------|-----------|-------|--------|-------------|
| [CIB API access] | [Date] | [Name] | [Status] | [Plan] |
| [UI designs] | [Date] | [Name] | [Status] | [Plan] |
| [Third-party library] | [Date] | [Name] | [Status] | [Plan] |

### 9.3 Internal Dependencies

| Dependency | Dependent Story | Provider Story | Status |
|------------|-----------------|----------------|--------|
| API endpoint | ULMS-XXX | ULMS-YYY | Ready |
| Database schema | ULMS-XXX | ULMS-YYY | In Progress |

---

## 10. Commitment

### 10.1 Team Commitment

We, the development team, commit to:
- Delivering the sprint goal
- Completing [X] story points
- Maintaining quality standards
- Daily communication of progress and blockers
- Escalating risks and issues promptly

### 10.2 Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | _________________ | |
| Frontend Developer | | _________________ | |
| Backend Developer | | _________________ | |
| QA Lead | | _________________ | |
| Product Owner | | _________________ | |
| Scrum Master/PM | | _________________ | |

### 10.3 Product Owner Acceptance

As Product Owner, I:
- [ ] Accept the sprint goal
- [ ] Understand the stories committed
- [ ] Confirm priorities are correct
- [ ] Will be available for questions/clarifications

**Product Owner Signature:** _________________ **Date:** _______

---

## Appendix A: Reference Information

### A.1 Team Velocity History

| Sprint | Committed | Completed | Velocity |
|--------|-----------|-----------|----------|
| Sprint 0 | - | - | Baseline |
| Sprint 1 | [X] | [Y] | [Y] |
| Sprint 2 | [X] | [Y] | [Y] |
| Sprint 3 | [X] | [Y] | [Y] |
| **Average** | | | **[Avg]** |

### A.2 Upcoming Milestones

| Milestone | Target Date | Stories Affected |
|-----------|-------------|------------------|
| Alpha Release | [Date] | [List] |
| Beta Release | [Date] | [List] |
| Production | [Date] | [List] |

### A.3 Holiday Calendar

| Date | Holiday | Impact |
|------|---------|--------|
| [Date] | [Name] | No work |

---

## Appendix B: Sprint Planning Checklist

### Pre-Planning (Day Before)
- [ ] Backlog groomed and prioritized
- [ ] Story estimates reviewed
- [ ] Dependencies identified
- [ ] Stakeholder input gathered
- [ ] Capacity calculated

### During Planning
- [ ] Review sprint goal with team
- [ ] Review team capacity
- [ ] Discuss each story
- [ ] Break down into tasks
- [ ] Assign initial owners
- [ ] Identify risks
- [ ] Finalize commitment

### Post-Planning
- [ ] Update Jira board
- [ ] Send sprint summary email
- [ ] Schedule daily standups
- [ ] Update stakeholders
- [ ] Archive planning notes

---

**Sprint Planning Completed:** [Date]  
**Next Sprint Planning:** [Date]

*Document Classification: Confidential - Internal Use Only*
