# Customer Registration Component

## NID Auto-Fill Customer Registration

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Customer Registration Component |
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
2. [Component Overview](#2-component-overview)
3. [NID Integration](#3-nid-integration)
4. [Form Structure](#4-form-structure)
5. [Validation Rules](#5-validation-rules)
6. [Implementation](#6-implementation)
7. [Related Documents](#7-related-documents)

---

## 1. Executive Summary

This document defines the Customer Registration component with NID (National ID) auto-fill integration for Bangladesh customer onboarding, connecting to the National ID verification service.

---

## 2. Component Overview

### 2.1 Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer Registration                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │  NID Input       │────▶│  Verify Button   │                 │
│  └──────────────────┘     └────────┬─────────┘                 │
│                                     │                            │
│                                     ▼                            │
│                          ┌──────────────────┐                   │
│                          │  NID Service API │                   │
│                          └────────┬─────────┘                   │
│                                   │                              │
│                     ┌─────────────┼─────────────┐               │
│                     ▼             ▼             ▼               │
│              ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│              │   Name   │  │   DOB    │  │  Address │          │
│              │(readonly)│  │(readonly)│  │(readonly)│          │
│              └──────────┘  └──────────┘  └──────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. NID Integration

### 3.1 NID Verification Hook

```typescript
// features/los/hooks/useNIDVerification.ts
import { useState, useCallback } from 'react';
import { useNIDLookupMutation } from '../api/nidApi';

interface NIDData {
  name: string;
  nameBn: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  address: string;
  photo: string;
}

export function useNIDVerification() {
  const [nidData, setNidData] = useState<NIDData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookup] = useNIDLookupMutation();

  const verifyNID = useCallback(async (nidNumber: string) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const result = await lookup(nidNumber).unwrap();
      setNidData(result);
      return result;
    } catch (err) {
      setError('NID verification failed. Please check the number and try again.');
      setNidData(null);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, [lookup]);

  const clearNID = useCallback(() => {
    setNidData(null);
    setError(null);
  }, []);

  return { nidData, isVerifying, error, verifyNID, clearNID };
}
```

---

## 4. Form Structure

### 4.1 Registration Form Component

```typescript
// features/los/components/CustomerRegistration/CustomerRegistration.tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography
} from '@mui/material';
import { FormInput } from '../../../../components/forms/FormInput';
import { useNIDVerification } from '../../hooks/useNIDVerification';
import { customerRegistrationSchema } from '../../schemas/customerSchema';

const steps = ['NID Verification', 'Personal Details', 'Contact Info', 'Documents'];

export function CustomerRegistration() {
  const [activeStep, setActiveStep] = useState(0);
  const { nidData, isVerifying, error, verifyNID, clearNID } = useNIDVerification();
  
  const methods = useForm({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      nidNumber: '',
      name: '',
      nameBn: '',
      fatherName: '',
      motherName: '',
      dateOfBirth: '',
      address: '',
      mobileNumber: '',
      email: '',
    },
  });

  const handleNIDVerify = async () => {
    const nidNumber = methods.getValues('nidNumber');
    const data = await verifyNID(nidNumber);
    
    if (data) {
      // Auto-fill form with NID data
      methods.setValue('name', data.name);
      methods.setValue('nameBn', data.nameBn);
      methods.setValue('fatherName', data.fatherName);
      methods.setValue('motherName', data.motherName);
      methods.setValue('dateOfBirth', data.dateOfBirth);
      methods.setValue('address', data.address);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={8}>
                <FormInput
                  name="nidNumber"
                  control={methods.control}
                  label="National ID Number (NID)"
                  placeholder="Enter 10, 13, or 17 digit NID"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={handleNIDVerify}
                  disabled={isVerifying}
                  fullWidth
                >
                  {isVerifying ? 'Verifying...' : 'Verify NID'}
                </Button>
              </Grid>
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            {nidData && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item>
                      <Avatar src={nidData.photo} sx={{ width: 80, height: 80 }} />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6">{nidData.name}</Typography>
                      <Typography color="text.secondary">{nidData.nameBn}</Typography>
                      <Typography variant="body2">DOB: {nidData.dateOfBirth}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormInput
                name="name"
                control={methods.control}
                label="Full Name (English)"
                InputProps={{ readOnly: !!nidData }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                name="nameBn"
                control={methods.control}
                label="Full Name (Bangla)"
                InputProps={{ readOnly: !!nidData }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                name="fatherName"
                control={methods.control}
                label="Father's Name"
                InputProps={{ readOnly: !!nidData }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                name="motherName"
                control={methods.control}
                label="Mother's Name"
                InputProps={{ readOnly: !!nidData }}
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormInput
                name="address"
                control={methods.control}
                label="Address"
                multiline
                rows={3}
                InputProps={{ readOnly: !!nidData }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                name="mobileNumber"
                control={methods.control}
                label="Mobile Number"
                placeholder="01XXXXXXXXX"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                name="email"
                control={methods.control}
                label="Email (Optional)"
              />
            </Grid>
          </Grid>
        );
      
      case 3:
        return <DocumentUploadStep />;
      
      default:
        return null;
    }
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
        
        {renderStepContent()}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => prev - 1)}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button type="submit" variant="contained">
              Register Customer
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setActiveStep((prev) => prev + 1)}
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

## 5. Validation Rules

### 5.1 Customer Registration Schema

```typescript
// features/los/schemas/customerSchema.ts
import { z } from 'zod';

export const customerRegistrationSchema = z.object({
  nidNumber: z.string()
    .regex(/^\d{10}(\d{3})?(\d{4})?$/, 'Invalid NID number format'),
  
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  nameBn: z.string()
    .min(3, 'Bangla name is required')
    .max(100),
  
  fatherName: z.string()
    .min(3, "Father's name is required")
    .max(100),
  
  motherName: z.string()
    .min(3, "Mother's name is required")
    .max(100),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  
  address: z.string()
    .min(10, 'Please provide complete address')
    .max(300),
  
  mobileNumber: z.string()
    .regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh mobile number'),
  
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
});

export type CustomerRegistrationData = z.infer<typeof customerRegistrationSchema>;
```

---

## 6. Implementation

### 6.1 NID API Slice

```typescript
// features/los/api/nidApi.ts
import { apiSlice } from '../../../services/api/apiSlice';

export const nidApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    nidLookup: builder.query<NIDData, string>({
      query: (nidNumber) => ({
        url: `/nid/verify/${nidNumber}`,
        method: 'GET',
      }),
    }),
  }),
});

export const { useNIDLookupMutation } = nidApi;
```

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `[LOS]_LOS_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
