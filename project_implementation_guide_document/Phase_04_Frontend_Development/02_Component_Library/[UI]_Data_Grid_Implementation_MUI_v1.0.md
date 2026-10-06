# Data Grid Implementation with MUI

## MUI DataGrid Configuration for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Data Grid Implementation with MUI |
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
2. [DataGrid Configuration](#2-datagrid-configuration)
3. [Column Definitions](#3-column-definitions)
4. [Pagination and Sorting](#4-pagination-and-sorting)
5. [Row Actions](#5-row-actions)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document specifies the MUI DataGrid implementation for ULMS v2.0, providing patterns for displaying tabular banking data with sorting, filtering, and pagination.

---

## 2. DataGrid Configuration

### 2.1 Basic DataGrid Setup

```typescript
// components/data-display/DataTable/DataTable.tsx
import { DataGrid, DataGridProps, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';

interface DataTableProps<T> extends Omit<DataGridProps, 'rows' | 'columns'> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  rowCount?: number;
  paginationMode?: 'client' | 'server';
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  rowCount,
  paginationMode = 'client',
  ...props
}: DataTableProps<T>) {
  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationMode={paginationMode}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: 0 },
          },
        }}
        disableRowSelectionOnClick
        slots={{
          loadingOverlay: LinearProgress,
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'grey.100',
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'grey.50',
            cursor: 'pointer',
          },
        }}
        {...props}
      />
    </Box>
  );
}
```

### 2.2 Server-Side DataGrid

```typescript
// features/los/components/LoanApplicationTable/LoanApplicationTable.tsx
import { useState, useCallback } from 'react';
import { DataGrid, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useGetLoanApplicationsQuery } from '../../api/losApi';

const columns: GridColDef[] = [
  { field: 'applicationId', headerName: 'Application ID', width: 150 },
  { field: 'applicantName', headerName: 'Applicant Name', width: 200 },
  { field: 'loanAmount', headerName: 'Loan Amount', width: 150, type: 'number' },
  { field: 'status', headerName: 'Status', width: 150 },
  { field: 'submittedDate', headerName: 'Submitted Date', width: 180 },
];

export function LoanApplicationTable() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const { data, isLoading, isFetching } = useGetLoanApplicationsQuery({
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: sortModel[0]?.field,
    sortDirection: sortModel[0]?.sort,
  });

  const handleRowClick = useCallback((params: GridRowParams) => {
    navigate(`/los/applications/${params.id}`);
  }, []);

  return (
    <DataGrid
      rows={data?.content || []}
      columns={columns}
      rowCount={data?.totalElements || 0}
      loading={isLoading}
      pageSizeOptions={[10, 25, 50, 100]}
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      paginationMode="server"
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      onRowClick={handleRowClick}
      disableRowSelectionOnClick
    />
  );
}
```

---

## 3. Column Definitions

### 3.1 Custom Column Types

```typescript
// utils/datagrid/columnTypes.ts
import { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import { StatusBadge } from '../../components/data-display/StatusBadge';
import { AmountDisplay } from '../../components/data-display/AmountDisplay';

// Currency column formatter
export const currencyColumn = (field: string, headerName: string): GridColDef => ({
  field,
  headerName,
  type: 'number',
  width: 150,
  valueFormatter: (params: GridValueFormatterParams<number>) => {
    if (params.value == null) return '';
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(params.value);
  },
  align: 'right',
  headerAlign: 'right',
});

// Status column with badge
export const statusColumn = (field: string, headerName: string): GridColDef => ({
  field,
  headerName,
  width: 150,
  renderCell: (params) => <StatusBadge status={params.value} />,
});

// Date column formatter
export const dateColumn = (field: string, headerName: string): GridColDef => ({
  field,
  headerName,
  width: 180,
  valueFormatter: (params: GridValueFormatterParams<string>) => {
    if (!params.value) return '';
    return new Date(params.value).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
});
```

---

## 4. Pagination and Sorting

### 4.1 Server-Side Pagination

```typescript
// hooks/useServerSideDataGrid.ts
import { useState, useCallback } from 'react';
import { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

interface UseServerSideDataGridOptions {
  initialPageSize?: number;
}

export function useServerSideDataGrid(options: UseServerSideDataGridOptions = {}) {
  const { initialPageSize = 25 } = options;
  
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const resetPagination = useCallback(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  return {
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    resetPagination,
  };
}
```

---

## 5. Row Actions

### 5.1 Action Column

```typescript
// components/data-display/ActionColumn/ActionColumn.tsx
import { IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert, Visibility, Edit, Delete } from '@mui/icons-material';
import { useState } from 'react';

interface ActionColumnProps {
  row: any;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

export const ActionColumn: React.FC<ActionColumnProps> = ({
  row,
  onView,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {onView && (
          <MenuItem onClick={() => { onView(row); handleClose(); }}>
            <Visibility sx={{ mr: 1 }} /> View
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => { onEdit(row); handleClose(); }}>
            <Edit sx={{ mr: 1 }} /> Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => { onDelete(row); handleClose(); }}>
            <Delete sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_Component_Library_Documentation_v1.0.md` | Component library |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
