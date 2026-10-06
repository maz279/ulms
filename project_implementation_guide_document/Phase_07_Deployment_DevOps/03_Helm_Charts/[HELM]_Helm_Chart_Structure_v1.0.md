# Helm Chart Structure

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Helm Chart Structure |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | DevOps Engineering Team |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | DevOps Team | Chart structure specification |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Directory Structure](#2-directory-structure)
3. [Core Files](#3-core-files)
4. [Template Files](#4-template-files)
5. [Schema Validation](#5-schema-validation)
6. [Documentation](#6-documentation)
7. [Chart Testing](#7-chart-testing)
8. [Examples](#8-examples)
9. [Troubleshooting](#9-troubleshooting)
10. [Related Documents](#10-related-documents)

---

## 1. Executive Summary

This document defines the standardized Helm chart structure for ULMS v2.0, ensuring consistency across all application components deployed to Bangladesh banking Kubernetes clusters.

---

## 2. Directory Structure

### 2.1 Standard Layout

```
charts/
├── ulms-backend/
│   ├── Chart.yaml              # Chart metadata
│   ├── values.yaml             # Default configuration values
│   ├── values.schema.json      # JSON Schema for validation
│   ├── values-dev.yaml         # Development environment values
│   ├── values-staging.yaml     # Staging environment values
│   ├── values-prod.yaml        # Production environment values
│   ├── .helmignore             # Files to exclude from packaging
│   ├── README.md               # Chart documentation
│   ├── LICENSE                 # License file
│   ├── charts/                 # Dependency charts
│   │   └── (empty or subcharts)
│   ├── crds/                   # Custom Resource Definitions
│   │   └── (optional CRDs)
│   ├── templates/              # Kubernetes manifest templates
│   │   ├── _helpers.tpl        # Named templates and helpers
│   │   ├── NOTES.txt           # Post-installation notes
│   │   ├── deployment.yaml     # Main application deployment
│   │   ├── service.yaml        # Service definition
│   │   ├── ingress.yaml        # Ingress rules
│   │   ├── hpa.yaml            # Horizontal Pod Autoscaler
│   │   ├── pdb.yaml            # Pod Disruption Budget
│   │   ├── serviceaccount.yaml # Service account
│   │   ├── configmap.yaml      # Configuration
│   │   ├── secret.yaml         # Secrets (external refs)
│   │   ├── networkpolicy.yaml  # Network policies
│   │   ├── servicemonitor.yaml # Prometheus monitoring
│   │   ├── podmonitor.yaml     # Pod monitoring
│   │   └── tests/              # Test templates
│   │       └── test-connection.yaml
│   └── ci/                     # CI test values
│       └── test-values.yaml
│
├── ulms-frontend/
│   └── (same structure)
│
├── ulms-database/
│   └── (same structure)
│
└── ulms-library/               # Library chart
    ├── Chart.yaml
    ├── README.md
    ├── values.yaml
    └── templates/
        ├── _configmap.tpl
        ├── _deployment.tpl
        ├── _ingress.tpl
        ├── _service.tpl
        └── _util.tpl
```

---

## 3. Core Files

### 3.1 Chart.yaml Reference

```yaml
apiVersion: v2                    # Helm 3 API version
name: ulms-backend                # Chart name (lowercase, alphanumeric)
description: |                    # Multi-line description
  ULMS Backend API Helm Chart for Bangladesh Banking.
  Provides REST API services for loan management operations.
type: application                 # application or library
version: 2.0.0                    # Chart version (SemVer)
appVersion: "2.0.0"               # Application version
deprecated: false                 # Mark as deprecated if true
kubeVersion: ">=1.28.0"           # Required Kubernetes version
keywords:                         # Search keywords
  - ulms
  - banking
  - loan-management
  - financial-services
home: https://unisoft-systems.com/ulms
sources:                          # Source code locations
  - https://gitlab.unisoft-systems.com/ulms/backend
  - https://github.com/unisoft-systems/ulms-backend
maintainers:                      # Chart maintainers
  - name: DevOps Team
    email: devops@unisoft-systems.com
    url: https://unisoft-systems.com
  - name: Platform Team
    email: platform@unisoft-systems.com
dependencies:                     # Chart dependencies
  - name: postgresql
    version: 13.2.0
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
    tags:
      - database
    import-values:
      - child: default
        parent: postgresql
  - name: redis
    version: 18.5.0
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
  - name: common
    version: 2.x.x
    repository: https://charts.bitnami.com/bitnami
    tags:
      - bitnami-common
annotations:                      # Additional metadata
  category: FinancialServices
  licenses: Apache-2.0
  images: |
    - name: ulms-backend
      image: registry.unisoft-systems.com/ulms/backend:2.0.0
```

### 3.2 .helmignore

```gitignore
# Patterns to ignore when building packages
.git
.gitignore
*.md
*.tgz
.ci/
.github/
.gitlab-ci.yml
Makefile
Dockerfile
docker-compose.yml
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
```

---

## 4. Template Files

### 4.1 Standard Template Naming

| Template File | Purpose | Optional |
|--------------|---------|----------|
| `_helpers.tpl` | Named template definitions | No |
| `NOTES.txt` | Post-installation instructions | No |
| `deployment.yaml` | Application deployment | No |
| `service.yaml` | Service exposure | No |
| `serviceaccount.yaml` | RBAC service account | Yes |
| `ingress.yaml` | Ingress configuration | Yes |
| `hpa.yaml` | Horizontal pod autoscaling | Yes |
| `pdb.yaml` | Pod disruption budget | Yes |
| `configmap.yaml` | Configuration data | Yes |
| `secret.yaml` | Secrets template | Yes |
| `networkpolicy.yaml` | Network security | Yes |
| `servicemonitor.yaml` | Prometheus monitoring | Yes |
| `vpa.yaml` | Vertical pod autoscaling | Yes |

---

## 5. Schema Validation

### 5.1 values.schema.json

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Number of pod replicas"
    },
    "image": {
      "type": "object",
      "properties": {
        "repository": {
          "type": "string",
          "pattern": "^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\\/[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
        },
        "tag": {
          "type": "string"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"]
        }
      },
      "required": ["repository"]
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits": {
          "type": "object",
          "properties": {
            "cpu": {
              "type": "string",
              "pattern": "^[0-9]+m?$"
            },
            "memory": {
              "type": "string",
              "pattern": "^[0-9]+(Mi|Gi|M|G)?$"
            }
          }
        }
      }
    },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "minReplicas": {
          "type": "integer",
          "minimum": 1
        },
        "maxReplicas": {
          "type": "integer",
          "minimum": 1
        }
      }
    }
  },
  "required": ["image"]
}
```

---

## 6. Documentation

### 6.1 README.md Template

```markdown
# ULMS Backend Helm Chart

## Description

ULMS Backend API service for Bangladesh Banking loan management operations.

## Prerequisites

- Kubernetes 1.28+
- Helm 3.13+
- PV provisioner support (if persistence enabled)

## Installation

```bash
# Add repository
helm repo add ulms https://charts.unisoft-systems.com
helm repo update

# Install chart
helm install ulms-backend ulms/ulms-backend \
  --namespace ulms-production \
  --create-namespace \
  --values values-prod.yaml
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | 3 |
| `image.repository` | Image repository | registry.unisoft-systems.com/ulms/backend |
| `image.tag` | Image tag | Chart appVersion |

## Uninstallation

```bash
helm uninstall ulms-backend -n ulms-production
```
```

---

## 7. Chart Testing

### 7.1 Test Templates

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "ulms-backend.fullname" . }}-test-connection"
  labels:
    {{- include "ulms-backend.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: wget
      image: busybox:1.36
      command: ['wget']
      args:
        - '--timeout=5'
        - '--spider'
        - '{{ include "ulms-backend.fullname" . }}:{{ .Values.service.port }}/actuator/health'
  restartPolicy: Never
```

---

## 8. Examples

### 8.1 Library Chart

```yaml
# ulms-library/templates/_deployment.tpl
{{- define "ulms-library.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "ulms-library.fullname" . }}
  labels:
    {{- include "ulms-library.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "ulms-library.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "ulms-library.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
{{- end }}
```

---

## 9. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Template error | Syntax issue | Run `helm template --debug` |
| Values not applied | Wrong indentation | Validate YAML |
| Chart not found | Path issue | Check `helm dependency build` |
| Validation failed | Schema mismatch | Check values.schema.json |

---

## 10. Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Helm Chart Development Guide | `01_[HELM]_Helm_Chart_Development_Guide_v1.0.md` | Development |
| Helm Values Configuration | `03_[HELM]_Helm_Values_Configuration_v1.0.md` | Values management |
| Helm Release Management | `04_[HELM]_Helm_Release_Management_v1.0.md` | Operations |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
