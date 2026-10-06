# RBAC Authorization Matrix
## ULMS v2.0 - Role-Based Access Control Design

| Document ID | Version | Classification | Last Updated |
|-------------|---------|----------------|--------------|
| ARCH-SEC-006 | 1.0 | Confidential | 2025-01-15 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Role Definitions](#2-role-definitions)
3. [7-Level Approval Hierarchy](#3-7-level-approval-hierarchy)
4. [Permission Matrix](#4-permission-matrix)
5. [Keycloak Role Configuration](#5-keycloak-role-configuration)
6. [JWT Claims Structure](#6-jwt-claims-structure)
7. [Database Schema](#7-database-schema)
8. [SLA Configuration](#8-sla-configuration)
9. [Implementation Guidelines](#9-implementation-guidelines)
10. [Compliance Mapping](#10-compliance-mapping)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the Role-Based Access Control (RBAC) authorization matrix for the Unified Loan Management System (ULMS) v2.0. It establishes the complete framework for managing user permissions, approval workflows, and access controls across all system modules.

### 1.2 Scope

- **11 Operational Roles** with hierarchical permissions
- **7-Level Approval Hierarchy** for loan decisions
- **Module-level Permission Matrix** with CRUD operations
- **Integration** with Keycloak 23 for centralized identity management
- **Compliance** with ICT Security Guidelines V4.0 and BRPD Circular 15/2024

### 1.3 Key Specifications

| Specification | Value |
|--------------|-------|
| Total Operational Roles | 11 |
| Administrative Roles | 2 (Credit Admin, System Admin) |
| Approval Levels | 7 (L1-L7) |
| Maximum Authority | Managing Director (Unlimited) |
| Role Storage | Keycloak + JWT Claims |
| SLA Range | 4-72 hours by level |
| Permission Model | RBAC with ABAC extensions |

### 1.4 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ULMS RBAC Architecture                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   Keycloak  │    │  API Gateway │    │  Backend    │                  │
│  │   (IdP)     │───▶│   (Kong)     │───▶│  Services   │                  │
│  │             │    │              │    │             │                  │
│  │ • Realm     │    │ • JWT Valid  │    │ • @Secured  │                  │
│  │ • Roles     │    │ • Rate Limit │    │ • SpEL Auth │                  │
│  │ • Groups    │    │ • Scope Check│    │ • DB RBAC   │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│         │                                     │                          │
│         │         ┌─────────────────┐         │                          │
│         └────────▶│  JWT Token      │◀────────┘                          │
│                   │                 │                                    │
│                   │ • sub (userId)  │                                    │
│                   │ • roles[]       │                                    │
│                   │ • tenantId      │                                    │
│                   │ • branchId      │                                    │
│                   │ • approvalLimit │                                    │
│                   │ • permissions[] │                                    │
│                   └─────────────────┘                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Role Definitions

### 2.1 Role Hierarchy Overview

```
                    ┌─────────────────────┐
                    │  Managing Director  │  L7 - Unlimited
                    │       (MD)          │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │    Deputy MD        │  L6 - Up to 10 Cr
                    │      (DMD)          │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────┴─────────┐     │      ┌─────────┴─────────┐
    │  Credit Committee │     │      │   Head of Credit  │  L4 - Up to 1 Cr
    │       (CC)        │ L5  │      │      (HOC)        │
    └───────────────────┘     │      └─────────┬─────────┘
                              │                │
                    ┌─────────┴─────────┐      │
                    │  Regional Manager │──────┘  L3 - Up to 25 Lakh
                    │       (RM)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Branch Manager   │  L2 - Up to 10 Lakh
                    │       (BM)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Branch Credit Head│  L1 - Up to 5 Lakh
                    │      (BCH)        │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────┴───────┐   ┌─────────┴─────────┐   ┌───────┴───────┐
│  Credit       │   │    CPV Officer    │   │  Branch User  │
│  Analyst (Br) │   │                   │   │               │
└───────────────┘   └───────────────────┘   └───────────────┘
```

### 2.2 Detailed Role Definitions

#### 2.2.1 Branch Level Roles

| Role ID | Role Name | Code | Description | Reports To |
|---------|-----------|------|-------------|------------|
| R001 | Branch User | `BRANCH_USER` | Entry-level staff for data entry and basic operations | Branch Credit Head |
| R002 | Credit Analyst (Branch) | `CREDIT_ANALYST_BRANCH` | Analyzes loan applications, prepares credit assessments | Branch Credit Head |
| R003 | CPV Officer | `CPV_OFFICER` | Contact Point Verification - field verification duties | Branch Credit Head |
| R004 | Branch Credit Head | `BRANCH_CREDIT_HEAD` | Supervises branch credit operations, L1 approval authority | Branch Manager |
| R005 | Branch Manager | `BRANCH_MANAGER` | Overall branch management, L2 approval authority | Regional Manager |

#### 2.2.2 Regional Level Roles

| Role ID | Role Name | Code | Description | Reports To |
|---------|-----------|------|-------------|------------|
| R006 | Regional Manager | `REGIONAL_MANAGER` | Oversees multiple branches, L3 approval authority | Head of Credit |

#### 2.2.3 Head Office Roles

| Role ID | Role Name | Code | Description | Reports To |
|---------|-----------|------|-------------|------------|
| R007 | HO Credit Division | `HO_CREDIT_DIVISION` | Head office credit processing and policy | Head of Credit |
| R008 | Credit Analyst (HO) | `CREDIT_ANALYST_HO` | Senior analysis, complex cases, policy compliance | Head of Credit |
| R009 | Head of Credit | `HEAD_OF_CREDIT` | Chief credit officer, L4 approval authority | Deputy MD |

#### 2.2.4 Executive Level Roles

| Role ID | Role Name | Code | Description | Reports To |
|---------|-----------|------|-------------|------------|
| R010 | Deputy MD | `DEPUTY_MD` | Deputy executive, L6 approval authority | Managing Director |
| R011 | Managing Director | `MANAGING_DIRECTOR` | Chief executive, L7 unlimited authority | Board |

#### 2.2.5 Administrative Roles

| Role ID | Role Name | Code | Description | Reports To |
|---------|-----------|------|-------------|------------|
| R012 | Credit Admin | `CREDIT_ADMIN` | Credit system administration, no approval authority | Head of Credit |
| R013 | System Admin | `SYSTEM_ADMIN` | IT system administration, full technical access | IT Head |

### 2.3 Role Capabilities Matrix

| Role | Data Entry | View Reports | Analyze | Approve | Configure | Audit |
|------|------------|--------------|---------|---------|-----------|-------|
| Branch User | ✓ | Limited | ✗ | ✗ | ✗ | ✗ |
| Credit Analyst (Br) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| CPV Officer | ✓ | Limited | ✗ | ✗ | ✗ | ✗ |
| Branch Credit Head | ✓ | ✓ | ✓ | L1 | ✗ | ✗ |
| Branch Manager | ✓ | ✓ | ✓ | L2 | Limited | ✗ |
| Regional Manager | ✓ | ✓ | ✓ | L3 | Limited | ✗ |
| HO Credit Division | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| Credit Analyst (HO) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Head of Credit | ✓ | ✓ | ✓ | L4 | ✓ | ✓ |
| Deputy MD | Limited | ✓ | ✓ | L6 | ✗ | ✓ |
| Managing Director | Limited | ✓ | ✓ | L7 | ✗ | ✓ |
| Credit Admin | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| System Admin | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |

---

## 3. 7-Level Approval Hierarchy

### 3.1 Approval Levels Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ULMS 7-Level Approval Hierarchy                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Level   │ Authority          │ Limit (BDT)        │ SLA    │ Escalation        │
│  ────────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│                                                                                  │
│   L7     │ Managing Director  │ Above 10 Crore     │ 72 hrs │ Board/EC          │
│          │                    │ (Unlimited)        │        │                   │
│   ───────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│   L6     │ Deputy MD          │ 5.01 - 10 Crore    │ 48 hrs │ → L7              │
│          │                    │                    │        │                   │
│   ───────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│   L5     │ Credit Committee   │ 1.01 - 5 Crore     │ 24 hrs │ → L6              │
│          │                    │                    │        │                   │
│   ───────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│   L4     │ Head of Credit     │ 25.01 Lakh - 1 Cr  │ 12 hrs │ → L5              │
│          │                    │                    │        │                   │
│   ───────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│   L3     │ Regional Manager   │ 10.01 - 25 Lakh    │ 8 hrs  │ → L4              │
│          │                    │                    │        │                   │
│   ───────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│   L2     │ Branch Manager     │ 5.01 - 10 Lakh     │ 6 hrs  │ → L3              │
│          │                    │                    │        │                   │
│   ───────┼────────────────────┼────────────────────┼────────┼─────────────────  │
│   L1     │ Branch Credit Head │ Up to 5 Lakh       │ 4 hrs  │ → L2              │
│          │                    │                    │        │                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Approval Level Details

| Level | Role | Min Amount (BDT) | Max Amount (BDT) | SLA Hours | Auto-Escalation |
|-------|------|------------------|------------------|-----------|-----------------|
| L1 | Branch Credit Head | 0 | 5,00,000 | 4 | After 6 hours |
| L2 | Branch Manager | 5,00,001 | 10,00,000 | 6 | After 8 hours |
| L3 | Regional Manager | 10,00,001 | 25,00,000 | 8 | After 12 hours |
| L4 | Head of Credit | 25,00,001 | 1,00,00,000 | 12 | After 18 hours |
| L5 | Credit Committee | 1,00,00,001 | 5,00,00,000 | 24 | After 36 hours |
| L6 | Deputy MD | 5,00,00,001 | 10,00,00,000 | 48 | After 72 hours |
| L7 | Managing Director | 10,00,00,001 | Unlimited | 72 | Board/EC |

### 3.3 Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Loan Approval Workflow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │ Application  │                                                           │
│  │   Created    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐     ┌──────────────┐                                      │
│  │   Credit     │────▶│  CIB Check   │                                      │
│  │   Analysis   │     │  (Auto)      │                                      │
│  └──────┬───────┘     └──────────────┘                                      │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │  Determine   │──────────────────────────────────────────┐                │
│  │  Approval    │                                          │                │
│  │  Level       │                                          │                │
│  └──────┬───────┘                                          │                │
│         │                                                  │                │
│    ┌────┴────┬────────┬────────┬────────┬────────┬────────┤                │
│    ▼         ▼        ▼        ▼        ▼        ▼        ▼                │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐             │
│  │ L1 │   │ L2 │   │ L3 │   │ L4 │   │ L5 │   │ L6 │   │ L7 │             │
│  │≤5L │   │≤10L│   │≤25L│   │≤1Cr│   │≤5Cr│   │≤10C│   │>10C│             │
│  └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘             │
│     │        │        │        │        │        │        │                │
│     └────────┴────────┴────────┴────────┴────────┴────────┘                │
│                               │                                             │
│                               ▼                                             │
│                    ┌──────────────────┐                                     │
│                    │    Decision      │                                     │
│                    │  ┌────┐ ┌────┐   │                                     │
│                    │  │ ✓  │ │ ✗  │   │                                     │
│                    │  └──┬─┘ └──┬─┘   │                                     │
│                    └─────┼──────┼─────┘                                     │
│                          │      │                                           │
│                          ▼      ▼                                           │
│                    ┌────────┐ ┌────────┐                                    │
│                    │Approved│ │Rejected│                                    │
│                    └────────┘ └────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Legend: L = Lakh, Cr = Crore
```

### 3.4 Escalation Rules

```java
public class ApprovalEscalationRules {

    // Auto-escalation configuration
    public static final Map<ApprovalLevel, EscalationConfig> ESCALATION_CONFIG = Map.of(
        ApprovalLevel.L1, new EscalationConfig(4, 6, ApprovalLevel.L2),
        ApprovalLevel.L2, new EscalationConfig(6, 8, ApprovalLevel.L3),
        ApprovalLevel.L3, new EscalationConfig(8, 12, ApprovalLevel.L4),
        ApprovalLevel.L4, new EscalationConfig(12, 18, ApprovalLevel.L5),
        ApprovalLevel.L5, new EscalationConfig(24, 36, ApprovalLevel.L6),
        ApprovalLevel.L6, new EscalationConfig(48, 72, ApprovalLevel.L7),
        ApprovalLevel.L7, new EscalationConfig(72, 96, null) // Board escalation
    );

    @Data
    @AllArgsConstructor
    public static class EscalationConfig {
        private int slaHours;
        private int autoEscalateAfterHours;
        private ApprovalLevel escalateTo;
    }
}
```

---

## 4. Permission Matrix

### 4.1 Module-Level Permissions

#### 4.1.1 Loan Application Module

| Permission | Branch User | Credit Analyst (Br) | CPV Officer | BCH | BM | RM | HO Credit | Credit Analyst (HO) | HOC | DMD | MD |
|------------|-------------|---------------------|-------------|-----|----|----|-----------|---------------------|-----|-----|-----|
| Create Application | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Own Branch | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Regional | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View All | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Draft | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delete Draft | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Submit for Approval | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |

#### 4.1.2 Credit Analysis Module

| Permission | Branch User | Credit Analyst (Br) | CPV Officer | BCH | BM | RM | HO Credit | Credit Analyst (HO) | HOC | DMD | MD |
|------------|-------------|---------------------|-------------|-----|----|----|-----------|---------------------|-----|-----|-----|
| Create Analysis | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Analysis | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Analysis | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| CIB Query | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Risk Assessment | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

#### 4.1.3 CPV (Contact Point Verification) Module

| Permission | Branch User | Credit Analyst (Br) | CPV Officer | BCH | BM | RM | HO Credit | Credit Analyst (HO) | HOC | DMD | MD |
|------------|-------------|---------------------|-------------|-----|----|----|-----------|---------------------|-----|-----|-----|
| Create CPV Report | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View CPV Report | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit CPV Report | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Upload Photos | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| GPS Verification | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

#### 4.1.4 Approval Module

| Permission | Branch User | Credit Analyst (Br) | CPV Officer | BCH | BM | RM | HO Credit | Credit Analyst (HO) | HOC | DMD | MD |
|------------|-------------|---------------------|-------------|-----|----|----|-----------|---------------------|-----|-----|-----|
| View Pending | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Approve L1 | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve L2 | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve L3 | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve L4 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Approve L5 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓* | ✗ | ✗ |
| Approve L6 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Approve L7 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Reject | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Send Back | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |

*L5 requires Credit Committee (multiple approvers)

#### 4.1.5 Disbursement Module

| Permission | Branch User | Credit Analyst (Br) | CPV Officer | BCH | BM | RM | HO Credit | Credit Analyst (HO) | HOC | DMD | MD |
|------------|-------------|---------------------|-------------|-----|----|----|-----------|---------------------|-----|-----|-----|
| Initiate Disbursement | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| View Disbursement | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve Disbursement | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Cancel Disbursement | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |

#### 4.1.6 Reports Module

| Permission | Branch User | Credit Analyst (Br) | CPV Officer | BCH | BM | RM | HO Credit | Credit Analyst (HO) | HOC | DMD | MD |
|------------|-------------|---------------------|-------------|-----|----|----|-----------|---------------------|-----|-----|-----|
| View Branch Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Regional Reports | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View All Reports | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export Reports | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CIB Reports | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bangladesh Bank Reports | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |

#### 4.1.7 Administration Module

| Permission | Credit Admin | System Admin |
|------------|--------------|--------------|
| User Management | ✓ | ✓ |
| Role Assignment | ✓ | ✓ |
| Branch Configuration | ✓ | ✓ |
| Product Configuration | ✓ | ✗ |
| System Configuration | ✗ | ✓ |
| Audit Log Access | ✓ | ✓ |
| Backup Management | ✗ | ✓ |
| Integration Config | ✗ | ✓ |

### 4.2 Permission Codes

```java
public enum Permission {
    // Application Permissions
    APPLICATION_CREATE("app:create"),
    APPLICATION_READ_OWN("app:read:own"),
    APPLICATION_READ_BRANCH("app:read:branch"),
    APPLICATION_READ_REGION("app:read:region"),
    APPLICATION_READ_ALL("app:read:all"),
    APPLICATION_UPDATE("app:update"),
    APPLICATION_DELETE("app:delete"),
    APPLICATION_SUBMIT("app:submit"),

    // Analysis Permissions
    ANALYSIS_CREATE("analysis:create"),
    ANALYSIS_READ("analysis:read"),
    ANALYSIS_UPDATE("analysis:update"),
    CIB_QUERY("cib:query"),
    RISK_ASSESSMENT("risk:assess"),

    // CPV Permissions
    CPV_CREATE("cpv:create"),
    CPV_READ("cpv:read"),
    CPV_UPDATE("cpv:update"),
    CPV_UPLOAD("cpv:upload"),
    CPV_GPS("cpv:gps"),

    // Approval Permissions
    APPROVAL_VIEW_PENDING("approval:view:pending"),
    APPROVAL_L1("approval:l1"),
    APPROVAL_L2("approval:l2"),
    APPROVAL_L3("approval:l3"),
    APPROVAL_L4("approval:l4"),
    APPROVAL_L5("approval:l5"),
    APPROVAL_L6("approval:l6"),
    APPROVAL_L7("approval:l7"),
    APPROVAL_REJECT("approval:reject"),
    APPROVAL_SENDBACK("approval:sendback"),

    // Disbursement Permissions
    DISBURSEMENT_INITIATE("disbursement:initiate"),
    DISBURSEMENT_READ("disbursement:read"),
    DISBURSEMENT_APPROVE("disbursement:approve"),
    DISBURSEMENT_CANCEL("disbursement:cancel"),

    // Report Permissions
    REPORT_BRANCH("report:branch"),
    REPORT_REGION("report:region"),
    REPORT_ALL("report:all"),
    REPORT_EXPORT("report:export"),
    REPORT_CIB("report:cib"),
    REPORT_BB("report:bb"),

    // Admin Permissions
    ADMIN_USER("admin:user"),
    ADMIN_ROLE("admin:role"),
    ADMIN_BRANCH("admin:branch"),
    ADMIN_PRODUCT("admin:product"),
    ADMIN_SYSTEM("admin:system"),
    ADMIN_AUDIT("admin:audit"),
    ADMIN_BACKUP("admin:backup"),
    ADMIN_INTEGRATION("admin:integration");

    private final String code;

    Permission(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
```

---

## 5. Keycloak Role Configuration

### 5.1 Realm Configuration

```json
{
  "realm": "ulms",
  "displayName": "ULMS - Unified Loan Management System",
  "enabled": true,
  "sslRequired": "all",
  "registrationAllowed": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "permanentLockout": false,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "maxDeltaTimeSeconds": 43200,
  "failureFactor": 5,
  "accessTokenLifespan": 3600,
  "accessTokenLifespanForImplicitFlow": 900,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "offlineSessionIdleTimeout": 2592000,
  "accessCodeLifespan": 60,
  "accessCodeLifespanUserAction": 300,
  "accessCodeLifespanLogin": 1800,
  "actionTokenGeneratedByAdminLifespan": 43200,
  "actionTokenGeneratedByUserLifespan": 300,
  "passwordPolicy": "length(12) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1) and notUsername and passwordHistory(5)"
}
```

### 5.2 Realm Roles Definition

```json
{
  "roles": {
    "realm": [
      {
        "name": "BRANCH_USER",
        "description": "Branch level user - data entry and basic operations",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      },
      {
        "name": "CREDIT_ANALYST_BRANCH",
        "description": "Branch Credit Analyst - loan analysis and assessment",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      },
      {
        "name": "CPV_OFFICER",
        "description": "Contact Point Verification Officer",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      },
      {
        "name": "BRANCH_CREDIT_HEAD",
        "description": "Branch Credit Head - L1 approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["1"],
          "approval_limit": ["500000"]
        }
      },
      {
        "name": "BRANCH_MANAGER",
        "description": "Branch Manager - L2 approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["2"],
          "approval_limit": ["1000000"]
        }
      },
      {
        "name": "REGIONAL_MANAGER",
        "description": "Regional Manager - L3 approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["3"],
          "approval_limit": ["2500000"]
        }
      },
      {
        "name": "HO_CREDIT_DIVISION",
        "description": "Head Office Credit Division staff",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      },
      {
        "name": "CREDIT_ANALYST_HO",
        "description": "Head Office Credit Analyst - senior analysis",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      },
      {
        "name": "HEAD_OF_CREDIT",
        "description": "Head of Credit - L4 approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["4"],
          "approval_limit": ["10000000"]
        }
      },
      {
        "name": "DEPUTY_MD",
        "description": "Deputy Managing Director - L6 approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["6"],
          "approval_limit": ["100000000"]
        }
      },
      {
        "name": "MANAGING_DIRECTOR",
        "description": "Managing Director - L7 unlimited approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["7"],
          "approval_limit": ["-1"]
        }
      },
      {
        "name": "CREDIT_ADMIN",
        "description": "Credit Administration - no approval authority",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      },
      {
        "name": "SYSTEM_ADMIN",
        "description": "System Administrator - full technical access",
        "composite": false,
        "attributes": {
          "approval_level": ["0"],
          "approval_limit": ["0"]
        }
      }
    ]
  }
}
```

### 5.3 Client Roles (Fine-Grained)

```json
{
  "clients": [
    {
      "clientId": "ulms-api",
      "roles": [
        {
          "name": "application_create",
          "description": "Create loan applications"
        },
        {
          "name": "application_read_own",
          "description": "Read own applications"
        },
        {
          "name": "application_read_branch",
          "description": "Read branch applications"
        },
        {
          "name": "application_read_region",
          "description": "Read regional applications"
        },
        {
          "name": "application_read_all",
          "description": "Read all applications"
        },
        {
          "name": "application_update",
          "description": "Update applications"
        },
        {
          "name": "application_delete",
          "description": "Delete applications"
        },
        {
          "name": "approval_l1",
          "description": "L1 approval authority"
        },
        {
          "name": "approval_l2",
          "description": "L2 approval authority"
        },
        {
          "name": "approval_l3",
          "description": "L3 approval authority"
        },
        {
          "name": "approval_l4",
          "description": "L4 approval authority"
        },
        {
          "name": "approval_l5",
          "description": "L5 approval authority (Credit Committee)"
        },
        {
          "name": "approval_l6",
          "description": "L6 approval authority"
        },
        {
          "name": "approval_l7",
          "description": "L7 approval authority (unlimited)"
        },
        {
          "name": "cib_query",
          "description": "Query CIB reports"
        },
        {
          "name": "report_export",
          "description": "Export reports"
        },
        {
          "name": "admin_user",
          "description": "User administration"
        },
        {
          "name": "admin_system",
          "description": "System administration"
        }
      ]
    }
  ]
}
```

### 5.4 Composite Roles

```json
{
  "compositeRoles": [
    {
      "name": "BRANCH_CREDIT_HEAD",
      "composites": {
        "realm": ["BRANCH_USER", "CREDIT_ANALYST_BRANCH"],
        "client": {
          "ulms-api": [
            "application_create",
            "application_read_branch",
            "application_update",
            "application_delete",
            "approval_l1",
            "cib_query"
          ]
        }
      }
    },
    {
      "name": "BRANCH_MANAGER",
      "composites": {
        "realm": ["BRANCH_CREDIT_HEAD"],
        "client": {
          "ulms-api": [
            "approval_l2",
            "report_export"
          ]
        }
      }
    },
    {
      "name": "REGIONAL_MANAGER",
      "composites": {
        "realm": ["BRANCH_MANAGER"],
        "client": {
          "ulms-api": [
            "application_read_region",
            "approval_l3"
          ]
        }
      }
    },
    {
      "name": "HEAD_OF_CREDIT",
      "composites": {
        "realm": ["REGIONAL_MANAGER", "HO_CREDIT_DIVISION"],
        "client": {
          "ulms-api": [
            "application_read_all",
            "approval_l4",
            "approval_l5",
            "admin_user"
          ]
        }
      }
    },
    {
      "name": "DEPUTY_MD",
      "composites": {
        "realm": ["HEAD_OF_CREDIT"],
        "client": {
          "ulms-api": [
            "approval_l6"
          ]
        }
      }
    },
    {
      "name": "MANAGING_DIRECTOR",
      "composites": {
        "realm": ["DEPUTY_MD"],
        "client": {
          "ulms-api": [
            "approval_l7"
          ]
        }
      }
    }
  ]
}
```

### 5.5 Protocol Mappers for JWT

```json
{
  "protocolMappers": [
    {
      "name": "realm-roles",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-realm-role-mapper",
      "config": {
        "claim.name": "roles",
        "jsonType.label": "String",
        "multivalued": "true",
        "userinfo.token.claim": "true",
        "id.token.claim": "true",
        "access.token.claim": "true"
      }
    },
    {
      "name": "tenant-id",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "tenantId",
        "user.attribute": "tenantId",
        "jsonType.label": "String",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    },
    {
      "name": "branch-id",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "branchId",
        "user.attribute": "branchId",
        "jsonType.label": "String",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    },
    {
      "name": "approval-limit",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "approvalLimit",
        "user.attribute": "approvalLimit",
        "jsonType.label": "long",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    },
    {
      "name": "approval-level",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "approvalLevel",
        "user.attribute": "approvalLevel",
        "jsonType.label": "int",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    },
    {
      "name": "permissions",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "permissions",
        "user.attribute": "permissions",
        "jsonType.label": "String",
        "multivalued": "true",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    }
  ]
}
```

---

## 6. JWT Claims Structure

### 6.1 Access Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "ulms-signing-key-v1"
  },
  "payload": {
    "iss": "https://auth.ulms.unisoft.com.bd/realms/ulms",
    "sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "aud": ["ulms-api", "ulms-web"],
    "exp": 1705000800,
    "iat": 1704997200,
    "nbf": 1704997200,
    "jti": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "typ": "Bearer",
    "azp": "ulms-web",
    "session_state": "session-uuid-here",
    "scope": "openid profile ulms-api",

    "name": "Mohammad Rahman",
    "preferred_username": "m.rahman",
    "email": "m.rahman@bank.com.bd",
    "email_verified": true,

    "roles": [
      "BRANCH_MANAGER",
      "BRANCH_CREDIT_HEAD",
      "CREDIT_ANALYST_BRANCH",
      "BRANCH_USER"
    ],

    "tenantId": "TENANT_001",
    "branchId": "BR_DHAKA_001",
    "branchName": "Dhaka Main Branch",
    "regionId": "REG_DHAKA",
    "regionName": "Dhaka Region",

    "approvalLevel": 2,
    "approvalLimit": 1000000,

    "permissions": [
      "app:create",
      "app:read:branch",
      "app:update",
      "app:delete",
      "app:submit",
      "analysis:create",
      "analysis:read",
      "analysis:update",
      "cib:query",
      "risk:assess",
      "approval:view:pending",
      "approval:l1",
      "approval:l2",
      "approval:reject",
      "approval:sendback",
      "disbursement:initiate",
      "disbursement:read",
      "disbursement:approve",
      "report:branch",
      "report:export"
    ],

    "resource_access": {
      "ulms-api": {
        "roles": [
          "application_create",
          "application_read_branch",
          "application_update",
          "application_delete",
          "approval_l1",
          "approval_l2",
          "cib_query",
          "report_export"
        ]
      }
    }
  },
  "signature": "..."
}
```

### 6.2 Custom Claims Explanation

| Claim | Type | Description | Example |
|-------|------|-------------|---------|
| `tenantId` | String | Multi-tenant identifier | `"TENANT_001"` |
| `branchId` | String | User's assigned branch | `"BR_DHAKA_001"` |
| `branchName` | String | Human-readable branch name | `"Dhaka Main Branch"` |
| `regionId` | String | Region identifier | `"REG_DHAKA"` |
| `regionName` | String | Human-readable region name | `"Dhaka Region"` |
| `approvalLevel` | Integer | User's approval level (0-7) | `2` |
| `approvalLimit` | Long | Maximum approval amount in BDT (-1 = unlimited) | `1000000` |
| `permissions` | String[] | Fine-grained permission codes | `["app:create", ...]` |
| `roles` | String[] | Realm roles assigned | `["BRANCH_MANAGER", ...]` |

### 6.3 Token Validation Service

```java
@Service
@RequiredArgsConstructor
public class JwtTokenService {

    private final JwtDecoder jwtDecoder;

    public UlmsUserContext extractUserContext(String token) {
        Jwt jwt = jwtDecoder.decode(token);

        return UlmsUserContext.builder()
            .userId(jwt.getSubject())
            .username(jwt.getClaimAsString("preferred_username"))
            .email(jwt.getClaimAsString("email"))
            .tenantId(jwt.getClaimAsString("tenantId"))
            .branchId(jwt.getClaimAsString("branchId"))
            .branchName(jwt.getClaimAsString("branchName"))
            .regionId(jwt.getClaimAsString("regionId"))
            .regionName(jwt.getClaimAsString("regionName"))
            .approvalLevel(jwt.getClaimAsString("approvalLevel") != null
                ? Integer.parseInt(jwt.getClaimAsString("approvalLevel")) : 0)
            .approvalLimit(jwt.getClaimAsString("approvalLimit") != null
                ? Long.parseLong(jwt.getClaimAsString("approvalLimit")) : 0L)
            .roles(jwt.getClaimAsStringList("roles"))
            .permissions(jwt.getClaimAsStringList("permissions"))
            .build();
    }

    public boolean hasPermission(UlmsUserContext context, String permission) {
        return context.getPermissions().contains(permission);
    }

    public boolean hasApprovalAuthority(UlmsUserContext context, int requiredLevel) {
        return context.getApprovalLevel() >= requiredLevel;
    }

    public boolean canApproveAmount(UlmsUserContext context, BigDecimal amount) {
        if (context.getApprovalLimit() == -1) {
            return true; // Unlimited authority (MD)
        }
        return amount.compareTo(BigDecimal.valueOf(context.getApprovalLimit())) <= 0;
    }
}

@Data
@Builder
public class UlmsUserContext {
    private String userId;
    private String username;
    private String email;
    private String tenantId;
    private String branchId;
    private String branchName;
    private String regionId;
    private String regionName;
    private int approvalLevel;
    private long approvalLimit;
    private List<String> roles;
    private List<String> permissions;
}
```

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RBAC Database Schema                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐         ┌─────────────────┐        ┌────────────────┐  │
│  │     users       │         │   user_roles    │        │     roles      │  │
│  ├─────────────────┤         ├─────────────────┤        ├────────────────┤  │
│  │ id (PK)         │◄───────┐│ user_id (FK)    │┌──────▶│ id (PK)        │  │
│  │ keycloak_id     │        └┤ role_id (FK)    ├┘       │ code           │  │
│  │ username        │         │ assigned_at     │        │ name           │  │
│  │ email           │         │ assigned_by     │        │ description    │  │
│  │ tenant_id (FK)  │         │ valid_from      │        │ approval_level │  │
│  │ branch_id (FK)  │         │ valid_until     │        │ approval_limit │  │
│  │ status          │         └─────────────────┘        │ is_active      │  │
│  └────────┬────────┘                                    └────────┬───────┘  │
│           │                                                      │          │
│           │         ┌─────────────────┐        ┌─────────────────┤          │
│           │         │ role_permissions│        │                 │          │
│           │         ├─────────────────┤        │   ┌─────────────┴────────┐ │
│           │         │ role_id (FK)    │◄───────┘   │    permissions       │ │
│           │         │ permission_id   │───────────▶├────────────────────── │ │
│           │         │ (FK)            │            │ id (PK)              │ │
│           │         └─────────────────┘            │ code                 │ │
│           │                                        │ name                 │ │
│           │                                        │ module               │ │
│           │                                        │ description          │ │
│           │                                        └──────────────────────┘ │
│           │                                                                  │
│           │         ┌─────────────────────┐                                 │
│           │         │   approval_matrix   │                                 │
│           │         ├─────────────────────┤                                 │
│           └────────▶│ id (PK)             │                                 │
│                     │ level               │                                 │
│                     │ role_id (FK)        │                                 │
│                     │ min_amount          │                                 │
│                     │ max_amount          │                                 │
│                     │ sla_hours           │                                 │
│                     │ escalation_hours    │                                 │
│                     │ escalate_to_level   │                                 │
│                     │ product_type        │                                 │
│                     │ is_active           │                                 │
│                     └─────────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Table Definitions

#### 7.2.1 Roles Table

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    approval_level INTEGER DEFAULT 0,
    approval_limit BIGINT DEFAULT 0,
    is_composite BOOLEAN DEFAULT FALSE,
    parent_role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT chk_approval_level CHECK (approval_level >= 0 AND approval_level <= 7)
);

-- Insert default roles
INSERT INTO roles (code, name, description, approval_level, approval_limit) VALUES
('BRANCH_USER', 'Branch User', 'Entry-level branch staff', 0, 0),
('CREDIT_ANALYST_BRANCH', 'Credit Analyst (Branch)', 'Branch credit analyst', 0, 0),
('CPV_OFFICER', 'CPV Officer', 'Contact Point Verification officer', 0, 0),
('BRANCH_CREDIT_HEAD', 'Branch Credit Head', 'Branch credit head - L1 authority', 1, 500000),
('BRANCH_MANAGER', 'Branch Manager', 'Branch manager - L2 authority', 2, 1000000),
('REGIONAL_MANAGER', 'Regional Manager', 'Regional manager - L3 authority', 3, 2500000),
('HO_CREDIT_DIVISION', 'HO Credit Division', 'Head office credit division', 0, 0),
('CREDIT_ANALYST_HO', 'Credit Analyst (HO)', 'Head office credit analyst', 0, 0),
('HEAD_OF_CREDIT', 'Head of Credit', 'Head of credit - L4 authority', 4, 10000000),
('DEPUTY_MD', 'Deputy MD', 'Deputy Managing Director - L6 authority', 6, 100000000),
('MANAGING_DIRECTOR', 'Managing Director', 'Managing Director - L7 unlimited', 7, -1),
('CREDIT_ADMIN', 'Credit Admin', 'Credit administration', 0, 0),
('SYSTEM_ADMIN', 'System Admin', 'System administration', 0, 0);

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_approval_level ON roles(approval_level);
```

#### 7.2.2 Permissions Table

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (code, name, module, description) VALUES
-- Application Module
('app:create', 'Create Application', 'APPLICATION', 'Create new loan applications'),
('app:read:own', 'Read Own Applications', 'APPLICATION', 'View own created applications'),
('app:read:branch', 'Read Branch Applications', 'APPLICATION', 'View all branch applications'),
('app:read:region', 'Read Regional Applications', 'APPLICATION', 'View all regional applications'),
('app:read:all', 'Read All Applications', 'APPLICATION', 'View all applications'),
('app:update', 'Update Application', 'APPLICATION', 'Edit loan applications'),
('app:delete', 'Delete Application', 'APPLICATION', 'Delete draft applications'),
('app:submit', 'Submit Application', 'APPLICATION', 'Submit for approval'),

-- Analysis Module
('analysis:create', 'Create Analysis', 'ANALYSIS', 'Create credit analysis'),
('analysis:read', 'Read Analysis', 'ANALYSIS', 'View credit analysis'),
('analysis:update', 'Update Analysis', 'ANALYSIS', 'Edit credit analysis'),
('cib:query', 'CIB Query', 'ANALYSIS', 'Query CIB reports'),
('risk:assess', 'Risk Assessment', 'ANALYSIS', 'Perform risk assessment'),

-- CPV Module
('cpv:create', 'Create CPV Report', 'CPV', 'Create verification report'),
('cpv:read', 'Read CPV Report', 'CPV', 'View verification reports'),
('cpv:update', 'Update CPV Report', 'CPV', 'Edit verification report'),
('cpv:upload', 'Upload CPV Documents', 'CPV', 'Upload photos and documents'),
('cpv:gps', 'GPS Verification', 'CPV', 'Record GPS coordinates'),

-- Approval Module
('approval:view:pending', 'View Pending Approvals', 'APPROVAL', 'View pending approval queue'),
('approval:l1', 'L1 Approval', 'APPROVAL', 'Approve up to 5 Lakh BDT'),
('approval:l2', 'L2 Approval', 'APPROVAL', 'Approve up to 10 Lakh BDT'),
('approval:l3', 'L3 Approval', 'APPROVAL', 'Approve up to 25 Lakh BDT'),
('approval:l4', 'L4 Approval', 'APPROVAL', 'Approve up to 1 Crore BDT'),
('approval:l5', 'L5 Approval', 'APPROVAL', 'Approve up to 5 Crore BDT'),
('approval:l6', 'L6 Approval', 'APPROVAL', 'Approve up to 10 Crore BDT'),
('approval:l7', 'L7 Approval', 'APPROVAL', 'Unlimited approval authority'),
('approval:reject', 'Reject Application', 'APPROVAL', 'Reject loan applications'),
('approval:sendback', 'Send Back Application', 'APPROVAL', 'Return for corrections'),

-- Disbursement Module
('disbursement:initiate', 'Initiate Disbursement', 'DISBURSEMENT', 'Start disbursement process'),
('disbursement:read', 'View Disbursement', 'DISBURSEMENT', 'View disbursement details'),
('disbursement:approve', 'Approve Disbursement', 'DISBURSEMENT', 'Approve disbursement'),
('disbursement:cancel', 'Cancel Disbursement', 'DISBURSEMENT', 'Cancel disbursement'),

-- Report Module
('report:branch', 'Branch Reports', 'REPORT', 'View branch-level reports'),
('report:region', 'Regional Reports', 'REPORT', 'View regional reports'),
('report:all', 'All Reports', 'REPORT', 'View all system reports'),
('report:export', 'Export Reports', 'REPORT', 'Export reports to files'),
('report:cib', 'CIB Reports', 'REPORT', 'View CIB reports'),
('report:bb', 'Bangladesh Bank Reports', 'REPORT', 'View BB regulatory reports'),

-- Admin Module
('admin:user', 'User Management', 'ADMIN', 'Manage users'),
('admin:role', 'Role Management', 'ADMIN', 'Manage roles'),
('admin:branch', 'Branch Configuration', 'ADMIN', 'Configure branches'),
('admin:product', 'Product Configuration', 'ADMIN', 'Configure loan products'),
('admin:system', 'System Configuration', 'ADMIN', 'System settings'),
('admin:audit', 'Audit Log Access', 'ADMIN', 'View audit logs'),
('admin:backup', 'Backup Management', 'ADMIN', 'Manage backups'),
('admin:integration', 'Integration Config', 'ADMIN', 'Configure integrations');

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_module ON permissions(module);
```

#### 7.2.3 Role-Permissions Mapping

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    CONSTRAINT uk_role_permission UNIQUE (role_id, permission_id)
);

-- Example: Branch User permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'BRANCH_USER' AND p.code IN (
    'app:create', 'app:read:own', 'app:update', 'app:submit',
    'disbursement:read', 'report:branch'
);

-- Example: Branch Credit Head permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'BRANCH_CREDIT_HEAD' AND p.code IN (
    'app:create', 'app:read:branch', 'app:update', 'app:delete', 'app:submit',
    'analysis:create', 'analysis:read', 'analysis:update', 'cib:query', 'risk:assess',
    'cpv:create', 'cpv:read', 'cpv:update', 'cpv:upload', 'cpv:gps',
    'approval:view:pending', 'approval:l1', 'approval:reject', 'approval:sendback',
    'disbursement:initiate', 'disbursement:read',
    'report:branch', 'report:export'
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
```

#### 7.2.4 User Roles Table

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    CONSTRAINT uk_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = TRUE;
```

#### 7.2.5 Approval Matrix Table

```sql
CREATE TABLE approval_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INTEGER NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    min_amount BIGINT NOT NULL DEFAULT 0,
    max_amount BIGINT NOT NULL,
    sla_hours INTEGER NOT NULL,
    escalation_hours INTEGER NOT NULL,
    escalate_to_level INTEGER,
    product_type VARCHAR(50),
    loan_category VARCHAR(50),
    is_committee_approval BOOLEAN DEFAULT FALSE,
    min_committee_members INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_amount_range CHECK (max_amount > min_amount OR max_amount = -1),
    CONSTRAINT chk_level_range CHECK (level >= 1 AND level <= 7),
    CONSTRAINT chk_escalation CHECK (escalate_to_level IS NULL OR escalate_to_level > level)
);

-- Insert approval matrix
INSERT INTO approval_matrix (level, role_id, min_amount, max_amount, sla_hours, escalation_hours, escalate_to_level) VALUES
(1, (SELECT id FROM roles WHERE code = 'BRANCH_CREDIT_HEAD'), 0, 500000, 4, 6, 2),
(2, (SELECT id FROM roles WHERE code = 'BRANCH_MANAGER'), 500001, 1000000, 6, 8, 3),
(3, (SELECT id FROM roles WHERE code = 'REGIONAL_MANAGER'), 1000001, 2500000, 8, 12, 4),
(4, (SELECT id FROM roles WHERE code = 'HEAD_OF_CREDIT'), 2500001, 10000000, 12, 18, 5),
(5, (SELECT id FROM roles WHERE code = 'HEAD_OF_CREDIT'), 10000001, 50000000, 24, 36, 6),
(6, (SELECT id FROM roles WHERE code = 'DEPUTY_MD'), 50000001, 100000000, 48, 72, 7),
(7, (SELECT id FROM roles WHERE code = 'MANAGING_DIRECTOR'), 100000001, -1, 72, 96, NULL);

-- Update L5 as committee approval
UPDATE approval_matrix SET is_committee_approval = TRUE, min_committee_members = 3 WHERE level = 5;

CREATE INDEX idx_approval_matrix_level ON approval_matrix(level);
CREATE INDEX idx_approval_matrix_amount ON approval_matrix(min_amount, max_amount);
CREATE INDEX idx_approval_matrix_role ON approval_matrix(role_id);
```

### 7.3 Useful Views

```sql
-- View: User permissions (flattened)
CREATE VIEW v_user_permissions AS
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    r.code AS role_code,
    r.name AS role_name,
    r.approval_level,
    r.approval_limit,
    p.code AS permission_code,
    p.name AS permission_name,
    p.module
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.is_active = TRUE;

-- View: Approval authority by user
CREATE VIEW v_user_approval_authority AS
SELECT
    u.id AS user_id,
    u.username,
    MAX(r.approval_level) AS max_approval_level,
    MAX(r.approval_limit) AS max_approval_limit,
    ARRAY_AGG(DISTINCT r.code) AS roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
WHERE r.approval_level > 0
GROUP BY u.id, u.username;
```

---

## 8. SLA Configuration

### 8.1 SLA by Approval Level

| Level | Role | Standard SLA | Warning Threshold | Critical Threshold | Auto-Escalate |
|-------|------|--------------|-------------------|-------------------|---------------|
| L1 | Branch Credit Head | 4 hours | 3 hours | 5 hours | 6 hours |
| L2 | Branch Manager | 6 hours | 5 hours | 7 hours | 8 hours |
| L3 | Regional Manager | 8 hours | 6 hours | 10 hours | 12 hours |
| L4 | Head of Credit | 12 hours | 10 hours | 16 hours | 18 hours |
| L5 | Credit Committee | 24 hours | 18 hours | 30 hours | 36 hours |
| L6 | Deputy MD | 48 hours | 36 hours | 60 hours | 72 hours |
| L7 | Managing Director | 72 hours | 60 hours | 84 hours | 96 hours |

### 8.2 SLA Configuration Table

```sql
CREATE TABLE sla_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_level INTEGER NOT NULL,
    product_type VARCHAR(50),
    standard_sla_hours INTEGER NOT NULL,
    warning_threshold_hours INTEGER NOT NULL,
    critical_threshold_hours INTEGER NOT NULL,
    auto_escalate_hours INTEGER NOT NULL,
    notification_channels VARCHAR(100)[] DEFAULT ARRAY['EMAIL', 'SMS', 'PUSH'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_sla_level_product UNIQUE (approval_level, product_type)
);

-- Insert default SLA configuration
INSERT INTO sla_configuration (approval_level, standard_sla_hours, warning_threshold_hours, critical_threshold_hours, auto_escalate_hours) VALUES
(1, 4, 3, 5, 6),
(2, 6, 5, 7, 8),
(3, 8, 6, 10, 12),
(4, 12, 10, 16, 18),
(5, 24, 18, 30, 36),
(6, 48, 36, 60, 72),
(7, 72, 60, 84, 96);
```

### 8.3 SLA Monitoring Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SlaMonitoringService {

    private final ApprovalRepository approvalRepository;
    private final SlaConfigurationRepository slaConfigRepository;
    private final NotificationService notificationService;
    private final EscalationService escalationService;

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void monitorPendingApprovals() {
        List<PendingApproval> pendingApprovals = approvalRepository.findAllPending();

        for (PendingApproval approval : pendingApprovals) {
            SlaConfiguration slaConfig = slaConfigRepository
                .findByLevelAndProductType(approval.getCurrentLevel(), approval.getProductType())
                .orElse(slaConfigRepository.findByLevel(approval.getCurrentLevel()));

            Duration pendingDuration = Duration.between(
                approval.getSubmittedAt(),
                Instant.now()
            );
            long hoursWaiting = pendingDuration.toHours();

            SlaStatus status = determineSlaStatus(hoursWaiting, slaConfig);

            switch (status) {
                case CRITICAL:
                    handleCriticalSla(approval, slaConfig);
                    break;
                case WARNING:
                    handleWarningSla(approval, slaConfig);
                    break;
                case AUTO_ESCALATE:
                    handleAutoEscalation(approval, slaConfig);
                    break;
                default:
                    // Within SLA, no action needed
            }
        }
    }

    private SlaStatus determineSlaStatus(long hoursWaiting, SlaConfiguration config) {
        if (hoursWaiting >= config.getAutoEscalateHours()) {
            return SlaStatus.AUTO_ESCALATE;
        } else if (hoursWaiting >= config.getCriticalThresholdHours()) {
            return SlaStatus.CRITICAL;
        } else if (hoursWaiting >= config.getWarningThresholdHours()) {
            return SlaStatus.WARNING;
        }
        return SlaStatus.OK;
    }

    private void handleAutoEscalation(PendingApproval approval, SlaConfiguration config) {
        log.warn("Auto-escalating approval {} from L{} due to SLA breach",
            approval.getId(), approval.getCurrentLevel());

        escalationService.escalateToNextLevel(approval);

        notificationService.sendEscalationNotification(
            approval,
            "SLA breach - Auto-escalated to next level"
        );
    }

    public enum SlaStatus {
        OK, WARNING, CRITICAL, AUTO_ESCALATE
    }
}
```

---

## 9. Implementation Guidelines

### 9.1 Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/v1/applications/**").hasAnyRole(
                    "BRANCH_USER", "CREDIT_ANALYST_BRANCH", "BRANCH_CREDIT_HEAD",
                    "BRANCH_MANAGER", "HO_CREDIT_DIVISION", "CREDIT_ANALYST_HO",
                    "HEAD_OF_CREDIT"
                )
                .requestMatchers("/api/v1/approvals/**").hasAnyRole(
                    "BRANCH_CREDIT_HEAD", "BRANCH_MANAGER", "REGIONAL_MANAGER",
                    "HEAD_OF_CREDIT", "DEPUTY_MD", "MANAGING_DIRECTOR"
                )
                .requestMatchers("/api/v1/admin/**").hasAnyRole(
                    "CREDIT_ADMIN", "SYSTEM_ADMIN"
                )
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
            new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return converter;
    }
}
```

### 9.2 Method-Level Security

```java
@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping("/{id}/approve")
    @PreAuthorize("@approvalAuthorizationService.canApprove(#id, authentication)")
    public ResponseEntity<ApprovalResponse> approveApplication(
            @PathVariable UUID id,
            @RequestBody ApprovalRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(approvalService.approve(id, request, authentication));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('BRANCH_CREDIT_HEAD', 'BRANCH_MANAGER', 'REGIONAL_MANAGER', " +
                  "'HEAD_OF_CREDIT', 'DEPUTY_MD', 'MANAGING_DIRECTOR')")
    public ResponseEntity<ApprovalResponse> rejectApplication(
            @PathVariable UUID id,
            @RequestBody RejectionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(approvalService.reject(id, request, authentication));
    }
}

@Service
@RequiredArgsConstructor
public class ApprovalAuthorizationService {

    private final ApplicationRepository applicationRepository;
    private final JwtTokenService jwtTokenService;

    public boolean canApprove(UUID applicationId, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        UlmsUserContext userContext = jwtTokenService.extractUserContext(jwt.getTokenValue());

        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        int requiredLevel = calculateRequiredApprovalLevel(application.getAmount());

        // Check if user has required approval level
        if (userContext.getApprovalLevel() < requiredLevel) {
            return false;
        }

        // Check if user can approve this amount
        if (!jwtTokenService.canApproveAmount(userContext, application.getAmount())) {
            return false;
        }

        // Check branch/region access for lower levels
        if (requiredLevel <= 3) {
            return hasLocationAccess(userContext, application);
        }

        return true;
    }

    private int calculateRequiredApprovalLevel(BigDecimal amount) {
        if (amount.compareTo(new BigDecimal("500000")) <= 0) return 1;
        if (amount.compareTo(new BigDecimal("1000000")) <= 0) return 2;
        if (amount.compareTo(new BigDecimal("2500000")) <= 0) return 3;
        if (amount.compareTo(new BigDecimal("10000000")) <= 0) return 4;
        if (amount.compareTo(new BigDecimal("50000000")) <= 0) return 5;
        if (amount.compareTo(new BigDecimal("100000000")) <= 0) return 6;
        return 7;
    }

    private boolean hasLocationAccess(UlmsUserContext context, Application application) {
        switch (context.getApprovalLevel()) {
            case 1:
            case 2:
                return context.getBranchId().equals(application.getBranchId());
            case 3:
                return context.getRegionId().equals(application.getRegionId());
            default:
                return true;
        }
    }
}
```

### 9.3 Frontend Role-Based UI

```typescript
// types/auth.ts
export interface UserContext {
  userId: string;
  username: string;
  email: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  regionId: string;
  regionName: string;
  approvalLevel: number;
  approvalLimit: number;
  roles: string[];
  permissions: string[];
}

// hooks/usePermission.ts
import { useAuth } from '@/contexts/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canApprove = (level: number): boolean => {
    return (user?.approvalLevel ?? 0) >= level;
  };

  const canApproveAmount = (amount: number): boolean => {
    if (user?.approvalLimit === -1) return true;
    return (user?.approvalLimit ?? 0) >= amount;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canApprove,
    canApproveAmount,
    user
  };
};

// components/PermissionGate.tsx
interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  roles?: string[];
  approvalLevel?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  roles,
  approvalLevel,
  children,
  fallback = null
}) => {
  const { hasPermission, hasAnyRole, canApprove } = usePermission();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  if (permissions?.length) {
    hasAccess = hasAccess && permissions.some(p => hasPermission(p));
  }

  if (roles?.length) {
    hasAccess = hasAccess && hasAnyRole(roles);
  }

  if (approvalLevel !== undefined) {
    hasAccess = hasAccess && canApprove(approvalLevel);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Usage example
const ApprovalActions: React.FC<{ application: Application }> = ({ application }) => {
  const { canApproveAmount } = usePermission();
  const requiredLevel = getRequiredApprovalLevel(application.amount);

  return (
    <div className="approval-actions">
      <PermissionGate
        approvalLevel={requiredLevel}
        fallback={<span>Insufficient approval authority</span>}
      >
        {canApproveAmount(application.amount) ? (
          <>
            <Button onClick={() => handleApprove(application.id)}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => handleReject(application.id)}>
              Reject
            </Button>
          </>
        ) : (
          <span>Amount exceeds your approval limit</span>
        )}
      </PermissionGate>
    </div>
  );
};
```

---

## 10. Compliance Mapping

### 10.1 ICT Security Guidelines V4.0 Compliance

| Guideline Section | Requirement | RBAC Implementation |
|------------------|-------------|---------------------|
| 5.1.1 | Access Control Policy | 11 defined roles with explicit permissions |
| 5.1.2 | User Access Management | Keycloak-based centralized user management |
| 5.1.3 | User Responsibilities | Role-specific permissions, audit trails |
| 5.2.1 | Secure Log-on | Keycloak MFA, session management |
| 5.2.2 | Password Management | Password policy enforced via Keycloak |
| 5.3.1 | Restriction of Access | Role-based module access |
| 5.3.2 | Secure Log-on Procedures | OAuth 2.0 / OIDC implementation |
| 5.3.3 | Password Management | 90-day rotation, complexity requirements |
| 6.1.1 | Audit Logging | All access and actions logged |
| 6.1.2 | Protection of Logs | Immutable audit logs in PostgreSQL |

### 10.2 BRPD Circular 15/2024 Compliance

| Requirement | Implementation |
|-------------|----------------|
| Loan Classification Roles | HO Credit Division, Credit Admin roles |
| Approval Hierarchy | 7-level hierarchy matching circular requirements |
| Segregation of Duties | Separate roles for analysis, approval, disbursement |
| Audit Trail | Complete action logging with user attribution |
| SLA Compliance | Configurable SLAs per approval level |

### 10.3 Bangladesh Bank CIB Requirements

| Requirement | Implementation |
|-------------|----------------|
| CIB Query Authorization | `cib:query` permission required |
| Data Access Control | Role-based CIB report access |
| Audit of CIB Access | All CIB queries logged with user ID |
| Report Submission | `report:cib` permission for authorized users |

---

## Appendix A: Role Permission Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ULMS Role Permission Quick Reference                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BRANCH_USER:                                                               │
│    ├── app:create, app:read:own, app:update, app:submit                     │
│    ├── disbursement:read                                                    │
│    └── report:branch                                                        │
│                                                                              │
│  CREDIT_ANALYST_BRANCH:                                                     │
│    ├── [All BRANCH_USER permissions]                                        │
│    ├── analysis:create, analysis:read, analysis:update                      │
│    ├── cib:query, risk:assess                                               │
│    ├── cpv:read                                                             │
│    └── report:export                                                        │
│                                                                              │
│  CPV_OFFICER:                                                               │
│    ├── app:read:own                                                         │
│    ├── cpv:create, cpv:read, cpv:update, cpv:upload, cpv:gps               │
│    └── report:branch                                                        │
│                                                                              │
│  BRANCH_CREDIT_HEAD (L1):                                                   │
│    ├── [All CREDIT_ANALYST_BRANCH permissions]                              │
│    ├── app:read:branch, app:delete                                          │
│    ├── cpv:create, cpv:update, cpv:upload, cpv:gps                         │
│    ├── approval:view:pending, approval:l1, approval:reject, approval:sendback│
│    └── disbursement:initiate                                                │
│                                                                              │
│  BRANCH_MANAGER (L2):                                                       │
│    ├── [All BRANCH_CREDIT_HEAD permissions]                                 │
│    ├── approval:l2                                                          │
│    └── disbursement:approve                                                 │
│                                                                              │
│  REGIONAL_MANAGER (L3):                                                     │
│    ├── [All BRANCH_MANAGER permissions]                                     │
│    ├── app:read:region                                                      │
│    ├── approval:l3                                                          │
│    └── report:region                                                        │
│                                                                              │
│  HEAD_OF_CREDIT (L4/L5):                                                    │
│    ├── [All REGIONAL_MANAGER permissions]                                   │
│    ├── app:read:all                                                         │
│    ├── approval:l4, approval:l5                                             │
│    ├── disbursement:cancel                                                  │
│    ├── report:all, report:cib, report:bb                                    │
│    └── admin:user                                                           │
│                                                                              │
│  DEPUTY_MD (L6):                                                            │
│    ├── [All HEAD_OF_CREDIT permissions]                                     │
│    └── approval:l6                                                          │
│                                                                              │
│  MANAGING_DIRECTOR (L7):                                                    │
│    ├── [All DEPUTY_MD permissions]                                          │
│    └── approval:l7 (unlimited)                                              │
│                                                                              │
│  CREDIT_ADMIN:                                                              │
│    ├── All read permissions                                                 │
│    ├── admin:user, admin:role, admin:branch, admin:product                  │
│    └── admin:audit                                                          │
│                                                                              │
│  SYSTEM_ADMIN:                                                              │
│    ├── All read permissions                                                 │
│    ├── admin:user, admin:role, admin:branch                                 │
│    ├── admin:system, admin:audit, admin:backup                              │
│    └── admin:integration                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | ULMS Architecture Team | Initial release |

---

## Appendix C: Related Documents

| Document ID | Document Name | Relationship |
|-------------|---------------|--------------|
| ARCH-SEC-001 | Security Architecture Document | Parent security framework |
| ARCH-SEC-002 | Authentication & Authorization Design | Keycloak implementation details |
| ARCH-SEC-003 | Data Encryption Strategy | Encryption requirements |
| ARCH-SEC-004 | Secrets Management Design | Vault integration |
| ARCH-SEC-005 | mTLS Configuration for CIB | CIB authentication |
| ARCH-DATA-001 | Data Model - CIB Reports | CIB data structures |
| STD-DEV-001 | Development Guidelines | Coding standards |

---

*Document Classification: Confidential*
*© 2025 Unisoft Systems Ltd. All Rights Reserved.*
