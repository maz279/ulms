# Component Testing Strategy

## Component Testing Patterns and Best Practices

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Component Testing Strategy |
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
2. [Testing Principles](#2-testing-principles)
3. [Component Test Patterns](#3-component-test-patterns)
4. [Accessibility Testing](#4-accessibility-testing)
5. [Related Documents](#5-related-documents)

---

## 1. Executive Summary

This document defines component testing patterns and best practices for ULMS v2.0 frontend components.

---

## 2. Testing Principles

### 2.1 Testing Library Principles

| Principle | Description |
|-----------|-------------|
| **Query Priority** | Prefer queries that reflect user experience |
| **User-centric** | Test what users see and do |
| **Avoid implementation details** | Don't test internal state |
| **Accessible queries** | Use role, label, text queries |

### 2.2 Query Priority Order

1. `getByRole` - Most preferred
2. `getByLabelText` - Form fields
3. `getByPlaceholderText`
4. `getByText` - Display text
5. `getByDisplayValue`
6. `getByAltText` - Images
7. `getByTitle`
8. `getByTestId` - Last resort

---

## 3. Component Test Patterns

### 3.1 Form Component Testing

```typescript
// FormInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from './FormInput';

describe('FormInput', () => {
  it('renders with label', () => {
    render(
      <FormInput
        name="test"
        label="Test Label"
        control={mockControl}
      />
    );
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <FormInput
        name="test"
        label="Test"
        control={mockControlWithError}
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('is accessible', () => {
    render(
      <FormInput
        name="test"
        label="Test"
        control={mockControl}
      />
    );
    
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'test');
  });
});
```

### 3.2 Async Component Testing

```typescript
// DataGrid.test.tsx
import { render, screen, waitFor } from '@testing-library/react';

describe('DataGrid', () => {
  it('displays loading state', () => {
    render(<DataGrid />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays data after loading', async () => {
    render(<DataGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Row 1')).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    render(<DataGrid data={[]} />);
    
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});
```

---

## 4. Accessibility Testing

### 4.1 Axe Testing

```typescript
// Accessibility test with jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 4.2 Keyboard Navigation Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Keyboard Navigation', () => {
  it('is focusable and actionable via keyboard', () => {
    render(<Button onClick={handleClick}>Click</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## 5. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Frontend_Testing_Strategy_v1.0.md` | Testing strategy |
| `[TEST]_Frontend_Testing_Guide_Vitest_v1.0.md` | Vitest guide |
| `[FE]_Accessibility_WCAG_Compliance_v1.0.md` | Accessibility |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
