**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | DMN Decision Tables Implementation |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# DMN Decision Tables Implementation

## 1. Overview

DMN (Decision Model and Notation) tables are used for business rules that can be managed independently from process logic.

## 2. Credit Scoring Decision

### 2.1 Decision Table

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             id="credit-scoring"
             name="Credit Scoring"
             namespace="http://ulms.unisoft.com">
  
  <decision id="credit-score-calculation" name="Credit Score Calculation">
    <decisionTable id="credit-score-table" hitPolicy="COLLECT">
      
      <input id="cib-score">
        <inputExpression typeRef="integer">
          <text>cibScore</text>
        </inputExpression>
      </input>
      
      <input id="monthly-income">
        <inputExpression typeRef="double">
          <text>monthlyIncome</text>
        </inputExpression>
      </input>
      
      <input id="employment-type">
        <inputExpression typeRef="string">
          <text>employmentType</text>
        </inputExpression>
      </input>
      
      <output id="score-points" name="scorePoints" typeRef="integer"/>
      
      <!-- CIB Score Rules -->
      <rule id="cib-excellent">
        <inputEntry><text>&gt;= 750</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>50</text></outputEntry>
      </rule>
      
      <rule id="cib-good">
        <inputEntry><text>[650..749]</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>40</text></outputEntry>
      </rule>
      
      <rule id="cib-fair">
        <inputEntry><text>[550..649]</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>25</text></outputEntry>
      </rule>
      
      <rule id="cib-poor">
        <inputEntry><text>&lt; 550</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>10</text></outputEntry>
      </rule>
      
      <!-- Income Rules -->
      <rule id="income-high">
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>&gt;= 200000</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>30</text></outputEntry>
      </rule>
      
      <rule id="income-medium">
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>[50000..199999]</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>20</text></outputEntry>
      </rule>
      
      <rule id="income-low">
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>&lt; 50000</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <outputEntry><text>10</text></outputEntry>
      </rule>
      
      <!-- Employment Rules -->
      <rule id="emp-permanent">
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>"PERMANENT"</text></inputEntry>
        <outputEntry><text>20</text></outputEntry>
      </rule>
      
      <rule id="emp-contractual">
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>"CONTRACTUAL"</text></inputEntry>
        <outputEntry><text>15</text></outputEntry>
      </rule>
      
      <rule id="emp-business">
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>-</text></inputEntry>
        <inputEntry><text>"BUSINESS"</text></inputEntry>
        <outputEntry><text>15</text></outputEntry>
      </rule>
      
    </decisionTable>
  </decision>
  
  <!-- Result Calculation -->
  <decision id="credit-score-result" name="Credit Score Result">
    <variable name="creditScore" typeRef="integer"/>
    <literalExpression>
      <text>sum(credit-score-calculation.scorePoints)</text>
    </literalExpression>
  </decision>
  
