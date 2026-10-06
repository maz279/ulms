# Form Components Specifications

## React Hook Form + Zod Integration for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Form Components Specifications |
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
2. [Form Architecture](#2-form-architecture)
3. [Validation Schemas](#3-validation-schemas)
4. [Form Components](#4-form-components)
5. [Multi-Step Forms](#5-multi-step-forms)
6. [Form Submission Patterns](#6-form-submission-patterns)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document specifies the form components and validation patterns for ULMS v2.0 using React Hook Form for state management and Zod for schema validation, optimized for banking data entry with Bengali support.

---

## 2. Form Architecture

### 2.1 Form Pattern Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Form Pattern                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  Zod Schema  │────▶│    RHF       │────▶│  MUI Inputs  │     │
│  │ (Validation) │     │ (useForm)    │     │ (Controller) │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│                                │                                 │
│                                ▼                                 │
│                       ┌──────────────┐                          │
│                       │  Submit      │                          │
│                       │  Handler     │                          │
│                       └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Validation Schemas

### 3.1 Bangladesh-Specific Validations

```typescript
// utils/validation/schemas.ts
import { z } from 'zod';

// Bangladesh NID validation (10, 13, or 17 digits)
export const nidSchema = z.string()
  .regex(/^\d{10}(\d{3})?(\d{4})?$/, 'Invalid NID number format');

// Bangladesh mobile number validation
export const bangladeshPhoneSchema = z.string()
  .regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh mobile number');

// BDT Currency validation
export const bdtAmountSchema = z.number()
  .min(0, 'Amount cannot be negative')
  .max(999999999999, 'Amount exceeds maximum limit');

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address');

// Date validation for loan applications
export const applicationDateSchema = z.date()
  .min(new Date('2020-01-01'), 'Date too old')
  .max(new Date(), 'Future dates not allowed');
```

### 3.2 Loan Application Schema

```typescript
// features/los/schemas/loanApplicationSchema.ts
import { z } from 'zod';

export const loanApplicationSchema = z.object({
  // Personal Information
  applicantName: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  fatherName: z.string()
    .min(3, "Father's name is required")
    .max(100),
  
  motherName: z.string()
    .min(3, "Mother's name is required")
    .max(100),
  
  nidNumber: z.string()
    .regex(/^\d{10}(\d{3})?(\d{4})?$/, 'Invalid NID number'),
  
  dateOfBirth: z.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 18;
    }, 'Applicant must be at least 18 years old'),
  
  mobileNumber: z.string()
    .regex(/^01[3-9]\d{8}$/, 'Invalid mobile number'),
  
  email: z.string()
    .email('Invalid email address')
    .optional(),
  
  // Loan Details
  loanAmount: z.number()
    .min(10000, 'Minimum loan amount is BDT 10,000')
    .max(10000000, 'Maximum loan amount is BDT 1 Crore'),
  
  loanPurpose: z.string()
    .min(10, 'Please provide detailed loan purpose')
    .max(500),
  
  tenureMonths: z.number()
    .min(12, 'Minimum tenure is 12 months')
    .max(360, 'Maximum tenure is 30 years (360 months)'),
  
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(25, 'Interest rate cannot exceed 25%'),
  
  // Address
  presentAddress: z.object({
    addressLine1: z.string().min(5, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    district: z.string().min(2, 'District is required'),
    postCode: z.string().regex(/^\d{4}$/, 'Invalid post code'),
  }),
  
  permanentAddressSame: z.boolean(),
  
  permanentAddress: z.object({
    addressLine1: z.string(),
    city: z.string(),
    district: z.string(),
    postCode: z.string(),
  }).optional(),
}).refine((data) => {
  if (!data.permanentAddressSame && !data.permanentAddress) {
    return false;
  }
  return true;
}, {
  message: 'Permanent address is required when not same as present',
  path: ['permanentAddress'],
});

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
```

---

## 4. Form Components

### 4.1 Controlled Form Input

```typescript
// components/forms/FormInput/FormInput.tsx
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<T extends FieldValues>
  extends Omit<TextFieldProps, 'name'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  ...textFieldProps
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          label={label}
          error={!!error}
          helperText={error?.message}
          fullWidth
          value={field.value || ''}
        />
      )}
    />
  );
}
```

### 4.2 Form Select

```typescript
// components/forms/FormSelect/FormSelect.tsx
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText 
} from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Option[];
  required?: boolean;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  required = false,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} required={required}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} label={label} value={field.value || ''}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
```

### 4.3 Form Date Picker

```typescript
// components/forms/FormDatePicker/FormDatePicker.tsx
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface FormDatePickerProps<T extends FieldValues>
  extends Omit<DatePickerProps<Date>, 'value' | 'onChange' | 'renderInput'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
}

export function FormDatePicker<T extends FieldValues>({
  name,
  control,
  label,
  ...datePickerProps
}: FormDatePickerProps<T>) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            {...datePickerProps}
            label={label}
            value={field.value}
            onChange={field.onChange}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
}
```

---

## 5. Multi-Step Forms

### 5.1 Multi-Step Form Pattern

```typescript
// features/los/components/LoanApplicationWizard/LoanApplicationWizard.tsx
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stepper, Step, StepLabel, Button, Box } from '@mui/material';

const steps = [
  'Personal Information',
  'Contact Details',
  'Loan Details',
  'Documents',
  'Review',
];

export function LoanApplicationWizard() {
  const [activeStep, setActiveStep] = useState(0);
  
  const methods = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    mode: 'onBlur',
  });

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: LoanApplicationFormData) => {
    await submitLoanApplication(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2, mb: 4 }}>
          {activeStep === 0 && <PersonalInfoStep />}
          {activeStep === 1 && <ContactDetailsStep />}
          {activeStep === 2 && <LoanDetailsStep />}
          {activeStep === 3 && <DocumentsStep />}
          {activeStep === 4 && <ReviewStep />}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              disabled={methods.formState.isSubmitting}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </form>
    </FormProvider>
  );
}
```

---

## 6. Form Submission Patterns

### 6.1 Async Submission with Loading State

```typescript
// hooks/useFormSubmission.ts
import { useState } from 'react';
import { useSnackbar } from '../components/feedback/SnackbarProvider';

interface UseFormSubmissionOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
}

export function useFormSubmission<T>({
  onSubmit,
  onSuccess,
  onError,
  successMessage = 'Form submitted successfully',
}: UseFormSubmissionOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useSnackbar();

  const submit = async (data: T) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      showSuccess(successMessage);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      showError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[UI]_Component_Library_Documentation_v1.0.md` | Component library |
| `[LOS]_Loan_Application_Form_Design_v1.0.md` | Loan application forms |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
