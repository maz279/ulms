# React Frontend Architecture Document

## Frontend Architecture for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | React Frontend Architecture Document |
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
2. [Architectural Overview](#2-architectural-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Component Architecture](#5-component-architecture)
6. [State Management Architecture](#6-state-management-architecture)
7. [Routing Architecture](#7-routing-architecture)
8. [API Integration Layer](#8-api-integration-layer)
9. [Security Architecture](#9-security-architecture)
10. [Performance Architecture](#10-performance-architecture)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Related Documents](#12-related-documents)

---

## 1. Executive Summary

This document defines the frontend architecture for the Unisoft Loan Management System (ULMS) v2.0, a React-based Single Page Application (SPA) designed for Bangladesh's banking sector. The architecture emphasizes modularity, scalability, and maintainability while supporting Bengali (Bangla) localization and Bangladesh Bank regulatory compliance.

### Key Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Modularity** | Feature-based folder structure with clear separation of concerns |
| **Scalability** | Micro-frontend ready architecture with lazy loading |
| **Maintainability** | Strict TypeScript typing and comprehensive documentation |
| **Performance** | Code splitting, memoization, and optimized rendering |
| **Accessibility** | WCAG 2.1 AA compliance for inclusive banking |
| **i18n Ready** | Full Bengali/English bilingual support |

---

## 2. Architectural Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ULMS React Frontend                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   LOS       │  │   Credit    │  │  Workflow   │  │  Reporting  │        │
│  │   Module    │  │   Module    │  │   Module    │  │   Module    │        │
│  │  (Pages)    │  │  (Pages)    │  │  (Pages)    │  │  (Pages)    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                    Shared Components Layer                       │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │        │
│  │  │   UI     │ │  Forms   │ │  Layout  │ │  Charts  │ │ Icons  │ │        │
│  │  │Components│ │Components│ │Components│ │Components│ │        │ │        │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│         │                │                │                │               │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                     Core Services Layer                          │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │        │
│  │  │   API    │ │   Auth   │ │   i18n   │ │  State   │ │ Config │ │        │
│  │  │  Client  │ │  Service │ │  Service │ │ Management│ │ Service│ │        │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│         │                                                                   │
│  ┌──────┴──────────────────────────────────────────────────────────┐        │
│  │                      External APIs                               │        │
│  │         Backend API (Spring Boot) │ CIB │ NID │ Payment          │        │
│  └──────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Patterns

| Pattern | Purpose | Implementation |
|---------|---------|----------------|
| **Container/Presentational** | Separation of logic and UI | Containers with hooks, pure components |
| **Compound Components** | Flexible component APIs | Related components grouped under parent |
| **Render Props** | Component composition | Where HOCs would be overkill |
| **Custom Hooks** | Reusable stateful logic | Business logic abstraction |
| **Provider Pattern** | Context distribution | Auth, Theme, i18n providers |

---

## 3. Technology Stack

### 3.1 Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 18.2 | UI library with concurrent features |
| **Language** | TypeScript | 5.3 | Type safety and developer experience |
| **Build Tool** | Vite | 5.0 | Fast development and optimized builds |
| **UI Library** | Material-UI (MUI) | 5.15 | Component library and theming |
| **State Management** | Redux Toolkit | 2.0 | Global state with RTK Query |
| **Forms** | React Hook Form | 7.x | Performant form handling |
| **Validation** | Zod | 3.x | Schema validation |
| **Routing** | React Router | 6.x | SPA navigation |
| **i18n** | react-i18next | 13.x | Internationalization |
| **Charts** | Recharts | 2.10 | Data visualization |
| **Testing** | Vitest | 1.x | Unit and integration testing |
| **E2E Testing** | Playwright | 1.x | End-to-end testing |

### 3.2 Supporting Libraries

```typescript
// Core dependencies
"dependencies": {
  "@emotion/react": "^11.11.0",
  "@emotion/styled": "^11.11.0",
  "@mui/material": "^5.15.0",
  "@mui/x-data-grid": "^6.18.0",
  "@mui/x-date-pickers": "^6.18.0",
  "@reduxjs/toolkit": "^2.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-hook-form": "^7.49.0",
  "react-i18next": "^13.5.0",
  "react-redux": "^9.0.0",
  "react-router-dom": "^6.21.0",
  "recharts": "^2.10.0",
  "zod": "^3.22.0"
}
```

---

## 4. Project Structure

### 4.1 Directory Layout

```
ulms-frontend/
├── public/                          # Static assets
│   ├── locales/                     # i18n translation files
│   │   ├── bn/                      # Bengali translations
│   │   └── en/                      # English translations
│   └── assets/                      # Images, fonts, icons
├── src/
│   ├── app/                         # App-level configuration
│   │   ├── store.ts                 # Redux store configuration
│   │   ├── providers.tsx            # App providers composition
│   │   └── routes.tsx               # Route definitions
│   ├── features/                    # Feature-based modules
│   │   ├── auth/                    # Authentication feature
│   │   ├── los/                     # Loan Origination System
│   │   ├── credit/                  # Credit assessment
│   │   ├── workflow/                # Approval workflow
│   │   ├── reporting/               # Reports and dashboards
│   │   └── admin/                   # Administration
│   ├── components/                  # Shared UI components
│   │   ├── common/                  # Generic components
│   │   ├── forms/                   # Form components
│   │   ├── layout/                  # Layout components
│   │   └── feedback/                # Feedback components
│   ├── hooks/                       # Custom React hooks
│   ├── services/                    # API and external services
│   │   ├── api/                     # RTK Query API slices
│   │   ├── auth/                    # Authentication service
│   │   └── storage/                 # Local storage service
│   ├── utils/                       # Utility functions
│   ├── types/                       # Global TypeScript types
│   ├── constants/                   # Application constants
│   ├── theme/                       # MUI theme configuration
│   └── styles/                      # Global styles
├── tests/                           # Test utilities and setup
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json
```

### 4.2 Feature-Based Organization

Each feature module follows this structure:

```
features/[feature-name]/
├── api/                 # API endpoints for this feature
│   └── [feature]Api.ts
├── components/          # Feature-specific components
│   ├── [Component].tsx
│   └── [Component].test.tsx
├── hooks/               # Feature-specific hooks
│   └── use[Feature].ts
├── pages/               # Route-level pages
│   └── [Page].tsx
├── types/               # Feature-specific types
│   └── [feature].types.ts
├── utils/               # Feature-specific utilities
│   └── [feature]Utils.ts
├── constants/           # Feature constants
│   └── [feature]Constants.ts
├── index.ts             # Public API exports
└── routes.ts            # Feature routes
```

---

## 5. Component Architecture

### 5.1 Component Classification

| Level | Naming | Location | Responsibility |
|-------|--------|----------|----------------|
| **Pages** | `*Page.tsx` | `features/*/pages/` | Route-level containers |
| **Containers** | `*Container.tsx` | `features/*/containers/` | Business logic, data fetching |
| **Components** | `*.tsx` | `features/*/components/` | Feature-specific UI |
| **Shared** | `*.tsx` | `components/*/` | Reusable across features |

### 5.2 Component Example

```typescript
// features/los/components/LoanApplicationCard.tsx
import React, { memo } from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { LoanApplication } from '../types/loan.types';

interface LoanApplicationCardProps {
  application: LoanApplication;
  onViewDetails: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const LoanApplicationCard: React.FC<LoanApplicationCardProps> = memo(({
  application,
  onViewDetails,
  onEdit
}) => {
  const { id, applicantName, loanAmount, status, submittedDate } = application;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="h3">
          {applicantName}
        </Typography>
        <Typography color="text.secondary">
          BDT {loanAmount.toLocaleString('en-BD')}
        </Typography>
        <Chip 
          label={status} 
          color={getStatusColor(status)}
          size="small"
        />
      </CardContent>
    </Card>
  );
});

LoanApplicationCard.displayName = 'LoanApplicationCard';
```

---

## 6. State Management Architecture

### 6.1 State Classification

| State Type | Management | Use Case |
|------------|------------|----------|
| **Server State** | RTK Query | API data, caching, synchronization |
| **Global UI State** | Redux | Theme, auth, sidebar, notifications |
| **Feature State** | Redux (slices) | Cross-component feature data |
| **Local State** | useState/useReducer | Component-specific data |
| **Form State** | React Hook Form | Form inputs, validation |
| **URL State** | React Router | Filters, pagination, search |

### 6.2 Redux Store Structure

```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from '../services/api/apiSlice';
import authReducer from '../features/auth/authSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 7. Routing Architecture

### 7.1 Route Configuration

```typescript
// app/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'los/*',
            element: <LOSRoutes />,
          },
          {
            path: 'credit/*',
            element: <CreditRoutes />,
          },
          {
            path: 'workflow/*',
            element: <WorkflowRoutes />,
          },
          {
            path: 'reports/*',
            element: <ReportRoutes />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

---

## 8. API Integration Layer

### 8.1 RTK Query Configuration

```typescript
// services/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../../app/store';

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
  tagTypes: ['Loan', 'Customer', 'Application', 'Report'],
  endpoints: () => ({}),
});
```

### 8.2 Feature API Slice

```typescript
// features/los/api/losApi.ts
import { apiSlice } from '../../../services/api/apiSlice';
import { LoanApplication, CreateApplicationRequest } from '../types/loan.types';

export const losApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoanApplications: builder.query<LoanApplication[], void>({
      query: () => '/loans/applications',
      providesTags: ['Application'],
    }),
    createLoanApplication: builder.mutation<LoanApplication, CreateApplicationRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Application'],
    }),
  }),
});

export const { useGetLoanApplicationsQuery, useCreateLoanApplicationMutation } = losApi;
```

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│  User   │───▶│  Login Form │───▶│  Keycloak   │───▶│  Backend│
└─────────┘    └─────────────┘    └─────────────┘    └─────────┘
     │                                                │
     │              JWT Token                          │
     │◀───────────────────────────────────────────────┘
     │
     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ LocalStorage│───▶│ API Requests│───▶│  Validate   │
│   (Token)   │    │(Auth Header)│    │   Token     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 9.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| **Authentication** | OAuth 2.0 / OIDC via Keycloak |
| **Token Storage** | httpOnly cookies (preferred) or secure localStorage |
| **CSRF Protection** | CSRF tokens for state-changing operations |
| **XSS Prevention** | React's built-in escaping, Content Security Policy |
| **Secure Headers** | HSTS, X-Frame-Options, X-Content-Type-Options |
| **Input Validation** | Zod schemas on client and server |

---

## 10. Performance Architecture

### 10.1 Optimization Strategies

| Strategy | Implementation |
|----------|----------------|
| **Code Splitting** | Route-based lazy loading with React.lazy() |
| **Tree Shaking** | ES modules with dead code elimination |
| **Memoization** | React.memo, useMemo, useCallback |
| **Virtualization** | react-window for long lists |
| **Image Optimization** | WebP format, lazy loading, responsive images |
| **Caching** | RTK Query caching, service worker for assets |

### 10.2 Performance Budgets

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.0s | 1.5s |
| Largest Contentful Paint (LCP) | < 2.0s | 2.5s |
| Time to Interactive (TTI) | < 3.0s | 4.0s |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.1 |
| Total Bundle Size | < 200KB | 250KB |
| JavaScript Bundle (gzipped) | < 150KB | 200KB |

---

## 11. Error Handling Strategy

### 11.1 Error Boundaries

```typescript
// components/error/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 11.2 API Error Handling

```typescript
// hooks/useApiError.ts
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../components/feedback/SnackbarProvider';

export const useApiError = () => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();

  const handleError = useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; data?: { message?: string } };
      
      switch (apiError.status) {
        case 401:
          showError(t('errors.unauthorized'));
          break;
        case 403:
          showError(t('errors.forbidden'));
          break;
        case 404:
          showError(t('errors.notFound'));
          break;
        case 422:
          showError(apiError.data?.message || t('errors.validation'));
          break;
        case 500:
          showError(t('errors.server'));
          break;
        default:
          showError(t('errors.unknown'));
      }
    } else {
      showError(t('errors.unknown'));
    }
  }, [t, showError]);

  return { handleError };
};
```

---

## 12. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| `[FE]_Frontend_Technology_Stack_Specification_v1.0.md` | Detailed tech stack specifications | `01_Architecture/` |
| `[FE]_State_Management_Design_Redux_RTK_Query_v1.0.md` | State management patterns | `01_Architecture/` |
| `[FE]_React_Router_Configuration_v1.0.md` | Routing configuration details | `01_Architecture/` |
| `[FE]_Vite_Build_Configuration_v1.0.md` | Build tool configuration | `01_Architecture/` |
| `[UI]_Component_Library_Documentation_v1.0.md` | UI component guidelines | `02_Component_Library/` |
| `[API]_API_Integration_React_Query_Guide_v1.0.md` | API integration patterns | `05_API_Integration/` |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
