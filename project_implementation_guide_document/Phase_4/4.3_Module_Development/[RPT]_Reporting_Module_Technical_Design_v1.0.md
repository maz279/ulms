# Reporting Module Technical Design
## ULMS v2.0 Reports & Dashboards

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Reporting Module Technical Design |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Module Overview

The Reporting Module provides regulatory reports (CL-1 to CL-5), portfolio analytics, and management dashboards.

## 2. Report Types

| Report | Frequency | Format |
|--------|-----------|--------|
| CL-1 | Monthly | PDF/Excel |
| CL-2 | Monthly | PDF/Excel |
| CL-3 | Monthly | PDF/Excel |
| CL-4 | Monthly | PDF/Excel |
| CL-5 | Quarterly | PDF/Excel |
| Portfolio Summary | Real-time | Dashboard |
| Disbursement Report | Daily | PDF/Excel |

## 3. Dashboard Components

```typescript
// Dashboard KPI Cards
interface KPIData {
  totalDisbursement: number;
  totalOutstanding: number;
  totalApplications: number;
  approvalRate: number;
  avgProcessingTime: number;
  nplRatio: number;
}

// Chart components
<DashboardGrid>
  <KPICard title="Total Disbursement" value={data.totalDisbursement} />
  <KPICard title="Outstanding" value={data.totalOutstanding} />
  <PortfolioChart data={portfolioData} />
  <ClassificationChart data={classificationData} />
</DashboardGrid>
```

## 4. Data Visualization

```typescript
// Recharts implementation
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

<BarChart data={monthlyData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip formatter={(val) => `৳ ${val}`} />
  <Legend />
  <Bar dataKey="disbursed" fill="#1976d2" name="Disbursed" />
  <Bar dataKey="recovered" fill="#4caf50" name="Recovered" />
</BarChart>
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
