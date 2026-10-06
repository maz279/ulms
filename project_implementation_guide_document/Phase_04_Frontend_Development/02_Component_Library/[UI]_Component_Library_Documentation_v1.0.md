# Component Library Documentation

## UI Component Library for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Component Library Documentation |
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
2. [Component Architecture](#2-component-architecture)
3. [Common Components](#3-common-components)
4. [Form Components](#4-form-components)
5. [Layout Components](#5-layout-components)
6. [Feedback Components](#6-feedback-components)
7. [Data Display Components](#7-data-display-components)
8. [Navigation Components](#8-navigation-components)
9. [Component Usage Guidelines](#9-component-usage-guidelines)
10. [Related Documents](#10-related-documents)

---

## 1. Executive Summary

This document defines the UI component library for ULMS v2.0, built on Material-UI (MUI) 5.15 with custom Bangladesh banking-themed components. The library provides a consistent, accessible, and reusable set of components for all frontend modules.

---

## 2. Component Architecture

### 2.1 Component Categories

```
components/
├── common/              # Generic reusable components
│   ├── Button/
│   ├── Card/
│   ├── Chip/
│   └── Typography/
├── forms/               # Form-specific components
│   ├── FormInput/
│   ├── FormSelect/
│   ├── FormDatePicker/
│   └── FormAutocomplete/
├── layout/              # Layout structure components
│   ├── MainLayout/
│   ├── Sidebar/
│   ├── Header/
│   └── PageContainer/
├── feedback/            # User feedback components
│   ├── Alert/
│   ├── Snackbar/
│   ├── Dialog/
│   └── LoadingOverlay/
├── data-display/        # Data presentation components
│   ├── DataTable/
│   ├── StatusBadge/
│   └── AmountDisplay/
└── navigation/          # Navigation components
    ├── Breadcrumbs/
    ├── NavLink/
    └── Pagination/
```

---

## 3. Common Components

### 3.1 Button Variants

```typescript
// components/common/Button/ActionButton.tsx
import { Button, ButtonProps } from '@mui/material';
import { ReactNode } from 'react';

interface ActionButtonProps extends ButtonProps {
  children: ReactNode;
  loading?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <Button
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <CircularProgress size={20} /> : children}
    </Button>
  );
};

// Usage
<ActionButton variant="contained" color="primary" loading={isSubmitting}>
  Submit Application
</ActionButton>
```

### 3.2 Card Components

```typescript
// components/common/Card/InfoCard.tsx
import { Card, CardContent, Typography, Box } from '@mui/material';

interface InfoCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  icon,
  trend,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {value}
            </Typography>
            {trend && (
              <Typography
                variant="caption"
                color={trend.direction === 'up' ? 'success.main' : 'error.main'}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </Typography>
            )}
          </Box>
          {icon && (
            <Box color="primary.main">
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
```

---

## 4. Form Components

### 4.1 Form Input with Validation

```typescript
// components/forms/FormInput/FormInput.tsx
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<T extends FieldValues>
  extends Omit<TextFieldProps, 'name'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  ...textFieldProps
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          label={label}
          error={!!error}
          helperText={error?.message}
          fullWidth
        />
      )}
    />
  );
}

// Usage
<FormInput
  name="applicantName"
  control={control}
  label="Applicant Name"
  required
/>
```

### 4.2 Form Select

```typescript
// components/forms/FormSelect/FormSelect.tsx
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Option[];
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} label={label}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
```

---

## 5. Layout Components

### 5.1 Main Layout

```typescript
// components/layout/MainLayout/MainLayout.tsx
import { Box, CssBaseline } from '@mui/material';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { Outlet } from 'react-router-dom';

const DRAWER_WIDTH = 280;

export const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header onMenuClick={() => setMobileOpen(true)} />
      <Sidebar
        width={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
```

---

## 6. Feedback Components

### 6.1 Snackbar Provider

```typescript
// components/feedback/SnackbarProvider/SnackbarProvider.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarContextType {
  showMessage: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showMessage = useCallback((msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg: string) => showMessage(msg, 'success'), [showMessage]);
  const showError = useCallback((msg: string) => showMessage(msg, 'error'), [showMessage]);
  const showWarning = useCallback((msg: string) => showMessage(msg, 'warning'), [showMessage]);
  const showInfo = useCallback((msg: string) => showMessage(msg, 'info'), [showMessage]);

  const handleClose = () => setOpen(false);

  return (
    <SnackbarContext.Provider
      value={{ showMessage, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
};
```

---

## 7. Data Display Components

### 7.1 Status Badge

```typescript
// components/data-display/StatusBadge/StatusBadge.tsx
import { Chip, ChipProps } from '@mui/material';

type LoanStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CLOSED';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: LoanStatus;
}

const statusConfig: Record<LoanStatus, { color: ChipProps['color']; label: string }> = {
  DRAFT: { color: 'default', label: 'Draft' },
  SUBMITTED: { color: 'info', label: 'Submitted' },
  UNDER_REVIEW: { color: 'warning', label: 'Under Review' },
  APPROVED: { color: 'success', label: 'Approved' },
  REJECTED: { color: 'error', label: 'Rejected' },
  DISBURSED: { color: 'success', label: 'Disbursed' },
  CLOSED: { color: 'default', label: 'Closed' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      {...props}
    />
  );
};
```

### 7.2 Amount Display

```typescript
// components/data-display/AmountDisplay/AmountDisplay.tsx
import { Typography, TypographyProps } from '@mui/material';

interface AmountDisplayProps extends TypographyProps {
  amount: number;
  currency?: string;
  decimals?: number;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'BDT',
  decimals = 2,
  ...typographyProps
}) => {
  const formatted = new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return (
    <Typography component="span" {...typographyProps}>
      {formatted}
    </Typography>
  );
};
```

---

## 8. Navigation Components

### 8.1 Navigation Menu

```typescript
// components/navigation/NavMenu/NavMenu.tsx
import { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface NavMenuProps {
  items: NavItem[];
}

export const NavMenu: React.FC<NavMenuProps> = ({ items }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (label: string) => {
    setOpenItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  return (
    <List>
      {items.map((item) => (
        <NavItemComponent
          key={item.label}
          item={item}
          isOpen={openItems.includes(item.label)}
          onToggle={() => toggleItem(item.label)}
        />
      ))}
    </List>
  );
};

const NavItemComponent: React.FC<{
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ item, isOpen, onToggle }) => {
  if (item.children) {
    return (
      <>
        <ListItem disablePadding>
          <ListItemButton onClick={onToggle}>
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 4 }}>
            {item.children.map((child) => (
              <NavItemComponent
                key={child.label}
                item={child}
                isOpen={false}
                onToggle={() => {}}
              />
            ))}
          </List>
        </Collapse>
      </>
    );
  }

  return (
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={item.path || '#'}>
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
      </ListItemButton>
    </ListItem>
  );
};
```

---

## 9. Component Usage Guidelines

### 9.1 Best Practices

| Guideline | Description |
|-----------|-------------|
| **Composition** | Compose small, focused components |
| **Props Interface** | Always define explicit TypeScript interfaces |
| **Default Props** | Provide sensible defaults for optional props |
| **Memoization** | Use React.memo for expensive renders |
| **Accessibility** | Include ARIA labels and keyboard support |
| **Documentation** | Document props with JSDoc comments |

### 9.2 Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| **PascalCase** | `ActionButton` | Component names |
| **camelCase** | `onClick` | Props and handlers |
| **SCREAMING_SNAKE** | `DRAWER_WIDTH` | Constants |
| **usePrefix** | `useAuth` | Custom hooks |

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_MUI_Theme_Customization_v1.0.md` | Theme customization |
| `[UI]_Form_Components_Specifications_v1.0.md` | Form components |
| `[UI]_Data_Grid_Implementation_MUI_v1.0.md` | DataGrid implementation |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
