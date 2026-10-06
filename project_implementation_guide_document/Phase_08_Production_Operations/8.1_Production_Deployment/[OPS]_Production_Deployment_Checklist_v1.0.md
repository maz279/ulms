# Production Deployment Checklist

## ULMS v2.0 - Bangladesh Banking Sector

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-PDCL-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Bank Confidential |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Operations Manager, ULMS Project |
| Approver | CTO, Unisoft Systems Limited |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-15 | Operations Team | Initial draft | - |
| 0.5 | 2026-01-25 | Technical Lead | Added compliance checks | - |
| 0.9 | 2026-01-30 | QA Manager | Added validation procedures | - |
| 1.0 | 2026-02-05 | Operations Manager | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Pre-Deployment Phase](#2-pre-deployment-phase)
3. [Infrastructure Readiness](#3-infrastructure-readiness)
4. [Application Deployment](#4-application-deployment)
5. [Data Migration Verification](#5-data-migration-verification)
6. [Security Validation](#6-security-validation)
7. [Performance Testing](#7-performance-testing)
8. [Go-Live Authorization](#8-go-live-authorization)
9. [Post-Deployment Verification](#9-post-deployment-verification)
10. [Emergency Contacts](#10-emergency-contacts)
11. [Appendices](#11-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive checklist for the production deployment of the Unisoft Loan Management System (ULMS) v2.0. It ensures all prerequisites are met before go-live and establishes a repeatable process for future deployments.

### 1.2 Scope
- **In Scope**: All production deployment activities for ULMS v2.0
- **Out of Scope**: Development and UAT environment deployments
- **Target Audience**: DevOps Engineers, System Administrators, Operations Team

### 1.3 Compliance Requirements
- Bangladesh Bank BRPD Circular 15/2024 compliance
- ICT Security Guidelines V4.0 adherence
- ISO 27001 security standards
- PCI-DSS data protection requirements

### 1.4 Document Dependencies
- [OPS]_Release_Management_Process_v1.0.md
- [OPS]_Rollback_Procedures_v1.0.md
- [SYS]_System_Administration_Manual_v1.0.md

---

## 2. Pre-Deployment Phase

### 2.1 Planning & Authorization Checklist

| Item | Description | Owner | Status | Date |
|------|-------------|-------|--------|------|
| 2.1.1 | CAB (Change Advisory Board) approval obtained | Project Manager | ☐ | |
| 2.1.2 | Deployment window scheduled and communicated | Operations Lead | ☐ | |
| 2.1.3 | Risk assessment completed and approved | Risk Manager | ☐ | |
| 2.1.4 | Rollback plan documented and tested | DevOps Lead | ☐ | |
| 2.1.5 | Business continuity plan activated | BCP Coordinator | ☐ | |
| 2.1.6 | Stakeholder notification sent (48 hours prior) | PMO | ☐ | |
| 2.1.7 | Vendor support arranged (Unisoft, Infrastructure) | Vendor Manager | ☐ | |
| 2.1.8 | Deployment team roster confirmed | Operations Lead | ☐ | |

### 2.2 Documentation Readiness

| Item | Description | Owner | Status | Date |
|------|-------------|-------|--------|------|
| 2.2.1 | Release notes finalized and approved | Product Owner | ☐ | |
| 2.2.2 | Deployment architecture diagram updated | Solution Architect | ☐ | |
| 2.2.3 | Configuration management database (CMDB) updated | CMDB Admin | ☐ | |
| 2.2.4 | User acceptance testing (UAT) sign-off received | QA Lead | ☐ | |
| 2.2.5 | Security assessment report completed | CISO | ☐ | |
| 2.2.6 | Performance baseline established | Performance Engineer | ☐ | |
| 2.2.7 | Operational runbooks updated | Operations Lead | ☐ | |

---

## 3. Infrastructure Readiness

### 3.1 Hardware & Network Verification

| Item | Description | Target | Actual | Status |
|------|-------------|--------|--------|--------|
| 3.1.1 | Application servers provisioned | 4x (2 App, 2 API) | | ☐ |
| 3.1.2 | Database servers configured | 2x (Primary-Replica) | | ☐ |
| 3.1.3 | Load balancer configured and tested | HAProxy/NGINX | | ☐ |
| 3.1.4 | Network segments isolated (DMZ, App, DB) | 3 VLANs | | ☐ |
| 3.1.5 | Firewall rules validated | Per security policy | | ☐ |
| 3.1.6 | SSL/TLS certificates installed | Valid > 90 days | | ☐ |
| 3.1.7 | CDN configuration verified | CloudFlare/AWS | | ☐ |
| 3.1.8 | DNS records updated and propagated | A, CNAME, MX | | ☐ |

### 3.2 Kubernetes Cluster Verification

| Item | Description | Command/Check | Status |
|------|-------------|---------------|--------|
| 3.2.1 | Cluster nodes healthy | `kubectl get nodes` | ☐ |
| 3.2.2 | CoreDNS functioning | `kubectl get pods -n kube-system` | ☐ |
| 3.2.3 | Storage classes available | `kubectl get sc` | ☐ |
| 3.2.4 | Ingress controller ready | `kubectl get pods -n ingress-nginx` | ☐ |
| 3.2.5 | Monitoring stack deployed | Prometheus + Grafana | ☐ |
| 3.2.6 | Logging stack configured | ELK/Loki + Grafana | ☐ |
| 3.2.7 | Resource quotas set | Per namespace | ☐ |
| 3.2.8 | Network policies applied | Default deny + allow | ☐ |

### 3.3 Database Readiness

| Item | Description | Verification | Status |
|------|-------------|------------|--------|
| 3.3.1 | PostgreSQL primary instance ready | Connection test | ☐ |
| 3.3.2 | Replica instance synchronized | `pg_stat_replication` | ☐ |
| 3.3.3 | Backup strategy validated | Automated backup test | ☐ |
| 3.3.4 | PITR (Point-in-Time Recovery) configured | WAL archiving | ☐ |
| 3.3.5 | Redis cluster operational | `redis-cli cluster info` | ☐ |
| 3.3.6 | Database migrations tested | Flyway/Liquibase | ☐ |
| 3.3.7 | Connection pooling configured | PgBouncer | ☐ |
| 3.3.8 | Query performance baseline captured | pgBadger report | ☐ |

---

## 4. Application Deployment

### 4.1 Container Registry & Images

| Item | Description | Verification | Status |
|------|-------------|------------|--------|
| 4.1.1 | Images pushed to registry | Harbor/Nexus/ECR | ☐ |
| 4.1.2 | Image signatures verified | Cosign/Notary | ☐ |
| 4.1.3 | Image vulnerabilities scanned | Trivy/Snyk | ☐ |
| 4.1.4 | Image tags match release version | Semantic versioning | ☐ |
| 4.1.5 | Pull secrets configured | Kubernetes secret | ☐ |

### 4.2 Backend Services Deployment

| Service | Image Tag | Replicas | Health Check | Status |
|---------|-----------|----------|--------------|--------|
| ULMS-API | v2.0.0 | 3 | /actuator/health | ☐ |
| ULMS-Workflow | v2.0.0 | 2 | /health | ☐ |
| ULMS-Report | v2.0.0 | 2 | /health | ☐ |
| ULMS-CIB | v2.0.0 | 2 | /health | ☐ |
| ULMS-Notification | v2.0.0 | 2 | /health | ☐ |
| Apache Fineract | 1.10.0 | 2 | /fineract-provider/actuator/health | ☐ |
| Camunda Platform | 8.3.0 | 2 | /engine-rest/engine | ☐ |

### 4.3 Frontend Deployment

| Item | Description | Verification | Status |
|------|-------------|------------|--------|
| 4.3.1 | React application built | Production build | ☐ |
| 4.3.2 | Static assets uploaded to CDN | AWS S3/CloudFront | ☐ |
| 4.3.3 | Environment variables configured | .env.production | ☐ |
| 4.3.4 | Service worker registered | PWA verification | ☐ |
| 4.3.5 | Bundle size optimized | < 500KB initial | ☐ |

---

## 5. Data Migration Verification

### 5.1 Pre-Migration Checks

| Item | Description | Status |
|------|-------------|--------|
| 5.1.1 | Source system backup completed | ☐ |
| 5.1.2 | Data mapping document validated | ☐ |
| 5.1.3 | Migration scripts reviewed | ☐ |
| 5.1.4 | Rollback scripts prepared | ☐ |
| 5.1.5 | Data quality rules defined | ☐ |

### 5.2 Migration Execution

| Data Category | Records Count | Migration Status | Validation Status |
|---------------|---------------|------------------|-------------------|
| Customer Master | _______ | ☐ | ☐ |
| Loan Accounts | _______ | ☐ | ☐ |
| Collateral Data | _______ | ☐ | ☐ |
| Repayment History | _______ | ☐ | ☐ |
| User Accounts | _______ | ☐ | ☐ |
| Configuration Data | _______ | ☐ | ☐ |

### 5.3 Post-Migration Validation

| Item | Description | Query/Method | Status |
|------|-------------|--------------|--------|
| 5.3.1 | Record count reconciliation | Source vs Target | ☐ |
| 5.3.2 | Referential integrity check | Foreign key validation | ☐ |
| 5.3.3 | Critical field validation | Checksums/hashing | ☐ |
| 5.3.4 | Business rule validation | Sample transaction test | ☐ |
| 5.3.5 | Audit trail preserved | Created/Updated timestamps | ☐ |

---

## 6. Security Validation

### 6.1 Authentication & Authorization

| Item | Description | Test Method | Status |
|------|-------------|-------------|--------|
| 6.1.1 | Keycloak realm configured | Admin console | ☐ |
| 6.1.2 | LDAP/AD integration tested | Login test | ☐ |
| 6.1.3 | MFA enabled for admin users | TOTP/SMS | ☐ |
| 6.1.4 | Role mappings validated | RBAC matrix | ☐ |
| 6.1.5 | API gateway authentication | JWT validation | ☐ |
| 6.1.6 | Session timeout configured | 30 minutes idle | ☐ |
| 6.1.7 | Password policy enforced | Complexity rules | ☐ |
| 6.1.8 | Account lockout configured | 5 failed attempts | ☐ |

### 6.2 Encryption & Data Protection

| Item | Description | Verification | Status |
|------|-------------|------------|--------|
| 6.2.1 | TLS 1.3 enforced | SSL Labs test | ☐ |
| 6.2.2 | Database encryption at rest | TDE enabled | ☐ |
| 6.2.3 | Database encryption in transit | SSL connections | ☐ |
| 6.2.4 | Secrets encrypted in Vault | HashiCorp Vault | ☐ |
| 6.2.5 | API payload encryption | JWE for sensitive data | ☐ |
| 6.2.6 | Backup encryption | AES-256 | ☐ |

### 6.3 Security Scanning

| Scan Type | Tool | Last Run | Critical | High | Status |
|-----------|------|----------|----------|------|--------|
| SAST | SonarQube | _______ | 0 | 0 | ☐ |
| DAST | OWASP ZAP | _______ | 0 | 0 | ☐ |
| Container Scan | Trivy | _______ | 0 | 0 | ☐ |
| Dependency Scan | Snyk | _______ | 0 | 0 | ☐ |
| Penetration Test | External Vendor | _______ | 0 | 0 | ☐ |

---

## 7. Performance Testing

### 7.1 Load Test Results

| Scenario | Target TPS | Actual TPS | Response Time | Error Rate | Status |
|----------|------------|------------|---------------|------------|--------|
| Login | 100 | | < 2s | < 0.1% | ☐ |
| Loan Application | 50 | | < 3s | < 0.1% | ☐ |
| Credit Bureau Query | 30 | | < 5s | < 0.5% | ☐ |
| Report Generation | 20 | | < 10s | < 1% | ☐ |
| Bulk Import | 10 | | < 60s | < 0.1% | ☐ |

### 7.2 Stress Test Results

| Metric | Baseline | Peak Load | Recovery Time | Status |
|--------|----------|-----------|---------------|--------|
| CPU Utilization | < 40% | < 80% | < 5 min | ☐ |
| Memory Usage | < 60% | < 85% | < 5 min | ☐ |
| DB Connections | < 50 | < 100 | < 2 min | ☐ |
| Queue Depth | < 1000 | < 5000 | < 10 min | ☐ |

---

## 8. Go-Live Authorization

### 8.1 Sign-Off Requirements

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | _________________ | _______ |
| Project Manager | | _________________ | _______ |
| Technical Lead | | _________________ | _______ |
| QA Lead | | _________________ | _______ |
| Security Officer | | _________________ | _______ |
| Operations Manager | | _________________ | _______ |
| Business Owner (Bank) | | _________________ | _______ |
| IT Head (Bank) | | _________________ | _______ |

### 8.2 Go/No-Go Criteria

| Criterion | Threshold | Actual | Decision |
|-----------|-----------|--------|----------|
| Critical bugs open | 0 | | ☐ Go ☐ No-Go |
| High bugs open | ≤ 2 | | ☐ Go ☐ No-Go |
| Security vulnerabilities (Critical) | 0 | | ☐ Go ☐ No-Go |
| Test coverage | ≥ 80% | | ☐ Go ☐ No-Go |
| Performance SLA met | Yes | | ☐ Go ☐ No-Go |
| All checklists completed | 100% | | ☐ Go ☐ No-Go |

**Overall Decision**: ☐ **GO** ☐ **NO-GO** ☐ **GO with CONDITIONS**

Conditions (if any): ________________________________________________

---

## 9. Post-Deployment Verification

### 9.1 Smoke Tests (0-2 Hours)

| Test Case | Expected Result | Actual Result | Status |
|-----------|-----------------|---------------|--------|
| Homepage loads | < 3 seconds | | ☐ |
| User login | Successful | | ☐ |
| Dashboard displays | Data visible | | ☐ |
| Navigation works | All menus accessible | | ☐ |
| Logout functions | Session cleared | | ☐ |

### 9.2 Business Process Validation (2-4 Hours)

| Process | Test Account | Expected Result | Status |
|---------|--------------|-----------------|--------|
| New loan application | Test-001 | Application created | ☐ |
| Credit bureau check | Test-001 | CIB report received | ☐ |
| Loan approval workflow | Test-001 | Status updated | ☐ |
| Disbursement recording | Test-001 | Entry posted | ☐ |
| Repayment processing | Test-001 | Balance updated | ☐ |
| Report generation | Test-001 | Report generated | ☐ |

### 9.3 Integration Validation (4-8 Hours)

| Integration | Test Transaction | Status | Remarks |
|-------------|------------------|--------|---------|
| CIB Online | Inquiry sent | ☐ | |
| Bangladesh Bank Reporting | Report submitted | ☐ | |
| Core Banking | Account sync | ☐ | |
| SMS Gateway | Message sent | ☐ | |
| Email Service | Email delivered | ☐ | |
| Payment Gateway | Transaction processed | ☐ | |

### 9.4 Monitoring Validation (8-24 Hours)

| Metric | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| Application uptime | 99.9% | | ☐ |
| Error rate | < 0.1% | | ☐ |
| Average response time | < 2s | | ☐ |
| Database connections | < 80% max | | ☐ |
| Disk space usage | < 70% | | ☐ |
| Memory usage | < 80% | | ☐ |

---

## 10. Emergency Contacts

### 10.1 Internal Team (Unisoft)

| Role | Name | Mobile | Email | Escalation Level |
|------|------|--------|-------|------------------|
| Project Manager | | +880-__________ | | Level 1 |
| Technical Lead | | +880-__________ | | Level 1 |
| DevOps Lead | | +880-__________ | | Level 2 |
| Operations Manager | | +880-__________ | | Level 2 |
| CTO | | +880-__________ | | Level 3 |

### 10.2 Bank IT Team

| Role | Name | Mobile | Email | Escalation Level |
|------|------|--------|-------|------------------|
| IT Head | | +880-__________ | | Level 1 |
| Infrastructure Lead | | +880-__________ | | Level 1 |
| Application Manager | | +880-__________ | | Level 2 |
| CIO | | +880-__________ | | Level 3 |

### 10.3 Third-Party Vendors

| Vendor | Service | Contact | Mobile | Email |
|--------|---------|---------|--------|-------|
| Bangladesh Bank | CIB Support | | +880-__________ | |
| Cloud Provider | Infrastructure | | +880-__________ | |
| Security Vendor | SOC | | +880-__________ | |

---

## 11. Appendices

### Appendix A: Deployment Command Reference

```bash
# Verify cluster connectivity
kubectl cluster-info

# Deploy application stack
kubectl apply -k overlays/production/

# Verify deployment status
kubectl get pods -n ulms-production
kubectl get svc -n ulms-production
kubectl get ingress -n ulms-production

# Check logs
kubectl logs -f deployment/ulms-api -n ulms-production

# Database migration
./migrate.sh --environment=production --version=latest
```

### Appendix B: Quick Health Check Commands

```bash
# API Health
curl -s https://api.ulms.bank.com/actuator/health | jq

# Database connectivity
psql -h prod-db.bank.com -U ulms_app -c "SELECT version();"

# Redis connectivity
redis-cli -h prod-redis.bank.com ping

# SSL Certificate expiry
echo | openssl s_client -servername api.ulms.bank.com -connect api.ulms.bank.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Appendix C: Related Documents

| Document ID | Document Name | Location |
|-------------|---------------|----------|
| ULMS-OPS-RM-001 | Release Management Process | 8.1_Release_Management/ |
| ULMS-OPS-RB-001 | Rollback Procedures | 8.1_Rollback_Procedures/ |
| ULMS-SYS-ADM-001 | System Administration Manual | 8.5_System_Documentation/ |
| ULMS-COMP-BRPD-001 | BRPD 15/2024 Compliance | 8.4_Compliance_Regulatory/ |

### Appendix D: Compliance Mapping

| Regulation | Requirement | Checklist Reference | Evidence |
|------------|-------------|---------------------|----------|
| BRPD 15/2024 | System audit trail | 6.1, 9.2 | Audit logs |
| ICT Security V4.0 | Access controls | 6.1, 6.2 | Keycloak config |
| Basel III | Data integrity | 5.3 | Migration logs |
| IFRS-9 | Data retention | 3.3 | Backup policy |

---

**Document Control Footer**

*This document is the property of Unisoft Systems Limited and the client bank. Unauthorized distribution is prohibited.*

*Next Review Date: [Quarterly from Effective Date]*
*Distribution: Operations Team, Project Team, Bank IT, Compliance Officer*

**END OF DOCUMENT**
