# Troubleshooting Knowledge Base

## ULMS v2.0 - Common Issues & Solutions

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-GOV-TKB-004 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Operations |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Support Manager |
| Approver | Operations Manager |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Support Team | Initial articles | - |
| 0.5 | 2026-01-20 | Dev Team | Technical additions | - |
| 0.9 | 2026-01-30 | Knowledge Manager | Organization | - |
| 1.0 | 2026-02-05 | Support Manager | Final release | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Authentication Issues](#2-authentication-issues)
3. [Database Issues](#3-database-issues)
4. [Performance Issues](#4-performance-issues)
5. [Integration Issues](#5-integration-issues)
6. [UI/Frontend Issues](#6-uifrontend-issues)
7. [API Issues](#7-api-issues)
8. [Deployment Issues](#8-deployment-issues)
9. [Data Issues](#9-data-issues)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This knowledge base contains solutions to common issues encountered in ULMS v2.0 production environment.

### 1.2 Organization

Issues are organized by category and include:
- Symptoms
- Root causes
- Diagnostic steps
- Solutions
- Prevention measures

---

## 2. Authentication Issues

### KB-AUTH-001: Login Loop / Continuous Redirect

**Symptoms:**
- User enters credentials and is redirected back to login
- No error message displayed
- Occurs after password change

**Root Causes:**
1. Session cookie conflict
2. Browser cache issue
3. Keycloak session mismatch
4. Clock skew between servers

**Diagnostic Steps:**
```bash
# Check Keycloak logs
kubectl logs deployment/keycloak -n ulms-production | grep -i session

# Verify time sync
date && kubectl exec deployment/keycloak -- date

# Check user session in database
psql -c "SELECT * FROM user_sessions WHERE user_id = 'xxx' ORDER BY created_at DESC;"
```

**Solution:**
1. Clear browser cache and cookies
2. Try incognito/private mode
3. If persists, clear Keycloak sessions:
   ```sql
   DELETE FROM keycloak_session WHERE user_id = 'xxx';
   ```
4. Verify NTP synchronization on all servers

**Prevention:**
- Configure session timeout warnings
- Implement automatic session cleanup

---

### KB-AUTH-002: "Account Disabled" Error

**Symptoms:**
- User cannot login
- Error message: "Account disabled"

**Root Causes:**
1. Account manually disabled by admin
2. Automatic lockout after failed attempts
3. Employee termination

**Solution:**
1. Check user status in admin panel
2. If locked due to failed attempts:
   ```sql
   UPDATE users SET failed_attempts = 0, locked = false, 
   locked_until = NULL WHERE username = 'user@bank.com';
   ```
3. If terminated, verify with HR before re-enabling

---

## 3. Database Issues

### KB-DB-001: Connection Pool Exhausted

**Symptoms:**
- "Cannot get connection from pool" errors
- Application timeouts
- Slow response times

**Diagnostic Steps:**
```bash
# Check active connections
psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check connection pool status
kubectl exec deployment/ulms-api -- curl localhost:8080/actuator/metrics/jdbc.connections.active

# Check for idle connections
psql -c "SELECT pid, usename, application_name, state, state_change 
         FROM pg_stat_activity 
         WHERE state = 'idle' 
         AND state_change < NOW() - INTERVAL '1 hour';"
```

**Solution:**
1. Kill idle connections:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle' 
   AND state_change < NOW() - INTERVAL '1 hour';
   ```

2. Increase pool size temporarily:
   ```yaml
   spring.datasource.hikari.maximum-pool-size: 30
   ```

3. Restart application pods to clear stuck connections

**Prevention:**
- Set connection timeout appropriately
- Implement connection leak detection
- Use PgBouncer for connection pooling

---

### KB-DB-002: Slow Query Performance

**Symptoms:**
- Reports taking too long
- Timeout errors on specific operations
- High CPU on database server

**Diagnostic Steps:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname as column
FROM pg_stats 
WHERE schemaname = 'public'
AND n_tup_read > 10000
AND n_tup_fetch < n_tup_read * 0.1;

-- Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solution:**
1. Add missing indexes:
   ```sql
   CREATE INDEX CONCURRENTLY idx_loan_applications_customer_id 
   ON loan_applications(customer_id);
   ```

2. Update table statistics:
   ```sql
   ANALYZE loan_applications;
   ```

3. Optimize specific queries (escalate to DBA)

4. Archive old data if table is too large

---

## 4. Performance Issues

### KB-PERF-001: High Memory Usage

**Symptoms:**
- Pods being OOMKilled
- Memory usage constantly increasing
- Garbage collection warnings

**Diagnostic Steps:**
```bash
# Check memory usage by pod
kubectl top pods -n ulms-production --sort-by=memory

# Check JVM memory (if applicable)
kubectl exec <pod> -- jstat -gc <pid>

# Heap dump analysis (if needed)
kubectl exec <pod> -- jmap -dump:format=b,file=/tmp/heap.hprof <pid>
```

**Solution:**
1. Increase memory limits temporarily:
   ```yaml
   resources:
     limits:
       memory: "2Gi"
   ```

2. If memory leak suspected:
   - Restart pods
   - Enable detailed GC logging
   - Schedule heap dump analysis

3. Optimize cache configuration

---

### KB-PERF-002: API Response Time Degradation

**Symptoms:**
- Users reporting slowness
- Response time > 5 seconds
- Timeout errors

**Diagnostic Steps:**
```bash
# Check recent logs for slow requests
kubectl logs deployment/ulms-api -n ulms-production | grep "elapsed"

# Check external dependencies
curl -w "@curl-format.txt" https://cib.bb.org.bd/health
curl -w "@curl-format.txt" https://cbs.bank.com/health

# Database query times
psql -c "SELECT query, mean_exec_time FROM pg_stat_statements 
         ORDER BY mean_exec_time DESC LIMIT 5;"
```

**Solution:**
1. Scale horizontally:
   ```bash
   kubectl scale deployment ulms-api --replicas=5 -n ulms-production
   ```

2. Enable caching for frequently accessed data

3. Optimize slow database queries

4. Check for external service issues

---

## 5. Integration Issues

### KB-INT-001: CIB Connection Timeout

**Symptoms:**
- Credit bureau queries failing
- Error: "Connection timeout"
- Users cannot check credit history

**Diagnostic Steps:**
```bash
# Check network connectivity
ping cib.bb.org.bd
traceroute cib.bb.org.bd

# Check SSL certificate
echo | openssl s_client -connect cib.bb.org.bd:443 2>/dev/null | openssl x509 -noout -dates

# Check CIB service from application
kubectl exec deployment/ulms-api -- curl -v https://cib.bb.org.bd/health
```

**Solution:**
1. If network issue:
   - Check firewall rules
   - Verify proxy configuration
   - Contact network team

2. If certificate expired:
   - Update CIB client certificate
   - Restart application

3. If Bangladesh Bank service down:
   - Enable offline queue mode
   - Notify users of delay
   - Retry periodically

---

### KB-INT-002: CBS Synchronization Failures

**Symptoms:**
- Transactions not appearing in CBS
- Reconciliation mismatches
- Message queue backlog

**Diagnostic Steps:**
```bash
# Check Kafka queue depth
kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group cbs-sync

# Check failed messages
kubectl logs deployment/ulms-worker -n ulms-production | grep -i "cbs.*error"

# Check CBS connectivity
kubectl exec deployment/ulms-api -- curl https://cbs.bank.com/health
```

**Solution:**
1. Retry failed messages from dead letter queue

2. If CBS is down:
   - Queue messages for later sync
   - Enable manual reconciliation mode

3. If data validation error:
   - Review failed message payload
   - Fix data and retry

---

## 6. UI/Frontend Issues

### KB-UI-001: Page Not Loading / Blank Screen

**Symptoms:**
- White screen after login
- Loading spinner never completes
- Console errors in browser

**Diagnostic Steps:**
1. Open browser developer tools (F12)
2. Check Console for JavaScript errors
3. Check Network tab for failed requests
4. Try hard refresh (Ctrl+F5)

**Common Solutions:**

| Error | Solution |
|-------|----------|
| "Cannot read property of undefined" | Clear browser cache |
| "Chunk load error" | Refresh page, check CDN |
| 404 on API calls | Verify API is running |
| CORS errors | Check API configuration |
| White screen | Check for ad-blocker interference |

---

### KB-UI-002: Form Validation Not Working

**Symptoms:**
- Submit button disabled incorrectly
- Validation errors not showing
- Form submits with invalid data

**Solution:**
1. Check field names match validation schema
2. Verify Zod schema is correct
3. Check for console errors
4. Ensure React Hook Form is properly configured

---

## 7. API Issues

### KB-API-001: 500 Internal Server Error

**Symptoms:**
- API returns 500 status
- Generic error message
- Multiple endpoints affected

**Diagnostic Steps:**
```bash
# Check application logs
kubectl logs deployment/ulms-api -n ulms-production --tail=100 | grep ERROR

# Check for recent deployments
kubectl rollout history deployment/ulms-api -n ulms-production

# Check database connectivity from pod
kubectl exec deployment/ulms-api -- pg_isready -h postgresql
```

**Solution:**
1. If database connection issue:
   - Check database status
   - Verify credentials
   - Restart connection pool

2. If recent deployment:
   - Review deployment changes
   - Consider rollback if critical

3. If memory issue:
   - Restart pods
   - Increase memory limits

---

### KB-API-002: 403 Forbidden Errors

**Symptoms:**
- User gets 403 when accessing feature
- "Access denied" message
- Occurs for specific roles

**Solution:**
1. Check user permissions in Keycloak
2. Verify role mappings
3. Check if permission was recently changed
4. Review resource authorization settings

---

## 8. Deployment Issues

### KB-DEP-001: Pod CrashLoopBackOff

**Symptoms:**
- Pod status shows CrashLoopBackOff
- Application not starting
- Logs show startup errors

**Diagnostic Steps:**
```bash
# Check pod events
kubectl describe pod <pod-name> -n ulms-production

# Check previous container logs
kubectl logs <pod-name> -n ulms-production --previous

# Check resource limits
kubectl get pod <pod-name> -o yaml | grep -A 5 resources
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Out of memory | Increase memory limit |
| Application error | Fix code, rebuild |
| Config error | Verify ConfigMap/Secrets |
| Database unavailable | Wait for DB, add init container |
| Liveness probe failing | Adjust probe settings |

---

### KB-DEP-002: Image Pull Error

**Symptoms:**
- ErrImagePull status
- ImagePullBackOff
- Cannot start pod

**Solution:**
1. Verify image tag exists in registry
2. Check image pull secrets
3. Verify network connectivity to registry
4. Check if registry is accessible

---

## 9. Data Issues

### KB-DATA-001: Duplicate Records

**Symptoms:**
- Multiple entries for same customer/loan
- Data inconsistencies
- Report totals incorrect

**Solution:**
1. Identify duplicates:
   ```sql
   SELECT customer_id, COUNT(*) 
   FROM customers 
   GROUP BY customer_id 
   HAVING COUNT(*) > 1;
   ```

2. Merge or delete duplicates (with business approval)

3. Add unique constraints to prevent future duplicates

---

### KB-DATA-002: Incorrect Interest Calculation

**Symptoms:**
- Loan interest amounts don't match expectations
- Discrepancy in reports
- Customer complaints

**Diagnostic Steps:**
1. Verify interest rate in loan record
2. Check calculation method (flat/reducing)
3. Verify number of days calculation
4. Check for manual adjustments

**Solution:**
- Document calculation methodology
- Fix calculation if bug found
- Adjust affected records if needed

---

## 10. Appendices

### Appendix A: Quick Diagnostic Commands

```bash
# Check all pods
kubectl get pods -n ulms-production

# Check pod logs
kubectl logs deployment/ulms-api -n ulms-production --tail=100 -f

# Check events
kubectl get events -n ulms-production --sort-by='.lastTimestamp'

# Database check
psql -h prod-db.bank.com -c "SELECT version();"

# Redis check
redis-cli -h prod-redis.bank.com ping

# API health check
curl -s https://api.ulms.bank.com/actuator/health | jq
```

### Appendix B: Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| AUTH-001 | Invalid credentials | Reset password |
| AUTH-002 | Account locked | Unlock account |
| DB-001 | Connection failed | Check DB status |
| DB-002 | Query timeout | Optimize query |
| API-001 | Rate limited | Reduce request rate |
| INT-001 | CIB unavailable | Retry later |

### Appendix C: Escalation Matrix

| Issue Type | Escalate To | When |
|------------|-------------|------|
| Data corruption | DBA + Tech Lead | Immediate |
| Security incident | CISO | Immediate |
| Performance issue | DevOps Lead | After initial diagnostics |
| Complex bug | Development Team | After reproduction |

### Appendix D: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Procedures | ULMS-OPS-IRP-002 | 8.2_Operations_Support/ |
| Production Support Runbook | ULMS-OPS-PSR-004 | 8.2_Operations_Support/ |
| Database Administration Guide | ULMS-SYS-DBA-002 | 8.5_System_Documentation/ |

---

**Document Control Footer**

*Classification: Internal - Operations*
*Next Review: Monthly*
*Owner: Support Manager*

**END OF DOCUMENT**
