# React Router Configuration
## ULMS v2.0 Routing and Navigation

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | React Router Configuration |
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
| 1.0 | 2026-02-08 | Frontend Developer | Initial configuration |

---

## Table of Contents

1. [Router Overview](#1-router-overview)
2. [Route Configuration](#2-route-configuration)
3. [Navigation Structure](#3-navigation-structure)
4. [Route Guards](#4-route-guards)
5. [Lazy Loading](#5-lazy-loading)
6. [Breadcrumb Integration](#6-breadcrumb-integration)
7. [URL State Management](#7-url-state-management)
8. [Appendices](#8-appendices)

---

## 1. Router Overview

### 1.1 Router Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REACT ROUTER ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         BrowserRouter                                │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                      AuthProvider / AppProviders                     │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                          MainLayout                                  │  │
│  │  ┌──────────────┬──────────────────────────────────┬──────────────┐ │  │
│  │  │   Sidebar    │         Main Content Area        │  Right Panel │ │  │
│  │  │  (NavMenu)   │                                  │  (Optional)  │ │  │
│  │  └──────────────┴──────────────────────────────────┴──────────────┘ │  │
│  │                              │                                       │  │
│  │  ┌───────────────────────────▼────────────────────────────────────┐ │  │
│  │  │                    Outlet (Routes)                              │ │  │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │ │  │
│  │  │  │  /los  │ │/credit │ │ /workflow│ │/reports│ │ /admin │      │ │  │
│  │  │  │routes │ │ routes│ │  routes │ │ routes │ │ routes │      │ │  │
│  │  │  └──┬────┘ └───┬────┘ └────┬────┘ └───┬────┘ └───┬────┘      │ │  │
│  │  │     │         │           │          │          │            │ │  │
│  │  │  ┌──▼─────────▼───────────▼──────────▼──────────▼────────┐   │ │  │
│  │  │  │              Module Pages / Components                 │   │ │  │
│  │  │  └────────────────────────────────────────────────────────┘   │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Router Version

- **Library**: React Router DOM v6.21.0
- **API Style**: Declarative JSX-based routing
- **Features Used**: Nested routes, outlets, loaders, actions

---

## 2. Route Configuration

### 2.1 Main Router Configuration

```typescript
// routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Layouts
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { PageLoader } from '@/shared/components/feedback/PageLoader';

// Direct imports for critical paths
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { UnauthorizedPage } from '@/shared/components/error/UnauthorizedPage';
import { NotFoundPage } from '@/shared/components/error/NotFoundPage';

// Lazy loaded modules
const LOSModule = lazy(() => import('@/modules/los'));
const CreditModule = lazy(() => import('@/modules/credit'));
const WorkflowModule = lazy(() => import('@/modules/workflow'));
const DisbursementModule = lazy(() => import('@/modules/disbursement'));
const ServicingModule = lazy(() => import('@/modules/servicing'));
const CollectionsModule = lazy(() => import('@/modules/collections'));
const ReportingModule = lazy(() => import('@/modules/reporting'));
const AdminModule = lazy(() => import('@/modules/admin'));

// Route guards
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';
import { RoleGuard } from '@/shared/components/auth/RoleGuard';

export const router = createBrowserRouter([
  // Auth routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
    ],
  },
  
  // Protected app routes
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      
      // Dashboard
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      
      // LOS Module - Loan Origination
      {
        path: 'los/*',
        element: (
          <RoleGuard allowedRoles={['BRANCH_USER', 'CREDIT_ANALYST', 'BRANCH_MANAGER']}>
            <Suspense fallback={<PageLoader />}>
              <LOSModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Credit Module
      {
        path: 'credit/*',
        element: (
          <RoleGuard allowedRoles={['CREDIT_ANALYST', 'BRANCH_MANAGER', 'HEAD_OF_CREDIT']}>
            <Suspense fallback={<PageLoader />}>
              <CreditModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Workflow Module
      {
        path: 'workflow/*',
        element: (
          <RoleGuard allowedRoles={['BRANCH_USER', 'BRANCH_MANAGER', 'HEAD_OF_CREDIT', 'MD']}>
            <Suspense fallback={<PageLoader />}>
              <WorkflowModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Disbursement Module
      {
        path: 'disbursement/*',
        element: (
          <RoleGuard allowedRoles={['BRANCH_USER', 'BRANCH_MANAGER']}>
            <Suspense fallback={<PageLoader />}>
              <DisbursementModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Servicing Module
      {
        path: 'servicing/*',
        element: (
          <RoleGuard allowedRoles={['BRANCH_USER', 'BRANCH_MANAGER']}>
            <Suspense fallback={<PageLoader />}>
              <ServicingModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Collections Module
      {
        path: 'collections/*',
        element: (
          <RoleGuard allowedRoles={['COLLECTIONS_OFFICER', 'BRANCH_MANAGER']}>
            <Suspense fallback={<PageLoader />}>
              <CollectionsModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Reporting Module
      {
        path: 'reports/*',
        element: (
          <RoleGuard allowedRoles={['BRANCH_USER', 'BRANCH_MANAGER', 'HEAD_OF_CREDIT', 'REPORT_VIEWER']}>
            <Suspense fallback={<PageLoader />}>
              <ReportingModule />
            </Suspense>
          </RoleGuard>
        ),
      },
      
      // Admin Module
      {
        path: 'admin/*',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'SYSTEM_ADMIN']}>
            <Suspense fallback={<PageLoader />}>
              <AdminModule />
            </Suspense>
          </RoleGuard>
        ),
      },
    ],
  },
  
  // 404 Fallback
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

### 2.2 LOS Module Routes

```typescript
// modules/los/routes.tsx
import { Routes, Route } from 'react-router-dom';
import { LOSSidebar } from './components/LOSSidebar';
import { LoanApplicationListPage } from './pages/LoanApplicationListPage';
import { LoanApplicationCreatePage } from './pages/LoanApplicationCreatePage';
import { LoanApplicationDetailPage } from './pages/LoanApplicationDetailPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { CustomerCreatePage } from './pages/CustomerCreatePage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { ProductConfigPage } from './pages/ProductConfigPage';

export function LOSRoutes(): React.ReactElement {
  return (
    <div style={{ display: 'flex' }}>
      <LOSSidebar />
      <div style={{ flex: 1, padding: '24px' }}>
        <Routes>
          <Route index element={<Navigate to="applications" replace />} />
          
          {/* Loan Applications */}
          <Route path="applications" element={<LoanApplicationListPage />} />
          <Route path="applications/new" element={<LoanApplicationCreatePage />} />
          <Route path="applications/:id" element={<LoanApplicationDetailPage />} />
          <Route path="applications/:id/edit" element={<LoanApplicationCreatePage mode="edit" />} />
          
          {/* Customers */}
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="customers/new" element={<CustomerCreatePage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="customers/:id/edit" element={<CustomerCreatePage mode="edit" />} />
          
          {/* Products */}
          <Route path="products" element={<ProductConfigPage />} />
        </Routes>
      </div>
    </div>
  );
}
```

### 2.3 Route Definitions Type

```typescript
// shared/types/routes.types.ts
export interface RouteDefinition {
  path: string;
  label: string;
  icon?: string;
  roles?: string[];
  children?: RouteDefinition[];
}

export const appRoutes: RouteDefinition[] = [
  {
    path: '/app/dashboard',
    label: 'Dashboard',
    icon: 'Dashboard',
  },
  {
    path: '/app/los',
    label: 'Loan Origination',
    icon: 'Assignment',
    roles: ['BRANCH_USER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'],
    children: [
      { path: '/app/los/applications', label: 'Applications' },
      { path: '/app/los/customers', label: 'Customers' },
      { path: '/app/los/products', label: 'Products' },
    ],
  },
  {
    path: '/app/credit',
    label: 'Credit Management',
    icon: 'CreditScore',
    roles: ['CREDIT_ANALYST', 'BRANCH_MANAGER', 'HEAD_OF_CREDIT'],
    children: [
      { path: '/app/credit/cib', label: 'CIB Reports' },
      { path: '/app/credit/scoring', label: 'Credit Scoring' },
      { path: '/app/credit/assessment', label: 'Risk Assessment' },
    ],
  },
  {
    path: '/app/workflow',
    label: 'Workflow',
    icon: 'AccountTree',
    roles: ['BRANCH_USER', 'BRANCH_MANAGER', 'HEAD_OF_CREDIT', 'MD'],
    children: [
      { path: '/app/workflow/approvals', label: 'Pending Approvals' },
      { path: '/app/workflow/history', label: 'Approval History' },
    ],
  },
  {
    path: '/app/disbursement',
    label: 'Disbursement',
    icon: 'Payment',
    roles: ['BRANCH_USER', 'BRANCH_MANAGER'],
  },
  {
    path: '/app/servicing',
    label: 'Loan Servicing',
    icon: 'AccountBalance',
    roles: ['BRANCH_USER', 'BRANCH_MANAGER'],
  },
  {
    path: '/app/collections',
    label: 'Collections',
    icon: 'Collections',
    roles: ['COLLECTIONS_OFFICER', 'BRANCH_MANAGER'],
  },
  {
    path: '/app/reports',
    label: 'Reports',
    icon: 'Assessment',
    roles: ['BRANCH_USER', 'BRANCH_MANAGER', 'HEAD_OF_CREDIT', 'REPORT_VIEWER'],
    children: [
      { path: '/app/reports/portfolio', label: 'Portfolio Reports' },
      { path: '/app/reports/regulatory', label: 'Regulatory Reports' },
      { path: '/app/reports/custom', label: 'Custom Reports' },
    ],
  },
  {
    path: '/app/admin',
    label: 'Administration',
    icon: 'Settings',
    roles: ['ADMIN', 'SYSTEM_ADMIN'],
    children: [
      { path: '/app/admin/users', label: 'Users' },
      { path: '/app/admin/roles', label: 'Roles' },
      { path: '/app/admin/audit', label: 'Audit Logs' },
      { path: '/app/admin/config', label: 'Configuration' },
    ],
  },
];
```

---

## 3. Navigation Structure

### 3.1 Main Navigation Component

```typescript
// shared/components/layout/Navigation.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard,
  Assignment,
  CreditScore,
  AccountTree,
  Payment,
  AccountBalance,
  Collections,
  Assessment,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '@/shared/hooks/useAuth';
import { appRoutes } from '@/shared/types/routes.types';

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <Dashboard />,
  Assignment: <Assignment />,
  CreditScore: <CreditScore />,
  AccountTree: <AccountTree />,
  Payment: <Payment />,
  AccountBalance: <AccountBalance />,
  Collections: <Collections />,
  Assessment: <Assessment />,
  Settings: <Settings />,
};

export function Navigation(): React.ReactElement {
  const { user } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleMenu = (path: string) => {
    setOpenMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return user?.roles.some((role) => roles.includes(role));
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Drawer variant="permanent" sx={{ width: 260, flexShrink: 0 }}>
      <List sx={{ pt: 2 }}>
        {appRoutes.map((route) => {
          if (!hasAccess(route.roles)) return null;

          const hasChildren = route.children && route.children.length > 0;
          const isMenuOpen = openMenus[route.path];

          return (
            <React.Fragment key={route.path}>
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={route.path}
                  onClick={() => hasChildren && toggleMenu(route.path)}
                  selected={isActive(route.path)}
                >
                  <ListItemIcon>{iconMap[route.icon || '']}</ListItemIcon>
                  <ListItemText primary={route.label} />
                  {hasChildren && (isMenuOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </ListItem>

              {hasChildren && (
                <Collapse in={isMenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {route.children?.map((child) => (
                      <ListItemButton
                        key={child.path}
                        component={NavLink}
                        to={child.path}
                        selected={location.pathname === child.path}
                        sx={{ pl: 4 }}
                      >
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
}
```

---

## 4. Route Guards

### 4.1 Protected Route Component

```typescript
// shared/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { PageLoader } from '@/shared/components/feedback/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  fallback = <PageLoader /> 
}: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### 4.2 Role Guard Component

```typescript
// shared/components/auth/RoleGuard.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps): React.ReactElement {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const hasRequiredRole = user?.roles.some((role) => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 5. Lazy Loading

### 5.1 Module Lazy Loading Pattern

```typescript
// utils/lazyLoad.ts
import { lazy, ComponentType } from 'react';

// Lazy load with retry logic
export function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(() => retryLoad(factory, retries));
}

async function retryLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return retryLoad(factory, retries - 1);
    }
    throw error;
  }
}

// Usage
const LOSModule = lazyLoad(() => import('@/modules/los'));
const CreditModule = lazyLoad(() => import('@/modules/credit'));
```

---

## 6. Breadcrumb Integration

### 6.1 Breadcrumb Component

```typescript
// shared/components/navigation/Breadcrumb.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeNameMap: Record<string, string> = {
  'app': 'Home',
  'los': 'Loan Origination',
  'credit': 'Credit Management',
  'workflow': 'Workflow',
  'applications': 'Applications',
  'customers': 'Customers',
  'cib': 'CIB Reports',
  'approvals': 'Pending Approvals',
};

export function Breadcrumb(): React.ReactElement {
  const location = useLocation();
  
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const breadcrumbs: BreadcrumbItem[] = pathnames.map((value, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    
    return {
      label: routeNameMap[value] || value,
      path: isLast ? undefined : path,
    };
  });

  return (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
      <Link to="/app/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
        Dashboard
      </Link>
      {breadcrumbs.map((item, index) =>
        item.path ? (
          <Link
            key={index}
            to={item.path}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography key={index} color="text.primary">
            {item.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
```

---

## 7. URL State Management

### 7.1 Query Parameter Hooks

```typescript
// shared/hooks/useQueryParams.ts
import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

interface QueryParams {
  [key: string]: string | undefined;
}

export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = useCallback(
    (key: string, defaultValue?: string): string | undefined => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setParams = useCallback(
    (params: QueryParams) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const removeParam = useCallback(
    (key: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(key);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  return {
    searchParams,
    getParam,
    setParam,
    setParams,
    removeParam,
  };
}

// Usage example for filtering
export function useTableFilters() {
  const { getParam, setParams } = useQueryParams();

  return {
    page: parseInt(getParam('page', '1'), 10),
    limit: parseInt(getParam('limit', '20'), 10),
    search: getParam('search'),
    status: getParam('status'),
    sortBy: getParam('sortBy'),
    sortOrder: getParam('sortOrder', 'asc'),
    setFilters: setParams,
  };
}
```

---

## 8. Appendices

### Appendix A: Route URLs Reference

| Module | URL Pattern | Description |
|--------|-------------|-------------|
| Login | `/login` | User authentication |
| Dashboard | `/app/dashboard` | Main dashboard |
| LOS List | `/app/los/applications` | Loan applications list |
| LOS Create | `/app/los/applications/new` | New application form |
| LOS Detail | `/app/los/applications/:id` | Application details |
| LOS Edit | `/app/los/applications/:id/edit` | Edit application |
| Customer List | `/app/los/customers` | Customer list |
| Customer Create | `/app/los/customers/new` | New customer form |
| CIB Reports | `/app/credit/cib` | CIB report viewer |
| Workflow Approvals | `/app/workflow/approvals` | Pending approvals |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
