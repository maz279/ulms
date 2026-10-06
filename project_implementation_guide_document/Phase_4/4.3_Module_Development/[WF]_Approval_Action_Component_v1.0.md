# Approval Action Component
## ULMS v2.0 Approval Actions

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Approval Action Component |
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
interface ApprovalActionProps {
  taskId: string;
  onComplete: () => void;
}

export function ApprovalAction({ taskId, onComplete }: ApprovalActionProps): React.ReactElement {
  const [action, setAction] = useState<'approve' | 'reject' | 'return'>();
  const [comment, setComment] = useState('');
  const [performAction] = usePerformApprovalActionMutation();

  const handleSubmit = async () => {
    await performAction({ taskId, action, comment });
    onComplete();
  };

  return (
    <Box>
      <ButtonGroup>
        <Button onClick={() => setAction('approve')}>Approve</Button>
        <Button onClick={() => setAction('reject')}>Reject</Button>
        <Button onClick={() => setAction('return')}>Return</Button>
      </ButtonGroup>
      <TextField
        multiline
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Enter comments..."
      />
      <Button onClick={handleSubmit}>Submit</Button>
    </Box>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
