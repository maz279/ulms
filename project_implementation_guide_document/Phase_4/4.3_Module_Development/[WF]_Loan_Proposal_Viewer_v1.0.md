# Loan Proposal Viewer
## ULMS v2.0 Proposal Display

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Loan Proposal Viewer |
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
interface LoanProposalViewerProps {
  applicationId: string;
}

export function LoanProposalViewer({ applicationId }: LoanProposalViewerProps): React.ReactElement {
  const { data: proposal } = useGetLoanProposalQuery(applicationId);
  
  return (
    <Box>
      <CustomerSection customer={proposal?.customer} />
      <LoanDetailsSection loan={proposal?.loan} />
      <CIBSummarySection cib={proposal?.cib} />
      <CreditScoreSection score={proposal?.creditScore} />
      <RecommendationSection recommendation={proposal?.recommendation} />
    </Box>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
