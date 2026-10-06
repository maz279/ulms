**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Document Metadata Schema |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Document Metadata Schema

## 1. Core Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentId | String | Yes | Unique identifier |
| loanApplicationId | Long | Yes | Associated loan |
| documentType | Enum | Yes | Type of document |
| category | Enum | Yes | Document category |
| fileName | String | Yes | Original file name |
| fileSize | Long | Yes | Size in bytes |
| contentType | String | Yes | MIME type |
| storagePath | String | Yes | Storage location |
| checksum | String | Yes | SHA-256 hash |
| encrypted | Boolean | Yes | Encryption status |
| version | Integer | Yes | Document version |
| uploadedBy | String | Yes | Uploader user ID |
| uploadedAt | Timestamp | Yes | Upload timestamp |

## 2. Document Types

```java
public enum DocumentType {
    // KYC Documents
    NID("National ID Card", DocumentCategory.KYC),
    PASSPORT("Passport", DocumentCategory.KYC),
    BIRTH_CERTIFICATE("Birth Certificate", DocumentCategory.KYC),
    
    // Address Proof
    UTILITY_BILL("Utility Bill", DocumentCategory.ADDRESS),
    BANK_STATEMENT("Bank Statement", DocumentCategory.ADDRESS),
    RENT_AGREEMENT("Rent Agreement", DocumentCategory.ADDRESS),
    
    // Income Proof
    SALARY_SLIP("Salary Slip", DocumentCategory.INCOME),
    ITR("Income Tax Return", DocumentCategory.INCOME),
    FORM_16("Form 16", DocumentCategory.INCOME),
    
    // Application
    APPLICATION_FORM("Application Form", DocumentCategory.APPLICATION),
    DECLARATION("Declaration", DocumentCategory.APPLICATION),
    
    // Legal
    LOAN_AGREEMENT("Loan Agreement", DocumentCategory.LEGAL),
    PROMISSORY_NOTE("Promissory Note", DocumentCategory.LEGAL),
    
    // Collateral
    TITLE_DEED("Title Deed", DocumentCategory.COLLATERAL),
    VALUATION_REPORT("Valuation Report", DocumentCategory.COLLATERAL);
    
    private final String description;
    private final DocumentCategory category;
}

public enum DocumentCategory {
    KYC(7),      // 7 years retention
    ADDRESS(7),
    INCOME(7),
    APPLICATION(7),
    LEGAL(10),   // 10 years retention
    COLLATERAL(20); // Loan term + 10
    
    private final int retentionYears;
}
```

## 3. Extended Metadata

### 3.1 OCR Data

```java
@Data
public class OcrMetadata {
    private String ocrText;
    private String ocrEngine;
    private Double confidenceScore;
    private LocalDateTime processedAt;
    private Map<String, String> extractedFields;
}
```

### 3.2 Exif Data (for images)

```java
@Data
public class ExifMetadata {
    private Integer width;
    private Integer height;
    private String cameraModel;
    private LocalDateTime captureDate;
    private Double gpsLatitude;
    private Double gpsLongitude;
}
```

## 4. Database Schema

```sql
-- Core documents table
CREATE TABLE documents (
    document_id VARCHAR(50) PRIMARY KEY,
    loan_application_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    checksum VARCHAR(100) NOT NULL,
    encrypted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_loan_app (loan_application_id),
    INDEX idx_doc_type (document_type),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Document versions
CREATE TABLE document_versions (
    id BIGSERIAL PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES documents(document_id),
    version INTEGER NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    checksum VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    change_reason VARCHAR(500),
    
    UNIQUE (document_id, version)
);

-- OCR metadata
CREATE TABLE document_ocr (
    document_id VARCHAR(50) PRIMARY KEY REFERENCES documents(document_id),
    ocr_text TEXT,
    confidence_score DECIMAL(3,2),
    processed_at TIMESTAMP,
    extracted_fields JSONB
);

-- Access log
CREATE TABLE document_access_log (
    id BIGSERIAL PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    access_type VARCHAR(50) NOT NULL, -- VIEW, DOWNLOAD, DELETE
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    
    INDEX idx_document_access (document_id, accessed_at)
);
```

---

## Appendices

### A.1 JSON Example

```json
{
  "documentId": "doc-abc123",
  "loanApplicationId": 12345,
  "documentType": "NID",
  "category": "KYC",
  "fileName": "applicant_nid.pdf",
  "fileSize": 2048576,
  "contentType": "application/pdf",
  "storagePath": "loans/12345/doc-abc123/applicant_nid.pdf",
  "checksum": "sha256:a1b2c3...",
  "encrypted": true,
  "version": 1,
  "uploadedBy": "officer001",
  "uploadedAt": "2026-02-08T10:30:00",
  "ocrData": {
    "nidNumber": "1234567890",
    "name": "MOHAMMAD ALI",
    "dateOfBirth": "1990-05-15",
    "confidenceScore": 0.95
  }
}
```
