**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | WireMock Configuration |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.3.2 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Backend Developer, ULMS Project |
| **Reviewed By** | QA Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Backend Developer | Initial version |

---

# WireMock Configuration
## Mock External APIs for CIB, NID, and Payment Gateways

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Mocked Services Overview](#2-mocked-services-overview)
3. [Installation and Setup](#3-installation-and-setup)
4. [CIB API Mocking](#4-cib-api-mocking)
5. [NID/e-KYC API Mocking](#5-nide-kyc-api-mocking)
6. [Payment Gateway Mocking](#6-payment-gateway-mocking)
7. [Response Scenarios](#7-response-scenarios)
8. [Request Matching](#8-request-matching)
9. [Dynamic Responses](#9-dynamic-responses)
10. [Integration with Tests](#10-integration-with-tests)
11. [Troubleshooting](#11-troubleshooting)
12. [Related Documents](#12-related-documents)

---

## 1. Purpose

This document provides comprehensive configuration for WireMock to simulate external APIs used by ULMS v2.0, including Bangladesh Bank CIB (Credit Information Bureau), NID (National ID) verification, and payment gateway integrations (bKash, Nagad, Rocket).

---

## 2. Mocked Services Overview

### 2.1 External Services Matrix

| Service | Real API URL | Mock URL | Purpose |
|---------|--------------|----------|---------|
| CIB Individual | https://api.cib.bb.org.bd | http://localhost:8089/cib | Credit history |
| CIB Company | https://api.cib.bb.org.bd | http://localhost:8089/cib | Corporate credit |
| NID Verification | https://api.nidw.gov.bd | http://localhost:8089/nid | Identity verification |
| bKash | https://checkout.bkash.com | http://localhost:8089/bkash | Mobile payments |
| Nagad | https://api.mynagad.com | http://localhost:8089/nagad | Mobile payments |
| SMS Gateway | https://api.sms.bd | http://localhost:8089/sms | Notifications |

### 2.2 WireMock Directory Structure

```
wiremock/
├── mappings/                    # Request/response mappings
│   ├── cib/
│   │   ├── inquiry-success.json
│   │   ├── inquiry-not-found.json
│   │   ├── inquiry-error.json
│   │   └── inquiry-timeout.json
│   ├── nid/
│   │   ├── verify-success.json
│   │   ├── verify-not-found.json
│   │   └── verify-error.json
│   ├── bkash/
│   │   ├── create-payment.json
│   │   ├── execute-payment.json
│   │   └── payment-status.json
│   └── nagad/
│       └── ...
├── __files/                     # Response body files
│   ├── cib/
│   │   ├── clean-report.json
│   │   ├── defaulter-report.json
│   │   └── empty-report.json
│   └── nid/
│       ├── verified-response.json
│       └── invalid-nid.json
└── extensions/                  # Custom extensions (if needed)
```

---

## 3. Installation and Setup

### 3.1 Docker Setup

```yaml
# docker-compose.wiremock.yml
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
    environment:
      - WIREMOCK_OPTIONS=--verbose,--global-response-templating,--port=8080
    command: --verbose --global-response-templating
    networks:
      - ulms-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/__admin/health"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  ulms-network:
    external: true
```

### 3.2 Start WireMock

```bash
# Start WireMock
docker-compose -f docker-compose.wiremock.yml up -d

# Verify running
curl http://localhost:8089/__admin/health

# List all mappings
curl http://localhost:8089/__admin/mappings

# Reset all mappings
curl -X POST http://localhost:8089/__admin/reset
```

---

## 4. CIB API Mocking

### 4.1 CIB Individual Inquiry - Success

**File:** `wiremock/mappings/cib/inquiry-success.json`

```json
{
  "id": "cib-inquiry-success",
  "request": {
    "method": "POST",
    "url": "/cib/api/inquiry/individual",
    "headers": {
      "Content-Type": {
        "equalTo": "application/json"
      },
      "Authorization": {
        "matches": "Bearer .*"
      }
    },
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber =~ /^[0-9]{10,17}$/)]"
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Request-ID": "{{randomValue type='UUID'}}"
    },
    "jsonBody": {
      "inquiryId": "{{randomValue type='UUID'}}",
      "inquiryDate": "{{now format='yyyy-MM-dd HH:mm:ss'}}",
      "status": "SUCCESS",
      "subject": {
        "nidNumber": "{{jsonPath request.body '$.nidNumber'}}",
        "fullName": "{{jsonPath request.body '$.subjectName'}}",
        "fatherName": "Test Father",
        "motherName": "Test Mother",
        "dateOfBirth": "1985-05-15"
      },
      "cibScore": {{randomInt lower=300 upper=850}},
      "creditSummary": {
        "totalCreditFacilities": 2,
        "totalSanctionedAmount": 1500000.00,
        "totalOutstandingAmount": 850000.00,
        "totalOverdueAmount": 0.00,
        "worstClassification": "STD"
      },
      "creditFacilities": [
        {
          "facilityId": "CF001",
          "lenderName": "ABC Bank Limited",
          "lenderCode": "ABL001",
          "facilityType": "TERM_LOAN",
          "sanctionedDate": "2023-01-15",
          "sanctionedAmount": 1000000.00,
          "outstandingAmount": 750000.00,
          "overdueAmount": 0.00,
          "installmentAmount": 25000.00,
          "instalmentFrequency": "MONTHLY",
          "remainingInstalments": 30,
          "classification": "STD",
          "securityAmount": 1200000.00,
          "securityType": "IMMOVABLE_PROPERTY"
        },
        {
          "facilityId": "CF002",
          "lenderName": "XYZ Bank Limited",
          "lenderCode": "XYZ001",
          "facilityType": "CREDIT_CARD",
          "sanctionedDate": "2022-06-10",
          "sanctionedAmount": 500000.00,
          "outstandingAmount": 100000.00,
          "overdueAmount": 0.00,
          "classification": "STD",
          "securityAmount": 0.00
        }
      ],
      "inquiriesLast6Months": 3
    }
  }
}
```

### 4.2 CIB Individual Inquiry - Defaulter

**File:** `wiremock/mappings/cib/inquiry-defaulter.json`

```json
{
  "id": "cib-inquiry-defaulter",
  "request": {
    "method": "POST",
    "url": "/cib/api/inquiry/individual",
    "headers": {
      "Content-Type": {
        "equalTo": "application/json"
      }
    },
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber == '12345678901234567')]"
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "inquiryId": "{{randomValue type='UUID'}}",
      "inquiryDate": "{{now format='yyyy-MM-dd HH:mm:ss'}}",
      "status": "SUCCESS",
      "subject": {
        "nidNumber": "12345678901234567",
        "fullName": "Defaulting Customer",
        "fatherName": "Test Father",
        "motherName": "Test Mother",
        "dateOfBirth": "1980-01-01"
      },
      "cibScore": 450,
      "creditSummary": {
        "totalCreditFacilities": 3,
        "totalSanctionedAmount": 2500000.00,
        "totalOutstandingAmount": 1800000.00,
        "totalOverdueAmount": 350000.00,
        "worstClassification": "SS"
      },
      "creditFacilities": [
        {
          "facilityId": "CF003",
          "lenderName": "ABC Bank Limited",
          "facilityType": "TERM_LOAN",
          "sanctionedAmount": 1500000.00,
          "outstandingAmount": 1200000.00,
          "overdueAmount": 300000.00,
          "daysOverdue": 120,
          "classification": "SS",
          "status": "OVERDUE"
        },
        {
          "facilityId": "CF004",
          "lenderName": "Credit Card Provider",
          "facilityType": "CREDIT_CARD",
          "sanctionedAmount": 100000.00,
          "outstandingAmount": 50000.00,
          "overdueAmount": 50000.00,
          "daysOverdue": 90,
          "classification": "SS"
        }
      ],
      "inquiriesLast6Months": 8,
      "defaulterStatus": true
    }
  }
}
```

### 4.3 CIB Inquiry - Not Found

**File:** `wiremock/mappings/cib/inquiry-not-found.json`

```json
{
  "id": "cib-inquiry-not-found",
  "request": {
    "method": "POST",
    "url": "/cib/api/inquiry/individual",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber == '00000000000000000')]"
      }
    ]
  },
  "response": {
    "status": 404,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "error": "SUBJECT_NOT_FOUND",
      "message": "No credit information found for the provided NID number",
      "timestamp": "{{now format='yyyy-MM-dd HH:mm:ss'}}"
    }
  }
}
```

### 4.4 CIB Inquiry - Server Error

**File:** `wiremock/mappings/cib/inquiry-error.json`

```json
{
  "id": "cib-inquiry-error",
  "priority": 1,
  "request": {
    "method": "POST",
    "url": "/cib/api/inquiry/individual",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber == 'ERROR')]"
      }
    ]
  },
  "response": {
    "status": 500,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "error": "INTERNAL_SERVER_ERROR",
      "message": "An error occurred while processing the inquiry",
      "timestamp": "{{now format='yyyy-MM-dd HH:mm:ss'}}"
    }
  }
}
```

---

## 5. NID/e-KYC API Mocking

### 5.1 NID Verification - Success

**File:** `wiremock/mappings/nid/verify-success.json`

```json
{
  "id": "nid-verify-success",
  "request": {
    "method": "POST",
    "url": "/nid/api/verify",
    "headers": {
      "Content-Type": {
        "equalTo": "application/json"
      }
    },
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber =~ /^[0-9]{10,17}$/)]"
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "verificationId": "{{randomValue type='UUID'}}",
      "status": "VERIFIED",
      "nidNumber": "{{jsonPath request.body '$.nidNumber'}}",
      "dateOfBirth": "{{jsonPath request.body '$.dateOfBirth'}}",
      "personalInfo": {
        "fullNameEn": "MOHAMMAD ALI",
        "fullNameBn": "মোহাম্মদ আলী",
        "fatherNameEn": "ABDUL KARIM",
        "fatherNameBn": "আব্দুল করিম",
        "motherNameEn": "AMENA BEGUM",
        "motherNameBn": "আমেনা বেগম",
        "spouseName": null,
        "gender": "MALE",
        "bloodGroup": "O+",
        "birthPlace": "DHAKA"
      },
      "address": {
        "presentAddress": {
          "addressEn": "HOUSE 12, ROAD 5, MOHAMMADPUR, DHAKA",
          "addressBn": "বাড়ি ১২, রোড ৫, মোহাম্মদপুর, ঢাকা",
          "division": "DHAKA",
          "district": "DHAKA",
          "upazila": "MOHAMMADPUR",
          "postOffice": "MOHAMMADPUR",
          "postalCode": "1207"
        },
        "permanentAddress": {
          "addressEn": "VILLAGE: NAYAPARA, POST: CHANDANAISH, DIST: CHITTAGONG",
          "addressBn": "গ্রাম: নয়াপাড়া, পোস্ট: চন্দনাইশ, জেলা: চট্টগ্রাম",
          "division": "CHITTAGONG",
          "district": "CHITTAGONG",
          "upazila": "CHANDANAISH"
        }
      },
      "photo": "{{base64 '/__files/nid/sample-photo.jpg'}}",
      "matchScore": 95,
      "verifiedAt": "{{now format='yyyy-MM-dd HH:mm:ss'}}"
    }
  }
}
```

### 5.2 NID Verification - Invalid NID

**File:** `wiremock/mappings/nid/verify-invalid.json`

```json
{
  "id": "nid-verify-invalid",
  "request": {
    "method": "POST",
    "url": "/nid/api/verify",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber =~ /^[0-9]{1,9}$/ || @.nidNumber =~ /^[0-9]{18,}$/)]"
      }
    ]
  },
  "response": {
    "status": 400,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "error": "INVALID_NID_FORMAT",
      "message": "NID number must be 10-17 digits",
      "timestamp": "{{now format='yyyy-MM-dd HH:mm:ss'}}"
    }
  }
}
```

### 5.3 NID Verification - Mismatch

**File:** `wiremock/mappings/nid/verify-mismatch.json`

```json
{
  "id": "nid-verify-mismatch",
  "request": {
    "method": "POST",
    "url": "/nid/api/verify",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber == '1234567890')]"
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "verificationId": "{{randomValue type='UUID'}}",
      "status": "MISMATCH",
      "nidNumber": "1234567890",
      "message": "Provided information does not match NID database",
      "matchScore": 25,
      "verifiedAt": "{{now format='yyyy-MM-dd HH:mm:ss'}}"
    }
  }
}
```

---

## 6. Payment Gateway Mocking

### 6.1 bKash - Create Payment

**File:** `wiremock/mappings/bkash/create-payment.json`

```json
{
  "id": "bkash-create-payment",
  "request": {
    "method": "POST",
    "url": "/bkash/checkout/payment/create",
    "headers": {
      "Content-Type": {
        "equalTo": "application/json"
      },
      "Authorization": {
        "matches": "Bearer .*"
      },
      "X-APP-Key": {
        "matches": ".*"
      }
    }
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Request-ID": "{{randomValue type='UUID'}}"
    },
    "jsonBody": {
      "paymentID": "{{randomValue type='UUID'}}",
      "paymentCreateTime": "{{now format='yyyy-MM-dd HH:mm:ss'}}",
      "transactionStatus": "Initiated",
      "amount": "{{jsonPath request.body '$.amount'}}",
      "currency": "BDT",
      "intent": "{{jsonPath request.body '$.intent'}}",
      "merchantInvoiceNumber": "{{jsonPath request.body '$.merchantInvoiceNumber'}}",
      "bkashURL": "https://sandbox.bkash.com/checkout?paymentID={{randomValue type='UUID'}}"
    }
  }
}
```

### 6.2 bKash - Execute Payment

**File:** `wiremock/mappings/bkash/execute-payment.json`

```json
{
  "id": "bkash-execute-payment",
  "request": {
    "method": "POST",
    "url": "/bkash/checkout/payment/execute",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$.paymentID"
      }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "paymentID": "{{jsonPath request.body '$.paymentID'}}",
      "paymentExecuteTime": "{{now format='yyyy-MM-dd HH:mm:ss'}}",
      "transactionStatus": "Completed",
      "transactionReference": "TRX{{randomInt lower=100000 upper=999999}}",
      "amount": "{{randomInt lower=1000 upper=50000}}",
      "currency": "BDT",
      "customerMsisdn": "017{{randomInt lower=10000000 upper=99999999}}",
      "merchantInvoiceNumber": "INV{{randomInt lower=1000 upper=9999}}"
    }
  }
}
```

---

## 7. Response Scenarios

### 7.1 Scenario-Based Responses

Use WireMock's scenario feature to simulate stateful interactions:

```json
{
  "id": "cib-inquiry-rate-limit",
  "scenarioName": "cib-rate-limit",
  "requiredScenarioState": "Started",
  "newScenarioState": "RateLimited",
  "request": {
    "method": "POST",
    "url": "/cib/api/inquiry/individual"
  },
  "response": {
    "status": 429,
    "headers": {
      "Content-Type": "application/json",
      "Retry-After": "60"
    },
    "jsonBody": {
      "error": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests. Please try again after 60 seconds.",
      "timestamp": "{{now format='yyyy-MM-dd HH:mm:ss'}}"
    }
  }
}
```

### 7.2 Delay Simulation

```json
{
  "id": "cib-inquiry-slow",
  "request": {
    "method": "POST",
    "url": "/cib/api/inquiry/individual",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$[?(@.nidNumber == 'SLOW')]"
      }
    ]
  },
  "response": {
    "status": 200,
    "fixedDelayMilliseconds": 5000,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "status": "SUCCESS",
      "message": "Slow response simulated"
    }
  }
}
```

---

## 8. Request Matching

### 8.1 Advanced Request Matching

```json
{
  "request": {
    "method": "POST",
    "urlPathPattern": "/cib/api/inquiry/(individual|company)",
    "queryParameters": {
      "detailed": {
        "equalTo": "true"
      }
    },
    "headers": {
      "Content-Type": {
        "contains": "application/json"
      },
      "Authorization": {
        "matches": "Bearer [A-Za-z0-9_-]+"
      }
    },
    "bodyPatterns": [
      {
        "equalToJson": {
          "nidNumber": "12345678901234567",
          "subjectName": "Test User"
        },
        "ignoreArrayOrder": true,
        "ignoreExtraElements": true
      }
    ]
  }
}
```

---

## 9. Dynamic Responses

### 9.1 Response Templating

WireMock supports dynamic response generation:

```json
{
  "response": {
    "status": 200,
    "jsonBody": {
      "timestamp": "{{now format='yyyy-MM-dd HH:mm:ss'}}",
      "requestId": "{{randomValue type='UUID'}}",
      "requestBody": {
        "originalNid": "{{jsonPath request.body '$.nidNumber'}}",
        "originalName": "{{jsonPath request.body '$.subjectName'}}"
      },
      "calculatedValue": "{{math (jsonPath request.body '$.amount') '+' 100}}",
      "randomScore": "{{randomInt lower=300 upper=850}}",
      "base64Content": "{{base64 'Hello World'}}"
    }
  }
}
```

### 9.2 Custom Helpers

```json
{
  "response": {
    "transformers": ["response-template"],
    "jsonBody": {
      "greeting": "{{#eq request.headers.X-Gender 'M'}}Mr{{else}}Ms{{/eq}}",
      "fullName": "{{capitalize (jsonPath request.body '$.firstName')}} {{capitalize (jsonPath request.body '$.lastName')}}"
    }
  }
}
```

---

## 10. Integration with Tests

### 10.1 Spring Boot Test Integration

```java
@SpringBootTest
@TestPropertySource(properties = {
    "ulms.cib.url=http://localhost:8089/cib",
    "ulms.nid.url=http://localhost:8089/nid"
})
public class CibIntegrationTest {
    
    @Autowired
    private CibService cibService;
    
    @Test
    void shouldFetchCibReport() {
        // Test implementation
        CibReport report = cibService.inquire("12345678901234567", "Test User");
        
        assertThat(report.getStatus()).isEqualTo("SUCCESS");
        assertThat(report.getCibScore()).isBetween(300, 850);
    }
}
```

### 10.2 WireMock Java Client

```java
@ExtendWith(WireMockExtension.class)
public class NidVerificationTest {
    
    @Test
    void shouldVerifyNid(WireMockRuntimeInfo wmRuntimeInfo) {
        // Configure stub programmatically
        stubFor(post("/nid/api/verify")
            .withRequestBody(matchingJsonPath("$.nidNumber", equalTo("1234567890")))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "status": "VERIFIED",
                        "nidNumber": "1234567890",
                        "matchScore": 95
                    }
                    """)));
        
        // Execute test
        NidVerificationResult result = nidService.verify("1234567890", "1985-05-15");
        
        // Verify
        assertThat(result.isVerified()).isTrue();
        
        // Verify request was made
        verify(postRequestedFor(urlEqualTo("/nid/api/verify"))
            .withHeader("Content-Type", containing("application/json")));
    }
}
```

---

## 11. Troubleshooting

### 11.1 Common Issues

#### Issue: Mappings not loading

```bash
# Check mapping syntax
java -jar wiremock-standalone.jar --validate-mappings

# Verify mappings directory
ls -la wiremock/mappings/

# Check WireMock logs
docker logs ulms-wiremock
```

#### Issue: Request not matching

```bash
# Enable verbose logging
curl -X POST http://localhost:8089/__admin/settings \
  -H "Content-Type: application/json" \
  -d '{"verboseLogging": true}'

# Check received requests
curl http://localhost:8089/__admin/requests
```

#### Issue: Response templating not working

```bash
# Verify global-response-templating is enabled
# Check response template syntax
# Ensure request body is valid JSON
```

### 11.2 Debug Commands

```bash
# List all mappings
curl http://localhost:8089/__admin/mappings

# Get specific mapping
curl http://localhost:8089/__admin/mappings/{id}

# Reset mappings
curl -X POST http://localhost:8089/__admin/mappings/reset

# Get unmatched requests
curl http://localhost:8089/__admin/requests/unmatched

# Get near misses
curl http://localhost:8089/__admin/near-misses/request
```

---

## 12. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.3.1 | [Test Environment Setup]([TEST]_Test_Environment_Setup_Guide_v1.0.md) | Testing infrastructure |
| 2.3.3 | [Test Data Management Strategy]([TEST]_Test_Data_Management_Strategy_v1.0.md) | Test data approach |
| 3.2.1 | [CIB Integration Service](../03_Backend/[BE]_CIB_Integration_Service_v1.0.md) | CIB integration details |
| 3.2.2 | [NID/e-KYC Integration](../03_Backend/[BE]_NID_eKYC_Integration_v1.0.md) | NID integration details |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Internal Use Only - ULMS Development Team*
