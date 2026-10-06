# Bengali Language Pack
## ULMS v2.0 Bengali (Bangla) Translations

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Bengali Language Pack |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Translation File Structure

```
public/locales/bn/
├── common.json       # Common UI elements
├── los.json          # LOS module
├── credit.json       # Credit module
├── workflow.json     # Workflow module
└── validation.json   # Form validation messages
```

## 2. Common Translations

```json
{
  "app": {
    "name": "ইউএলএমএস",
    "fullName": "ইউনিসফট লোন ম্যানেজমেন্ট সিস্টেম",
    "version": "সংস্করণ {{version}}"
  },
  "navigation": {
    "dashboard": "ড্যাশবোর্ড",
    "loanApplication": "ঋণ আবেদন",
    "customers": "গ্রাহক",
    "credit": "ক্রেডিট বিশ্লেষণ",
    "workflow": "ওয়ার্কফ্লো",
    "reports": "প্রতিবেদন",
    "settings": "সেটিংস",
    "logout": "লগআউট"
  },
  "actions": {
    "save": "সংরক্ষণ করুন",
    "submit": "জমা দিন",
    "cancel": "বাতিল করুন",
    "delete": "মুছে ফেলুন",
    "edit": "সম্পাদনা করুন",
    "view": "দেখুন",
    "search": "অনুসন্ধান করুন",
    "filter": "ফিল্টার করুন",
    "export": "এক্সপোর্ট করুন",
    "print": "প্রিন্ট করুন",
    "download": "ডাউনলোড করুন",
    "upload": "আপলোড করুন",
    "approve": "অনুমোদন করুন",
    "reject": "প্রত্যাখ্যান করুন"
  }
}
```

## 3. LOS Module Translations

```json
{
  "loanApplication": {
    "title": "ঋণ আবেদন",
    "newApplication": "নতুন আবেদন",
    "applicationId": "আবেদন আইডি",
    "customerName": "গ্রাহকের নাম",
    "amount": "ঋণের পরিমাণ",
    "tenor": "মেয়াদকাল",
    "interestRate": "সুদের হার",
    "purpose": "ঋণের উদ্দেশ্য",
    "status": {
      "draft": "খসড়া",
      "submitted": "জমাকৃত",
      "under_review": "পর্যালোচনাধীন",
      "approved": "অনুমোদিত",
      "rejected": "প্রত্যাখ্যাত"
    },
    "steps": {
      "selectCustomer": "গ্রাহক নির্বাচন",
      "selectProduct": "পণ্য নির্বাচন",
      "loanDetails": "ঋণের বিবরণ",
      "documents": "নথিপত্র",
      "review": "পর্যালোচনা"
    }
  },
  "customer": {
    "title": "গ্রাহক ব্যবস্থাপনা",
    "nid": "জাতীয় পরিচয়পত্র নম্বর",
    "nameEn": "নাম (ইংরেজি)",
    "nameBn": "নাম (বাংলা)",
    "mobile": "মোবাইল নম্বর",
    "address": "ঠিকানা"
  }
}
```

## 4. Number/Date Formatting

```typescript
// Bengali number formatting
const bnNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string): string {
  return String(num).replace(/\d/g, (d) => bnNumbers[parseInt(d)]);
}

// Usage
const amount = 500000;
const bnAmount = toBengaliNumber(amount); // ৫০০০০০
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
