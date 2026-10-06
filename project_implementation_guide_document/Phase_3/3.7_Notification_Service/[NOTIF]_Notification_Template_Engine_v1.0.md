**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Notification Template Engine |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Notification Template Engine

## 1. Template Structure

```yaml
templates:
  loan-approved:
    sms:
      bn: "প্রিয় {{customerName}}, আপনার ঋণ আবেদন {{loanId}} অনুমোদিত হয়েছে। বিস্তারিত জানতে কল করুন {{branchPhone}}"
      en: "Dear {{customerName}}, your loan application {{loanId}} has been approved. Call {{branchPhone}} for details."
    email:
      subject:
        bn: "ঋণ আবেদন অনুমোদিত"
        en: "Loan Application Approved"
      body:
        bn: "templates/loan-approved-bn.html"
        en: "templates/loan-approved-en.html"
```

## 2. Template Engine Implementation

```java
@Service
@RequiredArgsConstructor
public class TemplateEngineService {
    
    private final TemplateRepository templateRepository;
    private final Mustache mustache;
    
    public String renderTemplate(String templateId, Channel channel, 
            Locale locale, Map<String, Object> data) {
        
        NotificationTemplate template = templateRepository
            .findByTemplateIdAndChannel(templateId, channel)
            .orElseThrow(() -> new TemplateNotFoundException(templateId));
        
        String content = template.getLocalizedContent(locale.getLanguage());
        
        return mustache.render(content, data);
    }
    
    public String renderSms(String templateId, Locale locale, 
            Map<String, Object> data) {
        String rendered = renderTemplate(templateId, Channel.SMS, locale, data);
        // SMS length check
        if (rendered.length() > 160) {
            log.warn("SMS exceeds 160 characters: {}", templateId);
        }
        return rendered;
    }
}
```

## 3. Template Examples

### 3.1 Loan Disbursement SMS

```
Template: loan-disbursed
Variables:
  - customerName
  - loanAmount
  - accountNumber
  - disbursementDate

BN: প্রিয় {{customerName}}, আপনার {{loanAmount}} টাকার ঋণ {{accountNumber}} একাউন্টে {{disbursementDate}} তারিখে প্রদান করা হয়েছে।
EN: Dear {{customerName}}, your loan of BDT {{loanAmount}} has been disbursed to account {{accountNumber}} on {{disbursementDate}}.
```

### 3.2 Payment Reminder

```
Template: payment-due
Variables:
  - customerName
  - dueAmount
  - dueDate
  - daysRemaining

BN: প্রিয় {{customerName}}, আপনার {{dueAmount}} টাকার কিস্তি {{dueDate}} তারিখে পরিশোধযোগ্য। অনুগ্রহ করে সময়মত পরিশোধ করুন।
EN: Dear {{customerName}}, your installment of BDT {{dueAmount}} is due on {{dueDate}}. Please pay on time to avoid penalties.
```

---

## Appendices

### A.1 Template Management API

| Endpoint | Method | Description |
|----------|--------|-------------|
| /templates | GET | List all templates |
| /templates/{id} | GET | Get template |
| /templates | POST | Create template |
| /templates/{id} | PUT | Update template |
| /templates/{id}/render | POST | Render template |
