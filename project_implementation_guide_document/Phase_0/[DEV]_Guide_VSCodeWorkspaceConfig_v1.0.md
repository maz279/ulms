# VS Code Workspace Configuration Guide

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-DEV-0.2.4 |
| **Document Title** | VS Code Workspace Configuration Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Frontend Developer (Dev 1) |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | Dev 1 | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Required Extensions](#2-required-extensions)
3. [Workspace Settings](#3-workspace-settings)
4. [Launch Configurations](#4-launch-configurations)
5. [Tasks Configuration](#5-tasks-configuration)
6. [Keyboard Shortcuts](#6-keyboard-shortcuts)
7. [Multi-Root Workspace](#7-multi-root-workspace)
8. [Code Snippets](#8-code-snippets)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose

This guide provides the VS Code configuration for ULMS v2.0 development, ensuring consistent development environment across the team with optimal productivity settings.

### 1.2 Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| VS Code | 1.85+ | https://code.visualstudio.com/ |
| Node.js | 20.x LTS | https://nodejs.org/ |
| Java JDK | 21 LTS | Eclipse Temurin |
| Git | 2.43+ | https://git-scm.com/ |
| Docker | 24.x | https://docker.com/ |

### 1.3 Quick Setup

```bash
# 1. Clone repository
git clone https://gitlab.com/unisoft/ulms.git
cd ulms

# 2. Install extensions (run in terminal)
cat .vscode/extensions.json | jq -r '.recommendations[]' | xargs -L1 code --install-extension

# 3. Open workspace
code ulms.code-workspace
```

---

## 2. Required Extensions

### 2.1 Core Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    // Java Development
    "vscjava.vscode-java-pack",
    "vmware.vscode-boot-dev-pack",
    "vscjava.vscode-gradle",

    // TypeScript/React
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",

    // Database
    "cweijan.vscode-postgresql-client2",
    "cweijan.vscode-redis-client",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // Docker & Kubernetes
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",

    // API Testing
    "rangav.vscode-thunder-client",
    "42crunch.vscode-openapi",

    // Utilities
    "editorconfig.editorconfig",
    "yzhang.markdown-all-in-one",
    "streetsidesoftware.code-spell-checker",
    "wayou.vscode-todo-highlight",
    "gruntfuggly.todo-tree",

    // Formatting
    "redhat.vscode-yaml",
    "tamasfe.even-better-toml"
  ],
  "unwantedRecommendations": []
}
```

### 2.2 Extension Installation Commands

```bash
# Java Pack (includes debugger, test runner, Maven/Gradle)
code --install-extension vscjava.vscode-java-pack

# Spring Boot Pack
code --install-extension vmware.vscode-boot-dev-pack

# ESLint
code --install-extension dbaeumer.vscode-eslint

# Prettier
code --install-extension esbenp.prettier-vscode

# GitLens
code --install-extension eamodio.gitlens

# Docker
code --install-extension ms-azuretools.vscode-docker

# Thunder Client (API testing)
code --install-extension rangav.vscode-thunder-client

# Install all at once
code --install-extension vscjava.vscode-java-pack \
     --install-extension vmware.vscode-boot-dev-pack \
     --install-extension dbaeumer.vscode-eslint \
     --install-extension esbenp.prettier-vscode \
     --install-extension eamodio.gitlens \
     --install-extension ms-azuretools.vscode-docker
```

### 2.3 Extension Descriptions

| Extension | Purpose | Priority |
|-----------|---------|----------|
| **Java Pack** | Java language support, debugging | Required |
| **Spring Boot Pack** | Spring Boot tools, dashboard | Required |
| **ESLint** | JavaScript/TypeScript linting | Required |
| **Prettier** | Code formatting | Required |
| **GitLens** | Git blame, history | Required |
| **PostgreSQL** | Database management | Recommended |
| **Thunder Client** | API testing | Recommended |
| **Docker** | Container management | Recommended |
| **Todo Tree** | Track TODOs in code | Recommended |

---

## 3. Workspace Settings

### 3.1 User Settings

Create/update `~/.vscode/settings.json` (global):

```json
{
  // Editor
  "editor.fontSize": 14,
  "editor.fontFamily": "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": false,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.linkedEditing": true,
  "editor.suggestSelection": "first",

  // Files
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // Terminal
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.defaultProfile.windows": "Git Bash",
  "terminal.integrated.defaultProfile.linux": "bash",

  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true
}
```

### 3.2 Project Settings

Create `.vscode/settings.json` in project root:

```json
{
  // ===================
  // Editor Settings
  // ===================
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },

  // ===================
  // File Associations
  // ===================
  "files.associations": {
    "*.css": "tailwindcss",
    "*.json": "jsonc"
  },
  "files.exclude": {
    "**/.git": true,
    "**/.svn": true,
    "**/node_modules": true,
    "**/target": true,
    "**/.gradle": true,
    "**/build": true,
    "**/*.class": true
  },

  // ===================
  // Java Settings
  // ===================
  "java.home": "${env:JAVA_HOME}",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-21",
      "path": "${env:JAVA_HOME}",
      "default": true
    }
  ],
  "java.format.settings.url": ".vscode/java-formatter.xml",
  "java.format.settings.profile": "ULMS",
  "java.saveActions.organizeImports": true,
  "java.completion.importOrder": [
    "java",
    "javax",
    "org",
    "com",
    ""
  ],
  "java.sources.organizeImports.staticStarThreshold": 3,

  // ===================
  // Spring Boot
  // ===================
  "spring-boot.ls.java.home": "${env:JAVA_HOME}",
  "boot-java.rewrite.reconcile": true,

  // ===================
  // TypeScript/JavaScript
  // ===================
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "javascript.preferences.importModuleSpecifier": "relative",
  "javascript.updateImportsOnFileMove.enabled": "always",

  // ===================
  // ESLint
  // ===================
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [
    "./ulms-frontend",
    "./ulms-mobile"
  ],

  // ===================
  // Prettier
  // ===================
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "yzhang.markdown-all-in-one"
  },
  "[java]": {
    "editor.defaultFormatter": "redhat.java"
  },
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml"
  },

  // ===================
  // SQL
  // ===================
  "[sql]": {
    "editor.tabSize": 4
  },

  // ===================
  // Todo Tree
  // ===================
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "BUG",
    "HACK",
    "XXX",
    "ULMS"
  ],
  "todo-tree.highlights.defaultHighlight": {
    "icon": "alert",
    "type": "text",
    "foreground": "#ffffff",
    "background": "#ff9800"
  },

  // ===================
  // Search Exclusions
  // ===================
  "search.exclude": {
    "**/node_modules": true,
    "**/target": true,
    "**/build": true,
    "**/dist": true,
    "**/.gradle": true,
    "**/coverage": true,
    "**/*.min.js": true,
    "**/*.map": true
  }
}
```

### 3.3 EditorConfig

Create `.editorconfig` in project root:

```ini
# EditorConfig - https://editorconfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.{java,gradle}]
indent_size = 4

