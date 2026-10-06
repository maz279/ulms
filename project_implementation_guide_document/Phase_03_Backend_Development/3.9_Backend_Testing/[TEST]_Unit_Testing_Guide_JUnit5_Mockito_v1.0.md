**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Unit Testing Guide - JUnit 5 and Mockito |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Unit Testing Guide - JUnit 5 and Mockito

## Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.assertj</groupId>
        <artifactId>assertj-core</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## Example Test

```java
@ExtendWith(MockitoExtension.class)
class LoanServiceTest {
    
    @Mock
    private LoanRepository loanRepository;
    
    @Mock
    private CibService cibService;
    
    @InjectMocks
    private LoanServiceImpl loanService;
    
    @Test
    @DisplayName("Should approve loan when CIB score is good")
    void approveLoan_WithGoodCibScore_ApprovesLoan() {
        // Given
        Long loanId = 1L;
        Loan loan = createTestLoan(loanId);
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(cibService.getScore(loan.getNidNumber()))
            .thenReturn(new CibScore(750));
        
        // When
        LoanResult result = loanService.approve(loanId);
        
        // Then
        assertThat(result.isApproved()).isTrue();
        verify(loanRepository).save(argThat(l -> 
            l.getStatus() == LoanStatus.APPROVED));
    }
    
    @Test
    @DisplayName("Should reject loan when CIB score is poor")
    void approveLoan_WithPoorCibScore_RejectsLoan() {
        // Given
        Long loanId = 1L;
        Loan loan = createTestLoan(loanId);
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(cibService.getScore(loan.getNidNumber()))
            .thenReturn(new CibScore(400));
        
        // When
        LoanResult result = loanService.approve(loanId);
        
        // Then
        assertThat(result.isApproved()).isFalse();
    }
}
```

## Best Practices

1. Use `@DisplayName` for readable test names
2. Follow Given-When-Then pattern
3. One assertion per test
4. Use AssertJ for fluent assertions
5. Mock external dependencies

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
