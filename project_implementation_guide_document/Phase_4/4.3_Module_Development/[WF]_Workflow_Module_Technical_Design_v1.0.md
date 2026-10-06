# Workflow Module Technical Design
## ULMS v2.0 Approval Workflow System

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow Module Technical Design |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Module Overview

The Workflow Module manages multi-level approval hierarchies for loan applications based on amount thresholds and user roles.

### 1.1 Approval Matrix

| Amount Range | Approver | Limit |
|-------------|----------|-------|
| ≤ 5 Lakhs | Branch Credit Head | 5L |
| 5L - 10L | Branch Manager | 10L |
| 10L - 25L | Regional Manager | 25L |
| 25L - 1Cr | Head of Credit | 1Cr |
| 1Cr - 5Cr | Credit Committee | 5Cr |
| 5Cr - 10Cr | Deputy MD | 10Cr |
| > 10Cr | Managing Director | Unlimited |

---

## 2. Components

### 2.1 Approval Queue

```typescript
// ApprovalQueue.tsx
export function ApprovalQueue(): React.ReactElement {
  const { data: tasks, isLoading } = useGetPendingApprovalsQuery();
  const [performAction] = usePerformApprovalActionMutation();

  const columns: GridColDef[] = [
    { field: 'applicationId', headerName: 'Application', width: 150 },
    { field: 'customerName', headerName: 'Customer', width: 200 },
    { field: 'amount', headerName: 'Amount', type: 'number', width: 150 },
    { field: 'slaRemaining', headerName: 'SLA', width: 150 },
    { 
      field: 'actions', 
      headerName: 'Actions',
      renderCell: (params) => (
        <ActionButtons
          onApprove={() => performAction({ taskId: params.row.id, action: 'APPROVE' })}
          onReject={() => performAction({ taskId: params.row.id, action: 'REJECT' })}
          onReturn={() => performAction({ taskId: params.row.id, action: 'RETURN' })}
        />
      )
    },
  ];

  return <DataGrid rows={tasks || []} columns={columns} loading={isLoading} />;
}
```

### 2.2 Loan Proposal Viewer

```typescript
// LoanProposalViewer.tsx
interface LoanProposalViewerProps {
  applicationId: string;
}

export function LoanProposalViewer({ applicationId }: LoanProposalViewerProps): React.ReactElement {
  const { data: proposal } = useGetLoanProposalQuery(applicationId);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Loan Proposal</Typography>
        <ProposalSection title="Customer Details" data={proposal?.customer} />
        <ProposalSection title="Loan Details" data={proposal?.loan} />
        <ProposalSection title="CIB Summary" data={proposal?.cibSummary} />
        <ProposalSection title="Credit Score" data={proposal?.creditScore} />
        <ProposalSection title="Recommendation" data={proposal?.recommendation} />
      </CardContent>
    </Card>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
