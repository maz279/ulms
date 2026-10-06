**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Email Service Configuration |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Email Service Configuration

## SMTP Configuration

```yaml
spring:
  mail:
    host: smtp.sendgrid.net
    port: 587
    username: apikey
    password: ${SENDGRID_API_KEY}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

## Email Service

```java
@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    public void sendEmail(String to, String subject, String templateCode, 
            Map<String, Object> variables) {
        
        String content = templateEngine.render(templateCode, variables);
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
        
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, true);
        helper.setFrom("noreply@ulms.unisoft.com.bd");
        
        mailSender.send(message);
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