[*.md]
trim_trailing_whitespace = false

[*.sql]
indent_size = 4

[Makefile]
indent_style = tab
```

---

## 4. Launch Configurations

### 4.1 Debug Configurations

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    // ===================
    // BACKEND (Spring Boot)
    // ===================
    {
      "type": "java",
      "name": "Launch Fineract",
      "request": "launch",
      "mainClass": "org.apache.fineract.FineractApplication",
      "projectName": "fineract-provider",
      "vmArgs": "-Dspring.profiles.active=dev",
      "env": {
        "SPRING_DATASOURCE_URL": "jdbc:postgresql://localhost:5432/fineract",
        "SPRING_DATASOURCE_USERNAME": "postgres",
        "SPRING_DATASOURCE_PASSWORD": "postgres"
      }
    },
    {
      "type": "java",
      "name": "Launch Loan Service",
      "request": "launch",
      "mainClass": "com.unisoft.ulms.loan.LoanServiceApplication",
      "projectName": "ulms-loan-service",
      "vmArgs": "-Dspring.profiles.active=dev"
    },
    {
      "type": "java",
      "name": "Launch CIB Service",
      "request": "launch",
      "mainClass": "com.unisoft.ulms.cib.CibServiceApplication",
      "projectName": "ulms-cib-service",
      "vmArgs": "-Dspring.profiles.active=dev"
    },

    // ===================
    // FRONTEND (React)
    // ===================
    {
      "type": "chrome",
      "name": "Launch Chrome (Frontend)",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/ulms-frontend/src",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///./src/*": "${webRoot}/*"
      }
    },
    {
      "type": "node",
      "name": "Launch Vite Dev Server",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/ulms-frontend",
      "console": "integratedTerminal"
    },

    // ===================
    // TESTS
    // ===================
    {
      "type": "java",
      "name": "Debug Current Test (Java)",
      "request": "launch",
      "mainClass": "",
      "projectName": ""
    },
    {
      "type": "node",
      "name": "Debug Vitest",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["vitest", "run", "--reporter=verbose"],
      "cwd": "${workspaceFolder}/ulms-frontend",
      "console": "integratedTerminal"
    },

    // ===================
    // MOBILE (React Native)
    // ===================
    {
      "type": "reactnative",
      "name": "Debug Android",
      "request": "launch",
      "platform": "android",
      "cwd": "${workspaceFolder}/ulms-mobile"
    },
    {
      "type": "reactnative",
      "name": "Debug iOS",
      "request": "launch",
      "platform": "ios",
      "cwd": "${workspaceFolder}/ulms-mobile"
    }
  ],

  "compounds": [
    {
      "name": "Full Stack (Backend + Frontend)",
      "configurations": [
        "Launch Fineract",
        "Launch Chrome (Frontend)"
      ]
    }
  ]
}
```

