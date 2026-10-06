# Frontend Testing Guide - Vitest
## ULMS v2.0 Unit Testing

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Testing Guide - Vitest |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | QA Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
```

## Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('renders', () => {
    render(<Component />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
