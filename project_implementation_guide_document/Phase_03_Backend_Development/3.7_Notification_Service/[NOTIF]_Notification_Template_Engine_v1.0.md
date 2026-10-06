**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Notification Template Engine |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Notification Template Engine

## Template Format

### SMS Template

```
Dear {{customerName}}, your loan application for BDT {{loanAmount}} 
has been {{status}}. Loan ID: {{loanId}}. Thank you, ULMS.
```

### Email Template

```html
<html>
<body>
  <h2>Loan {{status}}</h2>
  <p>Dear {{customerName}},</p>
  <p>Your loan application for BDT {{loanAmount}} has been {{status}}.</p>
  <p>Loan ID: {{loanId}}</p>
</body>
</html>
```

## Implementation

```java
@Service
@RequiredArgsConstructor
public class TemplateEngine {
    
    private final TemplateRepository templateRepository;
    
    public String render(String templateCode, Map<String, Object> variables) {
        NotificationTemplate template = templateRepository
            .findByCode(templateCode)
            .orElseThrow(() -> new TemplateNotFoundException(templateCode));
        
        String content = template.getContent();
        
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            content = content.replace(
                "{{" + entry.getKey() + "}}",
                entry.getValue().toString()
            );
        }
        
        return content;
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
