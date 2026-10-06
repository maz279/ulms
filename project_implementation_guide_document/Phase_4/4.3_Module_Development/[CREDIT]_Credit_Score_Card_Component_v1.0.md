# Credit Score Card Component
## ULMS v2.0 Credit Scoring Display

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Credit Score Card Component |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## Component

```typescript
interface CreditScoreCardProps {
  score: number;
  grade: string;
  components: ScoreComponents;
  recommendation: string;
}

export function CreditScoreCard(props: CreditScoreCardProps): React.ReactElement {
  const { score, grade, components, recommendation } = props;
  
  return (
    <Card>
      <ScoreGauge score={score} />
      <GradeBadge grade={grade} />
      <ScoreBreakdown components={components} />
      <RecommendationAlert recommendation={recommendation} />
    </Card>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
