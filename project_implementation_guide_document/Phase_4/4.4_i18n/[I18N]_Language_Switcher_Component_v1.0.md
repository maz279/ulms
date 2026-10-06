# Language Switcher Component
## ULMS v2.0 Language Selection

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Language Switcher Component |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## Component

```typescript
export function LanguageSwitcher(): React.ReactElement {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  ];

  return (
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={(_, value) => value && i18n.changeLanguage(value)}
    >
      {languages.map((lang) => (
        <ToggleButton key={lang.code} value={lang.code}>
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
