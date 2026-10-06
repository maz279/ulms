# React Frontend Architecture Document
## ULMS v2.0 Frontend Technical Architecture

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | React Frontend Architecture Document |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer, Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Frontend Developer | Initial architecture document |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Module Architecture](#4-module-architecture)
5. [State Management Architecture](#5-state-management-architecture)
6. [API Integration Layer](#6-api-integration-layer)
7. [Component Architecture](#7-component-architecture)
8. [Performance Considerations](#8-performance-considerations)
9. [Security Architecture](#9-security-architecture)
10. [Appendices](#10-appendices)

---

## 1. Architecture Overview

### 1.1 Design Philosophy

The ULMS v2.0 frontend follows a **modular, domain-driven architecture** built on React 18 with TypeScript. The architecture emphasizes:

- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Reusability**: Shared components and hooks across modules
- **Testability**: Isolated units with clear dependencies
- **Scalability**: Module-based structure supporting team growth
- **Maintainability**: TypeScript for type safety and better developer experience

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULMS REACT FRONTEND ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ │   │
│  │  │   Pages     │ │  Layouts    │ │   Forms     │ │   Dashboards   │ │   │
│  │  │  (Views)    │ │(Navigation) │ │(Validation) │ │  (Analytics)   │ │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └───────┬────────┘ │   │
│  │         │               │               │                │          │   │
│  │  ┌──────▼───────────────▼───────────────▼────────────────▼────────┐ │   │
│  │  │                     COMPONENT LAYER                             │ │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │   │
│  │  │  │   MUI    │ │  Custom  │ │  Forms   │ │     Charts       │  │ │   │
│  │  │  │Components│ │Components│ │Components│ │   (Recharts)     │  │ │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │   │
│  │  └────────────────────────┬──────────────────────────────────────┘ │   │
│  └─────────────────────────────┼──────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼──────────────────────────────────────┐   │
│  │                        STATE LAYER                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │   Redux Toolkit │  │   RTK Query     │  │   Local/UI State    │ │   │
│  │  │  (Client State) │  │  (Server State) │  │   (React Hooks)     │ │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼──────────────────────────────────────┐   │
│  │                        SERVICE LAYER                                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │   │
│  │  │  API Client  │ │   Auth       │ │   Storage    │ │  Utils   │  │   │
│  │  │  (Axios)     │ │  (Keycloak)  │ │  (Adapter)   │ │(Helpers) │  │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     BACKEND API (Kong Gateway)                       │   │
│  │              REST APIs │ WebSocket │ File Upload                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Core Technologies

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| React | 18.2.0 | UI Framework | Concurrent features, improved performance |
| TypeScript | 5.3.3 | Type System | Type safety, better DX, reduced bugs |
| Vite | 5.0.0 | Build Tool | Fast HMR, optimized builds |
| React Router | 6.21.0 | Navigation | Declarative routing, code splitting |

### 2.2 State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| Redux Toolkit | 2.0.0 | Global state management |
| RTK Query | 2.0.0 | Server state, caching |
| React Query | 5.17.0 | Alternative for complex queries |

### 2.3 UI Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Material-UI (MUI) | 5.15.0 | Component library |
| MUI X Data Grid | 6.18.0 | Advanced data tables |
| MUI X Date Pickers | 6.18.0 | Date/time components |

### 2.4 Form Handling

| Technology | Version | Purpose |
|------------|---------|---------|
| React Hook Form | 7.49.0 | Form management |
| Zod | 3.22.0 | Schema validation |
| @hookform/resolvers | 3.3.0 | Validation integration |

### 2.5 Additional Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| Axios | 1.6.0 | HTTP client |
| React-i18next | 14.0.0 | Internationalization |
| Recharts | 2.10.0 | Data visualization |
| date-fns | 3.0.0 | Date manipulation |
| lodash-es | 4.17.21 | Utility functions |

---

## 3. Project Structure

### 3.1 Directory Organization

```
ulms-frontend/
├── public/                          # Static assets
│   ├── locales/                     # Translation files
│   │   ├── bn/                      # Bengali translations
│   │   └── en/                      # English translations
│   └── assets/                      # Images, fonts
│
├── src/
│   ├── modules/                     # Feature modules
│   │   ├── los/                     # Loan Origination System
│   │   ├── credit/                  # Credit Management
│   │   ├── workflow/                # Approval Workflow
│   │   ├── disbursement/            # Loan Disbursement
│   │   ├── servicing/               # Loan Servicing
│   │   ├── collections/             # Collections
│   │   ├── reporting/               # Reports & Dashboards
│   │   └── admin/                   # Administration
│   │
│   ├── shared/                      # Shared resources
│   │   ├── components/              # Reusable components
│   │   │   ├── common/              # Generic components
│   │   │   ├── data-display/        # Tables, cards
│   │   │   ├── feedback/            # Alerts, dialogs
│   │   │   ├── inputs/              # Form components
│   │   │   └── layout/              # Layout components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utility functions
│   │   ├── types/                   # Shared TypeScript types
│   │   ├── constants/               # Application constants
│   │   └── styles/                  # Global styles, themes
│   │
│   ├── services/                    # API and external services
│   │   ├── api/                     # API clients
│   │   ├── auth/                    # Authentication service
│   │   ├── storage/                 # Storage adapters
│   │   └── websocket/               # WebSocket client
│   │
│   ├── store/                       # Redux store configuration
│   │   ├── index.ts                 # Store setup
│   │   ├── slices/                  # Redux slices
│   │   └── middleware/              # Custom middleware
│   │
│   ├── config/                      # Application configuration
│   │   ├── api.config.ts            # API endpoints
│   │   ├── theme.config.ts          # Theme configuration
│   │   └── routes.config.ts         # Route definitions
│   │
│   ├── providers/                   # React context providers
│   │   ├── AppProviders.tsx         # Main provider composition
│   │   ├── AuthProvider.tsx         # Auth context
│   │   └── ThemeProvider.tsx        # Theme context
│   │
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Application entry
│   └── vite-env.d.ts                # Vite types
│
├── .env.development                 # Development environment
├── .env.production                  # Production environment
├── .env.staging                     # Staging environment
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.js                 # ESLint configuration
└── package.json                     # Dependencies
```

### 3.2 Module Structure

Each module follows a consistent internal structure:

```
modules/[module-name]/
├── components/                      # Module-specific components
│   ├── [Feature]List.tsx
│   ├── [Feature]Form.tsx
│   ├── [Feature]Detail.tsx
│   └── index.ts                     # Barrel export
├── hooks/                           # Module-specific hooks
│   ├── use[Feature].ts
│   └── index.ts
├── services/                        # Module API calls
│   ├── [feature]Api.ts
│   └── index.ts
├── types/                           # Module types
│   ├── [feature].types.ts
│   └── index.ts
├── constants/                       # Module constants
│   └── [feature].constants.ts
├── utils/                           # Module utilities
│   └── [feature].utils.ts
├── pages/                           # Module pages (route components)
│   ├── [Feature]ListPage.tsx
│   ├── [Feature]CreatePage.tsx
│   └── [Feature]DetailPage.tsx
├── routes.tsx                       # Module routes
└── index.ts                         # Module public API
```

---

## 4. Module Architecture

### 4.1 Module Definition

```typescript
// modules/los/index.ts
export { default as LOSRoutes } from './routes';
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

// Public API types
export interface LOSModuleConfig {
  enabledFeatures: string[];
  defaultWorkflow: string;
}
```

### 4.2 Route Configuration

```typescript
// modules/los/routes.tsx
import { RouteObject } from 'react-router-dom';
import { LoanApplicationListPage } from './pages/LoanApplicationListPage';
import { LoanApplicationCreatePage } from './pages/LoanApplicationCreatePage';
import { LoanApplicationDetailPage } from './pages/LoanApplicationDetailPage';

const losRoutes: RouteObject[] = [
  {
    path: 'los',
    children: [
      {
        path: 'applications',
        element: <LoanApplicationListPage />,
      },
      {
        path: 'applications/new',
        element: <LoanApplicationCreatePage />,
      },
      {
        path: 'applications/:id',
        element: <LoanApplicationDetailPage />,
      },
    ],
  },
];

export default losRoutes;
```

### 4.3 Lazy Loading Pattern

```typescript
// routes.tsx - Main application routes
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/shared/components/layout';
import { PageLoader } from '@/shared/components/feedback';

// Lazy load modules
const LOSRoutes = lazy(() => import('@/modules/los').then(m => ({ default: m.LOSRoutes })));
const CreditRoutes = lazy(() => import('@/modules/credit').then(m => ({ default: m.CreditRoutes })));
const WorkflowRoutes = lazy(() => import('@/modules/workflow').then(m => ({ default: m.WorkflowRoutes })));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'los/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LOSRoutes />
          </Suspense>
        ),
      },
      {
        path: 'credit/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreditRoutes />
          </Suspense>
        ),
      },
      {
        path: 'workflow/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkflowRoutes />
          </Suspense>
        ),
      },
    ],
  },
]);

export default router;
```

---

## 5. State Management Architecture

### 5.1 State Categories

| State Type | Technology | Use Case |
|------------|------------|----------|
| Server State | RTK Query | API data, caching, synchronization |
| Global Client State | Redux Toolkit | Auth, user preferences, app-wide UI |
| Local Component State | useState/useReducer | Form inputs, UI toggles |
| URL State | React Router | Filters, pagination, selection |

### 5.2 Redux Store Configuration

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from '@/services/api/apiSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 5.3 RTK Query API Slice

```typescript
// services/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

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

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'LoanApplication',
    'Customer',
    'CIBReport',
    'WorkflowTask',
    'User',
  ],
  endpoints: () => ({}),
});
```

---

## 6. API Integration Layer

### 6.1 API Client Configuration

```typescript
// services/api/client.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = store.getState().auth.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          store.dispatch(logout());
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError<ApiError>): AppError {
    return {
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || 'An unexpected error occurred',
      details: error.response?.data?.details,
      status: error.response?.status,
    };
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;
```

---

## 7. Component Architecture

### 7.1 Component Categories

| Category | Purpose | Example |
|----------|---------|---------|
| Pages | Route-level components | `LoanApplicationListPage` |
| Layouts | Structural wrappers | `MainLayout`, `AuthLayout` |
| Features | Domain-specific composites | `LoanApplicationForm` |
| UI Components | Reusable presentational | `DataGrid`, `FormInput` |
| Hooks | Reusable logic | `useLoanApplication`, `useAuth` |

### 7.2 Component Pattern Example

```typescript
// shared/components/data-display/DataTable.tsx
import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';

interface DataTableProps<T> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  rowCount?: number;
  paginationModel?: GridPaginationModel;
  sortModel?: GridSortModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  onSortModelChange?: (model: GridSortModel) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  loading = false,
  rowCount,
  paginationModel,
  sortModel,
  onPaginationModelChange,
  onSortModelChange,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>): React.ReactElement {
  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationModel={paginationModel}
        sortModel={sortModel}
        onPaginationModelChange={onPaginationModelChange}
        onSortModelChange={onSortModelChange}
        onRowClick={onRowClick ? (params) => onRowClick(params.row as T) : undefined}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{emptyMessage}</Typography>
            </Box>
          ),
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
      />
    </Box>
  );
}
```

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

| Strategy | Implementation | Benefit |
|----------|---------------|---------|
| Code Splitting | React.lazy + Suspense | Reduced initial bundle size |
| Memoization | React.memo, useMemo | Prevent unnecessary re-renders |
| Virtualization | MUI Data Grid virtualization | Handle large datasets |
| Image Optimization | Lazy loading, WebP format | Faster page loads |
| Caching | RTK Query cache | Reduce API calls |

### 8.2 Bundle Analysis

```bash
# Analyze bundle size
npm run analyze

# Build with source maps for analysis
npm run build -- --sourcemap
```

---

## 9. Security Architecture

### 9.1 Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Authentication | JWT tokens | Keycloak integration |
| Authorization | RBAC | Route guards, component guards |
| Data Protection | Input sanitization | DOMPurify for HTML |
| Transport | HTTPS | Enforced in production |
| Storage | Secure cookies | httpOnly, secure flags |

### 9.2 Route Guard Example

```typescript
// shared/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.some(role => user?.roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 10. Appendices

### Appendix A: Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.ulms.unisoft.com.bd/v1` |
| `VITE_AUTH_REALM` | Keycloak realm | `ulms-realm` |
| `VITE_AUTH_CLIENT_ID` | Keycloak client ID | `ulms-web` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.ulms.unisoft.com.bd/ws` |

### Appendix B: Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
