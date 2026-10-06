# E2E Testing with Playwright
## ULMS v2.0 End-to-End Testing

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | E2E Testing with Playwright |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | QA Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
```

## 2. Test Example

```typescript
// e2e/loan-application.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Loan Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/dashboard');
  });

  test('create new loan application', async ({ page }) => {
    await page.click('text=Loan Origination');
    await page.click('text=New Application');
    
    // Step 1: Select Customer
    await page.fill('[name="search"]', '1234567890');
    await page.click('text=Verify');
    await page.waitForSelector('text=Customer verified');
    await page.click('text=Next');
    
    // Step 2: Product Selection
    await page.click('text=Personal Loan');
    await page.click('text=Next');
    
    // Step 3: Loan Details
    await page.fill('[name="amount"]', '500000');
    await page.selectOption('[name="tenor"]', '36');
    await page.click('text=Submit');
    
    await expect(page).toHaveURL(/\/applications\/\d+/);
  });
});
```

## 3. Best Practices

- Use data-testid for selectors
- Mock API responses when needed
- Run tests in parallel
- Record videos on failure

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