---

## 5. Tasks Configuration

### 5.1 Task Definitions

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    // ===================
    // BUILD TASKS
    // ===================
    {
      "label": "Build Backend (Gradle)",
      "type": "shell",
      "command": "./gradlew build -x test",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": ["$gradle"]
    },
    {
      "label": "Build Frontend (Vite)",
      "type": "shell",
      "command": "npm run build",
      "options": {
        "cwd": "${workspaceFolder}/ulms-frontend"
      },
      "group": "build",
      "problemMatcher": []
    },

    // ===================
    // TEST TASKS
    // ===================
    {
      "label": "Test Backend",
      "type": "shell",
      "command": "./gradlew test",
      "group": "test",
      "problemMatcher": ["$gradle"]
    },
    {
      "label": "Test Frontend",
      "type": "shell",
      "command": "npm test",
      "options": {
        "cwd": "${workspaceFolder}/ulms-frontend"
      },
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "Test with Coverage",
      "type": "shell",
      "command": "npm run test:coverage",
      "options": {
        "cwd": "${workspaceFolder}/ulms-frontend"
      },
      "group": "test",
      "problemMatcher": []
    },

    // ===================
    // DEV TASKS
    // ===================
    {
      "label": "Start Frontend Dev",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/ulms-frontend"
      },
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": ".",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": ".",
          "endsPattern": "ready in"
        }
      }
    },
    {
      "label": "Start Backend (Spring Boot)",
      "type": "shell",
      "command": "./gradlew bootRun",
      "options": {
        "cwd": "${workspaceFolder}/ulms-backend"
      },
      "isBackground": true,
      "problemMatcher": []
    },

    // ===================
    // DOCKER TASKS
    // ===================
    {
      "label": "Docker: Start Infrastructure",
      "type": "shell",
      "command": "docker-compose up -d",
      "options": {
        "cwd": "${workspaceFolder}"
      },
      "problemMatcher": []
    },
    {
      "label": "Docker: Stop Infrastructure",
      "type": "shell",
      "command": "docker-compose down",
      "problemMatcher": []
    },
    {
      "label": "Docker: View Logs",
      "type": "shell",
      "command": "docker-compose logs -f",
      "problemMatcher": []
    },

    // ===================
    // LINT TASKS
    // ===================
    {
      "label": "Lint Frontend",
      "type": "shell",
      "command": "npm run lint",
      "options": {
        "cwd": "${workspaceFolder}/ulms-frontend"
      },
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "Lint Fix Frontend",
      "type": "shell",
      "command": "npm run lint:fix",
      "options": {
        "cwd": "${workspaceFolder}/ulms-frontend"
      },
      "problemMatcher": ["$eslint-stylish"]
    },

    // ===================
    // DATABASE TASKS
    // ===================
    {
      "label": "DB: Run Migrations",
      "type": "shell",
      "command": "./gradlew flywayMigrate",
      "problemMatcher": []
    },
    {
      "label": "DB: Clean & Migrate",
      "type": "shell",
      "command": "./gradlew flywayClean flywayMigrate",
      "problemMatcher": []
    }
  ]
}
```

---

## 6. Keyboard Shortcuts

### 6.1 Custom Keybindings

Create/update `~/.vscode/keybindings.json`:

```json
[
  // ===================
  // Navigation
  // ===================
  {
    "key": "ctrl+shift+e",
    "command": "workbench.view.explorer"
  },
  {
    "key": "ctrl+shift+g",
    "command": "workbench.view.scm"
  },
  {
    "key": "ctrl+shift+d",
    "command": "workbench.view.debug"
  },

  // ===================
  // Terminal
  // ===================
  {
    "key": "ctrl+`",
    "command": "workbench.action.terminal.toggleTerminal"
  },
  {
    "key": "ctrl+shift+`",
    "command": "workbench.action.terminal.new"
  },

  // ===================
  // Editor
  // ===================
  {
    "key": "ctrl+d",
    "command": "editor.action.addSelectionToNextFindMatch"
  },
  {
    "key": "ctrl+shift+l",
    "command": "editor.action.selectHighlights"
  },
  {
    "key": "alt+up",
    "command": "editor.action.moveLinesUpAction"
  },
  {
    "key": "alt+down",
    "command": "editor.action.moveLinesDownAction"
  },
  {
    "key": "ctrl+shift+k",
    "command": "editor.action.deleteLines"
  },

  // ===================
  // Code Actions
  // ===================
  {
    "key": "ctrl+.",
    "command": "editor.action.quickFix"
  },
  {
    "key": "f2",
    "command": "editor.action.rename"
  },
  {
    "key": "ctrl+shift+r",
    "command": "editor.action.refactor"
  },

  // ===================
  // Git (GitLens)
  // ===================
  {
    "key": "ctrl+shift+g b",
    "command": "gitlens.toggleFileBlame"
  },
  {
    "key": "ctrl+shift+g h",
    "command": "gitlens.showQuickFileHistory"
  },

  // ===================
  // Tasks
  // ===================
  {
    "key": "ctrl+shift+b",
    "command": "workbench.action.tasks.build"
  },
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.test"
  }
]
```

### 6.2 Essential Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Quick open file |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+Shift+F` | Search in files |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+J` | Toggle panel |
| `Ctrl+\`` | Toggle terminal |
| `F5` | Start debugging |
| `F9` | Toggle breakpoint |
| `F12` | Go to definition |
| `Alt+F12` | Peek definition |
| `Shift+F12` | Find references |
| `Ctrl+Space` | Trigger suggestions |

