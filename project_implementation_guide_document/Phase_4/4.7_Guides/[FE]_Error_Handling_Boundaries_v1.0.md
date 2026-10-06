# Error Handling & Boundaries
## ULMS v2.0 Error Management

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Error Handling & Boundaries |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Error Boundaries

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught:', error, info);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

## 2. API Error Handling

```typescript
// Global error handler
const baseQueryWithRetry = retry(
  fetchBaseQuery({ baseUrl: '/api' }),
  { maxRetries: 3 }
);

// Component error handling
try {
  const result = await createApplication(data).unwrap();
} catch (error) {
  if (error.status === 401) {
    dispatch(logout());
  } else {
    showErrorToast(error.data?.message || 'An error occurred');
  }
}
```

## 3. Error Types

| Type | Handling |
|------|----------|
| Validation | Inline form errors |
| Network | Retry with backoff |
| Server | Error toast + logging |
| Auth | Redirect to login |
| Not Found | 404 page |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
