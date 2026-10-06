# Form Handling Validation Patterns

## Form Validation with React Hook Form and Zod

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Form Handling Validation Patterns |
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
2. [Validation Schema Patterns](#2-validation-schema-patterns)
3. [Form Component Patterns](#3-form-component-patterns)
4. [Server-Side Validation](#4-server-side-validation)
5. [Cross-Field Validation](#5-cross-field-validation)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines form handling and validation patterns for ULMS v2.0 using React Hook Form with Zod schema validation.

---

## 2. Validation Schema Patterns

### 2.1 Bangladesh-Specific Validations

```typescript
// utils/validation/schemas.ts
import { z } from 'zod';

// NID Validation (10, 13, or 17 digits)
export const nidSchema = z.string()
  .regex(/^\d{10}(\d{3})?(\d{4})?$/, 'Invalid NID number format');

// Bangladesh Mobile Number
export const bangladeshPhoneSchema = z.string()
  .regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh mobile number');

// BDT Amount
export const bdtAmountSchema = z.number()
  .min(0, 'Amount cannot be negative')
  .max(999999999999, 'Amount exceeds maximum limit');

// Email
export const emailSchema = z.string()
  .email('Invalid email address');

// Date within range
export const dateRangeSchema = (min: Date, max: Date) =>
  z.date()
    .min(min, 'Date is too old')
    .max(max, 'Date is too recent');
```

### 2.2 Form Schema Composition

```typescript
// schemas/loanApplicationSchema.ts
import { z } from 'zod';
import { nidSchema, bangladeshPhoneSchema, bdtAmountSchema } from './common';

const personalInfoSchema = z.object({
  applicantName: z.string().min(3).max(100),
  nidNumber: nidSchema,
  dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in the future'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

const contactSchema = z.object({
  mobileNumber: bangladeshPhoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10).max(300),
});

const loanDetailsSchema = z.object({
  loanAmount: bdtAmountSchema,
  loanPurpose: z.string().min(10).max(500),
  tenureMonths: z.number().min(12).max(360),
  interestRate: z.number().min(0).max(25),
});

export const loanApplicationSchema = z.object({
  personalInfo: personalInfoSchema,
  contact: contactSchema,
  loanDetails: loanDetailsSchema,
});

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
```

---

## 3. Form Component Patterns

### 3.1 Controlled Form Components

```typescript
// components/forms/FormInput/FormInput.tsx
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<T extends FieldValues>
  extends Omit<TextFieldProps, 'name'> {
  name: Path<T>;
  control: Control<T>;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...props}
          error={!!error}
          helperText={error?.message}
          value={field.value || ''}
        />
      )}
    />
  );
}
```

---

## 4. Server-Side Validation

### 4.1 Handling Server Errors

```typescript
// hooks/useFormSubmission.ts
import { useState } from 'react';
import { FieldValues, UseFormSetError } from 'react-hook-form';

interface ServerError {
  field: string;
  message: string;
}

export function useFormSubmission<T extends FieldValues>() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleServerErrors = (
    errors: ServerError[],
    setError: UseFormSetError<T>
  ) => {
    errors.forEach(({ field, message }) => {
      setError(field as any, { message });
    });
  };

  return { isSubmitting, setIsSubmitting, handleServerErrors };
}
```

---

## 5. Cross-Field Validation

### 5.1 Refine for Cross-Field Rules

```typescript
// schemas with cross-field validation
export const loanApplicationSchema = z.object({
  loanAmount: z.number().min(10000),
  proposedEMI: z.number().min(1),
  monthlyIncome: z.number().min(1),
}).refine((data) => {
  // EMI should not exceed 50% of monthly income
  return data.proposedEMI <= data.monthlyIncome * 0.5;
}, {
  message: 'EMI cannot exceed 50% of monthly income',
  path: ['proposedEMI'],
});
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_Form_Components_Specifications_v1.0.md` | Form components |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
