# Error Handling Boundaries

## React Error Boundaries Implementation

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Error Handling Boundaries |
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
2. [Error Boundary Component](#2-error-boundary-component)
3. [Error Fallback UI](#3-error-fallback-ui)
4. [Error Logging](#4-error-logging)
5. [API Error Handling](#5-api-error-handling)
6. [Related Documents](#6-related-documents)

---

## 1. Executive Summary

This document defines error handling patterns using React Error Boundaries for ULMS v2.0, ensuring graceful degradation and user-friendly error messages.

---

## 2. Error Boundary Component

### 2.1 Error Boundary Implementation

```typescript
// components/error/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error tracking service
    this.props.onError?.(error, errorInfo);
    
    // Send to monitoring service
    logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
```

### 2.2 App-Level Error Boundary

```typescript
// app/providers.tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<GlobalErrorPage />}
      onError={(error, info) => {
        // Send to error tracking
        console.error('Global error:', error, info);
      }}
    >
      <ReduxProvider store={store}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
```

---

## 3. Error Fallback UI

### 3.1 Error Fallback Component

```typescript
// components/error/ErrorFallback.tsx
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
        <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Something went wrong
        </Typography>
        
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We apologize for the inconvenience. Our team has been notified.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="caption" component="pre">
              {error.message}
            </Typography>
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {onReset && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onReset}
            >
              Try Again
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={() => window.location.href = '/'}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
```

---

## 4. Error Logging

### 4.1 Error Service

```typescript
// services/error/errorService.ts
interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userId?: string;
  url: string;
}

export function logErrorToService(error: Error, errorInfo?: any) {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  // Send to backend
  fetch('/api/logs/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorLog),
  }).catch(console.error);
}
```

---

## 5. API Error Handling

### 5.1 API Error Handler Hook

```typescript
// hooks/useApiError.ts
import { useCallback } from 'react';
import { useSnackbar } from '../components/feedback/SnackbarProvider';
import { useTranslation } from 'react-i18next';

export function useApiError() {
  const { t } = useTranslation();
  const { showError } = useSnackbar();

  const handleError = useCallback((error: any) => {
    const status = error?.status;
    
    switch (status) {
      case 400:
        showError(t('errors.badRequest'));
        break;
      case 401:
        showError(t('errors.unauthorized'));
        window.location.href = '/login';
        break;
      case 403:
        showError(t('errors.forbidden'));
        break;
      case 404:
        showError(t('errors.notFound'));
        break;
      case 422:
        showError(error.data?.message || t('errors.validation'));
        break;
      case 500:
        showError(t('errors.server'));
        break;
      default:
        showError(t('errors.unknown'));
    }
  }, [t, showError]);

  return { handleError };
}
```

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| `[FE]_React_Frontend_Architecture_Document_v1.0.md` | Architecture |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
