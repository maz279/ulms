**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Dashboard Aggregation Queries |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Dashboard Aggregation Queries

## KPI Queries

### 1. Total Portfolio

```sql
SELECT 
    COUNT(*) as total_loans,
    SUM(principal_outstanding_derived) as total_outstanding,
    SUM(principal_disbursed_derived) as total_disbursed
FROM m_loan
WHERE loan_status_id = 300;
```

### 2. Classification Summary

```sql
SELECT 
    lc.classification,
    COUNT(*) as loan_count,
    SUM(l.principal_outstanding_derived) as amount,
    SUM(lc.provision_required) as provision
FROM m_loan l
JOIN ulms_loan_classification lc ON l.id = lc.loan_id
WHERE lc.effective_date = CURRENT_DATE
GROUP BY lc.classification;
```

### 3. Monthly Disbursement Trend

```sql
SELECT 
    DATE_TRUNC('month', disbursedon_date) as month,
    COUNT(*) as disbursements,
    SUM(principal_disbursed_derived) as amount
FROM m_loan
WHERE disbursedon_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', disbursedon_date)
ORDER BY month;
```

### 4. NPL Ratio

```sql
SELECT 
    SUM(CASE WHEN lc.classification IN ('SS', 'DF', 'BL') 
        THEN l.principal_outstanding_derived ELSE 0 END) / 
    SUM(l.principal_outstanding_derived) * 100 as npl_ratio
FROM m_loan l
JOIN ulms_loan_classification lc ON l.id = lc.loan_id
WHERE lc.effective_date = CURRENT_DATE;
```

## Materialized Views

```sql
-- Create materialized view for faster dashboard queries
CREATE MATERIALIZED VIEW mv_dashboard_summary AS
SELECT 
    office_id,
    COUNT(*) as total_loans,
    SUM(principal_outstanding_derived) as total_outstanding
FROM m_loan
WHERE loan_status_id = 300
GROUP BY office_id;

-- Refresh schedule
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_summary;
END;
$$ LANGUAGE plpgsql;
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
