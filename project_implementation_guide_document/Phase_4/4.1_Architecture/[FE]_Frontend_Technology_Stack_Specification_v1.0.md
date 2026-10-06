# Frontend Technology Stack Specification
## ULMS v2.0 Frontend Technology Stack

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Technology Stack Specification |
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
| 1.0 | 2026-02-08 | Frontend Developer | Initial specification |

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Core Framework](#2-core-framework)
3. [Build Toolchain](#3-build-toolchain)
4. [State Management](#4-state-management)
5. [UI Component Library](#5-ui-component-library)
6. [Form Management](#6-form-management)
7. [Data Visualization](#7-data-visualization)
8. [Internationalization](#8-internationalization)
9. [Testing Stack](#9-testing-stack)
10. [Development Tools](#10-development-tools)
11. [Appendices](#11-appendices)

---

## 1. Stack Overview

### 1.1 Technology Stack Summary

| Category | Primary Technology | Version | Alternative |
|----------|-------------------|---------|-------------|
| Framework | React | 18.2.0 | - |
| Language | TypeScript | 5.3.3 | - |
| Build Tool | Vite | 5.0.0 | Webpack |
| Router | React Router | 6.21.0 | - |
| State Management | Redux Toolkit + RTK Query | 2.0.0 | Zustand |
| UI Library | Material-UI (MUI) | 5.15.0 | Ant Design |
| Forms | React Hook Form + Zod | 7.49.0 / 3.22.0 | Formik + Yup |
| HTTP Client | Axios | 1.6.0 | Fetch API |
| Charts | Recharts | 2.10.0 | Chart.js |
| i18n | react-i18next | 14.0.0 | react-intl |
| Testing | Vitest + React Testing Library | 1.0.0 / 14.1.0 | Jest |
| E2E Testing | Playwright | 1.40.0 | Cypress |

### 1.2 Justification Matrix

| Requirement | Technology Solution | BRD Reference |
|-------------|---------------------|---------------|
| 1000+ Concurrent Users | React 18 Concurrent Features | BRD 7.1 |
| Bengali Language Support | react-i18next with UTF-8 | URD 14.2 |
| Responsive Design | MUI Grid System + CSS-in-JS | URD 14.1 |
| Complex Forms | React Hook Form + Zod | URD 5.1 |
| Data Visualization | Recharts | URD 10.2 |
| WCAG 2.1 AA | MUI Accessibility | URD 14.4 |

---

## 2. Core Framework

### 2.1 React 18.2.0

**Key Features Utilized:**

| Feature | Purpose | Implementation |
|---------|---------|----------------|
| Concurrent Rendering | Improved UI responsiveness | Automatic in React 18 |
| Suspense | Data fetching boundaries | Route-level code splitting |
| Transitions | Prioritize user interactions | `useTransition` hook |
| Automatic Batching | Performance optimization | Automatic state batching |

**Installation:**

```bash
npm install react@18.2.0 react-dom@18.2.0
```

**Entry Point Configuration:**

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

### 2.2 TypeScript 5.3.3

**Configuration:**

```json
// tsconfig.json
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
      "@components/*": ["src/shared/components/*"],
      "@hooks/*": ["src/shared/hooks/*"],
      "@services/*": ["src/services/*"],
      "@store/*": ["src/store/*"],
      "@types/*": ["src/shared/types/*"],
      "@utils/*": ["src/shared/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 3. Build Toolchain

### 3.1 Vite 5.0.0

**Why Vite:**
- Instant server start (native ES modules)
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds (Rollup)
- Native TypeScript support
- Rich plugin ecosystem

**Configuration:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/shared/components'),
      '@hooks': resolve(__dirname, 'src/shared/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@types': resolve(__dirname, 'src/shared/types'),
      '@utils': resolve(__dirname, 'src/shared/utils'),
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
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
```

### 3.2 Package.json Dependencies

```json
{
  "name": "ulms-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@hookform/resolvers": "^3.3.4",
    "@mui/icons-material": "^5.15.0",
    "@mui/material": "^5.15.0",
    "@mui/x-data-grid": "^6.18.0",
    "@mui/x-date-pickers": "^6.18.0",
    "@reduxjs/toolkit": "^2.0.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "i18next": "^23.7.0",
    "i18next-browser-languagedetector": "^7.2.0",
    "i18next-http-backend": "^2.4.0",
    "keycloak-js": "^23.0.0",
    "lodash-es": "^4.17.21",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.0",
    "react-i18next": "^14.0.0",
    "react-redux": "^9.0.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@emotion/babel-plugin": "^11.11.0",
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/lodash-es": "^4.17.12",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "jsdom": "^23.0.0",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 4. State Management

### 4.1 Redux Toolkit 2.0.0

**Slice Pattern:**

```typescript
// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '@/shared/types/auth.types';

const initialState: AuthState = {
  user: null,
  token: null,
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
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
```

### 4.2 RTK Query

```typescript
// services/api/loanApi.ts
import { apiSlice } from './apiSlice';
import type { 
  LoanApplication, 
  CreateLoanApplicationRequest,
  LoanApplicationResponse 
} from '@/shared/types/loan.types';

export const loanApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoanApplications: builder.query<LoanApplicationResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => `/loans/applications?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'LoanApplication' as const, id })),
              { type: 'LoanApplication', id: 'LIST' },
            ]
          : [{ type: 'LoanApplication', id: 'LIST' }],
    }),
    
    getLoanApplication: builder.query<LoanApplication, string>({
      query: (id) => `/loans/applications/${id}`,
      providesTags: (result, error, id) => [{ type: 'LoanApplication', id }],
    }),
    
    createLoanApplication: builder.mutation<LoanApplication, CreateLoanApplicationRequest>({
      query: (body) => ({
        url: '/loans/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LoanApplication', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetLoanApplicationsQuery,
  useGetLoanApplicationQuery,
  useCreateLoanApplicationMutation,
} = loanApi;
```

---

## 5. UI Component Library

### 5.1 Material-UI 5.15.0

**Theme Configuration:**

```typescript
// config/theme.config.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
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
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);
```

---

## 6. Form Management

### 6.1 React Hook Form + Zod

**Form Component Pattern:**

```typescript
// shared/components/forms/LoanApplicationForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  TextField, 
  Grid, 
  Button, 
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';

const loanApplicationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  productId: z.string().min(1, 'Product is required'),
  amount: z.number().min(50000, 'Minimum amount is 50,000').max(10000000, 'Maximum amount is 1 Crore'),
  tenor: z.number().min(12, 'Minimum tenor is 12 months').max(60, 'Maximum tenor is 60 months'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  interestRate: z.number().min(9).max(18),
});

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;

interface LoanApplicationFormProps {
  onSubmit: (data: LoanApplicationFormData) => void;
  defaultValues?: Partial<LoanApplicationFormData>;
  loading?: boolean;
}

export function LoanApplicationForm({ 
  onSubmit, 
  defaultValues,
  loading = false 
}: LoanApplicationFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            {...register('customerId')}
            label="Customer"
            fullWidth
            error={!!errors.customerId}
            helperText={errors.customerId?.message}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.productId}>
            <InputLabel>Product</InputLabel>
            <Select {...register('productId')} label="Product">
              <MenuItem value="PL-001">Personal Loan</MenuItem>
              <MenuItem value="HL-001">Home Loan</MenuItem>
              <MenuItem value="AL-001">Auto Loan</MenuItem>
            </Select>
            {errors.productId && (
              <FormHelperText>{errors.productId.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            {...register('amount', { valueAsNumber: true })}
            label="Amount (BDT)"
            type="number"
            fullWidth
            error={!!errors.amount}
            helperText={errors.amount?.message}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            {...register('tenor', { valueAsNumber: true })}
            label="Tenor (Months)"
            type="number"
            fullWidth
            error={!!errors.tenor}
            helperText={errors.tenor?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('purpose')}
            label="Purpose"
            multiline
            rows={3}
            fullWidth
            error={!!errors.purpose}
            helperText={errors.purpose?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

## 7. Data Visualization

### 7.1 Recharts 2.10.0

**Dashboard Chart Example:**

```typescript
// modules/reporting/components/LoanPortfolioChart.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

interface PortfolioData {
  month: string;
  disbursed: number;
  recovered: number;
  outstanding: number;
}

interface LoanPortfolioChartProps {
  data: PortfolioData[];
  title: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function LoanPortfolioChart({ data, title }: LoanPortfolioChartProps): React.ReactElement {
  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => 
              `BDT ${(value / 100000).toFixed(2)} Lakhs`
            }
          />
          <Legend />
          <Bar dataKey="disbursed" fill="#0088FE" name="Disbursed" />
          <Bar dataKey="recovered" fill="#00C49F" name="Recovered" />
          <Bar dataKey="outstanding" fill="#FFBB28" name="Outstanding" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
```

---

## 8. Internationalization

### 8.1 react-i18next 14.0.0

**Configuration:**

```typescript
// shared/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**Translation File Structure:**

```json
// public/locales/bn/common.json
{
  "navigation": {
    "dashboard": "ড্যাশবোর্ড",
    "loanApplication": "ঋণ আবেদন",
    "customers": "গ্রাহক",
    "reports": "প্রতিবেদন",
    "settings": "সেটিংস"
  },
  "actions": {
    "submit": "জমা দিন",
    "cancel": "বাতিল",
    "save": "সংরক্ষণ",
    "delete": "মুছুন",
    "edit": "সম্পাদনা",
    "view": "দেখুন"
  },
  "loan": {
    "applicationId": "আবেদন আইডি",
    "customerName": "গ্রাহকের নাম",
    "amount": "পরিমাণ",
    "status": "অবস্থা",
    "submissionDate": "জমার তারিখ"
  }
}
```

---

## 9. Testing Stack

### 9.1 Vitest + React Testing Library

**Test Configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

**Component Test Example:**

```typescript
// shared/components/forms/__tests__/LoanApplicationForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoanApplicationForm } from '../LoanApplicationForm';

describe('LoanApplicationForm', () => {
  it('renders all form fields', () => {
    render(<LoanApplicationForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tenor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoanApplicationForm onSubmit={vi.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/customer is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoanApplicationForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/customer/i), 'CUST001');
    // ... fill other fields
    
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'CUST001',
          // ... other fields
        })
      );
    });
  });
});
```

---

## 10. Development Tools

### 10.1 ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
);
```

### 10.2 Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 11. Appendices

### Appendix A: Version Locking Strategy

| Scenario | Strategy |
|----------|----------|
| Major versions | Pin exact version |
| Minor versions | Allow patch updates (^) |
| Security updates | Automated via Dependabot |
| Breaking changes | Manual review required |

### Appendix B: Dependency Update Schedule

| Frequency | Action |
|-----------|--------|
| Weekly | Security patches |
| Monthly | Minor version updates |
| Quarterly | Major version evaluation |
| Annually | Complete stack review |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
