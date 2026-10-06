# i18n Implementation Guide

## Internationalization with react-i18next

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | i18n Implementation Guide with react-i18next |
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
2. [i18n Configuration](#2-i18n-configuration)
3. [Translation Files](#3-translation-files)
4. [Usage in Components](#4-usage-in-components)
5. [Language Switching](#5-language-switching)
6. [Date and Number Formatting](#6-date-and-number-formatting)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document defines the internationalization (i18n) implementation for ULMS v2.0 using react-i18next, supporting Bengali (Bangla) and English languages for Bangladesh banking operations.

---

## 2. i18n Configuration

### 2.1 i18n Setup

```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import enTranslations from './locales/en/translation.json';
import bnTranslations from './locales/bn/translation.json';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      bn: { translation: bnTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'bn'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: false,
    },
    
    // Bangladesh locale settings
    load: 'languageOnly',
    preload: ['en', 'bn'],
  });

export default i18n;
```

### 2.2 i18n Provider

```typescript
// app/providers.tsx
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
```

---

## 3. Translation Files

### 3.1 File Structure

```
public/locales/
├── en/
│   ├── translation.json
│   ├── loan.json
│   ├── common.json
│   └── validation.json
└── bn/
    ├── translation.json
    ├── loan.json
    ├── common.json
    └── validation.json
```

### 3.2 Translation Namespaces

```typescript
// i18n/namespaces.ts
export const namespaces = {
  common: 'common',
  loan: 'loan',
  validation: 'validation',
  navigation: 'navigation',
  dashboard: 'dashboard',
} as const;

export type Namespace = typeof namespaces[keyof typeof namespaces];
```

---

## 4. Usage in Components

### 4.1 useTranslation Hook

```typescript
// Using useTranslation hook
import { useTranslation } from 'react-i18next';

export function LoanApplicationCard({ application }: { application: LoanApplication }) {
  const { t } = useTranslation(['loan', 'common']);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">
          {t('loan:application.title')}
        </Typography>
        <Typography>
          {t('loan:application.applicantName')}: {application.applicantName}
        </Typography>
        <Typography>
          {t('loan:application.amount')}: {t('common:currency.bdt')} {application.amount}
        </Typography>
        <Button>
          {t('common:actions.viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 4.2 Trans Component for Complex Content

```typescript
import { Trans } from 'react-i18next';

// translation.json
// "welcome": "Welcome, <1>{{name}}</1>! You have <3>{{count}}</3> pending applications."

export function WelcomeMessage({ name, count }: { name: string; count: number }) {
  return (
    <Typography>
      <Trans
        i18nKey="dashboard:welcome"
        values={{ name, count }}
        components={[<span />, <strong />, <span />, <strong />]}
      />
    </Typography>
  );
}
```

---

## 5. Language Switching

### 5.1 Language Switcher Component

```typescript
// components/i18n/LanguageSwitcher/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const currentLanguage = languages.find((l) => l.code === i18n.language);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<span>{currentLanguage?.flag}</span>}
      >
        {currentLanguage?.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={i18n.language === lang.code}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <span style={{ marginRight: 8 }}>{lang.flag}</span>
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
```

---

## 6. Date and Number Formatting

### 6.1 Date Formatting

```typescript
// hooks/useDateFormat.ts
import { useTranslation } from 'react-i18next';

export function useDateFormat() {
  const { i18n } = useTranslation();

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    });
  };

  return { formatDate };
}
```

### 6.2 Number/Currency Formatting

```typescript
// hooks/useNumberFormat.ts
import { useTranslation } from 'react-i18next';

export function useNumberFormat() {
  const { i18n } = useTranslation();

  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return new Intl.NumberFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-BD').format(num);
  };

  return { formatCurrency, formatNumber };
}
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[I18N]_Bengali_Language_Pack_v1.0.md` | Bengali translations |
| `[I18N]_Language_Switcher_Component_v1.0.md` | Language switcher |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
