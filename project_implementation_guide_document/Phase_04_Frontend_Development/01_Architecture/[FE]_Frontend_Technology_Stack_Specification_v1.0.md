# Frontend Technology Stack Specification

## Detailed Technology Stack for ULMS v2.0 Frontend

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Technology Stack Specification |
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
2. [Core Framework](#2-core-framework)
3. [Build and Development Tools](#3-build-and-development-tools)
4. [UI Component Library](#4-ui-component-library)
5. [State Management](#5-state-management)
6. [Form Handling and Validation](#6-form-handling-and-validation)
7. [Routing and Navigation](#7-routing-and-navigation)
8. [Internationalization](#8-internationalization)
9. [Data Visualization](#9-data-visualization)
10. [Testing Framework](#10-testing-framework)
11. [Browser Support Matrix](#11-browser-support-matrix)
12. [Dependency Management](#12-dependency-management)
13. [Related Documents](#13-related-documents)

---

## 1. Executive Summary

This document provides comprehensive specifications for the frontend technology stack of ULMS v2.0. Each technology is evaluated against Bangladesh banking sector requirements, including Bengali language support, accessibility compliance, and regulatory requirements.

### Technology Selection Criteria

| Criteria | Weight | Rationale |
|----------|--------|-----------|
| **Performance** | 25% | Fast load times for banking operations |
| **Maintainability** | 20% | Long-term support and team scalability |
| **Accessibility** | 15% | WCAG 2.1 AA compliance required |
| **i18n Support** | 15% | Bengali/English bilingual requirement |
| **Security** | 15% | Banking-grade security standards |
| **Ecosystem** | 10% | Community support and library availability |

---

## 2. Core Framework

### 2.1 React 18.2

React is selected as the core UI library for its concurrent features, strong ecosystem, and Bangladesh developer availability.

#### Key Features Utilized

| Feature | Purpose | Implementation |
|---------|---------|----------------|
| **Concurrent Rendering** | Responsive UI under load | Automatic with React 18 |
| **Suspense** | Loading states | Data fetching boundaries |
| **Transitions** | Non-urgent updates | Form input debouncing |
| **Strict Mode** | Development safety | Enabled in development |

#### React 18 Concurrent Features

```typescript
// Using startTransition for non-urgent updates
import { startTransition, useState } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (value: string) => {
    setQuery(value); // Urgent update
    
    startTransition(() => {
      // Non-urgent: search results can be delayed
      setResults(searchData(value));
    });
  };

  return (
    <>
      <input 
        value={query} 
        onChange={(e) => handleSearch(e.target.value)} 
      />
      <Suspense fallback={<SearchSkeleton />}>
        <ResultsList results={results} />
      </Suspense>
    </>
  );
}
```

### 2.2 TypeScript 5.3

TypeScript provides type safety and enhanced developer experience for a banking application where accuracy is critical.

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"]
    }
  }
}
```

---

## 3. Build and Development Tools

### 3.1 Vite 5.0

Vite provides fast development server and optimized production builds.

#### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/x-data-grid'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});
```

---

## 4. UI Component Library

### 4.1 Material-UI (MUI) 5.15

MUI provides comprehensive, accessible, and customizable components suitable for enterprise banking applications.

#### MUI Dependencies

```json
{
  "dependencies": {
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/lab": "^5.0.0-alpha.158",
    "@mui/x-data-grid": "^6.18.0",
    "@mui/x-date-pickers": "^6.18.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0"
  }
}
```

#### MUI Theme Configuration

```typescript
// theme/index.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

// Bangladesh Bank brand colors
const brandColors = {
  primary: {
    main: '#1a365d',      // Deep blue - trust and stability
    light: '#2c5282',
    dark: '#0d1b2a',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#c53030',      // Red - alerts and actions
    light: '#e53e3e',
    dark: '#9b2c2c',
    contrastText: '#ffffff',
  },
  success: {
    main: '#276749',
    light: '#38a169',
    dark: '#1c4532',
  },
  warning: {
    main: '#d69e2e',
    light: '#ecc94b',
    dark: '#b7791f',
  },
};

export const theme = createTheme({
  palette: brandColors,
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },
});
```

---

## 5. State Management

### 5.1 Redux Toolkit 2.0 + RTK Query

Redux Toolkit provides predictable state management with RTK Query for efficient data fetching.

```typescript
// Store configuration
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './services/api/apiSlice';

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
```

---

## 6. Form Handling and Validation

### 6.1 React Hook Form 7.x + Zod

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loanSchema = z.object({
  applicantName: z.string().min(3).max(100),
  loanAmount: z.number().min(10000).max(10000000),
  email: z.string().email(),
  phone: z.string().regex(/^01[3-9]\d{8}$/),
});

type LoanForm = z.infer<typeof loanSchema>;

export function LoanForm() {
  const { control, handleSubmit } = useForm<LoanForm>({
    resolver: zodResolver(loanSchema),
  });
  // Form implementation
}
```

---

## 7. Routing and Navigation

### 7.1 React Router 6.x

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';

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
        path: 'los/*',
        element: <LOSRoutes />,
      },
    ],
  },
]);
```

---

## 8. Internationalization

### 8.1 react-i18next 13.x

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    bn: { translation: bnTranslations },
    en: { translation: enTranslations },
  },
  fallbackLng: 'en',
  supportedLngs: ['en', 'bn'],
});
```

---

## 9. Data Visualization

### 9.1 Recharts 2.10

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#1a365d', '#2c5282', '#4a7c59', '#d69e2e'];

export function LoanPortfolioChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
```

---

## 10. Testing Framework

### 10.1 Vitest + Testing Library

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

## 11. Browser Support Matrix

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | Latest 2 versions | Full support |
| Firefox | Latest 2 versions | Full support |
| Safari | Latest 2 versions | Full support |
| Edge | Latest 2 versions | Full support |
| Chrome Android | Latest | Full support |
| Safari iOS | Latest 2 versions | Full support |

---

## 12. Dependency Management

### 12.1 Package.json Dependencies

```json
{
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@hookform/resolvers": "^3.3.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/material": "^5.15.0",
    "@mui/x-data-grid": "^6.18.0",
    "@reduxjs/toolkit": "^2.0.0",
    "i18next": "^23.7.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.0",
    "react-i18next": "^13.5.0",
    "react-redux": "^9.0.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.1.0"
  }
}
```

---

## 13. Related Documents

| Document | Purpose |
|----------|---------|
| `[FE]_React_Frontend_Architecture_Document_v1.0.md` | Overall architecture |
| `[FE]_Vite_Build_Configuration_v1.0.md` | Build tool details |
| `[TEST]_Frontend_Testing_Strategy_v1.0.md` | Testing approach |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
