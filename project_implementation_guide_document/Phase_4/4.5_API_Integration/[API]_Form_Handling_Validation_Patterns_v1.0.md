# Form Handling & Validation Patterns
## ULMS v2.0 Form Patterns

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Form Handling & Validation Patterns |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Form Pattern

```typescript
// Standard form pattern
function useFormHandler<T>(schema: ZodSchema<T>, onSubmit: (data: T) => void) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      form.setError('root', { message: (error as Error).message });
    }
  });

  return { ...form, handleSubmit };
}
```

## 2. Validation Patterns

```typescript
// Async validation
const checkNIDExists = async (nid: string) => {
  const exists = await api.checkNID(nid);
  return !exists || 'NID already registered';
};

// Conditional validation
const schema = z.object({
  hasCoApplicant: z.boolean(),
  coApplicantName: z.string().optional()
    .refine((val) => !hasCoApplicant || val, {
      message: 'Co-applicant name required',
    }),
});
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
