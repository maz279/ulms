# Loan Application Form Design
## ULMS v2.0 Multi-Step Loan Application

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Loan Application Form Design |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## Table of Contents

1. [Form Overview](#1-form-overview)
2. [Step-by-Step Design](#2-step-by-step-design)
3. [Product Calculator](#3-product-calculator)
4. [Document Upload](#4-document-upload)
5. [Review & Submit](#5-review--submit)
6. [Auto-Save Feature](#6-auto-save-feature)

---

## 1. Form Overview

### 1.1 Multi-Step Wizard

The loan application form uses a 5-step wizard pattern:

1. **Select Customer** - Search or create customer
2. **Select Product** - Choose loan product
3. **Loan Details** - Amount, tenor, purpose
4. **Documents** - Upload supporting documents
5. **Review & Submit** - Final review and submission

### 1.2 Form State Management

```typescript
interface LoanApplicationWizardState {
  step: number;
  completedSteps: number[];
  formData: {
    customerId: string;
    productId: string;
    amount: number;
    tenor: number;
    interestRate: number;
    purpose: string;
    documents: Document[];
  };
  draftId?: string;
}
```

---

## 2. Step-by-Step Design

### Step 1: Customer Selection

```typescript
// CustomerSelectionStep.tsx
export function CustomerSelectionStep(): React.ReactElement {
  const { control, setValue } = useFormContext();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: customers } = useSearchCustomersQuery(searchQuery);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Customer
      </Typography>
      
      <TextField
        fullWidth
        placeholder="Search by NID, name, or mobile"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <Search />,
        }}
      />

      {customers?.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onSelect={() => setValue('customerId', customer.id)}
          selected={selectedCustomerId === customer.id}
        />
      ))}

      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={() => navigate('/app/los/customers/new')}
      >
        Create New Customer
      </Button>
    </Box>
  );
}
```

### Step 2: Product Selection

```typescript
// ProductSelectionStep.tsx
export function ProductSelectionStep(): React.ReactElement {
  const { watch, setValue } = useFormContext();
  const { data: products } = useGetLoanProductsQuery();
  const selectedProductId = watch('productId');

  return (
    <Grid container spacing={3}>
      {products?.map((product) => (
        <Grid item xs={12} md={6} key={product.id}>
          <ProductCard
            product={product}
            selected={selectedProductId === product.id}
            onClick={() => {
              setValue('productId', product.id);
              setValue('interestRate', product.defaultRate);
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
}
```

### Step 3: Loan Details

```typescript
// LoanDetailsStep.tsx
export function LoanDetailsStep(): React.ReactElement {
  const { control, watch } = useFormContext();
  const productId = watch('productId');
  const { data: product } = useGetLoanProductQuery(productId);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormCurrency
          name="amount"
          label="Loan Amount"
          min={product?.minAmount}
          max={product?.maxAmount}
        />
        <Typography variant="caption" color="text.secondary">
          Range: ৳{product?.minAmount.toLocaleString()} - ৳{product?.maxAmount.toLocaleString()}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormSelect
          name="tenor"
          label="Loan Tenor"
          options={product?.tenorOptions || []}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormInput
          name="interestRate"
          label="Interest Rate (%)"
          type="number"
          inputProps={{ min: product?.minRate, max: product?.maxRate, step: 0.1 }}
        />
      </Grid>

      <Grid item xs={12}>
        <FormInput
          name="purpose"
          label="Loan Purpose"
          multiline
          rows={3}
        />
      </Grid>

      {/* EMI Calculator */}
      <Grid item xs={12}>
        <EMICalculatorPreview />
      </Grid>
    </Grid>
  );
}
```

---

## 3. Product Calculator

```typescript
// EMICalculator.tsx
interface EMICalculatorProps {
  amount: number;
  rate: number;
  tenor: number;
}

export function EMICalculator({ amount, rate, tenor }: EMICalculatorProps): React.ReactElement {
  // EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = rate / 12 / 100;
  const emi =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
    (Math.pow(1 + monthlyRate, tenor) - 1);

  const totalPayment = emi * tenor;
  const totalInterest = totalPayment - amount;

  return (
    <Card sx={{ p: 3, bgcolor: 'primary.light' }}>
      <Typography variant="h6" gutterBottom>
        EMI Estimation
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={4}>
          <Stat value={emi} label="Monthly EMI" />
        </Grid>
        <Grid item xs={4}>
          <Stat value={totalInterest} label="Total Interest" />
        </Grid>
        <Grid item xs={4}>
          <Stat value={totalPayment} label="Total Payment" />
        </Grid>
      </Grid>
    </Card>
  );
}
```

---

## 4. Document Upload

```typescript
// DocumentsStep.tsx
const requiredDocuments = [
  { type: 'nid_front', label: 'NID Front', required: true },
  { type: 'nid_back', label: 'NID Back', required: true },
  { type: 'photo', label: 'Customer Photo', required: true },
  { type: 'income_proof', label: 'Income Proof', required: true },
  { type: 'bank_statement', label: 'Bank Statement', required: false },
];

export function DocumentsStep(): React.ReactElement {
  const { control } = useFormContext();

  return (
    <Grid container spacing={3}>
      {requiredDocuments.map((doc) => (
        <Grid item xs={12} md={6} key={doc.type}>
          <FormFileUpload
            name={`documents.${doc.type}`}
            label={`${doc.label}${doc.required ? ' *' : ''}`}
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] }}
          />
        </Grid>
      ))}
    </Grid>
  );
}
```

---

## 5. Review & Submit

```typescript
// ReviewStep.tsx
export function ReviewStep(): React.ReactElement {
  const { watch } = useFormContext();
  const formData = watch();

  return (
    <Box>
      <ReviewSection title="Customer" data={formData.customer} />
      <ReviewSection title="Product" data={formData.product} />
      <ReviewSection title="Loan Details" data={formData.loanDetails} />
      <ReviewSection title="Documents" data={formData.documents} />

      <Alert severity="info" sx={{ mt: 3 }}>
        Please review all information before submitting. Once submitted, the application
        will be sent to credit assessment.
      </Alert>
    </Box>
  );
}
```

---

## 6. Auto-Save Feature

```typescript
// useAutoSave.ts
export function useAutoSave(formData: unknown, interval = 30000) {
  const [saveDraft] = useSaveDraftMutation();

  useEffect(() => {
    const timer = setInterval(() => {
      saveDraft(formData);
    }, interval);

    return () => clearInterval(timer);
  }, [formData, interval, saveDraft]);
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
