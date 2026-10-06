# DMN Decision Tables

## Unisoft Loan Management System (ULMS) v2.0

### Amount-Based Routing and Business Rules

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.6.3 |
| **Document Title** | DMN Decision Tables |
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
| 1.0 | 2026-02-05 | Lead Developer | Initial DMN Decision Tables Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [DMN Specification Overview](#2-dmn-specification-overview)
3. [Decision Table Catalog](#3-decision-table-catalog)
4. [Approval Level Routing Decision Table](#4-approval-level-routing-decision-table)
5. [Risk-Based Escalation Rules](#5-risk-based-escalation-rules)
6. [Product-Based Routing Decision Table](#6-product-based-routing-decision-table)
7. [Auto-Approval Eligibility Decision Table](#7-auto-approval-eligibility-decision-table)
8. [SLA Determination Decision Table](#8-sla-determination-decision-table)
9. [Collateral Requirement Decision Table](#9-collateral-requirement-decision-table)
10. [Implementation Guidelines](#10-implementation-guidelines)
11. [Testing and Validation](#11-testing-and-validation)
12. [Compliance Matrix](#12-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the Decision Model and Notation (DMN) decision tables used in ULMS v2.0 for intelligent loan routing, approval level determination, and business rule execution. These decision tables are integrated with Camunda BPMN workflows to enable dynamic, rule-based processing.

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| DMN Version | 1.3 |
| Decision Tables | 6 tables |
| Integration | Camunda Platform 7.20 |
| Primary Use Cases | Approval routing, risk escalation, auto-approval |

### 1.3 Decision Table Summary

| # | Decision Table Name | Purpose | Hit Policy |
|---|---------------------|---------|------------|
| 1 | Approval Level Routing | Determine required approval level by amount | FIRST |
| 2 | Risk-Based Escalation | Escalate based on risk factors | FIRST |
| 3 | Product-Based Routing | Route by product category | FIRST |
| 4 | Auto-Approval Eligibility | Determine if auto-approval allowed | UNIQUE |
| 5 | SLA Determination | Calculate SLA hours by level | UNIQUE |
| 6 | Collateral Requirement | Determine collateral needs | FIRST |

### 1.4 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| DMN Engine | Camunda DMN | 7.20 |
| Workflow Engine | Camunda BPM | 7.20 |
| Integration | Spring Boot | 3.2.1 |
| Database | PostgreSQL | 16 |

---

## 2. DMN Specification Overview

### 2.1 DMN 1.3 Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DMN 1.3 ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DECISION REQUIREMENTS DIAGRAM                      │   │
│  │                                                                        │   │
│  │    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │   │
│  │    │  Input Data  │────▶│   Decision   │────▶│ Output Data  │       │   │
│  │    │              │     │    Table     │     │              │       │   │
│  │    │ • loanAmount │     │              │     │ • approvalLvl│       │   │
│  │    │ • riskGrade  │     │ Hit Policy:  │     │ • slaHours   │       │   │
│  │    │ • productCat │     │ FIRST/UNIQUE │     │ • candidateGr│       │   │
│  │    └──────────────┘     └──────────────┘     └──────────────┘       │   │
│  │                                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      HIT POLICIES                                     │   │
│  │                                                                        │   │
│  │  FIRST (F) - Return first matching rule (most common for routing)    │   │
│  │  UNIQUE (U) - Exactly one rule must match (validation)               │   │
│  │  ANY (A) - Multiple rules may match, but must return same result     │   │
│  │  COLLECT (C) - Collect all matching results                          │   │
│  │                                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Camunda DMN Integration

```java
package com.ulms.workflow.dmn;

import org.camunda.bpm.dmn.engine.DmnDecision;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.camunda.bpm.dmn.engine.DmnEngine;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DmnEvaluationService {

    private final DmnEngine dmnEngine;
    private final DecisionDefinitionRepository decisionRepository;

    /**
     * Evaluate a DMN decision table
     *
     * @param decisionKey The decision definition key (e.g., "approval-level-routing")
     * @param variables Input variables for decision evaluation
     * @return Decision table result
     */
    public DmnDecisionTableResult evaluate(String decisionKey, Map<String, Object> variables) {
        DmnDecision decision = decisionRepository.findByKey(decisionKey);

        return dmnEngine.evaluateDecisionTable(decision, variables);
    }

    /**
     * Determine approval level for a loan
     */
    public ApprovalLevelResult determineApprovalLevel(LoanRoutingRequest request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("loanAmount", request.getLoanAmount());
        variables.put("customerType", request.getCustomerType());
        variables.put("productCategory", request.getProductCategory());
        variables.put("riskGrade", request.getRiskGrade());

        DmnDecisionTableResult result = evaluate("approval-level-routing", variables);

        if (result.isEmpty()) {
            throw new DecisionNotFoundException("No matching approval level rule found");
        }

        return ApprovalLevelResult.builder()
            .approvalLevel(result.getSingleResult().getEntry("approvalLevel"))
            .candidateGroup(result.getSingleResult().getEntry("candidateGroup"))
            .slaHours(result.getSingleResult().getEntry("slaHours"))
            .build();
    }
}
```

---

## 3. Decision Table Catalog

### 3.1 Decision Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ULMS DECISION TABLE HIERARCHY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌─────────────────────┐                            │
│                          │  Loan Application   │                            │
│                          │      Received       │                            │
│                          └──────────┬──────────┘                            │
│                                     │                                        │
│                    ┌────────────────┼────────────────┐                      │
│                    ▼                │                ▼                       │
│    ┌─────────────────────┐         │    ┌─────────────────────┐            │
│    │  Auto-Approval      │         │    │  Collateral        │             │
│    │  Eligibility        │         │    │  Requirement       │             │
│    │  [DMN Table 4]      │         │    │  [DMN Table 6]     │             │
│    └─────────┬───────────┘         │    └───────────────────┘             │
│              │                      │                                        │
│              │ (if eligible)        │                                        │
│              ▼                      ▼                                        │
│    ┌─────────────────────┐ ┌─────────────────────┐                         │
│    │  Fast-Track        │ │  Product-Based      │                          │
│    │  Approval          │ │  Routing            │                          │
│    └─────────────────────┘ │  [DMN Table 3]      │                          │
│                            └──────────┬──────────┘                          │
│                                       │                                      │
│                                       ▼                                      │
│                          ┌─────────────────────┐                            │
│                          │  Approval Level     │                            │
│                          │  Routing            │                            │
│                          │  [DMN Table 1]      │                            │
│                          └──────────┬──────────┘                            │
│                                     │                                        │
│                    ┌────────────────┼────────────────┐                      │
│                    ▼                │                ▼                       │
│    ┌─────────────────────┐         │    ┌─────────────────────┐            │
│    │  Risk-Based         │         │    │  SLA Determination  │            │
│    │  Escalation         │         │    │  [DMN Table 5]      │            │
│    │  [DMN Table 2]      │         │    └───────────────────┘             │
│    └─────────────────────┘         │                                        │
│                                     │                                        │
│                                     ▼                                        │
│                          ┌─────────────────────┐                            │
│                          │  Route to Approval  │                            │
│                          │  Level (L1-L7)      │                            │
│                          └─────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Decision Table Specifications

| Table ID | Decision Key | Inputs | Outputs | Hit Policy | Usage |
|----------|--------------|--------|---------|------------|-------|
| DMN-001 | approval-level-routing | loanAmount, customerType, productCategory, riskGrade | approvalLevel, candidateGroup, slaHours | FIRST | Primary routing |
| DMN-002 | risk-escalation | cibScore, existingDPD, dbrPercentage | escalateLevels, riskGrade | FIRST | Risk escalation |
| DMN-003 | product-routing | productCategory, isIslamic, loanAmount | routingPath, specialApproval | FIRST | Product routing |
| DMN-004 | auto-approval-eligibility | customerType, creditScore, existingRelationship, loanAmount | isEligible, maxAutoAmount | UNIQUE | Auto-approval |
| DMN-005 | sla-determination | approvalLevel, priority, productCategory | slaHours, escalationHours | UNIQUE | SLA calculation |
| DMN-006 | collateral-requirement | productCategory, loanAmount, riskGrade | requiresCollateral, minCoverage | FIRST | Collateral rules |

---

## 4. Approval Level Routing Decision Table

### 4.1 Decision Table Definition

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  DECISION TABLE: Approval Level Routing                                                      │
│  Decision Key: approval-level-routing                                                        │
│  Hit Policy: FIRST (F)                                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │ #  │ Loan Amount (BDT)  │ Customer │ Product   │ Risk    │ Level │ Candidate Group   │SLA│
│  │    │                    │ Type     │ Category  │ Grade   │       │                   │hrs│
│  ├────┼────────────────────┼──────────┼───────────┼─────────┼───────┼───────────────────┼───┤
│  │ 1  │ <= 500,000         │ -        │ -         │ NOT HIGH│  L1   │ BRANCH_CREDIT_HEAD│ 4 │
│  │ 2  │ (500,000, 1,000,000]│ -       │ -         │ NOT HIGH│  L2   │ BRANCH_MANAGER    │ 6 │
│  │ 3  │ (1,000,000, 2,500,000]│ -     │ -         │ -       │  L3   │ REGIONAL_MANAGER  │ 8 │
│  │ 4  │ (2,500,000, 10,000,000]│ -    │ -         │ -       │  L4   │ HEAD_OF_CREDIT    │12 │
│  │ 5  │ (10,000,000, 50,000,000]│ -   │ -         │ -       │  L5   │ CREDIT_COMMITTEE  │24 │
│  │ 6  │ (50,000,000, 100,000,000]│ -  │ -         │ -       │  L6   │ DEPUTY_MD         │48 │
│  │ 7  │ > 100,000,000      │ -        │ -         │ -       │  L7   │ MANAGING_DIRECTOR │72 │
│  │ 8  │ -                  │ -        │ -         │ HIGH    │  L4   │ HEAD_OF_CREDIT    │12 │
│  │ 9  │ -                  │ CORPORATE│ SME       │ -       │  L4   │ HEAD_OF_CREDIT    │12 │
│  │10  │ -                  │ -        │ ISLAMIC   │ -       │  L3   │ ISLAMIC_BANKING   │ 8 │
│  └────┴────────────────────┴──────────┴───────────┴─────────┴───────┴───────────────────┴───┘
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 DMN XML Definition

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"
             xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
             xmlns:camunda="http://camunda.org/schema/1.0/dmn"
             id="ulms-approval-routing"
             name="ULMS Approval Level Routing"
             namespace="http://ulms.unisoft.com/dmn">

  <!-- Decision: Approval Level Routing -->
  <decision id="approval-level-routing" name="Determine Approval Level">
    <informationRequirement id="ir_loan_amount">
      <requiredInput href="#input_loan_amount"/>
    </informationRequirement>
    <informationRequirement id="ir_customer_type">
      <requiredInput href="#input_customer_type"/>
    </informationRequirement>
    <informationRequirement id="ir_product_category">
      <requiredInput href="#input_product_category"/>
    </informationRequirement>
    <informationRequirement id="ir_risk_grade">
      <requiredInput href="#input_risk_grade"/>
    </informationRequirement>

    <decisionTable id="dt_approval_level" hitPolicy="FIRST">

      <!-- INPUT: Loan Amount (BDT) -->
      <input id="input_amount" label="Loan Amount (BDT)">
        <inputExpression typeRef="number">
          <text>loanAmount</text>
        </inputExpression>
      </input>

      <!-- INPUT: Customer Type -->
      <input id="input_customer_type" label="Customer Type">
        <inputExpression typeRef="string">
          <text>customerType</text>
        </inputExpression>
        <inputValues>
          <text>"INDIVIDUAL","CORPORATE","SME","PROPRIETORSHIP"</text>
        </inputValues>
      </input>

      <!-- INPUT: Product Category -->
      <input id="input_product_category" label="Product Category">
        <inputExpression typeRef="string">
          <text>productCategory</text>
        </inputExpression>
        <inputValues>
          <text>"PERSONAL","HOME","AUTO","SME","CORPORATE","ISLAMIC","AGRICULTURE"</text>
        </inputValues>
      </input>

      <!-- INPUT: Risk Grade -->
      <input id="input_risk_grade" label="Risk Grade">
        <inputExpression typeRef="string">
          <text>riskGrade</text>
        </inputExpression>
        <inputValues>
          <text>"LOW","MEDIUM","HIGH","VERY_HIGH"</text>
        </inputValues>
      </input>

      <!-- OUTPUT: Approval Level -->
      <output id="output_level" label="Approval Level" name="approvalLevel" typeRef="integer">
        <outputValues>
          <text>1,2,3,4,5,6,7</text>
        </outputValues>
      </output>

      <!-- OUTPUT: Candidate Group -->
      <output id="output_group" label="Candidate Group" name="candidateGroup" typeRef="string"/>

      <!-- OUTPUT: SLA Hours -->
      <output id="output_sla" label="SLA Hours" name="slaHours" typeRef="integer"/>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- RULES -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->

      <!-- Rule 1: L1 - Branch Credit Head (up to 5 Lakh) -->
      <rule id="rule_L1">
        <description>Up to 5 Lakh - Branch Credit Head (4 hours SLA)</description>
        <inputEntry id="ie_L1_amount">
          <text><![CDATA[<= 500000]]></text>
        </inputEntry>
        <inputEntry id="ie_L1_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L1_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L1_risk">
          <text>not("HIGH","VERY_HIGH")</text>
        </inputEntry>
        <outputEntry id="oe_L1_level">
          <text>1</text>
        </outputEntry>
        <outputEntry id="oe_L1_group">
          <text>"BRANCH_CREDIT_HEAD"</text>
        </outputEntry>
        <outputEntry id="oe_L1_sla">
          <text>4</text>
        </outputEntry>
      </rule>

      <!-- Rule 2: L2 - Branch Manager (5 Lakh to 10 Lakh) -->
      <rule id="rule_L2">
        <description>5-10 Lakh - Branch Manager (6 hours SLA)</description>
        <inputEntry id="ie_L2_amount">
          <text><![CDATA[(500000..1000000]]]></text>
        </inputEntry>
        <inputEntry id="ie_L2_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L2_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L2_risk">
          <text>not("HIGH","VERY_HIGH")</text>
        </inputEntry>
        <outputEntry id="oe_L2_level">
          <text>2</text>
        </outputEntry>
        <outputEntry id="oe_L2_group">
          <text>"BRANCH_MANAGER"</text>
        </outputEntry>
        <outputEntry id="oe_L2_sla">
          <text>6</text>
        </outputEntry>
      </rule>

      <!-- Rule 3: L3 - Regional Manager (10 Lakh to 25 Lakh) -->
      <rule id="rule_L3">
        <description>10-25 Lakh - Regional Manager (8 hours SLA)</description>
        <inputEntry id="ie_L3_amount">
          <text><![CDATA[(1000000..2500000]]]></text>
        </inputEntry>
        <inputEntry id="ie_L3_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L3_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L3_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_L3_level">
          <text>3</text>
        </outputEntry>
        <outputEntry id="oe_L3_group">
          <text>"REGIONAL_MANAGER"</text>
        </outputEntry>
        <outputEntry id="oe_L3_sla">
          <text>8</text>
        </outputEntry>
      </rule>

      <!-- Rule 4: L4 - Head of Credit (25 Lakh to 1 Crore) -->
      <rule id="rule_L4">
        <description>25 Lakh - 1 Crore - Head of Credit (12 hours SLA)</description>
        <inputEntry id="ie_L4_amount">
          <text><![CDATA[(2500000..10000000]]]></text>
        </inputEntry>
        <inputEntry id="ie_L4_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L4_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L4_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_L4_level">
          <text>4</text>
        </outputEntry>
        <outputEntry id="oe_L4_group">
          <text>"HEAD_OF_CREDIT"</text>
        </outputEntry>
        <outputEntry id="oe_L4_sla">
          <text>12</text>
        </outputEntry>
      </rule>

      <!-- Rule 5: L5 - Credit Committee (1 Crore to 5 Crore) -->
      <rule id="rule_L5">
        <description>1-5 Crore - Credit Committee (24 hours SLA)</description>
        <inputEntry id="ie_L5_amount">
          <text><![CDATA[(10000000..50000000]]]></text>
        </inputEntry>
        <inputEntry id="ie_L5_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L5_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L5_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_L5_level">
          <text>5</text>
        </outputEntry>
        <outputEntry id="oe_L5_group">
          <text>"CREDIT_COMMITTEE"</text>
        </outputEntry>
        <outputEntry id="oe_L5_sla">
          <text>24</text>
        </outputEntry>
      </rule>

      <!-- Rule 6: L6 - Deputy MD (5 Crore to 10 Crore) -->
      <rule id="rule_L6">
        <description>5-10 Crore - Deputy MD (48 hours SLA)</description>
        <inputEntry id="ie_L6_amount">
          <text><![CDATA[(50000000..100000000]]]></text>
        </inputEntry>
        <inputEntry id="ie_L6_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L6_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L6_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_L6_level">
          <text>6</text>
        </outputEntry>
        <outputEntry id="oe_L6_group">
          <text>"DEPUTY_MD"</text>
        </outputEntry>
        <outputEntry id="oe_L6_sla">
          <text>48</text>
        </outputEntry>
      </rule>

      <!-- Rule 7: L7 - Managing Director (Above 10 Crore) -->
      <rule id="rule_L7">
        <description>Above 10 Crore - Managing Director (72 hours SLA)</description>
        <inputEntry id="ie_L7_amount">
          <text><![CDATA[> 100000000]]></text>
        </inputEntry>
        <inputEntry id="ie_L7_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L7_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_L7_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_L7_level">
          <text>7</text>
        </outputEntry>
        <outputEntry id="oe_L7_group">
          <text>"MANAGING_DIRECTOR"</text>
        </outputEntry>
        <outputEntry id="oe_L7_sla">
          <text>72</text>
        </outputEntry>
      </rule>

      <!-- Rule 8: High Risk Override - Force L4 minimum -->
      <rule id="rule_high_risk">
        <description>High Risk - Escalate to Head of Credit minimum</description>
        <inputEntry id="ie_hr_amount">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_hr_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_hr_product">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_hr_risk">
          <text>"HIGH","VERY_HIGH"</text>
        </inputEntry>
        <outputEntry id="oe_hr_level">
          <text>4</text>
        </outputEntry>
        <outputEntry id="oe_hr_group">
          <text>"HEAD_OF_CREDIT"</text>
        </outputEntry>
        <outputEntry id="oe_hr_sla">
          <text>12</text>
        </outputEntry>
      </rule>

      <!-- Rule 9: Corporate SME - Minimum L4 -->
      <rule id="rule_corporate_sme">
        <description>Corporate SME - Head of Credit minimum</description>
        <inputEntry id="ie_corp_amount">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_corp_customer">
          <text>"CORPORATE"</text>
        </inputEntry>
        <inputEntry id="ie_corp_product">
          <text>"SME"</text>
        </inputEntry>
        <inputEntry id="ie_corp_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_corp_level">
          <text>4</text>
        </outputEntry>
        <outputEntry id="oe_corp_group">
          <text>"HEAD_OF_CREDIT"</text>
        </outputEntry>
        <outputEntry id="oe_corp_sla">
          <text>12</text>
        </outputEntry>
      </rule>

      <!-- Rule 10: Islamic Products - Special Routing -->
      <rule id="rule_islamic">
        <description>Islamic Products - Islamic Banking Committee</description>
        <inputEntry id="ie_isl_amount">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_isl_customer">
          <text></text>
        </inputEntry>
        <inputEntry id="ie_isl_product">
          <text>"ISLAMIC"</text>
        </inputEntry>
        <inputEntry id="ie_isl_risk">
          <text></text>
        </inputEntry>
        <outputEntry id="oe_isl_level">
          <text>3</text>
        </outputEntry>
        <outputEntry id="oe_isl_group">
          <text>"ISLAMIC_BANKING_COMMITTEE"</text>
        </outputEntry>
        <outputEntry id="oe_isl_sla">
          <text>8</text>
        </outputEntry>
      </rule>

    </decisionTable>
  </decision>

  <!-- Input Data Definitions -->
  <inputData id="input_loan_amount" name="Loan Amount">
    <variable name="loanAmount" typeRef="number"/>
  </inputData>

  <inputData id="input_customer_type" name="Customer Type">
    <variable name="customerType" typeRef="string"/>
  </inputData>

  <inputData id="input_product_category" name="Product Category">
    <variable name="productCategory" typeRef="string"/>
  </inputData>

  <inputData id="input_risk_grade" name="Risk Grade">
    <variable name="riskGrade" typeRef="string"/>
  </inputData>

</definitions>
```

### 4.3 Visual Decision Table

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    APPROVAL LEVEL ROUTING DECISION TABLE (VISUAL)                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Hit Policy: FIRST (F) - First matching rule wins                                                    │
│                                                                                                      │
│  ┌──────┬──────────────────────┬─────────────┬─────────────┬─────────────┬───────┬─────────────────┬─────┐
│  │ Rule │ Loan Amount (BDT)    │ Customer    │ Product     │ Risk Grade  │ Level │ Candidate Group │ SLA │
│  │      │                      │ Type        │ Category    │             │       │                 │(hrs)│
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  1   │ ≤ 5,00,000           │ -           │ -           │ NOT HIGH    │  L1   │ BRANCH_CREDIT   │  4  │
│  │      │ (≤ 5 Lakh)           │             │             │             │       │ _HEAD           │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  2   │ 5,00,001 - 10,00,000 │ -           │ -           │ NOT HIGH    │  L2   │ BRANCH_MANAGER  │  6  │
│  │      │ (5-10 Lakh)          │             │             │             │       │                 │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  3   │ 10,00,001 - 25,00,000│ -           │ -           │ -           │  L3   │ REGIONAL        │  8  │
│  │      │ (10-25 Lakh)         │             │             │             │       │ _MANAGER        │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  4   │ 25,00,001 - 1,00,00,000│ -         │ -           │ -           │  L4   │ HEAD_OF_CREDIT  │ 12  │
│  │      │ (25 Lakh - 1 Crore)  │             │             │             │       │                 │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  5   │ 1,00,00,001 - 5,00,00,000│ -       │ -           │ -           │  L5   │ CREDIT          │ 24  │
│  │      │ (1-5 Crore)          │             │             │             │       │ _COMMITTEE      │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  6   │ 5,00,00,001 - 10,00,00,000│ -      │ -           │ -           │  L6   │ DEPUTY_MD       │ 48  │
│  │      │ (5-10 Crore)         │             │             │             │       │                 │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  7   │ > 10,00,00,000       │ -           │ -           │ -           │  L7   │ MANAGING        │ 72  │
│  │      │ (> 10 Crore)         │             │             │             │       │ _DIRECTOR       │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  8   │ -                    │ -           │ -           │ HIGH,       │  L4   │ HEAD_OF_CREDIT  │ 12  │
│  │      │ (Override)           │             │             │ VERY_HIGH   │       │                 │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │  9   │ -                    │ CORPORATE   │ SME         │ -           │  L4   │ HEAD_OF_CREDIT  │ 12  │
│  │      │ (Corporate SME)      │             │             │             │       │                 │     │
│  ├──────┼──────────────────────┼─────────────┼─────────────┼─────────────┼───────┼─────────────────┼─────┤
│  │ 10   │ -                    │ -           │ ISLAMIC     │ -           │  L3   │ ISLAMIC_BANKING │  8  │
│  │      │ (Islamic Products)   │             │             │             │       │ _COMMITTEE      │     │
│  └──────┴──────────────────────┴─────────────┴─────────────┴─────────────┴───────┴─────────────────┴─────┘
│                                                                                                      │
│  Legend: - = Any value (don't care)                                                                 │
│          L = Lakh (1,00,000), Cr = Crore (1,00,00,000)                                             │
│                                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Risk-Based Escalation Rules

### 5.1 Decision Table Definition

```xml
<!-- Decision: Risk-Based Escalation -->
<decision id="risk-escalation" name="Risk-Based Escalation Rules">
  <decisionTable id="dt_risk_escalation" hitPolicy="FIRST">

    <!-- INPUT: CIB Score -->
    <input id="input_cib_score" label="CIB Score">
      <inputExpression typeRef="integer">
        <text>cibScore</text>
      </inputExpression>
    </input>

    <!-- INPUT: Existing DPD (Days Past Due) -->
    <input id="input_existing_dpd" label="Existing DPD">
      <inputExpression typeRef="integer">
        <text>existingDPD</text>
      </inputExpression>
    </input>

    <!-- INPUT: DBR Percentage (Debt Burden Ratio) -->
    <input id="input_dbr" label="DBR Percentage">
      <inputExpression typeRef="number">
        <text>dbrPercentage</text>
      </inputExpression>
    </input>

    <!-- OUTPUT: Escalate Levels -->
    <output id="output_escalate" label="Escalate Levels" name="escalateLevels" typeRef="integer"/>

    <!-- OUTPUT: Risk Grade -->
    <output id="output_risk_grade" label="Risk Grade" name="riskGrade" typeRef="string"/>

    <!-- Rule 1: Very High Risk - CIB Score < 400 -->
    <rule id="rule_very_high_cib">
      <description>Very High Risk: CIB Score below 400 - Escalate 3 levels</description>
      <inputEntry><text><![CDATA[< 400]]></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>3</text></outputEntry>
      <outputEntry><text>"VERY_HIGH"</text></outputEntry>
    </rule>

    <!-- Rule 2: High Risk - CIB Score < 500 -->
    <rule id="rule_high_cib">
      <description>High Risk: CIB Score 400-499 - Escalate 2 levels</description>
      <inputEntry><text><![CDATA[[400..500)]]></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>2</text></outputEntry>
      <outputEntry><text>"HIGH"</text></outputEntry>
    </rule>

    <!-- Rule 3: High Risk - Existing DPD > 30 days -->
    <rule id="rule_high_dpd">
      <description>High Risk: Existing DPD > 30 days - Escalate 2 levels</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text><![CDATA[> 30]]></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>2</text></outputEntry>
      <outputEntry><text>"HIGH"</text></outputEntry>
    </rule>

    <!-- Rule 4: Medium Risk - DBR > 50% -->
    <rule id="rule_medium_dbr">
      <description>Medium Risk: DBR > 50% - Escalate 1 level</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text><![CDATA[> 50]]></text></inputEntry>
      <outputEntry><text>1</text></outputEntry>
      <outputEntry><text>"MEDIUM"</text></outputEntry>
    </rule>

    <!-- Rule 5: Medium Risk - Existing DPD 1-30 days -->
    <rule id="rule_medium_dpd">
      <description>Medium Risk: Existing DPD 1-30 days - Escalate 1 level</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text><![CDATA[[1..30]]]></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>1</text></outputEntry>
      <outputEntry><text>"MEDIUM"</text></outputEntry>
    </rule>

    <!-- Rule 6: Low Risk - Default -->
    <rule id="rule_low_risk">
      <description>Low Risk: No escalation required</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>0</text></outputEntry>
      <outputEntry><text>"LOW"</text></outputEntry>
    </rule>

  </decisionTable>
</decision>
```

### 5.2 Risk Escalation Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    RISK-BASED ESCALATION MATRIX                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────┬─────────────────┬────────────────┬─────────────────┬───────────┬─────────┐
│  │ Rule │ CIB Score       │ Existing DPD   │ DBR %           │ Escalate  │ Risk    │
│  │      │                 │ (days)         │                 │ Levels    │ Grade   │
│  ├──────┼─────────────────┼────────────────┼─────────────────┼───────────┼─────────┤
│  │  1   │ < 400           │ -              │ -               │ +3        │ VERY_   │
│  │      │                 │                │                 │           │ HIGH    │
│  ├──────┼─────────────────┼────────────────┼─────────────────┼───────────┼─────────┤
│  │  2   │ 400 - 499       │ -              │ -               │ +2        │ HIGH    │
│  ├──────┼─────────────────┼────────────────┼─────────────────┼───────────┼─────────┤
│  │  3   │ -               │ > 30           │ -               │ +2        │ HIGH    │
│  ├──────┼─────────────────┼────────────────┼─────────────────┼───────────┼─────────┤
│  │  4   │ -               │ -              │ > 50%           │ +1        │ MEDIUM  │
│  ├──────┼─────────────────┼────────────────┼─────────────────┼───────────┼─────────┤
│  │  5   │ -               │ 1 - 30         │ -               │ +1        │ MEDIUM  │
│  ├──────┼─────────────────┼────────────────┼─────────────────┼───────────┼─────────┤
│  │  6   │ ≥ 500           │ 0              │ ≤ 50%           │ 0         │ LOW     │
│  │      │ (default)       │                │                 │           │         │
│  └──────┴─────────────────┴────────────────┴─────────────────┴───────────┴─────────┘
│                                                                                      │
│  ESCALATION CALCULATION EXAMPLE:                                                    │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Base Level (from amount): L2 (Branch Manager)                                      │
│  Risk Factor: CIB Score = 450 → Escalate +2                                         │
│  Final Level: L2 + 2 = L4 (Head of Credit)                                         │
│                                                                                      │
│  Note: Maximum escalation capped at L7 (Managing Director)                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Product-Based Routing Decision Table

### 6.1 Decision Table Definition

```xml
<!-- Decision: Product-Based Routing -->
<decision id="product-routing" name="Product-Based Routing Rules">
  <decisionTable id="dt_product_routing" hitPolicy="FIRST">

    <!-- INPUT: Product Category -->
    <input id="input_prod_category" label="Product Category">
      <inputExpression typeRef="string">
        <text>productCategory</text>
      </inputExpression>
    </input>

    <!-- INPUT: Is Islamic Product -->
    <input id="input_is_islamic" label="Is Islamic">
      <inputExpression typeRef="boolean">
        <text>isIslamic</text>
      </inputExpression>
    </input>

    <!-- INPUT: Loan Amount -->
    <input id="input_prod_amount" label="Loan Amount">
      <inputExpression typeRef="number">
        <text>loanAmount</text>
      </inputExpression>
    </input>

    <!-- OUTPUT: Routing Path -->
    <output id="output_routing" label="Routing Path" name="routingPath" typeRef="string"/>

    <!-- OUTPUT: Special Approval Required -->
    <output id="output_special" label="Special Approval" name="specialApproval" typeRef="boolean"/>

    <!-- Rule 1: Islamic Products - Route to Islamic Banking Committee -->
    <rule id="rule_islamic_prod">
      <inputEntry><text></text></inputEntry>
      <inputEntry><text>true</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>"ISLAMIC_BANKING"</text></outputEntry>
      <outputEntry><text>true</text></outputEntry>
    </rule>

    <!-- Rule 2: Corporate Loans > 5 Crore - Special Route -->
    <rule id="rule_corporate_large">
      <inputEntry><text>"CORPORATE"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text><![CDATA[> 50000000]]></text></inputEntry>
      <outputEntry><text>"CORPORATE_CREDIT"</text></outputEntry>
      <outputEntry><text>true</text></outputEntry>
    </rule>

    <!-- Rule 3: SME Loans -->
    <rule id="rule_sme">
      <inputEntry><text>"SME"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>"SME_CREDIT"</text></outputEntry>
      <outputEntry><text>false</text></outputEntry>
    </rule>

    <!-- Rule 4: Agriculture Loans - Special Subsidy Check -->
    <rule id="rule_agriculture">
      <inputEntry><text>"AGRICULTURE"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>"AGRICULTURE_CREDIT"</text></outputEntry>
      <outputEntry><text>true</text></outputEntry>
    </rule>

    <!-- Rule 5: Home Loans > 50 Lakh - Property Valuation Required -->
    <rule id="rule_home_large">
      <inputEntry><text>"HOME"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text><![CDATA[> 5000000]]></text></inputEntry>
      <outputEntry><text>"HOME_LOAN_SENIOR"</text></outputEntry>
      <outputEntry><text>true</text></outputEntry>
    </rule>

    <!-- Rule 6: Default Retail Route -->
    <rule id="rule_default_retail">
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>"RETAIL_CREDIT"</text></outputEntry>
      <outputEntry><text>false</text></outputEntry>
    </rule>

  </decisionTable>
</decision>
```

---

## 7. Auto-Approval Eligibility Decision Table

### 7.1 Decision Table Definition

```xml
<!-- Decision: Auto-Approval Eligibility -->
<decision id="auto-approval-eligibility" name="Auto-Approval Eligibility Check">
  <decisionTable id="dt_auto_approval" hitPolicy="UNIQUE">

    <!-- INPUT: Customer Type -->
    <input id="input_aa_customer" label="Customer Type">
      <inputExpression typeRef="string">
        <text>customerType</text>
      </inputExpression>
    </input>

    <!-- INPUT: Credit Score -->
    <input id="input_aa_score" label="Credit Score">
      <inputExpression typeRef="integer">
        <text>creditScore</text>
      </inputExpression>
    </input>

    <!-- INPUT: Existing Relationship (months) -->
    <input id="input_aa_relationship" label="Relationship Months">
      <inputExpression typeRef="integer">
        <text>relationshipMonths</text>
      </inputExpression>
    </input>

    <!-- INPUT: Loan Amount -->
    <input id="input_aa_amount" label="Loan Amount">
      <inputExpression typeRef="number">
        <text>loanAmount</text>
      </inputExpression>
    </input>

    <!-- OUTPUT: Is Eligible for Auto-Approval -->
    <output id="output_aa_eligible" label="Is Eligible" name="isEligible" typeRef="boolean"/>

    <!-- OUTPUT: Maximum Auto-Approval Amount -->
    <output id="output_aa_max" label="Max Auto Amount" name="maxAutoAmount" typeRef="number"/>

    <!-- Rule 1: Premium Individual - High Score, Long Relationship -->
    <rule id="rule_aa_premium">
      <description>Premium customer: Score ≥ 850, 36+ months relationship</description>
      <inputEntry><text>"INDIVIDUAL"</text></inputEntry>
      <inputEntry><text><![CDATA[>= 850]]></text></inputEntry>
      <inputEntry><text><![CDATA[>= 36]]></text></inputEntry>
      <inputEntry><text><![CDATA[<= 500000]]></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>500000</text></outputEntry>
    </rule>

    <!-- Rule 2: Good Individual - Score ≥ 750, 24+ months -->
    <rule id="rule_aa_good">
      <description>Good customer: Score ≥ 750, 24+ months relationship</description>
      <inputEntry><text>"INDIVIDUAL"</text></inputEntry>
      <inputEntry><text><![CDATA[[750..850)]]></text></inputEntry>
      <inputEntry><text><![CDATA[>= 24]]></text></inputEntry>
      <inputEntry><text><![CDATA[<= 300000]]></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>300000</text></outputEntry>
    </rule>

    <!-- Rule 3: Standard Individual - Score ≥ 650, 12+ months -->
    <rule id="rule_aa_standard">
      <description>Standard customer: Score ≥ 650, 12+ months relationship</description>
      <inputEntry><text>"INDIVIDUAL"</text></inputEntry>
      <inputEntry><text><![CDATA[[650..750)]]></text></inputEntry>
      <inputEntry><text><![CDATA[>= 12]]></text></inputEntry>
      <inputEntry><text><![CDATA[<= 100000]]></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>100000</text></outputEntry>
    </rule>

    <!-- Rule 4: Not Eligible - Default -->
    <rule id="rule_aa_not_eligible">
      <description>Not eligible for auto-approval</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>false</text></outputEntry>
      <outputEntry><text>0</text></outputEntry>
    </rule>

  </decisionTable>
</decision>
```

### 7.2 Auto-Approval Eligibility Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    AUTO-APPROVAL ELIGIBILITY MATRIX                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────┬─────────────┬───────────────┬──────────────┬─────────────┬──────────┬────────┐
│  │ Rule │ Customer    │ Credit Score  │ Relationship │ Max Loan    │ Eligible │ Max    │
│  │      │ Type        │               │ (months)     │ Amount      │          │ Amount │
│  ├──────┼─────────────┼───────────────┼──────────────┼─────────────┼──────────┼────────┤
│  │  1   │ INDIVIDUAL  │ ≥ 850         │ ≥ 36         │ ≤ 5,00,000  │ YES      │5,00,000│
│  │      │ (Premium)   │ (Excellent)   │ (3+ years)   │ (5 Lakh)    │          │        │
│  ├──────┼─────────────┼───────────────┼──────────────┼─────────────┼──────────┼────────┤
│  │  2   │ INDIVIDUAL  │ 750 - 849     │ ≥ 24         │ ≤ 3,00,000  │ YES      │3,00,000│
│  │      │ (Good)      │ (Very Good)   │ (2+ years)   │ (3 Lakh)    │          │        │
│  ├──────┼─────────────┼───────────────┼──────────────┼─────────────┼──────────┼────────┤
│  │  3   │ INDIVIDUAL  │ 650 - 749     │ ≥ 12         │ ≤ 1,00,000  │ YES      │1,00,000│
│  │      │ (Standard)  │ (Good)        │ (1+ year)    │ (1 Lakh)    │          │        │
│  ├──────┼─────────────┼───────────────┼──────────────┼─────────────┼──────────┼────────┤
│  │  4   │ -           │ < 650 or      │ < 12 or      │ -           │ NO       │ 0      │
│  │      │ (Default)   │ not assessed  │ new customer │             │          │        │
│  └──────┴─────────────┴───────────────┴──────────────┴─────────────┴──────────┴────────┘
│                                                                                          │
│  Notes:                                                                                  │
│  - Corporate and SME customers are NOT eligible for auto-approval                       │
│  - Auto-approval bypasses L1 and routes directly to disbursement preparation            │
│  - All auto-approvals are logged and audited                                            │
│  - Maximum 10% of monthly disbursements can be auto-approved (regulatory limit)         │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. SLA Determination Decision Table

### 8.1 Decision Table Definition

```xml
<!-- Decision: SLA Determination -->
<decision id="sla-determination" name="SLA Hours Determination">
  <decisionTable id="dt_sla" hitPolicy="UNIQUE">

    <!-- INPUT: Approval Level -->
    <input id="input_sla_level" label="Approval Level">
      <inputExpression typeRef="integer">
        <text>approvalLevel</text>
      </inputExpression>
    </input>

    <!-- INPUT: Priority -->
    <input id="input_sla_priority" label="Priority">
      <inputExpression typeRef="string">
        <text>priority</text>
      </inputExpression>
    </input>

    <!-- INPUT: Product Category -->
    <input id="input_sla_product" label="Product Category">
      <inputExpression typeRef="string">
        <text>productCategory</text>
      </inputExpression>
    </input>

    <!-- OUTPUT: SLA Hours -->
    <output id="output_sla_hours" label="SLA Hours" name="slaHours" typeRef="integer"/>

    <!-- OUTPUT: Escalation Hours -->
    <output id="output_escalation" label="Escalation Hours" name="escalationHours" typeRef="integer"/>

    <!-- L1 Rules -->
    <rule id="rule_sla_L1_urgent">
      <inputEntry><text>1</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>2</text></outputEntry>
      <outputEntry><text>3</text></outputEntry>
    </rule>

    <rule id="rule_sla_L1_normal">
      <inputEntry><text>1</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>4</text></outputEntry>
      <outputEntry><text>6</text></outputEntry>
    </rule>

    <!-- L2 Rules -->
    <rule id="rule_sla_L2_urgent">
      <inputEntry><text>2</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>3</text></outputEntry>
      <outputEntry><text>4</text></outputEntry>
    </rule>

    <rule id="rule_sla_L2_normal">
      <inputEntry><text>2</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>6</text></outputEntry>
      <outputEntry><text>8</text></outputEntry>
    </rule>

    <!-- L3 Rules -->
    <rule id="rule_sla_L3_urgent">
      <inputEntry><text>3</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>4</text></outputEntry>
      <outputEntry><text>6</text></outputEntry>
    </rule>

    <rule id="rule_sla_L3_normal">
      <inputEntry><text>3</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>8</text></outputEntry>
      <outputEntry><text>12</text></outputEntry>
    </rule>

    <!-- L4 Rules -->
    <rule id="rule_sla_L4_urgent">
      <inputEntry><text>4</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>6</text></outputEntry>
      <outputEntry><text>9</text></outputEntry>
    </rule>

    <rule id="rule_sla_L4_normal">
      <inputEntry><text>4</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>12</text></outputEntry>
      <outputEntry><text>18</text></outputEntry>
    </rule>

    <!-- L5 Rules -->
    <rule id="rule_sla_L5_urgent">
      <inputEntry><text>5</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>12</text></outputEntry>
      <outputEntry><text>18</text></outputEntry>
    </rule>

    <rule id="rule_sla_L5_normal">
      <inputEntry><text>5</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>24</text></outputEntry>
      <outputEntry><text>36</text></outputEntry>
    </rule>

    <!-- L6 Rules -->
    <rule id="rule_sla_L6_urgent">
      <inputEntry><text>6</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>24</text></outputEntry>
      <outputEntry><text>36</text></outputEntry>
    </rule>

    <rule id="rule_sla_L6_normal">
      <inputEntry><text>6</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>48</text></outputEntry>
      <outputEntry><text>72</text></outputEntry>
    </rule>

    <!-- L7 Rules -->
    <rule id="rule_sla_L7_urgent">
      <inputEntry><text>7</text></inputEntry>
      <inputEntry><text>"URGENT"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>48</text></outputEntry>
      <outputEntry><text>72</text></outputEntry>
    </rule>

    <rule id="rule_sla_L7_normal">
      <inputEntry><text>7</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>72</text></outputEntry>
      <outputEntry><text>96</text></outputEntry>
    </rule>

  </decisionTable>
</decision>
```

### 8.2 SLA Summary Table

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SLA DETERMINATION SUMMARY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────┬────────────────────┬─────────────┬───────────────┬─────────────┐ │
│  │ Level │ Role               │ Normal SLA  │ Urgent SLA    │ Escalation  │ │
│  │       │                    │ (hours)     │ (hours)       │ After (hrs) │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L1   │ Branch Credit Head │     4       │      2        │     6       │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L2   │ Branch Manager     │     6       │      3        │     8       │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L3   │ Regional Manager   │     8       │      4        │    12       │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L4   │ Head of Credit     │    12       │      6        │    18       │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L5   │ Credit Committee   │    24       │     12        │    36       │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L6   │ Deputy MD          │    48       │     24        │    72       │ │
│  ├───────┼────────────────────┼─────────────┼───────────────┼─────────────┤ │
│  │  L7   │ Managing Director  │    72       │     48        │    96       │ │
│  └───────┴────────────────────┴─────────────┴───────────────┴─────────────┘ │
│                                                                              │
│  Notes:                                                                      │
│  - Urgent priority reduces SLA by 50%                                       │
│  - Escalation triggers notification to next level authority                 │
│  - SLA breach is recorded in audit log                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Collateral Requirement Decision Table

### 9.1 Decision Table Definition

```xml
<!-- Decision: Collateral Requirement -->
<decision id="collateral-requirement" name="Collateral Requirement Rules">
  <decisionTable id="dt_collateral" hitPolicy="FIRST">

    <!-- INPUT: Product Category -->
    <input id="input_coll_product" label="Product Category">
      <inputExpression typeRef="string">
        <text>productCategory</text>
      </inputExpression>
    </input>

    <!-- INPUT: Loan Amount -->
    <input id="input_coll_amount" label="Loan Amount">
      <inputExpression typeRef="number">
        <text>loanAmount</text>
      </inputExpression>
    </input>

    <!-- INPUT: Risk Grade -->
    <input id="input_coll_risk" label="Risk Grade">
      <inputExpression typeRef="string">
        <text>riskGrade</text>
      </inputExpression>
    </input>

    <!-- OUTPUT: Requires Collateral -->
    <output id="output_coll_required" label="Requires Collateral" name="requiresCollateral" typeRef="boolean"/>

    <!-- OUTPUT: Minimum Coverage -->
    <output id="output_coll_coverage" label="Min Coverage %" name="minCoverage" typeRef="integer"/>

    <!-- Rule 1: Home Loans - Always require collateral -->
    <rule id="rule_coll_home">
      <description>Home Loans always require property collateral</description>
      <inputEntry><text>"HOME"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>120</text></outputEntry>
    </rule>

    <!-- Rule 2: Auto Loans - Vehicle as collateral -->
    <rule id="rule_coll_auto">
      <description>Auto Loans - Vehicle hypothecation</description>
      <inputEntry><text>"AUTO"</text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>100</text></outputEntry>
    </rule>

    <!-- Rule 3: SME/Corporate > 25 Lakh - Requires collateral -->
    <rule id="rule_coll_sme_large">
      <description>Large SME/Corporate loans require collateral</description>
      <inputEntry><text>"SME","CORPORATE"</text></inputEntry>
      <inputEntry><text><![CDATA[> 2500000]]></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>125</text></outputEntry>
    </rule>

    <!-- Rule 4: High Risk - Requires collateral regardless of amount -->
    <rule id="rule_coll_high_risk">
      <description>High risk loans require collateral</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text><![CDATA[> 500000]]></text></inputEntry>
      <inputEntry><text>"HIGH","VERY_HIGH"</text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>150</text></outputEntry>
    </rule>

    <!-- Rule 5: Personal Loans > 10 Lakh -->
    <rule id="rule_coll_personal_large">
      <description>Large personal loans may require collateral</description>
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text><![CDATA[> 1000000]]></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>true</text></outputEntry>
      <outputEntry><text>100</text></outputEntry>
    </rule>

    <!-- Rule 6: Default - No collateral required -->
    <rule id="rule_coll_default">
      <description>Small personal loans - unsecured</description>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <inputEntry><text></text></inputEntry>
      <outputEntry><text>false</text></outputEntry>
      <outputEntry><text>0</text></outputEntry>
    </rule>

  </decisionTable>
</decision>
```

---

## 10. Implementation Guidelines

### 10.1 Camunda Integration

```java
package com.ulms.workflow.dmn.service;

import org.camunda.bpm.engine.DecisionService;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DmnDecisionService {

    private final DecisionService decisionService;

    /**
     * Determine approval level for a loan application
     */
    public ApprovalLevelResult determineApprovalLevel(LoanApplication application) {
        VariableMap variables = Variables.createVariables()
            .putValue("loanAmount", application.getProposedPrincipal())
            .putValue("customerType", application.getCustomerType())
            .putValue("productCategory", application.getProductCategory())
            .putValue("riskGrade", application.getRiskGrade());

        DmnDecisionTableResult result = decisionService
            .evaluateDecisionTableByKey("approval-level-routing", variables);

        if (result.isEmpty()) {
            log.error("No matching rule for loan application: {}", application.getId());
            throw new DecisionEvaluationException("No matching approval level rule");
        }

        return ApprovalLevelResult.builder()
            .approvalLevel(result.getSingleResult().getEntry("approvalLevel"))
            .candidateGroup(result.getSingleResult().getEntry("candidateGroup"))
            .slaHours(result.getSingleResult().getEntry("slaHours"))
            .build();
    }

    /**
     * Check risk-based escalation
     */
    public RiskEscalationResult checkRiskEscalation(CIBResult cibResult, BigDecimal dbr) {
        VariableMap variables = Variables.createVariables()
            .putValue("cibScore", cibResult.getScore())
            .putValue("existingDPD", cibResult.getMaxDPD())
            .putValue("dbrPercentage", dbr);

        DmnDecisionTableResult result = decisionService
            .evaluateDecisionTableByKey("risk-escalation", variables);

        return RiskEscalationResult.builder()
            .escalateLevels(result.getSingleResult().getEntry("escalateLevels"))
            .riskGrade(result.getSingleResult().getEntry("riskGrade"))
            .build();
    }

    /**
     * Check auto-approval eligibility
     */
    public AutoApprovalResult checkAutoApprovalEligibility(Customer customer,
                                                           BigDecimal loanAmount) {
        VariableMap variables = Variables.createVariables()
            .putValue("customerType", customer.getCustomerType())
            .putValue("creditScore", customer.getCreditScore())
            .putValue("relationshipMonths", customer.getRelationshipMonths())
            .putValue("loanAmount", loanAmount);

        DmnDecisionTableResult result = decisionService
            .evaluateDecisionTableByKey("auto-approval-eligibility", variables);

        return AutoApprovalResult.builder()
            .isEligible(result.getSingleResult().getEntry("isEligible"))
            .maxAutoAmount(result.getSingleResult().getEntry("maxAutoAmount"))
            .build();
    }
}
```

### 10.2 BPMN Integration with Business Rule Task

```xml
<!-- BPMN snippet showing DMN integration -->
<bpmn:businessRuleTask id="determineApprovalLevel"
                       name="Determine Approval Level"
                       camunda:decisionRef="approval-level-routing"
                       camunda:mapDecisionResult="singleResult"
                       camunda:resultVariable="routingResult">
  <bpmn:incoming>flow_from_review</bpmn:incoming>
  <bpmn:outgoing>flow_to_gateway</bpmn:outgoing>
</bpmn:businessRuleTask>

<!-- Gateway using DMN result -->
<bpmn:exclusiveGateway id="levelGateway" name="Route by Level">
  <bpmn:incoming>flow_to_gateway</bpmn:incoming>
  <bpmn:outgoing>flow_to_L1</bpmn:outgoing>
  <bpmn:outgoing>flow_to_L2</bpmn:outgoing>
  <!-- ... more flows -->
</bpmn:exclusiveGateway>

<bpmn:sequenceFlow id="flow_to_L1" sourceRef="levelGateway" targetRef="L1_Approval">
  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
    ${routingResult.approvalLevel == 1}
  </bpmn:conditionExpression>
</bpmn:sequenceFlow>
```

---

## 11. Testing and Validation

### 11.1 Test Cases for Approval Level Routing

```java
package com.ulms.workflow.dmn.test;

import org.camunda.bpm.dmn.engine.test.DmnEngineRule;
import org.junit.Rule;
import org.junit.Test;
import static org.assertj.core.api.Assertions.*;

public class ApprovalLevelRoutingTest {

    @Rule
    public DmnEngineRule dmnEngineRule = new DmnEngineRule();

    @Test
    public void testL1_BranchCreditHead_UpTo5Lakh() {
        DmnDecisionTableResult result = dmnEngineRule.getDecisionService()
            .evaluateDecisionByKey("approval-level-routing")
            .variables()
            .putValue("loanAmount", 300000)
            .putValue("customerType", "INDIVIDUAL")
            .putValue("productCategory", "PERSONAL")
            .putValue("riskGrade", "LOW")
            .evaluate();

        assertThat(result.getSingleResult().getEntry("approvalLevel")).isEqualTo(1);
        assertThat(result.getSingleResult().getEntry("candidateGroup"))
            .isEqualTo("BRANCH_CREDIT_HEAD");
        assertThat(result.getSingleResult().getEntry("slaHours")).isEqualTo(4);
    }

    @Test
    public void testL4_HeadOfCredit_HighRiskOverride() {
        DmnDecisionTableResult result = dmnEngineRule.getDecisionService()
            .evaluateDecisionByKey("approval-level-routing")
            .variables()
            .putValue("loanAmount", 300000)  // Within L1 limit
            .putValue("customerType", "INDIVIDUAL")
            .putValue("productCategory", "PERSONAL")
            .putValue("riskGrade", "HIGH")   // High risk override
            .evaluate();

        // Should escalate to L4 despite small amount
        assertThat(result.getSingleResult().getEntry("approvalLevel")).isEqualTo(4);
        assertThat(result.getSingleResult().getEntry("candidateGroup"))
            .isEqualTo("HEAD_OF_CREDIT");
    }

    @Test
    public void testL7_ManagingDirector_Above10Crore() {
        DmnDecisionTableResult result = dmnEngineRule.getDecisionService()
            .evaluateDecisionByKey("approval-level-routing")
            .variables()
            .putValue("loanAmount", 150000000)  // 15 Crore
            .putValue("customerType", "CORPORATE")
            .putValue("productCategory", "CORPORATE")
            .putValue("riskGrade", "LOW")
            .evaluate();

        assertThat(result.getSingleResult().getEntry("approvalLevel")).isEqualTo(7);
        assertThat(result.getSingleResult().getEntry("candidateGroup"))
            .isEqualTo("MANAGING_DIRECTOR");
        assertThat(result.getSingleResult().getEntry("slaHours")).isEqualTo(72);
    }

    @Test
    public void testIslamicProduct_SpecialRouting() {
        DmnDecisionTableResult result = dmnEngineRule.getDecisionService()
            .evaluateDecisionByKey("approval-level-routing")
            .variables()
            .putValue("loanAmount", 500000)
            .putValue("customerType", "INDIVIDUAL")
            .putValue("productCategory", "ISLAMIC")
            .putValue("riskGrade", "LOW")
            .evaluate();

        assertThat(result.getSingleResult().getEntry("candidateGroup"))
            .isEqualTo("ISLAMIC_BANKING_COMMITTEE");
    }
}
```

### 11.2 Test Data Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DMN TEST SCENARIOS                                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│  Test ID │ Loan Amount │ Customer │ Product  │ Risk Grade │ Expected  │ Expected Group │ SLA      │
│          │ (BDT)       │ Type     │ Category │            │ Level     │                │ (hours)  │
│  ────────┼─────────────┼──────────┼──────────┼────────────┼───────────┼────────────────┼──────────│
│  TC-001  │ 3,00,000    │ INDIVIDUAL│ PERSONAL │ LOW        │ L1        │ BRANCH_CREDIT  │ 4        │
│  TC-002  │ 7,50,000    │ INDIVIDUAL│ PERSONAL │ LOW        │ L2        │ BRANCH_MANAGER │ 6        │
│  TC-003  │ 20,00,000   │ INDIVIDUAL│ HOME     │ MEDIUM     │ L3        │ REGIONAL_MGR   │ 8        │
│  TC-004  │ 75,00,000   │ SME      │ SME      │ LOW        │ L4        │ HEAD_OF_CREDIT │ 12       │
│  TC-005  │ 3,00,00,000 │ CORPORATE│ CORPORATE│ LOW        │ L5        │ CREDIT_COMM    │ 24       │
│  TC-006  │ 8,00,00,000 │ CORPORATE│ CORPORATE│ LOW        │ L6        │ DEPUTY_MD      │ 48       │
│  TC-007  │ 15,00,00,000│ CORPORATE│ CORPORATE│ LOW        │ L7        │ MANAGING_DIR   │ 72       │
│  TC-008  │ 3,00,000    │ INDIVIDUAL│ PERSONAL │ HIGH       │ L4        │ HEAD_OF_CREDIT │ 12       │
│  TC-009  │ 5,00,000    │ INDIVIDUAL│ ISLAMIC  │ LOW        │ L3        │ ISLAMIC_BANK   │ 8        │
│  TC-010  │ 1,00,00,000 │ CORPORATE│ SME      │ MEDIUM     │ L4        │ HEAD_OF_CREDIT │ 12       │
│                                                                                                     │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Compliance Matrix

### 12.1 Regulatory Compliance

| Requirement | Regulation | DMN Table | Implementation |
|-------------|------------|-----------|----------------|
| 7-level approval | BRD 6.3.1 | approval-level-routing | Rules 1-7 |
| Amount-based routing | SRS 3.3.2 | approval-level-routing | Amount input |
| Risk escalation | BRD 6.3.3 | risk-escalation | Risk grade rules |
| SLA management | BRD 6.3.2 | sla-determination | SLA output |
| Collateral requirements | BRD 6.5 | collateral-requirement | Coverage rules |

### 12.2 Document References

| Reference Document | Location | Relevant Sections |
|-------------------|----------|-------------------|
| RBAC Authorization Matrix | Phase_1/Security Architecture/ | Section 3 - Approval Levels |
| Workflow State Machine | Phase_1/Workflow Architecture/ | Section 3 - Routing |
| BRD | Root directory | Section 6.3 - Approval Matrix |
| SRS | Root directory | Section 3.3.2 - Decision Rules |

---

## Appendix A: DMN Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DMN SYNTAX QUICK REFERENCE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COMPARISON OPERATORS                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  < 500000                Less than 500,000                                  │
│  <= 500000               Less than or equal to 500,000                      │
│  > 500000                Greater than 500,000                               │
│  >= 500000               Greater than or equal to 500,000                   │
│                                                                              │
│  RANGE EXPRESSIONS                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [500000..1000000]       Inclusive range (500,000 to 1,000,000)            │
│  (500000..1000000)       Exclusive range (excluding boundaries)            │
│  [500000..1000000)       Left-inclusive, right-exclusive                   │
│  (500000..1000000]       Left-exclusive, right-inclusive                   │
│                                                                              │
│  LOGICAL OPERATORS                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  "A","B"                 Match A or B (disjunction)                         │
│  not("A")                Does not match A                                   │
│  not("A","B")            Does not match A or B                              │
│                                                                              │
│  EMPTY/NULL HANDLING                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  -                       Any value (don't care / empty cell)               │
│  null                    Explicit null value                                │
│                                                                              │
│  HIT POLICIES                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  F (FIRST)               First matching rule wins (use for routing)        │
│  U (UNIQUE)              Exactly one rule must match (validation)          │
│  A (ANY)                 Multiple rules, same result required              │
│  C (COLLECT)             Collect all matching results                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document End**

*This document is part of the ULMS v2.0 Architecture Documentation Suite*

*Last Updated: February 5, 2026*
