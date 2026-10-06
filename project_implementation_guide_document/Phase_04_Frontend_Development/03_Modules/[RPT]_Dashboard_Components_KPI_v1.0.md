# Dashboard Components and KPI

## KPI Cards and Chart Components

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Dashboard Components and KPI |
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
2. [KPI Card Component](#2-kpi-card-component)
3. [Chart Components](#3-chart-components)
4. [Data Visualization](#4-data-visualization)
5. [Related Documents](#5-related-documents)

---

## 1. Executive Summary

This document defines the Dashboard KPI components and chart widgets for ULMS v2.0 reporting dashboards.

---

## 2. KPI Card Component

### 2.1 KPICard Implementation

```typescript
// features/reporting/components/KPICard/KPICard.tsx
import { Paper, Box, Typography, Chip, SvgIconProps } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  icon: React.ReactElement<SvgIconProps>;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
}: KPICardProps) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ my: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip
                icon={trend.direction === 'up' ? <TrendingUp /> : <TrendingDown />}
                label={`${trend.direction === 'up' ? '+' : ''}${trend.value}% ${trend.label || ''}`}
                size="small"
                color={trend.direction === 'up' ? 'success' : 'error'}
              />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}.light`,
            color: `${color}.dark`,
            height: 'fit-content',
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}
```

---

## 3. Chart Components

### 3.1 Loan Portfolio Chart

```typescript
// features/reporting/components/ChartWidgets/LoanPortfolioChart.tsx
import { Paper, Typography, Box } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface PortfolioData {
  name: string;
  value: number;
  color: string;
}

interface LoanPortfolioChartProps {
  data: PortfolioData[];
}

const COLORS = ['#1a365d', '#2c5282', '#4a7c59', '#d69e2e', '#c53030'];

export function LoanPortfolioChart({ data }: LoanPortfolioChartProps) {
  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Loan Portfolio Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `BDT ${value.toLocaleString()}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}
```

### 3.2 Monthly Trend Chart

```typescript
// features/reporting/components/ChartWidgets/MonthlyTrendChart.tsx
import { Paper, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendData {
  month: string;
  disbursed: number;
  collected: number;
}

export function MonthlyTrendChart({ data }: { data: TrendData[] }) {
  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Monthly Disbursement vs Collection
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `BDT ${value.toLocaleString()}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="disbursed"
            stroke="#1a365d"
            strokeWidth={2}
            name="Disbursed"
          />
          <Line
            type="monotone"
            dataKey="collected"
            stroke="#4a7c59"
            strokeWidth={2}
            name="Collected"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
```

---

## 4. Data Visualization

### 4.1 Loan Classification Chart

```typescript
// features/reporting/components/ChartWidgets/ClassificationChart.tsx
import { Paper, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ClassificationData {
  category: string;
  amount: number;
  count: number;
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  'STD-0': '#4caf50',
  'STD-1': '#8bc34a',
  'STD-2': '#cddc39',
  SMA: '#ff9800',
  SS: '#ff5722',
  DF: '#f44336',
  'B/L': '#9e9e9e',
};

export function ClassificationChart({ data }: { data: ClassificationData[] }) {
  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Loan Classification
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="category" type="category" width={80} />
          <Tooltip
            formatter={(value: number) => `BDT ${value.toLocaleString()}`}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CLASSIFICATION_COLORS[entry.category] || '#8884d8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
```

---

## 5. Related Documents

| Document | Purpose |
|----------|---------|
| `[RPT]_Reporting_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
