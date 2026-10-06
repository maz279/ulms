# Accessibility & WCAG Compliance
## ULMS v2.0 Accessibility Standards

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Accessibility & WCAG Compliance |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | UI/UX Designer |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. WCAG 2.1 Level AA Requirements

### 1.1 Perceivable

- Text alternatives for images
- Captions for multimedia
- Color not sole means of conveying info
- Text resizable to 200%

### 1.2 Operable

- Keyboard accessible
- No keyboard traps
- Skip links for navigation
- Focus indicators visible

### 1.3 Understandable

- Form labels associated
- Error prevention
- Consistent navigation
- Input assistance

## 2. Implementation

```typescript
// Accessible form input
<TextField
  id="customer-name"
  label="Customer Name"
  aria-required="true"
  aria-describedby="name-helper"
/>
<span id="name-helper">Enter customer's full name</span>

// Accessible button
<Button
  aria-label="Submit loan application"
  onClick={handleSubmit}
>
  Submit
</Button>

// Skip link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
<main id="main-content">
```

## 3. Testing

- Automated: axe-core
- Manual: Keyboard navigation
- Screen reader: NVDA/VoiceOver

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
