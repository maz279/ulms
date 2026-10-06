**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Development Setup Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.1.4 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Frontend Lead, ULMS Project |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Frontend Lead | Initial version |

---

# Frontend Development Setup Guide
## Vite 5 + React 18 + Hot Module Replacement (HMR)

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Prerequisites](#2-prerequisites)
3. [Quick Start](#3-quick-start)
4. [Project Structure](#4-project-structure)
5. [Development Server](#5-development-server)
6. [Build Configuration](#6-build-configuration)
7. [Environment Setup](#7-environment-setup)
8. [Hot Module Replacement](#8-hot-module-replacement)
9. [Code Quality Tools](#9-code-quality-tools)
10. [Testing Setup](#10-testing-setup)
11. [Troubleshooting](#11-troubleshooting)
12. [Related Documents](#12-related-documents)

---

## 1. Purpose

This document provides comprehensive setup instructions for the ULMS v2.0 frontend development environment. The frontend is built with React 18.2, TypeScript 5.3, and Vite 5.0, providing a modern, fast development experience with Hot Module Replacement (HMR) for Bangladesh banking sector requirements.

---

## 2. Prerequisites

### 2.1 Required Software

| Software | Minimum Version | Recommended Version | Verification |
|----------|-----------------|---------------------|--------------|
| Node.js | 18.19.0 LTS | 20.11.0 LTS | `node --version` |
| npm | 10.0.0 | 10.4.0+ | `npm --version` |
| Git | 2.40.0 | 2.43.0+ | `git --version` |
| VS Code | 1.85.0 | 1.86.0+ | Check application |

### 2.2 VS Code Extensions

Install the following extensions:

```bash
# Install via command line
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension johnpapa.vscode-peacock
```

### 2.3 System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Free Disk Space | 5 GB | 10 GB |
| CPU Cores | 2 | 4 |

---

## 3. Quick Start

### 3.1 One-Command Setup

```bash
# Clone and setup
git clone https://github.com/unisoft/ulms-v2.git
cd ulms-v2/ulms-frontend
npm install
npm run dev
```

Access the application at: http://localhost:5173

### 3.2 Manual Setup Steps

```bash
# Step 1: Clone repository
git clone https://github.com/unisoft/ulms-v2.git
cd ulms-v2

# Step 2: Navigate to frontend
cd ulms-frontend

# Step 3: Install dependencies (2-3 minutes)
npm install

# Step 4: Copy environment file
cp .env.example .env.local

# Step 5: Start development server
npm run dev
```

---

## 4. Project Structure

```
ulms-frontend/
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── locales/                 # Translation files
│       ├── en/                  # English
│       └── bn/                  # Bengali (Bangla)
├── src/
│   ├── api/                     # API client and endpoints
│   │   ├── client.ts            # Axios configuration
│   │   ├── auth.ts              # Authentication API
│   │   ├── loans.ts             # Loan management API
│   │   └── clients.ts           # Client management API
│   ├── assets/                  # Images, fonts, icons
│   │   ├── images/
│   │   └── icons/
│   ├── components/              # Reusable components
│   │   ├── common/              # Shared components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Table/
│   │   │   └── Modal/
│   │   ├── forms/               # Form components
│   │   └── layout/              # Layout components
│   ├── config/                  # Configuration files
│   │   ├── routes.ts            # Route definitions
│   │   ├── theme.ts             # MUI theme config
│   │   └── constants.ts         # App constants
│   ├── features/                # Feature modules
│   │   ├── auth/                # Authentication
│   │   ├── loans/               # Loan management
│   │   ├── clients/             # Client management
│   │   ├── reports/             # Reports & analytics
│   │   └── admin/               # Administration
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useLocalStorage.ts
│   ├── i18n/                    # Internationalization
│   │   ├── config.ts
│   │   └── resources.ts
│   ├── layouts/                 # Page layouts
│   │   ├── MainLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── MinimalLayout.tsx
│   ├── pages/                   # Page components
│   │   ├── Dashboard/
│   │   ├── Loans/
│   │   ├── Clients/
│   │   └── Login/
│   ├── store/                   # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   └── thunks/
│   ├── styles/                  # Global styles
│   │   ├── globals.css
│   │   └── utilities.css
│   ├── types/                   # TypeScript types
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   └── loan.types.ts
│   ├── utils/                   # Utility functions
│   │   ├── formatters.ts        # BDT formatting
│   │   ├── validators.ts        # Input validation
│   │   └── constants.ts
│   ├── App.tsx                  # Main App component
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts            # Vite type definitions
├── tests/                       # Test files
├── .env.example                 # Environment template
├── .eslintrc.cjs                # ESLint config
├── .prettierrc                  # Prettier config
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
└── vite.config.ts               # Vite configuration
```

---

## 5. Development Server

### 5.1 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type checking
npm run type-check

# Format code with Prettier
npm run format
```

### 5.2 Vite Configuration

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh (HMR)
      jsxImportSource: '@emotion/react',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@api': path.resolve(__dirname, './src/api'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@config': path.resolve(__dirname, './src/config'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/fineract-provider/api/v1'),
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
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material'],
  },
});
```

---

## 6. Build Configuration

### 6.1 TypeScript Configuration

**File:** `tsconfig.json`

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
      "@features/*": ["src/features/*"],
      "@api/*": ["src/api/*"],
      "@store/*": ["src/store/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@assets/*": ["src/assets/*"],
      "@hooks/*": ["src/hooks/*"],
      "@config/*": ["src/config/*"],
      "@layouts/*": ["src/layouts/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 6.2 ESLint Configuration

**File:** `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'import'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {},
    },
  },
};
```

### 6.3 Prettier Configuration

**File:** `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## 7. Environment Setup

### 7.1 Environment Variables

**File:** `.env.example`

```bash
# ==========================================
# ULMS Frontend Environment Configuration
# ==========================================

# ------------------------------------------
# API Configuration
# ------------------------------------------
VITE_API_BASE_URL=http://localhost:8080/fineract-provider/api/v1
VITE_API_TIMEOUT=30000

# ------------------------------------------
# App Configuration
# ------------------------------------------
VITE_APP_NAME=ULMS
VITE_APP_VERSION=2.0.0
VITE_APP_ENVIRONMENT=development

# ------------------------------------------
# Feature Flags
# ------------------------------------------
VITE_FEATURE_CIB_INTEGRATION=true
VITE_FEATURE_NID_VERIFICATION=true
VITE_FEATURE_BKASH_PAYMENT=true
VITE_FEATURE_ADVANCED_REPORTS=true

# ------------------------------------------
# External Services
# ------------------------------------------
VITE_CIB_SANDBOX_URL=https://sandbox.cib.bb.org.bd
VITE_NID_SANDBOX_URL=https://sandbox.nidw.gov.bd

# ------------------------------------------
# Localization
# ------------------------------------------
VITE_DEFAULT_LANGUAGE=en
VITE_FALLBACK_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,bn

# ------------------------------------------
# Security
# ------------------------------------------
VITE_SESSION_TIMEOUT=3600
VITE_ENABLE_2FA=false
```

### 7.2 Environment File Usage

```typescript
// Access environment variables
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;

// Type-safe environment access
// src/config/env.ts
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/fineract-provider/api/v1',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'ULMS',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
  FEATURE_CIB_INTEGRATION: import.meta.env.VITE_FEATURE_CIB_INTEGRATION === 'true',
  FEATURE_NID_VERIFICATION: import.meta.env.VITE_FEATURE_NID_VERIFICATION === 'true',
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en',
  SUPPORTED_LANGUAGES: (import.meta.env.VITE_SUPPORTED_LANGUAGES || 'en,bn').split(','),
} as const;
```

---

## 8. Hot Module Replacement

### 8.1 How HMR Works

Vite provides instant HMR for:
- React components
- CSS/SCSS styles
- Static assets
- Configuration files

### 8.2 HMR in Action

```typescript
// src/components/Button.tsx
// Changes to this file will instantly update in the browser

import React from 'react';
import { Button as MuiButton } from '@mui/material';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'contained' | 'outlined' | 'text';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'contained',
  onClick 
}) => {
  // Modify this component - changes appear instantly
  return (
    <MuiButton variant={variant} onClick={onClick}>
      {children}
    </MuiButton>
  );
};
```

### 8.3 HMR Limitations

State-preserving HMR works for:
- ✅ Component JSX changes
- ✅ CSS modifications
- ✅ Props changes

State reset occurs for:
- ❌ Hook dependency changes
- ❌ Context provider changes
- ❌ Redux store structure changes

---

## 9. Code Quality Tools

### 9.1 Pre-Commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

cd ulms-frontend
npx lint-staged
```

**File:** `.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,scss}": ["prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### 9.2 Bangladesh-Specific Configuration

```typescript
// src/utils/formatters.ts

/**
 * Format amount in BDT (Bangladesh Taka)
 */
export const formatBDT = (amount: number): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date in Bangladeshi format (DD/MM/YYYY)
 */
export const formatDateBD = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format number in Bangladeshi format (Lakhs, Crores)
 */
export const formatNumberBD = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Crore`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} Lakh`;
  }
  return num.toLocaleString('en-BD');
};
```

---

## 10. Testing Setup

### 10.1 Test Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 10.2 Test Setup

**File:** `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 10.3 Sample Test

**File:** `src/components/common/Button/Button.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 11. Troubleshooting

### 11.1 Common Issues

#### Issue: Port 5173 already in use

```bash
# Find process using port 5173
lsof -i :5173

# Kill process or use different port
npm run dev -- --port 3000
```

#### Issue: Module not found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: HMR not working

```bash
# Check browser console for errors
# Ensure WebSocket connection is not blocked
# Try clearing browser cache and reloading
```

#### Issue: TypeScript errors after pulling

```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows)
# Type: "TypeScript: Restart TS Server"
```

### 11.2 Performance Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Check for duplicate dependencies
npx depcheck
```

---

## 12. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.1.1 | [Local Development Setup Guide]([DEV]_Local_Development_Setup_Guide_v1.0.md) | Quickstart guide |
| 2.1.3 | [Fineract Local Installation Guide]([DEV]_Fineract_Local_Installation_Guide_v1.0.md) | Backend setup |
| 2.1.5 | [Environment Variables Management]([DEV]_Environment_Variables_Management_v1.0.md) | Environment config |
| 2.3.1 | [Test Environment Setup]([TEST]_Test_Environment_Setup_Guide_v1.0.md) | Testing setup |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Internal Use Only - ULMS Development Team*
