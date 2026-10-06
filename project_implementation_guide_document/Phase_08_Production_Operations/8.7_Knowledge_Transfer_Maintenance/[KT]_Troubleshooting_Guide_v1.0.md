# Troubleshooting Guide

## ULMS v2.0 - Developer Troubleshooting

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-KT-TSG-004 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Support Lead |
| Approver | Operations Manager |

---

## Common Development Issues

### Build Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Gradle build fails | Dependencies not resolved | `./gradlew clean build --refresh-dependencies` |
| Compilation errors | Lombok not working | Enable annotation processing in IDE |
| Test failures | Database not running | Start Docker containers |
| Out of memory | Heap size too small | Increase Gradle heap: `org.gradle.jvmargs=-Xmx2g` |

### Runtime Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Application won't start | Port 8080 in use | Change port: `server.port=8081` |
| Database connection failed | Wrong credentials | Check `application-dev.yml` |
| Bean creation errors | Circular dependencies | Use `@Lazy` or refactor |
| 403 errors | Missing permissions | Check security configuration |

### IDE Issues

| Issue | Solution |
|-------|----------|
| Imports not working | Invalidate caches: File → Invalidate Caches |
| Lombok errors | Enable: Settings → Build → Annotation Processors |
| Debug not stopping | Check breakpoint is not muted |
| Slow performance | Increase IDE heap size |

---

**END OF DOCUMENT**
