# Approval Queue Interface

## Workflow Task Queue UI

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Approval Queue Interface |
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
2. [Queue Layout](#2-queue-layout)
3. [Task Filters](#3-task-filters)
4. [Task Cards](#4-task-cards)
5. [Bulk Actions](#5-bulk-actions)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines the Approval Queue interface for displaying and managing workflow tasks requiring user action.

---

## 2. Queue Layout

### 2.1 Main Queue Component

```typescript
// features/workflow/components/ApprovalQueue/ApprovalQueue.tsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Pagination,
} from '@mui/material';
import { Visibility, AssignmentInd } from '@mui/icons-material';
import { useGetTasksQuery, useClaimTaskMutation } from '../../api/workflowApi';

export function ApprovalQueue() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TaskFilters>({});
  
  const { data, isLoading } = useGetTasksQuery({ page, ...filters });
  const [claimTask] = useClaimTaskMutation();

  const handleClaim = async (taskId: string) => {
    await claimTask({ taskId }).unwrap();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Approval Queue</Typography>
        <TaskFilters onFilterChange={setFilters} />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Application ID</TableCell>
              <TableCell>Applicant</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.tasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>{task.applicationId}</TableCell>
                <TableCell>{task.applicantName}</TableCell>
                <TableCell>
                  BDT {task.loanAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip label={task.taskType} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatAge(task.createdAt)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => onView(task)}>
                    <Visibility />
                  </IconButton>
                  {!task.assignee && (
                    <IconButton onClick={() => handleClaim(task.id)}>
                      <AssignmentInd />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        count={data?.totalPages || 0}
        page={page}
        onChange={(_, p) => setPage(p)}
        sx={{ mt: 2 }}
      />
    </Paper>
  );
}
```

---

## 3. Task Filters

```typescript
// features/workflow/components/TaskFilters/TaskFilters.tsx
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export function TaskFilters({ onFilterChange }: { onFilterChange: (f: any) => void }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <TextField
        size="small"
        placeholder="Search application..."
        onChange={(e) => onFilterChange({ search: e.target.value })}
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          label="Priority"
          onChange={(e) => onFilterChange({ priority: e.target.value })}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="HIGH">High</MenuItem>
          <MenuItem value="MEDIUM">Medium</MenuItem>
          <MenuItem value="LOW">Low</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
```

---

## 4. Task Cards

### 4.1 Kanban View

```typescript
// features/workflow/components/TaskKanban/TaskKanban.tsx
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const columns = [
  { id: 'pending', title: 'Pending', color: '#ff9800' },
  { id: 'in-progress', title: 'In Progress', color: '#2196f3' },
  { id: 'completed', title: 'Completed', color: '#4caf50' },
];

export function TaskKanban({ tasks }: { tasks: Task[] }) {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <Paper
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{ minWidth: 300, p: 2, bgcolor: '#f5f5f5' }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    borderLeft: 3, 
                    borderColor: column.color,
                    pl: 1,
                    mb: 2
                  }}
                >
                  {column.title}
                </Typography>
                
                <Stack spacing={1}>
                  {tasks
                    .filter((t) => t.status === column.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ p: 2, cursor: 'pointer' }}
                            onClick={() => onTaskClick(task)}
                          >
                            <Typography variant="subtitle2">
                              {task.applicationId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {task.applicantName}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={`BDT ${task.loanAmount}`} 
                                size="small"
                              />
                            </Box>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                </Stack>
                {provided.placeholder}
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
}
```

---

## 5. Bulk Actions

```typescript
// features/workflow/components/BulkActions/BulkActions.tsx
import { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';

export function BulkActions({ selectedTasks }: { selectedTasks: string[] }) {
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  if (selectedTasks.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Typography variant="body2">
        {selectedTasks.length} tasks selected
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setActionDialogOpen(true)}
      >
        Bulk Approve
      </Button>
      <Button
        variant="outlined"
        size="small"
        color="error"
      >
        Bulk Reject
      </Button>
    </Box>
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
