# Vite Build Configuration

## Build Tool Configuration for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Vite Build Configuration |
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
2. [Vite Configuration](#2-vite-configuration)
3. [Development Server](#3-development-server)
4. [Build Optimization](#4-build-optimization)
5. [Environment Variables](#5-environment-variables)
6. [Hot Module Replacement](#6-hot-module-replacement)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document details the Vite 5.0 build configuration for ULMS v2.0, including development server setup, production optimizations, and Hot Module Replacement (HMR) configuration.

---

## 2. Vite Configuration

### 2.1 Complete vite.config.ts

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      react(),
      // Bundle visualizer for analysis (only in analyze mode)
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'bundle-analysis.html',
      }),
    ],
    
    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@theme': path.resolve(__dirname, './src/theme'),
      },
    },

    // Development server
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: env.VITE_AUTH_PROXY_URL || 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },

    // Production build
    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: 'terser',
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
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            i18n: ['react-i18next', 'i18next', 'i18next-browser-languagedetector'],
            forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
            charts: ['recharts'],
          },
          // Asset naming for cache busting
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
              return 'img/[name]-[hash][extname]';
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name)) {
              return 'fonts/[name]-[hash][extname]';
            }
            return '[ext]/[name]-[hash][extname]';
          },
        },
      },
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
        '@reduxjs/toolkit',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },

    // CSS configuration
    css: {
      devSourcemap: true,
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
  };
});
```

---

## 3. Development Server

### 3.1 Proxy Configuration

```typescript
// vite.config.ts - proxy section
server: {
  port: 3000,
  host: true,
  cors: true,
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      configure: (proxy, options) => {
        proxy.on('error', (err, _req, _res) => {
          console.log('proxy error', err);
        });
        proxy.on('proxyReq', (proxyReq, req, _res) => {
          console.log('Sending Request:', req.method, req.url);
        });
        proxy.on('proxyRes', (proxyRes, req, _res) => {
          console.log('Received Response:', proxyRes.statusCode, req.url);
        });
      },
    },
  },
  hmr: {
    overlay: true,
  },
}
```

---

## 4. Build Optimization

### 4.1 Code Splitting Strategy

| Chunk | Contents | Size Target |
|-------|----------|-------------|
| `vendor` | React, Router | < 50KB |
| `mui` | Material-UI components | < 80KB |
| `redux` | State management | < 30KB |
| `i18n` | Internationalization | < 20KB |
| `forms` | Form libraries | < 25KB |
| `charts` | Recharts | < 40KB |

---

## 5. Environment Variables

### 5.1 Environment File Structure

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AUTH_URL=http://localhost:8081
VITE_ENV=development
VITE_ENABLE_MOCKS=true
VITE_LOG_LEVEL=debug

# .env.staging
VITE_API_BASE_URL=https://staging-api.ulms.unisoft.com.bd/api
VITE_AUTH_URL=https://staging-auth.ulms.unisoft.com.bd
VITE_ENV=staging
VITE_ENABLE_MOCKS=false
VITE_LOG_LEVEL=info

# .env.production
VITE_API_BASE_URL=https://api.ulms.unisoft.com.bd/api
VITE_AUTH_URL=https://auth.ulms.unisoft.com.bd
VITE_ENV=production
VITE_ENABLE_MOCKS=false
VITE_LOG_LEVEL=error
```

---

## 6. Hot Module Replacement

### 6.1 HMR Configuration

```typescript
// vite.config.ts
server: {
  hmr: {
    overlay: true,
    port: 24678,
  },
  watch: {
    usePolling: true,
    interval: 1000,
  },
}
```

### 6.2 React Fast Refresh

React Fast Refresh is enabled by default with `@vitejs/plugin-react-swc`, providing instant feedback during development without losing component state.

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[FE]_React_Frontend_Architecture_Document_v1.0.md` | Overall architecture |
| `[FE]_Frontend_Technology_Stack_Specification_v1.0.md` | Tech stack details |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
