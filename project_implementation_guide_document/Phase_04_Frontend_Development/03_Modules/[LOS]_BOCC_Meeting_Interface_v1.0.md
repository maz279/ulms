# BOCC Meeting Interface

## Branch Officers Credit Committee Interface

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | BOCC Meeting Interface |
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
2. [BOCC Interface Overview](#2-bocc-interface-overview)
3. [Meeting Management](#3-meeting-management)
4. [Application Review](#4-application-review)
5. [Decision Recording](#5-decision-recording)
6. [Implementation](#6-implementation)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document defines the Branch Officers Credit Committee (BOCC) meeting interface for ULMS v2.0, enabling branch-level credit committees to review and approve loan applications within delegated authority limits.

---

## 2. BOCC Interface Overview

### 2.1 BOCC Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOCC Meeting Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Schedule │───▶│  Queue   │───▶│  Review  │───▶│ Decision │  │
│  │ Meeting  │    │   Apps   │    │   Apps   │    │  Record  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Meeting Management

### 3.1 Meeting Scheduler Component

```typescript
// features/los/components/BOCCInterface/MeetingScheduler.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Grid,
  TextField,
  Autocomplete
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useScheduleBOCCMeetingMutation } from '../../api/losApi';

interface MeetingSchedulerProps {
  open: boolean;
  onClose: () => void;
}

export function MeetingScheduler({ open, onClose }: MeetingSchedulerProps) {
  const [scheduleMeeting] = useScheduleBOCCMeetingMutation();
  
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      meetingDate: new Date(),
      location: '',
      agenda: '',
      members: [],
    },
  });

  const onSubmit = async (data: any) => {
    await scheduleMeeting(data).unwrap();
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Schedule BOCC Meeting</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="meetingDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    {...field}
                    label="Meeting Date & Time"
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                {...register('location')}
                label="Location"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register('agenda')}
                label="Agenda"
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={committeeMembers}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField {...params} label="Committee Members" />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Schedule Meeting
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

---

## 4. Application Review

### 4.1 BOCC Application Queue

```typescript
// features/los/components/BOCCInterface/BOCCQueue.tsx
import { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, Button } from '@mui/material';
import { useGetBOCCApplicationsQuery } from '../../api/losApi';

const columns: GridColDef[] = [
  { field: 'applicationId', headerName: 'Application ID', width: 150 },
  { field: 'applicantName', headerName: 'Applicant', width: 200 },
  { field: 'loanAmount', headerName: 'Amount (BDT)', width: 150, type: 'number' },
  { field: 'loanType', headerName: 'Type', width: 120 },
  { 
    field: 'priority', 
    headerName: 'Priority', 
    width: 100,
    renderCell: (params) => (
      <Chip 
        label={params.value} 
        color={params.value === 'HIGH' ? 'error' : 'default'}
        size="small"
      />
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: (params) => (
      <Button 
        size="small" 
        variant="outlined"
        onClick={() => onReview(params.row)}
      >
        Review
      </Button>
    ),
  },
];

export function BOCCQueue({ onReview }: { onReview: (app: any) => void }) {
  const { data, isLoading } = useGetBOCCApplicationsQuery();

  return (
    <Box sx={{ height: 500 }}>
      <DataGrid
        rows={data || []}
        columns={columns}
        loading={isLoading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
      />
    </Box>
  );
}
```

---

## 5. Decision Recording

### 5.1 Decision Form

```typescript
// features/los/components/BOCCInterface/DecisionForm.tsx
import { useForm } from 'react-hook-form';
import { 
  Box, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel,
  Radio,
  TextField,
  Button
} from '@mui/material';
import { useRecordBOCCDecisionMutation } from '../../api/losApi';

interface DecisionFormProps {
  applicationId: string;
  onComplete: () => void;
}

export function DecisionForm({ applicationId, onComplete }: DecisionFormProps) {
  const [recordDecision] = useRecordBOCCDecisionMutation();
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      decision: '',
      approvedAmount: '',
      interestRate: '',
      tenureMonths: '',
      remarks: '',
    },
  });

  const decision = watch('decision');

  const onSubmit = async (data: any) => {
    await recordDecision({
      applicationId,
      ...data,
    }).unwrap();
    onComplete();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">Decision</FormLabel>
        <RadioGroup row {...register('decision')}>
          <FormControlLabel value="APPROVED" control={<Radio />} label="Approve" />
          <FormControlLabel value="REJECTED" control={<Radio />} label="Reject" />
          <FormControlLabel value="DEFERRED" control={<Radio />} label="Defer" />
        </RadioGroup>
      </FormControl>

      {decision === 'APPROVED' && (
        <>
          <TextField
            {...register('approvedAmount')}
            label="Approved Amount (BDT)"
            type="number"
            fullWidth
            margin="normal"
          />
          <TextField
            {...register('interestRate')}
            label="Interest Rate (%)"
            type="number"
            fullWidth
            margin="normal"
          />
          <TextField
            {...register('tenureMonths')}
            label="Tenure (Months)"
            type="number"
            fullWidth
            margin="normal"
          />
        </>
      )}

      <TextField
        {...register('remarks')}
        label="Remarks"
        multiline
        rows={3}
        fullWidth
        margin="normal"
      />

      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Record Decision
      </Button>
    </Box>
  );
}
```

---

## 6. Implementation

### 6.1 BOCC Page

```typescript
// features/los/pages/BOCCMeetingPage.tsx
import { useState } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { BOCCQueue } from '../components/BOCCInterface/BOCCQueue';
import { MeetingScheduler } from '../components/BOCCInterface/MeetingScheduler';
import { DecisionForm } from '../components/BOCCInterface/DecisionForm';
import { ApplicationReviewPanel } from '../components/BOCCInterface/ApplicationReviewPanel';

export function BOCCMeetingPage() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">BOCC Meeting</Typography>
        <Button 
          variant="contained" 
          onClick={() => setSchedulerOpen(true)}
        >
          Schedule Meeting
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Applications for Review
            </Typography>
            <BOCCQueue onReview={setSelectedApplication} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {selectedApplication ? (
            <Paper sx={{ p: 2 }}>
              <ApplicationReviewPanel application={selectedApplication} />
              <Box sx={{ mt: 2 }}>
                <DecisionForm 
                  applicationId={selectedApplication.id}
                  onComplete={() => setSelectedApplication(null)}
                />
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Select an application to review
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <MeetingScheduler 
        open={schedulerOpen} 
        onClose={() => setSchedulerOpen(false)} 
      />
    </Box>
  );
}
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[LOS]_LOS_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
