# Frontend Testing Strategy
## ULMS v2.0 Testing Approach

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Frontend Testing Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | QA Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Testing Pyramid

```
         /\
        /  \     E2E Tests (Playwright)
       /----\        ~10%
      /      \
     /--------\   Integration Tests (RTL)
    /          \      ~30%
   /------------\
  /              \  Unit Tests (Vitest)
 /----------------\     ~60%
```

## 2. Testing Stack

| Type | Tool | Purpose |
|------|------|---------|
| Unit | Vitest | Function/component logic |
| Component | React Testing Library | Component behavior |
| E2E | Playwright | User flows |
| Visual | Storybook | UI consistency |

## 3. Test Organization

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx      # Co-located test
├── hooks/
│   └── useAuth/
│       ├── useAuth.ts
│       └── useAuth.test.ts
└── test/
    ├── setup.ts                 # Test setup
    ├── mocks/
    │   ├── server.ts            # MSW setup
    │   └── handlers.ts          # API mocks
    └── utils/
        └── renderWithProviders.tsx
```

## 4. Coverage Targets

| Category | Target |
|----------|--------|
| Statements | 70% |
| Branches | 60% |
| Functions | 70% |
| Lines | 70% |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
