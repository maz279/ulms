**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Document Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
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
        <groupId>xyz.capybara</groupId>
        <artifactId>clamav-client</artifactId>
        <version>2.1.2</version>
    </dependency>
</dependencies>
```

## 2. Configuration

```yaml
ulms:
  documents:
    storage:
      type: minio
      endpoint: http://localhost:9000
      access-key: ${MINIO_ACCESS_KEY}
      secret-key: ${MINIO_SECRET_KEY}
      bucket: ulms-documents
    encryption:
      enabled: true
      master-key-path: ${MASTER_KEY_PATH}
    virus-scan:
      enabled: true
      host: localhost
      port: 3310
```

## 3. Implementation

```java
@Service
@RequiredArgsConstructor
public class DocumentService {
    
    private final MinioClient minioClient;
    private final DocumentRepository repository;
    private final DocumentEncryptionService encryptionService;
    private final VirusScanService virusScanService;
    
    public DocumentUploadResponse upload(MultipartFile file, DocumentMetadata metadata) {
        // 1. Virus scan
        ScanResult scan = virusScanService.scan(file.getBytes());
        if (!scan.isClean()) {
            throw new VirusDetectedException("Virus detected in file");
        }
        
        // 2. Generate document ID
        String documentId = UUID.randomUUID().toString();
        
        // 3. Encrypt
        EncryptedDocument encrypted = encryptionService.encrypt(
            file.getBytes(), 
            documentId
        );
        
        // 4. Store in MinIO
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket("ulms-documents")
                .object(documentId)
                .stream(new ByteArrayInputStream(encrypted.getContent()), 
                    encrypted.getContent().length, -1)
                .build()
        );
        
        // 5. Save metadata
        DocumentEntity entity = DocumentEntity.builder()
            .id(documentId)
            .fileName(file.getOriginalFilename())
            .contentType(file.getContentType())
            .size(file.getSize())
            .encryptedKey(encrypted.getEncryptedKey())
            .metadata(metadata)
            .uploadedAt(LocalDateTime.now())
            .build();
        
        repository.save(entity);
        
        return DocumentUploadResponse.builder()
            .documentId(documentId)
            .status("SUCCESS")
            .build();
    }
}
```

## 4. REST Controller

```java
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {
    
    private final DocumentService documentService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("loanId") Long loanId,
            @RequestParam("documentType") String documentType) {
        
        DocumentMetadata metadata = DocumentMetadata.builder()
            .loanId(loanId)
            .documentType(documentType)
            .build();
        
        return ResponseEntity.ok(documentService.upload(file, metadata));
    }
    
    @GetMapping("/{documentId}")
    public ResponseEntity<Resource> download(@PathVariable String documentId) {
        DocumentDownload download = documentService.download(documentId);
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(download.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + download.getFileName() + "\"")
            .body(new ByteArrayResource(download.getContent()));
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
