# Jaeger Distributed Tracing

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Jaeger Distributed Tracing |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Internal |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Trace Collection](#2-trace-collection)
3. [Span Attributes](#3-span-attributes)
4. [Trace Analysis](#4-trace-analysis)
5. [Performance Optimization](#5-performance-optimization)

---

## 1. Overview

Advanced Jaeger tracing configuration for ULMS microservices.

---

## 2. Trace Collection

### 2.1 Auto-instrumentation

```yaml
# OpenTelemetry Collector
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: ulms-otel
spec:
  mode: deployment
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    exporters:
      jaeger:
        endpoint: jaeger-collector:14250
        tls:
          insecure: true
    service:
      pipelines:
        traces:
          receivers: [otlp]
          exporters: [jaeger]
```

---

## 3. Span Attributes

### 3.1 Custom Tags

```java
Span span = tracer.buildSpan("process-loan").start();
try {
    span.setTag("loan.id", loanId);
    span.setTag("customer.nid", nid);
    span.setTag("loan.amount", amount);
    // Process loan
} finally {
    span.finish();
}
```

### 3.2 Baggage Items

```java
tracer.activeSpan().setBaggageItem("bank.code", "ABC");
tracer.activeSpan().setBaggageItem("branch.id", "001");
```

---

## 4. Trace Analysis

### 4.1 Common Queries

| Query | Use Case |
|-------|----------|
| `service=ulms-backend error=true` | Find error traces |
| `duration>1s` | Slow operations |
| `tag.loan.amount>1000000` | Large loans |

---

## 5. Performance Optimization

- Batch span reporting
- Adaptive sampling
- Storage optimization
- Query caching

---

*© 2026 Unisoft Systems Limited.*
