# Reusable Component Development Guide

## Component Development Standards for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Reusable Component Development Guide |
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
2. [Component Structure](#2-component-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Props Interface](#4-props-interface)
5. [Composition Patterns](#5-composition-patterns)
6. [Testing Guidelines](#6-testing-guidelines)
7. [Documentation Standards](#7-documentation-standards)
8. [Related Documents](#8-related-documents)

---

## 1. Executive Summary

This guide establishes standards for developing reusable components in ULMS v2.0, ensuring consistency, maintainability, and testability across the application.

---

## 2. Component Structure

### 2.1 Standard Component File Structure

```
ComponentName/
├── index.ts                 # Public exports
├── ComponentName.tsx        # Main component
├── ComponentName.test.tsx   # Unit tests
├── ComponentName.stories.tsx # Storybook stories (optional)
├── types.ts                 # Component types (if complex)
├── hooks.ts                 # Component hooks (if needed)
└── styles.ts                # Component styles (if needed)
```

### 2.2 Component Template

```typescript
// components/common/ComponentName/ComponentName.tsx
import React, { forwardRef, ReactNode } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

/**
 * Props interface for ComponentName
 * @interface ComponentNameProps
 */
export interface ComponentNameProps {
  /** Content to be rendered inside the component */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** MUI sx prop for styling */
  sx?: SxProps<Theme>;
  /** Disabled state */
  disabled?: boolean;
  /** Callback when clicked */
  onClick?: () => void;
}

/**
 * ComponentName - Brief description of the component
 * 
 * @example
 * ```tsx
 * <ComponentName onClick={handleClick}>
 *   Content here
 * </ComponentName>
 * ```
 */
export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ children, className, sx, disabled = false, onClick, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={className}
        sx={sx}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

---

## 3. Naming Conventions

### 3.1 File and Component Naming

| Item | Convention | Example |
|------|------------|---------|
| Component files | PascalCase | `ActionButton.tsx` |
| Component names | PascalCase | `ActionButton` |
| Props interfaces | PascalCase + Props | `ActionButtonProps` |
| Hooks | camelCase with use prefix | `useFormValidation` |
| Utility functions | camelCase | `formatCurrency` |
| Constants | SCREAMING_SNAKE | `MAX_LOAN_AMOUNT` |

---

## 4. Props Interface

### 4.1 Props Design Principles

```typescript
interface ComponentProps {
  // Required props first
  title: string;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium' | 'large';
  
  // Boolean props with false default
  disabled?: boolean;
  loading?: boolean;
  
  // Event handlers
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (value: string) => void;
  
  // Content
  children?: React.ReactNode;
  
  // Styling
  className?: string;
  sx?: SxProps<Theme>;
}
```

---

## 5. Composition Patterns

### 5.1 Compound Components

```typescript
// Compound component pattern example
import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const Tabs: React.FC<{ children: ReactNode; defaultTab: string }> = ({
  children,
  defaultTab,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div role="tablist">{children}</div>
);

export const Tab: React.FC<{ value: string; children: ReactNode }> = ({
  value,
  children,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');
  
  return (
    <button
      role="tab"
      aria-selected={context.activeTab === value}
      onClick={() => context.setActiveTab(value)}
    >
      {children}
    </button>
  );
};

export const TabPanel: React.FC<{ value: string; children: ReactNode }> = ({
  value,
  children,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');
  
  if (context.activeTab !== value) return null;
  
  return <div role="tabpanel">{children}</div>;
};
```

---

## 6. Testing Guidelines

### 6.1 Component Test Template

```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName>Test Content</ComponentName>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick}>Click me</ComponentName>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    const handleClick = vi.fn();
    render(
      <ComponentName disabled onClick={handleClick}>
        Disabled
      </ComponentName>
    );
    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

---

## 7. Documentation Standards

### 7.1 JSDoc Requirements

```typescript
/**
 * AmountDisplay - Displays currency amounts with proper formatting
 * 
 * This component formats monetary values according to Bangladesh locale,
 * displaying them with the BDT currency symbol and proper formatting.
 * 
 * @param {number} amount - The amount to display
 * @param {string} [currency='BDT'] - Currency code (default: BDT)
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {JSX.Element} Formatted amount display
 * 
 * @example
 * ```tsx
 * <AmountDisplay amount={100000} />
 * // Renders: BDT 100,000.00
 * 
 * <AmountDisplay amount={50000} currency="USD" />
 * // Renders: USD 50,000.00
 * ```
 * 
 * @since 1.0.0
 */
```

---

## 8. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_Component_Library_Documentation_v1.0.md` | Component library |
| `[TEST]_Component_Testing_Strategy_v1.0.md` | Testing strategy |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
