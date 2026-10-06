# Loan Application Form Design

## Multi-Step Loan Application Form

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Loan Application Form Design |
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
3. [Step Configuration](#3-step-configuration)
4. [Form Components](#4-form-components)
5. [Validation Implementation](#5-validation-implementation)
6. [Auto-Save Feature](#6-auto-save-feature)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document defines the multi-step loan application form design for ULMS v2.0, guiding users through a structured application process with real-time validation and draft auto-save.

---

## 2. Form Architecture

### 2.1 Wizard Pattern

```typescript
// features/los/components/LoanApplicationWizard/LoanApplicationWizard.tsx
import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Box,
  Paper,
  Typography
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { setDraftApplication } from '../../losSlice';
import { loanApplicationSchema } from '../../schemas/loanApplicationSchema';
import { useCreateLoanApplicationMutation } from '../../api/losApi';

import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { ContactDetailsStep } from './steps/ContactDetailsStep';
import { EmploymentStep } from './steps/EmploymentStep';
import { LoanDetailsStep } from './steps/LoanDetailsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';

const steps = [
  { id: 'personal', label: 'Personal Information', component: PersonalInfoStep },
  { id: 'contact', label: 'Contact Details', component: ContactDetailsStep },
  { id: 'employment', label: 'Employment', component: EmploymentStep },
  { id: 'loan', label: 'Loan Details', component: LoanDetailsStep },
  { id: 'documents', label: 'Documents', component: DocumentsStep },
  { id: 'review', label: 'Review & Submit', component: ReviewStep },
];

export function LoanApplicationWizard() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.los.draftApplication);
  const [activeStep, setActiveStep] = useState(0);
  const [createApplication] = useCreateLoanApplicationMutation();

  const methods = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    mode: 'onBlur',
    defaultValues: draft || {
      personalInfo: {},
      contactDetails: {},
      employment: {},
      loanDetails: {},
      documents: [],
    },
  });

  // Auto-save draft
  useEffect(() => {
    const subscription = methods.watch((value) => {
      dispatch(setDraftApplication(value as Partial<LoanApplication>));
    });
    return () => subscription.unsubscribe();
  }, [methods, dispatch]);

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (data: LoanApplicationFormData) => {
    try {
      await createApplication(data).unwrap();
      // Navigate to success page
    } catch (error) {
      // Handle error
    }
  };

  const CurrentStepComponent = steps[activeStep].component;

  return (
    <FormProvider {...methods}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Loan Application
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step) => (
            <Step key={step.id}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          <CurrentStepComponent />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              type="button"
              variant="contained"
              onClick={methods.handleSubmit(handleSubmit)}
            >
              Submit Application
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </FormProvider>
  );
}
```

---

## 3. Step Configuration

| Step | Fields | Validations |
|------|--------|-------------|
| Personal Info | NID, Name, DOB, Gender | NID format, Age >= 18 |
| Contact | Address, Phone, Email | BD phone format, Email format |
| Employment | Employer, Income, Years | Income >= 0, Years > 0 |
| Loan Details | Amount, Purpose, Tenure | Amount within limits, Tenure range |
| Documents | NID, Photo, Income Proof | File types, Size limits |
| Review | All data summary | Final confirmation |

---

## 4. Form Components

### 4.1 Personal Info Step

```typescript
// features/los/components/LoanApplicationWizard/steps/PersonalInfoStep.tsx
import { Grid } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../../components/forms/FormInput';
import { FormDatePicker } from '../../../../../components/forms/FormDatePicker';
import { FormSelect } from '../../../../../components/forms/FormSelect';

const genderOptions = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export function PersonalInfoStep() {
  const { control } = useFormContext();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormInput
          name="personalInfo.nidNumber"
          control={control}
          label="National ID Number"
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormDatePicker
          name="personalInfo.dateOfBirth"
          control={control}
          label="Date of Birth"
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormInput
          name="personalInfo.firstName"
          control={control}
          label="First Name"
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormInput
          name="personalInfo.lastName"
          control={control}
          label="Last Name"
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormSelect
          name="personalInfo.gender"
          control={control}
          label="Gender"
          options={genderOptions}
          required
        />
      </Grid>
    </Grid>
  );
}
```

---

## 5. Validation Implementation

### 5.1 Step Validation

```typescript
// features/los/components/LoanApplicationWizard/validation.ts
import { UseFormTrigger } from 'react-hook-form';

const stepFields: Record<number, string[]> = {
  0: ['personalInfo.nidNumber', 'personalInfo.firstName', 'personalInfo.lastName', 'personalInfo.dateOfBirth'],
  1: ['contactDetails.address', 'contactDetails.mobileNumber'],
  2: ['employment.employerName', 'employment.monthlyIncome'],
  3: ['loanDetails.amount', 'loanDetails.purpose', 'loanDetails.tenureMonths'],
  4: ['documents'],
};

export const validateStep = async (
  step: number,
  trigger: UseFormTrigger<LoanApplicationFormData>
): Promise<boolean> => {
  const fields = stepFields[step];
  if (!fields) return true;
  return await trigger(fields as any);
};
```

---

## 6. Auto-Save Feature

### 6.1 Draft Persistence

```typescript
// features/los/hooks/useAutoSave.ts
import { useEffect, useCallback } from 'react';
import { UseFormWatch } from 'react-hook-form';
import debounce from 'lodash/debounce';

export function useAutoSave<T>(
  watch: UseFormWatch<T>,
  onSave: (data: T) => void,
  delay: number = 3000
) {
  const debouncedSave = useCallback(
    debounce((data: T) => {
      onSave(data);
    }, delay),
    [onSave, delay]
  );

  useEffect(() => {
    const subscription = watch((value) => {
      debouncedSave(value as T);
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave]);
}
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[LOS]_LOS_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
