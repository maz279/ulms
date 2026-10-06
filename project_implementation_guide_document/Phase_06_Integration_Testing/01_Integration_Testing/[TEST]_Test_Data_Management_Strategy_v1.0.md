**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Test Data Management Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | QA Lead, Unisoft Systems Limited |
| **Reviewed By** | Data Protection Officer |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | QA Lead | Initial version |

---

# Test Data Management Strategy

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Data Categories](#2-test-data-categories)
3. [Test Data Generation](#3-test-data-generation)
4. [Data Masking and Anonymization](#4-data-masking-and-anonymization)
5. [PII Handling and GDPR Compliance](#5-pii-handling-and-gdpr-compliance)
6. [Test Data Storage and Versioning](#6-test-data-storage-and-versioning)
7. [Test Data Refresh Strategy](#7-test-data-refresh-strategy)
8. [Test Data Provisioning](#8-test-data-provisioning)
9. [Data Subsetting](#9-data-subsetting)
10. [Sensitive Data Detection](#10-sensitive-data-detection)
11. [Compliance and Auditing](#11-compliance-and-auditing)
12. [Related Documents](#12-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines the comprehensive strategy for managing test data throughout the ULMS v2.0 testing lifecycle. It addresses data generation, masking, storage, and compliance requirements specific to the Bangladesh banking sector.

### 1.2 Scope

- Synthetic test data generation
- Production data masking and anonymization
- Personally Identifiable Information (PII) handling
- Bangladesh Bank data protection compliance
- Test data lifecycle management

### 1.3 Regulatory Context

| Regulation | Requirement |
|------------|-------------|
| Bangladesh Bank ICT Guidelines | Data protection in testing environments |
| Bangladesh Digital Security Act 2018 | PII protection obligations |
| Bank Company Act 1991 | Customer data confidentiality |
| IFRS-9 | Historical data retention for ECL calculations |

---

## 2. Test Data Categories

### 2.1 Data Classification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TEST DATA CLASSIFICATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   SYNTHETIC      │  │   MASKED/        │  │    GOLDEN        │          │
│  │    DATA          │  │  ANONYMIZED      │  │    DATASETS      │          │
│  │                  │  │     DATA         │  │                  │          │
│  │ • Generated      │  │ • Production     │  │ • Curated        │          │
│  │ • No PII         │  │   with PII       │  │ • Reference      │          │
│  │ • Fast creation  │  │   masked         │  │ • Regression     │          │
│  │ • Unit tests     │  │ • Integration    │  │ • Compliance     │          │
│  │ • Component      │  │ • UAT            │  │ • Versioned      │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Usage Matrix

| Data Type | Primary Use | Volume | Refresh | PII |
|-----------|-------------|--------|---------|-----|
| Synthetic | Unit/Component tests | 10,000+ records | On demand | None |
| Masked Production | Integration/UAT | 100,000+ records | Weekly | Masked |
| Golden Datasets | Regression/Compliance | 1,000 records | Per release | Synthetic |
| Edge Cases | Boundary testing | 500 records | Quarterly | Synthetic |
| Performance | Load testing | 1,000,000+ records | Monthly | Masked |

---

## 3. Test Data Generation

### 3.1 Synthetic Data Generation Framework

```java
@Component
public class SyntheticDataGenerator {
    
    private final Faker faker = new Faker(new Locale("en", "BD"));
    
    /**
     * Generate synthetic borrower profile
     */
    public Borrower generateBorrower() {
        String firstName = faker.name().firstName();
        String lastName = faker.name().lastName();
        
        return Borrower.builder()
            .id(UUID.randomUUID().toString())
            .firstName(firstName)
            .lastName(lastName)
            .fullNameEn(firstName + " " + lastName)
            .fullNameBn(generateBengaliName())
            .dateOfBirth(faker.date().birthday(21, 65))
            .nidNumber(generateValidNID())
            .mobileNumber(generateBangladeshMobile())
            .email(generateEmail(firstName, lastName))
            .address(generateBangladeshAddress())
            .occupation(faker.options().option("SERVICE", "BUSINESS", "PROFESSIONAL"))
            .monthlyIncome(BigDecimal.valueOf(faker.number().numberBetween(30000, 500000)))
            .build();
    }
    
    /**
     * Generate valid Bangladesh NID format
     * NID: 10-17 digits
     */
    public String generateValidNID() {
        int length = faker.options().option(10, 13, 17);
        StringBuilder nid = new StringBuilder();
        nid.append(faker.number().digit()); // First digit 1-9
        for (int i = 1; i < length; i++) {
            nid.append(faker.number().digit());
        }
        return nid.toString();
    }
    
    /**
     * Generate Bangladesh mobile number
     */
    public String generateBangladeshMobile() {
        String[] prefixes = {"013", "014", "015", "016", "017", "018", "019"};
        String prefix = faker.options().option(prefixes);
        return prefix + faker.number().digits(8);
    }
    
    /**
     * Generate Bangladesh address
     */
    public Address generateBangladeshAddress() {
        String[] districts = {"Dhaka", "Chittagong", "Khulna", "Rajshahi", 
                              "Barisal", "Sylhet", "Rangpur", "Mymensingh"};
        String[] thanas = {"Gulshan", "Dhanmondi", "Banani", "Mohammadpur",
                           "Kotwali", "Panchlaish", "Sadar", "Double Mooring"};
        
        return Address.builder()
            .addressLine1(faker.address().streetAddress())
            .addressLine2(faker.address().secondaryAddress())
            .thana(faker.options().option(thanas))
            .district(faker.options().option(districts))
            .postalCode(faker.number().numberBetween(1000, 9999))
            .country("Bangladesh")
            .build();
    }
    
    private String generateBengaliName() {
        // Use synthetic Bengali names (not real persons)
        String[] firstNames = {"আহমেদ", "মোহাম্মদ", "সালাম", "করিম", "রহিম"};
        String[] lastNames = {"হোসেন", "আলী", "খান", "আহমেদ", "মিয়া"};
        return faker.options().option(firstNames) + " " + faker.options().option(lastNames);
    }
    
    private String generateEmail(String firstName, String lastName) {
        String[] domains = {"testmail.com", "example.org", "ulms.test", "test.bd"};
        return (firstName + "." + lastName + "@" + faker.options().option(domains))
            .toLowerCase();
    }
}
```

### 3.2 Loan Application Data Generator

```java
@Component
public class LoanDataGenerator {
    
    @Autowired
    private SyntheticDataGenerator borrowerGenerator;
    
    private final Faker faker = new Faker();
    
    public LoanApplication generateLoanApplication() {
        Borrower borrower = borrowerGenerator.generateBorrower();
        BigDecimal amount = generateLoanAmount();
        int tenure = generateTenure();
        
        return LoanApplication.builder()
            .id("LOAN-" + faker.number().digits(8))
            .borrower(borrower)
            .loanAmount(amount)
            .loanPurpose(faker.options().option(
                "BUSINESS_EXPANSION",
                "WORKING_CAPITAL",
                "MACHINERY_PURCHASE",
                "PROPERTY_PURCHASE",
                "PERSONAL_LOAN"
            ))
            .tenureMonths(tenure)
            .interestRate(generateInterestRate())
            .emiAmount(calculateEMI(amount, tenure))
            .applicationDate(LocalDateTime.now())
            .status(ApplicationStatus.DRAFT)
            .collateral(generateCollateral(amount))
            .guarantors(generateGuarantors(faker.number().numberBetween(0, 2)))
            .build();
    }
    
    private BigDecimal generateLoanAmount() {
        // Loan amounts in BDT (50,000 to 5,00,00,000)
        return BigDecimal.valueOf(faker.number().numberBetween(50000, 50000000));
    }
    
    private int generateTenure() {
        // Loan tenure in months (12 to 240 months)
        return faker.options().option(12, 24, 36, 48, 60, 120, 180, 240);
    }
    
    private BigDecimal generateInterestRate() {
        // Interest rates (9% to 18%)
        return BigDecimal.valueOf(faker.number().randomDouble(2, 9, 18));
    }
    
    private BigDecimal calculateEMI(BigDecimal principal, int months) {
        BigDecimal monthlyRate = new BigDecimal("0.12").divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = onePlusR.pow(months);
        
        return principal.multiply(monthlyRate).multiply(power)
            .divide(power.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
    }
    
    private Collateral generateCollateral(BigDecimal loanAmount) {
        return Collateral.builder()
            .type(faker.options().option("IMMOVABLE_PROPERTY", "MOVABLE_ASSET", "FINANCIAL_INSTRUMENT", "GUARANTEE"))
            .description(faker.lorem().sentence())
            .estimatedValue(loanAmount.multiply(new BigDecimal("1.5")))
            .valuationDate(LocalDate.now())
            .build();
    }
    
    private List<Guarantor> generateGuarantors(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> Guarantor.builder()
                .name(faker.name().fullName())
                .nid(borrowerGenerator.generateValidNID())
                .mobile(borrowerGenerator.generateBangladeshMobile())
                .relationship(faker.options().option("SPOUSE", "PARENT", "SIBLING", "BUSINESS_PARTNER"))
                .build())
            .collect(Collectors.toList());
    }
}
```

### 3.3 CIB Report Data Generator

```java
@Component
public class CIBDataGenerator {
    
    private final Faker faker = new Faker();
    
    public CIBReport generateCIBReport(String nid) {
        int score = faker.number().numberBetween(300, 900);
        
        return CIBReport.builder()
            .cibId("CIB-" + nid)
            .nid(nid)
            .score(score)
            .classification(determineClassification(score))
            .totalOutstanding(BigDecimal.valueOf(faker.number().randomDouble(2, 0, 50000000)))
            .totalEMI(BigDecimal.valueOf(faker.number().randomDouble(2, 0, 500000)))
            .totalMonthlyInstallment(BigDecimal.valueOf(faker.number().randomDouble(2, 0, 300000)))
            .numActiveLoans(faker.number().numberBetween(0, 10))
            .numClosedLoans(faker.number().numberBetween(0, 20))
            .worstClassificationIn12Months(generateClassificationHistory())
            .defaultHistory(generateDefaultHistory())
            .inquiryDate(LocalDateTime.now())
            .reportExpiryDate(LocalDate.now().plusMonths(1))
            .status("SUCCESS")
            .build();
    }
    
    private String determineClassification(int score) {
        if (score >= 750) return "STANDARD";
        if (score >= 700) return "SMA";
        if (score >= 650) return "SUBSTANDARD";
        if (score >= 550) return "DOUBTFUL";
        return "BAD_LOSS";
    }
    
    private List<ClassificationHistory> generateClassificationHistory() {
        return IntStream.range(0, 12)
            .mapToObj(i -> ClassificationHistory.builder()
                .month(LocalDate.now().minusMonths(i).toString())
                .classification(faker.options().option("STD-0", "STD-1", "STD-2", "SMA", "SS", "DF", "BL"))
                .build())
            .collect(Collectors.toList());
    }
    
    private DefaultHistory generateDefaultHistory() {
        return DefaultHistory.builder()
            .hasDefault(faker.bool().bool())
            .defaultAmount(BigDecimal.valueOf(faker.number().randomDouble(2, 0, 1000000)))
            .defaultDate(faker.bool().bool() ? LocalDate.now().minusYears(faker.number().numberBetween(1, 5)) : null)
            .settlementStatus(faker.options().option("SETTLED", "PENDING", "WRITTEN_OFF", null))
            .build();
    }
}
```

---

## 4. Data Masking and Anonymization

### 4.1 Masking Rules

| Field | Original | Masked | Technique |
|-------|----------|--------|-----------|
| NID | 1234567890123 | *********0123 | Partial masking |
| Mobile | 01712345678 | 017****5678 | Partial masking |
| Email | user@email.com | u***@email.com | Partial masking |
| Name | Md. John Doe | M*. J*** D** | Partial masking |
| Bank Account | 1200123456789 | 1200******789 | Partial masking |
| Address | 123 Gulshan Ave | *** [Thana], Dhaka | Generalization |

### 4.2 Data Masking Implementation

```java
@Component
public class DataMaskingService {
    
    /**
     * Mask NID - show last 4 digits only
     */
    public String maskNID(String nid) {
        if (nid == null || nid.length() < 4) return "****";
        return "*".repeat(nid.length() - 4) + nid.substring(nid.length() - 4);
    }
    
    /**
     * Mask mobile number - show first 3 and last 3 digits
     */
    public String maskMobile(String mobile) {
        if (mobile == null || mobile.length() < 6) return "****";
        return mobile.substring(0, 3) + "****" + mobile.substring(mobile.length() - 3);
    }
    
    /**
     * Mask email - show first char and domain
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "****";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        
        if (local.length() <= 2) {
            return "*@" + domain;
        }
        return local.charAt(0) + "***@" + domain;
    }
    
    /**
     * Mask name - show first letter of each part
     */
    public String maskName(String name) {
        if (name == null) return "****";
        return Arrays.stream(name.split(" "))
            .map(part -> part.length() > 0 ? part.charAt(0) + "*".repeat(Math.min(part.length() - 1, 3)) : "")
            .collect(Collectors.joining(" "));
    }
    
    /**
     * Mask bank account - show first 4 and last 3 digits
     */
    public String maskAccount(String account) {
        if (account == null || account.length() < 7) return "****";
        return account.substring(0, 4) + "*".repeat(account.length() - 7) + account.substring(account.length() - 3);
    }
    
    /**
     * Generalize address to district level only
     */
    public String generalizeAddress(Address address) {
        if (address == null) return "Unknown";
        return address.getDistrict() + ", Bangladesh";
    }
    
    /**
     * Anonymize borrower for testing
     */
    public Borrower anonymizeBorrower(Borrower borrower) {
        return borrower.toBuilder()
            .nidNumber(maskNID(borrower.getNidNumber()))
            .mobileNumber(maskMobile(borrower.getMobileNumber()))
            .email(maskEmail(borrower.getEmail()))
            .fullNameEn(maskName(borrower.getFullNameEn()))
            .address(generalizeAddress(borrower.getAddress()))
            .build();
    }
}
```

### 4.3 Production Data Anonymization Pipeline

```java
@Component
public class ProductionDataAnonymizer {
    
    @Autowired
    private DataMaskingService maskingService;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Anonymize production data for testing
     */
    public void anonymizeProductionData(String sourceSchema, String targetSchema) {
        // 1. Create target schema
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + targetSchema);
        
        // 2. Copy tables structure
        copySchemaStructure(sourceSchema, targetSchema);
        
        // 3. Copy and anonymize data
        anonymizeTable(sourceSchema, targetSchema, "borrowers", this::anonymizeBorrowerRow);
        anonymizeTable(sourceSchema, targetSchema, "loan_applications", this::anonymizeLoanRow);
        anonymizeTable(sourceSchema, targetSchema, "transactions", this::anonymizeTransactionRow);
        
        // 4. Remove sensitive audit data
        removeAuditData(targetSchema);
        
        // 5. Add watermark
        addWatermark(targetSchema);
    }
    
    private void anonymizeBorrowerRow(Map<String, Object> row) {
        row.put("nid_number", maskNID((String) row.get("nid_number")));
        row.put("mobile_number", maskMobile((String) row.get("mobile_number")));
        row.put("email", maskEmail((String) row.get("email")));
        row.put("full_name", maskName((String) row.get("full_name")));
        row.put("address_details", "[MASKED]");
    }
    
    private void addWatermark(String schema) {
        jdbcTemplate.execute(
            "ALTER TABLE " + schema + ".borrowers " +
            "ADD COLUMN data_source VARCHAR(50) DEFAULT 'ANONYMIZED_'" + 
            LocalDate.now().toString()
        );
    }
}
```

---

## 5. PII Handling and GDPR Compliance

### 5.1 PII Classification

| Category | Fields | Handling |
|----------|--------|----------|
| **Critical PII** | NID, biometric data, financial account numbers | Never in test environments |
| **Sensitive PII** | Mobile, email, full address | Always masked/anonymized |
| **Personal Data** | Name, DOB, occupation | Masked or synthetic |
| **Financial Data** | Income, account balances | Anonymized or synthetic |

### 5.2 GDPR Compliance Checklist

```markdown
## Data Protection Compliance Checklist

### Collection and Processing
- [ ] Test data collected only for specified testing purposes
- [ ] No production PII used without explicit anonymization
- [ ] Data minimization principle applied
- [ ] Consent documented for any real data usage

### Storage and Security
- [ ] Test data stored in secure, access-controlled environments
- [ ] Encryption at rest for sensitive test datasets
- [ ] No test data in public repositories
- [ ] Secrets/credentials never committed to version control

### Retention and Disposal
- [ ] Data retention period defined (max 90 days for masked data)
- [ ] Automated purging of old test data
- [ ] Secure disposal procedures documented
- [ ] Audit trail of data deletion maintained

### Access Control
- [ ] Role-based access to test data
- [ ] Access logging enabled
- [ ] Regular access reviews conducted
- [ ] Principle of least privilege enforced
```

### 5.3 PII Detection Scanner

```java
@Component
public class PIIDetector {
    
    private final List<Pattern> piiPatterns = Arrays.asList(
        // Bangladesh NID patterns
        Pattern.compile("\\b\\d{10,17}\\b"), // Generic NID
        
        // Mobile patterns
        Pattern.compile("\\b01[3-9]\\d{8}\\b"), // Bangladesh mobile
        
        // Email pattern
        Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"),
        
        // Bank account patterns
        Pattern.compile("\\b1200\\d{9}\\b"), // Common Bangladesh account format
        
        // Credit card (should never be in ULMS, but check anyway)
        Pattern.compile("\\b\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?\\d{4}\\b")
    );
    
    public PIIScanResult scanForPII(String content) {
        List<PIIFinding> findings = new ArrayList<>();
        
        for (Pattern pattern : piiPatterns) {
            Matcher matcher = pattern.matcher(content);
            while (matcher.find()) {
                findings.add(new PIIFinding(
                    matcher.group(),
                    matcher.start(),
                    matcher.end(),
                    classifyPIIType(matcher.group())
                ));
            }
        }
        
        return new PIIScanResult(findings, !findings.isEmpty());
    }
    
    private String classifyPIIType(String value) {
        if (value.matches("01[3-9]\\d{8}")) return "MOBILE_NUMBER";
        if (value.matches("\\d{10,17}") && value.length() >= 10) return "NID";
        if (value.contains("@")) return "EMAIL";
        if (value.startsWith("1200")) return "BANK_ACCOUNT";
        return "UNKNOWN";
    }
    
    /**
     * Scan database table for PII
     */
    public void scanDatabaseTable(String tableName) {
        List<String> textColumns = getTextColumns(tableName);
        
        for (String column : textColumns) {
            String sql = "SELECT " + column + " FROM " + tableName + " WHERE " + column + " IS NOT NULL LIMIT 1000";
            List<String> values = jdbcTemplate.queryForList(sql, String.class);
            
            for (String value : values) {
                PIIScanResult result = scanForPII(value);
                if (result.hasPII()) {
                    log.warn("PII detected in {}.{}", tableName, column);
                    reportFinding(tableName, column, result);
                }
            }
        }
    }
}
```

---

## 6. Test Data Storage and Versioning

### 6.1 Storage Strategy

| Data Type | Storage | Retention | Backup |
|-----------|---------|-----------|--------|
| Synthetic datasets | Git LFS + S3 | Permanent | Version controlled |
| Masked production | Secure S3 bucket | 90 days | Daily snapshots |
| Performance data | Dedicated test DB | 30 days | Weekly |
| Golden datasets | Git repository | Permanent | Git history |

### 6.2 Test Data Repository Structure

```
test-data/
├── README.md
├── synthetic/
│   ├── borrowers/
│   │   ├── borrowers_100.json
│   │   ├── borrowers_1000.json
│   │   └── borrowers_10000.json
│   ├── loans/
│   ├── cib-reports/
│   └── transactions/
├── golden/
│   ├── regression-suite/
│   ├── compliance-suite/
│   └── edge-cases/
├── masked/
│   ├── 2024-02-01/          # Date-based snapshots
│   ├── 2024-02-08/
│   └── latest -> 2024-02-08/
├── schemas/
│   ├── borrower.schema.json
│   ├── loan.schema.json
│   └── cib-report.schema.json
└── generators/
    ├── borrower-generator.yml
    └── loan-generator.yml
```

### 6.3 Version Control for Test Data

```yaml
# test-data/.gitattributes
*.json filter=lfs diff=lfs merge=lfs -text
*.csv filter=lfs diff=lfs merge=lfs -text
*.sql filter=lfs diff=lfs merge=lfs -text

# Track only metadata in git, data in LFS
test-data/synthetic/**/metadata.yml text
test-data/synthetic/**/*.json filter=lfs
```

---

## 7. Test Data Refresh Strategy

### 7.1 Refresh Schedule

| Environment | Data Source | Refresh Frequency | Trigger |
|-------------|-------------|-------------------|---------|
| Local Dev | Synthetic | On demand | Developer request |
| CI/CD | Synthetic | Per pipeline run | Git commit |
| Test | Masked prod | Weekly | Sunday 02:00 AM |
| Staging | Masked prod | Per release | Release deployment |
| UAT | Production clone | Per release | 2 days before UAT |
| Performance | Masked prod | Monthly | 1st of month |

### 7.2 Automated Refresh Pipeline

```yaml
# .github/workflows/test-data-refresh.yml
name: Test Data Refresh

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday 2 AM
  workflow_dispatch:

jobs:
  refresh-test-data:
    runs-on: ubuntu-latest
    environment: test-data-refresh
    
    steps:
      - name: Anonymize Production Data
        run: |
          ./scripts/anonymize-prod-data.sh \
            --source prod-read-replica \
            --target test-data-warehouse \
            --masking-config config/masking-rules.yml
      
      - name: Generate Synthetic Datasets
        run: |
          ./scripts/generate-synthetic-data.sh \
            --count 100000 \
            --output test-data/synthetic/latest/
      
      - name: Validate Data Quality
        run: |
          ./scripts/validate-test-data.sh \
            --data-dir test-data/ \
            --schema-dir test-data/schemas/
      
      - name: Upload to S3
        run: |
          aws s3 sync test-data/ s3://ulms-test-data/
      
      - name: Notify Team
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Test data refresh completed"}'
```

---

## 8. Test Data Provisioning

### 8.1 Self-Service Data Portal

```java
@RestController
@RequestMapping("/api/test-data")
public class TestDataController {
    
    @PostMapping("/provision")
    public ResponseEntity<ProvisionResponse> provisionData(
            @RequestBody ProvisionRequest request) {
        
        // Validate request
        validateRequest(request);
        
        // Generate or fetch data
        TestDataset dataset = switch (request.getDataType()) {
            case SYNTHETIC -> syntheticDataService.generate(request);
            case MASKED -> maskedDataService.fetch(request);
            case GOLDEN -> goldenDataService.get(request);
        };
        
        // Apply any custom transformations
        if (request.getTransformations() != null) {
            dataset = applyTransformations(dataset, request.getTransformations());
        }
        
        // Track provisioning for audit
        auditLog.info("Test data provisioned: {}, by: {}, env: {}",
            dataset.getId(), getCurrentUser(), request.getTargetEnvironment());
        
        return ResponseEntity.ok(new ProvisionResponse(dataset));
    }
}
```

### 8.2 Data Provisioning Request Format

```json
{
  "dataType": "SYNTHETIC",
  "entity": "BORROWER",
  "count": 1000,
  "targetEnvironment": "TEST",
  "schema": {
    "includeFields": ["nid", "name", "mobile", "address"],
    "excludeFields": ["biometric_data"]
  },
  "constraints": {
    "loanAmountMin": 50000,
    "loanAmountMax": 5000000,
    "districts": ["Dhaka", "Chittagong"]
  },
  "transformations": {
    "maskEmail": true,
    "generalizeAddress": true
  },
  "retentionDays": 30
}
```

---

## 9. Data Subsetting

### 9.1 Subsetting Strategy

| Use Case | Source Data | Subset Criteria | Size |
|----------|-------------|-----------------|------|
| Feature testing | Full prod | Specific loan types | 10% |
| Regression testing | Full prod | Critical path data | 5% |
| Performance testing | Full prod | Representative distribution | 50% |
| Compliance testing | Full prod | Last 7 years | 30% |

### 9.2 Subset Extraction

```sql
-- Extract subset for integration testing
WITH subset AS (
  SELECT *
  FROM production.loan_applications
  WHERE 
    -- Include various loan types
    loan_type IN ('SME', 'RETAIL', 'CORPORATE')
    -- Include different statuses
    AND status IN ('APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED')
    -- Stratified sampling by amount
    AND (
      (loan_amount < 500000 AND random() < 0.3)
      OR (loan_amount BETWEEN 500000 AND 2000000 AND random() < 0.5)
      OR (loan_amount > 2000000 AND random() < 0.8)
    )
    -- Recent data priority
    AND created_date > CURRENT_DATE - INTERVAL '2 years'
  ORDER BY random()
  LIMIT 100000
)
SELECT * INTO test.loan_applications FROM subset;

-- Extract related entities maintaining referential integrity
INSERT INTO test.borrowers
SELECT DISTINCT b.* 
FROM production.borrowers b
JOIN test.loan_applications l ON b.id = l.borrower_id;
```

---

## 10. Sensitive Data Detection

### 10.1 Automated Scanning

```bash
#!/bin/bash
# scan-for-sensitive-data.sh

echo "Scanning for sensitive data in test environments..."

# Scan database
docker run --rm \
  -e DB_CONNECTION_STRING="$TEST_DB_URL" \
  -v $(pwd)/pii-patterns.yml:/app/patterns.yml \
  ulms/pii-scanner:latest \
  --scan-database \
  --patterns /app/patterns.yml \
  --output /app/results/db-scan.json

# Scan files
find test-data/ -type f \( -name "*.json" -o -name "*.csv" -o -name "*.sql" \) \
  -exec ulms/pii-scanner:latest --scan-file {} \;

# Scan code for hardcoded data
grep -r -E "(01[3-9][0-9]{8}|\\d{13}|1200[0-9]{9})" \
  --include="*.java" --include="*.sql" --include="*.yml" \
  src/ || echo "No hardcoded sensitive data found"
```

### 10.2 Detection Patterns

```yaml
# pii-patterns.yml
patterns:
  - name: BANGLADESH_NID
    pattern: "\\b\\d{10,17}\\b"
    confidence: high
    description: "Bangladesh National ID Number"
    
  - name: BANGLADESH_MOBILE
    pattern: "\\b01[3-9]\\d{8}\\b"
    confidence: high
    description: "Bangladesh Mobile Number"
    
  - name: BANK_ACCOUNT
    pattern: "\\b1200\\d{9}\\b"
    confidence: medium
    description: "Bangladesh Bank Account"
    
  - name: EMAIL_ADDRESS
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    confidence: high
    description: "Email Address"
    
  - name: CREDIT_CARD
    pattern: "\\b\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?\\d{4}\\b"
    confidence: critical
    description: "Credit Card Number"
```

---

## 11. Compliance and Auditing

### 11.1 Audit Requirements

| Event | Data Captured | Retention |
|-------|---------------|-----------|
| Data generation | Timestamp, generator, parameters, volume | 2 years |
| Data access | User, timestamp, data type, purpose | 5 years |
| Data export | User, timestamp, recipient, data volume | 7 years |
| Masking operation | Source, target, masking rules applied | 2 years |
| Data deletion | User, timestamp, data identifiers | 7 years |

### 11.2 Audit Trail Implementation

```java
@Entity
@Table(name = "test_data_audit_log")
public class TestDataAuditLog {
    
    @Id
    @GeneratedValue
    private Long id;
    
    @Enumerated(EnumType.STRING)
    private AuditEventType eventType;
    
    private String userId;
    private String userRole;
    private LocalDateTime timestamp;
    
    private String dataType;
    private Long recordCount;
    private String environment;
    
    private String purpose;
    private String ipAddress;
    private String userAgent;
    
    @Column(columnDefinition = "TEXT")
    private String details; // JSON with additional context
}

@Aspect
@Component
public class TestDataAuditAspect {
    
    @Around("@annotation(Audited)")
    public Object auditTestDataOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        AuditEventType eventType = extractEventType(joinPoint);
        String userId = getCurrentUserId();
        
        try {
            Object result = joinPoint.proceed();
            logAuditEvent(eventType, userId, AuditStatus.SUCCESS, null);
            return result;
        } catch (Exception e) {
            logAuditEvent(eventType, userId, AuditStatus.FAILURE, e.getMessage());
            throw e;
        }
    }
}
```

---

## 12. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Master_Test_Strategy_Document_v1.0.md` | Overall testing approach |
| `[TEST]_Integration_Test_Plan_v1.0.md` | Integration testing details |
| `../Technology_Stack_Recommendation_v2.md` | Data storage technologies |

---

**Document Owner:** QA Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
