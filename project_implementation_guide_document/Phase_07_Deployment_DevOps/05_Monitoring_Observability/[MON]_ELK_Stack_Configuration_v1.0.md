# ELK Stack Configuration

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | ELK Stack Configuration |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | DevOps Team |
| **Classification** | Internal |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Elasticsearch Config](#2-elasticsearch-config)
3. [Logstash Pipeline](#3-logstash-pipeline)
4. [Kibana Setup](#4-kibana-setup)
5. [Index Templates](#5-index-templates)
6. [Security Config](#6-security-config)
7. [Backup](#7-backup)

---

## 1. Overview

Complete ELK stack configuration for ULMS logging infrastructure.

---

## 2. Elasticsearch Config

```yaml
# elasticsearch-values.yaml
clusterName: ulms-elasticsearch
nodeGroup: master

replicas: 3
minimumMasterNodes: 2

resources:
  requests:
    cpu: 1000m
    memory: 4Gi
  limits:
    cpu: 2000m
    memory: 8Gi

persistence:
  enabled: true
  storageClass: gp3-encrypted
  size: 100Gi

esConfig:
  elasticsearch.yml: |
    xpack.security.enabled: true
    xpack.security.transport.ssl.enabled: true
    xpack.security.transport.ssl.verification_mode: certificate
    xpack.security.transport.ssl.keystore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
    xpack.security.transport.ssl.truststore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
    
    indices.lifecycle.poll_interval: 10m
    indices.lifecycle.management.enabled: true
```

---

## 3. Logstash Pipeline

```yaml
# logstash-values.yaml
logstashPipeline:
  ulms-pipeline.conf: |
    input {
      beats {
        port => 5044
      }
    }
    
    filter {
      if [kubernetes][namespace_name] == "ulms-production" {
        json {
          source => "message"
          target => "parsed"
        }
        
        date {
          match => [ "[parsed][timestamp]", "ISO8601" ]
        }
        
        mutate {
          add_field => {
            "environment" => "production"
          }
        }
      }
    }
    
    output {
      elasticsearch {
        hosts => ["elasticsearch-master:9200"]
        index => "ulms-logs-%{+YYYY.MM.dd}"
        user => "logstash_writer"
        password => "${LOGSTASH_PASSWORD}"
      }
    }
```

---

## 4. Kibana Setup

```yaml
# kibana-values.yaml
elasticsearchHosts: "https://elasticsearch-master:9200"

replicas: 2

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 1000m
    memory: 2Gi

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: kibana.unisoft-systems.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: kibana-tls
      hosts:
        - kibana.unisoft-systems.com

kibanaConfig:
  kibana.yml: |
    server.ssl.enabled: true
    server.ssl.certificate: /usr/share/kibana/config/certs/tls.crt
    server.ssl.key: /usr/share/kibana/config/certs/tls.key
    elasticsearch.ssl.certificateAuthorities: /usr/share/kibana/config/certs/ca.crt
```

---

## 5. Index Templates

```json
{
  "index_patterns": ["ulms-logs-*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "index.lifecycle.name": "ulms-logs-policy",
    "index.lifecycle.rollover_alias": "ulms-logs"
  },
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "logger": { "type": "keyword" },
      "message": { "type": "text" },
      "kubernetes": {
        "properties": {
          "pod_name": { "type": "keyword" },
          "namespace_name": { "type": "keyword" }
        }
      }
    }
  }
}
```

---

## 6. Security Config

- Enable X-Pack security
- TLS for transport and HTTP
- Role-based access control
- Audit logging enabled

---

## 7. Backup

```yaml
# Snapshot repository
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: ulms-elasticsearch
spec:
  snapshotRepositories:
    - name: s3-backup
      settings:
        bucket: ulms-elasticsearch-backups
        region: ap-southeast-1
        base_path: snapshots
```

---

*© 2026 Unisoft Systems Limited.*
