# i18n Implementation Guide
## ULMS v2.0 Internationalization with react-i18next

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | i18n Implementation Guide - react-i18next |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Configuration

### 1.1 i18n Setup

```typescript
// shared/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    ns: ['common', 'los', 'credit', 'workflow', 'validation'],
    defaultNS: 'common',
  });

export default i18n;
```

### 1.2 Translation Files Structure

```
public/locales/
├── en/                            # English
│   ├── common.json               # Common translations
│   ├── los.json                  # LOS module
│   ├── credit.json               # Credit module
│   ├── workflow.json             # Workflow module
│   └── validation.json           # Validation messages
│
└── bn/                            # Bengali (Bangla)
    ├── common.json
    ├── los.json
    ├── credit.json
    ├── workflow.json
    └── validation.json
```

---

## 2. Translation Files

### 2.1 Common Translations (English)

```json
{
  "app": {
    "name": "ULMS",
    "fullName": "Unisoft Loan Management System"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "loanApplication": "Loan Application",
    "customers": "Customers",
    "credit": "Credit",
    "workflow": "Workflow",
    "reports": "Reports",
    "settings": "Settings"
  },
  "actions": {
    "save": "Save",
    "submit": "Submit",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "print": "Print"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected"
  }
}
```

### 2.2 Bengali Translations

```json
{
  "app": {
    "name": "ইউএলএমএস",
    "fullName": "ইউনিসফট লোন ম্যানেজমেন্ট সিস্টেম"
  },
  "navigation": {
    "dashboard": "ড্যাশবোর্ড",
    "loanApplication": "ঋণ আবেদন",
    "customers": "গ্রাহক",
    "credit": "ক্রেডিট",
    "workflow": "ওয়ার্কফ্লো",
    "reports": "প্রতিবেদন",
    "settings": "সেটিংস"
  },
  "actions": {
    "save": "সংরক্ষণ",
    "submit": "জমা দিন",
    "cancel": "বাতিল",
    "delete": "মুছুন",
    "edit": "সম্পাদনা",
    "view": "দেখুন",
    "search": "অনুসন্ধান",
    "filter": "ফিল্টার",
    "export": "এক্সপোর্ট",
    "print": "প্রিন্ট"
  },
  "status": {
    "active": "সক্রিয়",
    "inactive": "নিষ্ক্রিয়",
    "pending": "অপেক্ষমাণ",
    "approved": "অনুমোদিত",
    "rejected": "প্রত্যাখ্যান"
  }
}
```

---

## 3. Component Usage

### 3.1 useTranslation Hook

```typescript
// Component with translations
import { useTranslation } from 'react-i18next';

export function Navigation(): React.ReactElement {
  const { t } = useTranslation('common');

  return (
    <nav>
      <Link to="/dashboard">{t('navigation.dashboard')}</Link>
      <Link to="/los">{t('navigation.loanApplication')}</Link>
      <Link to="/customers">{t('navigation.customers')}</Link>
    </nav>
  );
}
```

### 3.2 Trans Component (HTML in translations)

```typescript
import { Trans } from 'react-i18next';

// In translation: "welcome": "Welcome, <1>{{name}}</1>!"
<Trans
  i18nKey="welcome"
  values={{ name: user.name }}
  components={[<span className="highlight" />]}
/>
```

### 3.3 Pluralization

```json
{
  "applications": "{{count}} application",
  "applications_plural": "{{count}} applications"
}
```

```typescript
const { t } = useTranslation();
<p>{t('applications', { count: applicationCount })}</p>
```

---

## 4. Language Switcher

```typescript
// components/LanguageSwitcher.tsx
export function LanguageSwitcher(): React.ReactElement {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={(_, value) => value && changeLanguage(value)}
    >
      <ToggleButton value="en">English</ToggleButton>
      <ToggleButton value="bn">বাংলা</ToggleButton>
    </ToggleButtonGroup>
  );
}
```

---

## 5. Number/Date Formatting

```typescript
import { useTranslation } from 'react-i18next';

export function FormattedNumber({ value }: { value: number }): React.ReactElement {
  const { i18n } = useTranslation();
  
  const formatted = new Intl.NumberFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-BD', {
    style: 'currency',
    currency: 'BDT',
  }).format(value);

  return <span>{formatted}</span>;
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
