# Daily Standup Template

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-PM-0.1.6 |
| **Document Title** | Daily Standup Template |
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
2. [Standup Format](#2-standup-format)
3. [Daily Standup Template](#3-daily-standup-template)
4. [Facilitation Guidelines](#4-facilitation-guidelines)
5. [Remote/Hybrid Guidelines](#5-remotehybrid-guidelines)
6. [Weekly Summary Template](#6-weekly-summary-template)

---

## 1. Introduction

### 1.1 Purpose

The Daily Standup (also called Daily Scrum) is a short, focused meeting to synchronize team activities, identify blockers, and plan the day's work. This document provides templates and guidelines for effective standups.

### 1.2 Meeting Details

| Aspect | Specification |
|--------|---------------|
| **Duration** | 15 minutes (strict) |
| **Frequency** | Daily (Mon-Fri) |
| **Time** | 10:00 AM BST (GMT+6) |
| **Location** | Unisoft Office / Microsoft Teams |
| **Facilitator** | Rotating (weekly) |
| **Attendees** | Core dev team (mandatory) |

### 1.3 Core Principles

1. **Timeboxed**: Maximum 15 minutes
2. **Focused**: Three questions only
3. **Standing**: Keep it short (in-person)
4. **Problem-identifying**: Not problem-solving
5. **Team-focused**: For the team, by the team

---

## 2. Standup Format

### 2.1 The Three Questions

Each team member answers:

```
1. What did I complete YESTERDAY?
   (Focus on completed work, not activities)

2. What will I work on TODAY?
   (Commit to specific deliverables)

3. Do I have any BLOCKERS?
   (Issues preventing progress)
```

### 2.2 Timing Guidelines

| Component | Duration |
|-----------|----------|
| Opening | 1 minute |
| Updates (4 people × 2 min) | 8 minutes |
| Sprint Goal Check | 2 minutes |
| Blockers Summary | 2 minutes |
| Wrap-up | 2 minutes |
| **Total** | **15 minutes** |

### 2.3 Parking Lot

Issues requiring detailed discussion go to the **Parking Lot**:
- Noted during standup
- Addressed after standup
- Only relevant people stay

---

## 3. Daily Standup Template

### 3.1 Meeting Notes Template

```markdown
# ULMS Daily Standup
**Date:** [YYYY-MM-DD]
**Sprint:** Sprint [X] - [Sprint Name]
**Day:** [X] of 10
**Facilitator:** [Name]
**Attendees:** [Names]
**Absent:** [Names with reason]

---

## Sprint Goal
> [Current sprint goal statement]

**Progress:** [X]% complete

---

## Team Updates

### Technical Lead - [Name]
**Yesterday:**
- [ ] [Completed item 1]
- [ ] [Completed item 2]

**Today:**
- [ ] [Planned item 1]
- [ ] [Planned item 2]

**Blockers:**
- [None / Description of blocker]

---

### Dev 1 (Frontend) - [Name]
**Yesterday:**
- [ ] [Completed item 1]
- [ ] [Completed item 2]

**Today:**
- [ ] [Planned item 1]
- [ ] [Planned item 2]

**Blockers:**
- [None / Description of blocker]

---

### Dev 2 (Backend) - [Name]
**Yesterday:**
- [ ] [Completed item 1]
- [ ] [Completed item 2]

**Today:**
- [ ] [Planned item 1]
- [ ] [Planned item 2]

**Blockers:**
- [None / Description of blocker]

---

## Blockers Summary

| # | Blocker | Owner | Impact | Action | Due |
|---|---------|-------|--------|--------|-----|
| 1 | [Description] | [Name] | [High/Med/Low] | [Action] | [Date] |

---

## Parking Lot
Items to discuss after standup:
1. [Topic] - Participants: [Names]
2. [Topic] - Participants: [Names]

---

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| [Action item] | [Name] | [Date] |

---

## Notes
- [Any important announcements]
- [Reminders]

---

**Next Standup:** [Date] at 10:00 AM
**Facilitator:** [Next facilitator name]
```

### 3.2 Example Filled Template

```markdown
# ULMS Daily Standup
**Date:** 2026-02-04
**Sprint:** Sprint 1 - Foundation
**Day:** 2 of 10
**Facilitator:** Lead Dev
**Attendees:** Lead Dev, Dev 1, Dev 2, PM (observer)
**Absent:** None

---

## Sprint Goal
> Complete Fineract setup and basic loan application API with CIB integration stub

**Progress:** 15% complete

---

## Team Updates

### Technical Lead - [Name]
**Yesterday:**
- [x] Completed Fineract local environment setup
- [x] Created database schema for multi-tenant support
- [x] Documented setup process

**Today:**
- [ ] Configure Fineract loan products
- [ ] Set up CI/CD pipeline for backend
- [ ] Review Dev 2's NID service design

**Blockers:**
- None

---

### Dev 1 (Frontend) - [Name]
**Yesterday:**
- [x] Set up React project with Vite
- [x] Configured ESLint and Prettier
- [x] Created basic folder structure

**Today:**
- [ ] Implement authentication flow
- [ ] Create login page with MUI
- [ ] Set up Redux store

**Blockers:**
- Need Keycloak credentials for dev environment (raised to Lead)

---

### Dev 2 (Backend) - [Name]
**Yesterday:**
- [x] Reviewed Apache Fineract documentation
- [x] Started NID service design document
- [ ] CIB mock service (in progress)

**Today:**
- [ ] Complete NID service technical design
- [ ] Start CIB mock implementation
- [ ] Set up WireMock for external services

**Blockers:**
- Waiting for CIB API specification from Bangladesh Bank (pending client)

---

## Blockers Summary

| # | Blocker | Owner | Impact | Action | Due |
|---|---------|-------|--------|--------|-----|
| 1 | Keycloak credentials | Lead Dev | Medium | Set up dev Keycloak instance | Today |
| 2 | CIB API spec | PM | High | Follow up with client | Feb 5 |

---

## Parking Lot
Items to discuss after standup:
1. API versioning strategy - Participants: Lead Dev, Dev 2
2. Bengali font selection for UI - Participants: Dev 1, PM

---

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| Set up Keycloak dev instance | Lead Dev | 2026-02-04 |
| Email client for CIB spec | PM | 2026-02-04 |
| Share Figma designs | PM | 2026-02-05 |

---

## Notes
- Sprint planning for Sprint 2 scheduled for Feb 14
- Team lunch on Friday

---

**Next Standup:** 2026-02-05 at 10:00 AM
**Facilitator:** Dev 1
```

---

## 4. Facilitation Guidelines

### 4.1 Facilitator Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Time Management** | Keep meeting to 15 minutes |
| **Focus** | Redirect off-topic discussions to parking lot |
| **Participation** | Ensure everyone speaks |
| **Documentation** | Record notes or delegate |
| **Follow-up** | Track blockers resolution |

### 4.2 Facilitation Rotation

| Week | Facilitator |
|------|-------------|
| Week 1 | Lead Dev |
| Week 2 | Dev 1 |
| Week 3 | Dev 2 |
| Week 4 | Lead Dev |
| *(Repeat cycle)* | |

### 4.3 Facilitation Script

```
[START - On Time]
"Good morning team, let's start our standup.
Today is [date], Sprint [X], Day [Y] of 10.
Our sprint goal is: [goal statement]

Let's go around. [Name], please start."

[DURING UPDATES]
- If going long: "Let's take that offline"
- If unclear: "What will you deliver today?"
- If blocker: Note it down

[BLOCKERS]
"Let me summarize the blockers:
1. [Blocker] - [Owner] will [action]
2. [Blocker] - We'll discuss after standup"

[PARKING LOT]
"The following topics need further discussion:
1. [Topic] - Stay back: [Names]"

[WRAP UP]
"Any announcements?
Tomorrow's facilitator is [Name].
Thanks everyone, have a productive day!"

[END - Max 15 minutes]
```

### 4.4 Do's and Don'ts

| Do | Don't |
|----|-------|
| Keep updates brief (< 2 min) | Give lengthy explanations |
| Focus on commitments | List activities without outcomes |
| Mention blockers immediately | Wait until end to raise blockers |
| Talk to the team | Report to PM/manager |
| Use specific ticket references | Be vague about work |
| Start and end on time | Wait for latecomers |

---

## 5. Remote/Hybrid Guidelines

### 5.1 Virtual Standup Setup

**Microsoft Teams Meeting:**
- Same time daily: 10:00 AM BST
- Video on (preferred)
- Mute when not speaking
- Use raise hand feature
- Share screen for sprint board

### 5.2 Async Standup Option

For timezone differences or emergencies:

**Slack/Teams Message Format:**
```
📅 Standup Update - [Date]

✅ Yesterday:
- Completed X
- Completed Y

📋 Today:
- Working on X
- Working on Y

🚧 Blockers:
- None / [Description]

cc: @team
```

**Deadline:** Post by 9:45 AM (before standup)

### 5.3 Hybrid Meeting Etiquette

| In-Person | Remote |
|-----------|--------|
| Stand in circle | Camera on |
| No laptops | Mute when not speaking |
| Face the camera | Use speaker view |
| Speak clearly | Raise hand in chat |

---

## 6. Weekly Summary Template

### 6.1 Weekly Summary Document

```markdown
# ULMS Weekly Standup Summary
**Week:** [Week Number] ([Start Date] - [End Date])
**Sprint:** Sprint [X] - [Sprint Name]
**Prepared By:** [PM Name]

---

## Week Overview

| Metric | Value |
|--------|-------|
| Standups Held | 5/5 |
| Average Duration | 12 minutes |
| Blockers Raised | 8 |
| Blockers Resolved | 6 |
| Attendance Rate | 95% |

---

## Sprint Progress

**Sprint Goal:** [Goal statement]

| Day | Progress | Key Achievement |
|-----|----------|-----------------|
| Mon | 15% | Environment setup complete |
| Tue | 25% | Authentication flow working |
| Wed | 35% | Loan product configuration |
| Thu | 50% | CIB mock service deployed |
| Fri | 60% | Integration tests passing |

---

## Work Completed This Week

### Backend
- [x] Fineract environment setup
- [x] Database schema design
- [x] CIB mock service implementation
- [x] Basic loan API endpoints

### Frontend
- [x] React project scaffolding
- [x] Login page implementation
- [x] Redux store configuration
- [x] i18n setup with Bengali

### Infrastructure
- [x] CI/CD pipeline configuration
- [x] Docker compose for local dev
- [x] Keycloak dev instance

---

## Blockers Summary

| Blocker | Raised | Resolved | Duration | Impact |
|---------|--------|----------|----------|--------|
| Keycloak credentials | Mon | Mon | 4 hours | Low |
| CIB API spec | Mon | Wed | 2 days | Medium |
| Database permissions | Tue | Tue | 2 hours | Low |

**Unresolved Blockers:**
- [ ] Bangladesh Bank VPN access - Escalated to client

---

## Team Availability

| Team Member | Mon | Tue | Wed | Thu | Fri |
|-------------|-----|-----|-----|-----|-----|
| Lead Dev | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dev 1 | ✅ | ✅ | 🏥 | ✅ | ✅ |
| Dev 2 | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ Present | 🏥 Sick | 🏖️ Leave | ⚠️ Partial

---

## Parking Lot Items (Discussed)

| Topic | Date | Outcome |
|-------|------|---------|
| API versioning | Mon | Decision: URL path versioning |
| Bengali fonts | Tue | Selected: Noto Sans Bengali |
| Test strategy | Wed | Document created |

---

## Action Items Status

| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Set up Keycloak | Lead Dev | Mon | ✅ Done |
| Get CIB spec | PM | Wed | ✅ Done |
| Review test plan | Lead Dev | Fri | ⏳ In Progress |

---

## Next Week Focus

1. Complete loan application form UI
2. Implement loan submission API
3. Start CIB integration development
4. Begin UAT environment setup

---

## Notes & Observations

- Team velocity improving
- Need to improve estimation accuracy
- Consider earlier standup time for better focus

---

**Prepared:** [Date]
**Distribution:** Team, Stakeholders
```

---

## Appendix A: Quick Reference Card

### Standup Checklist

**Before Standup:**
- [ ] Review your completed work
- [ ] Know what you'll work on today
- [ ] Identify any blockers

**During Standup:**
- [ ] Keep update under 2 minutes
- [ ] Be specific about deliverables
- [ ] Mention ticket numbers
- [ ] Raise blockers immediately

**After Standup:**
- [ ] Stay for parking lot topics (if relevant)
- [ ] Update sprint board
- [ ] Address blockers

### Blocker Escalation

| Blocker Age | Action |
|-------------|--------|
| Same day | Team resolves |
| 1 day | Lead Dev escalates |
| 2+ days | PM escalates to stakeholders |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |

---

**Document End**

*ULMS v2.0 - Daily Standup Template v1.0*

*Unisoft Systems Limited - Confidential*
