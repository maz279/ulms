# Component Library Documentation
## ULMS v2.0 UI Component Library

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Component Library Documentation |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | UI/UX Designer |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Frontend Developer | Initial documentation |

---

## Table of Contents

1. [Library Overview](#1-library-overview)
2. [Component Categories](#2-component-categories)
3. [Common Components](#3-common-components)
4. [Data Display Components](#4-data-display-components)
5. [Feedback Components](#5-feedback-components)
6. [Input Components](#6-input-components)
7. [Layout Components](#7-layout-components)
8. [Module-Specific Components](#8-module-specific-components)
9. [Best Practices](#9-best-practices)
10. [Appendices](#10-appendices)

---

## 1. Library Overview

### 1.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ULMS COMPONENT LIBRARY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     MATERIAL-UI (MUI) FOUNDATION                      │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │    Base      │ │    Input     │ │  Data Display│ │   Feedback   │ │  │
│  │  │  Components  │ │  Components  │ │  Components  │ │  Components  │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                    ULMS SHARED COMPONENTS                             │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │   Common     │ │  Data Grid   │ │   Forms      │ │    Layout    │ │  │
│  │  │ Components   │ │ Components   │ │ Components   │ │ Components   │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                    MODULE-SPECIFIC COMPONENTS                         │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │    LOS       │ │   Credit     │ │   Workflow   │ │  Reporting   │ │  │
│  │  │ Components   │ │ Components   │ │ Components   │ │ Components   │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component Layer | Technology | Version |
|-----------------|------------|---------|
| Base Library | Material-UI (MUI) | 5.15.0 |
| Data Grid | MUI X Data Grid | 6.18.0 |
| Date Pickers | MUI X Date Pickers | 6.18.0 |
| Styling | Emotion (CSS-in-JS) | 11.11.0 |
| Icons | MUI Icons | 5.15.0 |

---

## 2. Component Categories

### 2.1 Directory Structure

```
src/shared/components/
├── common/                          # Generic reusable components
│   ├── index.ts
│   ├── ActionButton.tsx
│   ├── StatusBadge.tsx
│   ├── CurrencyDisplay.tsx
│   ├── PercentageDisplay.tsx
│   ├── DateDisplay.tsx
│   └── LoadingOverlay.tsx
│
├── data-display/                    # Data presentation components
│   ├── index.ts
│   ├── DataTable.tsx
│   ├── DataCard.tsx
│   ├── StatCard.tsx
│   ├── Timeline.tsx
│   └── DocumentViewer.tsx
│
├── feedback/                        # User feedback components
│   ├── index.ts
│   ├── PageLoader.tsx
│   ├── ErrorBoundary.tsx
│   ├── EmptyState.tsx
│   ├── ConfirmDialog.tsx
│   └── Notification.tsx
│
├── inputs/                          # Form input components
│   ├── index.ts
│   ├── FormInput.tsx
│   ├── FormSelect.tsx
│   ├── FormDatePicker.tsx
│   ├── FormCurrency.tsx
│   ├── FormNIDInput.tsx
│   ├── FormMobileInput.tsx
│   └── FormFileUpload.tsx
│
├── layout/                          # Layout components
│   ├── index.ts
│   ├── MainLayout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── PageHeader.tsx
│   └── Container.tsx
│
└── navigation/                      # Navigation components
    ├── index.ts
    ├── Breadcrumb.tsx
    ├── NavMenu.tsx
    └── TabNavigation.tsx
```

---

## 3. Common Components

### 3.1 StatusBadge

Displays status indicators with appropriate colors for ULMS entities.

```typescript
// shared/components/common/StatusBadge.tsx
import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export type StatusType = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'submitted'
  | 'under_review';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium';
}

const statusConfig: Record<StatusType, { color: ChipProps['color']; label: string }> = {
  pending: { color: 'warning', label: 'Pending' },
  approved: { color: 'success', label: 'Approved' },
  rejected: { color: 'error', label: 'Rejected' },
  in_progress: { color: 'info', label: 'In Progress' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'default', label: 'Cancelled' },
  draft: { color: 'default', label: 'Draft' },
  submitted: { color: 'primary', label: 'Submitted' },
  under_review: { color: 'secondary', label: 'Under Review' },
};

export function StatusBadge({
  status,
  label,
  size = 'small',
  ...props
}: StatusBadgeProps): React.ReactElement {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={label || config.label}
      color={config.color}
      size={size}
      {...props}
    />
  );
}

// Usage examples
// <StatusBadge status="approved" />
// <StatusBadge status="pending" label="Awaiting Approval" />
```

### 3.2 CurrencyDisplay

Formats and displays BDT currency values.

```typescript
// shared/components/common/CurrencyDisplay.tsx
import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

interface CurrencyDisplayProps extends Omit<TypographyProps, 'children'> {
  amount: number;
  currency?: 'BDT' | 'USD';
  showSymbol?: boolean;
  decimalPlaces?: number;
  variant?: TypographyProps['variant'];
  color?: 'default' | 'positive' | 'negative' | 'neutral';
}

const currencySymbols: Record<string, string> = {
  BDT: '৳',
  USD: '$',
};

export function CurrencyDisplay({
  amount,
  currency = 'BDT',
  showSymbol = true,
  decimalPlaces = 2,
  variant = 'body1',
  color = 'default',
  ...props
}: CurrencyDisplayProps): React.ReactElement {
  const formatted = new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  const displayValue = showSymbol 
    ? formatted 
    : formatted.replace(currencySymbols[currency], '').trim();

  const colorMap = {
    default: 'text.primary',
    positive: 'success.main',
    negative: 'error.main',
    neutral: 'text.secondary',
  };

  return (
    <Typography
      variant={variant}
      color={colorMap[color]}
      {...props}
    >
      {displayValue}
    </Typography>
  );
}

// Usage examples
// <CurrencyDisplay amount={500000} />
// <CurrencyDisplay amount={-25000} color="negative" />
// <CurrencyDisplay amount={1000000} variant="h4" />
```

### 3.3 DateDisplay

Formats dates in Bangladesh standard format.

```typescript
// shared/components/common/DateDisplay.tsx
import React from 'react';
import { Typography, TypographyProps, Tooltip } from '@mui/material';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

interface DateDisplayProps extends Omit<TypographyProps, 'children'> {
  date: Date | string | null | undefined;
  format?: 'short' | 'long' | 'relative' | 'datetime' | 'time';
  showTooltip?: boolean;
  fallback?: string;
}

const formatPatterns = {
  short: 'dd/MM/yyyy',      // 08/02/2026
  long: 'dd MMMM yyyy',     // 08 February 2026
  datetime: 'dd/MM/yyyy HH:mm',
  time: 'HH:mm',
};

export function DateDisplay({
  date,
  format: formatType = 'short',
  showTooltip = true,
  fallback = '-',
  ...props
}: DateDisplayProps): React.ReactElement {
  if (!date) {
    return <Typography {...props}>{fallback}</Typography>;
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return <Typography {...props}>{fallback}</Typography>;
  }

  let displayText: string;
  
  if (formatType === 'relative') {
    displayText = formatDistanceToNow(dateObj, { addSuffix: true });
  } else {
    displayText = format(dateObj, formatPatterns[formatType]);
  }

  const fullDateTime = format(dateObj, formatPatterns.datetime);

  const content = (
    <Typography {...props}>{displayText}</Typography>
  );

  if (showTooltip && formatType !== 'datetime') {
    return (
      <Tooltip title={fullDateTime} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}

// Usage examples
// <DateDisplay date={application.submissionDate} />
// <DateDisplay date={loan.createdAt} format="relative" />
// <DateDisplay date={meeting.scheduledAt} format="datetime" />
```

---

## 4. Data Display Components

### 4.1 DataTable Component

Enhanced data table with ULMS-specific features.

```typescript
// shared/components/data-display/DataTable.tsx
import React from 'react';
import {
  DataGrid,
  DataGridProps,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridRowSelectionModel,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import { Box, Paper, Typography } from '@mui/material';

interface DataTableProps<T> extends Omit<DataGridProps<T>, 'rows' | 'columns'> {
  rows: T[];
  columns: GridColDef[];
  title?: string;
  loading?: boolean;
  rowCount?: number;
  paginationModel?: GridPaginationModel;
  sortModel?: GridSortModel;
  rowSelectionModel?: GridRowSelectionModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  onSortModelChange?: (model: GridSortModel) => void;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  onRowClick?: (row: T) => void;
  toolbar?: boolean;
  emptyMessage?: string;
  height?: number | string;
}

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        csvOptions={{ utf8WithBom: true }}
        printOptions={{ disableToolbarButton: true }}
      />
    </GridToolbarContainer>
  );
}

export function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  title,
  loading = false,
  rowCount,
  paginationModel = { page: 0, pageSize: 20 },
  sortModel,
  rowSelectionModel,
  onPaginationModelChange,
  onSortModelChange,
  onRowSelectionModelChange,
  onRowClick,
  toolbar = true,
  emptyMessage = 'No records found',
  height = 600,
  ...props
}: DataTableProps<T>): React.ReactElement {
  return (
    <Paper elevation={1} sx={{ width: '100%' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationModel={paginationModel}
          sortModel={sortModel}
          rowSelectionModel={rowSelectionModel}
          onPaginationModelChange={onPaginationModelChange}
          onSortModelChange={onSortModelChange}
          onRowSelectionModelChange={onRowSelectionModelChange}
          onRowClick={onRowClick ? (params) => onRowClick(params.row as T) : undefined}
          pageSizeOptions={[10, 20, 50, 100]}
          paginationMode={rowCount !== undefined ? 'server' : 'client'}
          sortingMode={rowCount !== undefined ? 'server' : 'client'}
          disableRowSelectionOnClick={!onRowClick}
          density="compact"
          slots={{
            toolbar: toolbar ? CustomToolbar : null,
            noRowsOverlay: () => (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </Box>
            ),
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': {
              cursor: onRowClick ? 'pointer' : 'default',
              backgroundColor: onRowClick ? 'action.hover' : undefined,
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
          {...props}
        />
      </Box>
    </Paper>
  );
}

// Usage example
/*
const columns: GridColDef[] = [
  { field: 'applicationId', headerName: 'Application ID', width: 150 },
  { field: 'customerName', headerName: 'Customer', width: 200 },
  { 
    field: 'amount', 
    headerName: 'Amount', 
    width: 150,
    renderCell: (params) => <CurrencyDisplay amount={params.value} />
  },
  { 
    field: 'status', 
    headerName: 'Status', 
    width: 130,
    renderCell: (params) => <StatusBadge status={params.value} />
  },
];

<DataTable
  rows={applications}
  columns={columns}
  title="Loan Applications"
  onRowClick={(row) => navigate(`/app/los/applications/${row.id}`)}
/>
*/
```

### 4.2 StatCard Component

Dashboard statistics card with trend indicator.

```typescript
// shared/components/data-display/StatCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  loading = false,
  color = 'primary',
}: StatCardProps): React.ReactElement {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography color="text.secondary" variant="caption">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: `${color}.light`,
                color: `${color}.main`,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        
        {trend && (
          <Box display="flex" alignItems="center" mt={2}>
            {trend.positive ? (
              <TrendingUp fontSize="small" color="success" />
            ) : (
              <TrendingDown fontSize="small" color="error" />
            )}
            <Typography
              variant="body2"
              color={trend.positive ? 'success.main' : 'error.main'}
              ml={0.5}
            >
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Typography>
            <Typography variant="body2" color="text.secondary" ml={1}>
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Usage example
/*
<StatCard
  title="Total Disbursements"
  value="৳ 12.5 Cr"
  subtitle="This month"
  trend={{ value: 15.3, label: 'vs last month', positive: true }}
  icon={<AccountBalanceWallet />}
  color="primary"
/>
*/
```

---

## 5. Feedback Components

### 5.1 ConfirmDialog

Reusable confirmation dialog for destructive actions.

```typescript
// shared/components/feedback/ConfirmDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ButtonProps,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: ButtonProps['color'];
  confirmVariant?: ButtonProps['variant'];
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  confirmVariant = 'contained',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps): React.ReactElement {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant={confirmVariant}
          disabled={loading}
          autoFocus
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Usage example
/*
const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  title="Delete Application"
  message="Are you sure you want to delete this loan application? This action cannot be undone."
  confirmLabel="Delete"
  confirmColor="error"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
*/
```

---

## 6. Input Components

### 6.1 FormNIDInput

Specialized input for Bangladesh NID numbers with validation.

```typescript
// shared/components/inputs/FormNIDInput.tsx
import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';

interface FormNIDInputProps extends Omit<TextFieldProps, 'name'> {
  name: string;
  control: Control<any>;
  label?: string;
}

export function FormNIDInput({
  name,
  control,
  label = 'NID Number',
  ...props
}: FormNIDInputProps): React.ReactElement {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: 'NID number is required',
        pattern: {
          value: /^\d{10,17}$/,
          message: 'NID must be 10-17 digits',
        },
      }}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{
            maxLength: 17,
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
        />
      )}
    />
  );
}
```

### 6.2 FormCurrencyInput

Currency input with BDT formatting.

```typescript
// shared/components/inputs/FormCurrency.tsx
import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { TextField, TextFieldProps, InputAdornment } from '@mui/material';

interface FormCurrencyProps extends Omit<TextFieldProps, 'name'> {
  name: string;
  control: Control<any>;
  label?: string;
  min?: number;
  max?: number;
}

export function FormCurrency({
  name,
  control,
  label = 'Amount',
  min = 0,
  max,
  ...props
}: FormCurrencyProps): React.ReactElement {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: 'Amount is required',
        min: { value: min, message: `Minimum amount is ${min}` },
        max: max ? { value: max, message: `Maximum amount is ${max}` } : undefined,
      }}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type="number"
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          InputProps={{
            startAdornment: <InputAdornment position="start">৳</InputAdornment>,
          }}
        />
      )}
    />
  );
}
```

---

## 7. Layout Components

### 7.1 PageHeader

Consistent page header with actions.

```typescript
// shared/components/layout/PageHeader.tsx
import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backPath?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showBackButton = false,
  backPath,
}: PageHeaderProps): React.ReactElement {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box mb={3}>
      {breadcrumbs && (
        <Breadcrumbs sx={{ mb: 2 }}>
          {breadcrumbs.map((item, index) =>
            item.path ? (
              <Link
                key={index}
                color="inherit"
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path!);
                }}
              >
                {item.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {item.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box display="flex" alignItems="center" gap={2}>
          {showBackButton && (
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              size="small"
            >
              Back
            </Button>
          )}
          <Box>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
    </Box>
  );
}
```

---

## 8. Module-Specific Components

### 8.1 Loan Status Timeline

Visual timeline for loan application progress.

```typescript
// modules/los/components/LoanStatusTimeline.tsx
import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Typography, Paper } from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { DateDisplay } from '@/shared/components/common/DateDisplay';

interface TimelineEvent {
  id: string;
  status: string;
  label: string;
  description?: string;
  timestamp?: string;
  user?: string;
  completed: boolean;
  current?: boolean;
}

interface LoanStatusTimelineProps {
  events: TimelineEvent[];
}

export function LoanStatusTimeline({
  events,
}: LoanStatusTimelineProps): React.ReactElement {
  return (
    <Timeline position="alternate">
      {events.map((event, index) => (
        <TimelineItem key={event.id}>
          <TimelineOppositeContent color="text.secondary">
            {event.timestamp && (
              <DateDisplay date={event.timestamp} format="datetime" />
            )}
            {event.user && (
              <Typography variant="caption" display="block">
                by {event.user}
              </Typography>
            )}
          </TimelineOppositeContent>
          
          <TimelineSeparator>
            <TimelineDot
              color={
                event.completed
                  ? 'success'
                  : event.current
                  ? 'primary'
                  : 'grey'
              }
              variant={event.current ? 'filled' : 'outlined'}
            >
              {event.completed ? (
                <CheckCircle fontSize="small" />
              ) : event.current ? (
                <Pending fontSize="small" />
              ) : (
                <RadioButtonUnchecked fontSize="small" />
              )}
            </TimelineDot>
            {index < events.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          
          <TimelineContent>
            <Paper elevation={event.current ? 2 : 0} sx={{ p: 2 }}>
              <Typography variant="h6" component="span">
                {event.label}
              </Typography>
              {event.description && (
                <Typography color="text.secondary">
                  {event.description}
                </Typography>
              )}
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
```

---

## 9. Best Practices

### 9.1 Component Design Principles

1. **Single Responsibility**: Each component does one thing well
2. **Composition**: Build complex components from simpler ones
3. **Props Consistency**: Use consistent prop naming across components
4. **Type Safety**: All components must be fully typed
5. **Accessibility**: Follow WCAG 2.1 AA guidelines
6. **Performance**: Use React.memo for expensive renders

### 9.2 Component Checklist

- [ ] Props are fully typed with TypeScript
- [ ] Default props are defined where appropriate
- [ ] Component is exported with named export
- [ ] JSDoc comments for complex props
- [ ] Accessibility attributes included
- [ ] Responsive design considered
- [ ] Loading states handled
- [ ] Error states handled

---

## 10. Appendices

### Appendix A: Icon Reference

| Icon | Usage |
|------|-------|
| Dashboard | Main dashboard |
| Assignment | Loan applications |
| CreditScore | Credit management |
| AccountTree | Workflow |
| Payment | Disbursement |
| AccountBalance | Servicing |
| Collections | Collections module |
| Assessment | Reports |
| Settings | Administration |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
