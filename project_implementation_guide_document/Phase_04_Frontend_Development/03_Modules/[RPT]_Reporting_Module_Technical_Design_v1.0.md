# Reporting Module Technical Design

## Reports and Dashboards Module Frontend Design

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Reporting Module Technical Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Frontend Development Team |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Frontend Team | Initial version |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Module Architecture](#2-module-architecture)
3. [Dashboard Components](#3-dashboard-components)
4. [Report Types](#4-report-types)
5. [Report Viewer](#5-report-viewer)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines the technical design for the Reporting module frontend, providing dashboards, KPIs, and report generation capabilities for bank management.

---

## 2. Module Architecture

### 2.1 Reporting Module Structure

```
features/reporting/
├── api/
│   ├── reportsApi.ts
│   └── dashboardApi.ts
├── components/
│   ├── Dashboard/
│   ├── KPICard/
│   ├── ChartWidgets/
│   ├── ReportList/
│   └── ReportViewer/
├── pages/
│   ├── DashboardPage.tsx
│   ├── LoanPortfolioPage.tsx
│   ├── PerformanceReportPage.tsx
│   └── RegulatoryReportPage.tsx
├── hooks/
│   ├── useDashboard.ts
│   └── useReports.ts
└── types/
    └── reporting.types.ts
```

---

## 3. Dashboard Components

### 3.1 Dashboard Layout

```typescript
// features/reporting/pages/DashboardPage.tsx
import { Grid } from '@mui/material';
import { KPICard } from '../components/KPICard';
import { LoanPortfolioChart } from '../components/ChartWidgets';
import { RecentApplicationsTable } from '../components/RecentApplicationsTable';
import { useDashboardDataQuery } from '../api/dashboardApi';

export function DashboardPage() {
  const { data } = useDashboardDataQuery();

  return (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <KPICard
          title="Total Portfolio"
          value={data?.totalPortfolio}
          trend={data?.portfolioTrend}
          icon={<AccountBalance />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KPICard
          title="Active Loans"
          value={data?.activeLoans}
          trend={data?.loansTrend}
          icon={<CreditScore />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KPICard
          title="Disbursed This Month"
          value={data?.disbursedThisMonth}
          trend={data?.disbursedTrend}
          icon={<TrendingUp />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KPICard
          title="Collection Rate"
          value={`${data?.collectionRate}%`}
          trend={data?.collectionTrend}
          icon={<Payment />}
        />
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={8}>
        <LoanPortfolioChart data={data?.portfolioData} />
      </Grid>
      <Grid item xs={12} md={4}>
        <LoanClassificationChart data={data?.classificationData} />
      </Grid>

      {/* Tables */}
      <Grid item xs={12}>
        <RecentApplicationsTable applications={data?.recentApplications} />
      </Grid>
    </Grid>
  );
}
```

---

## 4. Report Types

| Report Type | Description | Format |
|-------------|-------------|--------|
| **Loan Portfolio** | Summary of all loans by category | PDF, Excel |
| **Performance** | Branch/Officer performance metrics | PDF, Excel |
| **Classification** | Loan classification report | PDF, Excel |
| **Overdue** | Overdue loans list | PDF, Excel |
| **Regulatory** | Bangladesh Bank required reports | PDF |
| **Custom** | User-defined reports | PDF, Excel, CSV |

---

## 5. Report Viewer

### 5.1 Report List Component

```typescript
// features/reporting/components/ReportList/ReportList.tsx
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import { PictureAsPdf, TableChart, Download } from '@mui/icons-material';
import { useGetReportsQuery } from '../../api/reportsApi';

const reportTypes: Record<string, { label: string; color: any }> = {
  PORTFOLIO: { label: 'Portfolio', color: 'primary' },
  PERFORMANCE: { label: 'Performance', color: 'success' },
  REGULATORY: { label: 'Regulatory', color: 'warning' },
  CUSTOM: { label: 'Custom', color: 'info' },
};

export function ReportList() {
  const { data: reports } = useGetReportsQuery();

  return (
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Report Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Generated</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports?.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.name}</TableCell>
              <TableCell>
                <Chip
                  label={reportTypes[report.type].label}
                  color={reportTypes[report.type].color}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(report.generatedAt).toLocaleString()}
              </TableCell>
              <TableCell>
                {report.format === 'PDF' ? <PictureAsPdf /> : <TableChart />}
              </TableCell>
              <TableCell>
                <IconButton href={report.downloadUrl}>
                  <Download />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[RPT]_Dashboard_Components_KPI_v1.0.md` | Dashboard components |
| `[RPT]_Report_Viewer_Component_v1.0.md` | Report viewer |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
