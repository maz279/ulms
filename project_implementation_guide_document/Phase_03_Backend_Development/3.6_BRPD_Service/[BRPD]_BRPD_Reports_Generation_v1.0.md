**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | BRPD Reports Generation |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# BRPD Reports Generation

## Report Types

| Report Code | Description | Frequency |
|-------------|-------------|-----------|
| CL-1 | Statement of Loans and Advances | Monthly |
| CL-2 | Classification Summary | Monthly |
| CL-3 | Provision Summary | Monthly |
| CL-4 | NPL Summary | Monthly |
| CL-5 | Write-off Report | Monthly |

## Implementation

```java
@Service
@RequiredArgsConstructor
public class BrpdReportService {
    
    private final JdbcTemplate jdbcTemplate;
    
    public CL1Report generateCL1Report(Long officeId, LocalDate asOfDate) {
        String sql = """
            SELECT 
                lc.classification as classification,
                COUNT(*) as loan_count,
                SUM(l.principal_outstanding_derived) as outstanding,
                SUM(lc.provision_required) as provision
            FROM m_loan l
            JOIN ulms_loan_classification lc ON l.id = lc.loan_id
            WHERE l.office_id = ?
            AND lc.effective_date = ?
            AND (lc.end_date IS NULL OR lc.end_date > ?)
            GROUP BY lc.classification
            """;
        
        List<CL1Row> rows = jdbcTemplate.query(sql, (rs, rowNum) -> 
            CL1Row.builder()
                .classification(rs.getString("classification"))
                .loanCount(rs.getLong("loan_count"))
                .outstanding(rs.getBigDecimal("outstanding"))
                .provision(rs.getBigDecimal("provision"))
                .build(),
            officeId, asOfDate, asOfDate);
        
        return CL1Report.builder()
            .officeId(officeId)
            .asOfDate(asOfDate)
            .rows(rows)
            .build();
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
