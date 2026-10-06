# Responsive Design Implementation

## Mobile/Tablet Responsive Design Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Responsive Design Implementation |
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
2. [Breakpoint Strategy](#2-breakpoint-strategy)
3. [Responsive Components](#3-responsive-components)
4. [Mobile Navigation](#4-mobile-navigation)
5. [Touch Interactions](#5-touch-interactions)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines responsive design patterns for ULMS v2.0 to ensure optimal user experience across desktop, tablet, and mobile devices.

---

## 2. Breakpoint Strategy

### 2.1 MUI Breakpoints

```typescript
// theme/breakpoints.ts
import { BreakpointsOptions } from '@mui/material/styles';

export const breakpoints: BreakpointsOptions = {
  values: {
    xs: 0,      // Mobile (portrait)
    sm: 600,    // Mobile (landscape) / Tablet (portrait)
    md: 960,    // Tablet (landscape) / Small desktop
    lg: 1280,   // Desktop
    xl: 1920,   // Large desktop
  },
};

// Usage in components
<Box sx={{
  width: { xs: '100%', sm: '50%', md: '33.33%' }
}} />
```

---

## 3. Responsive Components

### 3.1 Responsive Grid

```typescript
// Responsive grid layout
import { Grid } from '@mui/material';

export function ResponsiveForm() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6} lg={4}>
        <FormInput label="Field 1" />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <FormInput label="Field 2" />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <FormInput label="Field 3" />
      </Grid>
    </Grid>
  );
}
```

### 3.2 Responsive Table

```typescript
// Responsive data display
import { useMediaQuery, useTheme } from '@mui/material';

export function ResponsiveDataDisplay({ data }: { data: any[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return <MobileCardList data={data} />;
  }

  return <DataTable data={data} />;
}
```

---

## 4. Mobile Navigation

### 4.1 Responsive App Bar

```typescript
// components/layout/Header/Header.tsx
import { useState } from 'react';
import { AppBar, Toolbar, IconButton, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

export function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* Logo and other header content */}
        </Toolbar>
      </AppBar>
      
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        >
          <MobileNavigation onClose={() => setMobileOpen(false)} />
        </Drawer>
      )}
    </>
  );
}
```

---

## 5. Touch Interactions

### 5.1 Touch-Friendly Buttons

```typescript
// Touch-friendly button sizing
<Button
  sx={{
    minHeight: { xs: 48, sm: 36 }, // Larger touch target on mobile
    minWidth: { xs: 88, sm: 64 },
  }}
>
  Submit
</Button>
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_MUI_Theme_Customization_v1.0.md` | Theme customization |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
