# Vite Build Configuration
## ULMS v2.0 Build and Development Setup

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Vite Build Configuration |
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

1. [Vite Configuration Overview](#1-vite-configuration-overview)
2. [Development Configuration](#2-development-configuration)
3. [Production Build](#3-production-build)
4. [Environment Variables](#4-environment-variables)
5. [Optimization Strategies](#5-optimization-strategies)
6. [Testing Configuration](#6-testing-configuration)
7. [Deployment Artifacts](#7-deployment-artifacts)
8. [Appendices](#8-appendices)

---

## 1. Vite Configuration Overview

### 1.1 Why Vite

| Feature | Benefit | ULMS Application |
|---------|---------|------------------|
| Native ESM | Instant server start | Fast development |
| HMR | Sub-second updates | Productive workflow |
| Rollup Production | Optimized bundles | Fast production loads |
| TypeScript Native | No separate compilation | Better DX |
| Rich Plugins | Extensible | Tailored build pipeline |

### 1.2 Configuration Files

```
project-root/
├── vite.config.ts              # Main Vite configuration
├── vite.config.prod.ts         # Production overrides
├── vitest.config.ts            # Test configuration
└── .env.*                      # Environment files
    ├── .env.development
    ├── .env.staging
    └── .env.production
```

---

## 2. Development Configuration

### 2.1 Main Vite Configuration

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Plugins
    plugins: [
      react({
        // Enable Emotion for MUI styling
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      // Bundle analyzer (only in analyze mode)
      mode === 'analyze' && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),

    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/shared/components'),
        '@hooks': resolve(__dirname, 'src/shared/hooks'),
        '@services': resolve(__dirname, 'src/services'),
        '@store': resolve(__dirname, 'src/store'),
        '@types': resolve(__dirname, 'src/shared/types'),
        '@utils': resolve(__dirname, 'src/shared/utils'),
        '@config': resolve(__dirname, 'src/config'),
        '@modules': resolve(__dirname, 'src/modules'),
        '@assets': resolve(__dirname, 'src/assets'),
      },
    },

    // Development server
    server: {
      port: 3000,
      host: true, // Allow external access
      open: false, // Don't auto-open browser
      cors: true,
      proxy: {
        // Proxy API requests to backend
        '/api': {
          target: env.VITE_API_PROXY_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // Proxy WebSocket connections
        '/ws': {
          target: env.VITE_WS_PROXY_URL || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true,
        },
      },
      hmr: {
        overlay: true,
      },
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      target: 'es2020',
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal caching
          manualChunks: {
            // Core framework
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // State management
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
            // UI Library
            'vendor-mui': [
              '@mui/material',
              '@mui/icons-material',
              '@mui/x-data-grid',
              '@mui/x-date-pickers',
              '@emotion/react',
              '@emotion/styled',
            ],
            // Form handling
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Charts
            'vendor-charts': ['recharts'],
            // i18n
            'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            // Utilities
            'vendor-utils': ['axios', 'date-fns', 'lodash-es'],
          },
          // Asset naming patterns
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|ttf|otf|eot)$/.test(assetInfo.name)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // CSS configuration
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // 4KB
      chunkSizeWarningLimit: 1000, // 1MB
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "./src/styles/variables.scss";`,
        },
      },
    },

    // Preview server (for testing production build)
    preview: {
      port: 4000,
      host: true,
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@reduxjs/toolkit',
        'react-redux',
        'react-hook-form',
        'zod',
        '@hookform/resolvers',
        'i18next',
        'react-i18next',
        'axios',
        'date-fns',
      ],
      exclude: [],
    },

    // ESBuild configuration
    esbuild: {
      jsxInject: `import React from 'react'`,
      target: 'es2020',
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});
```

### 2.2 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "tsc && vite build",
    "build:staging": "tsc && vite build --mode staging",
    "build:analyze": "tsc && vite build --mode analyze",
    "preview": "vite preview",
    "preview:staging": "vite preview --mode staging",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,scss}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,scss}\"",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist node_modules/.vite",
    "analyze": "npm run build:analyze"
  }
}
```

---

## 3. Production Build

### 3.1 Production Optimizations

```typescript
// vite.config.prod.ts
import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';
import { compression } from 'vite-plugin-compression2';

export default defineConfig((env) =>
  mergeConfig(
    baseConfig(env),
    defineConfig({
      build: {
        sourcemap: false,
        rollupOptions: {
          output: {
            // Smaller chunks for better caching
            manualChunks: {
              ...baseConfig.build?.rollupOptions?.output?.manualChunks,
            },
          },
        },
      },
      plugins: [
        // Gzip compression
        compression({
          algorithm: 'gzip',
          exclude: [/\.(br)$/, /\.(gz)$/],
        }),
        // Brotli compression
        compression({
          algorithm: 'brotliCompress',
          exclude: [/\.(br)$/, /\.(gz)$/],
        }),
      ],
    })
  )
);
```

### 3.2 Build Output Structure

```
dist/
├── assets/
│   ├── vendor-react-[hash].js      # React bundle
│   ├── vendor-redux-[hash].js      # Redux bundle
│   ├── vendor-mui-[hash].js        # MUI bundle
│   ├── vendor-forms-[hash].js      # Forms bundle
│   ├── vendor-charts-[hash].js     # Charts bundle
│   ├── vendor-i18n-[hash].js       # i18n bundle
│   ├── vendor-utils-[hash].js      # Utilities bundle
│   ├── los-[hash].js               # LOS module (lazy loaded)
│   ├── credit-[hash].js            # Credit module (lazy loaded)
│   ├── workflow-[hash].js          # Workflow module (lazy loaded)
│   ├── reporting-[hash].js         # Reporting module (lazy loaded)
│   ├── main-[hash].js              # Main entry chunk
│   ├── main-[hash].css             # Main styles
│   └── images/                     # Optimized images
│       └── logo-[hash].png
├── locales/                        # Translation files
│   ├── bn/
│   │   └── common.json
│   └── en/
│       └── common.json
├── index.html                      # Entry HTML
└── favicon.ico                     # Favicon
```

---

## 4. Environment Variables

### 4.1 Environment File Structure

```bash
# .env.development
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_API_PROXY_URL=http://localhost:8080
VITE_WS_PROXY_URL=ws://localhost:8080
VITE_AUTH_REALM=ulms-realm
VITE_AUTH_CLIENT_ID=ulms-web
VITE_ENABLE_MOCK_API=true
VITE_LOG_LEVEL=debug
```

```bash
# .env.staging
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://staging-api.ulms.unisoft.com.bd/v1
VITE_AUTH_REALM=ulms-realm
VITE_AUTH_CLIENT_ID=ulms-web
VITE_ENABLE_MOCK_API=false
VITE_LOG_LEVEL=info
```

```bash
# .env.production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.ulms.unisoft.com.bd/v1
VITE_AUTH_REALM=ulms-realm
VITE_AUTH_CLIENT_ID=ulms-web
VITE_ENABLE_MOCK_API=false
VITE_LOG_LEVEL=error
```

### 4.2 Environment Type Definitions

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AUTH_REALM: string;
  readonly VITE_AUTH_CLIENT_ID: string;
  readonly VITE_ENABLE_MOCK_API: string;
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global constants
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
```

---

## 5. Optimization Strategies

### 5.1 Code Splitting Strategy

| Chunk | Contents | Size Target |
|-------|----------|-------------|
| vendor-react | React, ReactDOM, Router | < 150KB |
| vendor-mui | MUI components | < 200KB |
| vendor-redux | Redux Toolkit | < 50KB |
| vendor-forms | Form libraries | < 50KB |
| vendor-charts | Recharts | < 100KB |
| Module chunks | Feature modules | < 200KB each |

### 5.2 Lazy Loading Configuration

```typescript
// routes/index.tsx
import { lazy } from 'react';

// Lazy load modules with preloading
const LOSModule = lazy(() => import(/* webpackChunkName: "los" */ '@/modules/los'));
const CreditModule = lazy(() => import(/* webpackChunkName: "credit" */ '@/modules/credit'));
const WorkflowModule = lazy(() => import(/* webpackChunkName: "workflow" */ '@/modules/workflow'));

// Preload function for hover/predictive loading
export function preloadModule(moduleName: 'los' | 'credit' | 'workflow') {
  const moduleMap = {
    los: () => import('@/modules/los'),
    credit: () => import('@/modules/credit'),
    workflow: () => import('@/modules/workflow'),
  };
  
  // Start loading but don't await
  moduleMap[moduleName]();
}
```

### 5.3 Bundle Size Monitoring

```typescript
// vite.config.ts - Add to plugins array
import { Plugin } from 'vite';

const bundleSizePlugin = (): Plugin => ({
  name: 'bundle-size-monitor',
  generateBundle(_, bundle) {
    const sizes: Record<string, number> = {};
    
    Object.entries(bundle).forEach(([fileName, chunk]) => {
      if ('code' in chunk) {
        sizes[fileName] = chunk.code.length;
      }
    });
    
    // Sort by size
    const sorted = Object.entries(sizes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    console.log('\n📦 Top 10 Largest Bundles:');
    sorted.forEach(([name, size]) => {
      const sizeKB = (size / 1024).toFixed(2);
      const color = parseFloat(sizeKB) > 500 ? '\x1b[31m' : '\x1b[32m';
      console.log(`${color}  ${name}: ${sizeKB} KB\x1b[0m`);
    });
    
    // Warning for large chunks
    const largeChunks = sorted.filter(([, size]) => size > 500 * 1024);
    if (largeChunks.length > 0) {
      console.warn('\n⚠️  Large chunks detected (>500KB). Consider code splitting.');
    }
  },
});
```

---

## 6. Testing Configuration

### 6.1 Vitest Configuration

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
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mocks/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/jest-dom'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

### 6.2 Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;
```

---

## 7. Deployment Artifacts

### 7.1 Docker Configuration

```dockerfile
# Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 7.2 Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

---

## 8. Appendices

### Appendix A: Build Performance Tips

| Tip | Implementation | Impact |
|-----|---------------|--------|
| Use `include` in optimizeDeps | List common dependencies | Faster cold start |
| Enable `build.modulePreload` | Auto polyfill | Better compatibility |
| Use `rollup-plugin-visualizer` | Analyze bundles | Find optimization opportunities |
| Implement lazy loading | Code splitting | Smaller initial bundle |

### Appendix B: Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow HMR | Check `optimizeDeps.include` |
| Out of memory | Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"` |
| Type errors | Run `tsc --noEmit` separately |
| Missing env vars | Check `.env` file and variable prefix |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
