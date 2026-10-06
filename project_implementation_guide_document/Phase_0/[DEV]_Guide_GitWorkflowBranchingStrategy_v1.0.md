# Git Workflow & Branching Strategy

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-DEV-0.2.5 |
| **Document Title** | Git Workflow & Branching Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Project Manager |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | Lead Dev | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Branching Model](#2-branching-model)
3. [Branch Naming Conventions](#3-branch-naming-conventions)
4. [Commit Message Standards](#4-commit-message-standards)
5. [Workflow Procedures](#5-workflow-procedures)
6. [Merge Strategies](#6-merge-strategies)
7. [Release Process](#7-release-process)
8. [Hotfix Procedures](#8-hotfix-procedures)
9. [Branch Protection Rules](#9-branch-protection-rules)
10. [GitLab CI Integration](#10-gitlab-ci-integration)
11. [Best Practices](#11-best-practices)

---

## 1. Introduction

### 1.1 Purpose

This document defines the Git workflow and branching strategy for the ULMS v2.0 project. It ensures consistent version control practices across all team members and maintains code quality through structured branching and merging procedures.

### 1.2 Scope

This workflow applies to all ULMS repositories:
- `ulms-backend` - Spring Boot microservices and Fineract customization
- `ulms-frontend` - React/TypeScript web application
- `ulms-mobile` - React Native CPV application
- `ulms-infrastructure` - Kubernetes manifests, Helm charts, CI/CD configs
- `ulms-docs` - Project documentation

### 1.3 Tools

| Tool | Purpose | Version |
|------|---------|---------|
| Git | Version control | 2.43+ |
| GitLab | Repository hosting | Enterprise |
| GitLab CI | Continuous Integration | Latest |
| ArgoCD | GitOps deployment | 2.9+ |

---

## 2. Branching Model

### 2.1 Overview

ULMS follows a modified **GitFlow** model optimized for continuous delivery with a small team.

```
                           ┌─────────────────────────────────────┐
                           │             main                     │
                           │    (Production-ready code)           │
                           └───────────────┬─────────────────────┘
                                           │
                                    Tag: v1.0.0
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         │                          develop                                   │
         │                   (Integration branch)                             │
         └───┬─────────────────┬─────────────────┬───────────────────────────┘
             │                 │                 │
    ┌────────▼────────┐ ┌─────▼─────┐  ┌───────▼───────┐
    │ feature/ULMS-101│ │feature/   │  │ bugfix/       │
    │ -loan-form      │ │ULMS-102-  │  │ ULMS-150-fix  │
    └─────────────────┘ │cib-api    │  │ -validation   │
                        └───────────┘  └───────────────┘
```

### 2.2 Branch Types

| Branch Type | Purpose | Lifetime | Created From | Merges To |
|-------------|---------|----------|--------------|-----------|
| `main` | Production code | Permanent | - | - |
| `develop` | Integration | Permanent | main | main (via release) |
| `feature/*` | New features | Temporary | develop | develop |
| `bugfix/*` | Bug fixes | Temporary | develop | develop |
| `hotfix/*` | Production fixes | Temporary | main | main + develop |
| `release/*` | Release prep | Temporary | develop | main + develop |

### 2.3 Branch Hierarchy

```
main (protected)
  │
  ├── develop (protected)
  │     │
  │     ├── feature/ULMS-XXX-description
  │     │
  │     ├── bugfix/ULMS-XXX-description
  │     │
  │     └── release/vX.Y.Z
  │
  └── hotfix/vX.Y.Z-description
```

---

## 3. Branch Naming Conventions

### 3.1 General Format

```
<type>/ULMS-<ticket-id>-<short-description>
```

### 3.2 Branch Type Prefixes

| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New functionality | `feature/ULMS-101-loan-application-form` |
| `bugfix/` | Bug fixes (non-prod) | `bugfix/ULMS-150-validation-error` |
| `hotfix/` | Production fixes | `hotfix/v1.2.1-cib-timeout` |
| `release/` | Release preparation | `release/v1.3.0` |
| `experiment/` | Proof of concept | `experiment/graphql-api` |
| `refactor/` | Code refactoring | `refactor/ULMS-200-loan-service` |

### 3.3 Naming Rules

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Lowercase only | `feature/ulms-101-login` | `feature/ULMS-101-Login` |
| Hyphens for spaces | `feature/ulms-101-loan-form` | `feature/ulms-101-loan_form` |
| Ticket ID required | `feature/ULMS-101-login` | `feature/login-page` |
| Short description | `feature/ULMS-101-cib-api` | `feature/ULMS-101-implement-cib-integration-with-bangladesh-bank` |
| No special chars | `feature/ULMS-101-form` | `feature/ULMS-101-form#1` |

### 3.4 Examples by Module

```bash
# Backend features
feature/ULMS-101-loan-application-api
feature/ULMS-102-cib-integration-service
feature/ULMS-103-brpd-classification-scheduler

# Frontend features
feature/ULMS-201-loan-form-component
feature/ULMS-202-cib-report-viewer
feature/ULMS-203-bengali-translations

# Mobile features
feature/ULMS-301-cpv-offline-sync
feature/ULMS-302-gps-capture

# Infrastructure
feature/ULMS-401-kubernetes-hpa
feature/ULMS-402-prometheus-alerts

# Bug fixes
bugfix/ULMS-501-loan-calculation-error
bugfix/ULMS-502-date-format-issue

# Releases
release/v1.0.0
release/v1.1.0-rc1

# Hotfixes
hotfix/v1.0.1-security-patch
hotfix/v1.0.2-cib-connection
```

---

## 4. Commit Message Standards

### 4.1 Conventional Commits Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 4.2 Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(loan): add loan application form validation` |
| `fix` | Bug fix | `fix(cib): resolve timeout on CIB inquiry` |
| `docs` | Documentation | `docs(api): update OpenAPI specification` |
| `style` | Formatting | `style(loan): fix indentation in LoanService` |
| `refactor` | Code refactoring | `refactor(auth): simplify JWT validation logic` |
| `test` | Tests | `test(loan): add unit tests for interest calculation` |
| `chore` | Maintenance | `chore(deps): upgrade Spring Boot to 3.2.2` |
| `perf` | Performance | `perf(db): optimize loan query with index` |
| `ci` | CI/CD changes | `ci: add SonarQube quality gate` |
| `build` | Build changes | `build: configure multi-stage Docker build` |
| `revert` | Revert commit | `revert: feat(loan): add loan form validation` |

### 4.3 Scope Examples

| Module | Scopes |
|--------|--------|
| Backend | `loan`, `cib`, `nid`, `brpd`, `workflow`, `notification`, `auth`, `api` |
| Frontend | `los`, `credit`, `dashboard`, `components`, `i18n`, `store` |
| Mobile | `cpv`, `offline`, `camera`, `gps` |
| Infrastructure | `k8s`, `docker`, `ci`, `helm`, `monitoring` |

### 4.4 Commit Message Examples

```bash
# Feature commit
feat(loan): implement multi-step loan application form

Add 5-step wizard for loan application with validation:
- Step 1: Personal information
- Step 2: Financial details
- Step 3: Collateral information
- Step 4: Document upload
- Step 5: Review and submit

Implements ULMS-101

# Bug fix commit
fix(cib): resolve connection timeout on high load

Increase connection pool size from 10 to 25 and add
circuit breaker with Resilience4j to handle CIB API
failures gracefully.

Fixes ULMS-502

# Refactoring commit
refactor(loan): extract interest calculation to utility class

Move interest calculation logic from LoanService to
InterestCalculator utility for better testability and
reuse across services.

No functional changes.

# Documentation commit
docs(api): add OpenAPI specification for loan endpoints

Add comprehensive OpenAPI 3.0 documentation for all
loan module endpoints including:
- Request/response schemas
- Error responses
- Authentication requirements

# Test commit
test(brpd): add integration tests for classification scheduler

Add Testcontainers-based integration tests for the
BRPD daily classification batch job covering:
- STD to SMA migration
- Provision calculation
- GL posting verification

Coverage: 87% -> 92%
```

### 4.5 Commit Message Rules

| Rule | Description |
|------|-------------|
| Subject line | Max 72 characters, imperative mood |
| Body | Wrap at 72 characters, explain what and why |
| Footer | Reference ticket IDs |
| No period | Don't end subject with period |
| Capitalize | Start subject with capital letter |
| Imperative | Use "add" not "added" or "adding" |

### 4.6 Bad vs Good Commits

| Bad | Good |
|-----|------|
| `fixed bug` | `fix(loan): resolve null pointer in interest calculation` |
| `WIP` | `feat(cib): add initial CIB client skeleton [WIP]` |
| `Updated files` | `refactor(auth): simplify JWT token validation` |
| `ULMS-101` | `feat(loan): implement loan form validation (ULMS-101)` |
| `Misc changes` | `chore(deps): update Spring Boot dependencies` |

---

## 5. Workflow Procedures

### 5.1 Feature Development Workflow

```
1. Create Feature Branch
   └── git checkout develop
   └── git pull origin develop
   └── git checkout -b feature/ULMS-XXX-description

2. Development
   └── Make changes
   └── Commit frequently with meaningful messages
   └── Push to remote regularly

3. Keep Updated
   └── git fetch origin
   └── git rebase origin/develop  (or merge)

4. Create Merge Request
   └── Push final changes
   └── Create MR in GitLab
   └── Fill out MR template
   └── Request review

5. Code Review
   └── Address feedback
   └── Update commits
   └── Get approval

6. Merge
   └── Squash and merge to develop
   └── Delete feature branch
```

### 5.2 Step-by-Step Commands

```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/ULMS-101-loan-application-form

# 2. Make changes and commit
git add src/main/java/com/unisoft/ulms/loan/
git commit -m "feat(loan): add loan application entity and repository"

# 3. Continue development
git add .
git commit -m "feat(loan): implement loan application service"

# 4. Stay updated with develop
git fetch origin
git rebase origin/develop
# Resolve any conflicts

# 5. Push to remote
git push -u origin feature/ULMS-101-loan-application-form

# 6. After MR approval, merge is done via GitLab UI

# 7. Clean up local branch
git checkout develop
git pull origin develop
git branch -d feature/ULMS-101-loan-application-form
```

### 5.3 Bugfix Workflow

```bash
# 1. Create bugfix branch from develop
git checkout develop
git pull origin develop
git checkout -b bugfix/ULMS-501-validation-error

# 2. Fix the bug
git add .
git commit -m "fix(loan): resolve validation error for zero amount"

# 3. Push and create MR
git push -u origin bugfix/ULMS-501-validation-error
# Create MR targeting develop

# 4. After merge, clean up
git checkout develop
git pull origin develop
git branch -d bugfix/ULMS-501-validation-error
```

### 5.4 Daily Workflow

```bash
# Morning: Update local branches
git checkout develop
git pull origin develop

# If on a feature branch
git checkout feature/ULMS-XXX-description
git rebase develop

# Throughout day: Commit frequently
git add <changed-files>
git commit -m "feat(scope): incremental change"

# End of day: Push work
git push origin feature/ULMS-XXX-description
```

---

## 6. Merge Strategies

### 6.1 Strategy by Branch Type

| Source Branch | Target Branch | Strategy | Reason |
|---------------|---------------|----------|--------|
| feature/* | develop | Squash merge | Clean history |
| bugfix/* | develop | Squash merge | Clean history |
| develop | main | Merge commit | Preserve history |
| release/* | main | Merge commit | Preserve history |
| hotfix/* | main | Merge commit | Audit trail |
| hotfix/* | develop | Cherry-pick | Selective merge |

### 6.2 Squash Merge (Features/Bugfixes)

```bash
# GitLab MR settings: Enable "Squash commits"
# Result: All commits combined into one

# Example: 5 commits become 1
feat(loan): implement loan application form (ULMS-101)
- Add loan entity and repository
- Implement loan service
- Add REST controller
- Add validation
- Add unit tests
```

### 6.3 Merge Commit (Releases)

```bash
# Keep full history for releases
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop
```

### 6.4 Rebase vs Merge

| Scenario | Use Rebase | Use Merge |
|----------|------------|-----------|
| Updating feature branch | Yes | No |
| Integrating develop into feature | Yes (preferred) | Acceptable |
| Merging feature to develop | No | Yes (squash) |
| Merging release to main | No | Yes |
| Public/shared branches | Never | Always |

### 6.5 Conflict Resolution

```bash
# During rebase
git rebase develop
# If conflicts occur:
git status  # See conflicting files
# Edit files to resolve conflicts
git add <resolved-files>
git rebase --continue

# If rebase is too complex, abort and merge instead
git rebase --abort
git merge develop
```

---

## 7. Release Process

### 7.1 Release Branch Workflow

```
develop ──────┬────────────────────────────────────────►
              │
              │  create release branch
              ▼
        release/v1.0.0 ────► bug fixes only ────┬──────►
                                                 │
              ┌──────────────────────────────────┘
              │  merge to main
              ▼
main ─────────┴──► tag v1.0.0 ──────────────────────────►
```

### 7.2 Release Procedure

```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Update version numbers
# Update pom.xml, package.json, etc.
git add .
git commit -m "chore(release): bump version to 1.0.0"

# 3. Final testing and bug fixes (on release branch only)
git commit -m "fix(loan): resolve edge case in interest calculation"

# 4. Merge to main
git checkout main
git pull origin main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial production release"
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 6. Delete release branch
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

### 7.3 Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH[-PRERELEASE]

Examples:
1.0.0        - Initial release
1.0.1        - Patch (bug fix)
1.1.0        - Minor (new feature, backward compatible)
2.0.0        - Major (breaking changes)
1.1.0-rc1    - Release candidate
1.1.0-beta1  - Beta release
```

### 7.4 Release Checklist

- [ ] All planned features merged to develop
- [ ] All tests passing
- [ ] Code coverage meets threshold (≥80%)
- [ ] No critical/high SonarQube issues
- [ ] Security scan passed
- [ ] Performance tests completed
- [ ] Release notes prepared
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Database migrations reviewed
- [ ] Deployment runbook updated
- [ ] Rollback procedure verified

---

## 8. Hotfix Procedures

### 8.1 Hotfix Workflow

```
main ─────────┬────────────────────────┬─────────────────►
              │                        ▲
              │ create hotfix          │ merge
              ▼                        │
        hotfix/v1.0.1-cib-fix ────────┴─────► delete
              │
              │ cherry-pick to develop
              ▼
develop ──────┴──────────────────────────────────────────►
```

### 8.2 Hotfix Procedure

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/v1.0.1-cib-timeout

# 2. Fix the critical issue
git add .
git commit -m "fix(cib): resolve connection timeout in production

Increase connection pool and add circuit breaker to
prevent cascading failures during CIB API outages.

Severity: Critical
Fixes ULMS-999"

# 3. Test thoroughly
# Run all tests locally

# 4. Merge to main
git checkout main
git merge --no-ff hotfix/v1.0.1-cib-timeout
git tag -a v1.0.1 -m "Hotfix: CIB timeout resolution"
git push origin main --tags

# 5. Cherry-pick to develop
git checkout develop
git cherry-pick <hotfix-commit-hash>
git push origin develop

# 6. Delete hotfix branch
git branch -d hotfix/v1.0.1-cib-timeout
git push origin --delete hotfix/v1.0.1-cib-timeout
```

### 8.3 Hotfix Criteria

| Severity | Response Time | Approval Required |
|----------|---------------|-------------------|
| Critical (P1) | Immediate | Tech Lead + PM |
| High (P2) | < 4 hours | Tech Lead |
| Medium (P3) | Next release | Standard MR |

### 8.4 Post-Hotfix Actions

1. Update incident documentation
2. Add regression test
3. Review and update monitoring
4. Conduct post-mortem if necessary
5. Update runbook if needed

---

## 9. Branch Protection Rules

### 9.1 Protected Branches Configuration

#### main Branch

| Rule | Setting |
|------|---------|
| Push access | None (merge only) |
| Merge access | Maintainers only |
| Require MR | Yes |
| Minimum approvals | 2 |
| Require CI pass | Yes |
| Require linear history | No |
| Allow force push | No |
| Include administrators | Yes |

#### develop Branch

| Rule | Setting |
|------|---------|
| Push access | None (merge only) |
| Merge access | Developers + Maintainers |
| Require MR | Yes |
| Minimum approvals | 1 |
| Require CI pass | Yes |
| Require linear history | No |
| Allow force push | No |

### 9.2 Merge Request Requirements

| Requirement | main | develop |
|-------------|------|---------|
| CI pipeline passes | Required | Required |
| Code review approval | 2 approvers | 1 approver |
| All discussions resolved | Required | Required |
| Up-to-date with target | Required | Required |
| No merge conflicts | Required | Required |
| SonarQube gate passes | Required | Required |
| Security scan passes | Required | Recommended |

### 9.3 GitLab Settings

```yaml
# .gitlab/merge_request_templates/Default.md
## Description
<!-- Describe your changes -->

## Related Issue
<!-- Link to GitLab issue: Closes ULMS-XXX -->

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Configuration

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No sensitive data committed

## Testing Instructions
<!-- How to test these changes -->

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->
```

---

## 10. GitLab CI Integration

### 10.1 Pipeline Stages

```yaml
stages:
  - build
  - test
  - quality
  - security
  - deploy
```

### 10.2 Branch-Specific Pipeline Rules

```yaml
# .gitlab-ci.yml (excerpt)

# Feature branches: Build + Test + Quality
feature-pipeline:
  rules:
    - if: '$CI_COMMIT_BRANCH =~ /^feature\//'

# Develop branch: Full pipeline except production deploy
develop-pipeline:
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'

# Main branch: Full pipeline with production deploy
main-pipeline:
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# Release branches: Full testing + staging deploy
release-pipeline:
  rules:
    - if: '$CI_COMMIT_BRANCH =~ /^release\//'

# Merge requests: Build + Test + Quality gate
mr-pipeline:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

### 10.3 Automated Actions

| Event | Automated Action |
|-------|------------------|
| Push to feature/* | Build, Unit tests, Lint |
| MR created | Full test suite, SonarQube, Security scan |
| Merge to develop | Build, Test, Deploy to DEV |
| Merge to release/* | Build, Test, Deploy to STAGING |
| Merge to main | Build, Test, Deploy to PRODUCTION |
| Tag created | Release artifacts, Container images |

### 10.4 Quality Gates

```yaml
# SonarQube quality gate
sonarqube-check:
  stage: quality
  script:
    - sonar-scanner
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  allow_failure: false

# Fail MR if quality gate fails
quality-gate:
  stage: quality
  script:
    - |
      if [ "$SONAR_QUALITY_GATE_STATUS" != "OK" ]; then
        echo "Quality gate failed!"
        exit 1
      fi
```

---

## 11. Best Practices

### 11.1 General Guidelines

| Practice | Description |
|----------|-------------|
| Commit often | Small, focused commits are easier to review |
| Push daily | Backup work and enable collaboration |
| Pull frequently | Stay updated with team changes |
| Write good messages | Future you will thank you |
| Review before commit | Use `git diff --staged` |
| Don't commit secrets | Use environment variables |
| Keep branches short-lived | Merge within 1-2 sprints |

### 11.2 Do's and Don'ts

| Do | Don't |
|----|-------|
| Create feature branches | Commit directly to develop/main |
| Write descriptive commits | Use vague messages like "fix" |
| Rebase feature branches | Force push to shared branches |
| Delete merged branches | Leave stale branches |
| Use .gitignore properly | Commit generated files |
| Reference ticket IDs | Create orphan commits |
| Test before pushing | Push broken code |

### 11.3 Git Configuration

```bash
# Recommended global config
git config --global user.name "Your Name"
git config --global user.email "your.email@unisoft.com"
git config --global pull.rebase true
git config --global push.default current
git config --global core.autocrlf input  # Linux/Mac
git config --global core.autocrlf true   # Windows
git config --global init.defaultBranch main

# Useful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.last "log -1 HEAD"
git config --global alias.unstage "reset HEAD --"
```

### 11.4 .gitignore Template

```gitignore
# ULMS Project .gitignore

# Java
target/
*.class
*.jar
*.war
*.log
.idea/
*.iml

# Node/React
node_modules/
dist/
build/
.env
.env.local

# React Native
android/app/build/
ios/Pods/
*.xcworkspace

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Secrets (NEVER commit)
*.pem
*.key
credentials.json
secrets.yaml

# Generated
coverage/
.nyc_output/
```

### 11.5 Pre-commit Hooks

```bash
# Install pre-commit hooks
npm install husky lint-staged --save-dev

# package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{java}": ["./gradlew spotlessApply"]
  }
}
```

---

## Appendix A: Quick Reference Card

### Branch Commands

```bash
# Create branch
git checkout -b feature/ULMS-XXX-description

# List branches
git branch -a

# Switch branch
git checkout develop

# Delete local branch
git branch -d feature/ULMS-XXX

# Delete remote branch
git push origin --delete feature/ULMS-XXX

# Rename branch
git branch -m old-name new-name
```

### Commit Commands

```bash
# Stage specific files
git add file1 file2

# Stage all changes
git add .

# Commit
git commit -m "type(scope): message"

# Amend last commit (before push)
git commit --amend

# View commit history
git log --oneline -10
```

### Sync Commands

```bash
# Fetch all remotes
git fetch --all

# Pull with rebase
git pull --rebase origin develop

# Push branch
git push -u origin feature/ULMS-XXX

# Force push (feature branches only!)
git push --force-with-lease origin feature/ULMS-XXX
```

### Merge/Rebase Commands

```bash
# Rebase onto develop
git rebase develop

# Continue rebase after conflict
git rebase --continue

# Abort rebase
git rebase --abort

# Merge (for releases)
git merge --no-ff release/v1.0.0
```

---

## Appendix B: Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Merge conflicts | `git mergetool` or manually edit files |
| Accidentally committed to wrong branch | `git cherry-pick` to correct branch |
| Need to undo last commit | `git reset --soft HEAD~1` |
| Pushed sensitive data | Rotate credentials, use BFG to clean history |
| Branch out of date | `git fetch && git rebase origin/develop` |
| Lost commits | `git reflog` to find and recover |

### Emergency Procedures

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Recover deleted branch
git reflog
git checkout -b recovered-branch <commit-hash>

# Clean untracked files
git clean -fd
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Git Workflow & Branching Strategy v1.0*

*Unisoft Systems Limited - Confidential*
