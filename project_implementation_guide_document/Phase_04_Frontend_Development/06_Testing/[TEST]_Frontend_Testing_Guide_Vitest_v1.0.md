# Frontend Testing Guide - Vitest

## Vitest Testing Framework Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Testing Guide - Vitest |
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
2. [Vitest Configuration](#2-vitest-configuration)
3. [Writing Tests](#3-writing-tests)
4. [Mocking](#4-mocking)
5. [Coverage](#5-coverage)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document provides a guide for writing tests with Vitest for ULMS v2.0 frontend.

---

## 2. Vitest Configuration

### 2.1 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2.2 Test Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

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

---

## 3. Writing Tests

### 3.1 Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup code
  });

  it('should render correctly', () => {
    // Test code
  });

  it('should handle user interaction', () => {
    // Test code
  });
});
```

---

## 4. Mocking

### 4.1 Mocking Modules

```typescript
// Mock API calls
vi.mock('../api/losApi', () => ({
  useGetLoanApplicationsQuery: vi.fn(() => ({
    data: mockApplications,
    isLoading: false,
  })),
}));

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
  })),
}));
```

### 4.2 Mocking Functions

```typescript
const mockSubmit = vi.fn();

render(<Form onSubmit={mockSubmit} />);

expect(mockSubmit).toHaveBeenCalledWith(expectedData);
```

---

## 5. Coverage

### 5.1 Running Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Run specific test file with coverage
npm run test:coverage -- tests/Button.test.tsx
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Frontend_Testing_Strategy_v1.0.md` | Testing strategy |
| `[TEST]_Component_Testing_Strategy_v1.0.md` | Component testing |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
