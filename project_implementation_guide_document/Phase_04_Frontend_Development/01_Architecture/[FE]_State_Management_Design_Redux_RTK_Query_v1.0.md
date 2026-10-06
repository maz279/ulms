# State Management Design with Redux Toolkit and RTK Query

## State Management Architecture for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | State Management Design with Redux Toolkit and RTK Query |
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
2. [State Management Strategy](#2-state-management-strategy)
3. [Redux Store Architecture](#3-redux-store-architecture)
4. [RTK Query Implementation](#4-rtk-query-implementation)
5. [Slice Design Patterns](#5-slice-design-patterns)
6. [Caching Strategy](#6-caching-strategy)
7. [Optimistic Updates](#7-optimistic-updates)
8. [Pagination and Infinite Scroll](#8-pagination-and-infinite-scroll)
9. [Related Documents](#9-related-documents)

---

## 1. Executive Summary

This document defines the state management architecture for ULMS v2.0 using Redux Toolkit 2.0 and RTK Query. The architecture provides efficient data fetching, caching, and state synchronization for a banking application requiring real-time data consistency.

---

## 2. State Management Strategy

### 2.1 State Classification

| State Type | Management Solution | Use Cases |
|------------|---------------------|-----------|
| **Server State** | RTK Query | API data, caching, synchronization |
| **Global UI State** | Redux Slices | Theme, auth, notifications, modals |
| **Feature State** | Redux Slices | Cross-component feature data |
| **Local State** | useState/useReducer | Component-specific data |
| **URL State** | React Router | Filters, pagination, search params |
| **Form State** | React Hook Form | Form inputs and validation |

### 2.2 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      State Management                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  Server API  │────▶│  RTK Query   │────▶│    Cache     │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│                                │                      │         │
│                                ▼                      ▼         │
│                       ┌──────────────┐       ┌──────────────┐   │
│                       │  Components  │◀──────│   Selectors  │   │
│                       └──────────────┘       └──────────────┘   │
│                                │                                │
│                                ▼                                │
│                       ┌──────────────┐                          │
│                       │   Actions    │                          │
│                       │ (Mutations)  │                          │
│                       └──────────────┘                          │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │  Redux Slice │◀───▶│  UI State    │                          │
│  │   (Global)   │     │ (Theme/Auth) │                          │
│  └──────────────┘     └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Redux Store Architecture

### 3.1 Store Configuration

```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from '../services/api/apiSlice';

// Feature slices
import authReducer from '../features/auth/authSlice';
import uiReducer from './uiSlice';
import workflowReducer from '../features/workflow/workflowSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    // RTK Query API slice
    [apiSlice.reducerPath]: apiSlice.reducer,
    
    // Global state slices
    auth: authReducer,
    ui: uiReducer,
    workflow: workflowReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 3.2 Typed Hooks

```typescript
// hooks/redux.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';

// Typed versions of useDispatch and useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## 4. RTK Query Implementation

### 4.1 Base API Slice

```typescript
// services/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Loan',
    'Customer', 
    'Application',
    'CIBReport',
    'WorkflowTask',
    'Report',
    'User',
    'Branch',
    'Config',
  ],
  endpoints: () => ({}),
});
```

### 4.2 Feature API Injection

```typescript
// features/los/api/losApi.ts
import { apiSlice } from '../../../services/api/apiSlice';
import type { 
  LoanApplication, 
  CreateApplicationRequest,
  UpdateApplicationRequest 
} from '../types/loan.types';

export const losApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Queries
    getLoanApplications: builder.query<LoanApplication[], { 
      status?: string; 
      branchId?: string;
      page?: number;
      size?: number;
    }>({
      query: (params) => ({
        url: '/loans/applications',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Application' as const, id })),
              { type: 'Application', id: 'LIST' },
            ]
          : [{ type: 'Application', id: 'LIST' }],
    }),

    getLoanApplicationById: builder.query<LoanApplication, string>({
      query: (id) => `/loans/applications/${id}`,
      providesTags: (result, error, id) => [{ type: 'Application', id }],
    }),

    // Mutations
    createLoanApplication: builder.mutation<LoanApplication, CreateApplicationRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
    }),

    updateLoanApplication: builder.mutation<LoanApplication, UpdateApplicationRequest>({
      query: ({ id, ...body }) => ({
        url: `/loans/applications/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),

    deleteLoanApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/loans/applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetLoanApplicationsQuery,
  useGetLoanApplicationByIdQuery,
  useCreateLoanApplicationMutation,
  useUpdateLoanApplicationMutation,
  useDeleteLoanApplicationMutation,
} = losApi;
```

---

## 5. Slice Design Patterns

### 5.1 Auth Slice Example

```typescript
// features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  branchId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 5.2 UI Slice Example

```typescript
// app/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  modalOpen: boolean;
  activeModal: string | null;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  modalOpen: false,
  activeModal: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      state.notifications.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = true;
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.activeModal = null;
    },
  },
});

export const {
  toggleSidebar,
  setTheme,
  addNotification,
  removeNotification,
  openModal,
  closeModal,
} = uiSlice.actions;
export default uiSlice.reducer;
```

---

## 6. Caching Strategy

### 6.1 Cache Invalidation Patterns

```typescript
// Automatic cache invalidation on mutations
export const losApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLoanApplication: builder.mutation<LoanApplication, CreateRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      // Invalidate the list cache
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
    }),

    updateLoanApplication: builder.mutation<LoanApplication, UpdateRequest>({
      query: ({ id, ...body }) => ({
        url: `/loans/applications/${id}`,
        method: 'PUT',
        body,
      }),
      // Invalidate both the specific item and the list
      invalidatesTags: (result, error, { id }) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),

    // Manual cache update without refetch
    approveLoanApplication: builder.mutation<LoanApplication, { id: string; notes: string }>({
      query: ({ id, notes }) => ({
        url: `/loans/applications/${id}/approve`,
        method: 'POST',
        body: { notes },
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        // Optimistic update
        const patchResult = dispatch(
          losApi.util.updateQueryData('getLoanApplicationById', id, (draft) => {
            draft.status = 'APPROVED';
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});
```

---

## 7. Optimistic Updates

### 7.1 Implementation Pattern

```typescript
// Optimistic update for workflow actions
updateTaskStatus: builder.mutation<Task, { taskId: string; status: TaskStatus }>({
  query: ({ taskId, status }) => ({
    url: `/workflow/tasks/${taskId}`,
    method: 'PATCH',
    body: { status },
  }),
  async onQueryStarted({ taskId, status }, { dispatch, queryFulfilled }) {
    // Optimistically update the cache
    const patchResult = dispatch(
      workflowApi.util.updateQueryData('getTasks', undefined, (draft) => {
        const task = draft.find((t) => t.id === taskId);
        if (task) {
          task.status = status;
          task.updatedAt = new Date().toISOString();
        }
      })
    );

    try {
      await queryFulfilled;
    } catch {
      // Rollback on error
      patchResult.undo();
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update task status',
      }));
    }
  },
}),
```

---

## 8. Pagination and Infinite Scroll

### 8.1 Pagination Implementation

```typescript
// Paginated query
getLoanApplications: builder.query<
  PaginatedResponse<LoanApplication>,
  { page: number; size: number; sort?: string }
>({
  query: ({ page, size, sort }) => ({
    url: '/loans/applications',
    params: { page, size, sort },
  }),
  // Serialize query args for caching
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    return `${endpointName}-${queryArgs.size}-${queryArgs.sort}`;
  },
  // Merge incoming data with existing cache
  merge: (currentCache, newItems) => {
    return {
      ...newItems,
      content: [...currentCache.content, ...newItems.content],
    };
  },
  // Only keep data for 5 minutes
  keepUnusedDataFor: 300,
}),

// Component usage
function LoanApplicationList() {
  const [page, setPage] = useState(0);
  const { data, isFetching } = useGetLoanApplicationsQuery({
    page,
    size: 20,
    sort: 'createdAt,desc',
  });

  const loadMore = () => setPage((p) => p + 1);

  return (
    <>
      <DataGrid rows={data?.content || []} />
      <Button onClick={loadMore} disabled={isFetching}>
        Load More
      </Button>
    </>
  );
}
```

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| `[FE]_React_Frontend_Architecture_Document_v1.0.md` | Overall architecture |
| `[API]_API_Integration_React_Query_Guide_v1.0.md` | API integration patterns |
| `[LOS]_LOS_Module_Technical_Design_v1.0.md` | LOS module state management |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
