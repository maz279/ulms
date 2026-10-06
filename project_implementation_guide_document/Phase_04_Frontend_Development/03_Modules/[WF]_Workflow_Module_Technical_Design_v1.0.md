# Workflow Module Technical Design

## Approval Workflow Module Frontend Design

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow Module Technical Design |
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
2. [Module Architecture](#2-module-architecture)
3. [Workflow Engine Integration](#3-workflow-engine-integration)
4. [Approval Queue](#4-approval-queue)
5. [Task Management](#5-task-management)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines the technical design for the Approval Workflow module frontend, integrating with Camunda BPMN for loan approval workflows across BOCC, HOCC, and Board levels.

---

## 2. Module Architecture

### 2.1 Workflow Module Structure

```
features/workflow/
├── api/
│   ├── workflowApi.ts
│   └── taskApi.ts
├── components/
│   ├── ApprovalQueue/
│   ├── TaskCard/
│   ├── WorkflowDiagram/
│   ├── ApprovalActions/
│   └── LoanProposalViewer/
├── hooks/
│   ├── useWorkflow.ts
│   ├── useTasks.ts
│   └── useApprovalActions.ts
├── pages/
│   ├── WorkflowDashboardPage.tsx
│   ├── ApprovalQueuePage.tsx
│   ├── TaskDetailPage.tsx
│   └── WorkflowHistoryPage.tsx
├── types/
│   └── workflow.types.ts
└── routes.ts
```

---

## 3. Workflow Engine Integration

### 3.1 Camunda Integration

```typescript
// features/workflow/api/workflowApi.ts
import { apiSlice } from '../../../services/api/apiSlice';

export const workflowApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Process Instances
    startWorkflow: builder.mutation<WorkflowInstance, StartWorkflowRequest>({
      query: (body) => ({
        url: '/workflow/instances',
        method: 'POST',
        body,
      }),
    }),

    getWorkflowStatus: builder.query<WorkflowStatus, string>({
      query: (instanceId) => `/workflow/instances/${instanceId}/status`,
      providesTags: (result, error, id) => [{ type: 'Workflow', id }],
    }),

    // Tasks
    getTasks: builder.query<Task[], TaskFilterParams>({
      query: (params) => ({
        url: '/workflow/tasks',
        params,
      }),
      providesTags: ['WorkflowTask'],
    }),

    claimTask: builder.mutation<void, { taskId: string }>({
      query: ({ taskId }) => ({
        url: `/workflow/tasks/${taskId}/claim`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkflowTask'],
    }),

    completeTask: builder.mutation<void, CompleteTaskRequest>({
      query: ({ taskId, ...body }) => ({
        url: `/workflow/tasks/${taskId}/complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkflowTask'],
    }),

    // History
    getWorkflowHistory: builder.query<WorkflowEvent[], string>({
      query: (instanceId) => `/workflow/instances/${instanceId}/history`,
    }),
  }),
});

export const {
  useStartWorkflowMutation,
  useGetWorkflowStatusQuery,
  useGetTasksQuery,
  useClaimTaskMutation,
  useCompleteTaskMutation,
  useGetWorkflowHistoryQuery,
} = workflowApi;
```

---

## 4. Approval Queue

### 4.1 Approval Queue Component

```typescript
// features/workflow/components/ApprovalQueue/ApprovalQueue.tsx
import { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Badge,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { useGetTasksQuery } from '../../api/workflowApi';

const tabs = [
  { id: 'pending', label: 'Pending', filter: { status: 'PENDING' } },
  { id: 'claimed', label: 'My Tasks', filter: { status: 'CLAIMED', assignee: 'me' } },
  { id: 'completed', label: 'Completed', filter: { status: 'COMPLETED' } },
];

export function ApprovalQueue() {
  const [activeTab, setActiveTab] = useState(0);
  const { data: tasks, isLoading } = useGetTasksQuery(tabs[activeTab].filter);

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            label={
              <Badge badgeContent={tab.count} color="error">
                {tab.label}
              </Badge>
            }
          />
        ))}
      </Tabs>

      <List>
        {tasks?.map((task) => (
          <ListItem
            key={task.id}
            button
            onClick={() => onSelectTask(task)}
            sx={{
              borderLeft: 3,
              borderColor: getPriorityColor(task.priority),
              mb: 1,
              bgcolor: 'background.paper',
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">
                    {task.applicationId}
                  </Typography>
                  <Chip 
                    label={task.taskType} 
                    size="small" 
                    color="primary" 
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2">{task.applicantName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    BDT {task.loanAmount.toLocaleString()} | {task.createdAt}
                  </Typography>
                </>
              }
            />
            <Chip 
              label={task.priority} 
              color={getPriorityColor(task.priority)} 
              size="small"
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
```

---

## 5. Task Management

### 5.1 Task Detail View

```typescript
// features/workflow/components/TaskDetail/TaskDetail.tsx
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import { useGetTaskDetailQuery, useCompleteTaskMutation } from '../../api/workflowApi';
import { LoanProposalViewer } from '../LoanProposalViewer';
import { ApprovalActions } from '../ApprovalActions';
import { WorkflowTimeline } from '../WorkflowTimeline';

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { data: task } = useGetTaskDetailQuery(taskId);
  const [completeTask] = useCompleteTaskMutation();

  const handleApprove = async (data: ApprovalData) => {
    await completeTask({
      taskId,
      decision: 'APPROVE',
      ...data,
    }).unwrap();
  };

  const handleReject = async (data: ApprovalData) => {
    await completeTask({
      taskId,
      decision: 'REJECT',
      ...data,
    }).unwrap();
  };

  if (!task) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {task.applicationId} - {task.taskName}
          </Typography>
          
          <LoanProposalViewer applicationId={task.applicationId} />
          
          <Box sx={{ mt: 3 }}>
            <ApprovalActions
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestInfo={() => {}}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Workflow History
          </Typography>
          <WorkflowTimeline instanceId={task.processInstanceId} />
        </Paper>
      </Grid>
    </Grid>
  );
}
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[WF]_Approval_Queue_Interface_v1.0.md` | Queue interface |
| `[WF]_Loan_Proposal_Viewer_v1.0.md` | Proposal viewer |
| `[WF]_Approval_Action_Component_v1.0.md` | Approval actions |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
