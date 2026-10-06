# Report Viewer Component
## ULMS v2.0 Report Display

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Report Viewer Component |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## Component

```typescript
interface ReportViewerProps {
  reportType: 'CL1' | 'CL2' | 'CL3' | 'CL4' | 'CL5';
  dateRange: { start: Date; end: Date };
}

export function ReportViewer({ reportType, dateRange }: ReportViewerProps): React.ReactElement {
  const { data: report, isLoading } = useGenerateReportQuery({ reportType, dateRange });
  
  return (
    <Box>
      <ReportToolbar
        onPrint={() => window.print()}
        onExport={() => exportReport(report)}
      />
      <ReportContent report={report} loading={isLoading} />
    </Box>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
