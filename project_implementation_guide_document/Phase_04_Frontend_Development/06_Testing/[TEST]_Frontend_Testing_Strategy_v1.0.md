# Frontend Testing Strategy

## Testing Approach for ULMS v2.0 Frontend

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Testing Strategy |
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
2. [Testing Pyramid](#2-testing-pyramid)
3. [Unit Testing](#3-unit-testing)
4. [Integration Testing](#4-integration-testing)
5. [E2E Testing](#5-e2e-testing)
6. [Testing Tools](#6-testing-tools)
7. [Coverage Requirements](#7-coverage-requirements)
8. [Related Documents](#8-related-documents)

---

## 1. Executive Summary

This document defines the frontend testing strategy for ULMS v2.0, covering unit tests, integration tests, and end-to-end tests to ensure application quality and reliability.

---

## 2. Testing Pyramid

```
                    /\
                   /  \
                  / E2E \         <- Few tests (Playwright)
                 /________\
                /          \
               / Integration \   <- Medium tests (RTL + Vitest)
              /______________\
             /                \
            /   Unit Tests      \ <- Many tests (Vitest)
           /____________________\
```

| Level | Tool | Count | Purpose |
|-------|------|-------|---------|
| Unit | Vitest + RTL | 70% | Components, hooks, utilities |
| Integration | Vitest + RTL | 20% | Feature workflows |
| E2E | Playwright | 10% | Critical user journeys |

---

## 3. Unit Testing

### 3.1 Component Testing

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 3.2 Hook Testing

```typescript
// useForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useForm } from './useForm';

describe('useForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      useForm({ defaultValues: { name: 'John' } })
    );
    expect(result.current.values.name).toBe('John');
  });

  it('updates values on change', () => {
    const { result } = renderHook(() => useForm());
    
    act(() => {
      result.current.setValue('name', 'Jane');
    });
    
    expect(result.current.values.name).toBe('Jane');
  });
});
```

---

## 4. Integration Testing

### 4.1 Feature Testing

```typescript
// LoanApplication.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoanApplicationWizard } from '../features/los/components/LoanApplicationWizard';
import { AppProviders } from '../app/providers';

describe('Loan Application Flow', () => {
  it('completes multi-step application', async () => {
    render(
      <AppProviders>
        <LoanApplicationWizard />
      </AppProviders>
    );

    // Step 1: Personal Info
    fireEvent.change(screen.getByLabelText('NID Number'), {
      target: { value: '1234567890' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 2: Contact
    await waitFor(() => {
      expect(screen.getByLabelText('Mobile Number')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Mobile Number'), {
      target: { value: '01712345678' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Continue through steps...
  });
});
```

---

## 5. E2E Testing

### 5.1 Playwright Tests

```typescript
// e2e/loan-application.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Loan Application E2E', () => {
  test('user can create and submit loan application', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to new application
    await page.click('text=New Application');

    // Fill personal info
    await page.fill('[name="nidNumber"]', '1234567890');
    await page.fill('[name="applicantName"]', 'John Doe');
    await page.click('text=Next');

    // Fill loan details
    await page.fill('[name="loanAmount"]', '500000');
    await page.fill('[name="loanPurpose"]', 'Home renovation');
    await page.click('text=Submit');

    // Verify success
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  });
});
```

---

## 6. Testing Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit and integration test runner |
| **React Testing Library** | Component testing utilities |
| **Playwright** | E2E testing |
| **MSW** | API mocking |
| **c8** | Code coverage |

---

## 7. Coverage Requirements

| Category | Minimum Coverage |
|----------|------------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## 8. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Frontend_Testing_Guide_Vitest_v1.0.md` | Vitest guide |
| `[TEST]_Component_Testing_Strategy_v1.0.md` | Component testing |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
