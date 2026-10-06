# WireMock Configuration Guide
## ULMS v2.0 API Mocking for CIB/NID/Payment Services

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | WireMock Configuration Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | QA Lead / Backend Developer |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Mock Service Definitions](#5-mock-service-definitions)
6. [Response Templates](#6-response-templates)
7. [State Management](#7-state-management)
8. [Integration with ULMS](#8-integration-with-ulms)
9. [Testing and Validation](#9-testing-and-validation)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix](#11-appendix)

---

## 1. Overview

### 1.1 Purpose

This document provides comprehensive configuration guidelines for WireMock, which serves as the primary API mocking solution for ULMS v2.0. WireMock enables isolated testing of ULMS components by simulating external dependencies including:

- **CIB (Credit Information Bureau)** - Bangladesh Bank credit reporting
- **NID (National ID)** - Voter ID verification services
- **Payment Gateways** - bKash, Nagad, Rocket integrations
- **Core Banking System (CBS)** - Bank core system interfaces
- **SMS/Email Gateways** - Notification service providers

### 1.2 Benefits

| Benefit | Description |
|---------|-------------|
| Isolated Testing | Test ULMS without external dependencies |
| Consistent Responses | Reproducible test scenarios |
| Error Simulation | Test error handling and resilience |
| Performance Testing | No external latency impact |
| Cost Reduction | No charges for API calls during testing |
| Parallel Testing | Multiple teams can test simultaneously |

### 1.3 Scope

| Environment | WireMock Usage |
|-------------|----------------|
| Local Development | Primary mocking for all external APIs |
| CI/CD Pipeline | Automated testing with mock services |
| Test Environment | Fallback for unavailable external services |
| Performance Testing | Consistent response times |

---

## 2. Architecture

### 2.1 WireMock Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ULMS Test Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         WireMock Server                              │   │
│  │                    (Port: 8089 / Container)                          │   │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────────┐      │   │
│  │  │    CIB       │    NID       │   Payment    │     CBS      │      │   │
│  │  │    Stubs     │    Stubs     │    Stubs     │    Stubs     │      │   │
│  │  ├──────────────┼──────────────┼──────────────┼──────────────┤      │   │
│  │  │ /cib/v1/*    │ /nid/v1/*    │ /payment/v1/*│ /cbs/v1/*    │      │   │
│  │  │              │              │              │              │      │   │
│  │  │ • inquiry    │ • verify     │ • create     │ • account    │      │   │
│  │  │ • report     │ • verify-dob │ • execute    │ • balance    │      │   │
│  │  │ • bulk       │ • photo      │ • status     │ • statement  │      │   │
│  │  │ • status     │ • address    │ • refund     │ • transfer   │      │   │
│  │  └──────────────┴──────────────┴──────────────┴──────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                                    │                                        │
│        ┌───────────────────────────┼───────────────────────────┐            │
│        │                           │                           │            │
│        ▼                           ▼                           ▼            │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐      │
│  │  Unit Tests  │          │     APIs     │          │   E2E Tests  │      │
│  └──────────────┘          └──────────────┘          └──────────────┘      │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │   bKash      │  │    Nagad     │  │    Rocket    │  (Real Services)    │
│  │   Sandbox    │  │   Sandbox    │  │   Sandbox    │  (Production)       │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
┌──────────┐    ┌──────────────┐    ┌────────────────────────────────────┐
│  ULMS    │───▶│ Spring Boot  │───▶│        Feign Client                │
│Component │    │  RestTemplate│    │  (Configured for WireMock/Test)    │
└──────────┘    └──────────────┘    └────────────────────────────────────┘
                                                    │
                         ┌──────────────────────────┼──────────────────────────┐
                         │                          │                          │
                         ▼                          ▼                          ▼
                   ┌──────────┐               ┌──────────┐               ┌──────────┐
                   │ WireMock │               │ WireMock │               │ WireMock │
                   │  (CIB)   │               │  (NID)   │               │ (bKash)  │
                   └──────────┘               └──────────┘               └──────────┘
```

---

## 3. Installation

### 3.1 Docker Installation (Recommended)

```bash
# Pull WireMock image
docker pull wiremock/wiremock:3.3.1

# Create directory structure
mkdir -p wiremock/{mappings,files,__files}

# Run WireMock container
docker run -d \
  --name ulms-wiremock \
  -p 8089:8080 \
  -v $(pwd)/wiremock/mappings:/home/wiremock/mappings \
  -v $(pwd)/wiremock/__files:/home/wiremock/__files \
  wiremock/wiremock:3.3.1 \
  --global-response-templating \
  --verbose \
  --enable-stub-cors

# Verify installation
curl http://localhost:8089/__admin/mappings
```

### 3.2 Standalone JAR Installation

```bash
# Download WireMock standalone
cd /opt/wiremock
wget https://repo1.maven.org/maven2/org/wiremock/wiremock-standalone/3.3.1/wiremock-standalone-3.3.1.jar

# Create startup script
cat > /opt/wiremock/start-wiremock.sh << 'EOF'
#!/bin/bash
java -jar wiremock-standalone-3.3.1.jar \
  --port 8089 \
  --root-dir /opt/wiremock \
  --global-response-templating \
  --verbose \
  --enable-stub-cors \
  --disable-gzip \
  --async-response-enabled \
  --async-response-threads 20
EOF

chmod +x /opt/wiremock/start-wiremock.sh

# Create systemd service
cat > /etc/systemd/system/wiremock.service << 'EOF'
[Unit]
Description=WireMock Server for ULMS Testing
After=network.target

[Service]
Type=simple
User=wiremock
WorkingDirectory=/opt/wiremock
ExecStart=/opt/wiremock/start-wiremock.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable wiremock
sudo systemctl start wiremock
```

### 3.3 Maven Dependency (Embedded)

```xml
<dependency>
    <groupId>org.wiremock</groupId>
    <artifactId>wiremock</artifactId>
    <version>3.3.1</version>
    <scope>test</scope>
</dependency>
```

### 3.4 Docker Compose Configuration

Add to `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  wiremock:
    image: wiremock/wiremock:3.3.1
    container_name: ulms-wiremock
    ports:
      - "8089:8080"
    volumes:
      - ./wiremock/mappings:/home/wiremock/mappings:ro
      - ./wiremock/__files:/home/wiremock/__files:ro
      - ./wiremock/extensions:/home/wiremock/extensions:ro
    environment:
      - WIREMOCK_OPTIONS=--global-response-templating,--verbose,--enable-stub-cors,--disable-gzip
    command:
      - --global-response-templating
      - --verbose
      - --enable-stub-cors
      - --disable-gzip
      - --container-threads 50
      - --jetty-acceptor-threads 4
      - --async-response-enabled
      - --async-response-threads 20
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/__admin/mappings"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - ulms-test-network
    restart: unless-stopped

  wiremock-ui:
    image: holomekc/wiremock-gui:3.3.1.0
    container_name: ulms-wiremock-ui
    ports:
      - "8088:8080"
    volumes:
      - ./wiremock/mappings:/home/wiremock/mappings:ro
      - ./wiremock/__files:/home/wiremock/__files:ro
    environment:
      - WIREMOCK_OPTIONS=--global-response-templating
    networks:
      - ulms-test-network
    depends_on:
      - wiremock

networks:
  ulms-test-network:
    driver: bridge
```

---

## 4. Configuration

### 4.1 Directory Structure

```
wiremock/
├── mappings/                          # Stub mappings (JSON files)
│   ├── cib/                          # CIB service mocks
│   │   ├── cib-inquiry.json
│   │   ├── cib-report.json
│   │   └── cib-errors.json
│   ├── nid/                          # NID service mocks
│   │   ├── nid-verify.json
│   │   ├── nid-photo.json
│   │   └── nid-errors.json
│   ├── payment/                      # Payment gateway mocks
│   │   ├── bkash.json
│   │   ├── nagad.json
│   │   └── rocket.json
│   ├── cbs/                          # Core Banking System mocks
│   │   ├── account.json
│   │   ├── transaction.json
│   │   └── statement.json
│   └── common/                       # Common utilities
│       ├── health.json
│       └── delay-simulation.json
├── __files/                          # Response body files
│   ├── cib/
│   │   ├── sample-cib-report.json
│   │   └── sample-cib-empty.json
│   ├── nid/
│   │   ├── sample-nid-data.json
│   │   └── sample-photo.jpg
│   ├── payment/
│   │   ├── bkash-success.json
│   │   └── nagad-success.json
│   └── errors/
│       ├── timeout.json
│       ├── service-unavailable.json
│       └── invalid-request.json
└── extensions/                        # Custom extensions (if needed)
    └── ulms-wiremock-extension.jar
```

### 4.2 WireMock Configuration File

Create `wiremock.json`:

```json
{
  "port": 8080,
  "httpsPort": 8443,
  "disableRequestJournal": false,
  "verbose": true,
  "rootDir": ".",
  "globalTemplating": true,
  "disableGzip": true,
  "containerThreads": 50,
  "jettyAcceptors": 4,
  "asyncResponseEnabled": true,
  "asyncResponseThreads": 20,
  "extensions": [
    "response-template",
    "webhook"
  ],
  "stubCorsEnabled": true,
  "permittedSystemKeys": [
    "wiremock.*"
  ],
  "proxyPassThrough": true
}
```

---

## 5. Mock Service Definitions

### 5.1 CIB (Credit Information Bureau) Mocks

#### 5.1.1 CIB Inquiry - Success Response

Create `wiremock/mappings/cib/cib-inquiry-success.json`:

```json
{
  "id": "cib-inquiry-success",
  "name": "CIB Inquiry - Standard Response",
  "request": {
    "method": "POST",
    "urlPath": "/cib/v1/inquiry",
    "headers": {
      "Authorization": {
        "matches": "Bearer [A-Za-z0-9\-_]+"
      },
      "Content-Type": {
        "equalTo": "application/json"
      },
      "X-Request-ID": {
        "matches": "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
      }
    },
    "bodyPatterns": [
      {
        "matchesJsonSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": ["nidNumber", "requestType"],
          "properties": {
            "nidNumber": {
              "type": "string",
              "pattern": "^[0-9]{13}$|^[0-9]{17}$"
            },
            "requestType": {
              "type": "string",
              "enum": ["INDIVIDUAL", "COMMERCIAL", "GUARANTOR"]
            }
          }
        }
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Response-ID": "{{randomValue type='UUID'}}",
      "X-Processing-Time": "{{now format='HH:mm:ss.SSS'}}"
    },
    "jsonBody": {
      "inquiryId": "CIB-{{randomValue type='UUID'}}",
      "referenceNumber": "{{jsonPath request.body '$.referenceNumber'}}",
      "nidNumber": "{{jsonPath request.body '$.nidNumber'}}",
      "inquiryDateTime": "{{now}}",
      "responseCode": "00",
      "responseMessage": "SUCCESS",
      "cibReport": {
        "reportId": "RPT-{{randomValue type='UUID'}}",
        "generatedDate": "{{now format='yyyy-MM-dd'}}",
        "cibScore": {{randomInt lower=300 upper=850}},
        "scoreGrade": "{{pickRandom 'A' 'B' 'C' 'D'}}",
        "totalOutstandingAmount": {{randomInt lower=0 upper=10000000}},
        "totalNumberOfLoans": {{randomInt lower=0 upper=15}},
        "loanClassifications": {
          "standard": {{randomInt lower=0 upper=10}},
          "specialMention": {{randomInt lower=0 upper=3}},
          "substandard": {{randomInt lower=0 upper=2}},
          "doubtful": 0,
          "bad": 0
        },
        "worstCurrentStatus": "STD",
        "numberOfInquiriesLast6Months": {{randomInt lower=0 upper=8}},
        "numberOfInquiriesLast12Months": {{randomInt lower=0 upper=15}},
        "defaults": [],
        "facilityDetails": [
          {{#each (range 1 (randomInt lower=1 upper=4)) as |index|}}
          {
            "facilityId": "FAC-{{randomValue type='UUID'}}",
            "facilityType": "{{pickRandom 'TERM_LOAN' 'CREDIT_CARD' 'OVERDRAFT' 'LEASE'}}",
            "sanctionedAmount": {{randomInt lower=100000 upper=5000000}},
            "outstandingAmount": {{randomInt lower=0 upper=3000000}},
            "overdueAmount": 0,
            "installmentAmount": {{randomInt lower=5000 upper=50000}},
            "numberOfInstallments": {{randomInt lower=12 upper=60}},
            "instalmentsPaid": {{randomInt lower=1 upper=48}},
            "currentStatus": "STD",
            "classificationStatus": "STANDARD",
            "startDate": "{{date (dateMath 'now-2y') format='yyyy-MM-dd'}}",
            "endDate": "{{date (dateMath 'now+3y') format='yyyy-MM-dd'}}",
            "bankCode": "{{pickRandom '001' '002' '003' '004' '005'}}",
            "branchCode": "{{pickRandom '001' '002' '003'}}"
          }{{#unless @last}},{{/unless}}
          {{/each}}
        ]
      }
    },
    "fixedDelayMilliseconds": {{randomInt lower=200 upper=800}}
  },
  "postServeActions": [
    {
      "name": "webhook",
      "parameters": {
        "url": "{{wiremock.request.headers.X-Callback-Url}}",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": "{\"inquiryId\": \"{{jsonPath response.body '$.inquiryId'}}\", \"status\": \"COMPLETED\"}"
      }
    }
  ]
}
```

#### 5.1.2 CIB Inquiry - No Data Found

Create `wiremock/mappings/cib/cib-inquiry-nodata.json`:

```json
{
  "id": "cib-inquiry-nodata",
  "name": "CIB Inquiry - No Data Found",
  "request": {
    "method": "POST",
    "urlPath": "/cib/v1/inquiry",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$.nidNumber",
        "equalToJson": "{\"nidNumber\": \"0000000000000\"}"
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "inquiryId": "CIB-{{randomValue type='UUID'}}",
      "referenceNumber": "{{jsonPath request.body '$.referenceNumber'}}",
      "nidNumber": "0000000000000",
      "inquiryDateTime": "{{now}}",
      "responseCode": "01",
      "responseMessage": "NO_DATA_FOUND",
      "cibReport": null
    }
  },
  "priority": 10
}
```

#### 5.1.3 CIB Inquiry - Error Scenarios

Create `wiremock/mappings/cib/cib-inquiry-errors.json`:

```json
{
  "mappings": [
    {
      "id": "cib-timeout",
      "name": "CIB - Gateway Timeout",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"9999999999999\"}"
          }
        ]
      },
      "response": {
        "status": 504,
        "fixedDelayMilliseconds": 31000,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "error": "GATEWAY_TIMEOUT",
          "message": "CIB service did not respond within expected time",
          "timestamp": "{{now}}"
        }
      },
      "priority": 10
    },
    {
      "id": "cib-service-unavailable",
      "name": "CIB - Service Unavailable",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"8888888888888\"}"
          }
        ]
      },
      "response": {
        "status": 503,
        "headers": {
          "Content-Type": "application/json",
          "Retry-After": "60"
        },
        "jsonBody": {
          "error": "SERVICE_UNAVAILABLE",
          "message": "CIB service is temporarily unavailable",
          "timestamp": "{{now}}"
        }
      },
      "priority": 10
    },
    {
      "id": "cib-invalid-request",
      "name": "CIB - Invalid Request",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"1111111111111\"}"
          }
        ]
      },
      "response": {
        "status": 400,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "error": "INVALID_REQUEST",
          "message": "Invalid NID number format",
          "validationErrors": [
            {
              "field": "nidNumber",
              "message": "NID number checksum validation failed"
            }
          ],
          "timestamp": "{{now}}"
        }
      },
      "priority": 10
    },
    {
      "id": "cib-rate-limit",
      "name": "CIB - Rate Limit Exceeded",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"7777777777777\"}"
          }
        ]
      },
      "response": {
        "status": 429,
        "headers": {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "{{date (dateMath 'now+1h') format='unix'}}"
        },
        "jsonBody": {
          "error": "RATE_LIMIT_EXCEEDED",
          "message": "API rate limit exceeded. Please try again later.",
          "retryAfter": 3600,
          "timestamp": "{{now}}"
        }
      },
      "priority": 10
    }
  ]
}
```

### 5.2 NID (National ID) Mocks

#### 5.2.1 NID Verification - Success

Create `wiremock/mappings/nid/nid-verify-success.json`:

```json
{
  "id": "nid-verify-success",
  "name": "NID Verification - Success",
  "request": {
    "method": "POST",
    "urlPath": "/nid/v1/verify",
    "headers": {
      "Authorization": {
        "matches": "Bearer .*"
      },
      "Content-Type": {
        "equalTo": "application/json"
      }
    },
    "bodyPatterns": [
      {
        "matchesJsonSchema": {
          "type": "object",
          "required": ["nidNumber", "dateOfBirth"],
          "properties": {
            "nidNumber": {
              "type": "string",
              "pattern": "^[0-9]{10,17}$"
            },
            "dateOfBirth": {
              "type": "string",
              "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
            }
          }
        }
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Transaction-ID": "{{randomValue type='UUID'}}"
    },
    "jsonBody": {
      "verificationId": "NID-{{randomValue type='UUID'}}",
      "nidNumber": "{{jsonPath request.body '$.nidNumber'}}",
      "verified": true,
      "verificationStatus": "MATCHED",
      "verificationTimestamp": "{{now}}",
      "citizenInfo": {
        "fullNameBangla": "মোঃ পরীক্ষা গ্রাহক",
        "fullNameEnglish": "Md. Test Customer",
        "fatherNameBangla": "মোঃ পরীক্ষা পিতা",
        "fatherNameEnglish": "Md. Test Father",
        "motherNameBangla": "পরীক্ষা মাতা",
        "motherNameEnglish": "Test Mother",
        "dateOfBirth": "{{jsonPath request.body '$.dateOfBirth'}}",
        "gender": "Male",
        "bloodGroup": "O+",
        "maritalStatus": "Married",
        "occupation": "Private Service",
        "presentAddress": {
          "division": "Dhaka",
          "district": "Dhaka",
          "upazila": "Gulshan",
          "unionOrWard": "Ward-20",
          "mouza": "Gulshan",
          "village": "Gulshan-1",
          "holdingNumber": "25",
          "street": "Road-11",
          "postOffice": "Gulshan",
          "postCode": "1212"
        },
        "permanentAddress": {
          "division": "Dhaka",
          "district": "Gazipur",
          "upazila": "Gazipur Sadar",
          "unionOrWard": "Bason",
          "mouza": "Bason",
          "village": "Test Village",
          "holdingNumber": "45",
          "postOffice": "Gazipur",
          "postCode": "1700"
        }
      },
      "responseCode": "00",
      "responseMessage": "Verification Successful"
    },
    "fixedDelayMilliseconds": {{randomInt lower=100 upper=500}}
  }
}
```

#### 5.2.2 NID Photo Retrieval

Create `wiremock/mappings/nid/nid-photo.json`:

```json
{
  "id": "nid-photo-success",
  "name": "NID Photo - Success",
  "request": {
    "method": "GET",
    "urlPathPattern": "/nid/v1/photo/([0-9]{10,17})",
    "headers": {
      "Authorization": {
        "matches": "Bearer .*"
      }
    }
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "image/jpeg",
      "X-Photo-Hash": "{{randomValue length=32 type='ALPHANUMERIC'}}"
    },
    "base64Body": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==",
    "fixedDelayMilliseconds": 200
  }
}
```

### 5.3 Payment Gateway Mocks

#### 5.3.1 bKash Payment Create

Create `wiremock/mappings/payment/bkash.json`:

```json
{
  "mappings": [
    {
      "id": "bkash-token",
      "name": "bKash - Get Access Token",
      "request": {
        "method": "POST",
        "urlPath": "/payment/bkash/v1.0.0-beta/token/grant",
        "headers": {
          "username": {
            "equalTo": "testUser"
          },
          "password": {
            "equalTo": "testPass123"
          }
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "token_type": "Bearer",
          "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token",
          "refresh_token": "{{randomValue length=32 type='ALPHANUMERIC'}}",
          "expires_in": 3600
        }
      }
    },
    {
      "id": "bkash-create-payment",
      "name": "bKash - Create Payment",
      "request": {
        "method": "POST",
        "urlPath": "/payment/bkash/v1.0.0-beta/payment/create",
        "headers": {
          "Authorization": {
            "matches": "Bearer .*"
          },
          "X-App-Key": {
            "equalTo": "testAppKey123"
          }
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "paymentID": "PAY-{{randomValue length=12 type='NUMERIC'}}",
          "paymentCreateTime": "{{now}}",
          "transactionStatus": "Initiated",
          "amount": "{{jsonPath request.body '$.amount'}}",
          "currency": "BDT",
          "intent": "sale",
          "merchantInvoiceNumber": "{{jsonPath request.body '$.merchantInvoiceNumber'}}",
          "bkashURL": "https://sandbox.bkash.com/checkout/pay?paymentID=PAY1234567890"
        }
      }
    },
    {
      "id": "bkash-execute-payment",
      "name": "bKash - Execute Payment",
      "request": {
        "method": "POST",
        "urlPath": "/payment/bkash/v1.0.0-beta/payment/execute"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "paymentID": "{{jsonPath request.body '$.paymentID'}}",
          "trxID": "TRX{{randomValue length=10 type='ALPHANUMERIC' uppercase=true}}",
          "transactionStatus": "Completed",
          "amount": "5000.00",
          "currency": "BDT",
          "intent": "sale",
          "merchantInvoiceNumber": "INV-001",
          "customerMsisdn": "017XXXXXXXX",
          "transactionTime": "{{now}}"
        }
      }
    },
    {
      "id": "bkash-query-payment",
      "name": "bKash - Query Payment",
      "request": {
        "method": "GET",
        "urlPathPattern": "/payment/bkash/v1.0.0-beta/payment/query/([A-Z0-9]+)"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "paymentID": "{{request.pathSegments.[4]}}",
          "trxID": "TRX{{randomValue length=10 type='ALPHANUMERIC' uppercase=true}}",
          "transactionStatus": "{{pickRandom 'Completed' 'Pending' 'Failed'}}",
          "amount": "5000.00",
          "currency": "BDT",
          "intent": "sale",
          "merchantInvoiceNumber": "INV-001",
          "transactionTime": "{{now}}"
        }
      }
    }
  ]
}
```

---

## 6. Response Templates

### 6.1 Helper Functions

Create custom helpers using WireMock's template engine:

```json
{
  "id": "template-helpers-demo",
  "request": {
    "urlPath": "/template-demo"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "randomUUID": "{{randomValue type='UUID'}}",
      "randomInt": {{randomInt lower=1 upper=100}},
      "randomAlphanumeric": "{{randomValue length=16 type='ALPHANUMERIC'}}",
      "randomAlphanumericUpper": "{{randomValue length=8 type='ALPHANUMERIC' uppercase=true}}",
      "randomNumeric": "{{randomValue length=6 type='NUMERIC'}}",
      "randomHex": "{{randomValue length=8 type='HEX'}}",
      "pickRandom": "{{pickRandom 'Option1' 'Option2' 'Option3'}}",
      "currentDate": "{{now format='yyyy-MM-dd'}}",
      "currentDateTime": "{{now}}",
      "futureDate": "{{date (dateMath 'now+7d') format='yyyy-MM-dd'}}",
      "pastDate": "{{date (dateMath 'now-1M') format='yyyy-MM-dd'}}",
      "requestHeader": "{{request.headers.X-Custom-Header}}",
      "requestBody": "{{jsonPath request.body '$.fieldName'}}",
      "urlPath": "{{request.path}}",
      "queryParam": "{{request.query.paramName}}"
    }
  }
}
```

### 6.2 Scenario-Based Responses

```json
{
  "id": "scenario-demo",
  "scenarioName": "loan-application-flow",
  "requiredScenarioState": "Started",
  "newScenarioState": "ApplicationSubmitted",
  "request": {
    "method": "POST",
    "urlPath": "/api/v1/loan-applications"
  },
  "response": {
    "status": 201,
    "jsonBody": {
      "applicationId": "APP-{{randomValue type='UUID'}}",
      "status": "SUBMITTED",
      "message": "Application created successfully"
    }
  }
}
```

---

## 7. State Management

### 7.1 Scenario-Based State Machine

```json
{
  "mappings": [
    {
      "id": "state-init",
      "scenarioName": "cib-workflow",
      "requiredScenarioState": "Started",
      "request": {
        "urlPath": "/cib/init"
      },
      "response": {
        "status": 200,
        "jsonBody": {
          "status": "INITIATED",
          "sessionId": "{{randomValue type='UUID'}}"
        }
      }
    },
    {
      "id": "state-inprogress",
      "scenarioName": "cib-workflow",
      "requiredScenarioState": "Initiated",
      "newScenarioState": "InProgress",
      "request": {
        "urlPath": "/cib/submit"
      },
      "response": {
        "status": 202,
        "jsonBody": {
          "status": "PROCESSING",
          "message": "Request is being processed"
        }
      }
    },
    {
      "id": "state-complete",
      "scenarioName": "cib-workflow",
      "requiredScenarioState": "InProgress",
      "newScenarioState": "Completed",
      "request": {
        "urlPath": "/cib/status"
      },
      "response": {
        "status": 200,
        "jsonBody": {
          "status": "COMPLETED",
          "result": "Success"
        }
      }
    }
  ]
}
```

### 7.2 Reset Scenarios API

```bash
# Reset all scenarios to initial state
curl -X POST http://localhost:8089/__admin/scenarios/reset

# Reset specific scenario
curl -X POST http://localhost:8089/__admin/scenarios/cib-workflow/reset

# Get all scenario states
curl http://localhost:8089/__admin/scenarios
```

---

## 8. Integration with ULMS

### 8.1 Spring Boot Configuration

```yaml
# application-test.yml
ulms:
  external:
    services:
      cib:
        base-url: http://localhost:8089/cib
        timeout: 30000
        retry:
          max-attempts: 3
          delay: 1000
      nid:
        base-url: http://localhost:8089/nid
        timeout: 15000
      payment:
        bkash:
          base-url: http://localhost:8089/payment/bkash
          app-key: testAppKey123
          app-secret: testSecret456
```

### 8.2 Feign Client Configuration

```java
@FeignClient(
    name = "cibClient",
    url = "${ulms.external.services.cib.base-url}",
    configuration = CibClientConfig.class
)
public interface CibClient {
    
    @PostMapping("/v1/inquiry")
    CibInquiryResponse inquiry(@RequestBody CibInquiryRequest request);
}
```

### 8.3 Test Setup with WireMock

```java
@SpringBootTest
@AutoConfigureWireMock(port = 8089)
@TestPropertySource(properties = {
    "ulms.external.services.cib.base-url=http://localhost:8089/cib",
    "ulms.external.services.nid.base-url=http://localhost:8089/nid"
})
public class CibIntegrationTest {
    
    @Autowired
    private CibClient cibClient;
    
    @BeforeEach
    void setUp() {
        WireMock.reset();
    }
    
    @Test
    void testCibInquiry_Success() {
        // Given
        stubFor(post("/cib/v1/inquiry")
            .withRequestBody(matchingJsonPath("$.nidNumber", equalTo("1234567890123")))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBodyFile("cib/sample-cib-report.json")));
        
        // When
        CibInquiryResponse response = cibClient.inquiry(
            CibInquiryRequest.builder()
                .nidNumber("1234567890123")
                .build()
        );
        
        // Then
        assertThat(response.getResponseCode()).isEqualTo("00");
        assertThat(response.getCibReport()).isNotNull();
    }
}
```

---

## 9. Testing and Validation

### 9.1 Health Check

```bash
# WireMock Admin API
curl http://localhost:8089/__admin/mappings
curl http://localhost:8089/__admin/health

# Test specific stubs
curl -X POST http://localhost:8089/cib/v1/inquiry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"nidNumber": "1234567890123", "requestType": "INDIVIDUAL"}'
```

### 9.2 Record and Playback

```bash
# Record mode - proxy to real service and record responses
java -jar wiremock-standalone.jar \
  --proxy-all "https://api.cib.org.bd" \
  --record-mappings \
  --verbose

# Recorded mappings will be saved to mappings/ directory
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Solution |
|-------|----------|
| Stub not matching | Check URL path, headers, body patterns |
| Template errors | Verify JSON syntax in response templates |
| CORS errors | Enable `--enable-stub-cors` flag |
| Port already in use | Change port with `--port` option |
| File not found | Check `__files` directory path |

### 10.2 Debug Logging

```bash
# Enable verbose logging
curl -X POST http://localhost:8089/__admin/settings \
  -H "Content-Type: application/json" \
  -d '{"verboseLogging": true}'

# View unmatched requests
curl http://localhost:8089/__admin/requests/unmatched

# View all requests
curl http://localhost:8089/__admin/requests
```

---

## 11. Appendix

### 11.1 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | QA Lead | Initial document creation |

### 11.2 Related Documents

| Document | Description |
|----------|-------------|
| `[TEST]_Test_Environment_Setup_Guide_v1.0.md` | Test environment setup |
| `[TEST]_Test_Data_Management_Strategy_v1.0.md` | Test data management |

---

**End of Document**
