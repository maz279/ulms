# TypeScript/React Coding Standards

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-STD-0.3.3 |
| **Document Title** | TypeScript/React Coding Standards |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Frontend Developer (Dev 1) |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | Dev 1 | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Structure](#2-project-structure)
3. [TypeScript Standards](#3-typescript-standards)
4. [React Component Standards](#4-react-component-standards)
5. [State Management](#5-state-management)
6. [Form Handling](#6-form-handling)
7. [API Integration](#7-api-integration)
8. [Styling Standards](#8-styling-standards)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Accessibility Standards](#10-accessibility-standards)
11. [Testing Standards](#11-testing-standards)
12. [Performance Optimization](#12-performance-optimization)

---

## 1. Introduction

### 1.1 Purpose

This document defines TypeScript and React coding standards for the ULMS v2.0 frontend application, ensuring consistent, maintainable, and high-quality code.

### 1.2 Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.x | UI framework |
| TypeScript | 5.3.x | Type safety |
| Vite | 5.0.x | Build tool |
| Material-UI (MUI) | 5.15.x | Component library |
| Redux Toolkit | 2.0.x | State management |
| TanStack Query | 5.17.x | Server state |
| React Hook Form | 7.49.x | Form handling |
| Zod | 3.22.x | Schema validation |
| react-i18next | 14.0.x | Internationalization |
| Vitest | 1.2.x | Unit testing |
| Playwright | 1.41.x | E2E testing |

### 1.3 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@store/*": ["src/store/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 2. Project Structure

### 2.1 Directory Structure

```
src/
├── components/                 # Shared components
│   ├── common/                # Generic UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── DataGrid/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── forms/                 # Form components
│   │   ├── TextField/
│   │   ├── SelectField/
│   │   └── DatePicker/
│   └── layout/                # Layout components
│       ├── AppLayout/
│       ├── Sidebar/
│       └── Header/
├── modules/                   # Feature modules
│   ├── loan/                  # Loan Origination
│   │   ├── components/
│   │   │   ├── LoanForm/
│   │   │   ├── LoanList/
│   │   │   └── LoanDetails/
│   │   ├── hooks/
│   │   │   ├── useLoan.ts
│   │   │   └── useLoanForm.ts
│   │   ├── services/
│   │   │   └── loanApi.ts
│   │   ├── types/
│   │   │   └── loan.types.ts
│   │   └── pages/
│   │       ├── LoanListPage.tsx
│   │       └── LoanDetailPage.tsx
│   ├── credit/                # Credit Management
│   ├── workflow/              # Workflow Module
│   ├── reporting/             # Reports & Dashboards
│   └── admin/                 # Administration
├── hooks/                     # Shared custom hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useNotification.ts
├── services/                  # API services
│   ├── api/
│   │   ├── apiClient.ts
│   │   └── endpoints.ts
│   └── auth/
│       └── authService.ts
├── store/                     # Redux store
│   ├── index.ts
│   ├── rootReducer.ts
│   └── slices/
│       ├── authSlice.ts
│       └── uiSlice.ts
├── types/                     # Shared TypeScript types
│   ├── api.types.ts
│   ├── common.types.ts
│   └── index.ts
├── utils/                     # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── i18n/                      # Internationalization
│   ├── config.ts
│   └── locales/
│       ├── en/
│       │   └── translation.json
│       └── bn/
│           └── translation.json
├── styles/                    # Global styles
│   ├── theme.ts
│   └── global.css
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

### 2.2 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `LoanForm.tsx` |
| Hook | camelCase with `use` prefix | `useLoanForm.ts` |
| Utility | camelCase | `formatCurrency.ts` |
| Type file | camelCase with `.types` | `loan.types.ts` |
| Test file | Same as source with `.test` | `LoanForm.test.tsx` |
| Constants | camelCase or UPPER_SNAKE | `constants.ts` |
| Index export | `index.ts` | `index.ts` |

### 2.3 Import Order

```typescript
// 1. React
import React, { useState, useEffect, useMemo } from 'react';

// 2. Third-party libraries
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';

// 3. Internal modules (absolute imports)
import { useAuth } from '@hooks/useAuth';
import { loanApi } from '@services/api/loanApi';
import { formatCurrency } from '@utils/formatters';

// 4. Types
import type { Loan, LoanFormData } from '@types/loan.types';

// 5. Relative imports (components, styles)
import { LoanFormFields } from './LoanFormFields';
import styles from './LoanForm.module.css';
```

---

## 3. TypeScript Standards

### 3.1 Type Definitions

```typescript
// ✅ Good: Use interfaces for objects
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ✅ Good: Use type for unions, intersections, primitives
type UserRole = 'ADMIN' | 'LOAN_OFFICER' | 'CREDIT_ANALYST';
type UserId = string;
type Nullable<T> = T | null;

// ✅ Good: Use enums for fixed set of values
enum LoanStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
}

// ✅ Good: Readonly for immutable data
interface LoanApplication {
  readonly id: string;
  readonly customerId: string;
  amount: number;
  status: LoanStatus;
}

// ✅ Good: Generic types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}
```

### 3.2 Strict Type Safety

```typescript
// ❌ Bad: Using any
const processData = (data: any) => { ... }

// ✅ Good: Use unknown and type guards
const processData = (data: unknown): ProcessedData => {
  if (isValidData(data)) {
    return transform(data);
  }
  throw new Error('Invalid data');
};

// Type guard
function isValidData(data: unknown): data is RawData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}

// ❌ Bad: Non-null assertion abuse
const name = user!.name;

// ✅ Good: Optional chaining and nullish coalescing
const name = user?.name ?? 'Unknown';

// ✅ Good: Exhaustive switch checks
function getLoanStatusLabel(status: LoanStatus): string {
  switch (status) {
    case LoanStatus.DRAFT:
      return 'Draft';
    case LoanStatus.SUBMITTED:
      return 'Submitted';
    case LoanStatus.APPROVED:
      return 'Approved';
    case LoanStatus.REJECTED:
      return 'Rejected';
    case LoanStatus.DISBURSED:
      return 'Disbursed';
    default:
      // TypeScript will error if a case is missing
      const _exhaustive: never = status;
      throw new Error(`Unknown status: ${_exhaustive}`);
  }
}
```

### 3.3 Utility Types

```typescript
// Pick specific properties
type LoanSummary = Pick<Loan, 'id' | 'amount' | 'status'>;

// Omit properties
type CreateLoanRequest = Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>;

// Partial for updates
type UpdateLoanRequest = Partial<CreateLoanRequest>;

// Required fields
type RequiredLoan = Required<Loan>;

// Make readonly
type ImmutableLoan = Readonly<Loan>;

// Record type
type LoansByStatus = Record<LoanStatus, Loan[]>;

// Extract from union
type ActiveStatus = Extract<LoanStatus, LoanStatus.APPROVED | LoanStatus.DISBURSED>;

// Exclude from union
type PendingStatus = Exclude<LoanStatus, LoanStatus.APPROVED | LoanStatus.REJECTED>;
```

---

## 4. React Component Standards

### 4.1 Functional Component Structure

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button } from '@mui/material';

import { useLoan } from '@modules/loan/hooks/useLoan';
import { formatCurrency } from '@utils/formatters';
import type { Loan } from '@types/loan.types';

// Props interface
interface LoanCardProps {
  /** The loan data to display */
  loan: Loan;
  /** Callback when view details is clicked */
  onViewDetails: (loanId: string) => void;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Displays a loan summary card with key information.
 *
 * @example
 * <LoanCard
 *   loan={loanData}
 *   onViewDetails={handleViewDetails}
 * />
 */
export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onViewDetails,
  isLoading = false,
  className,
}) => {
  // 1. Hooks (state, context, custom hooks)
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { canApprove } = useLoan(loan.id);

  // 2. Memoized values
  const formattedAmount = useMemo(
    () => formatCurrency(loan.amount),
    [loan.amount]
  );

  // 3. Callbacks
  const handleViewClick = useCallback(() => {
    onViewDetails(loan.id);
  }, [loan.id, onViewDetails]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // 4. Early returns for edge cases
  if (isLoading) {
    return <LoanCardSkeleton />;
  }

  // 5. Render
  return (
    <Box
      className={className}
      sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
      role="article"
      aria-label={t('loan.card.ariaLabel', { id: loan.id })}
    >
      <Typography variant="h6" component="h3">
        {loan.id}
      </Typography>

      <Typography variant="body1" color="text.secondary">
        {t('loan.amount')}: {formattedAmount}
      </Typography>

      <Typography variant="body2">
        {t('loan.status')}: {t(`loan.status.${loan.status}`)}
      </Typography>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleViewClick}
          aria-label={t('loan.viewDetails')}
        >
          {t('common.viewDetails')}
        </Button>

        {canApprove && (
          <Button variant="contained" size="small" color="primary">
            {t('loan.approve')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

// Default export for lazy loading
export default LoanCard;
```

### 4.2 Component Organization

```typescript
// index.ts - Barrel export
export { LoanCard } from './LoanCard';
export { LoanCardSkeleton } from './LoanCardSkeleton';
export type { LoanCardProps } from './LoanCard';

// Compound components
export const LoanCard = Object.assign(LoanCardBase, {
  Header: LoanCardHeader,
  Body: LoanCardBody,
  Actions: LoanCardActions,
});

// Usage
<LoanCard>
  <LoanCard.Header title={loan.id} />
  <LoanCard.Body loan={loan} />
  <LoanCard.Actions onApprove={handleApprove} />
</LoanCard>
```

### 4.3 Custom Hooks

```typescript
// hooks/useLoanForm.ts
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { loanApi } from '@services/api/loanApi';
import { loanFormSchema, type LoanFormData } from './loanForm.schema';

interface UseLoanFormOptions {
  onSuccess?: (loan: Loan) => void;
  onError?: (error: Error) => void;
}

interface UseLoanFormReturn {
  form: UseFormReturn<LoanFormData>;
  isSubmitting: boolean;
  submitError: Error | null;
  handleSubmit: (data: LoanFormData) => Promise<void>;
  resetForm: () => void;
}

export function useLoanForm(options: UseLoanFormOptions = {}): UseLoanFormReturn {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      amount: 0,
      tenure: 12,
      purpose: '',
    },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: loanApi.createLoan,
    onSuccess: (loan) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      form.reset();
      options.onSuccess?.(loan);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  const handleSubmit = async (data: LoanFormData) => {
    await mutation.mutateAsync(data);
  };

  return {
    form,
    isSubmitting: mutation.isPending,
    submitError: mutation.error,
    handleSubmit,
    resetForm: form.reset,
  };
}
```

### 4.4 Props Patterns

```typescript
// Children prop
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// Render prop
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

// Polymorphic component
interface ButtonBaseProps<C extends React.ElementType> {
  as?: C;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

type ButtonProps<C extends React.ElementType> = ButtonBaseProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonBaseProps<C>>;

function Button<C extends React.ElementType = 'button'>({
  as,
  children,
  variant = 'primary',
  ...props
}: ButtonProps<C>) {
  const Component = as || 'button';
  return <Component {...props}>{children}</Component>;
}

// Usage
<Button>Click me</Button>
<Button as="a" href="/link">Link Button</Button>
<Button as={Link} to="/route">Router Link</Button>
```

---

## 5. State Management

### 5.1 Redux Toolkit Slice

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginCredentials } from '@types/auth.types';
import { authService } from '@services/auth/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.user;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
```

### 5.2 RTK Query API

```typescript
// services/api/loanApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Loan, CreateLoanRequest, LoanListParams } from '@types/loan.types';
import type { PaginatedResponse, ApiResponse } from '@types/api.types';

export const loanApi = createApi({
  reducerPath: 'loanApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Loan', 'LoanList'],
  endpoints: (builder) => ({
    // Get loans with pagination
    getLoans: builder.query<PaginatedResponse<Loan>, LoanListParams>({
      query: (params) => ({
        url: '/loans',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Loan' as const, id })),
              { type: 'LoanList' },
            ]
          : [{ type: 'LoanList' }],
    }),

    // Get single loan
    getLoan: builder.query<ApiResponse<Loan>, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (result, error, id) => [{ type: 'Loan', id }],
    }),

    // Create loan
    createLoan: builder.mutation<ApiResponse<Loan>, CreateLoanRequest>({
      query: (body) => ({
        url: '/loans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LoanList' }],
    }),

    // Update loan
    updateLoan: builder.mutation<ApiResponse<Loan>, { id: string; data: Partial<Loan> }>({
      query: ({ id, data }) => ({
        url: `/loans/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Loan', id },
        { type: 'LoanList' },
      ],
    }),

    // Approve loan
    approveLoan: builder.mutation<ApiResponse<Loan>, { id: string; data: ApproveRequest }>({
      query: ({ id, data }) => ({
        url: `/loans/${id}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Loan', id },
        { type: 'LoanList' },
      ],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useApproveLoanMutation,
} = loanApi;
```

### 5.3 Usage in Components

```typescript
// LoanListPage.tsx
import { useGetLoansQuery } from '@services/api/loanApi';

export const LoanListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<LoanStatus | undefined>();

  const { data, isLoading, isFetching, error, refetch } = useGetLoansQuery({
    page,
    size: 20,
    status,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <Box>
      <LoanFilters status={status} onStatusChange={setStatus} />

      <LoanTable
        loans={data?.data ?? []}
        isLoading={isFetching}
      />

      <Pagination
        page={page}
        totalPages={data?.pagination.totalPages ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
};
```

---

## 6. Form Handling

### 6.1 Zod Schema

```typescript
// schemas/loanForm.schema.ts
import { z } from 'zod';

export const loanFormSchema = z.object({
  customerId: z
    .string()
    .min(1, { message: 'validation.customerRequired' }),

  amount: z
    .number({ invalid_type_error: 'validation.amountRequired' })
    .min(10000, { message: 'validation.amountMin' })
    .max(100000000, { message: 'validation.amountMax' }),

  tenure: z
    .number()
    .min(6, { message: 'validation.tenureMin' })
    .max(84, { message: 'validation.tenureMax' }),

  purpose: z
    .string()
    .min(1, { message: 'validation.purposeRequired' })
    .max(500, { message: 'validation.purposeMaxLength' }),

  nid: z
    .string()
    .regex(/^(\d{13}|\d{17})$/, { message: 'validation.nidFormat' }),

  collaterals: z.array(
    z.object({
      type: z.enum(['PROPERTY', 'VEHICLE', 'FDR', 'OTHER']),
      value: z.number().min(0),
      description: z.string().max(500).optional(),
    })
  ).optional(),
});

export type LoanFormData = z.infer<typeof loanFormSchema>;
```

### 6.2 Form Component

```typescript
// components/LoanForm/LoanForm.tsx
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormHelperText,
} from '@mui/material';

import { loanFormSchema, type LoanFormData } from './loanForm.schema';
import { CurrencyInput } from '@components/forms/CurrencyInput';

interface LoanFormProps {
  onSubmit: (data: LoanFormData) => Promise<void>;
  defaultValues?: Partial<LoanFormData>;
  isLoading?: boolean;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const methods = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      amount: 0,
      tenure: 12,
      purpose: '',
      ...defaultValues,
    },
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = methods;

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {/* Customer ID */}
        <Controller
          name="customerId"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t('loan.form.customerId')}
              error={!!fieldState.error}
              helperText={fieldState.error && t(fieldState.error.message!)}
              required
              fullWidth
            />
          )}
        />

        {/* Amount */}
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <CurrencyInput
              {...field}
              label={t('loan.form.amount')}
              error={!!fieldState.error}
              helperText={fieldState.error && t(fieldState.error.message!)}
              required
            />
          )}
        />

        {/* Tenure */}
        <Controller
          name="tenure"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              label={t('loan.form.tenure')}
              error={!!fieldState.error}
              helperText={fieldState.error && t(fieldState.error.message!)}
              required
              fullWidth
            >
              {[6, 12, 24, 36, 48, 60, 72, 84].map((months) => (
                <MenuItem key={months} value={months}>
                  {t('loan.form.months', { count: months })}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* Purpose */}
        <Controller
          name="purpose"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t('loan.form.purpose')}
              error={!!fieldState.error}
              helperText={fieldState.error && t(fieldState.error.message!)}
              multiline
              rows={3}
              required
              fullWidth
            />
          )}
        />

        {/* Submit Button */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => methods.reset()}
            disabled={isLoading}
          >
            {t('common.reset')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || !isValid || isLoading}
          >
            {isLoading ? t('common.submitting') : t('common.submit')}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};
```

---

## 7. API Integration

### 7.1 API Client Configuration

```typescript
// services/api/apiClient.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@store';
import { logout } from '@store/slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant header
    const tenantId = store.getState().auth.user?.tenantId;
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = '/login';
    }

    // Transform error for consistent handling
    const apiError: ApiError = {
      message: error.message,
      status: error.response?.status,
      code: (error.response?.data as any)?.code,
      details: (error.response?.data as any)?.errors,
    };

    return Promise.reject(apiError);
  }
);
```

### 7.2 TanStack Query Setup

```typescript
// App.tsx or providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.status && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

---

## 8. Styling Standards

### 8.1 MUI Theme Configuration

```typescript
// styles/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    success: {
      main: '#2e7d32',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Noto Sans Bengali", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);
```

### 8.2 sx Prop Usage

```typescript
// ✅ Good: Consistent sx usage
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    p: 3,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 1,
  }}
>
  <Typography variant="h5" sx={{ mb: 2 }}>
    {title}
  </Typography>
</Box>

// ✅ Good: Responsive values
<Box
  sx={{
    width: { xs: '100%', sm: '50%', md: '33%' },
    p: { xs: 1, sm: 2, md: 3 },
  }}
/>

// ✅ Good: Theme-based values
<Box
  sx={(theme) => ({
    color: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem',
    },
  })}
/>
```

---

## 9. Internationalization (i18n)

### 9.1 Configuration

```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import bnTranslation from './locales/bn/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      bn: { translation: bnTranslation },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'bn'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

### 9.2 Translation Files

```json
// locales/en/translation.json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "loan": {
    "title": "Loan Application",
    "form": {
      "amount": "Loan Amount",
      "tenure": "Tenure",
      "purpose": "Purpose"
    },
    "status": {
      "DRAFT": "Draft",
      "SUBMITTED": "Submitted",
      "APPROVED": "Approved"
    }
  },
  "validation": {
    "required": "This field is required",
    "amountMin": "Minimum amount is BDT 10,000",
    "nidFormat": "NID must be 13 or 17 digits"
  }
}

