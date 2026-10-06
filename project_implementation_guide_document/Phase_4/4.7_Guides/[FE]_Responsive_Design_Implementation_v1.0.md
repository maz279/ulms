# Responsive Design Implementation
## ULMS v2.0 Responsive Frontend

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Responsive Design Implementation |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | UI/UX Designer |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| xs | 0-639px | Mobile portrait |
| sm | 640-767px | Mobile landscape |
| md | 768-1023px | Tablet |
| lg | 1024-1279px | Desktop |
| xl | 1280px+ | Large desktop |

## 2. Responsive Patterns

```typescript
// MUI Grid responsive
<Grid container spacing={{ xs: 2, md: 3 }}>
  <Grid item xs={12} md={6} lg={4}>
    <FormInput />
  </Grid>
</Grid>

// Responsive visibility
<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  Desktop only
</Box>

// Responsive typography
<Typography sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
  Responsive text
</Typography>
```

## 3. Mobile-First Approach

- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly targets (min 44px)
- Collapsible navigation for mobile

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
