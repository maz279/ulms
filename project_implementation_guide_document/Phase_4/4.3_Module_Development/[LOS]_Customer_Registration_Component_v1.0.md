# Customer Registration Component
## ULMS v2.0 Customer Onboarding

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Customer Registration Component |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## Table of Contents

1. [Component Overview](#1-component-overview)
2. [Form Schema](#2-form-schema)
3. [NID Integration](#3-nid-integration)
4. [Form Sections](#4-form-sections)
5. [Validation Rules](#5-validation-rules)
6. [API Integration](#6-api-integration)
7. [Code Implementation](#7-code-implementation)
8. [Appendices](#8-appendices)

---

## 1. Component Overview

The Customer Registration Component enables branch users to onboard new customers with NID-based verification for Bangladesh banking compliance.

### 1.1 Features

- NID auto-verification via NIDW API
- Bengali and English name support
- Address capture (present and permanent)
- Mobile number validation (Bangladesh format)
- Photo capture/upload

---

## 2. Form Schema

```typescript
// modules/los/components/CustomerRegistrationForm/customerRegistration.schema.ts
import { z } from 'zod';

export const customerRegistrationSchema = z.object({
  // NID Information
  nidNumber: z
    .string()
    .min(1, 'NID is required')
    .regex(/^\d+$/, 'NID must contain only digits')
    .refine((val) => val.length >= 10 && val.length <= 17, {
      message: 'NID must be 10-17 digits',
    }),
  
  // Personal Information
  nameEn: z.string().min(2, 'Name in English is required'),
  nameBn: z.string().optional(),
  fatherName: z.string().min(2, 'Father\'s name is required'),
  motherName: z.string().min(2, 'Mother\'s name is required'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required',
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    required_error: 'Marital status is required',
  }),
  
  // Contact Information
  mobileNumber: z
    .string()
    .regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  
  // Present Address
  presentAddress: z.object({
    division: z.string().min(1, 'Division is required'),
    district: z.string().min(1, 'District is required'),
    upazila: z.string().min(1, 'Upazila is required'),
    union: z.string().min(1, 'Union is required'),
    village: z.string().min(1, 'Village/Area is required'),
    postCode: z.string().optional(),
  }),
  
  // Permanent Address
  sameAsPresent: z.boolean().default(false),
  permanentAddress: z.object({
    division: z.string(),
    district: z.string(),
    upazila: z.string(),
    union: z.string(),
    village: z.string(),
    postCode: z.string().optional(),
  }).optional(),
  
  // Occupation
  occupation: z.string().min(1, 'Occupation is required'),
  monthlyIncome: z.number().min(0, 'Income must be positive'),
  
  // Documents
  nidFrontImage: z.instanceof(File, { message: 'NID front image is required' }),
  nidBackImage: z.instanceof(File, { message: 'NID back image is required' }),
  customerPhoto: z.instanceof(File, { message: 'Customer photo is required' }),
});

export type CustomerRegistrationFormData = z.infer<typeof customerRegistrationSchema>;
```

---

## 3. NID Integration

```typescript
// shared/hooks/useNIDVerification.ts
import { useState, useCallback } from 'react';
import { useVerifyNIDMutation } from '@/services/api/nidApi';

interface NIDVerificationResult {
  success: boolean;
  data?: {
    nameEn: string;
    nameBn: string;
    dateOfBirth: string;
    fatherName: string;
    motherName: string;
    address: string;
    photo: string;
  };
  error?: string;
}

export function useNIDVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNID] = useVerifyNIDMutation();

  const verify = useCallback(
    async (nidNumber: string): Promise<NIDVerificationResult> => {
      setIsVerifying(true);
      try {
        const result = await verifyNID(nidNumber).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message || 'Verification failed',
        };
      } finally {
        setIsVerifying(false);
      }
    },
    [verifyNID]
  );

  return { verify, isVerifying };
}
```

---

## 4. Form Sections

```typescript
// modules/los/components/CustomerRegistrationForm/sections/NIDVerificationSection.tsx
import React from 'react';
import { Box, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { Search } from '@mui/icons-material';
import { useNIDVerification } from '@/shared/hooks/useNIDVerification';

export function NIDVerificationSection(): React.ReactElement {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { verify, isVerifying } = useNIDVerification();
  const [verificationResult, setVerificationResult] = React.useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const nidNumber = watch('nidNumber');

  const handleVerify = async () => {
    if (!nidNumber || nidNumber.length < 10) return;
    
    const result = await verify(nidNumber);
    setVerificationResult({
      success: result.success,
      message: result.success ? 'NID verified successfully' : result.error,
    });

    if (result.success && result.data) {
      // Auto-fill form with NID data
      setValue('nameEn', result.data.nameEn);
      setValue('nameBn', result.data.nameBn);
      setValue('dateOfBirth', new Date(result.data.dateOfBirth));
      setValue('fatherName', result.data.fatherName);
      setValue('motherName', result.data.motherName);
    }
  };

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="flex-start">
        <TextField
          {...register('nidNumber')}
          label="NID Number"
          placeholder="Enter 10-17 digit NID"
          error={!!errors.nidNumber}
          helperText={errors.nidNumber?.message}
          fullWidth
        />
        <Button
          variant="contained"
          startIcon={isVerifying ? <CircularProgress size={16} /> : <Search />}
          onClick={handleVerify}
          disabled={isVerifying || !nidNumber}
        >
          Verify
        </Button>
      </Box>

      {verificationResult && (
        <Alert
          severity={verificationResult.success ? 'success' : 'error'}
          sx={{ mt: 2 }}
        >
          {verificationResult.message}
        </Alert>
      )}
    </Box>
  );
}
```

---

## 5. Validation Rules

| Field | Rules | Error Message |
|-------|-------|---------------|
| NID Number | Required, 10-17 digits | "NID must be 10-17 digits" |
| Name (EN) | Required, min 2 chars | "Name is required" |
| Mobile | Required, 10 digits | "Mobile must be 10 digits" |
| DOB | Required, 18+ years | "Must be at least 18 years old" |
| Email | Optional, valid format | "Invalid email address" |
| Address | All fields required | "Address fields are required" |

---

## 6. API Integration

```typescript
// modules/los/services/customerApi.ts
export const customerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (body) => ({
        url: '/customers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),
    
    searchCustomers: builder.query<Customer[], string>({
      query: (search) => `/customers/search?q=${encodeURIComponent(search)}`,
    }),
    
    getCustomerByNID: builder.query<Customer, string>({
      query: (nid) => `/customers/nid/${nid}`,
    }),
  }),
});
```

---

## 7. Code Implementation

See accompanying files for complete implementation:
- `CustomerRegistrationForm.tsx` - Main form container
- `PersonalInfoSection.tsx` - Personal details
- `AddressSection.tsx` - Address inputs
- `ContactSection.tsx` - Contact information
- `DocumentUploadSection.tsx` - File uploads

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