// locales/bn/translation.json
{
  "common": {
    "submit": "জমা দিন",
    "cancel": "বাতিল",
    "save": "সংরক্ষণ করুন",
    "delete": "মুছুন",
    "loading": "লোড হচ্ছে...",
    "error": "একটি ত্রুটি ঘটেছে"
  },
  "loan": {
    "title": "ঋণ আবেদন",
    "form": {
      "amount": "ঋণের পরিমাণ",
      "tenure": "মেয়াদ",
      "purpose": "উদ্দেশ্য"
    },
    "status": {
      "DRAFT": "খসড়া",
      "SUBMITTED": "জমা দেওয়া হয়েছে",
      "APPROVED": "অনুমোদিত"
    }
  },
  "validation": {
    "required": "এই ক্ষেত্রটি প্রয়োজনীয়",
    "amountMin": "সর্বনিম্ন পরিমাণ ১০,০০০ টাকা",
    "nidFormat": "জাতীয় পরিচয়পত্র নম্বর ১৩ বা ১৭ সংখ্যার হতে হবে"
  }
}
```

### 9.3 Usage

```typescript
// Using t function
const { t, i18n } = useTranslation();

// Simple translation
<Typography>{t('loan.title')}</Typography>

// With interpolation
<Typography>{t('loan.amount', { amount: formatCurrency(1000000) })}</Typography>

