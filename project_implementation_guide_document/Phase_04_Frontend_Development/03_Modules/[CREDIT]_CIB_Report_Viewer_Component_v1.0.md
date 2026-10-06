# CIB Report Viewer Component

## Bangladesh Bank CIB Report Display

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Report Viewer Component |
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
2. [CIB Report Structure](#2-cib-report-structure)
3. [Component Design](#3-component-design)
4. [Report Sections](#4-report-sections)
5. [Implementation](#5-implementation)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines the CIB (Credit Information Bureau) Report Viewer component for displaying credit reports from Bangladesh Bank, providing comprehensive credit history visualization.

---

## 2. CIB Report Structure

### 2.1 CIB Data Model

```typescript
// features/credit/types/cib.types.ts

export interface CIBReport {
  reportId: string;
  inquiryDate: string;
  subjectType: 'INDIVIDUAL' | 'COMPANY';
  subjectName: string;
  nidNumber?: string;
  tinNumber?: string;
  cibScore: number;
  riskGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D';
  
  // Summary
  totalOutstanding: number;
  totalSanctioned: number;
  totalOverdue: number;
  totalEMI: number;
  
  // Details
  facilities: CIBFacility[];
  paymentHistory: PaymentHistory[];
  inquiries: InquiryRecord[];
  defaults: DefaultRecord[];
  legalActions: LegalAction[];
}

export interface CIBFacility {
  facilityId: string;
  bankName: string;
  bankBranch: string;
  facilityType: 'TERM_LOAN' | 'OVERDRAFT' | 'CC' | 'SOD' | 'OTHERS';
  sanctionedAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  emiAmount: number;
  status: 'STANDARD' | 'SMA' | 'SS' | 'DF' | 'BL';
  securityCoverage: number;
}

export interface PaymentHistory {
  facilityId: string;
  year: number;
  month: number;
  paymentStatus: 'OK' | 'DPD_30' | 'DPD_60' | 'DPD_90' | 'DPD_90PLUS';
  amountPaid: number;
}
```

---

## 3. Component Design

### 3.1 CIB Report Viewer

```typescript
// features/credit/components/CIBReportViewer/CIBReportViewer.tsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { Refresh, Download } from '@mui/icons-material';
import { useGetCIBReportQuery, useRefreshCIBReportMutation } from '../../api/cibApi';
import { CIBSummaryPanel } from './CIBSummaryPanel';
import { FacilityDetailsTable } from './FacilityDetailsTable';
import { PaymentHistoryChart } from './PaymentHistoryChart';
import { InquiryHistoryTable } from './InquiryHistoryTable';

interface CIBReportViewerProps {
  nidNumber: string;
  onRefresh?: () => void;
}

export function CIBReportViewer({ nidNumber, onRefresh }: CIBReportViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { data: report, isLoading, error } = useGetCIBReportQuery(nidNumber);
  const [refreshReport] = useRefreshCIBReportMutation();

  const handleRefresh = async () => {
    await refreshReport(nidNumber).unwrap();
    onRefresh?.();
  };

  const handleDownload = () => {
    // Generate PDF download
    window.open(`/api/cib/report/${nidNumber}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load CIB report. Please try again.
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="info">
        No CIB data found for this customer.
        <Button onClick={handleRefresh} sx={{ ml: 2 }}>
          Fetch from CIB
        </Button>
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5">
            CIB Report
          </Typography>
          <Typography color="text.secondary">
            {report.subjectName} | NID: {report.nidNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Score Panel */}
      <CIBSummaryPanel report={report} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}
      >
        <Tab label={`Facilities (${report.facilities.length})`} />
        <Tab label="Payment History" />
        <Tab label={`Inquiries (${report.inquiries.length})`} />
        <Tab label={`Defaults (${report.defaults.length})`} />
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && <FacilityDetailsTable facilities={report.facilities} />}
        {activeTab === 1 && <PaymentHistoryChart history={report.paymentHistory} />}
        {activeTab === 2 && <InquiryHistoryTable inquiries={report.inquiries} />}
        {activeTab === 3 && <DefaultHistoryTable defaults={report.defaults} />}
      </Box>
    </Paper>
  );
}
```

---

## 4. Report Sections

### 4.1 Summary Panel

```typescript
// features/credit/components/CIBReportViewer/CIBSummaryPanel.tsx
import { Grid, Paper, Typography, Chip } from '@mui/material';

export function CIBSummaryPanel({ report }: { report: CIBReport }) {
  const getScoreColor = (score: number) => {
    if (score >= 750) return 'success';
    if (score >= 600) return 'warning';
    return 'error';
  };

  const getRiskColor = (grade: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      AAA: 'success', AA: 'success', A: 'success',
      BBB: 'warning', BB: 'warning',
      B: 'error', C: 'error', D: 'error'
    };
    return colors[grade] || 'default';
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            CIB Score
          </Typography>
          <Typography variant="h3" color={`${getScoreColor(report.cibScore)}.main`}>
            {report.cibScore}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            Risk Grade
          </Typography>
          <Chip
            label={report.riskGrade}
            color={getRiskColor(report.riskGrade)}
            sx={{ mt: 1, fontSize: '1.25rem' }}
          />
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            Total Outstanding
          </Typography>
          <Typography variant="h6">
            BDT {report.totalOutstanding.toLocaleString()}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            Facilities
          </Typography>
          <Typography variant="h6">
            {report.facilities.length}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
```

---

## 5. Implementation

### 5.1 CIB API Integration

```typescript
// features/credit/api/cibApi.ts
import { apiSlice } from '../../../services/api/apiSlice';

export const cibApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCIBReport: builder.query<CIBReport, string>({
      query: (nidNumber) => `/cib/report/${nidNumber}`,
      providesTags: (result, error, nidNumber) => [
        { type: 'CIBReport', id: nidNumber },
      ],
    }),

    refreshCIBReport: builder.mutation<CIBReport, string>({
      query: (nidNumber) => ({
        url: `/cib/report/${nidNumber}/refresh`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, nidNumber) => [
        { type: 'CIBReport', id: nidNumber },
      ],
    }),

    requestCIBInquiry: builder.mutation<void, { nidNumber: string; purpose: string }>({
      query: (body) => ({
        url: '/cib/inquiry',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetCIBReportQuery,
  useRefreshCIBReportMutation,
  useRequestCIBInquiryMutation,
} = cibApi;
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[CREDIT]_Credit_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
