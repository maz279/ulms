# Frontend Development Setup Guide
## React 18 + TypeScript + Vite Configuration

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Development Setup Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Frontend Developer |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Vite Configuration](#3-vite-configuration)
4. [Development Workflow](#4-development-workflow)
5. [Hot Module Replacement](#5-hot-module-replacement)
6. [Build Configuration](#6-build-configuration)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Software

| Software | Version | Command |
|----------|---------|---------|
| Node.js | 20.x LTS | `node -v` |
| npm | 10.x | `npm -v` |
| Git | 2.40+ | `git --version` |

### 1.2 Install Node.js

```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # v20.11.0
npm -v   # 10.2.4
```

---

## 2. Project Setup

### 2.1 Clone and Install

```bash
# Navigate to frontend directory
cd frontend/ulms-web

# Install dependencies
npm ci

# Copy environment file
cp .env.example .env.local
```

### 2.2 Project Structure

```
frontend/ulms-web/
├── public/                 # Static assets
├── src/
│   ├── api/               # API clients
│   ├── assets/            # Images, fonts
│   ├── components/        # React components
│   │   ├── common/        # Shared components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── hooks/             # Custom React hooks
│   ├── modules/           # Feature modules
│   │   ├── los/           # Loan Origination
│   │   ├── credit/        # Credit Management
│   │   ├── workflow/      # Approval Workflow
│   │   └── reporting/     # Reports
│   ├── store/             # Redux store
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── .env.local             # Local environment
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── package.json
```

---

## 3. Vite Configuration

### 3.1 Vite Config File

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Fast Refresh with SWC
      jsxImportSource: '@emotion/react',
    }),
  ],
  
  // Development server
  server: {
    port: 5173,
    host: true,
    open: true,
    
    // Hot Module Replacement
    hmr: {
      overlay: true,
    },
    
    // Proxy API requests
    proxy: {
      '/api/fineract': {
        target: 'http://localhost:8443',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fineract/, '/fineract-provider/api/v1'),
      },
      '/api/cib': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  
  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@store': path.resolve(__dirname, './src/store'),
      '@api': path.resolve(__dirname, './src/api'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
  },
  
  // Environment variables
  envPrefix: 'VITE_',
}));
```

### 3.2 Environment Variables

**File:** `.env.local`

```bash
# API URLs
VITE_API_BASE_URL=http://localhost:8443/fineract-provider/api/v1
VITE_AUTH_URL=http://localhost:8080/auth
VITE_CIB_SERVICE_URL=http://localhost:8081

# Feature Flags
VITE_ENABLE_MOCK_API=true
VITE_ENABLE_DEBUG_LOGGING=true
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true

# App Configuration
VITE_APP_NAME=ULMS
VITE_APP_VERSION=2.0.0
VITE_DEFAULT_LANGUAGE=bn
VITE_DEFAULT_TENANT=default
```

---

## 4. Development Workflow

### 4.1 Start Development Server

```bash
# Standard start
npm run dev

# Start with specific port
npm run dev -- --port 5173

# Start with host binding (for network access)
npm run dev -- --host 0.0.0.0
```

### 4.2 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run type-check` | TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:ui` | Run tests with UI |

### 4.3 Code Quality Tools

```bash
# ESLint
npm run lint
npm run lint:fix

# TypeScript
npx tsc --noEmit

# Prettier
npx prettier --write "src/**/*.{ts,tsx}"
```

---

## 5. Hot Module Replacement (HMR)

### 5.1 How HMR Works

Vite provides instant HMR for:
- Component updates (preserves state)
- CSS changes (instant update)
- TypeScript changes (fast rebuild)

### 5.2 HMR Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      overlay: true,      // Show errors in overlay
      port: 24678,        // HMR WebSocket port
    },
  },
});
```

### 5.3 React Fast Refresh

Components automatically update without losing state:

```tsx
// Counter.tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

After editing, the count value is preserved!

---

## 6. Build Configuration

### 6.1 Production Build

```bash
# Create optimized build
npm run build

# Output in dist/ directory
ls dist/
```

### 6.2 Build Analysis

```bash
# Analyze bundle size
npm run build -- --mode analyze

# Or use rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer
```

### 6.3 Preview Production Build

```bash
# Build and preview
npm run build
npm run preview

# Preview with specific port
npm run preview -- --port 4173
```

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

#### Module Resolution Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

#### TypeScript Errors
```bash
# Regenerate TypeScript types
npx tsc --build --force

# Check for errors
npx tsc --noEmit
```

#### npm Install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete lock file
rm package-lock.json
rm -rf node_modules

# Reinstall
npm install
```

### 7.2 Performance Optimization

```bash
# Use SWC for faster builds
npm install -D @vitejs/plugin-react-swc

# Configure in vite.config.ts
import react from '@vitejs/plugin-react-swc';

export default {
  plugins: [react()],
};
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
