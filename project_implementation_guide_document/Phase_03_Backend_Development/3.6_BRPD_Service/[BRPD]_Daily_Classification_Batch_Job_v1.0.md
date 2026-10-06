**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Daily Classification Batch Job |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Daily Classification Batch Job

## Job Configuration

```java
@Configuration
@EnableBatchProcessing
public class ClassificationBatchConfig {
    
    @Bean
    public Job dailyClassificationJob() {
        return jobBuilderFactory.get("dailyClassificationJob")
            .start(classificationStep())
            .next(provisioningStep())
            .next(reportingStep())
            .build();
    }
    
    @Bean
    public Step classificationStep() {
        return stepBuilderFactory.get("classificationStep")
            .<Loan, ClassificationResult>chunk(100)
            .reader(loanReader())
            .processor(classificationProcessor())
            .writer(classificationWriter())
            .build();
    }
}
```

## Scheduler

```java
@Component
@Slf4j
public class ClassificationJobScheduler {
    
    @Autowired
    private JobLauncher jobLauncher;
    
    @Autowired
    private Job dailyClassificationJob;
    
    @Scheduled(cron = "0 0 1 * * ?", zone = "Asia/Dhaka")
    public void runClassification() throws Exception {
        log.info("Starting daily classification batch job");
        
        JobParameters params = new JobParametersBuilder()
            .addString("date", LocalDate.now().toString())
            .addLong("timestamp", System.currentTimeMillis())
            .toJobParameters();
        
        JobExecution execution = jobLauncher.run(dailyClassificationJob, params);
        
        log.info("Classification job completed with status: {}", 
            execution.getStatus());
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
