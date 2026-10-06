# Report Viewer Component

## PDF/Excel Export and Viewer

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Report Viewer Component |
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
2. [Report Viewer](#2-report-viewer)
3. [Export Functionality](#3-export-functionality)
4. [Implementation](#4-implementation)
5. [Related Documents](#5-related-documents)

---

## 1. Executive Summary

This document defines the Report Viewer component for displaying and exporting reports in PDF and Excel formats.

---

## 2. Report Viewer

### 2.1 Report Viewer Component

```typescript
// features/reporting/components/ReportViewer/ReportViewer.tsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Toolbar,
} from '@mui/material';
import { Download, Print, ZoomIn, ZoomOut } from '@mui/icons-material';

interface ReportViewerProps {
  reportUrl: string;
  reportType: 'pdf' | 'excel' | 'csv';
  title: string;
}

export function ReportViewer({ reportUrl, reportType, title }: ReportViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton onClick={handleZoomOut}>
          <ZoomOut />
        </IconButton>
        <Typography sx={{ mx: 2 }}>{zoom}%</Typography>
        <IconButton onClick={handleZoomIn}>
          <ZoomIn />
        </IconButton>
        <IconButton onClick={() => window.print()}>
          <Print />
        </IconButton>
        <IconButton href={reportUrl} download>
          <Download />
        </IconButton>
      </Toolbar>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {reportType === 'pdf' ? (
          <iframe
            src={`${reportUrl}#zoom=${zoom}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          />
        ) : (
          <Typography>
            Preview not available for {reportType.toUpperCase()} files.
            Please download to view.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
```

---

## 3. Export Functionality

### 3.1 Export Button Component

```typescript
// features/reporting/components/ExportButton/ExportButton.tsx
import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Download, PictureAsPdf, TableChart, InsertDriveFile } from '@mui/icons-material';

type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
}

export function ExportButton({ onExport, loading }: ExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={loading}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdf />
          </ListItemIcon>
          <ListItemText primary="Export as PDF" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <TableChart />
          </ListItemIcon>
          <ListItemText primary="Export as Excel" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <InsertDriveFile />
          </ListItemIcon>
          <ListItemText primary="Export as CSV" />
        </MenuItem>
      </Menu>
    </>
  );
}
```

---

## 4. Implementation

### 4.1 Report Generation Hook

```typescript
// features/reporting/hooks/useReportExport.ts
import { useState, useCallback } from 'react';
import { useSnackbar } from '../../../components/feedback/SnackbarProvider';

export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { showSuccess, showError } = useSnackbar();

  const exportReport = useCallback(
    async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
      setIsExporting(true);
      try {
        const response = await fetch(`/api/reports/${reportId}/export?format=${format}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        showSuccess('Report exported successfully');
      } catch (error) {
        showError('Failed to export report');
      } finally {
        setIsExporting(false);
      }
    },
    [showSuccess, showError]
  );

  return { exportReport, isExporting };
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
