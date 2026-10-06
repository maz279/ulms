package com.uslbd.ulms.integration.docs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.InputStream;
import java.net.URI;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

/**
 * MinIO/S3 adapter for DocumentStorePort. Credentials and endpoint are
 * environment-only (06 §1) — the adapter fails fast when absent.
 * Path-style addressing (SeaweedFS + MinIO don't do virtual-host style) and
 * the bucket is created on first use (dev convenience; prod pre-provisions).
 */
@Component
class MinioDocumentStoreAdapter implements DocumentStorePort {

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;

    MinioDocumentStoreAdapter(@Value("${ulms.minio.endpoint}") String endpoint,
                              @Value("${ulms.minio.bucket}") String bucket,
                              @Value("${ulms.minio.access-key}") String accessKey,
                              @Value("${ulms.minio.secret-key}") String secretKey) {
        if (accessKey == null || accessKey.isBlank() || secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("MINIO credentials must come from the environment");
        }
        var creds = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey));
        this.bucket = bucket;
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)              // S3-compatible stores ignore region; SDK requires one
                .credentialsProvider(creds)
                .forcePathStyle(true)                  // SeaweedFS/MinIO: no virtual-host style
                .build();
        this.presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(creds)
                .build();
        // Bucket is ensured LAZILY on first use: tests stub the port (no store
        // running), and the store may legitimately still be booting at api start.
    }

    private volatile boolean bucketReady = false;

    private void ensureBucket() {
        if (bucketReady) return;
        synchronized (this) {
            if (bucketReady) return;
            try {
                s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            } catch (NoSuchBucketException e) {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            }
            bucketReady = true;
        }
    }

    @Override
    public StoredObject put(String key, InputStream bytes, long size, String contentType) {
        try {
            ensureBucket();
            byte[] all = bytes.readAllBytes();
            s3.putObject(PutObjectRequest.builder()
                            .bucket(bucket).key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromBytes(all));
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return new StoredObject(key, HexFormat.of().formatHex(md.digest(all)), all.length);
        } catch (Exception e) {
            throw new IllegalStateException("Document store put failed for " + key, e);
        }
    }

    @Override
    public String presignedGetUrl(String key, DurationTtl ttl) {
        return presigner.presignGetObject(GetObjectPresignRequest.builder()
                        .signatureDuration(ttl.value())
                        .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                        .build())
                .url().toString();
    }
}
