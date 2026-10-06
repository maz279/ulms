# MUI Theme Customization
## ULMS v2.0 Material-UI Theme Configuration

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | MUI Theme Customization |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | UI/UX Designer |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Frontend Developer | Initial customization guide |

---

## Table of Contents

1. [Theme Overview](#1-theme-overview)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Component Overrides](#4-component-overrides)
5. [Responsive Design](#5-responsive-design)
6. [Dark Mode Support](#6-dark-mode-support)
7. [Custom Theme Extensions](#7-custom-theme-extensions)
8. [Best Practices](#8-best-practices)
9. [Appendices](#9-appendices)

---

## 1. Theme Overview

### 1.1 Theme Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULMS THEME ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      THEME PROVIDER                                  │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │  │
│  │  │    Light Theme   │  │    Dark Theme    │  │  Custom Theme    │   │  │
│  │  │    (Default)     │  │   (Optional)     │  │   (Bank Brand)   │   │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                      THEME CONFIGURATION                              │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │   Palette    │ │  Typography  │ │  Spacing     │ │  Breakpoints │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │  Components  │ │   Shadows    │ │   Shape      │ │  Transitions │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Theme Files Structure

```
src/
├── config/
│   └── theme/
│       ├── index.ts                 # Main theme export
│       ├── palette.ts               # Color definitions
│       ├── typography.ts            # Typography settings
│       ├── components.ts            # Component overrides
│       ├── breakpoints.ts           # Responsive breakpoints
│       └── custom.d.ts              # TypeScript declarations
├── providers/
│   └── ThemeProvider.tsx            # Theme context provider
└── shared/
    └── styles/
        ├── globals.css              # Global CSS
        └── variables.scss           # SCSS variables
```

---

## 2. Color Palette

### 2.1 Primary Colors

```typescript
// config/theme/palette.ts
import { PaletteOptions } from '@mui/material/styles';

export const primaryColors = {
  main: '#1976d2',        // Professional blue
  light: '#42a5f5',       // Light blue for hover states
  dark: '#1565c0',        // Dark blue for active states
  contrastText: '#ffffff', // White text on primary
};

export const secondaryColors = {
  main: '#dc004e',        // Accent color
  light: '#ff5983',
  dark: '#9a0036',
  contrastText: '#ffffff',
};
```

### 2.2 Status Colors (Loan Classification)

```typescript
// config/theme/palette.ts

// BRPD 15/2024 Loan Classification Colors
export const loanClassificationColors = {
  // Standard (Current) - Green
  STD_0: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
  STD_1: { main: '#66bb6a', light: '#a5d6a7', dark: '#43a047' },
  STD_2: { main: '#81c784', light: '#c8e6c9', dark: '#66bb6a' },
  
  // Special Mention Account - Yellow/Orange
  SMA: { main: '#ff9800', light: '#ffb74d', dark: '#f57c00' },
  
  // Substandard - Orange/Red
  SS: { main: '#ff5722', light: '#ff8a65', dark: '#d84315' },
  
  // Doubtful - Red
  DF: { main: '#f44336', light: '#e57373', dark: '#c62828' },
  
  // Bad/Loss - Dark Red
  BL: { main: '#b71c1c', light: '#e53935', dark: '#7f0000' },
};

// Status colors for general use
export const statusColors = {
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
};
```

### 2.3 Complete Palette Configuration

```typescript
// config/theme/palette.ts
import { PaletteOptions } from '@mui/material/styles';

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
  // Custom colors for ULMS
  loanClassification: {
    std: '#4caf50',
    sma: '#ff9800',
    ss: '#ff5722',
    df: '#f44336',
    bl: '#b71c1c',
  },
};

// Extend Palette interface for custom colors
declare module '@mui/material/styles' {
  interface Palette {
    loanClassification: {
      std: string;
      sma: string;
      ss: string;
      df: string;
      bl: string;
    };
  }
  interface PaletteOptions {
    loanClassification?: {
      std?: string;
      sma?: string;
      ss?: string;
      df?: string;
      bl?: string;
    };
  }
}
```

---

## 3. Typography

### 3.1 Typography Configuration

```typescript
// config/theme/typography.ts
import { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography: TypographyOptions = {
  fontFamily: [
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  
  // Headings
  h1: {
    fontSize: '2.5rem',    // 40px
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',      // 32px
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.75rem',   // 28px
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1.25rem',   // 20px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.0075em',
  },
  
  // Body text
  body1: {
    fontSize: '1rem',      // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.01071em',
  },
  
  // Other variants
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.00714em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none', // Override default uppercase
  },
  caption: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 2,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
  },
};
```

### 3.2 Bengali Font Support

```typescript
// config/theme/typography.ts

// For Bengali text display
export const bengaliTypography: Partial<TypographyOptions> = {
  fontFamily: [
    'Noto Sans Bengali',
    'Roboto',
    'Arial',
    'sans-serif',
  ].join(','),
};

// Usage in component:
// <Typography sx={{ fontFamily: 'Noto Sans Bengali' }}>
//   গ্রাহকের নাম
// </Typography>
```

---

## 4. Component Overrides

### 4.1 Global Component Styles

```typescript
// config/theme/components.ts
import { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
  // Button overrides
  MuiButton: {
    defaultProps: {
      variant: 'contained',
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 8,
        fontWeight: 500,
        padding: '8px 16px',
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
      outlined: {
        borderWidth: 1.5,
      },
      sizeSmall: {
        padding: '4px 12px',
        fontSize: '0.8125rem',
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '0.9375rem',
      },
    },
  },

  // TextField overrides
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
      fullWidth: true,
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },

  // Card overrides
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },

  // Paper overrides
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    },
  },

  // DataGrid overrides
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-cell:focus-within': {
          outline: 'none',
        },
      },
      columnHeaders: {
        backgroundColor: '#f5f5f5',
        borderBottom: '2px solid #e0e0e0',
      },
      columnHeader: {
        fontWeight: 600,
      },
    },
  },

  // Table overrides
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: '#f5f5f5',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 600,
      },
    },
  },

  // Chip overrides
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500,
      },
      sizeSmall: {
        fontSize: '0.75rem',
      },
    },
  },

  // Dialog overrides
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
      },
    },
  },

  // AppBar overrides
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  },

  // Drawer overrides
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: 'none',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
      },
    },
  },
};
```

---

## 5. Responsive Design

### 5.1 Breakpoint Configuration

```typescript
// config/theme/breakpoints.ts
import { BreakpointsOptions } from '@mui/material/styles';

export const breakpoints: BreakpointsOptions = {
  values: {
    xs: 0,      // Mobile portrait
    sm: 640,    // Mobile landscape / Tablet portrait
    md: 768,    // Tablet landscape
    lg: 1024,   // Desktop
    xl: 1280,   // Large desktop
  },
};

// Responsive utilities
export const responsive = {
  sidebar: {
    width: {
      xs: 0,     // Hidden on mobile
      md: 260,   // Visible on tablet+
    },
  },
  content: {
    padding: {
      xs: 2,
      sm: 3,
      md: 4,
    },
  },
  table: {
    pageSize: {
      xs: 5,
      sm: 10,
      md: 20,
    },
  },
};
```

### 5.2 Responsive Component Patterns

```typescript
// Responsive usage examples
import { useTheme, useMediaQuery } from '@mui/material';

// Hook for responsive behavior
export function useResponsive() {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    isLargeScreen: useMediaQuery(theme.breakpoints.up('lg')),
  };
}

// Responsive DataTable columns
const columns = [
  { 
    field: 'id', 
    headerName: 'ID',
    width: 100,
    // Hide on mobile
    hideable: true,
  },
  { 
    field: 'name', 
    headerName: 'Name',
    flex: 1,
    minWidth: 150,
  },
  { 
    field: 'amount', 
    headerName: 'Amount',
    width: 150,
    // Show only on tablet+
    hide: useMediaQuery(theme.breakpoints.down('sm')),
  },
];
```

---

## 6. Dark Mode Support

### 6.1 Dark Theme Palette

```typescript
// config/theme/palette.ts

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
    contrastText: '#000000',
  },
  secondary: {
    main: '#f48fb1',
    light: '#fce4ec',
    dark: '#ec407a',
    contrastText: '#000000',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
};
```

### 6.2 Theme Mode Toggle

```typescript
// providers/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightPalette, darkPalette } from '@/config/theme/palette';
import { typography } from '@/config/theme/typography';
import { components } from '@/config/theme/components';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'dark') {
      setMode('dark');
    }
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', next);
      return next;
    });
  };

  const theme = createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography,
    components,
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
```

---

## 7. Custom Theme Extensions

### 7.1 TypeScript Module Augmentation

```typescript
// config/theme/custom.d.ts
import '@mui/material/styles';

declare module '@mui/material/styles' {
  // Extend theme with custom properties
  interface Theme {
    custom: {
      loanClassification: {
        std: string;
        sma: string;
        ss: string;
        df: string;
        bl: string;
      };
      sidebar: {
        width: number;
        collapsedWidth: number;
      };
    };
  }
  
  interface ThemeOptions {
    custom?: {
      loanClassification?: {
        std?: string;
        sma?: string;
        ss?: string;
        df?: string;
        bl?: string;
      };
      sidebar?: {
        width?: number;
        collapsedWidth?: number;
      };
    };
  }
}
```

---

## 8. Best Practices

### 8.1 Theme Usage Guidelines

1. **Use Theme Values**: Always reference theme values instead of hardcoding
2. **Responsive First**: Design for mobile first, enhance for larger screens
3. **Consistency**: Use consistent spacing and sizing
4. **Accessibility**: Ensure sufficient color contrast (WCAG 2.1 AA)

### 8.2 Common Patterns

```typescript
// ✅ Good: Using theme values
<Box sx={{ 
  p: 2,                    // theme.spacing(2) = 16px
  bgcolor: 'background.paper',
  borderRadius: 1,         // theme.shape.borderRadius = 4px
}}>

// ❌ Bad: Hardcoded values
<Box sx={{ 
  padding: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
}}>
```

---

## 9. Appendices

### Appendix A: Color Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Main | #1976d2 | Buttons, links |
| Primary Light | #42a5f5 | Hover states |
| Success | #2e7d32 | STD classifications |
| Warning | #ed6c02 | SMA, alerts |
| Error | #d32f2f | DF, BL, errors |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
