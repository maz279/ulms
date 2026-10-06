# MUI Theme Customization

## Material-UI Theme for Bangladesh Banking

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | MUI Theme Customization |
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
2. [Brand Colors](#2-brand-colors)
3. [Typography System](#3-typography-system)
4. [Component Overrides](#4-component-overrides)
5. [Responsive Breakpoints](#5-responsive-breakpoints)
6. [Spacing and Layout](#6-spacing-and-layout)
7. [Shadows and Elevation](#7-shadows-and-elevation)
8. [Dark Mode Support](#8-dark-mode-support)
9. [Related Documents](#9-related-documents)

---

## 1. Executive Summary

This document defines the Material-UI theme customization for ULMS v2.0, tailored for Bangladesh banking sector requirements with professional, trustworthy aesthetics and Bengali language support.

---

## 2. Brand Colors

### 2.1 Primary Palette

```typescript
// theme/palette.ts
import { PaletteOptions } from '@mui/material/styles';

export const primaryPalette: PaletteOptions['primary'] = {
  main: '#1a365d',        // Deep Banking Blue
  light: '#2c5282',
  dark: '#0d1b2a',
  contrastText: '#ffffff',
};

export const secondaryPalette: PaletteOptions['secondary'] = {
  main: '#c53030',        // Trust Red
  light: '#e53e3e',
  dark: '#9b2c2c',
  contrastText: '#ffffff',
};

// Status colors
export const statusColors = {
  success: {
    main: '#276749',
    light: '#38a169',
    dark: '#1c4532',
  },
  warning: {
    main: '#d69e2e',
    light: '#ecc94b',
    dark: '#b7791f',
  },
  error: {
    main: '#c53030',
    light: '#fc8181',
    dark: '#742a2a',
  },
  info: {
    main: '#3182ce',
    light: '#63b3ed',
    dark: '#2c5282',
  },
};
```

### 2.2 Complete Palette Configuration

```typescript
// theme/palette.ts
import { createTheme } from '@mui/material/styles';

export const getPalette = (mode: 'light' | 'dark'): PaletteOptions => ({
  mode,
  primary: primaryPalette,
  secondary: secondaryPalette,
  success: statusColors.success,
  warning: statusColors.warning,
  error: statusColors.error,
  info: statusColors.info,
  background: {
    default: mode === 'light' ? '#f7fafc' : '#0d1117',
    paper: mode === 'light' ? '#ffffff' : '#161b22',
  },
  text: {
    primary: mode === 'light' ? '#1a202c' : '#e1e4e8',
    secondary: mode === 'light' ? '#718096' : '#8b949e',
  },
  grey: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923',
  },
});
```

---

## 3. Typography System

### 3.1 Font Configuration

```typescript
// theme/typography.ts
import { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography: TypographyOptions = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(','),
  // Bengali font support
  fontFamilyBn: [
    'Noto Sans Bengali',
    'Hind Siliguri',
    'SolaimanLipi',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    textTransform: 'none', // No uppercase for Bengali support
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    textTransform: 'uppercase',
  },
};
```

---

## 4. Component Overrides

### 4.1 Button Overrides

```typescript
// theme/components.ts
import { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
      },
      containedPrimary: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '1rem',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 6,
        },
      },
    },
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#f7fafc',
        },
      },
      columnHeader: {
        backgroundColor: '#edf2f7',
        fontWeight: 600,
      },
    },
  },
};
```

---

## 5. Responsive Breakpoints

```typescript
// theme/breakpoints.ts
import { BreakpointsOptions } from '@mui/material/styles';

export const breakpoints: BreakpointsOptions = {
  values: {
    xs: 0,      // Mobile
    sm: 600,    // Tablet
    md: 960,    // Small desktop
    lg: 1280,   // Desktop
    xl: 1920,   // Large desktop
  },
};
```

---

## 6. Complete Theme Configuration

```typescript
// theme/index.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { getPalette } from './palette';
import { typography } from './typography';
import { breakpoints } from './breakpoints';
import { components } from './components';

export const createAppTheme = (mode: 'light' | 'dark' = 'light') => {
  const themeOptions: ThemeOptions = {
    palette: getPalette(mode),
    typography,
    breakpoints,
    components,
    shape: {
      borderRadius: 6,
    },
    spacing: 8, // Base spacing unit
  };

  return createTheme(themeOptions);
};

export const theme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_Component_Library_Documentation_v1.0.md` | Component library |
| `[I18N]_Bengali_Language_Pack_v1.0.md` | Bengali support |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
