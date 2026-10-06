# Data Grid Implementation with MUI
## ULMS v2.0 Data Grid Components

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Data Grid Implementation with MUI |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Frontend Developer | Initial implementation guide |

---

## Table of Contents

1. [Data Grid Overview](#1-data-grid-overview)
2. [Basic Data Grid](#2-basic-data-grid)
3. [Advanced Data Grid Features](#3-advanced-data-grid-features)
4. [Server-Side Operations](#4-server-side-operations)
5. [Custom Renderers](#5-custom-renderers)
6. [Row Actions](#6-row-actions)
7. [Selection and Bulk Actions](#7-selection-and-bulk-actions)
8. [Export Functionality](#8-export-functionality)
9. [Best Practices](#9-best-practices)
10. [Appendices](#10-appendices)

---

## 1. Data Grid Overview

### 1.1 MUI X Data Grid

| Feature | Description |
|---------|-------------|
| Pagination | Client and server-side pagination |
| Sorting | Multi-column sorting |
| Filtering | Column filters with custom operators |
| Selection | Single and multi-row selection |
| Editing | Cell and row editing modes |
| Export | CSV, Excel, and Print export |
| Virtualization | Handle 100k+ rows efficiently |

### 1.2 Installation

```bash
npm install @mui/x-data-grid @mui/x-data-grid-pro
```

---

## 2. Basic Data Grid

### 2.1 Loan Application Data Grid

```typescript
// modules/los/components/LoanApplicationDataGrid.tsx
import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CurrencyDisplay } from '@/shared/components/common/CurrencyDisplay';
import { DateDisplay } from '@/shared/components/common/DateDisplay';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import type { LoanApplication } from '@/shared/types/loan.types';

interface LoanApplicationDataGridProps {
  rows: LoanApplication[];
  loading?: boolean;
  rowCount?: number;
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onSortModelChange: (model: GridSortModel) => void;
  onDelete?: (id: string) => void;
}

export function LoanApplicationDataGrid({
  rows,
  loading = false,
  rowCount,
  paginationModel,
  sortModel,
  onPaginationModelChange,
  onSortModelChange,
  onDelete,
}: LoanApplicationDataGridProps): React.ReactElement {
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    {
      field: 'applicationId',
      headerName: 'Application ID',
      width: 150,
      sortable: true,
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 200,
      sortable: true,
    },
    {
      field: 'productName',
      headerName: 'Product',
      width: 150,
      sortable: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <CurrencyDisplay amount={params.value} />
      ),
    },
    {
      field: 'tenor',
      headerName: 'Tenor',
      width: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => `${params.value} months`,
    },
    {
      field: 'interestRate',
      headerName: 'Rate',
      width: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => `${params.value}%`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <StatusBadge status={params.value} />
      ),
    },
    {
      field: 'submissionDate',
      headerName: 'Submitted',
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <DateDisplay date={params.value} format="short" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => navigate(`/app/los/applications/${params.row.id}`)}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/app/los/applications/${params.row.id}/edit`)}
              disabled={params.row.status !== 'draft'}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          {onDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(params.row.id)}
                disabled={params.row.status !== 'draft'}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      rowCount={rowCount}
      paginationModel={paginationModel}
      sortModel={sortModel}
      onPaginationModelChange={onPaginationModelChange}
      onSortModelChange={onSortModelChange}
      pageSizeOptions={[10, 20, 50, 100]}
      paginationMode="server"
      sortingMode="server"
      disableRowSelectionOnClick
      density="compact"
      sx={{
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer',
        },
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
      }}
    />
  );
}
```

---

## 3. Advanced Data Grid Features

### 3.1 Loan Classification Color Coding

```typescript
// modules/reporting/components/LoanClassificationDataGrid.tsx
import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Chip, Box, LinearProgress } from '@mui/material';
import type { LoanClassification } from '@/shared/types/loan.types';

const classificationColors: Record<string, { bg: string; color: string }> = {
  STD_0: { bg: '#e8f5e9', color: '#2e7d32' },
  STD_1: { bg: '#c8e6c9', color: '#388e3c' },
  STD_2: { bg: '#a5d6a7', color: '#43a047' },
  SMA: { bg: '#ffe0b2', color: '#ef6c00' },
  SS: { bg: '#ffccbc', color: '#d84315' },
  DF: { bg: '#ffcdd2', color: '#c62828' },
  BL: { bg: '#ef9a9a', color: '#b71c1c' },
};

const classificationLabels: Record<string, string> = {
  STD_0: 'Standard (Current)',
  STD_1: 'Standard (Watch)',
  STD_2: 'Standard (Caution)',
  SMA: 'Special Mention',
  SS: 'Substandard',
  DF: 'Doubtful',
  BL: 'Bad/Loss',
};

interface LoanClassificationDataGridProps {
  rows: LoanClassification[];
  loading?: boolean;
}

export function LoanClassificationDataGrid({
  rows,
  loading = false,
}: LoanClassificationDataGridProps): React.ReactElement {
  const columns: GridColDef[] = [
    {
      field: 'accountNo',
      headerName: 'Account No',
      width: 150,
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 200,
    },
    {
      field: 'classification',
      headerName: 'Classification',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const style = classificationColors[params.value];
        return (
          <Chip
            label={classificationLabels[params.value]}
            size="small"
            sx={{
              backgroundColor: style?.bg,
              color: style?.color,
              fontWeight: 600,
              border: `1px solid ${style?.color}`,
            }}
          />
        );
      },
    },
    {
      field: 'dpd',
      headerName: 'DPD',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const dpd = params.value;
        let color = 'success';
        if (dpd > 30) color = 'warning';
        if (dpd > 90) color = 'error';
        
        return (
          <Box sx={{ width: '100%' }}>
            <Chip
              label={`${dpd} days`}
              size="small"
              color={color as 'success' | 'warning' | 'error'}
            />
          </Box>
        );
      },
    },
    {
      field: 'outstanding',
      headerName: 'Outstanding',
      width: 150,
      type: 'number',
      valueFormatter: (params) => {
        return `৳ ${(params.value / 100000).toFixed(2)} Lakhs`;
      },
    },
    {
      field: 'provision',
      headerName: 'Provision Required',
      width: 150,
      type: 'number',
      valueFormatter: (params) => {
        return `৳ ${(params.value / 100000).toFixed(2)} Lakhs`;
      },
    },
    {
      field: 'provisionRate',
      headerName: 'Provision %',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const rate = params.value;
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>{rate}%</span>
            </Box>
            <LinearProgress
              variant="determinate"
              value={rate}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    rate <= 1 ? '#4caf50' :
                    rate <= 5 ? '#ff9800' :
                    rate <= 20 ? '#ff5722' :
                    rate <= 50 ? '#f44336' : '#b71c1c',
                },
              }}
            />
          </Box>
        );
      },
    },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      pageSizeOptions={[25, 50, 100]}
      initialState={{
        pagination: {
          paginationModel: { pageSize: 25 },
        },
      }}
      density="compact"
      disableRowSelectionOnClick
    />
  );
}
```

---

## 4. Server-Side Operations

### 4.1 Server-Side Pagination Hook

```typescript
// shared/hooks/useServerSideDataGrid.ts
import { useState, useCallback } from 'react';
import { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

interface UseServerSideDataGridProps {
  defaultPageSize?: number;
}

interface UseServerSideDataGridReturn {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleSortModelChange: (model: GridSortModel) => void;
}

export function useServerSideDataGrid({
  defaultPageSize = 20,
}: UseServerSideDataGridProps = {}): UseServerSideDataGridReturn {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: defaultPageSize,
  });
  
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model);
  }, []);

  return {
    paginationModel,
    sortModel,
    handlePaginationModelChange,
    handleSortModelChange,
  };
}
```

### 4.2 RTK Query Integration

```typescript
// modules/los/components/LoanApplicationList.tsx
import React from 'react';
import { Paper, Typography } from '@mui/material';
import { LoanApplicationDataGrid } from './LoanApplicationDataGrid';
import { useServerSideDataGrid } from '@/shared/hooks/useServerSideDataGrid';
import { useGetLoanApplicationsQuery } from '@/services/api/loanApi';

