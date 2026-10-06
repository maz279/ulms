# Form Components Specifications
## ULMS v2.0 Form Component Library

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Form Components Specifications |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | UI/UX Designer |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Frontend Developer | Initial specifications |

---

## Table of Contents

1. [Form Architecture](#1-form-architecture)
2. [Form Wrapper Components](#2-form-wrapper-components)
3. [Input Components](#3-input-components)
4. [Validation Patterns](#4-validation-patterns)
5. [Form Layouts](#5-form-layouts)
6. [Dynamic Forms](#6-dynamic-forms)
7. [File Upload Components](#7-file-upload-components)
8. [Best Practices](#8-best-practices)
9. [Appendices](#9-appendices)

---

## 1. Form Architecture

### 1.1 Form Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React Hook Form | 7.49.0 | Form state management |
| Zod | 3.22.0 | Schema validation |
| @hookform/resolvers | 3.3.0 | Validation integration |
| MUI TextField | 5.15.0 | Base input components |
| MUI X Date Pickers | 6.18.0 | Date/time inputs |

### 1.2 Form Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FORM COMPONENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      FormContainer (Hook Form)                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                      FormLayout (Grid/MUI)                       │ │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │ │  │
│  │  │  │  FormInput  │ │ FormSelect  │ │ FormDate    │ │FormCurrency│ │ │  │
│  │  │  │  Component  │ │ Component   │ │  Component  │ │ Component  │ │ │  │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │                         ZOD VALIDATION SCHEMA                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Form Wrapper Components

### 2.1 Form Container

```typescript
// shared/components/forms/FormContainer.tsx
import React from 'react';
import { useForm, FormProvider, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';
import { Box, BoxProps } from '@mui/material';

interface FormContainerProps<T extends FieldValues> extends Omit<BoxProps, 'onSubmit'> {
  schema: ZodType<T>;
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: UseFormProps<T>['defaultValues'];
  children: React.ReactNode;
  mode?: UseFormProps<T>['mode'];
}

export function FormContainer<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  mode = 'onBlur',
  ...boxProps
}: FormContainerProps<T>): React.ReactElement {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });

  const handleSubmit = async (data: T) => {
    await onSubmit(data);
  };

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={methods.handleSubmit(handleSubmit)}
        noValidate
        {...boxProps}
      >
        {children}
      </Box>
    </FormProvider>
  );
}
```

### 2.2 Form Actions

```typescript
// shared/components/forms/FormActions.tsx
import React from 'react';
import { Box, Button, ButtonProps } from '@mui/material';
import { useFormContext } from 'react-hook-form';

interface FormActionsProps {
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  submitButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
}

export function FormActions({
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  submitButtonProps,
  cancelButtonProps,
}: FormActionsProps): React.ReactElement {
  const { formState } = useFormContext();
  const { isSubmitting } = formState;

  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
      {onCancel && (
        <Button
          onClick={onCancel}
          disabled={isSubmitting || loading}
          {...cancelButtonProps}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting || loading}
        {...submitButtonProps}
      >
        {isSubmitting || loading ? 'Processing...' : submitLabel}
      </Button>
    </Box>
  );
}
```

---

## 3. Input Components

### 3.1 FormInput

```typescript
// shared/components/forms/FormInput.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';

interface FormInputProps extends Omit<TextFieldProps, 'name'> {
  name: string;
  label: string;
}

export function FormInput({
  name,
  label,
  ...textFieldProps
}: FormInputProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          error={!!error}
          helperText={error?.message}
          fullWidth
          {...textFieldProps}
        />
      )}
    />
  );
}
```

### 3.2 FormSelect

```typescript
// shared/components/forms/FormSelect.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectProps,
} from '@mui/material';

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps extends Omit<SelectProps, 'name'> {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
}

export function FormSelect({
  name,
  label,
  options,
  helperText,
  ...selectProps
}: FormSelectProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} label={label} {...selectProps}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{error?.message || helperText}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
```

### 3.3 FormDatePicker

```typescript
// shared/components/forms/FormDatePicker.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';

type FormDatePickerProps = Omit<DatePickerProps<Date>, 'value' | 'onChange'> & {
  name: string;
  label: string;
};

export function FormDatePicker({
  name,
  label,
  ...datePickerProps
}: FormDatePickerProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <DatePicker
            label={label}
            value={value}
            onChange={onChange}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
            {...datePickerProps}
          />
        )}
      />
    </LocalizationProvider>
  );
}
```

### 3.4 FormCurrency

```typescript
// shared/components/forms/FormCurrency.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, InputAdornment } from '@mui/material';

interface FormCurrencyProps {
  name: string;
  label: string;
  min?: number;
  max?: number;
}

export function FormCurrency({
  name,
  label,
  min,
  max,
}: FormCurrencyProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          error={!!error}
          helperText={error?.message}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">৳</InputAdornment>,
          }}
          inputProps={{
            min,
            max,
            step: 1000,
          }}
        />
      )}
    />
  );
}
```

### 3.5 FormNIDInput

```typescript
// shared/components/forms/FormNIDInput.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';

interface FormNIDInputProps {
  name: string;
  label?: string;
}

export function FormNIDInput({
  name,
  label = 'NID Number',
}: FormNIDInputProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          placeholder="Enter 10-17 digit NID number"
          error={!!error}
          helperText={error?.message || 'National Identity Card number'}
          fullWidth
          inputProps={{
            maxLength: 17,
            inputMode: 'numeric',
          }}
        />
      )}
    />
  );
}
```

### 3.6 FormMobileInput

```typescript
// shared/components/forms/FormMobileInput.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, InputAdornment } from '@mui/material';

interface FormMobileInputProps {
  name: string;
  label?: string;
}

export function FormMobileInput({
  name,
  label = 'Mobile Number',
}: FormMobileInputProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          placeholder="1XXXXXXXXX"
          error={!!error}
          helperText={error?.message || 'Format: 01XXXXXXXXX'}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">+880</InputAdornment>,
          }}
          inputProps={{
            maxLength: 10,
            inputMode: 'tel',
          }}
        />
      )}
    />
  );
}
```

### 3.7 FormAutoComplete

```typescript
// shared/components/forms/FormAutoComplete.tsx
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Autocomplete,
  TextField,
  AutocompleteProps,
} from '@mui/material';

interface FormAutoCompleteProps<T>
  extends Omit<AutocompleteProps<T, false, false, false>, 'renderInput' | 'options'> {
  name: string;
  label: string;
  options: T[];
  getOptionLabel: (option: T) => string;
}

export function FormAutoComplete<T>({
  name,
  label,
  options,
  getOptionLabel,
  ...autocompleteProps
}: FormAutoCompleteProps<T>): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Autocomplete
          value={value || null}
          onChange={(_, newValue) => onChange(newValue)}
          options={options}
          getOptionLabel={getOptionLabel}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!error}
              helperText={error?.message}
            />
          )}
          {...autocompleteProps}
        />
      )}
    />
  );
}
```

---

## 4. Validation Patterns

### 4.1 Common Validation Schemas

```typescript
// shared/utils/validationSchemas.ts
import { z } from 'zod';

// NID validation (Bangladesh)
export const nidSchema = z
  .string()
  .min(1, 'NID is required')
  .regex(/^\d+$/, 'NID must contain only digits')
  .refine(
    (val) => val.length >= 10 && val.length <= 17,
    'NID must be 10-17 digits'
  );

// Mobile number validation (Bangladesh)
export const mobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .regex(/^\d{10}$/, 'Mobile number must be 10 digits (without country code)');

// Currency/Amount validation
export const amountSchema = (min = 0, max?: number) =>
  z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .min(min, `Amount must be at least ${min}`)
    .refine((val) => val % 1000 === 0, 'Amount must be in multiples of 1000')
    .refine((val) => !max || val <= max, `Amount must not exceed ${max}`);

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

// Date validation
export const dateSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date',
});

// Loan application schema example
export const loanApplicationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  productId: z.string().min(1, 'Product is required'),
  amount: amountSchema(50000, 10000000),
  tenor: z
    .number()
    .min(12, 'Minimum tenor is 12 months')
    .max(60, 'Maximum tenor is 60 months'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  interestRate: z
    .number()
    .min(9, 'Minimum rate is 9%')
    .max(18, 'Maximum rate is 18%'),
  applicationDate: dateSchema,
});

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
```

### 4.2 Form Error Handling

```typescript
// shared/components/forms/FormErrorSummary.tsx
import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { useFormContext } from 'react-hook-form';

export function FormErrorSummary(): React.ReactElement | null {
  const { formState: { errors } } = useFormContext();
  
  const errorMessages = Object.entries(errors)
    .filter(([, error]) => error?.message)
    .map(([field, error]) => ({
      field,
      message: error?.message as string,
    }));

  if (errorMessages.length === 0) return null;

  return (
    <Alert severity="error" sx={{ mb: 3 }}>
      <AlertTitle>Please correct the following errors:</AlertTitle>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {errorMessages.map(({ field, message }) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </Alert>
  );
}
```

---

## 5. Form Layouts

### 5.1 Standard Form Layout

```typescript
// shared/components/forms/FormLayout.tsx
import React from 'react';
import { Grid, GridProps } from '@mui/material';

interface FormLayoutProps {
  children: React.ReactNode;
  spacing?: GridProps['spacing'];
}

export function FormLayout({ children, spacing = 3 }: FormLayoutProps): React.ReactElement {
  return (
    <Grid container spacing={spacing}>
      {children}
    </Grid>
  );
}

interface FormFieldProps extends GridProps {
  children: React.ReactNode;
}

export function FormField({
  children,
  xs = 12,
  sm,
  md,
  lg,
  ...props
}: FormFieldProps): React.ReactElement {
  return (
    <Grid item xs={xs} sm={sm} md={md} lg={lg} {...props}>
      {children}
    </Grid>
  );
}

// Usage example
/*
<FormLayout>
  <FormField md={6}>
    <FormInput name="firstName" label="First Name" />
  </FormField>
  <FormField md={6}>
    <FormInput name="lastName" label="Last Name" />
  </FormField>
  <FormField>
    <FormNIDInput name="nidNumber" />
  </FormField>
</FormLayout>
*/
```

### 5.2 Sectioned Form Layout

```typescript
// shared/components/forms/FormSection.tsx
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps): React.ReactElement {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      <Divider sx={{ mb: 3 }} />
      {children}
    </Box>
  );
}
```

---

## 6. Dynamic Forms

### 6.1 Dynamic Field Array

```typescript
// shared/components/forms/FormFieldArray.tsx
import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Box, IconButton, Button, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

interface FormFieldArrayProps {
  name: string;
  label: string;
  renderField: (index: number, remove: () => void) => React.ReactNode;
  defaultValue: Record<string, unknown>;
  minItems?: number;
  maxItems?: number;
}

export function FormFieldArray({
  name,
  label,
  renderField,
  defaultValue,
  minItems = 0,
  maxItems = 10,
}: FormFieldArrayProps): React.ReactElement {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">{label}</Typography>
        <Button
          startIcon={<Add />}
          onClick={() => append(defaultValue)}
          disabled={fields.length >= maxItems}
          size="small"
        >
          Add
        </Button>
      </Box>
      
      {fields.map((field, index) => (
        <Box key={field.id} display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Box flex={1}>{renderField(index, () => remove(index))}</Box>
          {fields.length > minItems && (
            <IconButton
              onClick={() => remove(index)}
              color="error"
              size="small"
              sx={{ mt: 1 }}
            >
              <Delete />
            </IconButton>
          )}
        </Box>
      ))}
    </Box>
  );
}

// Usage example for co-applicants
/*
<FormFieldArray
  name="coApplicants"
  label="Co-Applicants"
  defaultValue={{ name: '', relationship: '', nid: '' }}
  renderField={(index, remove) => (
    <Grid container spacing={2}>
      <Grid item xs={5}>
        <FormInput name={`coApplicants.${index}.name`} label="Name" />
      </Grid>
      <Grid item xs={3}>
        <FormSelect
          name={`coApplicants.${index}.relationship`}
          label="Relationship"
          options={relationshipOptions}
        />
      </Grid>
      <Grid item xs={4}>
        <FormNIDInput name={`coApplicants.${index}.nid`} />
      </Grid>
    </Grid>
  )}
/>
*/
```

---

## 7. File Upload Components

### 7.1 FormFileUpload

```typescript
// shared/components/forms/FormFileUpload.tsx
import React, { useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface FormFileUploadProps {
  name: string;
  label: string;
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  maxFiles?: number;
}

export function FormFileUpload({
  name,
  label,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5,
}: FormFileUploadProps): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value = [], onChange }, fieldState: { error } }) => {
        const onDrop = useCallback(
          (acceptedFiles: File[]) => {
            const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
            onChange(newFiles);
          },
          [value, onChange]
        );

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
          onDrop,
          accept,
          maxSize,
        });

        const removeFile = (index: number) => {
          const newFiles = value.filter((_, i) => i !== index);
          onChange(newFiles);
        };

        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {label}
            </Typography>
            
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography>
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag & drop files here, or click to select'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max {maxFiles} files, up to {maxSize / 1024 / 1024}MB each
              </Typography>
            </Box>

            {error && (
              <Typography color="error" variant="caption">
                {error.message}
              </Typography>
            )}

            {value.length > 0 && (
              <List dense sx={{ mt: 2 }}>
                {value.map((file: File, index: number) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => removeFile(index)}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );
      }}
    />
  );
}
```

---

## 8. Best Practices

### 8.1 Form Design Principles

1. **Group Related Fields**: Use sections to organize related information
2. **Inline Validation**: Validate on blur for immediate feedback
3. **Clear Labels**: Use descriptive labels and placeholders
4. **Error Messages**: Provide specific, actionable error messages
5. **Progressive Disclosure**: Show advanced options only when needed

### 8.2 Performance Guidelines

- Use `mode: 'onBlur'` for validation to reduce re-renders
- Memoize expensive validation schemas
- Use `Controller` only when necessary for complex inputs
- Debounce search/autocomplete inputs

---

## 9. Appendices

### Appendix A: Input Type Quick Reference

| Field Type | Component | Validation |
|------------|-----------|------------|
| Text | FormInput | z.string() |
| Number | FormInput (type="number") | z.number() |
| Select | FormSelect | z.string() |
| Date | FormDatePicker | z.date() |
| Currency | FormCurrency | amountSchema() |
| NID | FormNIDInput | nidSchema |
| Mobile | FormMobileInput | mobileSchema |
| File | FormFileUpload | z.instanceof(File) |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
