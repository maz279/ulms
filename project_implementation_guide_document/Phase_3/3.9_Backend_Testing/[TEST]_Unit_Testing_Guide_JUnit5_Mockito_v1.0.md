**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Unit Testing Guide - JUnit 5 & Mockito |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Unit Testing Guide - JUnit 5 & Mockito

## 1. Setup

### 1.1 Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-junit-jupiter</artifactId>
        <version>5.5.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.assertj</groupId>
        <artifactId>assertj-core</artifactId>
        <version>3.24.2</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## 2. Test Structure

### 2.1 Basic Test Class

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("Loan Service Tests")
class LoanServiceTest {
    
    @Mock
    private LoanRepository loanRepository;
    
    @Mock
    private CibService cibService;
    
    @InjectMocks
    private LoanServiceImpl loanService;
    
    @Test
    @DisplayName("Should approve loan with good CIB score")
    void shouldApproveLoanWithGoodCibScore() {
        // Given
        Long loanId = 1L;
        Loan loan = createLoan(loanId);
        CibReport cibReport = createCibReport(750);
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(cibService.getCibReport(any())).thenReturn(cibReport);
        
        // When
        LoanDecision decision = loanService.evaluateLoan(loanId);
        
        // Then
        assertThat(decision.isApproved()).isTrue();
        verify(loanRepository).save(any());
    }
    
    @Test
    @DisplayName("Should reject loan with poor CIB score")
    void shouldRejectLoanWithPoorCibScore() {
        // Given
        Long loanId = 1L;
        Loan loan = createLoan(loanId);
        CibReport cibReport = createCibReport(400);
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(cibService.getCibReport(any())).thenReturn(cibReport);
        
        // When
        LoanDecision decision = loanService.evaluateLoan(loanId);
        
        // Then
        assertThat(decision.isApproved()).isFalse();
        assertThat(decision.getReason()).contains("CIB score too low");
    }
    
    @Test
    @DisplayName("Should throw exception when loan not found")
    void shouldThrowExceptionWhenLoanNotFound() {
        // Given
        Long loanId = 999L;
        when(loanRepository.findById(loanId)).thenReturn(Optional.empty());
        
        // When/Then
        assertThatThrownBy(() -> loanService.evaluateLoan(loanId))
            .isInstanceOf(LoanNotFoundException.class)
            .hasMessageContaining("Loan not found: 999");
    }
}
```

### 2.2 Parameterized Tests

```java
@ParameterizedTest
@CsvSource({
    "800, APPROVED, 0.0",
    "700, APPROVED, 1.0",
    "650, APPROVED, 2.0",
    "550, REVIEW, 3.0",
    "400, REJECTED, 0.0"
})
@DisplayName("Should make correct decision based on CIB score")
void shouldMakeCorrectDecision(int cibScore, String expectedDecision, 
        double expectedRate) {
    // Given
    LoanApplication app = createApplication(cibScore);
    
    // When
    CreditDecision decision = creditScoringService.evaluate(app);
    
    // Then
    assertThat(decision.getStatus()).isEqualTo(expectedDecision);
    assertThat(decision.getInterestRateAdjustment()).isEqualTo(expectedRate);
}
```

## 3. Best Practices

### 3.1 Arrange-Act-Assert Pattern

```java
@Test
void shouldCalculateEMICorrectly() {
    // Arrange
    BigDecimal principal = new BigDecimal("100000");
    BigDecimal rate = new BigDecimal("12");
    int months = 12;
    
    // Act
    BigDecimal emi = emiCalculator.calculate(principal, rate, months);
    
    // Assert
    assertThat(emi).isEqualByComparingTo(new BigDecimal("8884.88"));
}
```

### 3.2 Given-When-Then Pattern

```java
@Test
void shouldSendNotificationOnLoanApproval() {
    // Given - a loan application is approved
    LoanApplication application = approvedApplication();
    
    // When - the approval is processed
    loanService.processApproval(application);
    
    // Then - a notification should be sent
    verify(notificationService).sendApprovalNotification(
        eq(application.getCustomerEmail()),
        argThat(msg -> msg.contains(application.getLoanId()))
    );
}
```

## 4. Test Data Builders

```java
public class LoanTestDataBuilder {
    
    public static LoanBuilder aLoan() {
        return Loan.builder()
            .id(1L)
            .loanAmount(new BigDecimal("500000"))
            .interestRate(new BigDecimal("12"))
            .tenorMonths(36)
            .status(LoanStatus.PENDING);
    }
    
    public static LoanBuilder anApprovedLoan() {
        return aLoan().status(LoanStatus.APPROVED);
    }
    
    public static LoanBuilder aRejectedLoan() {
        return aLoan().status(LoanStatus.REJECTED);
    }
}

// Usage in tests
Loan loan = LoanTestDataBuilder.aLoan()
    .loanAmount(new BigDecimal("1000000"))
    .tenorMonths(60)
    .build();
```

---

## Appendices

### A.1 Common Assertions

| Assertion | Purpose |
|-----------|---------|
| `assertThat(actual).isEqualTo(expected)` | Equality check |
| `assertThat(actual).isNull()` | Null check |
| `assertThat(list).hasSize(3)` | Collection size |
| `assertThatThrownBy(() -> ...)` | Exception testing |
| `verify(mock).method(arg)` | Mock verification |
