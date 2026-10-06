# LOS Module Technical Design
## Loan Origination System (LOS) - ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | LOS Module Technical Design |
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

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Component Structure](#3-component-structure)
4. [State Management](#4-state-management)
5. [API Integration](#5-api-integration)
6. [Key Features](#6-key-features)
7. [User Flows](#7-user-flows)
8. [Appendices](#8-appendices)

---

## 1. Module Overview

### 1.1 Purpose

The Loan Origination System (LOS) module handles the complete loan application lifecycle from initial inquiry through to submission for credit assessment.

### 1.2 Scope

| Feature | Description |
|---------|-------------|
| Customer Management | Create and manage customer profiles |
| Application Creation | Multi-step loan application forms |
| Document Upload | Supporting document collection |
| Application Tracking | Status monitoring and history |
| Product Selection | Loan product configuration |

### 1.3 User Roles

| Role | Permissions |
|------|-------------|
| BRANCH_USER | Create applications, view own applications |
| CREDIT_ANALYST | View applications, initiate CIB checks |
| BRANCH_MANAGER | Full access, approve/reject within limit |

---

## 2. Architecture

### 2.1 Module Structure

```
modules/los/
├── components/                      # LOS-specific components
│   ├── LoanApplicationForm/         # Multi-step form
│   ├── CustomerRegistrationForm/    # Customer onboarding
│   ├── DocumentUpload/              # Document handling
│   ├── ApplicationStatusTracker/    # Status visualization
│   └── ApplicationListFilters/      # Advanced filtering
├── pages/                           # Route components
│   ├── LoanApplicationListPage.tsx
│   ├── LoanApplicationCreatePage.tsx
│   ├── LoanApplicationDetailPage.tsx
│   ├── CustomerListPage.tsx
│   ├── CustomerCreatePage.tsx
│   └── CustomerDetailPage.tsx
├── hooks/                           # LOS-specific hooks
│   ├── useLoanApplication.ts
│   ├── useLoanApplications.ts
│   ├── useCustomer.ts
│   ├── useCustomers.ts
│   └── useLoanProducts.ts
├── services/                        # API services
│   ├── loanApplicationApi.ts
│   ├── customerApi.ts
│   └── productApi.ts
├── types/                           # Type definitions
│   ├── loanApplication.types.ts
│   ├── customer.types.ts
│   └── product.types.ts
├── constants/                       # LOS constants
│   └── loanStatus.constants.ts
├── utils/                           # Utilities
│   └── loanCalculations.ts
├── routes.tsx                       # Module routes
└── index.ts                         # Public API
```

### 2.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOS MODULE DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   User       │───▶│  Component   │───▶│    Hook      │───▶│  RTK     │  │
│  │  Interaction │    │   Layer      │    │   Layer      │    │  Query   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └────┬─────┘  │
│         │                                                         │        │
│         │                    ┌─────────────────────────────────────┘        │
│         │                    │                                              │
│         │              ┌─────▼─────┐                                       │
│         │              │  Backend  │                                       │
│         │              │   API     │                                       │
│         │              └─────┬─────┘                                       │
│         │                    │                                             │
│         └────────────────────┘                                             │
│                          Response/State Update                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Structure

### 3.1 LoanApplicationForm Component

```typescript
// modules/los/components/LoanApplicationForm/LoanApplicationForm.tsx
import React, { useState } from 'react';
import { Stepper, Step, StepLabel, Box, Button } from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

import { CustomerSelectionStep } from './steps/CustomerSelectionStep';
import { ProductSelectionStep } from './steps/ProductSelectionStep';
import { LoanDetailsStep } from './steps/LoanDetailsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';

import { loanApplicationSchema, type LoanApplicationFormData } from './loanApplicationForm.schema';
import { useCreateLoanApplicationMutation } from '../../services/loanApplicationApi';

const steps = [
  'Select Customer',
  'Select Product',
  'Loan Details',
  'Documents',
  'Review & Submit',
];

interface LoanApplicationFormProps {
  mode?: 'create' | 'edit';
  defaultValues?: Partial<LoanApplicationFormData>;
}

export function LoanApplicationForm({
  mode = 'create',
  defaultValues,
}: LoanApplicationFormProps): React.ReactElement {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [createApplication] = useCreateLoanApplicationMutation();

  const methods = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: defaultValues || {
      productType: 'personal_loan',
    },
    mode: 'onBlur',
  });

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (data: LoanApplicationFormData) => {
    try {
      const result = await createApplication(data).unwrap();
      navigate(`/app/los/applications/${result.id}`);
    } catch (error) {
      console.error('Failed to create application:', error);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <CustomerSelectionStep />;
      case 1:
        return <ProductSelectionStep />;
      case 2:
        return <LoanDetailsStep />;
      case 3:
        return <DocumentsStep />;
      case 4:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={methods.handleSubmit(handleSubmit)}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>{renderStepContent()}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} variant="outlined">
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained">
              Next
            </Button>
          ) : (
            <Button type="submit" variant="contained" color="success">
              Submit Application
            </Button>
          )}
        </Box>
      </Box>
    </FormProvider>
  );
}
```

---

## 4. State Management

### 4.1 LOS State Slice

```typescript
// store/slices/losSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LOSState {
  draftApplication: Record<string, unknown> | null;
  selectedCustomerId: string | null;
  filters: {
    status: string[];
    dateRange: { start: string | null; end: string | null };
    productType: string[];
  };
  pagination: {
    page: number;
    pageSize: number;
  };
}

const initialState: LOSState = {
  draftApplication: null,
  selectedCustomerId: null,
  filters: {
    status: [],
    dateRange: { start: null, end: null },
    productType: [],
  },
  pagination: {
    page: 0,
    pageSize: 20,
  },
};

const losSlice = createSlice({
  name: 'los',
  initialState,
  reducers: {
    saveDraft: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.draftApplication = action.payload;
    },
    clearDraft: (state) => {
      state.draftApplication = null;
    },
    selectCustomer: (state, action: PayloadAction<string | null>) => {
      state.selectedCustomerId = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<LOSState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<LOSState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
});

export const { saveDraft, clearDraft, selectCustomer, setFilters, setPagination } =
  losSlice.actions;
export default losSlice.reducer;
```

---

## 5. API Integration

### 5.1 Loan Application API

```typescript
// modules/los/services/loanApplicationApi.ts
import { apiSlice } from '@/store/apiSlice';
import type {
  LoanApplication,
  CreateLoanApplicationRequest,
  LoanApplicationListResponse,
  LoanApplicationFilters,
} from '../types/loanApplication.types';

export const loanApplicationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoanApplications: builder.query<
      LoanApplicationListResponse,
      LoanApplicationFilters
    >({
      query: (filters) => ({
        url: '/loans/applications',
        params: filters,
      }),
      providesTags: ['LoanApplication'],
    }),

    getLoanApplication: builder.query<LoanApplication, string>({
      query: (id) => `/loans/applications/${id}`,
      providesTags: (result, error, id) => [{ type: 'LoanApplication', id }],
    }),

    createLoanApplication: builder.mutation<
      LoanApplication,
      CreateLoanApplicationRequest
    >({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LoanApplication'],
    }),

    updateLoanApplication: builder.mutation<
      LoanApplication,
      { id: string; data: Partial<CreateLoanApplicationRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/loans/applications/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoanApplication', id },
      ],
    }),

    submitLoanApplication: builder.mutation<LoanApplication, string>({
      query: (id) => ({
        url: `/loans/applications/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LoanApplication', id },
      ],
    }),

    deleteLoanApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/loans/applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LoanApplication'],
    }),
  }),
});

