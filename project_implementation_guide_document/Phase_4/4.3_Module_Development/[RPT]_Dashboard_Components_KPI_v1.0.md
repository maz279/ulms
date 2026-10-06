# Dashboard Components & KPI
## ULMS v2.0 Analytics Dashboard

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Dashboard Components & KPI |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. KPI Components

```typescript
// StatCard Component
interface StatCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percentage' | 'number';
  trend?: { value: number; direction: 'up' | 'down' };
  icon: React.ReactNode;
}

// Usage
<StatCard
  title="Total Disbursement"
  value={12500000}
  format="currency"
  trend={{ value: 15.3, direction: 'up' }}
  icon={<AccountBalanceWallet />}
/>
```

## 2. Chart Components

```typescript
// PortfolioChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Personal Loan', value: 400 },
  { name: 'Home Loan', value: 300 },
  { name: 'Auto Loan', value: 300 },
];

export function PortfolioChart(): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
```

## 3. KPI List

| KPI | Formula | Target |
|-----|---------|--------|
| Approval Rate | Approved / Total | > 70% |
| Avg Processing Time | Total Days / Applications | < 5 days |
| NPL Ratio | NPL / Total Portfolio | < 5% |
| Disbursement Growth | (Current - Previous) / Previous | > 10% |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
