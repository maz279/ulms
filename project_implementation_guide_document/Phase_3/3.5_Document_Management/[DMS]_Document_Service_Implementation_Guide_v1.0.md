**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Document Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Document Service Implementation Guide

## 1. Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>io.minio</groupId>
        <artifactId>minio</artifactId>
        <version>8.5.7</version>
    </dependency>
    <dependency>
        <groupId>net.coobird</groupId>
        <artifactId>thumbnailator</artifactId>
        <version>0.4.20</version>
    </dependency>
</dependencies>
```

## 2. Configuration

```yaml
ulms:
  document:
    storage:
      type: minio
      minio:
        endpoint: http://localhost:9000
        access-key: ${MINIO_ACCESS_KEY}
        secret-key: ${MINIO_SECRET_KEY}
        bucket: ulms-documents
    upload:
      max-size: 50MB
      allowed-types: image/jpeg,image/png,application/pdf
    encryption:
      enabled: true
      key-vault: hashicorp-vault
```

## 3. Implementation

### 3.1 Document Service

```java
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {
    
    private final MinioClient minioClient;
    private final DocumentRepository documentRepository;
    private final EncryptionService encryptionService;
    
    @Value("${ulms.document.storage.minio.bucket}")
    private String bucketName;
    
    @Override
    @Transactional
    public Document uploadDocument(DocumentUploadRequest request, 
            InputStream fileStream) {
        
        // Validate
        validateFile(request.getFileName(), request.getContentType());
        
        // Generate unique ID
        String documentId = generateDocumentId();
        String storagePath = buildStoragePath(request.getLoanApplicationId(), 
            documentId, request.getFileName());
        
        // Calculate checksum
        String checksum = calculateChecksum(fileStream);
        
        // Encrypt if sensitive
        InputStream uploadStream = fileStream;
        if (isSensitiveDocument(request.getDocumentType())) {
            uploadStream = encryptionService.encrypt(fileStream);
        }
        
        // Upload to storage
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(storagePath)
                    .stream(uploadStream, request.getFileSize(), -1)
                    .contentType(request.getContentType())
                    .build()
            );
        } catch (Exception e) {
            throw new DocumentStorageException("Upload failed", e);
        }
        
        // Save metadata
        Document document = Document.builder()
            .documentId(documentId)
            .loanApplicationId(request.getLoanApplicationId())
            .documentType(request.getDocumentType())
            .fileName(request.getFileName())
            .fileSize(request.getFileSize())
            .contentType(request.getContentType())
            .storagePath(storagePath)
            .checksum(checksum)
            .encrypted(isSensitiveDocument(request.getDocumentType()))
            .uploadedBy(getCurrentUser())
            .uploadedAt(LocalDateTime.now())
            .build();
        
        return documentRepository.save(document);
    }
    
    @Override
    public InputStream downloadDocument(String documentId) {
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException(documentId));
        
        try {
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(doc.getStoragePath())
                    .build()
            );
            
            if (doc.isEncrypted()) {
                return encryptionService.decrypt(stream);
            }
            return stream;
            
        } catch (Exception e) {
            throw new DocumentStorageException("Download failed", e);
        }
    }
    
    private void validateFile(String fileName, String contentType) {
        List<String> allowedTypes = List.of("image/jpeg", "image/png", "application/pdf");
        if (!allowedTypes.contains(contentType)) {
            throw new InvalidDocumentException("File type not allowed: " + contentType);
        }
    }
    
    private String buildStoragePath(Long loanAppId, String docId, String fileName) {
        return String.format("loans/%d/%s/%s", 
            loanAppId, docId, fileName);
    }
    
    private String calculateChecksum(InputStream stream) {
        // SHA-256 implementation
    }
    
    private boolean isSensitiveDocument(DocumentType type) {
        return type == DocumentType.NID || 
               type == DocumentType.PASSPORT ||
               type == DocumentType.BANK_STATEMENT;
    }
}
```

## 4. Thumbnail Generation

```java
@Component
public class ThumbnailGenerator {
    
    public byte[] generateThumbnail(InputStream imageStream, int width, int height) 
            throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Thumbnails.of(imageStream)
            .size(width, height)
            .outputFormat("jpg")
            .toOutputStream(outputStream);
        
        return outputStream.toByteArray();
    }
}
```

---

## Appendices

### A.1 Database Schema
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    loan_application_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    checksum VARCHAR(100),
    encrypted BOOLEAN DEFAULT FALSE,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    version INTEGER DEFAULT 1
);
```
