# Incident Response Procedures

## ULMS v2.0 - Step-by-Step Response Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-IRP-002 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Operations |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Operations Manager |
| Approver | CTO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-12 | Operations Team | Initial draft | - |
| 0.5 | 2026-01-22 | Security Team | Added playbooks | - |
| 0.9 | 2026-01-30 | Senior Ops | Final review | - |
| 1.0 | 2026-02-05 | Operations Manager | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Response Playbooks](#2-response-playbooks)
3. [System Outage Response](#3-system-outage-response)
4. [Database Failure Response](#4-database-failure-response)
5. [Security Breach Response](#5-security-breach-response)
6. [Performance Degradation Response](#6-performance-degradation-response)
7. [Integration Failure Response](#7-integration-failure-response)
8. [Communication Templates](#8-communication-templates)
9. [Escalation Matrix](#9-escalation-matrix)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document provides step-by-step procedures for responding to common operational incidents in the ULMS v2.0 production environment.

### 1.2 Scope
- System outages and degradations
- Database failures
- Security incidents
- Integration failures
- Performance issues

### 1.3 Response Times

| Severity | Acknowledgment | Initial Response | Resolution Target |
|----------|----------------|------------------|-------------------|
| P1 - Critical | 5 minutes | 15 minutes | 2 hours |
| P2 - High | 15 minutes | 30 minutes | 4 hours |
| P3 - Medium | 30 minutes | 2 hours | 8 hours |
| P4 - Low | 1 hour | 4 hours | 24 hours |

---

## 2. Response Playbooks

### 2.1 Incident Response Template

Each incident response follows this structure:

```
INCIDENT: [Name]
SEVERITY: [P1/P2/P3/P4]

DETECTION:
- Symptoms: 
- Monitoring alerts:
- User reports:

INITIAL ASSESSMENT:
1. [ ] Confirm incident scope
2. [ ] Identify affected systems
3. [ ] Assess business impact
4. [ ] Assign severity

IMMEDIATE ACTIONS:
1. [ ] Action 1
2. [ ] Action 2
3. [ ] Action 3

DIAGNOSIS:
- Check A: [command/procedure]
- Check B: [command/procedure]
- Check C: [command/procedure]

RESOLUTION:
- Fix A: [procedure]
- Fix B: [procedure]

VERIFICATION:
- [ ] Service restored
- [ ] Monitoring green
- [ ] Users notified
```

---

## 3. System Outage Response

### 3.1 Complete System Outage

```
INCIDENT: Complete System Outage
SEVERITY: P1 - Critical

DETECTION:
- Symptoms: All services unreachable, health checks failing
- Monitoring alerts: ULMSDown, multiple service failures
- User reports: Cannot access system

INITIAL ASSESSMENT (5 minutes):
1. [ ] Check if outage is network-wide or ULMS-specific
   $ ping gateway.bank.local
   $ curl -s https://api.ulms.bank.com/actuator/health
   
2. [ ] Check Kubernetes cluster status
   $ kubectl get nodes
   $ kubectl cluster-info
   
3. [ ] Check if other bank systems are affected
   [Contact network team]

IMMEDIATE ACTIONS (10 minutes):
1. [ ] If cluster is down:
   - Check infrastructure (VMs, network, storage)
   - Contact infrastructure team
   
2. [ ] If cluster is up but pods are down:
   $ kubectl get pods -n ulms-production --all-namespaces
   
   If CrashLoopBackOff:
   $ kubectl describe pod <pod-name> -n ulms-production
   $ kubectl logs <pod-name> -n ulms-production --previous
   
3. [ ] Check resource exhaustion:
   $ kubectl top nodes
   $ df -h
   $ free -h

DIAGNOSIS:
- Check A: Node status
  $ kubectl get nodes -o wide
  
- Check B: Pod events
  $ kubectl get events -n ulms-production --sort-by='.lastTimestamp'
  
- Check C: Resource usage
  $ kubectl top pods -n ulms-production
  
- Check D: Recent changes
  $ kubectl rollout history deployment/ulms-api -n ulms-production

RESOLUTION:
Scenario A: Resource exhaustion
- Scale up: kubectl scale deployment ulms-api --replicas=5 -n ulms-production
- Add nodes: [Contact cloud provider]

Scenario B: Application crash
- Rollback: kubectl rollout undo deployment/ulms-api -n ulms-production
- Monitor: kubectl rollout status deployment/ulms-api -n ulms-production

Scenario C: Infrastructure failure
- Activate DR site
- Update DNS to point to DR
- [Follow DR procedures]

Scenario D: Network issue
- Check firewall rules
- Verify load balancer health
- Check SSL certificates

VERIFICATION:
- [ ] Health endpoint returns 200
  $ curl -s https://api.ulms.bank.com/actuator/health
  
- [ ] Key transactions working
  [Run smoke tests]
  
- [ ] All pods running
  $ kubectl get pods -n ulms-production
  
- [ ] Monitoring dashboards green
  [Check Grafana]
```

### 3.2 Partial Service Outage

```
INCIDENT: Partial Service Outage
SEVERITY: P2 - High

DETECTION:
- Symptoms: Some features unavailable, specific endpoints failing
- Monitoring alerts: Service-specific alerts
- User reports: Specific functionality not working

DIAGNOSIS:
1. Check which services are affected:
   $ kubectl get pods -n ulms-production
   
2. Check service logs:
   $ kubectl logs -f deployment/ulms-api -n ulms-production
   
3. Check service dependencies:
   - Database connectivity
   - External integrations
   - Cache availability

RESOLUTION:
- If specific pod failing:
  $ kubectl delete pod <pod-name> -n ulms-production
  [Pod will be recreated automatically]
  
- If service overloaded:
  $ kubectl scale deployment <service> --replicas=5 -n ulms-production
  
- If dependency issue:
  - Check database: pg_isready
  - Check Redis: redis-cli ping
  - Check external APIs: curl health endpoints
```

---

## 4. Database Failure Response

### 4.1 Primary Database Failure

```
INCIDENT: Primary Database Failure
SEVERITY: P1 - Critical

DETECTION:
- Symptoms: Application errors, connection timeouts
- Monitoring alerts: DatabaseDown, connection pool exhausted
- User reports: System unresponsive

IMMEDIATE ACTIONS:
1. [ ] Confirm primary is down:
   $ sudo systemctl status postgresql@16-main
   $ pg_isready -h prod-db-primary
   
2. [ ] Verify replica status:
   $ pg_isready -h prod-db-replica
   $ sudo -u postgres psql -h prod-db-replica -c "SELECT pg_is_in_recovery();"

3. [ ] If replica is healthy, initiate failover:
   $ sudo -u postgres pg_ctl promote -D /var/lib/postgresql/16/main

DIAGNOSIS:
- Check A: PostgreSQL logs
  $ sudo tail -100 /var/log/postgresql/postgresql-16-main.log
  
- Check B: Disk space
  $ df -h
  
- Check C: Memory usage
  $ free -h
  
- Check D: Lock status
  $ sudo -u postgres psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

RESOLUTION:
Scenario A: Disk full
- Clear old logs: sudo find /var/log -name "*.log.*" -mtime +7 -delete
- Expand volume: [Contact infrastructure team]

Scenario B: Connection exhaustion
- Terminate idle connections:
  $ sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '1 hour';"
- Increase max_connections temporarily

Scenario C: Corruption
- Promote replica to primary
- Rebuild corrupted primary

Scenario D: Hardware failure
- Failover to replica
- Replace failed hardware
- Rebuild primary as replica

POST-FAILOVER:
1. Update application connection strings if needed
2. Update monitoring to reflect new primary
3. Rebuild old primary as replica
4. Document root cause
```

### 4.2 Replication Lag

```
INCIDENT: Database Replication Lag
SEVERITY: P2 - High

DIAGNOSIS:
- Check replication status:
  $ sudo -u postgres psql -c "SELECT 
      client_addr,
      state,
      sent_lsn,
      write_lsn,
      flush_lsn,
      replay_lsn,
      write_lag,
      flush_lag,
      replay_lag 
  FROM pg_stat_replication;"

- Check lag in seconds:
  $ sudo -u postgres psql -c "SELECT 
      CASE 
          WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() 
          THEN 0 
          ELSE EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
      END AS lag_seconds;"

RESOLUTION:
- If network issue: Check network connectivity
- If load issue: Reduce write load or scale up replica
- If configuration issue: Adjust wal_buffers, max_wal_size
```

---

## 5. Security Breach Response

### 5.1 Unauthorized Access Detected

```
INCIDENT: Unauthorized Access Detected
SEVERITY: P1 - Critical

DETECTION:
- Symptoms: Unknown logins, unusual activity patterns
- Monitoring alerts: Failed login spike, privilege escalation
- SIEM alerts: Suspicious behavior detected

IMMEDIATE ACTIONS:
1. [ ] Isolate affected systems
   $ kubectl cordon <affected-node>
   
2. [ ] Disable compromised accounts
   $ kubectl delete user <suspicious-user>
   
3. [ ] Block suspicious IPs
   $ sudo iptables -A INPUT -s <suspicious-ip> -j DROP
   
4. [ ] Preserve evidence
   $ kubectl logs <pod> -n ulms-production > /evidence/logs_$(date +%Y%m%d_%H%M%S).txt
   $ docker save <image> > /evidence/image_$(date +%Y%m%d_%H%M%S).tar

5. [ ] Notify security team and CISO

INVESTIGATION:
1. Review access logs:
   $ grep "suspicious-user" /var/log/ulms/audit/*.log
   
2. Check for data exfiltration:
   - Review database query logs
   - Check file access patterns
   - Review network flow logs
   
3. Identify attack vector:
   - Check for stolen credentials
   - Review recent vulnerabilities
   - Check for malware

CONTAINMENT:
- Rotate all credentials
- Force password reset for all users
- Revoke all sessions
- Enable MFA if not already required

RECOVERY:
- Rebuild affected systems from known-good images
- Restore data from pre-incident backup if corrupted
- Re-enable services after security verification

NOTIFICATION:
- Report to Bangladesh Bank within 1 hour
- Notify affected customers within 72 hours
- Document all actions taken
```

### 5.2 Data Breach Response

```
INCIDENT: Data Breach
SEVERITY: P1 - Critical

IMMEDIATE ACTIONS:
1. [ ] Stop data exfiltration
2. [ ] Preserve evidence
3. [ ] Identify scope of breach
   - What data was accessed?
   - How many records affected?
   - Which customers impacted?
   
4. [ ] Contain breach
5. [ ] Notify stakeholders per Incident Response Plan

ASSESSMENT QUESTIONS:
- Was PII accessed?
- Was financial data accessed?
- Was the data encrypted?
- Can the breach be contained?
- Is the attack ongoing?
```

---

## 6. Performance Degradation Response

### 6.1 Slow Response Times

```
INCIDENT: Slow Response Times
SEVERITY: P2 - High

DETECTION:
- Symptoms: Page load times > 5 seconds
- Monitoring alerts: ResponseTimeHigh
- User reports: System is slow

DIAGNOSIS:
1. Check API response times:
   $ curl -w "@curl-format.txt" -o /dev/null -s https://api.ulms.bank.com/health
   
2. Check database performance:
   $ sudo -u postgres psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
   
3. Check resource usage:
   $ kubectl top pods -n ulms-production
   $ kubectl top nodes
   
4. Check for locks:
   $ sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';"
   
5. Check external dependencies:
   - CIB response time
   - CBS response time
   - SMS gateway response time

RESOLUTION:
Scenario A: Database bottleneck
- Kill blocking queries
- Optimize slow queries
- Add indexes if needed
- Scale database resources

Scenario B: Application bottleneck
- Scale pods horizontally
- Restart memory-leaking pods
- Review recent deployments

Scenario C: External dependency slow
- Enable circuit breaker
- Increase timeout thresholds
- Contact external provider

Scenario D: Resource exhaustion
- Scale cluster
- Clear caches
- Restart services
```

### 6.2 High Error Rate

```
INCIDENT: High Error Rate
SEVERITY: P2 - High

DIAGNOSIS:
1. Check error logs:
   $ kubectl logs deployment/ulms-api -n ulms-production | grep ERROR
   
2. Check error patterns:
   - 5xx errors: Application issue
   - 4xx errors: Client issue or API change
   - Connection errors: Network or dependency issue
   
3. Correlate with recent changes:
   $ kubectl rollout history deployment/ulms-api -n ulms-production

RESOLUTION:
- If deployment-related: Rollback
- If dependency-related: Fix dependency or implement fallback
- If data-related: Fix data issue
- If configuration-related: Restore previous config
```

---

## 7. Integration Failure Response

### 7.1 CIB Integration Failure

```
INCIDENT: CIB Integration Failure
SEVERITY: P2 - High

DETECTION:
- Symptoms: Credit bureau queries failing
- Monitoring alerts: CIBServiceDown
- User reports: Cannot check credit history

DIAGNOSIS:
1. Check CIB service health:
   $ curl -s https://api.ulms.bank.com/health/cib
   
2. Check network connectivity to Bangladesh Bank:
   $ traceroute cib.bb.org.bd
   $ telnet cib.bb.org.bd 443
   
3. Check API credentials:
   $ kubectl get secret cib-credentials -n ulms-production -o yaml
   
4. Check recent CIB queries in logs:
   $ kubectl logs deployment/ulms-api -n ulms-production | grep -i cib

RESOLUTION:
- If network issue: Contact network team and Bangladesh Bank
- If credential issue: Rotate credentials
- If Bangladesh Bank issue: Enable offline mode, queue requests
- If rate limiting: Implement backoff strategy

BUSINESS CONTINUITY:
- Inform users of CIB delay
- Queue credit checks for retry
- Implement manual CIB check process if needed
```

### 7.2 Core Banking Integration Failure

```
INCIDENT: CBS Integration Failure
SEVERITY: P1 - Critical

DIAGNOSIS:
1. Check CBS connectivity
2. Check message queue depth
3. Check CBS service status from bank IT

RESOLUTION:
- Enable message queuing
- Switch to manual reconciliation
- Coordinate with bank IT team
```

---

## 8. Communication Templates

### 8.1 Incident Notification

```
Subject: [INCIDENT] ULMS - [Severity] - [Brief Description]

Impact: [Service/Feature affected]
Start Time: [Timestamp]
Status: [Investigating/Identified/Monitoring/Resolved]

Description:
[What happened and current understanding]

Actions Taken:
[Steps taken so far]

Next Update: [Time]
Incident Commander: [Name and contact]
```

### 8.2 Status Update

```
Subject: [UPDATE] ULMS Incident - [Reference Number]

Status: [Current status]
Elapsed Time: [Duration]

Progress:
- [Update on diagnosis]
- [Update on resolution efforts]
- [Current ETA for resolution]

User Impact:
[Current impact on users]

Next Update: [Time]
```

### 8.3 Resolution Notification

```
Subject: [RESOLVED] ULMS Incident - [Reference Number]

Resolution Time: [Timestamp]
Total Duration: [Duration]

Root Cause:
[Brief explanation]

Resolution:
[How it was fixed]

Prevention:
[Steps to prevent recurrence]

Apologies for any inconvenience caused.
```

---

## 9. Escalation Matrix

### 9.1 Escalation Path

| Time | Action | Contact |
|------|--------|---------|
| 0 min | Acknowledge incident | On-call Engineer |
| 15 min (P1) | Escalate to Tech Lead | Technical Lead |
| 30 min (P1) | Escalate to Operations Manager | Operations Manager |
| 1 hour (P1) | Executive notification | CTO/CIO |
| 2 hours | Board notification (if needed) | Board Secretary |

### 9.2 External Escalation

| Issue | Contact | When |
|-------|---------|------|
| Bangladesh Bank | CERT Team | P1 incident within 1 hour |
| Cloud Provider | Support | Infrastructure issues |
| Security Vendor | SOC | Security incidents |
| Third-party vendors | Support contacts | Integration failures |

---

## 10. Appendices

### Appendix A: Quick Commands

```bash
# Check all pod status
kubectl get pods -n ulms-production

# Check logs
kubectl logs -f deployment/ulms-api -n ulms-production

# Execute into pod
kubectl exec -it <pod-name> -n ulms-production -- /bin/bash

# Scale deployment
kubectl scale deployment ulms-api --replicas=5 -n ulms-production

# Rollback deployment
kubectl rollout undo deployment/ulms-api -n ulms-production

# Check events
kubectl get events -n ulms-production --sort-by='.lastTimestamp'

# Port forward
kubectl port-forward svc/ulms-api 8080:8080 -n ulms-production

# Check resource usage
kubectl top pods -n ulms-production
kubectl top nodes

# Database check
pg_isready -h prod-db.bank.com
redis-cli -h prod-redis.bank.com ping
```

### Appendix B: Runbook Index

| Incident | Section | Page |
|----------|---------|------|
| Complete System Outage | 3.1 | |
| Partial Service Outage | 3.2 | |
| Database Failure | 4.1 | |
| Replication Lag | 4.2 | |
| Security Breach | 5.1 | |
| Data Breach | 5.2 | |
| Performance Degradation | 6.1 | |
| High Error Rate | 6.2 | |
| CIB Integration Failure | 7.1 | |
| CBS Integration Failure | 7.2 | |

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Plan | ULMS-OPS-IRP-001 | 8.2_Operations_Support/ |
| Production Operations Runbook | ULMS-OPS-POR-002 | 8.1_Production_Deployment/ |
| Monitoring Runbook | ULMS-OPS-PMR-003 | 8.1_Production_Deployment/ |

---

**Document Control Footer**

*Classification: Internal - Operations*
*Next Review: Quarterly*
*Owner: Operations Manager*

**END OF DOCUMENT**