export function LoanApplicationList(): React.ReactElement {
  const { paginationModel, sortModel, handlePaginationModelChange, handleSortModelChange } =
    useServerSideDataGrid();

  const { data, isLoading, isFetching } = useGetLoanApplicationsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sortModel[0]?.field,
    sortOrder: sortModel[0]?.sort,
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Loan Applications
      </Typography>
      <LoanApplicationDataGrid
        rows={data?.items || []}
        loading={isLoading || isFetching}
        rowCount={data?.total || 0}
        paginationModel={paginationModel}
        sortModel={sortModel}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={handleSortModelChange}
      />
    </Paper>
  );
}
```

---

## 5. Custom Renderers

### 5.1 Approval Status with Timeline

```typescript
// modules/workflow/components/ApprovalQueueDataGrid.tsx
import React from 'react';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, LinearProgress, Tooltip, Typography } from '@mui/material';
import { Schedule, CheckCircle, Error } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const slaStatusRenderer = (params: GridRenderCellParams) => {
  const { slaDeadline, slaPercentage } = params.row;
  const isOverdue = new Date(slaDeadline) < new Date();
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        {isOverdue ? (
          <Error color="error" fontSize="small" sx={{ mr: 0.5 }} />
        ) : slaPercentage > 80 ? (
          <Schedule color="warning" fontSize="small" sx={{ mr: 0.5 }} />
        ) : (
          <CheckCircle color="success" fontSize="small" sx={{ mr: 0.5 }} />
        )}
        <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
          {isOverdue
            ? `Overdue by ${formatDistanceToNow(new Date(slaDeadline))}`
            : `Due in ${formatDistanceToNow(new Date(slaDeadline))}`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(slaPercentage, 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: isOverdue
              ? '#f44336'
              : slaPercentage > 80
              ? '#ff9800'
              : '#4caf50',
          },
        }}
      />
    </Box>
  );
};

