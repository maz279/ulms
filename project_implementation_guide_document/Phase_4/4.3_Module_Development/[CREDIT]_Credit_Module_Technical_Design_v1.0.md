# Credit Module Technical Design
## ULMS v2.0 Credit Management System

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Credit Module Technical Design |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Module Overview

The Credit Module handles CIB integration, credit scoring, and risk assessment for loan applications.

### 1.1 Features

- CIB Online inquiry integration
- Automated credit scoring
- Risk assessment workflows
- Facility management
- Credit bureau report viewing

### 1.2 Module Structure

```
modules/credit/
├── components/
│   ├── CIBReportViewer/
│   ├── CreditScoreCard/
│   ├── RiskAssessmentForm/
│   └── FacilityList/
├── pages/
│   ├── CIBInquiryPage.tsx
│   ├── CreditScoringPage.tsx
│   └── RiskAssessmentPage.tsx
├── hooks/
│   ├── useCIBInquiry.ts
│   ├── useCreditScore.ts
│   └── useRiskAssessment.ts
└── services/
    └── creditApi.ts
```

---

## 2. CIB Integration

```typescript
// services/creditApi.ts - CIB endpoints
export const creditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    requestCIBInquiry: builder.mutation<CIBReport, CIBInquiryRequest>({
      query: (body) => ({
        url: '/cib/inquiry',
        method: 'POST',
        body,
      }),
    }),
    
    getCIBReport: builder.query<CIBReport, string>({
      query: (inquiryId) => `/cib/reports/${inquiryId}`,
      keepUnusedDataFor: 3600, // 1 hour cache
    }),
    
    getCIBHistory: builder.query<CIBReport[], string>({
      query: (nid) => `/cib/history/${nid}`,
    }),
  }),
});
```

---

## 3. Credit Scoring

```typescript
// hooks/useCreditScore.ts
export function useCreditScore(applicationId: string) {
  const { data, isLoading } = useGetCreditScoreQuery(applicationId);
  
  return {
    score: data?.score,
    grade: data?.grade,
    components: data?.components,
    recommendation: data?.recommendation,
    isLoading,
  };
}

// Scoring components
interface CreditScoreComponents {
  customerProfile: number;
  financialCapacity: number;
  creditHistory: number;
  collateral: number;
  industryRisk: number;
}
```

---

## 4. Risk Assessment

| Risk Grade | Score Range | Action |
|------------|-------------|--------|
| AAA | 850-1000 | Auto-approve up to limit |
| AA | 750-849 | Approve |
| A | 650-749 | Approve with conditions |
| BBB | 550-649 | Manual review |
| BB | 450-549 | Senior approval required |
| B | <450 | Reject |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
