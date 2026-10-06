# State Management Design - Redux + RTK Query
## ULMS v2.0 Frontend State Architecture

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | State Management Design - Redux + RTK Query |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Frontend Developer | Initial design |

---

## Table of Contents

1. [State Architecture Overview](#1-state-architecture-overview)
2. [State Categories](#2-state-categories)
3. [Redux Toolkit Configuration](#3-redux-toolkit-configuration)
4. [RTK Query Implementation](#4-rtk-query-implementation)
5. [Slice Design Patterns](#5-slice-design-patterns)
6. [Caching Strategy](#6-caching-strategy)
7. [Optimistic Updates](#7-optimistic-updates)
8. [Best Practices](#8-best-practices)
9. [Appendices](#9-appendices)

---

## 1. State Architecture Overview

### 1.1 Architecture Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ULMS STATE MANAGEMENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      GLOBAL STATE (Redux Store)                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │    Auth     │  │    UI       │  │   Settings  │  │   Feature   │  │  │
│  │  │   Slice     │  │   Slice     │  │    Slice    │  │   Slices    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                    SERVER STATE (RTK Query)                           │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │  Loan API    │ │ Customer API │ │   CIB API    │ │ Workflow API │ │  │
│  │  │    Slice     │ │    Slice     │ │    Slice     │ │    Slice     │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │  Report API  │ │ Document API │ │Notification  │ │   User API   │ │  │
│  │  │    Slice     │ │    Slice     │ │    Slice     │ │    Slice     │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                      LOCAL STATE (React Hooks)                        │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │   useState   │ │  useReducer  │ │  useContext  │ │  Custom      │ │  │
│  │  │              │ │              │ │              │ │   Hooks      │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 State Selection Decision Tree

```
                    ┌─────────────────┐
                    │  New State to   │
                    │    Manage?      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │  From   │    │  From   │    │  From   │
        │  Server │    │   API   │    │  User   │
        └────┬────┘    └────┬────┘    └────┬────┘
             │              │              │
             ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │  RTK    │    │  RTK    │    │  Redux  │
        │  Query  │    │  Query  │    │ Toolkit │
        │  Cache  │    │  Slice  │    │  Slice  │
        └─────────┘    └─────────┘    └─────────┘
              \              |              /
               \             |             /
                \            |            /
                 ▼           ▼           ▼
              ┌──────────────────────────────────┐
              │  Simple/Scoped? → useState       │
              │  Complex/Shared? → useReducer    │
              └──────────────────────────────────┘
```

---

## 2. State Categories

### 2.1 Server State (RTK Query)

| Data Type | Source | Cache Strategy |
|-----------|--------|----------------|
| Loan Applications | API | 5 minutes, tag-based invalidation |
| Customer Data | API | 10 minutes, tag-based invalidation |
| CIB Reports | API | 1 hour (external API cost) |
| Workflow Tasks | API | Real-time, WebSocket updates |
| Reports | API | 30 minutes, stale-while-revalidate |
| Documents | API | 15 minutes |

### 2.2 Global Client State (Redux)

| State | Purpose | Persistence |
|-------|---------|-------------|
| Authentication | User session, roles, permissions | localStorage |
| UI State | Sidebar, modals, notifications | None |
| User Preferences | Language, theme, defaults | localStorage |
| Feature Flags | A/B testing, feature toggles | None |

### 2.3 Local Component State

| State Type | Use Case | Example |
|------------|----------|---------|
| Form State | Input values, validation | React Hook Form |
| UI Toggles | Show/hide, expand/collapse | useState |
| Animation State | Transitions, loading | useState |
| Derived Data | Computed values | useMemo |

---

## 3. Redux Toolkit Configuration

### 3.1 Store Setup

```typescript
// store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';

// Import slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  settings: settingsReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

// Create store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'auth/setUser'],
        ignoredPaths: ['auth.user.lastLogin'],
      },
      immutableCheck: {
        warnAfter: 128,
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
  preloadedState: loadStateFromStorage(),
});

// Enable refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Storage helpers
function loadStateFromStorage(): Partial<RootState> | undefined {
  try {
    const serializedState = localStorage.getItem('ulms_state');
    if (serializedState) {
      const parsed = JSON.parse(serializedState);
      return {
        auth: parsed.auth,
        settings: parsed.settings,
      };
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

// Subscribe to store for persistence
store.subscribe(() => {
  const state = store.getState();
  const persistState = {
    auth: {
      token: state.auth.token,
      user: state.auth.user,
      isAuthenticated: state.auth.isAuthenticated,
    },
    settings: state.settings,
  };
  localStorage.setItem('ulms_state', JSON.stringify(persistState));
});
```

### 3.2 Typed Hooks

```typescript
// store/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 3.3 Auth Slice Example

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginCredentials, AuthState } from '@/shared/types/auth.types';
import { authService } from '@/services/auth/authService';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      const response = await authService.refresh(auth.refreshToken!);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
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
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setCredentials, updateUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

---

## 4. RTK Query Implementation

### 4.1 Base API Slice

```typescript
// store/apiSlice.ts
import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

// Create base query with auth and retry logic
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Add retry logic for failed requests
const baseQueryWithRetry = retry(baseQuery, {
  maxRetries: 3,
  retryCondition: (error) => {
    // Retry on network errors or 5xx errors
    return error.status === 'FETCH_ERROR' || 
           (typeof error.status === 'number' && error.status >= 500);
  },
});

// Add reauth logic
const baseQueryWithReauth: typeof baseQueryWithRetry = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQueryWithRetry(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      // Retry original request with new token
      api.dispatch({ type: 'auth/tokenRefreshed', payload: refreshResult.data });
      result = await baseQueryWithRetry(args, api, extraOptions);
    } else {
      api.dispatch({ type: 'auth/logout' });
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'LoanApplication',
    'Loan',
    'Customer',
    'CIBReport',
    'WorkflowTask',
    'User',
    'Report',
    'Document',
    'Notification',
  ],
  endpoints: () => ({}),
});
```

### 4.2 Feature API Slices

```typescript
// services/api/loanApi.ts
import { apiSlice } from '@/store/apiSlice';
import type {
  LoanApplication,
  CreateLoanApplicationRequest,
  UpdateLoanApplicationRequest,
  LoanApplicationListResponse,
  LoanApplicationFilters,
} from '@/shared/types/loan.types';

export const loanApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Query endpoints
    getLoanApplications: builder.query<
      LoanApplicationListResponse,
      LoanApplicationFilters | void
    >({
      query: (filters) => ({
        url: '/loans/applications',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: 'LoanApplication' as const,
                id,
              })),
              { type: 'LoanApplication', id: 'LIST' },
            ]
          : [{ type: 'LoanApplication', id: 'LIST' }],
      // Keep cached data for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getLoanApplication: builder.query<LoanApplication, string>({
      query: (id) => `/loans/applications/${id}`,
      providesTags: (result, error, id) => [{ type: 'LoanApplication', id }],
    }),

    getLoanApplicationsByCustomer: builder.query<
      LoanApplication[],
      string
    >({
      query: (customerId) => `/loans/applications?customerId=${customerId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'LoanApplication', id }))
          : [],
    }),

    // Mutation endpoints
    createLoanApplication: builder.mutation<
      LoanApplication,
      CreateLoanApplicationRequest
    >({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LoanApplication', id: 'LIST' }],
    }),

    updateLoanApplication: builder.mutation<
      LoanApplication,
      { id: string; data: UpdateLoanApplicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/loans/applications/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoanApplication', id },
        { type: 'LoanApplication', id: 'LIST' },
      ],
    }),

    deleteLoanApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/loans/applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LoanApplication', id },
        { type: 'LoanApplication', id: 'LIST' },
      ],
    }),

    submitLoanApplication: builder.mutation<
      LoanApplication,
      string
    >({
      query: (id) => ({
        url: `/loans/applications/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LoanApplication', id },
        { type: 'LoanApplication', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetLoanApplicationsQuery,
  useGetLoanApplicationQuery,
  useGetLoanApplicationsByCustomerQuery,
  useCreateLoanApplicationMutation,
  useUpdateLoanApplicationMutation,
  useDeleteLoanApplicationMutation,
  useSubmitLoanApplicationMutation,
  // Export lazy queries for conditional fetching
  useLazyGetLoanApplicationQuery,
} = loanApi;
```

### 4.3 CIB API with Extended Cache

```typescript
// services/api/cibApi.ts
import { apiSlice } from '@/store/apiSlice';
import type { CIBReport, CIBInquiryRequest } from '@/shared/types/cib.types';

export const cibApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    requestCIBReport: builder.mutation<CIBReport, CIBInquiryRequest>({
      query: (body) => ({
        url: '/cib/inquiry',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CIBReport', id: 'LIST' }],
    }),

    getCIBReport: builder.query<CIBReport, string>({
      query: (inquiryId) => `/cib/reports/${inquiryId}`,
      providesTags: (result, error, id) => [{ type: 'CIBReport', id }],
      // Cache CIB reports for 1 hour (external API cost consideration)
      keepUnusedDataFor: 3600,
    }),

    getCIBHistory: builder.query<CIBReport[], { nidNumber: string; limit?: number }>({
      query: ({ nidNumber, limit = 10 }) =>
        `/cib/history?nidNumber=${nidNumber}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ inquiryId }) => ({
                type: 'CIBReport' as const,
                id: inquiryId,
              })),
              { type: 'CIBReport', id: 'LIST' },
            ]
          : [{ type: 'CIBReport', id: 'LIST' }],
    }),
  }),
});

export const {
  useRequestCIBReportMutation,
  useGetCIBReportQuery,
  useGetCIBHistoryQuery,
} = cibApi;
```

---

## 5. Slice Design Patterns

### 5.1 Entity Adapter Pattern

```typescript
// store/slices/customerSlice.ts
import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit';
import type { Customer } from '@/shared/types/customer.types';
import type { RootState } from '../index';

// Create entity adapter
const customersAdapter = createEntityAdapter<Customer>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
  selectId: (customer) => customer.id,
});

// Define state type
interface CustomersState {
  selectedCustomerId: string | null;
  filters: {
    search: string;
    branch: string | null;
  };
}

const initialState = customersAdapter.getInitialState<CustomersState>({
  selectedCustomerId: null,
  filters: {
    search: '',
    branch: null,
  },
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    // Adapter CRUD operations
    addCustomer: customersAdapter.addOne,
    addCustomers: customersAdapter.addMany,
    updateCustomer: customersAdapter.updateOne,
    removeCustomer: customersAdapter.removeOne,
    setCustomers: customersAdapter.setAll,
    
    // Custom operations
    selectCustomer: (state, action: PayloadAction<string | null>) => {
      state.selectedCustomerId = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CustomersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

// Export actions
export const {
  addCustomer,
  addCustomers,
  updateCustomer,
  removeCustomer,
  setCustomers,
  selectCustomer,
  setFilters,
  clearFilters,
} = customersSlice.actions;

// Export adapter selectors
export const {
  selectAll: selectAllCustomers,
  selectById: selectCustomerById,
  selectIds: selectCustomerIds,
  selectEntities: selectCustomerEntities,
  selectTotal: selectTotalCustomers,
} = customersAdapter.getSelectors<RootState>((state) => state.customers);

// Custom selectors
export const selectSelectedCustomer = (state: RootState) => {
  const { selectedCustomerId } = state.customers;
  return selectedCustomerId ? selectCustomerById(state, selectedCustomerId) : null;
};

export const selectFilteredCustomers = (state: RootState) => {
  const allCustomers = selectAllCustomers(state);
  const { filters } = state.customers;
  
  return allCustomers.filter((customer) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        customer.name.toLowerCase().includes(search) ||
        customer.nidNumber.includes(search) ||
        customer.mobileNumber.includes(search);
      if (!matchesSearch) return false;
    }
    
    if (filters.branch && customer.branchId !== filters.branch) {
      return false;
    }
    
    return true;
  });
};

export default customersSlice.reducer;
```

---

## 6. Caching Strategy

### 6.1 Cache Policies

| Endpoint Type | Cache Duration | Invalidation Trigger |
|--------------|----------------|---------------------|
| List endpoints | 5 minutes | Create/Update/Delete |
| Detail endpoints | 10 minutes | Update/Delete |
| Reference data | 1 hour | Manual refresh |
| User data | 30 minutes | Profile update |
| CIB reports | 1 hour | New inquiry only |
| Reports | 30 minutes | Data refresh |

### 6.2 Cache Normalization

```typescript
// store/middleware/cacheMiddleware.ts
import { isAnyOf } from '@reduxjs/toolkit';
import { loanApi } from '@/services/api/loanApi';
import { customerApi } from '@/services/api/customerApi';

// Define related entities for cascade invalidation
const entityRelations = {
  LoanApplication: ['WorkflowTask', 'Customer'],
  Customer: ['LoanApplication'],
  WorkflowTask: ['LoanApplication'],
};

export const cacheMiddleware = () => (next: any) => (action: any) => {
  // Handle entity updates and invalidate related caches
  if (isAnyOf(
    loanApi.endpoints.updateLoanApplication.matchFulfilled,
    loanApi.endpoints.submitLoanApplication.matchFulfilled
  )(action)) {
    const loanId = action.payload.id;
    // Trigger any additional invalidations
    console.log(`Cache invalidated for loan: ${loanId}`);
  }
  
  return next(action);
};
```

---

## 7. Optimistic Updates

### 7.1 Optimistic Update Pattern

```typescript
// services/api/workflowApi.ts
import { apiSlice } from '@/store/apiSlice';
import type { WorkflowTask, TaskAction } from '@/shared/types/workflow.types';

export const workflowApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWorkflowTasks: builder.query<WorkflowTask[], { status?: string }>({
      query: (params) => ({
        url: '/workflow/tasks',
        params,
      }),
      providesTags: ['WorkflowTask'],
    }),

    performTaskAction: builder.mutation<
      WorkflowTask,
      { taskId: string; action: TaskAction; comment?: string }
    >({
      query: ({ taskId, action, comment }) => ({
        url: `/workflow/tasks/${taskId}/action`,
        method: 'POST',
        body: { action, comment },
      }),
      // Optimistic update
      async onQueryStarted({ taskId, action }, { dispatch, queryFulfilled }) {
        // Optimistically update the cache
        const patchResult = dispatch(
          workflowApi.util.updateQueryData('getWorkflowTasks', {}, (draft) => {
            const task = draft.find((t) => t.id === taskId);
            if (task) {
              task.status = action === 'APPROVE' ? 'COMPLETED' : 'REJECTED';
              task.completedAt = new Date().toISOString();
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
      invalidatesTags: ['WorkflowTask'],
    }),
  }),
});

export const { useGetWorkflowTasksQuery, usePerformTaskActionMutation } = workflowApi;
```

---

## 8. Best Practices

### 8.1 State Design Guidelines

1. **Normalize State Shape**
   - Use entity adapters for collections
   - Reference items by ID rather than nesting

2. **Keep State Minimal**
   - Don't duplicate data from server
   - Derive computed values with selectors

3. **Immutability**
   - Always use Redux Toolkit's immutable helpers
   - Never mutate state directly

4. **Async Logic**
   - Use RTK Query for server state
   - Use thunks for complex async flows

5. **Selectors**
   - Memoize expensive computations with createSelector
   - Keep selectors co-located with slices

### 8.2 Performance Checklist

- [ ] Use `React.memo` for expensive components
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for stable callbacks
- [ ] Keep component state local when possible
- [ ] Use RTK Query's `skip` option for conditional fetching
- [ ] Implement proper cache invalidation
- [ ] Use `selectFromResult` to minimize re-renders

---

## 9. Appendices

### Appendix A: Common Patterns

**Conditional Fetching:**
```typescript
const { data } = useGetLoanApplicationQuery(loanId, {
  skip: !loanId, // Skip if no ID
});
```

**Polling:**
```typescript
const { data } = useGetWorkflowTasksQuery({}, {
  pollingInterval: 30000, // Poll every 30 seconds
});
```

**Refetch on Demand:**
```typescript
const { refetch } = useGetLoanApplicationQuery(loanId);
// Later...
refetch();
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
