# React Router Configuration

## Routing Architecture for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | React Router Configuration |
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
2. [Router Configuration](#2-router-configuration)
3. [Route Structure](#3-route-structure)
4. [Authentication Guards](#4-authentication-guards)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Lazy Loading](#6-lazy-loading)
7. [Error Handling](#7-error-handling)
8. [Navigation Patterns](#8-navigation-patterns)
9. [Related Documents](#9-related-documents)

---

## 1. Executive Summary

This document defines the routing architecture for ULMS v2.0 using React Router v6, including route configuration, authentication guards, role-based access control, and lazy loading for optimal performance.

---

## 2. Router Configuration

### 2.1 Main Router Setup

```typescript
// app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import { PageSkeleton } from '../components/feedback/PageSkeleton';

// Layouts
import { RootLayout } from '../components/layout/RootLayout';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthLayout } from '../components/layout/AuthLayout';

// Guards
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleGuard } from '../components/auth/RoleGuard';

// Lazy-loaded feature routes
const LOSRoutes = lazy(() => import('../features/los/routes'));
const CreditRoutes = lazy(() => import('../features/credit/routes'));
const WorkflowRoutes = lazy(() => import('../features/workflow/routes'));
const ReportRoutes = lazy(() => import('../features/reporting/routes'));

// Pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary><NotFoundPage /></ErrorBoundary>,
    children: [
      // Public routes
      {
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'login',
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'unauthorized',
            element: <UnauthorizedPage />,
          },
        ],
      },
      
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: 'dashboard',
                element: (
                  <Suspense fallback={<PageSkeleton />}>
                    <DashboardPage />
                  </Suspense>
                ),
              },
              
              // LOS Module - Loan Officers only
              {
                path: 'los/*',
                element: (
                  <RoleGuard allowedRoles={['LOAN_OFFICER', 'BRANCH_MANAGER', 'ADMIN']}>
                    <Suspense fallback={<PageSkeleton />}>
                      <LOSRoutes />
                    </Suspense>
                  </RoleGuard>
                ),
              },
              
              // Credit Module - Credit Analysts
              {
                path: 'credit/*',
                element: (
                  <RoleGuard allowedRoles={['CREDIT_ANALYST', 'BRANCH_MANAGER', 'ADMIN']}>
                    <Suspense fallback={<PageSkeleton />}>
                      <CreditRoutes />
                    </Suspense>
                  </RoleGuard>
                ),
              },
              
              // Workflow Module - All authenticated users
              {
                path: 'workflow/*',
                element: (
                  <Suspense fallback={<PageSkeleton />}>
                    <WorkflowRoutes />
                  </Suspense>
                ),
              },
              
              // Reports Module
              {
                path: 'reports/*',
                element: (
                  <RoleGuard allowedRoles={['BRANCH_MANAGER', 'ADMIN', 'REPORT_VIEWER']}>
                    <Suspense fallback={<PageSkeleton />}>
                      <ReportRoutes />
                    </Suspense>
                  </RoleGuard>
                ),
              },
            ],
          },
        ],
      },
      
      // Catch-all
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
```

---

## 3. Route Structure

### 3.1 Feature Route Configuration

```typescript
// features/los/routes.tsx
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageSkeleton } from '../../components/feedback/PageSkeleton';

const LOSDashboardPage = lazy(() => import('./pages/LOSDashboardPage'));
const ApplicationListPage = lazy(() => import('./pages/ApplicationListPage'));
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage'));
const NewApplicationPage = lazy(() => import('./pages/NewApplicationPage'));
const CustomerRegistrationPage = lazy(() => import('./pages/CustomerRegistrationPage'));

export default function LOSRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route index element={<LOSDashboardPage />} />
        <Route path="applications" element={<ApplicationListPage />} />
        <Route path="applications/new" element={<NewApplicationPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="customers/new" element={<CustomerRegistrationPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 4. Authentication Guards

### 4.1 Protected Route Component

```typescript
// components/auth/ProtectedRoute.tsx
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

---

## 5. Role-Based Access Control

### 5.1 Role Guard Component

```typescript
// components/auth/RoleGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const hasRequiredRole = user?.roles.some((role) => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 6. Lazy Loading

### 6.1 Route-Based Code Splitting

```typescript
// Lazy loading pattern with error boundary
const LoanApplicationPage = lazy(() => 
  import('../pages/LoanApplicationPage').then(module => ({
    default: module.LoanApplicationPage
  }))
);

// With retry logic
const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.localStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });
};
```

---

## 7. Error Handling

### 7.1 Route Error Boundary

```typescript
// components/error/RouteErrorBoundary.tsx
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage
        status={error.status}
        title={error.statusText}
        message={error.data?.message || 'An error occurred'}
      />
    );
  }

  return (
    <ErrorPage
      status={500}
      title="Unexpected Error"
      message="Something went wrong. Please try again."
    />
  );
}
```

---

## 8. Navigation Patterns

### 8.1 Programmatic Navigation

```typescript
// hooks/useNavigation.ts
import { useNavigate, useLocation } from 'react-router-dom';

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToApplication = (id: string) => {
    navigate(`/los/applications/${id}`);
  };

  const goBack = () => {
    navigate(-1);
  };

  const goToLogin = () => {
    navigate('/login', { state: { from: location } });
  };

  return { goToApplication, goBack, goToLogin, navigate };
}
```

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| `[FE]_React_Frontend_Architecture_Document_v1.0.md` | Overall architecture |
| `[FE]_State_Management_Design_Redux_RTK_Query_v1.0.md` | State management |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
