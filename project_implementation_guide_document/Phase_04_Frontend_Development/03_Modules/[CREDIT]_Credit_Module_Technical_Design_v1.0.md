# Credit Module Technical Design

## Credit Assessment Module Frontend Design

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Credit Module Technical Design |
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
3. [CIB Integration](#3-cib-integration)
4. [Credit Scoring](#4-credit-scoring)
5. [Risk Assessment](#5-risk-assessment)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines the technical design for the Credit Assessment module frontend, integrating with Bangladesh Bank CIB (Credit Information Bureau) for credit history verification and implementing credit scoring algorithms.

---

## 2. Module Architecture

### 2.1 Credit Module Structure

```
features/credit/
├── api/
│   ├── creditApi.ts
│   └── cibApi.ts
├── components/
│   ├── CIBReportViewer/
│   ├── CreditScoreCard/
│   ├── RiskAssessmentForm/
│   ├── FinancialAnalysis/
│   └── CollateralEvaluation/
├── hooks/
│   ├── useCIBReport.ts
│   ├── useCreditScore.ts
│   └── useRiskAssessment.ts
├── pages/
│   ├── CreditDashboardPage.tsx
│   ├── CIBReportPage.tsx
│   ├── CreditScoringPage.tsx
│   └── RiskAssessmentPage.tsx
├── types/
│   └── credit.types.ts
└── routes.ts
```

---

## 3. CIB Integration

### 3.1 CIB Report Component

```typescript
// features/credit/components/CIBReportViewer/CIBReportViewer.tsx
import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Tabs, 
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { useGetCIBReportQuery } from '../../api/cibApi';

interface CIBReportViewerProps {
  nidNumber: string;
}

export function CIBReportViewer({ nidNumber }: CIBReportViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { data: report, isLoading } = useGetCIBReportQuery(nidNumber);

  if (isLoading) return <LoadingSpinner />;
  if (!report) return <Typography>No CIB data found</Typography>;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        CIB Report - {report.subjectName}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip label={`Score: ${report.cibScore}`} color="primary" />
        <Chip 
          label={report.riskGrade} 
          color={getRiskColor(report.riskGrade)} 
        />
        <Chip label={`Total Outstanding: BDT ${report.totalOutstanding}`} />
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Facility Summary" />
        <Tab label="Payment History" />
        <Tab label="Inquiries" />
        <Tab label="Defaults" />
      </Tabs>

      {activeTab === 0 && <FacilitySummary facilities={report.facilities} />}
      {activeTab === 1 && <PaymentHistory history={report.paymentHistory} />}
      {activeTab === 2 && <InquiryHistory inquiries={report.inquiries} />}
      {activeTab === 3 && <DefaultHistory defaults={report.defaults} />}
    </Paper>
  );
}

function FacilitySummary({ facilities }: { facilities: any[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Bank</TableCell>
          <TableCell>Facility Type</TableCell>
          <TableCell>Sanctioned</TableCell>
          <TableCell>Outstanding</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {facilities.map((f, i) => (
          <TableRow key={i}>
            <TableCell>{f.bankName}</TableCell>
            <TableCell>{f.facilityType}</TableCell>
            <TableCell>BDT {f.sanctionedAmount}</TableCell>
            <TableCell>BDT {f.outstandingAmount}</TableCell>
            <TableCell>
              <Chip 
                label={f.status} 
                size="small"
                color={f.status === 'STANDARD' ? 'success' : 'warning'}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 4. Credit Scoring

### 4.1 Credit Score Component

```typescript
// features/credit/components/CreditScoreCard/CreditScoreCard.tsx
import { Paper, Box, Typography, LinearProgress, Grid } from '@mui/material';
import { Gauge } from '../../../components/charts/Gauge';

interface CreditScoreCardProps {
  score: number;
  factors: {
    name: string;
    impact: number;
    score: number;
  }[];
}

export function CreditScoreCard({ score, factors }: CreditScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 750) return 'success';
    if (s >= 600) return 'warning';
    return 'error';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Credit Score Analysis
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 4 }}>
        <Gauge 
          value={score} 
          max={900} 
          color={getScoreColor(score)}
        />
        <Box>
          <Typography variant="h3">{score}</Typography>
          <Typography color="text.secondary">
            {score >= 750 ? 'Excellent' : score >= 600 ? 'Good' : 'Fair'}
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Score Factors
      </Typography>
      <Grid container spacing={2}>
        {factors.map((factor) => (
          <Grid item xs={12} key={factor.name}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{factor.name}</Typography>
              <Typography variant="body2">{factor.score}/100</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={factor.score} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
```

---

## 5. Risk Assessment

### 5.1 Risk Assessment Form

```typescript
// features/credit/components/RiskAssessmentForm/RiskAssessmentForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Typography, Paper } from '@mui/material';
import { FormInput } from '../../../../components/forms/FormInput';
import { FormSelect } from '../../../../components/forms/FormSelect';
import { riskAssessmentSchema } from '../../schemas/riskSchema';

const riskGrades = [
  { value: 'AAA', label: 'AAA - Minimal Risk' },
  { value: 'AA', label: 'AA - Low Risk' },
  { value: 'A', label: 'A - Moderate Risk' },
  { value: 'BBB', label: 'BBB - Acceptable Risk' },
  { value: 'BB', label: 'BB - Caution' },
  { value: 'B', label: 'B - Special Mention' },
];

export function RiskAssessmentForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(riskAssessmentSchema),
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Risk Assessment
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormSelect
            name="riskGrade"
            control={control}
            label="Risk Grade"
            options={riskGrades}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormInput
            name="debtToIncomeRatio"
            control={control}
            label="Debt-to-Income Ratio (%)"
            type="number"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormInput
            name="loanToValueRatio"
            control={control}
            label="Loan-to-Value Ratio (%)"
            type="number"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormInput
            name="proposedInterestRate"
            control={control}
            label="Proposed Interest Rate (%)"
            type="number"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[CREDIT]_CIB_Report_Viewer_Component_v1.0.md` | CIB viewer |
| `[CREDIT]_Credit_Score_Card_Component_v1.0.md` | Score card |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