---

## 7. Multi-Root Workspace

### 7.1 Workspace File

Create `ulms.code-workspace`:

```json
{
  "folders": [
    {
      "name": "ULMS Root",
      "path": "."
    },
    {
      "name": "Backend",
      "path": "./ulms-backend"
    },
    {
      "name": "Frontend",
      "path": "./ulms-frontend"
    },
    {
      "name": "Mobile",
      "path": "./ulms-mobile"
    },
    {
      "name": "Infrastructure",
      "path": "./infrastructure"
    },
    {
      "name": "Documentation",
      "path": "./docs"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/.git": true,
      "**/node_modules": true,
      "**/target": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/target": true,
      "**/build": true
    }
  },
  "extensions": {
    "recommendations": [
      "vscjava.vscode-java-pack",
      "vmware.vscode-boot-dev-pack",
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "eamodio.gitlens"
    ]
  },
  "launch": {
    "version": "0.2.0",
    "configurations": [],
    "compounds": []
  }
}
```

---

## 8. Code Snippets

### 8.1 Java Snippets

Create `.vscode/java.code-snippets`:

```json
{
  "Spring REST Controller": {
    "prefix": "restcontroller",
    "body": [
      "@RestController",
      "@RequestMapping(\"/api/v1/${1:resource}\")",
      "@RequiredArgsConstructor",
      "@Validated",
      "@Tag(name = \"${2:Tag}\", description = \"${3:Description}\")",
      "public class ${4:Name}Controller {",
      "",
      "    private final ${5:Service}Service ${6:service}Service;",
      "",
      "    @GetMapping",
      "    public ResponseEntity<List<${7:Response}>> getAll() {",
      "        return ResponseEntity.ok(${6:service}Service.findAll());",
      "    }",
      "",
      "    @GetMapping(\"/{id}\")",
      "    public ResponseEntity<${7:Response}> getById(@PathVariable Long id) {",
      "        return ResponseEntity.ok(${6:service}Service.findById(id));",
      "    }",
      "",
      "    @PostMapping",
      "    @ResponseStatus(HttpStatus.CREATED)",
      "    public ResponseEntity<${7:Response}> create(",
      "            @Valid @RequestBody ${8:Request} request) {",
      "        return ResponseEntity.status(HttpStatus.CREATED)",
      "            .body(${6:service}Service.create(request));",
      "    }",
      "}"
    ],
    "description": "Spring REST Controller template"
  },
  "Spring Service": {
    "prefix": "springservice",
    "body": [
      "@Service",
      "@RequiredArgsConstructor",
      "@Slf4j",
      "public class ${1:Name}ServiceImpl implements ${1:Name}Service {",
      "",
      "    private final ${2:Entity}Repository ${3:entity}Repository;",
      "",
      "    @Override",
      "    @Transactional(readOnly = true)",
      "    public ${4:Response} findById(Long id) {",
      "        return ${3:entity}Repository.findById(id)",
      "            .map(this::toResponse)",
      "            .orElseThrow(() -> new ResourceNotFoundException(\"${2:Entity}\", id));",
      "    }",
      "",
      "    @Override",
      "    @Transactional",
      "    public ${4:Response} create(${5:Request} request) {",
      "        log.info(\"Creating ${2:Entity}: {}\", request);",
      "        $0",
      "        return null;",
      "    }",
      "}"
    ],
    "description": "Spring Service implementation"
  },
  "JUnit Test Class": {
    "prefix": "jtest",
    "body": [
      "@ExtendWith(MockitoExtension.class)",
      "class ${1:ClassName}Test {",
      "",
      "    @Mock",
      "    private ${2:Dependency} ${3:dependency};",
      "",
      "    @InjectMocks",
      "    private ${4:ClassUnderTest} ${5:classUnderTest};",
      "",
      "    @Test",
      "    @DisplayName(\"${6:should do something}\")",
      "    void ${7:testMethod}() {",
      "        // Given",
      "        $0",
      "",
      "        // When",
      "",
      "        // Then",
      "    }",
      "}"
    ],
    "description": "JUnit 5 Test Class"
  }
}
```

