# API Integration - React Query Guide
## ULMS v2.0 Data Fetching with RTK Query

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | API Integration - React Query Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. RTK Query Configuration

### 1.1 API Slice Setup

```typescript
// store/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'LoanApplication',
    'Customer',
    'CIBReport',
    'WorkflowTask',
    'User',
    'Report',
  ],
  endpoints: () => ({}),
});
```

---

## 2. Query Patterns

### 2.1 Basic Query

```typescript
const { data, isLoading, error } = useGetLoanApplicationQuery(id);
```

### 2.2 Query with Parameters

```typescript
const { data } = useGetLoanApplicationsQuery({
  page: 1,
  limit: 20,
  status: 'pending',
});
```

### 2.3 Conditional Query

```typescript
const { data } = useGetLoanApplicationQuery(id, {
  skip: !id, // Skip if no id
});
```

---

## 3. Mutation Patterns

### 3.1 Basic Mutation

```typescript
const [createApplication, { isLoading }] = useCreateLoanApplicationMutation();

const handleSubmit = async (data) => {
  try {
    const result = await createApplication(data).unwrap();
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### 3.2 Optimistic Update

```typescript
performTaskAction: builder.mutation({
  query: ({ taskId, action }) => ({
    url: `/workflow/tasks/${taskId}/action`,
    method: 'POST',
    body: { action },
  }),
  async onQueryStarted({ taskId, action }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      apiSlice.util.updateQueryData('getWorkflowTasks', {}, (draft) => {
        const task = draft.find((t) => t.id === taskId);
        if (task) task.status = action;
      })
    );
    
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
}),
```

---

## 4. Cache Management

### 4.1 Cache Invalidation

```typescript
// Invalidate on mutation
invalidatesTags: (result, error, { id }) => [
  { type: 'LoanApplication', id },
  { type: 'LoanApplication', id: 'LIST' },
]
```

### 4.2 Cache Prefetching

```typescript
const prefetchApplication = usePrefetch('getLoanApplication');

// On hover
onMouseEnter={() => prefetchApplication(id)}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
