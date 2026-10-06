**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | SMS Gateway Integration |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# SMS Gateway Integration

## 1. SSL Wireless Integration

### 1.1 Configuration

```yaml
ulms:
  sms:
    provider: ssl-wireless
    ssl-wireless:
      api-url: https://smsplus.sslwireless.com/api/v3/send-sms
      api-token: ${SSL_API_TOKEN}
      sid: ${SSL_SID}
      csms-id: ${SSL_CSMS_ID}
      sender-id: ULMSBK
```

### 1.2 Implementation

```java
@Component
@RequiredArgsConstructor
public class SslWirelessSmsProvider implements SmsProvider {
    
    private final WebClient webClient;
    private final SslWirelessProperties properties;
    
    @Override
    public SmsSendResult sendSms(String phoneNumber, String message) {
        String formattedNumber = formatNumber(phoneNumber);
        
        SslSmsRequest request = SslSmsRequest.builder()
            .apiToken(properties.getApiToken())
            .sid(properties.getSid())
            .msisdn(formattedNumber)
            .sms(message)
            .csmsId(generateCsmsId())
            .build();
        
        try {
            SslSmsResponse response = webClient.post()
                .uri(properties.getApiUrl())
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SslSmsResponse.class)
                .timeout(Duration.ofSeconds(30))
                .block();
            
            return SmsSendResult.builder()
                .success(response.isSuccess())
                .messageId(response.getMessageId())
                .providerResponse(response.getMessage())
                .build();
                
        } catch (Exception e) {
            log.error("SMS send failed", e);
            return SmsSendResult.builder()
                .success(false)
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    private String formatNumber(String phoneNumber) {
        // Remove non-numeric
        String clean = phoneNumber.replaceAll("[^0-9]", "");
        
        // Add country code if missing
        if (clean.startsWith("0")) {
            clean = "880" + clean.substring(1);
        } else if (!clean.startsWith("880")) {
            clean = "880" + clean;
        }
        
        return clean;
    }
}
```

## 2. Fallback Strategy

```java
@Component
@RequiredArgsConstructor
public class FallbackSmsService {
    
    private final List<SmsProvider> providers;
    
    public SmsSendResult sendWithFallback(String phoneNumber, String message) {
        for (SmsProvider provider : providers) {
            try {
                SmsSendResult result = provider.sendSms(phoneNumber, message);
                if (result.isSuccess()) {
                    return result;
                }
                log.warn("SMS provider {} failed, trying next", provider.getName());
            } catch (Exception e) {
                log.error("SMS provider {} error", provider.getName(), e);
            }
        }
        
        throw new SmsSendException("All SMS providers failed");
    }
}
```

---

## Appendices

### A.1 SMS Pricing (Estimated)

| Provider | Per SMS | Bulk (10K+) |
|----------|---------|-------------|
| SSL Wireless | BDT 0.35 | BDT 0.30 |
| Robi | BDT 0.40 | BDT 0.35 |
| GP | BDT 0.45 | BDT 0.40 |
