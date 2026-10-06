**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | DMN Decision Tables Implementation |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# DMN Decision Tables Implementation

## Table of Contents

1. [Introduction](#1-introduction)
2. [Decision Tables](#2-decision-tables)
3. [Implementation](#3-implementation)
4. [Integration](#4-integration)

---

## 1. Introduction

DMN (Decision Model and Notation) tables are used for automated decision-making in loan workflows.

## 2. Decision Tables

### 2.1 Loan Eligibility Decision

| Annual Income | Credit Score | Loan Amount | Eligible | Interest Rate |
|--------------|--------------|-------------|----------|---------------|
| < 300000 | - | - | NO | - |
| >= 300000 | < 500 | - | NO | - |
| >= 300000 | 500-650 | < 500000 | YES | 14% |
| >= 300000 | 500-650 | >= 500000 | NO | - |
| >= 300000 | > 650 | < 1000000 | YES | 12% |
| >= 500000 | > 700 | < 5000000 | YES | 10% |
| >= 1000000 | > 750 | >= 5000000 | YES | 9% |

### 2.2 DMN XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             id="definitions"
             name="LoanDecisions"
             namespace="http://ulms.unisoft.com/dmn">
  
  <decision id="loan_eligibility" name="Loan Eligibility">
    <decisionTable id="eligibility_table" hitPolicy="FIRST">
      <input id="income_input" label="Annual Income">
        <inputExpression typeRef="number">
          <text>annualIncome</text>
        </inputExpression>
      </input>
      <input id="score_input" label="Credit Score">
        <inputExpression typeRef="number">
          <text>creditScore</text>
        </inputExpression>
      </input>
      <input id="amount_input" label="Loan Amount">
        <inputExpression typeRef="number">
          <text>loanAmount</text>
        </inputExpression>
      </input>
      
      <output id="eligible_output" label="Eligible" typeRef="boolean"/>
      <output id="rate_output" label="Interest Rate" typeRef="string"/>
      
      <rule id="rule_1">
        <inputEntry><text>&lt; 300000</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>false</text></outputEntry>
        <outputEntry><text>""</text></outputEntry>
      </rule>
      
      <rule id="rule_2">
        <inputEntry><text>&gt;= 300000</text></inputEntry>
        <inputEntry><text>&gt;= 650</text></inputEntry>
        <inputEntry><text>&lt; 1000000</text></inputEntry>
        <outputEntry><text>true</text></outputEntry>
        <outputEntry><text>"12%"</text></outputEntry>
      </rule>
    </decisionTable>
  </decision>
</definitions>
```

### 2.3 Approval Level Decision

| Loan Amount | Customer Type | Risk Grade | Required Level |
|-------------|---------------|------------|----------------|
| < 10L | Individual | A,B | Level 1 |
| < 10L | Individual | C,D | Level 2 |
| 10L-50L | - | - | Level 2 |
| 50L-1Cr | - | - | Level 3 |
| 1Cr-5Cr | - | - | Level 4 |
| 5Cr-10Cr | - | - | Level 5 |
| 10Cr-25Cr | - | - | Level 6 |
| > 25Cr | - | - | Level 7 |

## 3. Implementation

```java
@Component
public class LoanDecisionService {
    
    @Autowired
    private DmnEngine dmnEngine;
    
    public LoanDecision evaluateEligibility(LoanApplication application) {
        VariableMap variables = Variables.createVariables()
            .putValue("annualIncome", application.getAnnualIncome())
            .putValue("creditScore", application.getCreditScore())
            .putValue("loanAmount", application.getLoanAmount());
        
        DmnDecisionTableResult result = dmnEngine
            .evaluateDecisionTable()
            .decisionKey("loan_eligibility")
            .variables(variables)
            .evaluate();
        
        return LoanDecision.builder()
            .eligible(result.getSingleResult().getEntry("Eligible"))
            .interestRate(result.getSingleResult().getEntry("Interest Rate"))
            .build();
    }
    
    public int determineApprovalLevel(BigDecimal amount, String customerType, String riskGrade) {
        VariableMap variables = Variables.createVariables()
            .putValue("loanAmount", amount)
            .putValue("customerType", customerType)
            .putValue("riskGrade", riskGrade);
        
        DmnDecisionTableResult result = dmnEngine
            .evaluateDecisionTable()
            .decisionKey("approval_level")
            .variables(variables)
            .evaluate();
        
        return result.getSingleResult().getEntry("Required Level");
    }
}
```

## 4. Integration

```java
@Component
public class DecisionIntegration {
    
    private final LoanDecisionService decisionService;
    
    @JobWorker(type = "evaluate-eligibility")
    public Map<String, Object> evaluateEligibility(ActivatedJob job) {
        LoanApplication app = mapToApplication(job.getVariablesAsMap());
        
        LoanDecision decision = decisionService.evaluateEligibility(app);
        
        return Map.of(
            "eligible", decision.isEligible(),
            "interestRate", decision.getInterestRate(),
            "evaluatedAt", LocalDateTime.now()
        );
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