### 8.2 TypeScript/React Snippets

Create `.vscode/typescriptreact.code-snippets`:

```json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({",
      "  $3",
      "}) => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ],
    "description": "React Functional Component with TypeScript"
  },
  "Custom Hook": {
    "prefix": "rhook",
    "body": [
      "import { useState, useCallback } from 'react';",
      "",
      "interface Use${1:HookName}Options {",
      "  $2",
      "}",
      "",
      "interface Use${1:HookName}Return {",
      "  $3",
      "}",
      "",
      "export function use${1:HookName}(",
      "  options: Use${1:HookName}Options = {}",
      "): Use${1:HookName}Return {",
      "  const [state, setState] = useState<$4>(null);",
      "",
      "  $0",
      "",
      "  return {",
      "    state,",
      "  };",
      "}"
    ],
    "description": "Custom React Hook"
  },
  "RTK Query API": {
    "prefix": "rtkapi",
    "body": [
      "import { api } from './apiSlice';",
      "import type { ${1:Entity}, Create${1:Entity}Request } from '@types/${2:entity}.types';",
      "",
      "export const ${2:entity}Api = api.injectEndpoints({",
      "  endpoints: (builder) => ({",
      "    get${1:Entity}s: builder.query<${1:Entity}[], void>({",
      "      query: () => '/${3:entities}',",
      "      providesTags: ['${1:Entity}'],",
      "    }),",
      "    get${1:Entity}: builder.query<${1:Entity}, string>({",
      "      query: (id) => '/${3:entities}/\\${id}',",
      "      providesTags: (result, error, id) => [{ type: '${1:Entity}', id }],",
      "    }),",
      "    create${1:Entity}: builder.mutation<${1:Entity}, Create${1:Entity}Request>({",
      "      query: (body) => ({",
      "        url: '/${3:entities}',",
      "        method: 'POST',",
      "        body,",
      "      }),",
      "      invalidatesTags: ['${1:Entity}'],",
      "    }),",
      "  }),",
      "});",
      "",
      "export const {",
      "  useGet${1:Entity}sQuery,",
      "  useGet${1:Entity}Query,",
      "  useCreate${1:Entity}Mutation,",
      "} = ${2:entity}Api;"
    ],
    "description": "RTK Query API endpoints"
  }
}
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Solution |
|-------|----------|
| Java not detected | Set `java.home` in settings |
| ESLint not working | Run `npm install` in frontend folder |
| Prettier conflicts | Disable other formatters for TS/JS |
| Slow IntelliSense | Exclude `node_modules` and `target` |
| Git integration issues | Ensure Git is in PATH |

### 9.2 Reset VS Code

```bash
# Reset extensions
rm -rf ~/.vscode/extensions

# Reset settings
rm ~/.vscode/settings.json

# Reset workspace storage
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage
```

### 9.3 Logs Location

| Log | Location |
|-----|----------|
| VS Code Log | Help → Toggle Developer Tools |
| Java Log | Output → Language Support for Java |
| ESLint Log | Output → ESLint |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Frontend Developer | | | |
| Technical Lead | | | |

---

**Document End**

*ULMS v2.0 - VS Code Workspace Configuration Guide v1.0*

*Unisoft Systems Limited - Confidential*
