**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Document Retrieval and Access Control |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Document Retrieval and Access Control

## 1. Access Control Model

### 1.1 Role-Based Permissions

| Role | View | Download | Upload | Delete |
|------|------|----------|--------|--------|
| CUSTOMER | Own | Own | Own | - |
| BRANCH_OFFICER | Branch | Branch | Branch | - |
| CREDIT_ANALYST | All | All | All | - |
| BRANCH_MANAGER | All | All | All | Branch |
| ADMIN | All | All | All | All |
| AUDITOR | All | All | - | - |

### 1.2 Document-Level Permissions

```java
@Entity
@Table(name = "document_permissions")
@Data
public class DocumentPermission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "document_id", nullable = false)
    private String documentId;
    
    @Column(name = "principal_id", nullable = false)
    private String principalId; // user or role
    
    @Column(name = "principal_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private PrincipalType principalType;
    
    @ElementCollection
    @CollectionTable(name = "document_permission_actions")
    @Enumerated(EnumType.STRING)
    private Set<PermissionAction> actions;
}

public enum PrincipalType {
    USER,
    ROLE,
    GROUP
}

public enum PermissionAction {
    VIEW,
    DOWNLOAD,
    UPLOAD,
    DELETE,
    SHARE
}
```

## 2. Access Control Implementation

```java
@Component
@RequiredArgsConstructor
public class DocumentAccessControlService {
    
    private final DocumentPermissionRepository permissionRepository;
    private final DocumentRepository documentRepository;
    
    public boolean hasPermission(String documentId, String userId, 
            PermissionAction action) {
        
        // Check if user is document owner
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException(documentId));
        
        if (doc.getUploadedBy().equals(userId)) {
            return true;
        }
        
        // Check specific permissions
        Set<String> userRoles = getUserRoles(userId);
        
        List<DocumentPermission> permissions = permissionRepository
            .findByDocumentId(documentId);
        
        for (DocumentPermission perm : permissions) {
            boolean principalMatches = 
                (perm.getPrincipalType() == PrincipalType.USER && 
                 perm.getPrincipalId().equals(userId)) ||
                (perm.getPrincipalType() == PrincipalType.ROLE && 
                 userRoles.contains(perm.getPrincipalId()));
            
            if (principalMatches && perm.getActions().contains(action)) {
                return true;
            }
        }
        
        // Check role-based default permissions
        return checkDefaultPermission(userId, doc, action);
    }
    
    private boolean checkDefaultPermission(String userId, Document doc, 
            PermissionAction action) {
        Set<String> roles = getUserRoles(userId);
        
        if (roles.contains("ADMIN")) return true;
        if (roles.contains("AUDITOR") && action == PermissionAction.VIEW) return true;
        
        if (roles.contains("BRANCH_OFFICER")) {
            // Check if document belongs to same branch
            return isSameBranch(userId, doc.getLoanApplicationId());
        }
        
        return false;
    }
    
    public void grantPermission(String documentId, String principalId, 
            PrincipalType type, Set<PermissionAction> actions) {
        DocumentPermission permission = DocumentPermission.builder()
            .documentId(documentId)
            .principalId(principalId)
            .principalType(type)
            .actions(actions)
            .build();
        
        permissionRepository.save(permission);
        
        auditLog.info("Permission granted: document={}, principal={}, actions={}",
            documentId, principalId, actions);
    }
}
```

## 3. Secure Retrieval

### 3.1 Presigned URLs

```java
@Service
@RequiredArgsConstructor
public class SecureDocumentRetrievalService {
    
    private final MinioClient minioClient;
    private final DocumentAccessControlService accessControl;
    
    public PresignedUrlResponse generatePresignedUrl(String documentId, 
            String userId, Duration expiry) {
        
        // Check permission
        if (!accessControl.hasPermission(documentId, userId, PermissionAction.DOWNLOAD)) {
            throw new AccessDeniedException("Access denied");
        }
        
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException(documentId));
        
        try {
            String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket("ulms-documents")
                    .object(doc.getStoragePath())
                    .expiry((int) expiry.getSeconds())
                    .build()
            );
            
            // Log access
            auditLogAccess(documentId, userId, "GENERATE_URL");
            
            return PresignedUrlResponse.builder()
                .url(url)
                .expiresAt(LocalDateTime.now().plus(expiry))
                .documentId(documentId)
                .build();
                
        } catch (Exception e) {
            throw new DocumentRetrievalException("Failed to generate URL", e);
        }
    }
    
    public StreamingResponseBody streamDocument(String documentId, String userId) {
        // Check permission
        if (!accessControl.hasPermission(documentId, userId, PermissionAction.VIEW)) {
            throw new AccessDeniedException("Access denied");
        }
        
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException(documentId));
        
        auditLogAccess(documentId, userId, "STREAM");
        
        return outputStream -> {
            try (InputStream is = downloadFromStorage(doc)) {
                if (doc.isEncrypted()) {
                    is = decryptStream(is);
                }
                StreamUtils.copy(is, outputStream);
            }
        };
    }
    
    private void auditLogAccess(String documentId, String userId, String action) {
        DocumentAccessLog log = DocumentAccessLog.builder()
            .documentId(documentId)
            .userId(userId)
            .accessType(action)
            .accessedAt(LocalDateTime.now())
            .ipAddress(RequestContext.getCurrentIp())
            .build();
        
        accessLogRepository.save(log);
    }
}
```

## 4. Watermarking

```java
@Component
public class DocumentWatermarkService {
    
    public byte[] addWatermark(byte[] pdfBytes, String watermarkText) {
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            
            for (PDPage page : document.getPages()) {
                PDPageContentStream contentStream = new PDPageContentStream(
                    document, page, PDPageContentStream.AppendMode.APPEND, true);
                
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 50);
                contentStream.setNonStrokingColor(200, 200, 200);
                
                // Center watermark
                PDRectangle pageSize = page.getMediaBox();
                float x = pageSize.getWidth() / 3;
                float y = pageSize.getHeight() / 2;
                
                contentStream.beginText();
                contentStream.newLineAtOffset(x, y);
                contentStream.showText(watermarkText);
                contentStream.endText();
                
                contentStream.close();
            }
            
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.save(output);
            return output.toByteArray();
            
        } catch (IOException e) {
            throw new WatermarkException("Failed to add watermark", e);
        }
    }
}
```

---

## Appendices

### A.1 Access Log Retention

| Log Type | Retention |
|----------|-----------|
| Access logs | 7 years |
| Permission changes | 10 years |
| Failed access attempts | 2 years |
