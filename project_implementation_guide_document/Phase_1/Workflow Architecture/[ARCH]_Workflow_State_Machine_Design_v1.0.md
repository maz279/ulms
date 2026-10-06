# Workflow State Machine Design

## Unisoft Loan Management System (ULMS) v2.0

### Loan Lifecycle State Management

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.6.4 |
| **Document Title** | Workflow State Machine Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial Workflow State Machine Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Complete State Catalog](#2-complete-state-catalog)
3. [State Transition Matrix](#3-state-transition-matrix)
4. [State Machine Implementation](#4-state-machine-implementation)
5. [Event Definitions](#5-event-definitions)
6. [Guard Conditions](#6-guard-conditions)
7. [Actions and Side Effects](#7-actions-and-side-effects)
8. [Error Handling](#8-error-handling)
9. [BRPD Classification States](#9-brpd-classification-states)
10. [Monitoring and Reporting](#10-monitoring-and-reporting)
11. [Implementation Guidelines](#11-implementation-guidelines)
12. [Compliance Matrix](#12-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the complete state machine for loan lifecycle management in ULMS v2.0. It covers all valid states, transitions, guard conditions, and actions for loans from application through closure or write-off.

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| Application States | 3 states (DRAFT, SUBMITTED, UNDER_REVIEW) |
| Approval States | 7 states (PENDING_APPROVAL_L1 to L7) |
| Decision States | 4 states (APPROVED, REJECTED, RETURNED, APPROVED_WITH_CONDITIONS) |
| Disbursement States | 3 states (PENDING_DISBURSEMENT, PARTIALLY_DISBURSED, DISBURSED) |
| Active States | 2 states (ACTIVE, OVERDUE) |
| Terminal States | 4 states (CLOSED, WRITTEN_OFF, CANCELLED, RESCHEDULED) |
| **Total States** | **23 states** |

### 1.3 Design Principles

1. **Deterministic Transitions** - Every state has defined valid transitions
2. **Guard Conditions** - Business rules enforce transition validity
3. **Audit Trail** - All transitions are logged with actor and timestamp
4. **Event-Driven** - Kafka events published on state changes
5. **Camunda Integration** - State machine synchronized with BPMN process

### 1.4 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| State Machine | Spring State Machine | 4.0.0 |
| Workflow Engine | Camunda Platform | 7.20 |
| Event Streaming | Apache Kafka | 3.6 |
| Database | PostgreSQL | 16 |
| Service Framework | Spring Boot | 3.2.1 |

---

## 2. Complete State Catalog

### 2.1 State Enumeration

```java
package com.ulms.workflow.state;

/**
 * Complete loan lifecycle states for ULMS v2.0
 *
 * States are organized by phase:
 * - Application Phase: Initial data entry and submission
 * - Approval Phase: Multi-level approval workflow (L1-L7)
 * - Decision Phase: Approval outcomes
 * - Disbursement Phase: Fund release
 * - Active Phase: Loan in repayment
 * - Terminal Phase: Final states (no further transitions)
 */
public enum LoanState {

    // ═══════════════════════════════════════════════════════════════════════
    // APPLICATION PHASE
    // ═══════════════════════════════════════════════════════════════════════

    DRAFT("Draft", "Application data entry in progress", false),
    SUBMITTED("Submitted", "Application submitted for processing", false),
    UNDER_REVIEW("Under Review", "Credit analysis in progress", false),
    RETURNED("Returned", "Returned for revision/corrections", false),

    // ═══════════════════════════════════════════════════════════════════════
    // APPROVAL PHASE (7-Level Hierarchy)
    // ═══════════════════════════════════════════════════════════════════════

    PENDING_APPROVAL_L1("Pending L1", "Awaiting Branch Credit Head approval", false),
    PENDING_APPROVAL_L2("Pending L2", "Awaiting Branch Manager approval", false),
    PENDING_APPROVAL_L3("Pending L3", "Awaiting Regional Manager approval", false),
    PENDING_APPROVAL_L4("Pending L4", "Awaiting Head of Credit approval", false),
    PENDING_APPROVAL_L5("Pending L5", "Awaiting Credit Committee approval", false),
    PENDING_APPROVAL_L6("Pending L6", "Awaiting Deputy MD approval", false),
    PENDING_APPROVAL_L7("Pending L7", "Awaiting Managing Director approval", false),

    // ═══════════════════════════════════════════════════════════════════════
    // DECISION PHASE
    // ═══════════════════════════════════════════════════════════════════════

    APPROVED("Approved", "Loan approved - awaiting disbursement", false),
    APPROVED_WITH_CONDITIONS("Approved with Conditions", "Approved with stipulations", false),
    REJECTED("Rejected", "Application rejected", true),
    WITHDRAWN("Withdrawn", "Application withdrawn by customer", true),

    // ═══════════════════════════════════════════════════════════════════════
    // DISBURSEMENT PHASE
    // ═══════════════════════════════════════════════════════════════════════

    PENDING_DISBURSEMENT("Pending Disbursement", "Pre-disbursement checklist in progress", false),
    PARTIALLY_DISBURSED("Partially Disbursed", "Partial disbursement completed", false),
    DISBURSED("Disbursed", "Full disbursement completed", false),

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIVE PHASE
    // ═══════════════════════════════════════════════════════════════════════

    ACTIVE("Active", "Loan active - in repayment", false),
    OVERPAID("Overpaid", "Customer overpaid - refund pending", false),

    // ═══════════════════════════════════════════════════════════════════════
    // TERMINAL STATES
    // ═══════════════════════════════════════════════════════════════════════

    CLOSED("Closed", "Loan fully repaid and closed", true),
    WRITTEN_OFF("Written Off", "Bad debt written off", true),
    RESCHEDULED("Rescheduled", "Loan terms restructured", false),
    CANCELLED("Cancelled", "Cancelled before disbursement", true);

    private final String displayName;
    private final String description;
    private final boolean terminal;

    LoanState(String displayName, String description, boolean terminal) {
        this.displayName = displayName;
        this.description = description;
        this.terminal = terminal;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isTerminal() {
        return terminal;
    }

    public boolean isApprovalState() {
        return this.name().startsWith("PENDING_APPROVAL");
    }

    public boolean isActiveState() {
        return this == ACTIVE || this == OVERPAID || this == RESCHEDULED;
    }
}
```

### 2.2 State Categories

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOAN STATE CATEGORIES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  APPLICATION PHASE                                                        │   │
│  │  ┌────────┐  ┌───────────┐  ┌─────────────┐  ┌──────────┐              │   │
│  │  │ DRAFT  │  │ SUBMITTED │  │ UNDER_REVIEW│  │ RETURNED │              │   │
│  │  └────────┘  └───────────┘  └─────────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  APPROVAL PHASE (7-Level Hierarchy)                                       │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐│  │
│  │  │PEND_L1 │ │PEND_L2 │ │PEND_L3 │ │PEND_L4 │ │PEND_L5 │ │PEND_L6 │ │L7  ││  │
│  │  │ ≤5L    │ │ ≤10L   │ │ ≤25L   │ │ ≤1Cr   │ │ ≤5Cr   │ │ ≤10Cr  │ │>10C││  │
│  │  │ 4hrs   │ │ 6hrs   │ │ 8hrs   │ │ 12hrs  │ │ 24hrs  │ │ 48hrs  │ │72hr││  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────┘│  │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  DECISION PHASE                                                           │   │
│  │  ┌──────────┐  ┌─────────────────────┐  ┌──────────┐  ┌───────────┐     │   │
│  │  │ APPROVED │  │ APPROVED_W_COND     │  │ REJECTED │  │ WITHDRAWN │     │   │
│  │  └──────────┘  └─────────────────────┘  └──────────┘  └───────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  DISBURSEMENT PHASE                                                       │   │
│  │  ┌───────────────────┐  ┌────────────────────┐  ┌───────────┐           │   │
│  │  │ PENDING_DISBURST  │  │ PARTIALLY_DISBURST │  │ DISBURSED │           │   │
│  │  └───────────────────┘  └────────────────────┘  └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ACTIVE PHASE                                                             │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────┐                             │   │
│  │  │ ACTIVE  │  │ OVERPAID │  │ RESCHEDULED │                             │   │
│  │  └─────────┘  └──────────┘  └─────────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  TERMINAL STATES (No further transitions)                                 │   │
│  │  ┌────────┐  ┌─────────────┐  ┌───────────┐                             │   │
│  │  │ CLOSED │  │ WRITTEN_OFF │  │ CANCELLED │                             │   │
│  │  └────────┘  └─────────────┘  └───────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Legend: L = Lakh (100,000), Cr = Crore (10,000,000)
```

---

## 3. State Transition Matrix

### 3.1 Complete State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            ULMS LOAN STATE MACHINE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                   ┌─────────┐                                            │
│                                   │  DRAFT  │◀─────────────────────────┐                │
│                                   └────┬────┘                           │                │
│                                        │ SUBMIT                         │ EDIT           │
│                                        ▼                                │                │
│                                   ┌───────────┐                   ┌─────┴────┐          │
│                                   │ SUBMITTED │                   │ RETURNED │          │
│                                   └─────┬─────┘                   └──────────┘          │
│                                         │ START_REVIEW                   ▲              │
│                                         ▼                                │ RETURN       │
│                                   ┌─────────────┐────────────────────────┘              │
│                                   │ UNDER_REVIEW│                                        │
│                                   └──────┬──────┘                                        │
│                                          │                                               │
│                     ┌────────────────────┼────────────────────┐                         │
│                     │ ROUTE_L1           │                    │ REJECT                  │
│                     ▼                    │                    ▼                         │
│              ┌────────────┐              │             ┌──────────┐                     │
│              │ PEND_APP_L1│              │             │ REJECTED │                     │
│              └──────┬─────┘              │             └──────────┘                     │
│                     │ APPROVE_L1         │             (terminal)                       │
│         ┌───────────┼───────────┐        │                                              │
│         │ (L1 final)│ (escalate)│        │                                              │
│         ▼           ▼           │        │                                              │
│   ┌──────────┐ ┌────────────┐   │        │                                              │
│   │ APPROVED │ │ PEND_APP_L2│   │        │                                              │
│   └────┬─────┘ └──────┬─────┘   │        │                                              │
│        │              │         │        │ (Similar pattern for L2→L3→L4→L5→L6→L7)     │
│        │              ▼         │        │                                              │
│        │        ┌────────────┐  │        │                                              │
│        │        │ ... L3-L7  │──┘        │                                              │
│        │        └────────────┘           │                                              │
│        │                                 │                                              │
│        │ INITIATE_DISBURSEMENT           │                                              │
│        ▼                                 │                                              │
│   ┌───────────────────┐                  │                                              │
│   │ PENDING_DISBURST  │◀─────────────────┘                                              │
│   └─────────┬─────────┘                                                                 │
│             │ DISBURSE                                                                  │
│             ▼                                                                           │
│   ┌───────────────────┐                                                                 │
│   │    DISBURSED      │                                                                 │
│   └─────────┬─────────┘                                                                 │
│             │ ACTIVATE                                                                  │
│             ▼                                                                           │
│   ┌───────────────────┐                                                                 │
│   │      ACTIVE       │◀──────────────────────────────────┐                            │
│   └─────────┬─────────┘                                    │                            │
│             │                                              │ RESCHEDULE                 │
│   ┌─────────┼─────────┬─────────────┐                     │                            │
│   │ CLOSE   │WRITE_OFF│             │               ┌─────┴─────┐                      │
│   ▼         ▼         │             │               │RESCHEDULED│                      │
│ ┌──────┐ ┌──────────┐ │             │               └───────────┘                      │
│ │CLOSED│ │WRITTEN_OFF│ │             │                                                  │
│ └──────┘ └──────────┘ │             │                                                  │
│(terminal) (terminal)  │             │                                                  │
│                       │             │                                                  │
└───────────────────────┴─────────────┴──────────────────────────────────────────────────┘
```

### 3.2 Transition Rules Table

| # | From State | To State | Event | Guard Condition | Action |
|---|------------|----------|-------|-----------------|--------|
| 1 | DRAFT | SUBMITTED | SUBMIT | allMandatoryFieldsFilled() | validateApplication(), startWorkflow() |
| 2 | SUBMITTED | UNDER_REVIEW | START_REVIEW | true | triggerCIBCheck(), assignToAnalyst() |
| 3 | UNDER_REVIEW | PENDING_APPROVAL_L1 | ROUTE_TO_L1 | amountWithinL1Limit() | assignToBranchCreditHead() |
| 4 | UNDER_REVIEW | PENDING_APPROVAL_L2 | ROUTE_TO_L2 | amountWithinL2Limit() | assignToBranchManager() |
| 5 | UNDER_REVIEW | PENDING_APPROVAL_L3 | ROUTE_TO_L3 | amountWithinL3Limit() | assignToRegionalManager() |
| 6 | UNDER_REVIEW | PENDING_APPROVAL_L4 | ROUTE_TO_L4 | amountWithinL4Limit() | assignToHeadOfCredit() |
| 7 | UNDER_REVIEW | PENDING_APPROVAL_L5 | ROUTE_TO_L5 | amountWithinL5Limit() | assignToCreditCommittee() |
| 8 | UNDER_REVIEW | PENDING_APPROVAL_L6 | ROUTE_TO_L6 | amountWithinL6Limit() | assignToDeputyMD() |
| 9 | UNDER_REVIEW | PENDING_APPROVAL_L7 | ROUTE_TO_L7 | amountExceedsL6Limit() | assignToMD() |
| 10 | UNDER_REVIEW | RETURNED | RETURN | hasReturnReason() | notifyApplicant() |
| 11 | UNDER_REVIEW | REJECTED | REJECT | hasRejectionReason() | recordRejection(), notifyApplicant() |
| 12 | RETURNED | DRAFT | EDIT | true | reopenForEditing() |
| 13 | PENDING_APPROVAL_L1 | APPROVED | APPROVE_L1 | isL1FinalLevel() | recordApproval(), notifyNextStep() |
| 14 | PENDING_APPROVAL_L1 | PENDING_APPROVAL_L2 | APPROVE_L1 | requiresL2Approval() | recordApproval(), escalateToL2() |
| 15 | PENDING_APPROVAL_L1 | RETURNED | RETURN | hasReturnReason() | recordReturn(), notifyApplicant() |
| 16 | PENDING_APPROVAL_L1 | REJECTED | REJECT | hasRejectionReason() | recordRejection(), notifyApplicant() |
| 17-28 | PENDING_APPROVAL_L2-L7 | (similar pattern) | APPROVE_Lx/RETURN/REJECT | (similar guards) | (similar actions) |
| 29 | APPROVED | PENDING_DISBURSEMENT | INITIATE_DISBURSEMENT | allConditionsMet() | createDisbursementTask() |
| 30 | APPROVED | CANCELLED | CANCEL | hasCancellationReason() | recordCancellation() |
| 31 | PENDING_DISBURSEMENT | DISBURSED | COMPLETE_DISBURSEMENT | disbursementVerified() | createLoanAccount(), loadCBSLimit() |
| 32 | PENDING_DISBURSEMENT | PARTIALLY_DISBURSED | PARTIAL_DISBURSE | partialAmountValid() | recordPartialDisbursement() |
| 33 | PARTIALLY_DISBURSED | DISBURSED | COMPLETE_DISBURSEMENT | remainingAmountDisbursed() | finalizeAccount() |
| 34 | DISBURSED | ACTIVE | ACTIVATE | firstRepaymentDue() | activateLoan(), startRepaymentSchedule() |
| 35 | ACTIVE | CLOSED | CLOSE | outstandingIsZero() | closeLoanAccount(), releaseCollateral() |
| 36 | ACTIVE | WRITTEN_OFF | WRITE_OFF | boardApprovalReceived() | writeOffLoan(), createRecoveryCase() |
| 37 | ACTIVE | RESCHEDULED | RESCHEDULE | rescheduleApproved() | applyNewTerms(), regenerateSchedule() |
| 38 | RESCHEDULED | ACTIVE | ACTIVATE | true | reactivateLoan() |

### 3.3 Approval Level Routing Logic

```java
/**
 * Determines the required approval level based on loan amount
 * Reference: RBAC Authorization Matrix v1.0 Section 3.2
 */
public ApprovalLevel determineApprovalLevel(BigDecimal loanAmount) {
    // Amount thresholds in BDT
    final BigDecimal L1_MAX = new BigDecimal("500000");        // 5 Lakh
    final BigDecimal L2_MAX = new BigDecimal("1000000");       // 10 Lakh
    final BigDecimal L3_MAX = new BigDecimal("2500000");       // 25 Lakh
    final BigDecimal L4_MAX = new BigDecimal("10000000");      // 1 Crore
    final BigDecimal L5_MAX = new BigDecimal("50000000");      // 5 Crore
    final BigDecimal L6_MAX = new BigDecimal("100000000");     // 10 Crore

    if (loanAmount.compareTo(L1_MAX) <= 0) {
        return ApprovalLevel.L1;  // Branch Credit Head
    } else if (loanAmount.compareTo(L2_MAX) <= 0) {
        return ApprovalLevel.L2;  // Branch Manager
    } else if (loanAmount.compareTo(L3_MAX) <= 0) {
        return ApprovalLevel.L3;  // Regional Manager
    } else if (loanAmount.compareTo(L4_MAX) <= 0) {
        return ApprovalLevel.L4;  // Head of Credit
    } else if (loanAmount.compareTo(L5_MAX) <= 0) {
        return ApprovalLevel.L5;  // Credit Committee
    } else if (loanAmount.compareTo(L6_MAX) <= 0) {
        return ApprovalLevel.L6;  // Deputy MD
    } else {
        return ApprovalLevel.L7;  // Managing Director
    }
}
```

---

## 4. State Machine Implementation

### 4.1 Spring State Machine Configuration

```java
package com.ulms.workflow.config;

import com.ulms.workflow.state.LoanState;
import com.ulms.workflow.state.LoanEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.StateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;

import java.util.EnumSet;

@Configuration
@EnableStateMachineFactory
public class LoanStateMachineConfig
        extends StateMachineConfigurerAdapter<LoanState, LoanEvent> {

    @Override
    public void configure(StateMachineStateConfigurer<LoanState, LoanEvent> states)
            throws Exception {
        states
            .withStates()
                // Initial state
                .initial(LoanState.DRAFT)

                // All states
                .states(EnumSet.allOf(LoanState.class))

                // Terminal states (end states)
                .end(LoanState.CLOSED)
                .end(LoanState.WRITTEN_OFF)
                .end(LoanState.REJECTED)
                .end(LoanState.CANCELLED)
                .end(LoanState.WITHDRAWN);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<LoanState, LoanEvent> transitions)
            throws Exception {
        transitions
            // ═══════════════════════════════════════════════════════════════════
            // APPLICATION PHASE TRANSITIONS
            // ═══════════════════════════════════════════════════════════════════

            // DRAFT → SUBMITTED
            .withExternal()
                .source(LoanState.DRAFT)
                .target(LoanState.SUBMITTED)
                .event(LoanEvent.SUBMIT)
                .guard(guards.allMandatoryFieldsFilled())
                .action(actions.validateApplication())
                .action(actions.startWorkflow())
            .and()

            // SUBMITTED → UNDER_REVIEW
            .withExternal()
                .source(LoanState.SUBMITTED)
                .target(LoanState.UNDER_REVIEW)
                .event(LoanEvent.START_REVIEW)
                .action(actions.triggerCIBCheck())
                .action(actions.assignToAnalyst())
            .and()

            // RETURNED → DRAFT
            .withExternal()
                .source(LoanState.RETURNED)
                .target(LoanState.DRAFT)
                .event(LoanEvent.EDIT)
                .action(actions.reopenForEditing())
            .and()

            // ═══════════════════════════════════════════════════════════════════
            // ROUTING TRANSITIONS (UNDER_REVIEW → APPROVAL LEVELS)
            // ═══════════════════════════════════════════════════════════════════

            // Route to L1
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L1)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountWithinL1Limit())
                .action(actions.assignToBranchCreditHead())
            .and()

            // Route to L2
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L2)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountWithinL2Limit())
                .action(actions.assignToBranchManager())
            .and()

            // Route to L3
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L3)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountWithinL3Limit())
                .action(actions.assignToRegionalManager())
            .and()

            // Route to L4
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L4)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountWithinL4Limit())
                .action(actions.assignToHeadOfCredit())
            .and()

            // Route to L5
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L5)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountWithinL5Limit())
                .action(actions.assignToCreditCommittee())
            .and()

            // Route to L6
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L6)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountWithinL6Limit())
                .action(actions.assignToDeputyMD())
            .and()

            // Route to L7
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.PENDING_APPROVAL_L7)
                .event(LoanEvent.ROUTE_TO_APPROVAL)
                .guard(guards.amountExceedsL6Limit())
                .action(actions.assignToMD())
            .and()

            // UNDER_REVIEW → RETURNED
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.RETURNED)
                .event(LoanEvent.RETURN)
                .guard(guards.hasReturnReason())
                .action(actions.recordReturn())
                .action(actions.notifyApplicant())
            .and()

            // UNDER_REVIEW → REJECTED
            .withExternal()
                .source(LoanState.UNDER_REVIEW)
                .target(LoanState.REJECTED)
                .event(LoanEvent.REJECT)
                .guard(guards.hasRejectionReason())
                .action(actions.recordRejection())
                .action(actions.notifyApplicant())
            .and()

            // ═══════════════════════════════════════════════════════════════════
            // L1 APPROVAL TRANSITIONS
            // ═══════════════════════════════════════════════════════════════════

            // L1 → APPROVED (final for L1 amounts)
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L1)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .guard(guards.isL1FinalLevel())
                .action(actions.recordApproval())
                .action(actions.notifyNextStep())
            .and()

            // L1 → L2 (escalation for larger amounts)
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L1)
                .target(LoanState.PENDING_APPROVAL_L2)
                .event(LoanEvent.APPROVE)
                .guard(guards.requiresL2Approval())
                .action(actions.recordApproval())
                .action(actions.escalateToL2())
            .and()

            // L1 → RETURNED
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L1)
                .target(LoanState.RETURNED)
                .event(LoanEvent.RETURN)
                .guard(guards.hasReturnReason())
                .action(actions.recordReturn())
            .and()

            // L1 → REJECTED
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L1)
                .target(LoanState.REJECTED)
                .event(LoanEvent.REJECT)
                .guard(guards.hasRejectionReason())
                .action(actions.recordRejection())
            .and()

            // ═══════════════════════════════════════════════════════════════════
            // L2-L7 APPROVAL TRANSITIONS (Similar pattern)
            // ═══════════════════════════════════════════════════════════════════

            // L2 → APPROVED or L3
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L2)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .guard(guards.isL2FinalLevel())
                .action(actions.recordApproval())
            .and()

            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L2)
                .target(LoanState.PENDING_APPROVAL_L3)
                .event(LoanEvent.APPROVE)
                .guard(guards.requiresL3Approval())
                .action(actions.recordApproval())
            .and()

            // L3 → APPROVED or L4
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L3)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .guard(guards.isL3FinalLevel())
                .action(actions.recordApproval())
            .and()

            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L3)
                .target(LoanState.PENDING_APPROVAL_L4)
                .event(LoanEvent.APPROVE)
                .guard(guards.requiresL4Approval())
                .action(actions.recordApproval())
            .and()

            // L4 → APPROVED or L5
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L4)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .guard(guards.isL4FinalLevel())
                .action(actions.recordApproval())
            .and()

            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L4)
                .target(LoanState.PENDING_APPROVAL_L5)
                .event(LoanEvent.APPROVE)
                .guard(guards.requiresL5Approval())
                .action(actions.recordApproval())
            .and()

            // L5 → APPROVED or L6
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L5)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .guard(guards.isL5FinalLevel())
                .action(actions.recordApproval())
            .and()

            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L5)
                .target(LoanState.PENDING_APPROVAL_L6)
                .event(LoanEvent.APPROVE)
                .guard(guards.requiresL6Approval())
                .action(actions.recordApproval())
            .and()

            // L6 → APPROVED or L7
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L6)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .guard(guards.isL6FinalLevel())
                .action(actions.recordApproval())
            .and()

            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L6)
                .target(LoanState.PENDING_APPROVAL_L7)
                .event(LoanEvent.APPROVE)
                .guard(guards.requiresL7Approval())
                .action(actions.recordApproval())
            .and()

            // L7 → APPROVED (always final)
            .withExternal()
                .source(LoanState.PENDING_APPROVAL_L7)
                .target(LoanState.APPROVED)
                .event(LoanEvent.APPROVE)
                .action(actions.recordApproval())
            .and()

            // ═══════════════════════════════════════════════════════════════════
            // REJECTION/RETURN from any approval level (L2-L7)
            // ═══════════════════════════════════════════════════════════════════

            // (Add RETURN and REJECT transitions for L2-L7 similar to L1)

            // ═══════════════════════════════════════════════════════════════════
            // DISBURSEMENT PHASE TRANSITIONS
            // ═══════════════════════════════════════════════════════════════════

            // APPROVED → PENDING_DISBURSEMENT
            .withExternal()
                .source(LoanState.APPROVED)
                .target(LoanState.PENDING_DISBURSEMENT)
                .event(LoanEvent.INITIATE_DISBURSEMENT)
                .guard(guards.allConditionsMet())
                .action(actions.createDisbursementTask())
            .and()

            // APPROVED → CANCELLED
            .withExternal()
                .source(LoanState.APPROVED)
                .target(LoanState.CANCELLED)
                .event(LoanEvent.CANCEL)
                .guard(guards.hasCancellationReason())
                .action(actions.recordCancellation())
            .and()

            // PENDING_DISBURSEMENT → DISBURSED
            .withExternal()
                .source(LoanState.PENDING_DISBURSEMENT)
                .target(LoanState.DISBURSED)
                .event(LoanEvent.COMPLETE_DISBURSEMENT)
                .guard(guards.disbursementVerified())
                .action(actions.createLoanAccount())
                .action(actions.loadCBSLimit())
            .and()

            // PENDING_DISBURSEMENT → PARTIALLY_DISBURSED
            .withExternal()
                .source(LoanState.PENDING_DISBURSEMENT)
                .target(LoanState.PARTIALLY_DISBURSED)
                .event(LoanEvent.PARTIAL_DISBURSE)
                .guard(guards.partialAmountValid())
                .action(actions.recordPartialDisbursement())
            .and()

            // PARTIALLY_DISBURSED → DISBURSED
            .withExternal()
                .source(LoanState.PARTIALLY_DISBURSED)
                .target(LoanState.DISBURSED)
                .event(LoanEvent.COMPLETE_DISBURSEMENT)
                .guard(guards.remainingAmountDisbursed())
                .action(actions.finalizeAccount())
            .and()

            // ═══════════════════════════════════════════════════════════════════
            // ACTIVE PHASE TRANSITIONS
            // ═══════════════════════════════════════════════════════════════════

            // DISBURSED → ACTIVE
            .withExternal()
                .source(LoanState.DISBURSED)
                .target(LoanState.ACTIVE)
                .event(LoanEvent.ACTIVATE)
                .guard(guards.firstRepaymentDue())
                .action(actions.activateLoan())
                .action(actions.startRepaymentSchedule())
            .and()

            // ACTIVE → CLOSED
            .withExternal()
                .source(LoanState.ACTIVE)
                .target(LoanState.CLOSED)
                .event(LoanEvent.CLOSE)
                .guard(guards.outstandingIsZero())
                .action(actions.closeLoanAccount())
                .action(actions.releaseCollateral())
            .and()

            // ACTIVE → WRITTEN_OFF
            .withExternal()
                .source(LoanState.ACTIVE)
                .target(LoanState.WRITTEN_OFF)
                .event(LoanEvent.WRITE_OFF)
                .guard(guards.boardApprovalReceived())
                .action(actions.writeOffLoan())
                .action(actions.createRecoveryCase())
            .and()

            // ACTIVE → RESCHEDULED
            .withExternal()
                .source(LoanState.ACTIVE)
                .target(LoanState.RESCHEDULED)
                .event(LoanEvent.RESCHEDULE)
                .guard(guards.rescheduleApproved())
                .action(actions.applyNewTerms())
                .action(actions.regenerateSchedule())
            .and()

            // RESCHEDULED → ACTIVE
            .withExternal()
                .source(LoanState.RESCHEDULED)
                .target(LoanState.ACTIVE)
                .event(LoanEvent.ACTIVATE)
                .action(actions.reactivateLoan());
    }
}
```

### 4.2 State Persistence Configuration

```java
package com.ulms.workflow.config;

import com.ulms.workflow.state.LoanState;
import com.ulms.workflow.state.LoanEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.persist.DefaultStateMachinePersister;
import org.springframework.statemachine.persist.StateMachinePersister;

@Configuration
public class StateMachinePersistenceConfig {

    @Bean
    public StateMachinePersister<LoanState, LoanEvent, String> persister(
            LoanStateMachinePersist stateMachinePersist) {
        return new DefaultStateMachinePersister<>(stateMachinePersist);
    }
}
```

```java
package com.ulms.workflow.persist;

import com.ulms.workflow.state.LoanState;
import com.ulms.workflow.state.LoanEvent;
import org.springframework.statemachine.StateMachineContext;
import org.springframework.statemachine.StateMachinePersist;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LoanStateMachinePersist
        implements StateMachinePersist<LoanState, LoanEvent, String> {

    private final LoanRepository loanRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void write(StateMachineContext<LoanState, LoanEvent> context, String loanId) {
        Loan loan = loanRepository.findById(Long.parseLong(loanId))
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        loan.setLoanStatus(context.getState().name());
        loan.setStateMachineContext(serialize(context));
        loan.setUpdatedAt(Instant.now());

        loanRepository.save(loan);
    }

    @Override
    public StateMachineContext<LoanState, LoanEvent> read(String loanId) {
        Loan loan = loanRepository.findById(Long.parseLong(loanId))
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        if (loan.getStateMachineContext() == null) {
            return null;
        }

        return deserialize(loan.getStateMachineContext());
    }

    private String serialize(StateMachineContext<LoanState, LoanEvent> context) {
        try {
            return objectMapper.writeValueAsString(context);
        } catch (JsonProcessingException e) {
            throw new StateMachineException("Failed to serialize state machine context", e);
        }
    }

    private StateMachineContext<LoanState, LoanEvent> deserialize(String json) {
        try {
            return objectMapper.readValue(json,
                new TypeReference<StateMachineContext<LoanState, LoanEvent>>() {});
        } catch (JsonProcessingException e) {
            throw new StateMachineException("Failed to deserialize state machine context", e);
        }
    }
}
```

---

## 5. Event Definitions

### 5.1 Loan Event Enumeration

```java
package com.ulms.workflow.state;

/**
 * Events that trigger state transitions in the loan lifecycle
 */
public enum LoanEvent {

    // ═══════════════════════════════════════════════════════════════════════
    // APPLICATION EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    SUBMIT("Submit application for processing"),
    START_REVIEW("Start credit analysis review"),
    EDIT("Re-open for editing after return"),

    // ═══════════════════════════════════════════════════════════════════════
    // ROUTING EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    ROUTE_TO_APPROVAL("Route to appropriate approval level"),

    // ═══════════════════════════════════════════════════════════════════════
    // APPROVAL EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    APPROVE("Approve at current level"),
    REJECT("Reject application"),
    RETURN("Return for revision"),
    DELEGATE("Delegate to another approver"),

    // ═══════════════════════════════════════════════════════════════════════
    // ESCALATION EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    ESCALATE("Manual escalation to higher level"),
    AUTO_ESCALATE("Automatic escalation due to SLA breach"),

    // ═══════════════════════════════════════════════════════════════════════
    // DISBURSEMENT EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    INITIATE_DISBURSEMENT("Start disbursement process"),
    PARTIAL_DISBURSE("Complete partial disbursement"),
    COMPLETE_DISBURSEMENT("Complete full disbursement"),
    CANCEL_DISBURSEMENT("Cancel disbursement"),

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    ACTIVATE("Activate loan for repayment"),
    CANCEL("Cancel before disbursement"),
    WITHDRAW("Customer withdraws application"),

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIVE LOAN EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    RECEIVE_PAYMENT("Receive repayment"),
    MARK_OVERDUE("Mark as overdue"),
    CLOSE("Close fully repaid loan"),
    WRITE_OFF("Write off bad debt"),
    RESCHEDULE("Reschedule/restructure loan");

    private final String description;

    LoanEvent(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
```

### 5.2 Kafka Event Schema

```java
package com.ulms.workflow.event;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Kafka event published on loan state transitions
 * Topic: loan.applications, loan.approvals
 */
@Data
@Builder
public class LoanStateChangeEvent {

    // Event Metadata
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private String correlationId;

    // Loan Information
    private Long loanId;
    private String applicationNumber;
    private String accountNumber;
    private Long clientId;
    private String clientName;
    private String branchId;

    // State Change Details
    private String fromState;
    private String toState;
    private String triggerEvent;

    // Approval Details (if approval event)
    private Integer approvalLevel;
    private String approverId;
    private String approverName;
    private String approverRole;
    private String decision;
    private String comments;

    // Loan Details
    private BigDecimal loanAmount;
    private String productCode;
    private String productName;

    // Tenant Information
    private String tenantId;

    // Camunda Process Info
    private String processInstanceId;
    private String taskId;
}
```

### 5.3 Kafka Topic Configuration

```yaml
# Kafka topics for loan workflow events
kafka:
  topics:
    loan-applications:
      name: loan.applications
      partitions: 12
      replication-factor: 3
      retention-ms: 31536000000  # 1 year

    loan-approvals:
      name: loan.approvals
      partitions: 6
      replication-factor: 3
      retention-ms: 220752000000  # 7 years (regulatory)

    loan-disbursements:
      name: loan.disbursements
      partitions: 6
      replication-factor: 3
      retention-ms: 220752000000  # 7 years

    loan-status-changes:
      name: loan.status-changes
      partitions: 12
      replication-factor: 3
      retention-ms: 220752000000  # 7 years
```

---

## 6. Guard Conditions

### 6.1 Guard Implementation

```java
package com.ulms.workflow.guard;

import com.ulms.workflow.state.LoanState;
import com.ulms.workflow.state.LoanEvent;
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.guard.Guard;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class LoanStateGuards {

    private final LoanRepository loanRepository;
    private final ApprovalService approvalService;

    // Amount thresholds in BDT
    private static final BigDecimal L1_MAX = new BigDecimal("500000");
    private static final BigDecimal L2_MAX = new BigDecimal("1000000");
    private static final BigDecimal L3_MAX = new BigDecimal("2500000");
    private static final BigDecimal L4_MAX = new BigDecimal("10000000");
    private static final BigDecimal L5_MAX = new BigDecimal("50000000");
    private static final BigDecimal L6_MAX = new BigDecimal("100000000");

    // ═══════════════════════════════════════════════════════════════════════
    // APPLICATION GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    public Guard<LoanState, LoanEvent> allMandatoryFieldsFilled() {
        return context -> {
            Long loanId = getLoanId(context);
            Loan loan = loanRepository.findById(loanId).orElse(null);
            if (loan == null) return false;

            return loan.getClientId() != null
                && loan.getProductId() != null
                && loan.getProposedPrincipal() != null
                && loan.getProposedPrincipal().compareTo(BigDecimal.ZERO) > 0
                && loan.getProposedTermMonths() != null
                && loan.getProposedTermMonths() > 0;
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AMOUNT-BASED ROUTING GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    public Guard<LoanState, LoanEvent> amountWithinL1Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L1_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> amountWithinL2Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L1_MAX) > 0 && amount.compareTo(L2_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> amountWithinL3Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L2_MAX) > 0 && amount.compareTo(L3_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> amountWithinL4Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L3_MAX) > 0 && amount.compareTo(L4_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> amountWithinL5Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L4_MAX) > 0 && amount.compareTo(L5_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> amountWithinL6Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L5_MAX) > 0 && amount.compareTo(L6_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> amountExceedsL6Limit() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L6_MAX) > 0;
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APPROVAL LEVEL FINAL GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    public Guard<LoanState, LoanEvent> isL1FinalLevel() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L1_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> requiresL2Approval() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L1_MAX) > 0;
        };
    }

    public Guard<LoanState, LoanEvent> isL2FinalLevel() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L1_MAX) > 0 && amount.compareTo(L2_MAX) <= 0;
        };
    }

    public Guard<LoanState, LoanEvent> requiresL3Approval() {
        return context -> {
            BigDecimal amount = getLoanAmount(context);
            return amount.compareTo(L2_MAX) > 0;
        };
    }

    // ... similar guards for L3-L7

    // ═══════════════════════════════════════════════════════════════════════
    // RETURN/REJECTION GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    public Guard<LoanState, LoanEvent> hasReturnReason() {
        return context -> {
            String reason = (String) context.getExtendedState()
                .getVariables().get("returnReason");
            return reason != null && !reason.trim().isEmpty();
        };
    }

    public Guard<LoanState, LoanEvent> hasRejectionReason() {
        return context -> {
            String reason = (String) context.getExtendedState()
                .getVariables().get("rejectionReason");
            return reason != null && !reason.trim().isEmpty();
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DISBURSEMENT GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    public Guard<LoanState, LoanEvent> allConditionsMet() {
        return context -> {
            Long loanId = getLoanId(context);
            Loan loan = loanRepository.findById(loanId).orElse(null);
            if (loan == null) return false;

            // Check all pre-disbursement conditions
            return loan.isCibChecked()
                && loan.isCpvCompleted()
                && (!loan.isHasCollateral() || isCollateralRegistered(loanId))
                && areAllDocumentsVerified(loanId);
        };
    }

    public Guard<LoanState, LoanEvent> disbursementVerified() {
        return context -> {
            String disbursementRef = (String) context.getExtendedState()
                .getVariables().get("disbursementReference");
            return disbursementRef != null && !disbursementRef.isEmpty();
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLOSURE GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    public Guard<LoanState, LoanEvent> outstandingIsZero() {
        return context -> {
            Long loanId = getLoanId(context);
            Loan loan = loanRepository.findById(loanId).orElse(null);
            if (loan == null) return false;

            return loan.getTotalOutstanding().compareTo(BigDecimal.ZERO) == 0;
        };
    }

    public Guard<LoanState, LoanEvent> boardApprovalReceived() {
        return context -> {
            Long loanId = getLoanId(context);
            // Check for board-level write-off approval
            return approvalService.hasWriteOffApproval(loanId);
        };
    }

    public Guard<LoanState, LoanEvent> rescheduleApproved() {
        return context -> {
            Long loanId = getLoanId(context);
            return approvalService.hasRescheduleApproval(loanId);
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════

    private Long getLoanId(StateContext<LoanState, LoanEvent> context) {
        return (Long) context.getExtendedState().getVariables().get("loanId");
    }

    private BigDecimal getLoanAmount(StateContext<LoanState, LoanEvent> context) {
        Long loanId = getLoanId(context);
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        return loan.getApprovedPrincipal() != null
            ? loan.getApprovedPrincipal()
            : loan.getProposedPrincipal();
    }

    private boolean isCollateralRegistered(Long loanId) {
        // Check collateral registration status
        return true; // Simplified
    }

    private boolean areAllDocumentsVerified(Long loanId) {
        // Check document verification status
        return true; // Simplified
    }
}
```

---

## 7. Actions and Side Effects

### 7.1 Action Implementation

```java
package com.ulms.workflow.action;

import com.ulms.workflow.state.LoanState;
import com.ulms.workflow.state.LoanEvent;
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.action.Action;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoanStateActions {

    private final LoanRepository loanRepository;
    private final LoanStatusHistoryRepository historyRepository;
    private final ApprovalLogRepository approvalLogRepository;
    private final NotificationService notificationService;
    private final KafkaEventPublisher eventPublisher;
    private final CIBService cibService;
    private final CBSIntegrationService cbsService;

    // ═══════════════════════════════════════════════════════════════════════
    // APPLICATION ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    public Action<LoanState, LoanEvent> validateApplication() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Validating loan application: {}", loanId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            // Validate all mandatory fields
            validateMandatoryFields(loan);

            // Update submission timestamp
            loan.setSubmittedOnDate(LocalDate.now());
            loanRepository.save(loan);

            recordStatusHistory(loan, null, LoanState.SUBMITTED, "Application submitted");
        };
    }

    public Action<LoanState, LoanEvent> startWorkflow() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Starting workflow for loan: {}", loanId);

            // Publish application submitted event
            publishStateChangeEvent(context, "APPLICATION_SUBMITTED");
        };
    }

    public Action<LoanState, LoanEvent> triggerCIBCheck() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Triggering CIB check for loan: {}", loanId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            // Async CIB check
            cibService.initiateInquiry(loan.getClientNid(), loanId);
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ASSIGNMENT ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    public Action<LoanState, LoanEvent> assignToBranchCreditHead() {
        return context -> assignToApprovalLevel(context, 1, "BRANCH_CREDIT_HEAD");
    }

    public Action<LoanState, LoanEvent> assignToBranchManager() {
        return context -> assignToApprovalLevel(context, 2, "BRANCH_MANAGER");
    }

    public Action<LoanState, LoanEvent> assignToRegionalManager() {
        return context -> assignToApprovalLevel(context, 3, "REGIONAL_MANAGER");
    }

    public Action<LoanState, LoanEvent> assignToHeadOfCredit() {
        return context -> assignToApprovalLevel(context, 4, "HEAD_OF_CREDIT");
    }

    public Action<LoanState, LoanEvent> assignToCreditCommittee() {
        return context -> assignToApprovalLevel(context, 5, "CREDIT_COMMITTEE");
    }

    public Action<LoanState, LoanEvent> assignToDeputyMD() {
        return context -> assignToApprovalLevel(context, 6, "DEPUTY_MD");
    }

    public Action<LoanState, LoanEvent> assignToMD() {
        return context -> assignToApprovalLevel(context, 7, "MANAGING_DIRECTOR");
    }

    private void assignToApprovalLevel(StateContext<LoanState, LoanEvent> context,
                                       int level, String candidateGroup) {
        Long loanId = getLoanId(context);
        log.info("Assigning loan {} to approval level {} ({})", loanId, level, candidateGroup);

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        loan.setCurrentApprovalLevel(level);
        loan.setPendingApprovalSince(Instant.now());
        loan.setApprovalSlaDueAt(calculateSlaDueTime(level));
        loan.setIsSlaBreached(false);

        loanRepository.save(loan);

        // Send notification to approvers
        notificationService.notifyApprovers(loan, candidateGroup);

        // Publish event
        publishStateChangeEvent(context, "ROUTED_TO_APPROVAL_L" + level);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APPROVAL ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    public Action<LoanState, LoanEvent> recordApproval() {
        return context -> {
            Long loanId = getLoanId(context);
            String approverId = (String) context.getExtendedState()
                .getVariables().get("approverId");
            String comments = (String) context.getExtendedState()
                .getVariables().get("comments");

            log.info("Recording approval for loan: {} by: {}", loanId, approverId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            // Create approval log
            ApprovalLog approvalLog = ApprovalLog.builder()
                .loanId(loanId)
                .approvalLevel(loan.getCurrentApprovalLevel())
                .approverUserId(approverId)
                .decision(ApprovalDecision.APPROVE)
                .comments(comments)
                .approvedAt(Instant.now())
                .slaDueAt(loan.getApprovalSlaDueAt())
                .isSlaBreached(loan.getIsSlaBreached())
                .build();

            approvalLogRepository.save(approvalLog);

            // Publish approval event
            publishApprovalEvent(context, "APPROVED", loan.getCurrentApprovalLevel());
        };
    }

    public Action<LoanState, LoanEvent> recordRejection() {
        return context -> {
            Long loanId = getLoanId(context);
            String approverId = (String) context.getExtendedState()
                .getVariables().get("approverId");
            String reason = (String) context.getExtendedState()
                .getVariables().get("rejectionReason");

            log.info("Recording rejection for loan: {} by: {}", loanId, approverId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            loan.setRejectedOnDate(LocalDate.now());
            loan.setRejectionReason(reason);
            loanRepository.save(loan);

            // Create approval log
            ApprovalLog approvalLog = ApprovalLog.builder()
                .loanId(loanId)
                .approvalLevel(loan.getCurrentApprovalLevel())
                .approverUserId(approverId)
                .decision(ApprovalDecision.REJECT)
                .comments(reason)
                .approvedAt(Instant.now())
                .build();

            approvalLogRepository.save(approvalLog);

            // Notify applicant
            notificationService.notifyRejection(loan, reason);

            // Publish event
            publishApprovalEvent(context, "REJECTED", loan.getCurrentApprovalLevel());
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DISBURSEMENT ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    public Action<LoanState, LoanEvent> createLoanAccount() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Creating loan account for: {}", loanId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            // Generate account number
            String accountNumber = generateAccountNumber(loan);
            loan.setAccountNo(accountNumber);
            loan.setActualDisbursementDate(LocalDate.now());
            loan.setPrincipalDisbursed(loan.getApprovedPrincipal());
            loan.setPrincipalOutstanding(loan.getApprovedPrincipal());

            loanRepository.save(loan);
        };
    }

    public Action<LoanState, LoanEvent> loadCBSLimit() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Loading CBS limit for loan: {}", loanId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            // Call CBS integration to load limit
            cbsService.loadLimit(loan);

            // Publish disbursement event
            publishStateChangeEvent(context, "DISBURSEMENT_COMPLETED");
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLOSURE ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    public Action<LoanState, LoanEvent> closeLoanAccount() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Closing loan account: {}", loanId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            loan.setClosedOnDate(LocalDate.now());
            loan.setActualMaturityDate(LocalDate.now());
            loanRepository.save(loan);

            // Publish closure event
            publishStateChangeEvent(context, "LOAN_CLOSED");
        };
    }

    public Action<LoanState, LoanEvent> releaseCollateral() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Releasing collateral for loan: {}", loanId);

            // Update collateral status to RELEASED
            // Notify customer about collateral release
        };
    }

    public Action<LoanState, LoanEvent> writeOffLoan() {
        return context -> {
            Long loanId = getLoanId(context);
            log.info("Writing off loan: {}", loanId);

            Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException(loanId));

            loan.setIsWrittenOff(true);
            loan.setWrittenOffOnDate(LocalDate.now());
            loan.setPrincipalWrittenOff(loan.getPrincipalOutstanding());
            loan.setInterestWrittenOff(loan.getInterestOutstanding());

            loanRepository.save(loan);

            // Publish write-off event
            publishStateChangeEvent(context, "LOAN_WRITTEN_OFF");
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════

    private Long getLoanId(StateContext<LoanState, LoanEvent> context) {
        return (Long) context.getExtendedState().getVariables().get("loanId");
    }

    private Instant calculateSlaDueTime(int level) {
        // SLA hours by level (from RBAC Matrix)
        int[] slaHours = {0, 4, 6, 8, 12, 24, 48, 72};
        return Instant.now().plus(Duration.ofHours(slaHours[level]));
    }

    private void recordStatusHistory(Loan loan, LoanState fromState,
                                     LoanState toState, String reason) {
        LoanStatusHistory history = LoanStatusHistory.builder()
            .loanId(loan.getId())
            .fromStatus(fromState != null ? fromState.name() : null)
            .toStatus(toState.name())
            .transitionReason(reason)
            .changedBy(SecurityContextHolder.getContext().getAuthentication().getName())
            .changedAt(Instant.now())
            .build();

        historyRepository.save(history);
    }

    private void publishStateChangeEvent(StateContext<LoanState, LoanEvent> context,
                                         String eventType) {
        Long loanId = getLoanId(context);
        Loan loan = loanRepository.findById(loanId).orElse(null);
        if (loan == null) return;

        LoanStateChangeEvent event = LoanStateChangeEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(eventType)
            .timestamp(Instant.now())
            .loanId(loanId)
            .applicationNumber(loan.getApplicationRef())
            .fromState(context.getSource() != null ? context.getSource().getId().name() : null)
            .toState(context.getTarget().getId().name())
            .loanAmount(loan.getApprovedPrincipal())
            .tenantId(TenantContext.getCurrentTenant())
            .build();

        eventPublisher.publish("loan.status-changes", event);
    }

    private void publishApprovalEvent(StateContext<LoanState, LoanEvent> context,
                                      String decision, int level) {
        Long loanId = getLoanId(context);
        String approverId = (String) context.getExtendedState()
            .getVariables().get("approverId");

        Loan loan = loanRepository.findById(loanId).orElse(null);
        if (loan == null) return;

        LoanStateChangeEvent event = LoanStateChangeEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType("APPROVAL_" + decision)
            .timestamp(Instant.now())
            .loanId(loanId)
            .applicationNumber(loan.getApplicationRef())
            .fromState(context.getSource().getId().name())
            .toState(context.getTarget().getId().name())
            .approvalLevel(level)
            .approverId(approverId)
            .decision(decision)
            .loanAmount(loan.getApprovedPrincipal())
            .tenantId(TenantContext.getCurrentTenant())
            .build();

        eventPublisher.publish("loan.approvals", event);
    }
}
```

---

## 8. Error Handling

### 8.1 Invalid Transition Handling

```java
package com.ulms.workflow.exception;

import com.ulms.workflow.state.LoanState;
import com.ulms.workflow.state.LoanEvent;
import org.springframework.statemachine.listener.StateMachineListenerAdapter;
import org.springframework.statemachine.state.State;
import org.springframework.statemachine.transition.Transition;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class StateMachineErrorHandler
        extends StateMachineListenerAdapter<LoanState, LoanEvent> {

    @Override
    public void transitionEnded(Transition<LoanState, LoanEvent> transition) {
        if (transition.getTarget() == null) {
            log.error("Invalid transition attempted: {} -> {} (event: {})",
                transition.getSource().getId(),
                "INVALID",
                transition.getTrigger().getEvent());

            throw new InvalidStateTransitionException(
                String.format("Cannot transition from %s with event %s",
                    transition.getSource().getId(),
                    transition.getTrigger().getEvent())
            );
        }
    }

    @Override
    public void stateMachineError(
            org.springframework.statemachine.StateMachine<LoanState, LoanEvent> stateMachine,
            Exception exception) {
        log.error("State machine error in state {}: {}",
            stateMachine.getState().getId(),
            exception.getMessage());

        // Record error for audit
        // Trigger alert if critical
    }
}
```

### 8.2 Exception Classes

```java
package com.ulms.workflow.exception;

public class InvalidStateTransitionException extends RuntimeException {

    private final String fromState;
    private final String toState;
    private final String event;

    public InvalidStateTransitionException(String message) {
        super(message);
        this.fromState = null;
        this.toState = null;
        this.event = null;
    }

    public InvalidStateTransitionException(String fromState, String toState, String event) {
        super(String.format("Invalid transition: %s -> %s (event: %s)",
            fromState, toState, event));
        this.fromState = fromState;
        this.toState = toState;
        this.event = event;
    }
}

public class LoanNotFoundException extends RuntimeException {

    public LoanNotFoundException(Long loanId) {
        super("Loan not found: " + loanId);
    }

    public LoanNotFoundException(String loanId) {
        super("Loan not found: " + loanId);
    }
}

public class GuardConditionFailedException extends RuntimeException {

    public GuardConditionFailedException(String guardName, String reason) {
        super(String.format("Guard condition '%s' failed: %s", guardName, reason));
    }
}
```

---

## 9. BRPD Classification States

### 9.1 Classification State Enumeration

```java
package com.ulms.workflow.state;

/**
 * BRPD 15/2024 compliant loan classification states
 * Based on Days Past Due (DPD)
 */
public enum ClassificationState {

    // Unclassified (before disbursement)
    UC("Unclassified", 0, 0, new BigDecimal("0"), "#CCCCCC"),

    // Standard (performing) - 3 stages
    STD_0("Standard - Current", 0, 0, new BigDecimal("0.01"), "#4CAF50"),
    STD_1("Standard - Watch", 1, 30, new BigDecimal("0.01"), "#8BC34A"),
    STD_2("Standard - Caution", 31, 60, new BigDecimal("0.01"), "#CDDC39"),

    // Special Mention Account
    SMA("Special Mention Account", 61, 90, new BigDecimal("0.05"), "#FF9800"),

    // Sub-Standard
    SS("Sub-Standard", 91, 180, new BigDecimal("0.20"), "#FF5722"),

    // Doubtful
    DF("Doubtful", 181, 365, new BigDecimal("0.50"), "#F44336"),

    // Bad/Loss
    BL("Bad/Loss", 366, Integer.MAX_VALUE, new BigDecimal("1.00"), "#B71C1C");

    private final String displayName;
    private final int minDPD;
    private final int maxDPD;
    private final BigDecimal provisionRate;
    private final String colorCode;

    ClassificationState(String displayName, int minDPD, int maxDPD,
                       BigDecimal provisionRate, String colorCode) {
        this.displayName = displayName;
        this.minDPD = minDPD;
        this.maxDPD = maxDPD;
        this.provisionRate = provisionRate;
        this.colorCode = colorCode;
    }

    /**
     * Determine classification based on DPD
     */
    public static ClassificationState fromDPD(int dpd) {
        if (dpd <= 0) return STD_0;
        if (dpd <= 30) return STD_1;
        if (dpd <= 60) return STD_2;
        if (dpd <= 90) return SMA;
        if (dpd <= 180) return SS;
        if (dpd <= 365) return DF;
        return BL;
    }

    public boolean isNPA() {
        return this == SMA || this == SS || this == DF || this == BL;
    }

    public boolean isClassified() {
        return this == SS || this == DF || this == BL;
    }

    // Getters...
}
```

### 9.2 Daily Classification Job

```java
package com.ulms.workflow.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyClassificationJob {

    private final LoanRepository loanRepository;
    private final ClassificationService classificationService;

    /**
     * Run daily at 00:30 to classify all active loans
     * BRPD 15/2024 requires daily classification
     */
    @Scheduled(cron = "0 30 0 * * ?")
    public void runDailyClassification() {
        log.info("Starting daily loan classification job");

        List<Loan> activeLoans = loanRepository.findAllActive();

        for (Loan loan : activeLoans) {
            try {
                classificationService.classifyLoan(loan);
            } catch (Exception e) {
                log.error("Failed to classify loan {}: {}", loan.getId(), e.getMessage());
            }
        }

        log.info("Daily classification completed. Processed {} loans", activeLoans.size());
    }
}
```

---

## 10. Monitoring and Reporting

### 10.1 State Distribution Dashboard Metrics

```java
package com.ulms.workflow.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Gauge;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkflowMetrics {

    private final LoanRepository loanRepository;
    private final MeterRegistry meterRegistry;

    @PostConstruct
    public void registerMetrics() {
        // Loans by state
        for (LoanState state : LoanState.values()) {
            Gauge.builder("ulms.loans.by_state", loanRepository,
                    repo -> repo.countByLoanStatus(state.name()))
                .tag("state", state.name())
                .description("Number of loans in " + state.getDisplayName())
                .register(meterRegistry);
        }

        // Loans pending approval by level
        for (int level = 1; level <= 7; level++) {
            final int l = level;
            Gauge.builder("ulms.loans.pending_approval", loanRepository,
                    repo -> repo.countPendingApprovalAtLevel(l))
                .tag("level", "L" + level)
                .description("Loans pending approval at level " + level)
                .register(meterRegistry);
        }

        // SLA breaches
        Gauge.builder("ulms.loans.sla_breached", loanRepository,
                repo -> repo.countSlaBreach())
            .description("Number of loans with SLA breached")
            .register(meterRegistry);

        // Classification distribution
        for (ClassificationState cls : ClassificationState.values()) {
            Gauge.builder("ulms.loans.by_classification", loanRepository,
                    repo -> repo.countByClassification(cls.name()))
                .tag("classification", cls.name())
                .description("Loans classified as " + cls.getDisplayName())
                .register(meterRegistry);
        }
    }
}
```

### 10.2 Workflow Audit Log Schema

```sql
-- Table: {tenant_schema}.workflow_audit_log
-- Purpose: Complete audit trail for all workflow operations

CREATE TABLE workflow_audit_log (
    id BIGSERIAL PRIMARY KEY,

    -- Entity Reference
    loan_id BIGINT NOT NULL,
    application_ref VARCHAR(50),

    -- State Transition
    from_state VARCHAR(30),
    to_state VARCHAR(30) NOT NULL,
    event_type VARCHAR(50) NOT NULL,

    -- Actor
    actor_user_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50),
    actor_branch_id VARCHAR(20),

    -- Details
    approval_level INTEGER,
    decision VARCHAR(20),
    comments TEXT,
    conditions JSONB,

    -- Camunda Process
    process_instance_id VARCHAR(100),
    task_id VARCHAR(100),

    -- SLA
    sla_due_at TIMESTAMP WITH TIME ZONE,
    is_sla_breached BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Context
    ip_address INET,
    user_agent VARCHAR(500),
    correlation_id VARCHAR(100)
);

-- Indexes
CREATE INDEX idx_workflow_audit_loan ON workflow_audit_log(loan_id);
CREATE INDEX idx_workflow_audit_date ON workflow_audit_log(created_at);
CREATE INDEX idx_workflow_audit_actor ON workflow_audit_log(actor_user_id);
CREATE INDEX idx_workflow_audit_state ON workflow_audit_log(to_state);
CREATE INDEX idx_workflow_audit_process ON workflow_audit_log(process_instance_id);

-- BRIN index for time-series queries
CREATE INDEX brin_workflow_audit_date ON workflow_audit_log USING BRIN(created_at);

COMMENT ON TABLE workflow_audit_log IS 'Complete audit trail for loan workflow operations';
```

---

## 11. Implementation Guidelines

### 11.1 Integration with Camunda

```java
package com.ulms.workflow.camunda;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CamundaWorkflowService {

    private final RuntimeService runtimeService;
    private final StateMachinePersister<LoanState, LoanEvent, String> persister;

    /**
     * Synchronize Spring State Machine with Camunda process
     */
    public void syncWithCamunda(Long loanId, String processInstanceId) {
        // Get current state from Spring State Machine
        StateMachine<LoanState, LoanEvent> stateMachine =
            restoreStateMachine(loanId.toString());

        LoanState currentState = stateMachine.getState().getId();

        // Update Camunda process variable
        runtimeService.setVariable(
            processInstanceId,
            "loanState",
            currentState.name()
        );

        log.info("Synchronized loan {} state {} with Camunda process {}",
            loanId, currentState, processInstanceId);
    }

    /**
     * Start Camunda process when loan workflow starts
     */
    public String startProcess(Long loanId, String productCode) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("loanId", loanId);
        variables.put("productCode", productCode);
        variables.put("loanState", LoanState.SUBMITTED.name());

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
            "loan-approval-process",
            loanId.toString(),
            variables
        );

        return processInstance.getId();
    }
}
```

### 11.2 Service Layer Usage

```java
package com.ulms.workflow.service;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LoanWorkflowService {

    private final StateMachineFactory<LoanState, LoanEvent> stateMachineFactory;
    private final StateMachinePersister<LoanState, LoanEvent, String> persister;
    private final LoanRepository loanRepository;

    /**
     * Submit loan application
     */
    public LoanState submitApplication(Long loanId) {
        StateMachine<LoanState, LoanEvent> stateMachine =
            getStateMachine(loanId);

        stateMachine.getExtendedState().getVariables().put("loanId", loanId);

        boolean accepted = stateMachine.sendEvent(LoanEvent.SUBMIT);

        if (!accepted) {
            throw new InvalidStateTransitionException(
                "Cannot submit loan from current state: " +
                stateMachine.getState().getId()
            );
        }

        persistStateMachine(stateMachine, loanId.toString());

        return stateMachine.getState().getId();
    }

    /**
     * Approve loan at current level
     */
    public LoanState approveLoan(Long loanId, String approverId, String comments) {
        StateMachine<LoanState, LoanEvent> stateMachine =
            getStateMachine(loanId);

        stateMachine.getExtendedState().getVariables().put("loanId", loanId);
        stateMachine.getExtendedState().getVariables().put("approverId", approverId);
        stateMachine.getExtendedState().getVariables().put("comments", comments);

        boolean accepted = stateMachine.sendEvent(LoanEvent.APPROVE);

        if (!accepted) {
            throw new InvalidStateTransitionException(
                "Cannot approve loan from current state: " +
                stateMachine.getState().getId()
            );
        }

        persistStateMachine(stateMachine, loanId.toString());

        return stateMachine.getState().getId();
    }

    /**
     * Get current loan state
     */
    public LoanState getCurrentState(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        return LoanState.valueOf(loan.getLoanStatus());
    }

    private StateMachine<LoanState, LoanEvent> getStateMachine(Long loanId) {
        StateMachine<LoanState, LoanEvent> stateMachine =
            stateMachineFactory.getStateMachine(loanId.toString());

        try {
            persister.restore(stateMachine, loanId.toString());
        } catch (Exception e) {
            log.debug("No persisted state found for loan {}, using initial state", loanId);
        }

        stateMachine.start();
        return stateMachine;
    }

    private void persistStateMachine(
            StateMachine<LoanState, LoanEvent> stateMachine, String loanId) {
        try {
            persister.persist(stateMachine, loanId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to persist state machine", e);
        }
    }
}
```

---

## 12. Compliance Matrix

### 12.1 Regulatory Compliance

| Requirement | Regulation | Document Section | Implementation |
|-------------|------------|------------------|----------------|
| 7-level approval hierarchy | BRD 6.3.1 | Section 3 | LoanState enum, routing guards |
| SLA tracking | BRD 6.3.2 | Section 7 | Timer events, SLA actions |
| Audit trail | ICT Security V4.0 | Section 10 | workflow_audit_log table |
| Classification | BRPD 15/2024 | Section 9 | ClassificationState enum |
| State transitions | SRS 3.3.3 | Section 3, 4 | Spring State Machine config |
| Kafka events | EDA Design | Section 5 | LoanStateChangeEvent |

### 12.2 Document References

| Reference Document | Location | Relevant Sections |
|-------------------|----------|-------------------|
| RBAC Authorization Matrix | Phase_1/Security Architecture/ | Section 3 - 7-Level Hierarchy |
| Data Model - Loan Applications | Phase_1/Database Architecture/ | Section 4 - Status State Machine |
| Event Driven Architecture | Phase_1/ARCHITECTURE & DESIGN/ | Section 4 - Kafka Topics |
| Microservices Blueprint | Phase_1/ARCHITECTURE & DESIGN/ | Section 3.3 - Workflow Service |
| BRD | Root directory | Section 6.3 - Approval Workflow |
| SRS | Root directory | Section 3.3 - Workflow Specs |

---

## Appendix A: State Transition Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUICK REFERENCE: VALID TRANSITIONS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DRAFT ─────────────────────> SUBMITTED (SUBMIT)                            │
│  SUBMITTED ─────────────────> UNDER_REVIEW (START_REVIEW)                   │
│  UNDER_REVIEW ──────────────> PENDING_L1-L7 (ROUTE_TO_APPROVAL)            │
│  UNDER_REVIEW ──────────────> RETURNED (RETURN)                             │
│  UNDER_REVIEW ──────────────> REJECTED (REJECT)                             │
│  RETURNED ──────────────────> DRAFT (EDIT)                                  │
│  PENDING_L1-L7 ─────────────> APPROVED (APPROVE - final level)              │
│  PENDING_L1-L6 ─────────────> PENDING_L2-L7 (APPROVE - escalate)           │
│  PENDING_L1-L7 ─────────────> RETURNED (RETURN)                             │
│  PENDING_L1-L7 ─────────────> REJECTED (REJECT)                             │
│  APPROVED ──────────────────> PENDING_DISBURSEMENT (INITIATE_DISBURSEMENT)  │
│  APPROVED ──────────────────> CANCELLED (CANCEL)                            │
│  PENDING_DISBURSEMENT ──────> DISBURSED (COMPLETE_DISBURSEMENT)             │
│  DISBURSED ─────────────────> ACTIVE (ACTIVATE)                             │
│  ACTIVE ────────────────────> CLOSED (CLOSE)                                │
│  ACTIVE ────────────────────> WRITTEN_OFF (WRITE_OFF)                       │
│  ACTIVE ────────────────────> RESCHEDULED (RESCHEDULE)                      │
│  RESCHEDULED ───────────────> ACTIVE (ACTIVATE)                             │
│                                                                              │
│  TERMINAL STATES: REJECTED, WITHDRAWN, CLOSED, WRITTEN_OFF, CANCELLED       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document End**

*This document is part of the ULMS v2.0 Architecture Documentation Suite*

*Last Updated: February 5, 2026*
