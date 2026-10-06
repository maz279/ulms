# Bengali Language Pack

## Bengali (Bangla) Translations for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Bengali Language Pack |
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
2. [Common Translations](#2-common-translations)
3. [Loan Module Translations](#3-loan-module-translations)
4. [Validation Messages](#4-validation-messages)
5. [Banking Terminology](#5-banking-terminology)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document provides the Bengali (Bangla) translations for ULMS v2.0, covering common UI elements, loan-specific terms, validation messages, and banking terminology.

---

## 2. Common Translations

### 2.1 Common UI Elements (public/locales/bn/common.json)

```json
{
  "app": {
    "name": "ঋণ ব্যবস্থাপনা ব্যবস্থা",
    "tagline": "বিশ্বস্ত ব্যাংকিং সমাধান"
  },
  "actions": {
    "save": "সংরক্ষণ করুন",
    "cancel": "বাতিল করুন",
    "submit": "জমা দিন",
    "edit": "সম্পাদনা করুন",
    "delete": "মুছে ফেলুন",
    "view": "দেখুন",
    "download": "ডাউনলোড করুন",
    "print": "প্রিন্ট করুন",
    "search": "অনুসন্ধান করুন",
    "filter": "ফিল্টার করুন",
    "refresh": "রিফ্রেশ করুন",
    "next": "পরবর্তী",
    "previous": "পূর্ববর্তী",
    "back": "পেছনে",
    "close": "বন্ধ করুন",
    "confirm": "নিশ্চিত করুন",
    "approve": "অনুমোদন করুন",
    "reject": "প্রত্যাখ্যান করুন"
  },
  "navigation": {
    "dashboard": "ড্যাশবোর্ড",
    "loans": "ঋণ",
    "applications": "আবেদন",
    "customers": "গ্রাহক",
    "reports": "প্রতিবেদন",
    "settings": "সেটিংস",
    "logout": "লগআউট",
    "profile": "প্রোফাইল"
  },
  "status": {
    "active": "সক্রিয়",
    "inactive": "নিষ্ক্রিয়",
    "pending": "অপেক্ষমাণ",
    "approved": "অনুমোদিত",
    "rejected": "প্রত্যাখ্যাত",
    "processing": "প্রক্রিয়াধীন",
    "completed": "সম্পন্ন",
    "draft": "খসড়া"
  },
  "messages": {
    "loading": "লোড হচ্ছে...",
    "saving": "সংরক্ষণ হচ্ছে...",
    "success": "সফল হয়েছে",
    "error": "ত্রুটি হয়েছে",
    "warning": "সতর্কতা",
    "info": "তথ্য",
    "confirmAction": "আপনি কি নিশ্চিত?",
    "noData": "কোন তথ্য নেই",
    "searchResults": "অনুসন্ধানের ফলাফল"
  },
  "currency": {
    "bdt": "৳",
    "bdt_full": "বাংলাদেশি টাকা"
  },
  "form": {
    "required": "প্রয়োজনীয়",
    "optional": "ঐচ্ছিক",
    "select": "নির্বাচন করুন",
    "enter": "প্রবেশ করুন",
    "invalid": "অবৈধ মান"
  }
}
```

---

## 3. Loan Module Translations

### 3.1 Loan Application (public/locales/bn/loan.json)

```json
{
  "application": {
    "title": "ঋণ আবেদন",
    "new": "নতুন আবেদন",
    "list": "আবেদনের তালিকা",
    "details": "আবেদনের বিবরণ",
    "number": "আবেদন নম্বর",
    "date": "আবেদনের তারিখ",
    "status": "আবেদনের অবস্থা",
    
    "steps": {
      "personal": "ব্যক্তিগত তথ্য",
      "contact": "যোগাযোগের তথ্য",
      "employment": "চাকরির তথ্য",
      "loan": "ঋণের বিবরণ",
      "documents": "নথিপত্র",
      "review": "পর্যালোচনা"
    },
    
    "fields": {
      "applicantName": "আবেদনকারীর নাম",
      "fatherName": "পিতার নাম",
      "motherName": "মাতার নাম",
      "nidNumber": "জাতীয় পরিচয়পত্র নম্বর",
      "dateOfBirth": "জন্ম তারিখ",
      "mobileNumber": "মোবাইল নম্বর",
      "email": "ইমেইল",
      "address": "ঠিকানা",
      "loanAmount": "ঋণের পরিমাণ",
      "loanPurpose": "ঋণের উদ্দেশ্য",
      "loanType": "ঋণের ধরন",
      "tenure": "মেয়াদ (মাস)",
      "interestRate": "সুদের হার",
      "monthlyIncome": "মাসিক আয়",
      "employerName": "নিয়োগকর্তার নাম"
    }
  },
  
  "types": {
    "personal": "ব্যক্তিগত ঋণ",
    "home": "গৃহ নির্মাণ ঋণ",
    "car": "গাড়ি ঋণ",
    "business": "ব্যবসায়িক ঋণ",
    "education": "শিক্ষা ঋণ",
    "agriculture": "কৃষি ঋণ"
  },
  
  "classification": {
    "standard": "স্ট্যান্ডার্ড",
    "sma": "বিশেষ উল্লেখযোগ্য হিসাব",
    "substandard": "অপ্রমাণিত",
    "doubtful": "সন্দেহজনক",
    "bad": "খারাপ"
  },
  
  "workflow": {
    "bocc": "শাখা কর্মকর্তা ক্রেডিট কমিটি",
    "hocc": "প্রধান কার্যালয় ক্রেডিট কমিটি",
    "board": "বোর্ড অফ ডিরেক্টরস"
  }
}
```

---

## 4. Validation Messages

### 4.1 Validation (public/locales/bn/validation.json)

```json
{
  "required": "{{field}} প্রয়োজন",
  "minLength": "{{field}} কমপক্ষে {{min}} অক্ষর হতে হবে",
  "maxLength": "{{field}} সর্বোচ্চ {{max}} অক্ষর হতে পারে",
  "minValue": "{{field}} কমপক্ষে {{min}} হতে হবে",
  "maxValue": "{{field}} সর্বোচ্চ {{max}} হতে পারে",
  "email": "বৈধ ইমেইল ঠিকানা প্রবেশ করুন",
  "phone": "বৈধ মোবাইল নম্বর প্রবেশ করুন",
  "nid": "বৈধ জাতীয় পরিচয়পত্র নম্বর প্রবেশ করুন",
  "numeric": "শুধুমাত্র সংখ্যা গ্রহণযোগ্য",
  "date": "বৈধ তারিখ প্রবেশ করুন",
  "futureDate": "ভবিষ্যৎ তারিখ গ্রহণযোগ্য নয়",
  "pastDate": "অতীতের তারিখ গ্রহণযোগ্য নয়",
  
  "fields": {
    "applicantName": "আবেদনকারীর নাম",
    "nidNumber": "জাতীয় পরিচয়পত্র নম্বর",
    "mobileNumber": "মোবাইল নম্বর",
    "loanAmount": "ঋণের পরিমাণ",
    "loanPurpose": "ঋণের উদ্দেশ্য",
    "address": "ঠিকানা"
  }
}
```

---

## 5. Banking Terminology

### 5.1 Banking Terms

| English | Bengali |
|---------|---------|
| Principal Amount | মূলধন |
| Interest | সুদ |
| EMI | ইক্যুইটি মান্থলি ইনস্টলমেন্ট |
| Outstanding | বকেয়া |
| Disbursement | বিতরণ |
| Repayment | পরিশোধ |
| Collateral | জামানত |
| Guarantor | জামিনদার |
| Credit Score | ক্রেডিট স্কোর |
| Risk Grade | ঝুঁকির মান |
| Overdue | মেয়াদোত্তীর্ণ |
| Defaulting | ডিফল্ট |
| Provision | সংরক্ষণ |
| Write-off": "মুছে ফেলা |

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[I18N]_i18n_Implementation_Guide_react_i18next_v1.0.md` | i18n setup |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
