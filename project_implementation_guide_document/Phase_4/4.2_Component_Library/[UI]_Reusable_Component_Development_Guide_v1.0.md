# Reusable Component Development Guide
## ULMS v2.0 Component Development Standards

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Reusable Component Development Guide |
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
| 1.0 | 2026-02-08 | Frontend Developer | Initial guide |

---

## Table of Contents

1. [Component Principles](#1-component-principles)
2. [Component Structure](#2-component-structure)
3. [Props Design](#3-props-design)
4. [TypeScript Guidelines](#4-typescript-guidelines)
5. [Styling Patterns](#5-styling-patterns)
6. [Testing Components](#6-testing-components)
7. [Documentation](#7-documentation)
8. [Component Checklist](#8-component-checklist)
9. [Appendices](#9-appendices)

---

## 1. Component Principles

### 1.1 SOLID Principles for Components

| Principle | Application |
|-----------|-------------|
| **S**ingle Responsibility | One component, one purpose |
| **O**pen/Closed | Extendable via props, not modification |
| **L**iskov Substitution | Polymorphic components |
| **I**nterface Segregation | Minimal, focused props |
| **D**ependency Inversion | Depend on abstractions |

### 1.2 Component Classification

| Type | Purpose | Example |
|------|---------|---------|
| **Presentational** | Display UI, no business logic | `Button`, `Card`, `StatusBadge` |
| **Container** | Connect to state/data | `LoanApplicationListPage` |
| **Layout** | Structure/arrangement | `MainLayout`, `Sidebar` |
| **HOC** | Cross-cutting concerns | `withAuth`, `withLoading` |
| **Custom Hooks** | Reusable logic | `useAuth`, `useLoanApplication` |

---

## 2. Component Structure

### 2.1 File Organization

```
src/shared/components/
├── ComponentName/
│   ├── ComponentName.tsx        # Main component
│   ├── ComponentName.types.ts   # Type definitions
│   ├── ComponentName.styles.ts  # Styled components
│   ├── ComponentName.test.tsx   # Unit tests
│   ├── ComponentName.stories.tsx # Storybook stories (optional)
│   └── index.ts                 # Public export
```

### 2.2 Component Template

```typescript
// shared/components/ComponentName/ComponentName.tsx
import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import type { ComponentNameProps } from './ComponentName.types';

/**
 * ComponentName - Brief description of component purpose
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   title="Example" 
 *   onAction={() => console.log('action')} 
 * />
 * ```
 */
export function ComponentName({
  title,
  children,
  disabled = false,
  onAction,
  sx,
  ...props
}: ComponentNameProps): React.ReactElement {
  const handleClick = () => {
    if (!disabled && onAction) {
      onAction();
    }
  };

  return (
    <Box 
      sx={{ 
        p: 2,
        opacity: disabled ? 0.5 : 1,
        ...sx,
      }}
      onClick={handleClick}
      {...props}
    >
      {title && <h3>{title}</h3>}
      {children}
    </Box>
  );
}

// Named export for tree-shaking
export default ComponentName;
```

### 2.3 Types File

```typescript
// shared/components/ComponentName/ComponentName.types.ts
import { BoxProps } from '@mui/material';

export interface ComponentNameProps extends Omit<BoxProps, 'onClick'> {
  /** Title displayed at the top */
  title?: string;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Callback when action is triggered */
  onAction?: () => void;
}

// Re-export for convenience
export type { ComponentNameProps as default };
```

### 2.4 Index File

```typescript
// shared/components/ComponentName/index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';

// Re-export default for convenience
export { ComponentName as default } from './ComponentName';
```

---

## 3. Props Design

### 3.1 Props Naming Conventions

| Pattern | Use For | Example |
|---------|---------|---------|
| `on[Event]` | Event handlers | `onClick`, `onSubmit` |
| `is[State]` | Boolean states | `isLoading`, `isOpen` |
| `has[Feature]` | Feature flags | `hasError`, `hasIcon` |
| `[noun]` | Data/content | `title`, `content` |
| `render[Element]` | Render props | `renderItem`, `renderHeader` |

### 3.2 Props Spread Pattern

```typescript
// Good: Destructure specific props, spread rest
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  variant = 'primary',
  size = 'medium',
  children,
  ...buttonProps  // Spread native button props
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      {...buttonProps}  // Apply native props
    >
      {children}
    </button>
  );
}
```

### 3.3 Compound Component Pattern

```typescript
// shared/components/Tabs/Tabs.tsx
import React, { createContext, useContext, useState } from 'react';
import { Box, Tabs as MuiTabs, Tab } from '@mui/material';

interface TabsContextType {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

const TabsContext = createContext<TabsContextType>({
  activeTab: 0,
  setActiveTab: () => {},
});

interface TabsProps {
  children: React.ReactNode;
  defaultTab?: number;
}

export function Tabs({ children, defaultTab = 0 }: TabsProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <Box>{children}</Box>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
}

export function TabsList({ children }: TabsListProps): React.ReactElement {
  const { activeTab, setActiveTab } = useContext(TabsContext);

  return (
    <MuiTabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
      {children}
    </MuiTabs>
  );
}

export function TabItem({ label }: { label: string }): React.ReactElement {
  return <Tab label={label} />;
}

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
}

export function TabPanel({ children, index }: TabPanelProps): React.ReactElement {
  const { activeTab } = useContext(TabsContext);

  if (index !== activeTab) return null;

  return <Box p={2}>{children}</Box>;
}

// Usage
/*
<Tabs defaultTab={0}>
  <TabsList>
    <TabItem label="Details" />
    <TabItem label="Documents" />
    <TabItem label="History" />
  </TabsList>
  <TabPanel index={0}>Details content</TabPanel>
  <TabPanel index={1}>Documents content</TabPanel>
  <TabPanel index={2}>History content</TabPanel>
</Tabs>
*/
```

---

## 4. TypeScript Guidelines

### 4.1 Generic Components

```typescript
// Generic List component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

export function List<T>({
  items,
  renderItem,
  keyExtractor,
}: ListProps<T>): React.ReactElement {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Usage
<List<LoanApplication>
  items={applications}
  renderItem={(app) => <span>{app.applicationId}</span>}
  keyExtractor={(app) => app.id}
/>
```

### 4.2 Polymorphic Components

```typescript
import React from 'react';

// Polymorphic component that renders as different elements
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

interface TextProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function Text<C extends React.ElementType = 'span'>({
  as,
  children,
  size = 'medium',
  color,
  ...props
}: PolymorphicComponentProp<C, TextProps>): React.ReactElement {
  const Component = as || 'span';

  return (
    <Component 
      style={{ fontSize: size, color }} 
      {...props}
    >
      {children}
    </Component>
  );
}

// Usage
// <Text>Default span</Text>
// <Text as="h1">Heading</Text>
// <Text as={Link} to="/home">Link</Text>
```

---

## 5. Styling Patterns

### 5.1 MUI sx Prop Pattern

```typescript
import { SxProps, Theme } from '@mui/material';

interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

const variantStyles: Record<string, SxProps<Theme>> = {
  default: {},
  outlined: {
    border: '1px solid',
    borderColor: 'divider',
  },
  elevated: {
    boxShadow: (theme) => theme.shadows[2],
  },
};

const paddingStyles: Record<string, number> = {
  none: 0,
  small: 1,
  medium: 2,
  large: 4,
};

export function Card({
  variant = 'default',
  padding = 'medium',
  sx,
  children,
}: CardProps): React.ReactElement {
  return (
    <Box
      sx={[
        {
          borderRadius: 2,
          bgcolor: 'background.paper',
          p: paddingStyles[padding],
        },
        variantStyles[variant],
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
```

### 5.2 Styled Components Pattern

```typescript
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

// Using MUI styled API
const StatusIndicator = styled('span')<{ status: 'active' | 'inactive' }>(
  ({ theme, status }) => ({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor:
      status === 'active' ? theme.palette.success.main : theme.palette.error.main,
    marginRight: theme.spacing(1),
  })
);

// Using transient props (prefixed with $)
const CardContainer = styled(Box)<{ $clickable?: boolean }>(
  ({ theme, $clickable }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    cursor: $clickable ? 'pointer' : 'default',
    '&:hover': $clickable && {
      backgroundColor: theme.palette.action.hover,
    },
  })
);
```

---

## 6. Testing Components

### 6.1 Component Test Template

```typescript
// shared/components/ComponentName/ComponentName.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Rendering tests
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<ComponentName />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ComponentName title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(<ComponentName>Child Content</ComponentName>);
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('calls onAction when clicked', async () => {
      const handleAction = vi.fn();
      render(<ComponentName onAction={handleAction} />);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('does not call onAction when disabled', async () => {
      const handleAction = vi.fn();
      render(<ComponentName onAction={handleAction} disabled />);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleAction).not.toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<ComponentName title="Test" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Test');
    });

    it('is keyboard accessible', async () => {
      const handleAction = vi.fn();
      render(<ComponentName onAction={handleAction} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(handleAction).toHaveBeenCalled();
    });
  });

  // Snapshot tests (optional)
  describe('snapshots', () => {
    it('matches snapshot', () => {
      const { container } = render(<ComponentName title="Snapshot Test" />);
      expect(container).toMatchSnapshot();
    });
  });
});
```

### 6.2 Testing Hooks

```typescript
// shared/hooks/useCounter/useCounter.test.ts
import { describe, it, expect, act } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

---

## 7. Documentation

### 7.1 JSDoc Comments

```typescript
/**
 * StatusBadge - Displays a status indicator with appropriate styling
 * 
 * Used throughout ULMS to show loan application, workflow task, and 
 * approval statuses with consistent color coding.
 * 
 * @example
 * // Basic usage
 * <StatusBadge status="approved" />
 * 
 * @example
 * // With custom label
 * <StatusBadge 
 *   status="pending" 
 *   label="Awaiting Manager Approval" 
 * />
 * 
 * @example
 * // Different size
 * <StatusBadge status="rejected" size="medium" />
 */
export function StatusBadge({
  status,
  label,
  size = 'small',
}: StatusBadgeProps): React.ReactElement {
  // ...
}
```

---

## 8. Component Checklist

Before submitting a new component, verify:

### 8.1 Code Quality

- [ ] Component has single responsibility
- [ ] Props are fully typed with TypeScript
- [ ] Default props are defined where appropriate
- [ ] Component is exported with named export
- [ ] Barrel export in index.ts
- [ ] No console.log statements
- [ ] No hardcoded values (use constants/config)

### 8.2 Styling

- [ ] Uses MUI theme values (not hardcoded colors/spacing)
- [ ] Responsive design implemented
- [ ] Loading states styled
- [ ] Disabled states styled
- [ ] Focus states visible

### 8.3 Testing

- [ ] Unit tests written
- [ ] Tests cover rendering
- [ ] Tests cover interactions
- [ ] Tests cover edge cases
- [ ] Accessibility tests included
- [ ] All tests pass

### 8.4 Documentation

- [ ] JSDoc comments added
- [ ] Usage examples included
- [ ] Props documented
- [ ] Type definitions exported

---

## 9. Appendices

### Appendix A: Component Naming Conventions

| Component Type | Naming Pattern | Example |
|---------------|----------------|---------|
| UI Component | PascalCase | `Button`, `Card` |
| Styled Component | PascalCase + descriptive | `StyledButton`, `CardContainer` |
| Hook | camelCase with `use` prefix | `useAuth`, `useForm` |
| Type | PascalCase + `Props` suffix | `ButtonProps`, `CardProps` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