// Pluralization
<Typography>{t('loan.form.months', { count: 12 })}</Typography>

// Language switcher
<Button onClick={() => i18n.changeLanguage('bn')}>বাংলা</Button>
<Button onClick={() => i18n.changeLanguage('en')}>English</Button>
```

---

## 10. Accessibility Standards

### 10.1 ARIA Labels and Roles

```typescript
// ✅ Good: Proper ARIA usage
<Button
  aria-label={t('loan.approve')}
  aria-describedby="approve-description"
  onClick={handleApprove}
>
  <CheckIcon />
</Button>
<span id="approve-description" className="sr-only">
  {t('loan.approveDescription')}
</span>

// ✅ Good: Form accessibility
<TextField
  id="loan-amount"
  label={t('loan.form.amount')}
  aria-required="true"
  aria-invalid={!!errors.amount}
  aria-describedby={errors.amount ? 'amount-error' : undefined}
  inputProps={{
    'aria-label': t('loan.form.amountAriaLabel'),
  }}
/>
{errors.amount && (
  <FormHelperText id="amount-error" error>
    {t(errors.amount.message)}
  </FormHelperText>
)}

// ✅ Good: Table accessibility
<TableContainer role="region" aria-label={t('loan.list.title')}>
  <Table aria-describedby="table-description">
    <caption id="table-description" className="sr-only">
      {t('loan.list.description')}
    </caption>
    <TableHead>
      <TableRow>
        <TableCell scope="col">{t('loan.id')}</TableCell>
      </TableRow>
    </TableHead>
  </Table>