</definitions>
```

## 3. Interest Rate Decision

```xml
<decision id="interest-rate" name="Interest Rate Determination">
  <decisionTable id="rate-table" hitPolicy="FIRST">
    
    <input id="loan-type">
      <inputExpression typeRef="string">
        <text>loanType</text>
      </inputExpression>
    </input>
    
    <input id="tenor-months">
      <inputExpression typeRef="integer">
        <text>tenorMonths</text>
      </inputExpression>
    </input>
    
    <input id="credit-score">
      <inputExpression typeRef="integer">
        <text>creditScore</text>
      </inputExpression>
    </input>
    
    <output id="interest-rate" name="interestRate" typeRef="double"/>
    <output id="rate-type" name="rateType" typeRef="string"/>
    
    <rule id="personal-short-excellent">
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text>&lt;= 12</text></inputEntry>
      <inputEntry><text>&gt;= 90</text></inputEntry>
      <outputEntry><text>10.5</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="personal-short-good">
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text>&lt;= 12</text></inputEntry>
      <inputEntry><text>[70..89]</text></inputEntry>
      <outputEntry><text>11.5</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="personal-short-fair">
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text>&lt;= 12</text></inputEntry>
      <inputEntry><text>[50..69]</text></inputEntry>
      <outputEntry><text>13.0</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="personal-long-excellent">
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text>&gt; 12</text></inputEntry>
      <inputEntry><text>&gt;= 90</text></inputEntry>
      <outputEntry><text>11.5</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="personal-long-good">
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text>&gt; 12</text></inputEntry>
      <inputEntry><text>[70..89]</text></inputEntry>
      <outputEntry><text>12.5</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="personal-long-fair">
      <inputEntry><text>"PERSONAL"</text></inputEntry>
      <inputEntry><text>&gt; 12</text></inputEntry>
      <inputEntry><text>[50..69]</text></inputEntry>
      <outputEntry><text>14.0</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="home-excellent">
      <inputEntry><text>"HOME"</text></inputEntry>
      <inputEntry><text>-</text></inputEntry>
      <inputEntry><text>&gt;= 90</text></inputEntry>
      <outputEntry><text>9.5</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="home-good">
      <inputEntry><text>"HOME"</text></inputEntry>
      <inputEntry><text>-</text></inputEntry>
      <inputEntry><text>[70..89]</text></inputEntry>
      <outputEntry><text>10.5</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="sme-excellent">
      <inputEntry><text>"SME"</text></inputEntry>
      <inputEntry><text>-</text></inputEntry>
      <inputEntry><text>&gt;= 90</text></inputEntry>
      <outputEntry><text>11.0</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
    <rule id="sme-good">
      <inputEntry><text>"SME"</text></inputEntry>
      <inputEntry><text>-</text></inputEntry>
      <inputEntry><text>[70..89]</text></inputEntry>
      <outputEntry><text>12.0</text></outputEntry>
      <outputEntry><text>"REDUCING"</text></outputEntry>
    </rule>
    
  </decisionTable>
</decision>
```

## 4. Loan Amount Limit Decision

| Credit Score | Max DTI | Max Amount (BDT) |
|--------------|---------|------------------|
| 90-100 | 50% | 50,00,000 |
| 70-89 | 45% | 30,00,000 |
| 50-69 | 40% | 15,00,000 |
| < 50 | 35% | 5,00,000 |

## 5. Java Integration

```java
@Service
@RequiredArgsConstructor
public class DmnDecisionService {
    
    private final DmnEngine dmnEngine;
    
    public int calculateCreditScore(CreditScoreInput input) {
        DmnDecision decision = dmnEngine.parseDecision("credit-score-calculation");
        
        VariableMap variables = Variables.createVariables()
            .putValue("cibScore", input.getCibScore())
            .putValue("monthlyIncome", input.getMonthlyIncome())
            .putValue("employmentType", input.getEmploymentType());
        
        DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(
            decision, variables);
        
        return result.collectEntries("scorePoints").stream()
            .mapToInt(Integer::intValue)
            .sum();
    }
    
    public InterestRateResult determineInterestRate(LoanInput input) {
        DmnDecision decision = dmnEngine.parseDecision("interest-rate");
        
        VariableMap variables = Variables.createVariables()
            .putValue("loanType", input.getLoanType())
            .putValue("tenorMonths", input.getTenorMonths())
            .putValue("creditScore", input.getCreditScore());
        
        DmnDecisionTableResult result = dmnEngine.evaluateDecisionTable(
            decision, variables);
        
        return InterestRateResult.builder()
            .interestRate(result.getSingleEntry("interestRate"))
            .rateType(result.getSingleEntry("rateType"))
            .build();
    }
}
```

---

## Appendices

### A.1 DMN Hit Policies

| Policy | Description |
|--------|-------------|
| UNIQUE | Only one rule can match |
| FIRST | First matching rule applies |
| PRIORITY | Priority ordered rules |
| ANY | All matching rules must agree |
| COLLECT | Sum/Collect all matches |
| RULE ORDER | All matches in order |

### A.2 FEEL Expressions

| Expression | Meaning |
|------------|---------|
| `= 10` | Equal to 10 |
| `!= 10` | Not equal to 10 |
| `< 10` | Less than 10 |
| `> 10` | Greater than 10 |
| `[10..20]` | Between 10 and 20 |
| `&gt;= 10` | Greater than or equal |
