# Approval Action Component

## Workflow Approval Actions UI

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Approval Action Component |
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
2. [Action Types](#2-action-types)
3. [Component Design](#3-component-design)
4. [Approval Form](#4-approval-form)
5. [Confirmation Dialogs](#5-confirmation-dialogs)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines the Approval Action component for workflow task decisions including approve, reject, defer, and request information actions.

---

## 2. Action Types

| Action | Description | Required Fields |
|--------|-------------|-----------------|
| **Approve** | Approve the loan application | Approved amount, interest rate, remarks |
| **Reject** | Reject the application | Reject reason, remarks |
| **Defer** | Postpone decision | Defer reason, review date |
| **Request Info** | Ask for more information | Information required, remarks |
| **Escalate** | Send to higher authority | Escalation reason, remarks |

---

## 3. Component Design

### 3.1 Approval Actions Component

```typescript
// features/workflow/components/ApprovalActions/ApprovalActions.tsx
import { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { CheckCircle, Cancel, Schedule, Info, TrendingUp } from '@mui/icons-material';

type ActionType = 'approve' | 'reject' | 'defer' | 'request-info' | 'escalate';

interface ApprovalActionsProps {
  onApprove: (data: ApprovalData) => void;
  onReject: (data: RejectionData) => void;
  onDefer: (data: DeferData) => void;
  onRequestInfo: (data: RequestInfoData) => void;
  onEscalate: (data: EscalationData) => void;
}

export function ApprovalActions(props: ApprovalActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);

  const actions: { type: ActionType; label: string; icon: React.ReactNode; color: any }[] = [
    { type: 'approve', label: 'Approve', icon: <CheckCircle />, color: 'success' },
    { type: 'reject', label: 'Reject', icon: <Cancel />, color: 'error' },
    { type: 'defer', label: 'Defer', icon: <Schedule />, color: 'warning' },
    { type: 'request-info', label: 'Request Info', icon: <Info />, color: 'info' },
    { type: 'escalate', label: 'Escalate', icon: <TrendingUp />, color: 'secondary' },
  ];

  return (
    <>
      <ButtonGroup variant="outlined" fullWidth>
        {actions.map((action) => (
          <Button
            key={action.type}
            startIcon={action.icon}
            color={action.color}
            onClick={() => setActiveAction(action.type)}
          >
            {action.label}
          </Button>
        ))}
      </ButtonGroup>

      <ActionDialog
        action={activeAction}
        open={!!activeAction}
        onClose={() => setActiveAction(null)}
        onSubmit={(data) => {
          handleSubmit(activeAction!, data);
          setActiveAction(null);
        }}
      />
    </>
  );
}
```

---

## 4. Approval Form

### 4.1 Approve Form

```typescript
// features/workflow/components/ApprovalActions/ApproveForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Grid } from '@mui/material';
import { FormInput } from '../../../../components/forms/FormInput';
import { approvalSchema } from '../../schemas/approvalSchema';

interface ApproveFormProps {
  onSubmit: (data: any) => void;
  defaultAmount?: number;
}

export function ApproveForm({ onSubmit, defaultAmount }: ApproveFormProps) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      approvedAmount: defaultAmount,
      interestRate: '',
      tenureMonths: '',
      remarks: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormInput
            name="approvedAmount"
            control={control}
            label="Approved Amount (BDT)"
            type="number"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormInput
            name="interestRate"
            control={control}
            label="Interest Rate (%)"
            type="number"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormInput
            name="tenureMonths"
            control={control}
            label="Tenure (Months)"
            type="number"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormInput
            name="remarks"
            control={control}
            label="Remarks"
            multiline
            rows={3}
            required
          />
        </Grid>
      </Grid>
    </form>
  );
}
```

### 4.2 Reject Form

```typescript
// features/workflow/components/ApprovalActions/RejectForm.tsx
import { useForm } from 'react-hook-form';
import { Grid } from '@mui/material';
import { FormInput } from '../../../../components/forms/FormInput';
import { FormSelect } from '../../../../components/forms/FormSelect';

const rejectReasons = [
  { value: 'INSUFFICIENT_INCOME', label: 'Insufficient Income' },
  { value: 'POOR_CREDIT_HISTORY', label: 'Poor Credit History' },
  { value: 'INCOMPLETE_DOCUMENTATION', label: 'Incomplete Documentation' },
  { value: 'HIGH_DEBT_BURDEN', label: 'High Debt Burden' },
  { value: 'COLLATERAL_INSUFFICIENT', label: 'Insufficient Collateral' },
  { value: 'OTHER', label: 'Other' },
];

export function RejectForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      reason: '',
      otherReason: '',
      remarks: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormSelect
            name="reason"
            control={control}
            label="Reject Reason"
            options={rejectReasons}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormInput
            name="remarks"
            control={control}
            label="Detailed Remarks"
            multiline
            rows={3}
            required
          />
        </Grid>
      </Grid>
    </form>
  );
}
```

---

## 5. Confirmation Dialogs

```typescript
// features/workflow/components/ApprovalActions/ConfirmationDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: 'primary' | 'error' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = 'primary',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[WF]_Workflow_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
