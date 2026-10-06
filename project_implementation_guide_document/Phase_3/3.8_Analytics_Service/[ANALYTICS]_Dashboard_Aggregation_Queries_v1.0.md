**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Dashboard Aggregation Queries |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Dashboard Aggregation Queries

## 1. Executive Dashboard Queries

### 1.1 Portfolio Summary

```sql
-- Total portfolio metrics
SELECT 
    COUNT(*) as total_loans,
    SUM(outstanding_principal) as total_outstanding,
    SUM(outstanding_interest) as total_interest,
    AVG(outstanding_principal) as avg_loan_size
FROM m_loan
WHERE loan_status_id = 300;  -- Active
```

### 1.2 Classification Distribution

```sql
SELECT 
    classification_stage,
    COUNT(*) as loan_count,
    SUM(outstanding_principal) as total_outstanding,
    ROUND(SUM(outstanding_principal) * 100.0 / 
        (SELECT SUM(outstanding_principal) FROM m_loan WHERE loan_status_id = 300), 2) 
        as percentage
FROM ulms_bangladesh_loan_extension
GROUP BY classification_stage
ORDER BY 
    CASE classification_stage
        WHEN 'STD-0' THEN 1
        WHEN 'STD-1' THEN 2
        WHEN 'STD-2' THEN 3
        WHEN 'SMA' THEN 4
        WHEN 'SS' THEN 5
        WHEN 'DF' THEN 6
        WHEN 'B/L' THEN 7
    END;
```

### 1.3 Monthly Disbursement Trend

```sql
SELECT 
    DATE_TRUNC('month', disbursedon_date) as month,
    COUNT(*) as disbursement_count,
    SUM(principal_amount) as total_disbursed
FROM m_loan
WHERE disbursedon_date >= CURRENT_DATE - INTERVAL '12 months'
    AND loan_status_id IN (300, 600, 700)  -- Active, Closed, Written-off
GROUP BY DATE_TRUNC('month', disbursedon_date)
ORDER BY month;
```

### 1.4 PAR (Portfolio at Risk)

```sql
SELECT 
    CASE 
        WHEN days_past_due = 0 THEN 'Current'
        WHEN days_past_due <= 30 THEN 'PAR 1-30'
        WHEN days_past_due <= 60 THEN 'PAR 31-60'
        WHEN days_past_due <= 90 THEN 'PAR 61-90'
        ELSE 'PAR 90+'
    END as par_bucket,
    COUNT(*) as loan_count,
    SUM(outstanding_principal) as amount_at_risk
FROM m_loan l
JOIN m_loan_summary ls ON l.id = ls.loan_id
WHERE l.loan_status_id = 300
GROUP BY 
    CASE 
        WHEN days_past_due = 0 THEN 'Current'
        WHEN days_past_due <= 30 THEN 'PAR 1-30'
        WHEN days_past_due <= 60 THEN 'PAR 31-60'
        WHEN days_past_due <= 90 THEN 'PAR 61-90'
        ELSE 'PAR 90+'
    END;
```

## 2. Materialized Views for Performance

```sql
-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW mv_portfolio_summary AS
SELECT 
    CURRENT_DATE as report_date,
    COUNT(*) as total_active_loans,
    SUM(principal_outstanding) as total_outstanding,
    SUM(total_overdue) as total_overdue,
    SUM(days_past_due) / COUNT(*) as avg_dpd,
    COUNT(CASE WHEN days_past_due > 0 THEN 1 END) as overdue_count
FROM m_loan l
JOIN m_loan_summary ls ON l.id = ls.loan_id
WHERE l.loan_status_id = 300;

-- Refresh schedule
CREATE OR REPLACE FUNCTION refresh_portfolio_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_portfolio_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-portfolio-summary', '0 * * * *', 
    'SELECT refresh_portfolio_summary()');
```

## 3. ClickHouse Analytics Queries

```sql
-- Daily loan fact table
CREATE TABLE loan_facts (
    fact_date Date,
    loan_id UInt64,
    customer_id UInt64,
    branch_id UInt32,
    product_id UInt32,
    outstanding_amount Decimal(19,6),
    days_past_due UInt16,
    classification_stage String,
    ecl_amount Decimal(19,6)
) ENGINE = MergeTree()
ORDER BY (fact_date, loan_id);

-- Portfolio trend query
SELECT 
    fact_date,
    count() as loan_count,
    sum(outstanding_amount) as total_outstanding,
    sum(ecl_amount) as total_ecl,
    avg(days_past_due) as avg_dpd
FROM loan_facts
WHERE fact_date >= today() - 30
GROUP BY fact_date
ORDER BY fact_date;

-- Classification trend
SELECT 
    fact_date,
    classification_stage,
    count() as loan_count,
    sum(outstanding_amount) as amount
FROM loan_facts
WHERE fact_date >= today() - 90
GROUP BY fact_date, classification_stage
ORDER BY fact_date, classification_stage;
```

---

## Appendices

### A.1 Query Performance Guidelines

| Data Size | Query Type | Max Execution Time |
|-----------|------------|-------------------|
| < 1M rows | Simple | 100ms |
| < 1M rows | Aggregation | 500ms |
| 1M-10M rows | Simple | 500ms |
| 1M-10M rows | Aggregation | 2s |
| > 10M rows | Use ClickHouse | < 1s |
