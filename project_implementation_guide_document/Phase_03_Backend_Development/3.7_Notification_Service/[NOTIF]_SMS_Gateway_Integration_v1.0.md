**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | SMS Gateway Integration |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# SMS Gateway Integration

## Supported Gateways

| Provider | API URL | Features |
|----------|---------|----------|
| SSL Wireless | https://api.sslwireless.com | High throughput |
| bKash | https://api.bkash.com | Financial focus |
| Robi | https://api.robi.com.bd | Wide coverage |

## Implementation

```java
@Component
@RequiredArgsConstructor
public class SmsGatewayService {
    
    private final SmsProperties properties;
    private final RestTemplate restTemplate;
    
    public SmsResult send(String phoneNumber, String message) {
        SmsRequest request = SmsRequest.builder()
            .apiKey(properties.getApiKey())
            .userId(properties.getUserId())
            .password(properties.getPassword())
            .to(formatPhoneNumber(phoneNumber))
            .message(message)
            .build();
        
        ResponseEntity<SmsResponse> response = restTemplate.postForEntity(
            properties.getUrl(),
            request,
            SmsResponse.class
        );
        
        return mapToResult(response.getBody());
    }
    
    private String formatPhoneNumber(String phone) {
        // Convert to 880 format
        if (phone.startsWith("01")) {
            return "880" + phone.substring(1);
        }
        return phone;
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
