**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | End-to-End Test Scenarios |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | QA Lead, Unisoft Systems Limited |
| **Reviewed By** | Business Analyst |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | QA Lead | Initial version |

---

# End-to-End Test Scenarios

## Table of Contents

1. [Introduction](#1-introduction)
2. [E2E Testing Strategy](#2-e2e-testing-strategy)
3. [Loan Application to Disbursement Flow](#3-loan-application-to-disbursement-flow)
4. [Critical Business Scenarios](#4-critical-business-scenarios)
5. [Cross-System Integration Scenarios](#5-cross-system-integration-scenarios)
6. [E2E Test Automation Framework](#6-e2e-test-automation-framework)
7. [Test Execution Plan](#7-test-execution-plan)
8. [Related Documents](#8-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines comprehensive End-to-End (E2E) test scenarios for ULMS v2.0, covering complete business processes from loan application initiation through disbursement. These scenarios validate the system's ability to handle real-world Bangladesh banking workflows.

### 1.2 Scope

- Complete loan lifecycle testing
- Multi-system integration validation
- User role-based workflows
- Regulatory compliance validation
- Error handling and recovery

---

## 2. E2E Testing Strategy

### 2.1 Test Pyramid Position

```
                    ▲
                   ╱ ╲
                  ╱ E2E ╲         ← 10% - These Tests
                 ╱ Tests ╲           (Business Scenarios)
                ╱─────────╲
               ╱ Integration ╲    ← 30% - Integration Tests
              ╱    Tests      ╲      (API, Service, DB)
             ╱─────────────────╲
            ╱    Unit Tests      ╲ ← 60% - Unit Tests
           ╱    (JUnit/Mockito)   ╲   (Business Logic)
          ╱─────────────────────────╲
```

### 2.2 E2E Testing Principles

| Principle | Implementation |
|-----------|----------------|
| **Business Focus** | Tests mirror real user journeys |
| **Minimal Mocking** | Use real services in sandbox mode |
| **Deterministic** | Same input always produces same output |
| **Fast Feedback** | Parallel execution, optimized selectors |
| **Maintainable** | Page Object Model, reusable steps |

### 2.3 E2E Test Categories

| Category | Count | Priority |
|----------|-------|----------|
| Happy Path | 25 | Critical |
| Alternative Flows | 35 | High |
| Error Scenarios | 25 | High |
| Edge Cases | 15 | Medium |
| **Total** | **100** | - |

---

## 3. Loan Application to Disbursement Flow

### 3.1 Complete Business Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOAN APPLICATION TO DISBURSEMENT FLOW                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│   │  START   │───▶│ Borrower │───▶│ Document │───▶│    CIB   │                │
│   │          │    │  Details │    │  Upload  │    │  Check   │                │
│   └──────────┘    └──────────┘    └──────────┘    └────┬─────┘                │
│                                                        │                         │
│                                                        ▼                         │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│   │DISBURSE  │◀───│  Credit  │◀───│   CMU    │◀───│ Collateral│               │
│   │   MENT   │    │ Committee│    │  Review  │    │ Valuation │               │
│   └──────────┘    └──────────┘    └──────────┘    └───────────┘               │
│        │                                                                         │
│        ▼                                                                         │
│   ┌──────────┐    ┌──────────┐                                                  │
│   │   CBS    │───▶│  COMPLETE│                                                  │
│   │  Posting │    │          │                                                  │
│   └──────────┘    └──────────┘                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 E2E Test Case: SME Loan Full Journey

#### Test Information

| Field | Value |
|-------|-------|
| **Test ID** | E2E-001 |
| **Title** | Complete SME Loan Application to Disbursement |
| **Priority** | Critical |
| **Duration** | ~15 minutes |

#### Preconditions

1. User logged in as Relationship Manager (RM)
2. Test borrower NID available in NIDW sandbox
3. CIB sandbox configured for positive response
4. CBS sandbox available for disbursement posting
5. Collateral valuation service available

#### Test Steps

```gherkin
@Critical @SME @E2E
Feature: SME Loan Application to Disbursement

  Scenario: E2E-001 Complete SME loan journey
    Given RM "Karim Ahmed" is logged in
    And the NID "1234567890123" is valid in NIDW
    
    When RM navigates to "New Loan Application"
    And selects product "SME Working Capital"
    
    # Step 1: Borrower Information
    And enters NID "1234567890123"
    And clicks "Verify NID"
    Then NID verification succeeds
    And borrower details are auto-populated:
      | Field        | Value            |
      | Name         | Md. Test User    |
      | Father Name  | Test Father      |
      | DOB          | 1990-01-01       |
      | Address      | Test Address     |
    
    # Step 2: Loan Details
    When RM enters loan details:
      | Field           | Value              |
      | Amount          | 500000             |
      | Tenure          | 24 months          |
      | Purpose         | Working Capital    |
      | Interest Rate   | 12%                |
    Then EMI is calculated as "BDT 23,537.31"
    
    # Step 3: Document Upload
    When RM uploads required documents:
      | Document Type        | File              |
      | Trade License        | trade_license.pdf |
      | Bank Statement       | statement_6m.pdf  |
      | TIN Certificate      | tin_cert.pdf      |
    Then all documents show "Verified" status
    
    # Step 4: CIB Check (Automated)
    When RM submits for CIB check
    Then system submits CIB inquiry
    And CIB report shows:
      | Field           | Value     |
      | CIB Score       | 750       |
      | Classification  | STANDARD  |
      | Total Outstanding| 200000   |
    And loan is auto-approved for CMU review
    
    # Step 5: Collateral Details
    When RM adds collateral:
      | Field           | Value                    |
      | Type            | Commercial Property      |
      | Description     | Shop at Dhaka Trade Centre|
      | Estimated Value | 1000000                  |
    And requests collateral valuation
    Then valuation request is submitted
    
    # Step 6: CMU Review
    When CMU Officer "Rahim Khan" logs in
    And opens loan application "LOAN-XXXX"
    And reviews all details
    And approves with conditions:
      """markdown
      - Quarterly stock statement required
      - Insurance policy to be submitted within 30 days
      """
    Then loan status changes to "CMU_APPROVED"
    
    # Step 7: Credit Committee
    When Credit Committee reviews application
    And votes: 3 Approve, 0 Reject, 0 Abstain
    Then loan status changes to "CC_APPROVED"
    
    # Step 8: Documentation
    When RM generates sanction letter
    And borrower signs all documents
    And RM uploads signed documents
    Then documentation is marked complete
    
    # Step 9: Disbursement
    When RM initiates disbursement
    And enters disbursement details:
      | Field               | Value           |
      | Amount              | 500000          |
      | Disbursement Mode   | Bank Transfer   |
      | Beneficiary Account | 1200123456789   |
    Then CBS posting is initiated
    And CBS returns success:
      | Field           | Value           |
      | Transaction ID  | CBS-2024-001    |
      | GL Reference    | GL-LOAN-001     |
      | Status          | POSTED          |
    
    # Final Verification
    Then loan status is "DISBURSED"
    And loan account is created with balance "BDT 500,000"
    And disbursement transaction is recorded
    And email notification sent to borrower
```

### 3.3 E2E Test Case: Retail Loan Rejection Flow

```gherkin
@High @Retail @E2E
Feature: Retail Loan Application Rejection

  Scenario: E2E-002 Loan rejected due to poor CIB score
    Given RM "Karim Ahmed" is logged in
    And the NID "9876543210987" has CIB score 450 (Bad)
    
    When RM creates new retail loan application:
      | Field  | Value   |
      | Amount | 200000  |
      | Tenure | 12      |
      
    And submits for CIB check
    Then CIB report shows:
      | Field           | Value       |
      | CIB Score       | 450         |
      | Classification  | BAD_LOSS    |
      | Default History | Yes         |
      
    And loan is auto-rejected
    And rejection reason is "Poor CIB history - Multiple defaults"
    And borrower is notified via SMS
    
    When RM reviews rejection
    Then RM can see detailed rejection rationale
    And RM cannot override the rejection
```

---

## 4. Critical Business Scenarios

### 4.1 Loan Classification and Provisioning (BRPD 15/2024)

```gherkin
@Critical @Compliance @E2E
Feature: Loan Classification and Provisioning

  Background:
    Given loans exist with various DPD statuses
    And current date is "2024-02-05"
    
  Scenario Outline: E2E-003 Auto-classification based on DPD
    Given loan "<LoanID>" has DPD of <DPD> days
    When classification batch job runs at EOD
    Then loan is classified as "<Classification>"
    And provisioning percentage is <Provisioning>%
    And provision amount is calculated
    
    Examples:
      | LoanID   | DPD | Classification | Provisioning |
      | LN-0001  | 0   | STD-0          | 1            |
      | LN-0002  | 15  | STD-1          | 1            |
      | LN-0003  | 45  | STD-2          | 1            |
      | LN-0004  | 75  | SMA            | 5            |
      | LN-0005  | 120 | SS             | 20           |
      | LN-0006  | 250 | DF             | 50           |
      | LN-0007  | 400 | BL             | 100          |

  Scenario: E2E-004 Manual classification with approval
    Given loan "LN-0008" is classified as "STD-0"
    And the loan shows signs of distress
    When Credit Officer requests manual classification to "SMA"
    And Branch Manager approves the request
    Then loan is reclassified as "SMA"
    And audit trail records the change
    And Bangladesh Bank report reflects the change
```

### 4.2 IFRS-9 ECL Calculation

```gherkin
@Critical @Compliance @IFRS9 @E2E
Feature: IFRS-9 Expected Credit Loss Calculation

  Scenario: E2E-005 ECL calculation for Stage 1 loan
    Given loan "LN-STG1" is in Stage 1 (Performing)
    And loan has remaining principal of BDT 1,000,000
    And probability of default is 2%
    And loss given default is 40%
    When ECL batch calculation runs
    Then 12-month ECL is calculated as:
      """
      EAD = 1,000,000
      PD = 0.02
      LGD = 0.40
      ECL = 1,000,000 × 0.02 × 0.40 = BDT 8,000
      """
    And provision entry is created:
      | Account           | Debit   | Credit  |
      | ECL Expense       | 8,000   |         |
      | Loan Provision    |         | 8,000   |

  Scenario: E2E-006 Stage transfer from 1 to 2
    Given loan "LN-STG2" is in Stage 1
    And borrower has missed 2 consecutive payments
    When staging assessment job runs
    Then loan is transferred to Stage 2 (Deteriorated)
    And ECL calculation switches to Lifetime ECL
    And provision amount is recalculated
```

### 4.3 Repayment and Collection Flow

```gherkin
@Critical @Repayment @E2E
Feature: Loan Repayment Processing

  Scenario: E2E-007 Successful EMI payment via bKash
    Given loan "LN-REPAY" has EMI of BDT 10,000 due on 2024-02-05
    And borrower has bKash account linked
    When borrower initiates payment through mobile app
    And confirms payment via bKash
    Then bKash callback is received
    And payment is matched to loan account
    And loan balance is reduced
    And receipt is generated and sent
    And next due date is updated

  Scenario: E2E-008 Payment reconciliation with CBS
    Given multiple payments were processed yesterday
    When end-of-day reconciliation runs
    Then ULMS payment total matches CBS total
    And any discrepancies are flagged
    And reconciliation report is generated
```

---

## 5. Cross-System Integration Scenarios

### 5.1 Bangladesh Bank Reporting Flow

```gherkin
@Critical @Reporting @E2E
Feature: Bangladesh Bank Regulatory Reporting

  Scenario: E2E-009 Monthly CL-1 report generation and submission
    Given month-end processing is complete
    And all loan classifications are finalized
    When CL-1 report generation job runs
    Then report includes:
      | Field              | Value                    |
      | Reporting Month    | January 2024             |
      | Total Loans        | 10,000                   |
      | Total Outstanding  | BDT 500,00,00,000        |
      | STD Amount         | BDT 450,00,00,000        |
      | SMA Amount         | BDT 20,00,00,000         |
      | SS Amount          | BDT 15,00,00,000         |
      | DF Amount          | BDT 10,00,00,000         |
      | BL Amount          | BDT 5,00,00,000          |
    And report is formatted per Bangladesh Bank specification
    And report is digitally signed
    And report is uploaded to Bangladesh Bank SFTP
    And acknowledgment is received
```

### 5.2 CIB Update Flow

```gherkin
@High @CIB @E2E
Feature: CIB Information Update

  Scenario: E2E-010 New loan reporting to CIB
    Given loan "LN-CIB-NEW" was disbursed yesterday
    And loan details:
      | Field              | Value              |
      | Amount             | BDT 500,000        |
      | Disbursement Date  | 2024-02-04         |
      | Tenure             | 24 months          |
      | EMI                | BDT 23,537         |
    When CIB batch upload job runs
    Then CIB file is generated with correct format
    And file includes all required fields:
      | Field              | Format        |
      | Lending Org ID     | 8 digits      |
      | Facility Type      | 2 digits      |
      | Contract Phase     | 1 digit       |
      | Currency           | BDT           |
      | Sanction Limit     | Decimal       |
      | Outstanding        | Decimal       |
      | Overdue Amount     | Decimal       |
    And file is submitted to CIB Online
    And submission confirmation is received
```

---

## 6. E2E Test Automation Framework

### 6.1 Technology Stack

| Component | Tool | Version |
|-----------|------|---------|
| Test Runner | JUnit 5 | 5.10+ |
| BDD Framework | Cucumber | 7.15+ |
| Browser Automation | Playwright | 1.41+ |
| API Testing | REST Assured | 5.4+ |
| Test Data | Testcontainers | 1.19+ |
| Reporting | Allure | 2.25+ |

### 6.2 Page Object Model

```java
// Base Page Class
public abstract class BasePage {
    protected final Page page;
    protected final String baseUrl;
    
    public BasePage(Page page, String baseUrl) {
        this.page = page;
        this.baseUrl = baseUrl;
    }
    
    public void navigate() {
        page.navigate(baseUrl + getPath());
    }
    
    protected abstract String getPath();
    
    protected Locator locator(String selector) {
        return page.locator(selector);
    }
    
    protected void waitForLoadingComplete() {
        page.waitForSelector(".loading-overlay", new Page.WaitForSelectorOptions()
            .setState(WaitForSelectorState.HIDDEN));
    }
}

// Loan Application Page
public class LoanApplicationPage extends BasePage {
    
    public LoanApplicationPage(Page page, String baseUrl) {
        super(page, baseUrl);
    }
    
    @Override
    protected String getPath() {
        return "/loans/new";
    }
    
    // Locators
    private Locator nidInput() {
        return locator("[data-testid='nid-input']");
    }
    
    private Locator verifyNidButton() {
        return locator("[data-testid='verify-nid-btn']");
    }
    
    private Locator borrowerName() {
        return locator("[data-testid='borrower-name']");
    }
    
    private Locator loanAmountInput() {
        return locator("[data-testid='loan-amount']");
    }
    
    private Locator tenureSelect() {
        return locator("[data-testid='tenure-select']");
    }
    
    private Locator emiDisplay() {
        return locator("[data-testid='emi-amount']");
    }
    
    private Locator submitButton() {
        return locator("[data-testid='submit-application']");
    }
    
    // Actions
    public void enterNid(String nid) {
        nidInput().fill(nid);
    }
    
    public void clickVerifyNid() {
        verifyNidButton().click();
        waitForLoadingComplete();
    }
    
    public String getBorrowerName() {
        return borrowerName().inputValue();
    }
    
    public void enterLoanDetails(BigDecimal amount, int tenureMonths) {
        loanAmountInput().fill(amount.toString());
        tenureSelect().selectOption(String.valueOf(tenureMonths));
        page.waitForTimeout(500); // Wait for EMI calculation
    }
    
    public BigDecimal getCalculatedEmi() {
        String emiText = emiDisplay().textContent();
        return parseCurrency(emiText);
    }
    
    public void submitApplication() {
        submitButton().click();
        waitForLoadingComplete();
    }
    
    // Assertions
    public void assertNidVerified() {
        assertThat(locator("[data-testid='nid-verified-badge']"))
            .isVisible();
    }
    
    public void assertBorrowerDetailsPopulated() {
        assertThat(borrowerName()).not().hasValue("");
    }
}
```

### 6.3 Step Definitions

```java
public class LoanApplicationSteps {
    
    private final TestContext context;
    private final LoanApplicationPage loanPage;
    
    public LoanApplicationSteps(TestContext context, Page page) {
        this.context = context;
        this.loanPage = new LoanApplicationPage(page, context.getBaseUrl());
    }
    
    @Given("RM {string} is logged in")
    public void rmIsLoggedIn(String username) {
        context.loginAs(username, "RELATIONSHIP_MANAGER");
        loanPage.navigate();
    }
    
    @When("RM navigates to {string}")
    public void rmNavigatesTo(String pageName) {
        if (pageName.equals("New Loan Application")) {
            loanPage.navigate();
        }
    }
    
    @When("selects product {string}")
    public void selectsProduct(String productName) {
        loanPage.selectProduct(productName);
    }
    
    @When("enters NID {string}")
    public void entersNID(String nid) {
        context.setCurrentNid(nid);
        loanPage.enterNid(nid);
    }
    
    @When("clicks {string}")
    public void clicks(String buttonText) {
        if (buttonText.equals("Verify NID")) {
            loanPage.clickVerifyNid();
        }
    }
    
    @Then("NID verification succeeds")
    public void nidVerificationSucceeds() {
        loanPage.assertNidVerified();
    }
    
    @Then("borrower details are auto-populated:")
    public void borrowerDetailsAreAutoPopulated(DataTable dataTable) {
        Map<String, String> expectedDetails = dataTable.asMap();
        
        assertThat(loanPage.getBorrowerName())
            .isEqualTo(expectedDetails.get("Name"));
    }
    
    @When("RM enters loan details:")
    public void rmEntersLoanDetails(DataTable dataTable) {
        Map<String, String> details = dataTable.asMap();
        
        BigDecimal amount = new BigDecimal(details.get("Amount"));
        int tenure = Integer.parseInt(details.get("Tenure"));
        
        loanPage.enterLoanDetails(amount, tenure);
        context.setLoanAmount(amount);
    }
    
    @Then("EMI is calculated as {string}")
    public void emiIsCalculatedAs(String expectedEmi) {
        BigDecimal actualEmi = loanPage.getCalculatedEmi();
        BigDecimal expected = parseCurrency(expectedEmi);
        
        assertThat(actualEmi)
            .isCloseTo(expected, within(new BigDecimal("0.01")));
    }
    
    @When("RM uploads required documents:")
    public void rmUploadsRequiredDocuments(DataTable dataTable) {
        List<Map<String, String>> documents = dataTable.asMaps();
        
        for (Map<String, String> doc : documents) {
            String docType = doc.get("Document Type");
            String filename = doc.get("File");
            
            Path filePath = Paths.get("src/test/resources/documents/" + filename);
            loanPage.uploadDocument(docType, filePath);
        }
    }
}
```

### 6.4 Playwright Configuration

```java
@Configuration
public class PlaywrightConfig {
    
    @Bean
    public Playwright playwright() {
        return Playwright.create();
    }
    
    @Bean
    public Browser browser(Playwright playwright) {
        return playwright.chromium().launch(new BrowserType.LaunchOptions()
            .setHeadless(Boolean.parseBoolean(System.getProperty("headless", "true")))
            .setSlowMo(Integer.parseInt(System.getProperty("slowmo", "0"))));
    }
    
    @Bean
    @Scope("scenario")
    public BrowserContext browserContext(Browser browser) {
        return browser.newContext(new Browser.NewContextOptions()
            .setViewportSize(1920, 1080)
            .setRecordVideoDir(Paths.get("build/videos/"))
            .setRecordVideoSize(1920, 1080));
    }
    
    @Bean
    @Scope("scenario")
    public Page page(BrowserContext context) {
        return context.newPage();
    }
}
```

---

## 7. Test Execution Plan

### 7.1 Execution Schedule

| Phase | Week | Tests | Environment |
|-------|------|-------|-------------|
| Foundation | 1-2 | 10 critical | Local/CI |
| Core Scenarios | 3-4 | 40 tests | Test |
| Full Regression | 5-6 | 100 tests | Staging |
| Pre-Release | 7 | 100 tests | UAT |
| Nightly | Ongoing | All tests | Staging |

### 7.2 Parallel Execution

```yaml
# junit-platform.properties
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.mode.classes.default=concurrent
junit.jupiter.execution.parallel.config.strategy=fixed
junit.jupiter.execution.parallel.config.fixed.parallelism=4
```

---

## 8. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Master_Test_Strategy_Document_v1.0.md` | Overall testing approach |
| `[TEST]_Integration_Test_Plan_v1.0.md` | Integration testing details |
| `../Business_Requirements_Document_LMS.md` | Business requirements traceability |
| `../User_Requirements_Document_v2.md` | User stories and acceptance criteria |

---

**Document Owner:** QA Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