export const approvalQueueColumns: GridColDef[] = [
  {
    field: 'taskId',
    headerName: 'Task ID',
    width: 120,
  },
  {
    field: 'applicationId',
    headerName: 'Application',
    width: 150,
  },
  {
    field: 'customerName',
    headerName: 'Customer',
    width: 200,
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 150,
    type: 'number',
    valueFormatter: (params) => `৳ ${(params.value / 100000).toFixed(2)}L`,
  },
  {
    field: 'slaStatus',
    headerName: 'SLA Status',
    width: 200,
    renderCell: slaStatusRenderer,
  },
  {
    field: 'pendingWith',
    headerName: 'Pending With',
    width: 180,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={params.row.pendingWithRole}>
        <span>{params.value}</span>
      </Tooltip>
    ),
  },
];
```

---

## 6. Row Actions

### 6.1 Action Menu Pattern

```typescript
// shared/components/data-grid/RowActionsMenu.tsx
import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Print,
  Download,
} from '@mui/icons-material';

interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface RowActionsMenuProps {
  actions: ActionItem[];
}

export function RowActionsMenu({ actions }: RowActionsMenuProps): React.ReactElement {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: ActionItem) => {
    action.onClick();
    handleClose();
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 150 },
        }}
      >
        {actions.map((action) => (
          <React.Fragment key={action.id}>
            <MenuItem
              onClick={() => handleAction(action)}
              disabled={action.disabled}
            >
              {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
            {action.divider && <Divider />}
          </React.Fragment>
        ))}
      </Menu>
    </>
  );
}

// Usage in DataGrid
const getRowActions = (row: LoanApplication): ActionItem[] => [
  {
    id: 'view',
    label: 'View',
    icon: <Visibility fontSize="small" />,
    onClick: () => navigate(`/app/los/applications/${row.id}`),
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: <Edit fontSize="small" />,
    onClick: () => navigate(`/app/los/applications/${row.id}/edit`),
    disabled: row.status !== 'draft',
  },
  {
    id: 'print',
    label: 'Print',
    icon: <Print fontSize="small" />,
    onClick: () => handlePrint(row.id),
    divider: true,
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Delete fontSize="small" color="error" />,
    onClick: () => handleDelete(row.id),
    disabled: row.status !== 'draft',
  },
];
```

---

## 7. Selection and Bulk Actions

### 7.1 Bulk Action Toolbar

```typescript
// shared/components/data-grid/BulkActionToolbar.tsx
import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Delete, Download, CheckCircle } from '@mui/icons-material';

interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  color?: 'primary' | 'secondary' | 'error' | 'success';
}

interface BulkActionToolbarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  actions,
  onClearSelection,
}: BulkActionToolbarProps): React.ReactElement {
  if (selectedCount === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        mb: 2,
        bgcolor: 'primary.light',
        borderRadius: 1,
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Chip
          label={`${selectedCount} selected`}
          color="primary"
          onDelete={onClearSelection}
        />
        <Box display="flex" gap={1}>
          {actions.map((action) => (
            <Button
              key={action.id}
              size="small"
              startIcon={action.icon}
              color={action.color || 'primary'}
              variant="contained"
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Box>
      <Button size="small" onClick={onClearSelection}>
        Clear Selection
      </Button>
    </Box>
  );
}

// Usage with DataGrid
export function LoanApplicationListWithBulkActions(): React.ReactElement {
  const [selectionModel, setSelectionModel] = React.useState<string[]>([]);

  const bulkActions: BulkAction[] = [
    {
      id: 'approve',
      label: 'Approve Selected',
      icon: <CheckCircle />,
      color: 'success',
      onClick: (ids) => handleBulkApprove(ids),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download />,
      onClick: (ids) => handleBulkExport(ids),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Delete />,
      color: 'error',
      onClick: (ids) => handleBulkDelete(ids),
    },
  ];

  return (
    <>
      <BulkActionToolbar
        selectedCount={selectionModel.length}
        actions={bulkActions}
        onClearSelection={() => setSelectionModel([])}
      />
      <DataGrid
        checkboxSelection
        disableRowSelectionOnClick={false}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        // ... other props
      />
    </>
  );
}
```

---

## 8. Export Functionality

### 8.1 CSV Export with Custom Formatting

```typescript
// shared/utils/exportUtils.ts
import { GridColDef, GridValidRowModel } from '@mui/x-data-grid';

interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
}

export function exportToCSV<R extends GridValidRowModel>(
  rows: R[],
  columns: GridColDef<R>[],
  options: ExportOptions = {}
): void {
  const { filename = 'export.csv', includeHeaders = true } = options;

  // Get visible columns with value getter
  const visibleColumns = columns.filter((col) => !col.hide);

  // Build headers
  const headers = includeHeaders
    ? visibleColumns.map((col) => col.headerName || col.field).join(',')
    : '';

  // Build rows
  const csvRows = rows.map((row) => {
    return visibleColumns
      .map((col) => {
        let value: unknown;

        // Use valueGetter if available
        if (col.valueGetter) {
          value = col.valueGetter(row[col.field as keyof R], row, col, {});
        } else {
          value = row[col.field as keyof R];
        }

        // Format value
        if (col.valueFormatter) {
          value = col.valueFormatter(value as never, row, col, {});
        }

        // Escape and quote if needed
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // Combine and download
  const csvContent = [headers, ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
```

---

## 9. Best Practices

### 9.1 Performance Guidelines

1. **Use Virtualization**: For grids with >100 rows
2. **Server-Side Operations**: For large datasets
3. **Memoize Columns**: Prevent unnecessary re-renders
4. **Lazy Load Data**: Use pagination and infinite scroll

### 9.2 Accessibility

1. **Keyboard Navigation**: Ensure full keyboard support
2. **Screen Readers**: Proper ARIA labels
3. **Color Contrast**: Maintain WCAG 2.1 AA standards
4. **Focus Management**: Clear focus indicators

---

## 10. Appendices

### Appendix A: Common Column Types

| Type | Renderer | Example |
|------|----------|---------|
| Currency | CurrencyDisplay | loan amount |
| Date | DateDisplay | submission date |
| Status | StatusBadge | application status |
| Percentage | LinearProgress | SLA percentage |
| Actions | IconButtons | view/edit/delete |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