export const {
  useGetLoanApplicationsQuery,
  useGetLoanApplicationQuery,
  useCreateLoanApplicationMutation,
  useUpdateLoanApplicationMutation,
  useSubmitLoanApplicationMutation,
  useDeleteLoanApplicationMutation,
} = loanApplicationApi;
```

---

## 6. Key Features

### 6.1 Feature Matrix

| Feature | Component(s) | Priority |
|---------|-------------|----------|
| Customer Search | CustomerSelectionStep | High |
| NID Verification | useNIDVerification hook | High |
| Product Calculator | LoanCalculator | Medium |
| Document Upload | DocumentsStep | High |
| Auto-Save Draft | losSlice.saveDraft | Medium |
| Application Status | ApplicationStatusTracker | High |

---

## 7. User Flows

### 7.1 New Loan Application Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Start     │────▶│   Search    │────▶│   Select    │────▶│   Verify    │
│             │     │  Customer   │     │  Customer   │     │    NID      │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│   Submit    │◀────│   Review    │◀────│  Upload     │◀───────────┘
│             │     │             │     │  Documents  │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  Workflow   │
│   Queue     │
└─────────────┘
```

---

## 8. Appendices

### Appendix A: Type Definitions

```typescript
// modules/los/types/loanApplication.types.ts

export type LoanApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'returned';

export interface LoanApplication {
  id: string;
  applicationId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  amount: number;
  tenor: number;
  interestRate: number;
  purpose: string;
  status: LoanApplicationStatus;
  submissionDate?: string;
  documents: ApplicationDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanApplicationRequest {
  customerId: string;
  productId: string;
  amount: number;
  tenor: number;
  interestRate: number;
  purpose: string;
  documents: string[];
}

export interface ApplicationDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface LoanApplicationListResponse {
  items: LoanApplication[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoanApplicationFilters {
  page?: number;
  limit?: number;
  status?: string[];
  customerId?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
