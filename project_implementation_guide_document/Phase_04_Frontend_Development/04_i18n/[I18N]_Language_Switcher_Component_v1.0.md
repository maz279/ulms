# Language Switcher Component

## Language Selection UI Component

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Language Switcher Component |
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
2. [Component Design](#2-component-design)
3. [Implementation](#3-implementation)
4. [RTL Support](#4-rtl-support)
5. [Related Documents](#5-related-documents)

---

## 1. Executive Summary

This document defines the Language Switcher component for ULMS v2.0, enabling users to switch between English and Bengali (Bangla) languages.

---

## 2. Component Design

### 2.1 Language Switcher Variants

```typescript
// components/i18n/LanguageSwitcher/LanguageSwitcher.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import { Translate } from '@mui/icons-material';

interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇧🇩' },
];

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon' | 'select';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function LanguageSwitcher({
  variant = 'button',
  showLabel = true,
  size = 'medium',
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentLanguage = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    // Persist to localStorage
    localStorage.setItem('preferredLanguage', code);
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Change Language">
          <IconButton onClick={handleClick} size={size}>
            <Translate />
          </IconButton>
        </Tooltip>
        <LanguageMenu
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          onSelect={handleLanguageChange}
          currentLanguage={currentLanguage.code}
        />
      </>
    );
  }

  if (variant === 'select') {
    return (
      <Box sx={{ minWidth: 120 }}>
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.nativeLabel}
            </option>
          ))}
        </select>
      </Box>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<span>{currentLanguage.flag}</span>}
        size={size}
        variant="outlined"
      >
        {showLabel ? currentLanguage.nativeLabel : ''}
      </Button>
      <LanguageMenu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onSelect={handleLanguageChange}
        currentLanguage={currentLanguage.code}
      />
    </>
  );
}

// Language Menu Component
interface LanguageMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (code: string) => void;
  currentLanguage: string;
}

function LanguageMenu({ anchorEl, onClose, onSelect, currentLanguage }: LanguageMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      {languages.map((lang) => (
        <MenuItem
          key={lang.code}
          selected={currentLanguage === lang.code}
          onClick={() => onSelect(lang.code)}
          sx={{ minWidth: 150 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
            <Box>
              <Typography variant="body2">{lang.nativeLabel}</Typography>
              <Typography variant="caption" color="text.secondary">
                {lang.label}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Menu>
  );
}
```

---

## 3. Implementation

### 3.1 Header Integration

```typescript
// components/layout/Header/Header.tsx
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

export function Header() {
  return (
    <AppBar position="fixed">
      <Toolbar>
        {/* Logo and navigation */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Language Switcher */}
        <LanguageSwitcher variant="button" showLabel={false} />
        
        {/* User menu */}
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}
```

---

## 4. RTL Support

```typescript
// hooks/useRTL.ts
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRTL = i18n.dir() === 'rtl';
    document.documentElement.dir = i18n.dir();
    document.body.style.direction = i18n.dir();
    
    // Add/remove RTL class for styling
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [i18n.language]);
}
```

---

## 5. Related Documents

| Document | Purpose |
|----------|---------|
| `[I18N]_i18n_Implementation_Guide_react_i18next_v1.0.md` | i18n setup |
| `[I18N]_Bengali_Language_Pack_v1.0.md` | Bengali translations |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
