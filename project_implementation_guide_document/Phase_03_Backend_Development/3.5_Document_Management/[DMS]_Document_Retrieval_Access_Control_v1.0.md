**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Document Retrieval and Access Control |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Document Retrieval and Access Control

## Access Control Matrix

| Role | Own Documents | Branch Documents | All Documents |
|------|--------------|------------------|---------------|
| Customer | Read | - | - |
| Branch Officer | Read/Write | Read | - |
| Branch Manager | Read/Write | Read/Write | - |
| Credit Manager | Read | Read | Read |
| Admin | Read/Write | Read/Write | Read/Write |

## Implementation

```java
@Service
@RequiredArgsConstructor
public class DocumentAccessControlService {
    
    private final DocumentRepository repository;
    
    public boolean canAccess(String documentId, User user) {
        DocumentEntity doc = repository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException(documentId));
        
        // Admin can access all
        if (user.hasRole("ADMIN")) {
            return true;
        }
        
        // Check if user owns the loan
        if (doc.getUploadedBy().equals(user.getUsername())) {
            return true;
        }
        
        // Check branch access
        if (user.hasRole("BRANCH_MANAGER") && 
            isSameBranch(doc.getLoanId(), user.getBranchId())) {
            return true;
        }
        
        // Check credit role
        if (user.hasRole("CREDIT_MANAGER")) {
            return true;
        }
        
        return false;
    }
    
    public DocumentDownload download(String documentId, User user) {
        if (!canAccess(documentId, user)) {
            throw new AccessDeniedException("Access denied to document");
        }
        
        // Audit log
        auditLogService.logDownload(documentId, user);
        
        // Retrieve and decrypt
        return documentService.retrieve(documentId);
    }
}
```

## Audit Logging

```java
@Entity
@Table(name = "ulms_document_access_logs")
@Data
@Builder
public class DocumentAccessLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String documentId;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AccessType accessType;
    
    @Column(nullable = false)
    private LocalDateTime accessedAt;
    
    @Column
    private String ipAddress;
    
    @Column
    private Boolean success;
}

public enum AccessType {
    VIEW,
    DOWNLOAD,
    DELETE,
    SHARE
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
