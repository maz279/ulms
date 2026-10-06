# LOS Module Technical Design

## Loan Origination System Frontend Design

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | LOS Module Technical Design |
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
3. [Component Structure](#3-component-structure)
4. [Pages and Routes](#4-pages-and-routes)
5. [State Management](#5-state-management)
6. [API Integration](#6-api-integration)
7. [Form Workflows](#7-form-workflows)
8. [Related Documents](#8-related-documents)

---

## 1. Executive Summary

This document defines the technical design for the Loan Origination System (LOS) frontend module, handling loan application intake, customer registration, and initial processing for Bangladesh banks.

---

## 2. Module Architecture

### 2.1 LOS Module Structure

```
features/los/
├── api/                          # RTK Query API endpoints
│   ├── losApi.ts
│   └── customerApi.ts
├── components/                   # Module components
│   ├── LoanApplicationForm/
│   ├── CustomerRegistration/
│   ├── ApplicationList/
│   ├── ApplicationDetail/
│   └── BOCCInterface/
├── hooks/                        # Custom hooks
│   ├── useLoanApplication.ts
│   ├── useCustomerSearch.ts
│   └── useBOCC.ts
├── pages/                        # Route pages
│   ├── LOSDashboardPage.tsx
│   ├── ApplicationListPage.tsx
│   ├── NewApplicationPage.tsx
│   └── ApplicationDetailPage.tsx
├── schemas/                      # Validation schemas
│   └── loanApplicationSchema.ts
├── types/                        # TypeScript types
│   └── los.types.ts
├── constants/                    # Module constants
│   └── losConstants.ts
├── routes.ts                     # Route definitions
└── index.ts                      # Public exports
```

---

## 3. Component Structure

### 3.1 Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `LoanApplicationWizard` | Multi-step loan application form | `components/LoanApplicationForm/` |
| `CustomerRegistration` | NID-integrated customer registration | `components/CustomerRegistration/` |
| `ApplicationTable` | List view of applications | `components/ApplicationList/` |
| `ApplicationDetail` | Detailed application view | `components/ApplicationDetail/` |
| `BOCCMeetingInterface` | BOCC meeting management | `components/BOCCInterface/` |

---

## 4. Pages and Routes

### 4.1 Route Configuration

```typescript
// features/los/routes.ts
import { RouteObject } from 'react-router-dom';

export const losRoutes: RouteObject[] = [
  {
    index: true,
    element: <LOSDashboardPage />,
  },
  {
    path: 'applications',
    children: [
      {
        index: true,
        element: <ApplicationListPage />,
      },
      {
        path: 'new',
        element: <NewApplicationPage />,
      },
      {
        path: ':id',
        element: <ApplicationDetailPage />,
      },
      {
        path: ':id/edit',
        element: <EditApplicationPage />,
      },
    ],
  },
  {
    path: 'customers',
    children: [
      {
        path: 'new',
        element: <CustomerRegistrationPage />,
      },
      {
        path: ':id',
        element: <CustomerDetailPage />,
      },
    ],
  },
  {
    path: 'bocc',
    element: <BOCCMeetingPage />,
  },
];
```

---

## 5. State Management

### 5.1 LOS Slice

```typescript
// features/los/losSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LOSState {
  draftApplication: Partial<LoanApplication> | null;
  selectedApplicationId: string | null;
  filters: {
    status: string | null;
    dateRange: { from: Date | null; to: Date | null };
    branch: string | null;
  };
}

const initialState: LOSState = {
  draftApplication: null,
  selectedApplicationId: null,
  filters: {
    status: null,
    dateRange: { from: null, to: null },
    branch: null,
  },
};

const losSlice = createSlice({
  name: 'los',
  initialState,
  reducers: {
    setDraftApplication: (state, action: PayloadAction<Partial<LoanApplication>>) => {
      state.draftApplication = action.payload;
    },
    clearDraftApplication: (state) => {
      state.draftApplication = null;
    },
    setSelectedApplication: (state, action: PayloadAction<string>) => {
      state.selectedApplicationId = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<LOSState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setDraftApplication, clearDraftApplication, setSelectedApplication, setFilters } = 
  losSlice.actions;
export default losSlice.reducer;
```

---

## 6. API Integration

### 6.1 LOS API Slice

```typescript
// features/los/api/losApi.ts
import { apiSlice } from '../../../services/api/apiSlice';

export const losApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Queries
    getLoanApplications: builder.query<PaginatedResponse<LoanApplication>, QueryParams>({
      query: (params) => ({
        url: '/loans/applications',
        params,
      }),
      providesTags: ['Application'],
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
      invalidatesTags: ['Application'],
    }),

    updateLoanApplication: builder.mutation<LoanApplication, UpdateApplicationRequest>({
      query: ({ id, ...body }) => ({
        url: `/loans/applications/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Application', id },
        'Application',
      ],
    }),

    submitToBOCC: builder.mutation<void, { applicationId: string; notes: string }>({
      query: ({ applicationId, notes }) => ({
        url: `/loans/applications/${applicationId}/submit-to-bocc`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Application', id: applicationId },
      ],
    }),

    // BOCC endpoints
    getBOCCMeetings: builder.query<BOCCMeeting[], void>({
      query: () => '/bocc/meetings',
      providesTags: ['BOCCMeeting'],
    }),

    scheduleBOCCMeeting: builder.mutation<BOCCMeeting, CreateMeetingRequest>({
      query: (body) => ({
        url: '/bocc/meetings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BOCCMeeting'],
    }),
  }),
});

export const {
  useGetLoanApplicationsQuery,
  useGetLoanApplicationByIdQuery,
  useCreateLoanApplicationMutation,
  useUpdateLoanApplicationMutation,
  useSubmitToBOCCMutation,
  useGetBOCCMeetingsQuery,
  useScheduleBOCCMeetingMutation,
} = losApi;
```

---

## 7. Form Workflows

### 7.1 Application Wizard Steps

| Step | Name | Components | Validations |
|------|------|------------|-------------|
| 1 | Personal Info | NID Lookup, Name, DOB | NID validation |
| 2 | Contact Info | Address, Phone, Email | BD phone format |
| 3 | Employment | Occupation, Income | Income verification |
| 4 | Loan Details | Amount, Purpose, Tenure | Amount limits |
| 5 | Documents | Upload components | File types, size |
| 6 | Review | Summary, Submit | Final validation |

---

## 8. Related Documents

| Document | Purpose |
|----------|---------|
| `[LOS]_Customer_Registration_Component_v1.0.md` | Customer registration |
| `[LOS]_Loan_Application_Form_Design_v1.0.md` | Application forms |
| `[LOS]_BOCC_Meeting_Interface_v1.0.md` | BOCC interface |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
