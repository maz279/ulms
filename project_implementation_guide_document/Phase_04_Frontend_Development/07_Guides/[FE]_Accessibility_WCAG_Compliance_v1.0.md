# Accessibility WCAG Compliance

## WCAG 2.1 Level AA Compliance Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Accessibility WCAG Compliance |
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
2. [WCAG 2.1 AA Requirements](#2-wcag-21-aa-requirements)
3. [Semantic HTML](#3-semantic-html)
4. [ARIA Attributes](#4-aria-attributes)
5. [Keyboard Navigation](#5-keyboard-navigation)
6. [Color Contrast](#6-color-contrast)
7. [Screen Reader Support](#7-screen-reader-support)
8. [Testing Checklist](#8-testing-checklist)
9. [Related Documents](#9-related-documents)

---

## 1. Executive Summary

This document defines accessibility requirements for ULMS v2.0 to ensure WCAG 2.1 Level AA compliance, making the application accessible to all users including those with disabilities.

---

## 2. WCAG 2.1 AA Requirements

### 2.1 Compliance Checklist

| Principle | Guideline | Implementation |
|-----------|-----------|----------------|
| **Perceivable** | Text alternatives | All images have alt text |
| **Perceivable** | Adaptable | Content readable without CSS |
| **Perceivable** | Distinguishable | Color not sole means of conveying info |
| **Operable** | Keyboard accessible | All functionality available via keyboard |
| **Operable** | Enough time | No time limits without user control |
| **Operable** | Navigable | Clear navigation and focus indicators |
| **Understandable** | Readable | Content readable and understandable |
| **Understandable** | Predictable | Consistent navigation and identification |
| **Robust** | Compatible | Works with assistive technologies |

---

## 3. Semantic HTML

### 3.1 Proper Element Usage

```typescript
// Good: Semantic HTML
<main>
  <header>
    <h1>Loan Applications</h1>
  </header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/los">LOS</a></li>
    </ul>
  </nav>
  <section aria-labelledby="applications-heading">
    <h2 id="applications-heading">Application List</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Applicant</th>
        </tr>
      </thead>
      <tbody>{/* rows */}</tbody>
    </table>
  </section>
</main>

// Bad: Div soup
<div class="main">
  <div class="header">
    <div class="title">Loan Applications</div>
  </div>
</div>
```

---

## 4. ARIA Attributes

### 4.1 ARIA Usage

```typescript
// Button with loading state
<button
  aria-busy={isLoading}
  aria-disabled={isLoading}
  disabled={isLoading}
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Modal dialog
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">Are you sure you want to proceed?</p>
</div>

// Form with errors
<form>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" role="alert">
      {error}
    </span>
  )}
</form>
```

---

## 5. Keyboard Navigation

### 5.1 Focus Management

```typescript
// Focus trap for modals
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}
```

---

## 6. Color Contrast

### 6.1 Contrast Requirements

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18pt+) | 3:1 |
| UI components | 3:1 |

### 6.2 Accessible Color Palette

```typescript
// theme/palette.ts with accessible colors
export const accessiblePalette = {
  primary: {
    main: '#1a365d',    // Contrast ratio: 12.5:1 on white
    light: '#2c5282',
    dark: '#0d1b2a',
    contrastText: '#ffffff',
  },
  error: {
    main: '#c53030',    // Contrast ratio: 7.2:1 on white
    contrastText: '#ffffff',
  },
  text: {
    primary: '#1a202c', // Contrast ratio: 16:1 on white
    secondary: '#4a5568', // Contrast ratio: 7.4:1 on white
  },
};
```

---

## 7. Screen Reader Support

### 7.1 Live Regions

```typescript
// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true">
  {notification && <span>{notification.message}</span>}
</div>

// Status updates
<div role="status" aria-live="polite">
  Application saved successfully
</div>

// Alert for errors
<div role="alert" aria-live="assertive">
  Error: Please check your input
</div>
```

---

## 8. Testing Checklist

### 8.1 Manual Testing

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order follows logical sequence
- [ ] All images have alt text
- [ ] Form labels are properly associated
- [ ] Error messages are announced by screen readers
- [ ] Color is not the sole means of conveying information
- [ ] Text can be resized to 200% without loss of content
- [ ] Content is readable without CSS

### 8.2 Automated Testing

```typescript
// Jest axe test
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Component_Testing_Strategy_v1.0.md` | Testing strategy |
| `[UI]_MUI_Theme_Customization_v1.0.md` | Theme customization |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