</TableContainer>
```

### 10.2 Keyboard Navigation

```typescript
// ✅ Good: Focus management
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && dialogRef.current) {
    dialogRef.current.focus();
  }
}, [isOpen]);

// ✅ Good: Skip links
<a href="#main-content" className="skip-link">
  {t('accessibility.skipToMain')}
</a>

// ✅ Good: Focus trap for modals (use react-focus-lock)
import FocusLock from 'react-focus-lock';

<FocusLock>
  <Dialog open={open}>
    {/* Dialog content */}
  </Dialog>
</FocusLock>
```

---

## 11. Testing Standards

### 11.1 Unit Test with Vitest

```typescript
// LoanCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoanCard } from './LoanCard';
import { TestProviders } from '@test/utils';

const mockLoan = {
  id: 'LOAN-001',
  amount: 500000,
  status: 'APPROVED' as const,
  customerId: 'CUST-001',
  createdAt: new Date().toISOString(),
};

describe('LoanCard', () => {
  it('renders loan information correctly', () => {
    render(
      <LoanCard loan={mockLoan} onViewDetails={vi.fn()} />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('LOAN-001')).toBeInTheDocument();
    expect(screen.getByText(/500,000/)).toBeInTheDocument();
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
  });

  it('calls onViewDetails when button is clicked', async () => {
    const user = userEvent.setup();
    const handleViewDetails = vi.fn();

    render(
      <LoanCard loan={mockLoan} onViewDetails={handleViewDetails} />,
      { wrapper: TestProviders }
    );

    await user.click(screen.getByRole('button', { name: /view details/i }));

    expect(handleViewDetails).toHaveBeenCalledWith('LOAN-001');
  });

  it('shows loading skeleton when isLoading is true', () => {
    render(
      <LoanCard loan={mockLoan} onViewDetails={vi.fn()} isLoading />,
      { wrapper: TestProviders }
    );

    expect(screen.getByTestId('loan-card-skeleton')).toBeInTheDocument();
  });
});
```

### 11.2 E2E Test with Playwright

```typescript
// e2e/loan-application.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Loan Application', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'officer@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new loan application', async ({ page }) => {
    await page.goto('/loans/new');

    // Fill form
    await page.fill('[name="customerId"]', 'CUST-001');
    await page.fill('[name="amount"]', '500000');
    await page.selectOption('[name="tenure"]', '36');
    await page.fill('[name="purpose"]', 'Home renovation');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.MuiAlert-standardSuccess')).toBeVisible();
    await expect(page).toHaveURL(/\/loans\/LOAN-/);
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/loans/new');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check validation messages
    await expect(page.locator('text=This field is required')).toHaveCount(3);
  });
});
```

---

## 12. Performance Optimization

### 12.1 Code Splitting

```typescript
// Lazy loading routes
const LoanListPage = lazy(() => import('@modules/loan/pages/LoanListPage'));
const LoanDetailPage = lazy(() => import('@modules/loan/pages/LoanDetailPage'));

