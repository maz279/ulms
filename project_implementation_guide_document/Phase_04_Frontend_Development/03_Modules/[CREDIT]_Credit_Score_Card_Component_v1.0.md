# Credit Score Card Component

## Credit Scoring UI Component

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Credit Score Card Component |
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
2. [Score Display](#2-score-display)
3. [Factor Breakdown](#3-factor-breakdown)
4. [Implementation](#4-implementation)
5. [Related Documents](#5-related-documents)

---

## 1. Executive Summary

This document defines the Credit Score Card component for displaying credit scoring results with visual indicators and factor breakdown.

---

## 2. Score Display

### 2.1 Score Gauge Component

```typescript
// features/credit/components/CreditScoreCard/ScoreGauge.tsx
import { Box, Typography } from '@mui/material';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export function ScoreGauge({ score, maxScore = 900 }: ScoreGaugeProps) {
  const percentage = (score / maxScore) * 100;
  const color = score >= 750 ? '#4caf50' : score >= 600 ? '#ff9800' : '#f44336';

  return (
    <Box sx={{ position: 'relative', width: 150, height: 150 }}>
      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${(percentage / 100) * 283} 283`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          / {maxScore}
        </Typography>
      </Box>
    </Box>
  );
}
```

---

## 3. Factor Breakdown

### 3.1 Score Factors List

```typescript
// features/credit/components/CreditScoreCard/ScoreFactors.tsx
import { Box, Typography, LinearProgress, Chip } from '@mui/material';

interface ScoreFactor {
  name: string;
  weight: number;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface ScoreFactorsProps {
  factors: ScoreFactor[];
}

export function ScoreFactors({ factors }: ScoreFactorsProps) {
  return (
    <Box>
      {factors.map((factor) => (
        <Box key={factor.name} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{factor.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {factor.score}/100
              </Typography>
              <Chip
                label={factor.impact}
                size="small"
                color={
                  factor.impact === 'positive'
                    ? 'success'
                    : factor.impact === 'negative'
                    ? 'error'
                    : 'default'
                }
              />
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={factor.score}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  factor.score >= 80
                    ? '#4caf50'
                    : factor.score >= 60
                    ? '#ff9800'
                    : '#f44336',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Weight: {factor.weight}%
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
```

---

## 4. Implementation

### 4.1 Complete Credit Score Card

```typescript
// features/credit/components/CreditScoreCard/CreditScoreCard.tsx
import { Paper, Box, Typography, Divider } from '@mui/material';
import { ScoreGauge } from './ScoreGauge';
import { ScoreFactors } from './ScoreFactors';

interface CreditScoreCardProps {
  score: number;
  factors: ScoreFactor[];
  previousScore?: number;
  rating: string;
}

export function CreditScoreCard({
  score,
  factors,
  previousScore,
  rating,
}: CreditScoreCardProps) {
  const scoreChange = previousScore ? score - previousScore : null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Credit Score
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, my: 3 }}>
        <ScoreGauge score={score} />
        <Box>
          <Typography variant="h4">{score}</Typography>
          <Typography variant="body1" color="text.secondary">
            {rating}
          </Typography>
          {scoreChange !== null && (
            <Typography
              variant="body2"
              color={scoreChange > 0 ? 'success.main' : 'error.main'}
            >
              {scoreChange > 0 ? '+' : ''}
              {scoreChange} from last check
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Score Factors
      </Typography>
      <ScoreFactors factors={factors} />
    </Paper>
  );
}
```

---

## 5. Related Documents

| Document | Purpose |
|----------|---------|
| `[CREDIT]_Credit_Module_Technical_Design_v1.0.md` | Module overview |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
