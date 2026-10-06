# API Versioning Strategy Document
## ULMS v2.0 - API Lifecycle Management

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.2.5 |
| **Document Title** | API Versioning Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Technical Architect, Project Manager |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial API versioning strategy |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Versioning Philosophy](#2-versioning-philosophy)
3. [Versioning Approach](#3-versioning-approach)
4. [Version Numbering Scheme](#4-version-numbering-scheme)
5. [Breaking vs Non-Breaking Changes](#5-breaking-vs-non-breaking-changes)
6. [API Lifecycle Stages](#6-api-lifecycle-stages)
7. [Deprecation Policy](#7-deprecation-policy)
8. [Migration Strategy](#8-migration-strategy)
9. [Version Coexistence](#9-version-coexistence)
10. [Client Communication](#10-client-communication)
11. [Implementation Guidelines](#11-implementation-guidelines)
12. [Governance & Compliance](#12-governance--compliance)
13. [Best Practices](#13-best-practices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the API versioning strategy for ULMS v2.0, ensuring backward compatibility, predictable evolution, and minimal disruption to API consumers including React frontend, mobile applications, and partner integrations.

### 1.2 Scope

| Component | Coverage |
|-----------|----------|
| ULMS Custom APIs | All 180+ endpoints |
| Fineract Integration APIs | Wrapper APIs |
| Partner APIs | External integrations |
| Mobile APIs | React Native app |

### 1.3 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Versioning Method** | URL Path Versioning | Clear, explicit, easy to route |
| **Version Format** | Major only (v1, v2) | Simplicity for consumers |
| **Deprecation Period** | Minimum 6 months | Adequate migration time |
| **Support Period** | N-1 versions | Resource efficiency |

### 1.4 Alignment with Requirements

| Requirement | Section | Compliance |
|-------------|---------|------------|
| BRD 8.3 - API Evolution | Section 5-8 | Full Compliance |
| SRS 5.1 - API Standards | All Sections | Full Compliance |
| RFP 9.1 - Future-proof Architecture | All Sections | Full Compliance |

---

## 2. Versioning Philosophy

### 2.1 Core Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API VERSIONING PRINCIPLES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. STABILITY                                                               │
│     "Once published, an API version is a contract"                          │
│     • No breaking changes within a version                                  │
│     • Predictable behavior for consumers                                    │
│     • Long-term support commitments                                         │
│                                                                              │
│  2. EVOLUTION                                                               │
│     "APIs must be able to evolve without breaking clients"                  │
│     • Additive changes are always safe                                      │
│     • New features in new versions                                          │
│     • Graceful migration paths                                              │
│                                                                              │
│  3. TRANSPARENCY                                                            │
│     "Consumers should always know what to expect"                           │
│     • Clear versioning in URLs                                              │
│     • Documented deprecation timelines                                      │
│     • Advance notice of changes                                             │
│                                                                              │
│  4. SIMPLICITY                                                              │
│     "Versioning should not add cognitive burden"                            │
│     • Single version per major release                                      │
│     • Consistent patterns across services                                   │
│     • Clear upgrade paths                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Versioning Goals

| Goal | Description | Measure |
|------|-------------|---------|
| **Backward Compatibility** | Existing clients continue to work | Zero breaking changes in minor releases |
| **Forward Compatibility** | New clients work with old servers | Graceful degradation |
| **Minimal Disruption** | Upgrades are low-effort | <1 day migration for typical client |
| **Clear Communication** | Consumers know what's changing | 6-month advance notice |
| **Efficient Maintenance** | Manageable version support | Maximum 2 active versions |

---

## 3. Versioning Approach

### 3.1 URL Path Versioning (Chosen Approach)

```
Base URL Format:
https://api.ulms.unisoft.com.bd/api/{version}/{resource}

Examples:
https://api.ulms.unisoft.com.bd/api/v1/loans
https://api.ulms.unisoft.com.bd/api/v2/loans
https://api.ulms.unisoft.com.bd/api/v1/customers/{id}
```

### 3.2 Why URL Path Versioning?

| Consideration | URL Path | Header | Query Param |
|--------------|----------|--------|-------------|
| **Visibility** | Explicit in URL | Hidden | Semi-visible |
| **Routing** | Easy | Complex | Medium |
| **Caching** | Natural | Varies header | Natural |
| **Client Adoption** | Easy | Requires code | Easy |
| **Documentation** | Clear | Complex | Clear |
| **Testing** | Browser-friendly | Requires tools | Browser-friendly |

**Decision**: URL Path Versioning provides the clearest developer experience and easiest implementation with Kong API Gateway.

### 3.3 Alternative Approaches (Not Chosen)

```yaml
# Header Versioning (NOT USED)
Accept: application/vnd.ulms.v1+json
X-API-Version: 1

# Query Parameter Versioning (NOT USED)
GET /api/loans?version=1

# Content Negotiation (NOT USED)
Accept: application/vnd.ulms.loan.v1+json
```

---

## 4. Version Numbering Scheme

### 4.1 Semantic Versioning (Internal)

```
Internal Version: MAJOR.MINOR.PATCH

MAJOR: Breaking changes (exposed in URL as v1, v2, etc.)
MINOR: New features, backward compatible (internal only)
PATCH: Bug fixes, backward compatible (internal only)

Example Timeline:
1.0.0 → Initial release (v1 in URL)
1.1.0 → New endpoint added
1.1.1 → Bug fix
1.2.0 → New optional fields
2.0.0 → Breaking changes (v2 in URL)
```

### 4.2 Public Version (URL)

```
Public Version: v{MAJOR}

Only major version appears in URL:
/api/v1/... → All 1.x.x versions
/api/v2/... → All 2.x.x versions

Rationale:
- Simplicity for API consumers
- Clear indication of compatibility
- Reduces version proliferation
```

### 4.3 Version Progression

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VERSION PROGRESSION TIMELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  2026-Q1        2026-Q2        2026-Q3        2026-Q4        2027-Q1        │
│     │              │              │              │              │            │
│     ▼              ▼              ▼              ▼              ▼            │
│  ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐         │
│  │ v1.0 │──────│ v1.1 │──────│ v1.2 │──────│ v1.3 │──────│ v1.4 │         │
│  │ (GA) │      │(+API)│      │(+feat)│     │(+feat)│     │(maint)│         │
│  └──────┘      └──────┘      └──────┘      └──────┘      └──────┘         │
│     │                                          │                            │
│     │  URL: /api/v1/...                        │                            │
│     │  (All minor versions share same URL)     │                            │
│     │                                          │                            │
│     │                                          ▼                            │
│     │                                      ┌──────┐      ┌──────┐          │
│     │                                      │ v2.0 │──────│ v2.1 │          │
│     │                                      │(break)│     │(+feat)│          │
│     │                                      └──────┘      └──────┘          │
│     │                                          │                            │
│     │                                          │  URL: /api/v2/...          │
│     │                                          │                            │
│     │◄─────────────────────────────────────────│                            │
│     │  v1 deprecated (6 months notice)         │                            │
│     │                                          │                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Breaking vs Non-Breaking Changes

### 5.1 Classification Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHANGE CLASSIFICATION MATRIX                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CHANGE TYPE                          │ BREAKING │ ACTION REQUIRED           │
│  ─────────────────────────────────────┼──────────┼─────────────────────────  │
│                                       │          │                           │
│  ADD new endpoint                     │    NO    │ Document, no version bump │
│  ADD optional request field           │    NO    │ Document, no version bump │
│  ADD response field                   │    NO    │ Document, no version bump │
│  ADD new enum value (output)          │   MAYBE  │ Evaluate client impact    │
│  ADD new HTTP method to endpoint      │    NO    │ Document, no version bump │
│                                       │          │                           │
│  REMOVE endpoint                      │   YES    │ New version required      │
│  REMOVE request field                 │   YES    │ New version required      │
│  REMOVE response field                │   YES    │ New version required      │
│  REMOVE enum value                    │   YES    │ New version required      │
│                                       │          │                           │
│  CHANGE field type                    │   YES    │ New version required      │
│  CHANGE field name                    │   YES    │ New version required      │
│  CHANGE URL structure                 │   YES    │ New version required      │
│  CHANGE authentication method         │   YES    │ New version required      │
│  CHANGE required/optional status      │   YES*   │ Evaluate direction        │
│  CHANGE response status codes         │   MAYBE  │ Evaluate impact           │
│                                       │          │                           │
│  * Optional→Required is breaking; Required→Optional is not                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Breaking Change Examples

```yaml
# BREAKING: Removing a field
# v1
GET /api/v1/loans/{id}
Response:
{
  "id": "LOAN-2026-000123",
  "customerName": "John Doe",      # ← This field will be removed
  "status": "ACTIVE"
}

# v2 (field removed)
GET /api/v2/loans/{id}
Response:
{
  "id": "LOAN-2026-000123",
  # customerName removed - BREAKING
  "status": "ACTIVE"
}

# BREAKING: Changing field type
# v1
{
  "amount": 500000.00    # number
}

# v2
{
  "amount": "500000.00"  # string - BREAKING
}

# BREAKING: Changing URL structure
# v1
GET /api/v1/loans/{loanId}/documents

# v2
GET /api/v2/loan-documents/{loanId}  # BREAKING: URL changed

# BREAKING: Making optional field required
# v1
POST /api/v1/loans
{
  "customerId": "CUST-001",
  "amount": 500000
  # purpose is optional
}

# v2
POST /api/v2/loans
{
  "customerId": "CUST-001",
  "amount": 500000,
  "purpose": "required now"  # BREAKING: now required
}
```

### 5.3 Non-Breaking Change Examples

```yaml
# NON-BREAKING: Adding new field
# v1.0
{
  "id": "LOAN-2026-000123",
  "status": "ACTIVE"
}

# v1.1 (same URL: /api/v1/loans)
{
  "id": "LOAN-2026-000123",
  "status": "ACTIVE",
  "classification": "STD"  # New field - clients ignore unknown fields
}

# NON-BREAKING: Adding new endpoint
# v1.0
GET /api/v1/loans
POST /api/v1/loans

# v1.1 (same version)
GET /api/v1/loans
POST /api/v1/loans
GET /api/v1/loans/summary  # New endpoint added

# NON-BREAKING: Adding optional request field
# v1.0
POST /api/v1/loans
{
  "customerId": "CUST-001",
  "amount": 500000
}

# v1.1 (same version)
POST /api/v1/loans
{
  "customerId": "CUST-001",
  "amount": 500000,
  "referralCode": "REF123"  # New optional field
}
```

---

## 6. API Lifecycle Stages

### 6.1 Lifecycle Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API LIFECYCLE STAGES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  DRAFT  │───►│  BETA   │───►│   GA    │───►│DEPRECATED│───►│ RETIRED │  │
│  │         │    │         │    │         │    │         │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │         │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │Internal │    │ Limited │    │  Full   │    │ Sunset  │    │  404    │  │
│  │design & │    │ partner │    │ support │    │ notice  │    │ returned│  │
│  │ review  │    │ testing │    │         │    │  only   │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                              │
│  Timeline:                                                                  │
│  ─────────                                                                  │
│  DRAFT:      1-2 weeks (internal only)                                     │
│  BETA:       4-8 weeks (select partners)                                   │
│  GA:         Indefinite (full support)                                     │
│  DEPRECATED: Minimum 6 months (sunset notice)                              │
│  RETIRED:    Permanent (endpoint removed)                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Stage Definitions

| Stage | Description | Support Level | SLA |
|-------|-------------|---------------|-----|
| **Draft** | Internal design and review | None | N/A |
| **Beta** | Limited release for testing | Best effort | N/A |
| **GA (Generally Available)** | Full production release | Full support | 99.9% |
| **Deprecated** | Marked for removal | Bug fixes only | 99.9% |
| **Retired** | No longer available | None | N/A |

### 6.3 Stage Indicators

```http
# Beta API Response Headers
X-API-Status: beta
X-API-Beta-Until: 2026-06-01

# GA API Response Headers
X-API-Status: stable
X-API-Version: 1.2.3

# Deprecated API Response Headers
X-API-Status: deprecated
Deprecation: true
Sunset: Sat, 01 Dec 2026 00:00:00 GMT
Link: </api/v2/loans>; rel="successor-version"
```

---

## 7. Deprecation Policy

### 7.1 Deprecation Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPRECATION TIMELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  T-0                T+30d              T+90d              T+180d            │
│   │                   │                  │                   │              │
│   ▼                   ▼                  ▼                   ▼              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DEPRECATION ANNOUNCED                            │   │
│  │  • Blog post announcement                                           │   │
│  │  • Email to registered developers                                   │   │
│  │  • Deprecation header added to responses                            │   │
│  │  • Documentation updated                                            │   │
│  │  • Changelog updated                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                         │
│                   ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MIGRATION SUPPORT                                │   │
│  │  • Migration guide published                                        │   │
│  │  • Support for migration questions                                  │   │
│  │  • Monitoring of v1 usage                                           │   │
│  │  • Direct outreach to high-volume consumers                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FINAL WARNING                                    │   │
│  │  • 90-day reminder sent                                             │   │
│  │  • Warning logs for v1 API calls                                    │   │
│  │  • Final migration assistance                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                   │                         │
│                                                   ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    VERSION RETIRED                                  │   │
│  │  • API version removed                                              │   │
│  │  • 410 Gone returned for old endpoints                              │   │
│  │  • Redirect to documentation                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Deprecation Rules

| Rule | Requirement |
|------|-------------|
| **Minimum Notice** | 6 months before retirement |
| **Communication Channels** | Email, blog, headers, docs |
| **Migration Guide** | Must be published at deprecation |
| **Support** | Bug fixes only during deprecation |
| **Monitoring** | Track usage of deprecated APIs |
| **Extension** | May extend if high usage persists |

### 7.3 Deprecation Headers

```http
# Deprecated API Response
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: true
Deprecation-Date: 2026-06-01T00:00:00Z
Sunset: Sat, 01 Dec 2026 00:00:00 GMT
Link: </api/v2/loans>; rel="successor-version"
X-Deprecation-Notice: This API version will be retired on 2026-12-01. Please migrate to v2.

{
  "data": {...},
  "_deprecation": {
    "message": "This API version is deprecated",
    "sunset": "2026-12-01",
    "successor": "/api/v2/loans",
    "migrationGuide": "https://docs.ulms.unisoft.com.bd/migration/v1-to-v2"
  }
}
```

### 7.4 Retirement Response

```http
# Retired API Response
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "type": "https://ulms.unisoft.com.bd/errors/api-retired",
  "title": "API Version Retired",
  "status": 410,
  "detail": "API version v1 has been retired as of 2026-12-01",
  "instance": "/api/v1/loans",
  "successor": "https://api.ulms.unisoft.com.bd/api/v2/loans",
  "documentation": "https://docs.ulms.unisoft.com.bd/api/v2",
  "migrationGuide": "https://docs.ulms.unisoft.com.bd/migration/v1-to-v2"
}
```

---

## 8. Migration Strategy

### 8.1 Migration Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIGRATION PATTERNS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PATTERN 1: PARALLEL ADOPTION (Recommended)                                 │
│  ───────────────────────────────────────────                                │
│                                                                              │
│  Client                                                                     │
│    │                                                                        │
│    ├──► v1 API (existing features)                                         │
│    │                                                                        │
│    └──► v2 API (new features)                                              │
│                                                                              │
│  Migration Steps:                                                           │
│  1. Add v2 client alongside v1                                             │
│  2. Migrate endpoints incrementally                                        │
│  3. Remove v1 client after full migration                                  │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  PATTERN 2: BIG BANG (Not Recommended)                                      │
│  ─────────────────────────────────────                                      │
│                                                                              │
│  Client                                                                     │
│    │                                                                        │
│    X──► v1 API (removed)                                                   │
│    │                                                                        │
│    └──► v2 API (all features)                                              │
│                                                                              │
│  Risk: Higher chance of issues; all-or-nothing                             │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  PATTERN 3: FEATURE FLAG (For Internal Teams)                              │
│  ────────────────────────────────────────────                               │
│                                                                              │
│  if (featureFlags.useV2Api) {                                              │
│    return callV2Api();                                                     │
│  } else {                                                                  │
│    return callV1Api();                                                     │
│  }                                                                          │
│                                                                              │
│  Allows gradual rollout with easy rollback                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Migration Guide Template

```markdown
# Migration Guide: v1 to v2

## Overview
This guide helps you migrate from ULMS API v1 to v2.

## Timeline
- v2 Available: June 1, 2026
- v1 Deprecated: June 1, 2026
- v1 Retired: December 1, 2026

## Breaking Changes

### 1. Customer Name Field Split
**v1:**
```json
{ "customerName": "MD. REZAUL KARIM" }
```

**v2:**
```json
{
  "firstName": "MD. REZAUL",
  "lastName": "KARIM"
}
```

**Migration:** Split the name field in your code.

### 2. Amount Field Type Change
**v1:** Number
**v2:** String (for precision)

**Migration:** Parse amount as string.

## New Features in v2
- Bengali language fields
- Enhanced error responses
- Batch operations

## SDK Updates
```bash
npm install @ulms/api-client@2.0.0
```

## Support
Contact api-support@unisoft.com.bd for migration assistance.
```

### 8.3 Client Library Support

```java
// Java SDK - Multiple version support
@Configuration
public class UlmsApiConfig {

    @Bean
    @ConditionalOnProperty(name = "ulms.api.version", havingValue = "v1")
    public UlmsApiClient v1Client() {
        return UlmsApiClient.builder()
            .baseUrl("https://api.ulms.unisoft.com.bd/api/v1")
            .build();
    }

    @Bean
    @ConditionalOnProperty(name = "ulms.api.version", havingValue = "v2")
    public UlmsApiClient v2Client() {
        return UlmsApiClient.builder()
            .baseUrl("https://api.ulms.unisoft.com.bd/api/v2")
            .build();
    }
}
```

```typescript
// TypeScript SDK
import { UlmsClient } from '@ulms/api-client';

// v1 client
const v1Client = new UlmsClient({
  version: 'v1',
  baseUrl: 'https://api.ulms.unisoft.com.bd'
});

// v2 client
const v2Client = new UlmsClient({
  version: 'v2',
  baseUrl: 'https://api.ulms.unisoft.com.bd'
});
```

---

## 9. Version Coexistence

### 9.1 Parallel Version Support

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VERSION COEXISTENCE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌──────────────────────────────────┐                     │
│                    │        KONG API GATEWAY          │                     │
│                    └──────────────┬───────────────────┘                     │
│                                   │                                         │
│                    ┌──────────────┴───────────────┐                         │
│                    │                              │                         │
│                    ▼                              ▼                         │
│           ┌───────────────┐              ┌───────────────┐                  │
│           │   /api/v1/*   │              │   /api/v2/*   │                  │
│           └───────┬───────┘              └───────┬───────┘                  │
│                   │                              │                          │
│                   ▼                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LOAN SERVICE (v1 & v2)                           │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐        ┌─────────────────────┐            │   │
│  │  │   V1 Controller     │        │   V2 Controller     │            │   │
│  │  │   /api/v1/loans     │        │   /api/v2/loans     │            │   │
│  │  └─────────┬───────────┘        └─────────┬───────────┘            │   │
│  │            │                              │                         │   │
│  │            ▼                              ▼                         │   │
│  │  ┌─────────────────────┐        ┌─────────────────────┐            │   │
│  │  │   V1 DTO Mapper     │        │   V2 DTO Mapper     │            │   │
│  │  └─────────┬───────────┘        └─────────┬───────────┘            │   │
│  │            │                              │                         │   │
│  │            └──────────────┬───────────────┘                         │   │
│  │                           │                                         │   │
│  │                           ▼                                         │   │
│  │              ┌─────────────────────────────┐                        │   │
│  │              │      Shared Service Layer   │                        │   │
│  │              │      (Business Logic)       │                        │   │
│  │              └─────────────────────────────┘                        │   │
│  │                           │                                         │   │
│  │                           ▼                                         │   │
│  │              ┌─────────────────────────────┐                        │   │
│  │              │      Shared Repository      │                        │   │
│  │              │      (Database)             │                        │   │
│  │              └─────────────────────────────┘                        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Version-Specific Controllers

```java
/**
 * V1 Loan Controller
 */
@RestController
@RequestMapping("/api/v1/loans")
public class LoanControllerV1 {

    private final LoanService loanService;
    private final LoanMapperV1 mapper;

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponseV1> getLoan(@PathVariable String id) {
        Loan loan = loanService.getLoan(id);
        return ResponseEntity.ok(mapper.toResponseV1(loan));
    }
}

/**
 * V2 Loan Controller (with breaking changes)
 */
@RestController
@RequestMapping("/api/v2/loans")
public class LoanControllerV2 {

    private final LoanService loanService;
    private final LoanMapperV2 mapper;

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponseV2> getLoan(@PathVariable String id) {
        Loan loan = loanService.getLoan(id);
        return ResponseEntity.ok(mapper.toResponseV2(loan));
    }
}
```

### 9.3 DTO Versioning

```java
// V1 Response (legacy)
public record LoanResponseV1(
    String id,
    String customerName,        // Combined name
    BigDecimal amount,          // Number type
    String status
) {}

// V2 Response (new)
public record LoanResponseV2(
    String id,
    String firstName,           // Split name
    String lastName,
    String amount,              // String for precision
    LoanStatusV2 status,        // Enum with more values
    String classification,      // New field
    Instant createdAt          // New field
) {}

// Mappers
@Component
public class LoanMapperV1 {
    public LoanResponseV1 toResponseV1(Loan loan) {
        return new LoanResponseV1(
            loan.getId(),
            loan.getCustomer().getFullName(),  // Combined
            loan.getAmount(),
            loan.getStatus().name()
        );
    }
}

@Component
public class LoanMapperV2 {
    public LoanResponseV2 toResponseV2(Loan loan) {
        return new LoanResponseV2(
            loan.getId(),
            loan.getCustomer().getFirstName(), // Split
            loan.getCustomer().getLastName(),
            loan.getAmount().toString(),        // String
            LoanStatusV2.fromDomain(loan.getStatus()),
            loan.getClassification().name(),    // New
            loan.getCreatedAt()                 // New
        );
    }
}
```

---

## 10. Client Communication

### 10.1 Communication Channels

| Channel | Audience | Timing |
|---------|----------|--------|
| **Developer Portal** | All developers | Immediate |
| **Email Newsletter** | Registered developers | Within 24 hours |
| **API Headers** | All API consumers | Immediate (automatic) |
| **Release Notes** | Technical teams | With release |
| **Blog Post** | General audience | Major versions |
| **Slack/Discord** | Community | Immediate |

### 10.2 Release Notes Template

```markdown
# ULMS API Release Notes - v2.0.0

**Release Date:** June 1, 2026
**Type:** Major Release (Breaking Changes)

## Highlights
- Enhanced customer data model with Bengali language support
- Improved error responses with detailed field-level errors
- New batch processing endpoints
- BRPD 15/2024 compliance updates

## Breaking Changes
⚠️ **Action Required for v1 Users**

1. **Customer name field split**
   - `customerName` → `firstName` + `lastName`

2. **Amount field type change**
   - Number → String (for precision)

3. **Status codes updated**
   - New status values added
   - Some status values renamed

## New Features
- `POST /api/v2/loans/batch` - Batch loan creation
- `GET /api/v2/customers/{id}/cib-history` - CIB history
- Bengali language fields (`nameBn`, `addressBn`)

## Deprecations
- v1 API deprecated (sunset: December 1, 2026)

## Migration Guide
See: https://docs.ulms.unisoft.com.bd/migration/v1-to-v2

## Support
- Email: api-support@unisoft.com.bd
- Documentation: https://docs.ulms.unisoft.com.bd/api/v2
```

### 10.3 Changelog Format

```markdown
# Changelog

All notable changes to the ULMS API are documented here.

## [2.0.0] - 2026-06-01
### Added
- Bengali language support for customer fields
- Batch processing endpoints
- Enhanced error responses (RFC 7807)

### Changed
- **BREAKING**: Customer name split into firstName/lastName
- **BREAKING**: Amount fields changed to string type
- Improved pagination response format

### Deprecated
- v1 API (sunset: 2026-12-01)

### Removed
- Legacy authentication endpoint

## [1.3.0] - 2026-04-15
### Added
- New classification endpoint
- Bulk document upload

### Fixed
- Rate limit header accuracy
- Pagination total count

## [1.2.0] - 2026-03-01
### Added
- CIB integration endpoints
- Workflow management APIs
```

---

## 11. Implementation Guidelines

### 11.1 Code Organization

```
src/
├── main/
│   ├── java/
│   │   └── com/unisoft/ulms/
│   │       ├── api/
│   │       │   ├── v1/                          # V1 API Layer
│   │       │   │   ├── controller/
│   │       │   │   │   ├── LoanControllerV1.java
│   │       │   │   │   └── CustomerControllerV1.java
│   │       │   │   ├── dto/
│   │       │   │   │   ├── request/
│   │       │   │   │   └── response/
│   │       │   │   └── mapper/
│   │       │   │       └── LoanMapperV1.java
│   │       │   │
│   │       │   └── v2/                          # V2 API Layer
│   │       │       ├── controller/
│   │       │       │   ├── LoanControllerV2.java
│   │       │       │   └── CustomerControllerV2.java
│   │       │       ├── dto/
│   │       │       │   ├── request/
│   │       │       │   └── response/
│   │       │       └── mapper/
│   │       │           └── LoanMapperV2.java
│   │       │
│   │       ├── service/                         # Shared Services
│   │       │   ├── LoanService.java
│   │       │   └── CustomerService.java
│   │       │
│   │       └── repository/                      # Shared Data Access
│   │           ├── LoanRepository.java
│   │           └── CustomerRepository.java
```

### 11.2 OpenAPI Documentation

```yaml
# Generate separate OpenAPI specs per version
openapi/
├── ulms-api-v1.yaml     # V1 specification
├── ulms-api-v2.yaml     # V2 specification
└── components/          # Shared components
    ├── schemas-common.yaml
    └── security.yaml
```

### 11.3 Testing Strategy

```java
/**
 * Version-specific integration tests
 */
@SpringBootTest
@AutoConfigureMockMvc
class LoanApiVersioningTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void v1_getLoan_returnsLegacyFormat() throws Exception {
        mockMvc.perform(get("/api/v1/loans/LOAN-001")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.customerName").exists())  // V1 format
            .andExpect(jsonPath("$.firstName").doesNotExist());
    }

    @Test
    void v2_getLoan_returnsNewFormat() throws Exception {
        mockMvc.perform(get("/api/v2/loans/LOAN-001")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").exists())     // V2 format
            .andExpect(jsonPath("$.lastName").exists())
            .andExpect(jsonPath("$.customerName").doesNotExist());
    }

    @Test
    void v1_deprecated_includesDeprecationHeaders() throws Exception {
        mockMvc.perform(get("/api/v1/loans/LOAN-001")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(header().exists("Deprecation"))
            .andExpect(header().exists("Sunset"));
    }
}
```

---

## 12. Governance & Compliance

### 12.1 Version Approval Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VERSION APPROVAL WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. PROPOSAL                                                                │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Developer submits API change proposal                              │   │
│  │  • Change description                                               │   │
│  │  • Breaking/non-breaking classification                             │   │
│  │  • Impact assessment                                                │   │
│  │  • Migration plan (if breaking)                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│     │                                                                       │
│     ▼                                                                       │
│  2. TECHNICAL REVIEW                                                        │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Lead Developer reviews                                             │   │
│  │  • API design compliance                                            │   │
│  │  • Version necessity                                                │   │
│  │  • Backward compatibility                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│     │                                                                       │
│     ▼                                                                       │
│  3. ARCHITECTURE REVIEW (Major Versions Only)                              │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Technical Architect reviews                                        │   │
│  │  • Architecture alignment                                           │   │
│  │  • Long-term implications                                           │   │
│  │  • Resource requirements                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│     │                                                                       │
│     ▼                                                                       │
│  4. APPROVAL & SCHEDULING                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Project Manager approves                                           │   │
│  │  • Timeline alignment                                               │   │
│  │  • Communication plan                                               │   │
│  │  • Release scheduling                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Version Support Matrix

| Version | Status | Support Level | End of Life |
|---------|--------|---------------|-------------|
| v1 | Deprecated | Bug fixes only | 2026-12-01 |
| v2 | Current | Full support | TBD |
| v3 | Planning | N/A | N/A |

### 12.3 Compliance Checklist

- [ ] API design follows standards document
- [ ] Breaking changes documented
- [ ] Migration guide prepared
- [ ] OpenAPI specification updated
- [ ] Deprecation headers implemented
- [ ] Client communication scheduled
- [ ] Release notes prepared
- [ ] Version coexistence tested
- [ ] Monitoring configured

---

## 13. Best Practices

### 13.1 Version Design Best Practices

| Practice | Description |
|----------|-------------|
| **Design for Additive** | Prefer adding fields over changing |
| **Avoid Premature Versioning** | Only version when necessary |
| **Minimize Breaking Changes** | Consolidate breaking changes |
| **Document Everything** | Clear, comprehensive docs |
| **Test Extensively** | Both versions simultaneously |
| **Monitor Usage** | Track version adoption |
| **Communicate Early** | Announce changes well in advance |

### 13.2 Common Pitfalls to Avoid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERSIONING ANTI-PATTERNS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ❌ AVOID: Too Many Versions                                                │
│     Supporting v1, v2, v3, v4 simultaneously                               │
│     → Limit to N-1 (current and previous)                                  │
│                                                                              │
│  ❌ AVOID: Breaking Changes Without Version Bump                            │
│     Changing field types in existing version                               │
│     → Always bump version for breaking changes                             │
│                                                                              │
│  ❌ AVOID: Premature Versioning                                             │
│     Creating v2 for minor changes                                          │
│     → Only version when truly breaking                                     │
│                                                                              │
│  ❌ AVOID: Silent Deprecation                                               │
│     Removing endpoints without notice                                      │
│     → Always communicate with 6-month notice                               │
│                                                                              │
│  ❌ AVOID: Inconsistent Versioning                                          │
│     Different services using different strategies                          │
│     → Standardize across all services                                      │
│                                                                              │
│  ❌ AVOID: No Migration Path                                                │
│     Forcing clients to rewrite from scratch                                │
│     → Provide clear, incremental migration guide                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.3 Summary

| Aspect | Recommendation |
|--------|----------------|
| **Versioning Method** | URL path (`/api/v1/`) |
| **Version Format** | Major only (v1, v2) |
| **Breaking Changes** | New major version required |
| **Deprecation Notice** | Minimum 6 months |
| **Supported Versions** | Current + Previous (N-1) |
| **Communication** | Multi-channel, early notice |
| **Documentation** | Comprehensive migration guides |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Developer | | | |
| Technical Architect | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - API Versioning Strategy v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides comprehensive API versioning strategy for ULMS v2.0, ensuring predictable API evolution and minimal disruption to consumers.*
