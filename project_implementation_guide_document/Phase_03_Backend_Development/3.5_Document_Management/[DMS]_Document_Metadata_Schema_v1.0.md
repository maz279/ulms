**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Document Metadata Schema |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Document Metadata Schema

## Entity

```java
@Entity
@Table(name = "ulms_documents")
@Data
@Builder
public class DocumentEntity {
    
    @Id
    private String id;
    
    @Column(nullable = false)
    private String fileName;
    
    @Column(nullable = false)
    private String contentType;
    
    @Column(nullable = false)
    private Long size;
    
    @Column(nullable = false)
    private String encryptedKey;
    
    @Column(nullable = false)
    private String storagePath;
    
    @Column(nullable = false)
    private Long loanId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;
    
    @Column
    private String uploadedBy;
    
    @Column(nullable = false)
    private LocalDateTime uploadedAt;
    
    @Column
    private LocalDateTime expiresAt;
    
    @Version
    private Long version;
}

public enum DocumentType {
    LOAN_APPLICATION,
    ID_PROOF,
    ADDRESS_PROOF,
    INCOME_PROOF,
    BANK_STATEMENT,
    PROPERTY_DOCUMENT,
    NOMINEE_FORM,
    KYC_FORM,
    AGREEMENT,
    DISBURSEMENT_MEMO,
    OTHER
}
```

## Database Schema

```sql
CREATE TABLE ulms_documents (
    id VARCHAR(36) PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    encrypted_key TEXT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    loan_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_loan ON ulms_documents(loan_id);
CREATE INDEX idx_doc_type ON ulms_documents(document_type);
CREATE INDEX idx_doc_uploaded ON ulms_documents(uploaded_at);
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
