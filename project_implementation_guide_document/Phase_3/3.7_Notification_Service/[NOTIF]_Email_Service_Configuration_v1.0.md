**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Email Service Configuration |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Email Service Configuration

## 1. SMTP Configuration

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: notifications@unisoft.com.bd
    password: ${EMAIL_PASSWORD}
    protocol: smtp
    default-encoding: UTF-8
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
      mail.smtp.connectiontimeout: 5000
      mail.smtp.timeout: 5000
      mail.smtp.writetimeout: 5000

ulms:
  email:
    from: ULMS <notifications@unisoft.com.bd>
    reply-to: support@unisoft.com.bd
    logo-url: https://unisoft.com.bd/logo.png
```

## 2. Email Service Implementation

```java
@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    public void sendEmail(EmailRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("ULMS <notifications@unisoft.com.bd>");
            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), true);
            
            if (request.getAttachments() != null) {
                for (Attachment attachment : request.getAttachments()) {
                    helper.addAttachment(attachment.getName(), 
                        new ByteArrayResource(attachment.getData()));
                }
            }
            
            mailSender.send(message);
            
        } catch (MessagingException e) {
            throw new EmailSendException("Failed to send email", e);
        }
    }
    
    public void sendTemplatedEmail(String to, String templateId, 
            Map<String, Object> variables) {
        
        String htmlContent = templateEngine.render(templateId, variables);
        String subject = templateEngine.renderSubject(templateId, variables);
        
        sendEmail(EmailRequest.builder()
            .to(to)
            .subject(subject)
            .body(htmlContent)
            .build());
    }
}
```

## 3. Email Templates

### 3.1 HTML Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #003366; color: white; padding: 20px; }
        .content { padding: 20px; }
        .footer { background: #f4f4f4; padding: 10px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{logoUrl}}" alt="ULMS" height="40">
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>This is an automated message from ULMS.</p>
            <p>© 2026 Unisoft Systems Limited</p>
        </div>
    </div>
</body>
</html>
```

---

## Appendices

### A.1 Email Queuing

For high volume, use RabbitMQ or Kafka to queue emails:

```java
@Service
public class QueuedEmailService {
    
    @RabbitListener(queues = "email-queue")
    public void processEmailQueue(EmailMessage message) {
        emailService.sendEmail(message.toRequest());
    }
}
```
