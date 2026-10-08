---
type: how-to
topic: credit_approval_hierarchy_ladder_customization
target_audience: [backend_developer, product_manager, risk_officer]
version: 2026.10
document_id: DOC-05-EXT-03
---

# DOC-05-EXT-03: Credit Approval Hierarchy, Multi-Tier Delegation & Matrix Customization Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Credit Approval Hierarchy & Delegation Matrix Customization |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Developer Extension & Configuration Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bank Company Act 1991 → BRPD Circular 15/2024 → `ulms.approval_band` |

---

## 1. Approval Ladder Architecture & Band Matrix

Under Bangladesh commercial banking practice, loan approval authorities follow strict delegated financial power matrices. ULMS models this via the 7-tier `ulms.approval_band` table (`V5__credit_approval.sql`):

| Ladder Level | Approver Role | Min Amount (BDT) | Max Amount (BDT) | Dual-Auth Required? | Committee Escalation |
|---|---|---|---|---|---|
| **Ladder 1** | Branch Credit Officer | 10,000 | 500,000 | No | No |
| **Ladder 2** | Branch Manager | 500,001 | 2,500,000 | Yes (Maker-Checker) | No |
| **Ladder 3** | Regional Credit Head | 2,500,001 | 10,000,000 | Yes | No |
| **Ladder 4** | Head of Credit (CRM) | 10,000,001 | 50,000,000 | Yes | CRM Committee |
| **Ladder 5** | Managing Director & CEO | 50,000,001 | 150,000,000 | Yes | Executive Committee |
| **Ladder 6** | Executive Committee (EC) | 150,000,001 | 500,000,000 | Board Quorum | Board Committee |
| **Ladder 7** | Board of Directors | > 500,000,000 | Unlimited | Full Board | Full Board of Directors |

---

## 2. Extending Approval Logic in Java Codebase

Approval ladder escalation is managed in `com.uslbd.ulms.approval.ApprovalService`:
```java
public ApprovalTier determineRequiredTier(long requestedAmountMinor, LoanProduct product) {
    if (requestedAmountMinor <= 50_000_000_00L) { // 500,000 BDT
        return ApprovalTier.LADDER_1;
    } else if (requestedAmountMinor <= 250_000_000_00L) { // 2.5M BDT
        return ApprovalTier.LADDER_2;
    }
    // Custom bank delegation tiers configured via ulms.approval_band
    return approvalBandRepository.findByAmountRange(requestedAmountMinor);
}
```