// Router configuration
<Routes>
  <Route
    path="/loans"
    element={
      <Suspense fallback={<PageLoader />}>
        <LoanListPage />
      </Suspense>
    }
  />
</Routes>
```

### 12.2 Memoization

```typescript
// Memoize expensive calculations
const totalAmount = useMemo(
  () => loans.reduce((sum, loan) => sum + loan.amount, 0),
  [loans]
);

// Memoize callbacks
const handleSort = useCallback(
  (column: string) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  },
  []
);

// Memoize components
const MemoizedLoanCard = memo(LoanCard, (prevProps, nextProps) => {
  return prevProps.loan.id === nextProps.loan.id &&
         prevProps.loan.status === nextProps.loan.status;
});
```

### 12.3 Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const LoanList: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: loans.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <LoanCard loan={loans[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Appendix: Quick Reference

### React Hooks

| Hook | Purpose |
|------|---------|
| `useState` | Local component state |
| `useEffect` | Side effects |
| `useContext` | Access context |
| `useReducer` | Complex state logic |
| `useCallback` | Memoize callbacks |
| `useMemo` | Memoize values |
| `useRef` | Mutable refs |

### Common Patterns

```typescript
// Conditional rendering
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// List rendering
{items.map((item) => (
  <ListItem key={item.id} item={item} />
))}

// Event handling
<Button onClick={(e) => handleClick(e, item.id)}>Click</Button>
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Frontend Developer | | | |
| Technical Lead | | | |

---

**Document End**

*ULMS v2.0 - TypeScript/React Coding Standards v1.0*

*Unisoft Systems Limited - Confidential*
