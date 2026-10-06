# Approval Queue Interface
## ULMS v2.0 Workflow Pending Approvals

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Approval Queue Interface |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Queue Interface

```typescript
export function ApprovalQueue(): React.ReactElement {
  const { data: tasks } = useGetPendingApprovalsQuery();
  const [performAction] = usePerformApprovalActionMutation();

  const columns: GridColDef[] = [
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'slaRemaining', headerName: 'SLA', width: 150 },
    { field: 'applicationId', headerName: 'Application', width: 150 },
    { field: 'customerName', headerName: 'Customer', width: 200 },
    { field: 'amount', headerName: 'Amount', type: 'number', width: 150 },
    { 
      field: 'actions', 
      headerName: 'Actions',
      renderCell: (params) => (
        <Box>
          <Button onClick={() => handleApprove(params.row.id)}>Approve</Button>
          <Button onClick={() => handleReject(params.row.id)}>Reject</Button>
          <Button onClick={() => handleReturn(params.row.id)}>Return</Button>
        </Box>
      )
    },
  ];

  return <DataGrid rows={tasks || []} columns={columns} />;
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
