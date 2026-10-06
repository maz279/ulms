# API Integration React Query Guide

## RTK Query Integration for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | API Integration React Query Guide |
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
2. [RTK Query Setup](#2-rtk-query-setup)
3. [API Slices](#3-api-slices)
4. [Hooks Usage](#4-hooks-usage)
5. [Caching Strategy](#5-caching-strategy)
6. [Error Handling](#6-error-handling)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document defines the API integration patterns using Redux Toolkit Query (RTK Query) for ULMS v2.0, providing efficient data fetching, caching, and synchronization.

---

## 2. RTK Query Setup

### 2.1 Base API Configuration

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
    headers.set('X-Request-Source', 'ulms-web');
    
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
    'Dashboard',
  ],
  endpoints: () => ({}),
});
```

---

## 3. API Slices

### 3.1 Feature API Injection

```typescript
// features/los/api/losApi.ts
import { apiSlice } from '../../../services/api/apiSlice';

export const losApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Queries
    getLoanApplications: builder.query<LoanApplication[], QueryParams>({
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
    createLoanApplication: builder.mutation<LoanApplication, CreateRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
    }),

    updateLoanApplication: builder.mutation<LoanApplication, UpdateRequest>({
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

## 4. Hooks Usage

### 4.1 Query Hook Patterns

```typescript
// Basic query usage
function ApplicationList() {
  const { data, isLoading, error } = useGetLoanApplicationsQuery();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <DataGrid rows={data || []} />;
}

// Query with parameters
function FilteredApplicationList({ status, branch }: FilterParams) {
  const { data, isFetching } = useGetLoanApplicationsQuery(
    { status, branch },
    {
      pollingInterval: 30000, // Poll every 30 seconds
      skip: !branch, // Skip if no branch selected
    }
  );

  return (
    <>
      {isFetching && <LinearProgress />}
      <DataGrid rows={data || []} />
    </>
  );
}

// Lazy query for user-triggered fetch
function SearchApplications() {
  const [trigger, { data, isLoading }] = useLazyGetLoanApplicationsQuery();

  const handleSearch = (params: QueryParams) => {
    trigger(params);
  };

  return (
    <>
      <SearchForm onSearch={handleSearch} />
      {isLoading ? <LoadingSpinner /> : <Results data={data} />}
    </>
  );
}
```

### 4.2 Mutation Hook Patterns

```typescript
// Basic mutation usage
function CreateApplicationForm() {
  const [createApplication, { isLoading }] = useCreateLoanApplicationMutation();

  const handleSubmit = async (data: CreateRequest) => {
    try {
      const result = await createApplication(data).unwrap();
      // Success - navigate to application detail
      navigate(`/los/applications/${result.id}`);
    } catch (error) {
      // Handle error
      showError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

---

## 5. Caching Strategy

### 5.1 Cache Invalidation

```typescript
// Automatic cache invalidation
export const losApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLoanApplication: builder.mutation<LoanApplication, CreateRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      // Invalidate list cache
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
    }),

    updateLoanApplication: builder.mutation<LoanApplication, UpdateRequest>({
      query: ({ id, ...body }) => ({
        url: `/loans/applications/${id}`,
        method: 'PUT',
        body,
      }),
      // Invalidate specific item and list
      invalidatesTags: (result, error, { id }) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),
  }),
});
```

---

## 6. Error Handling

### 6.1 Global Error Handler

```typescript
// services/api/errorHandler.ts
import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { MiddlewareAPI, Middleware } from '@reduxjs/toolkit';

export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      const { status, data } = action.payload;
      
      switch (status) {
        case 401:
          // Redirect to login
          window.location.href = '/login';
          break;
        case 403:
          showNotification('Access denied', 'error');
          break;
        case 404:
          showNotification('Resource not found', 'error');
          break;
        case 422:
          showNotification(data?.message || 'Validation failed', 'error');
          break;
        case 500:
          showNotification('Server error', 'error');
          break;
        default:
          showNotification('An error occurred', 'error');
      }
    }

    return next(action);
  };
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[FE]_State_Management_Design_Redux_RTK_Query_v1.0.md` | State management |
| `[API]_Form_Handling_Validation_Patterns_v1.0.md` | Form validation |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
