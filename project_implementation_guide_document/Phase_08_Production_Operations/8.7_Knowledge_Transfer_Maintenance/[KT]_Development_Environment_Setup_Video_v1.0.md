# Development Environment Setup Video Script

## ULMS v2.0 - Video Training Material

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-KT-DEV-002 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Training |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | Training Lead |
| Approver | Technical Lead |

---

## Video Script: Development Environment Setup

### Video Information
- **Title**: ULMS v2.0 Development Environment Setup
- **Duration**: 25 minutes
- **Target Audience**: New Developers
- **Prerequisites**: Basic knowledge of Java, Git, Docker

---

## Scene 1: Introduction (2 minutes)

**[Visual: Title slide with ULMS logo]**

**Narrator:**
"Welcome to the ULMS v2.0 Development Environment Setup guide. In this video, we'll walk through setting up your complete development environment for the Unisoft Loan Management System. By the end of this video, you'll have a working local environment where you can develop, test, and debug the application."

**[Visual: Agenda slide]**

"We'll cover:
1. Prerequisites and tools installation
2. Repository cloning and setup
3. Database and dependencies
4. Running the application
5. IDE configuration
6. Verification"

---

## Scene 2: Prerequisites (3 minutes)

**[Visual: Screen recording - showing terminal]**

**Narrator:**
"Before we begin, ensure you have the following installed:"

**[On-screen checklist appears]**

"Required software:
- Java 21 JDK (Eclipse Temurin recommended)
- Git 2.40 or higher
- Docker Desktop
- IntelliJ IDEA (Ultimate recommended)
- Node.js 20 LTS"

**[Visual: Terminal showing version checks]**

"Let's verify the installations:"

```bash
java -version
git --version
docker --version
node --version
```

"If any command fails, install the missing software before continuing."

---

## Scene 3: Repository Setup (3 minutes)

**[Visual: Terminal - cloning repository]**

**Narrator:**
"Now let's clone the ULMS repository. Open your terminal and run:"

```bash
git clone https://github.com/unisoft/ulms-v2.git
cd ulms-v2
```

"The repository contains three main directories:"

**[Visual: File explorer showing structure]**

"- backend: Spring Boot application
- frontend: React TypeScript application
- infrastructure: Docker and Kubernetes configurations"

---

## Scene 4: Database Setup (4 minutes)

**[Visual: Terminal - Docker compose]**

**Narrator:**
"ULMS requires PostgreSQL and Redis. Let's start them using Docker Compose:"

```bash
cd infrastructure/docker
docker-compose up -d postgres redis
```

**[Visual: Docker Desktop showing running containers]**

"Verify the containers are running:"

```bash
docker ps
```

"You should see postgres and redis containers with status 'Up'."

**[Visual: DBeaver or similar tool connecting to database]**

"The database is now accessible at:
- Host: localhost
- Port: 5432
- Database: ulms_dev
- Username: ulms_dev
- Password: dev_password"

---

## Scene 5: Backend Setup (5 minutes)

**[Visual: IntelliJ IDEA - importing project]**

**Narrator:**
"Let's set up the backend in IntelliJ IDEA."

"Step 1: Import the project"
- Open IntelliJ IDEA
- Select 'Open' and navigate to the backend folder
- Wait for Gradle sync to complete

**[Visual: IntelliJ showing project structure]**

"Step 2: Configure the database connection"
- The dev profile is already configured in application-dev.yml
- No changes needed for local development

**[Visual: Running the application]**

"Step 3: Run the application"
- Find UlmsApplication.java
- Right-click and select 'Run'
- Or use the Gradle task: ./gradlew bootRun

"The application will start on port 8080. You should see:"

```
Started UlmsApplication in X.XXX seconds
```

---

## Scene 6: Frontend Setup (4 minutes)

**[Visual: Terminal - frontend directory]**

**Narrator:**
"Now let's set up the frontend."

```bash
cd frontend
npm install
```

**[Visual: Terminal showing npm install progress]**

"This will install all required dependencies. It may take a few minutes."

**[Visual: Running the frontend]**

"Once complete, start the development server:"

```bash
npm run dev
```

"The frontend will start on port 5173 and automatically open in your browser."

**[Visual: Browser showing login page]**

"You should see the ULMS login page. The system is now running!"

---

## Scene 7: IDE Configuration (3 minutes)

**[Visual: IntelliJ settings]**

**Narrator:**
"Let's configure IntelliJ for optimal development."

"Recommended plugins:"
- Lombok
- MapStruct Support
- Rainbow Brackets
- .env files support

**[Visual: Code style settings]**

"Import the code style:"
- File → Settings → Editor → Code Style
- Import Scheme → IntelliJ IDEA code style XML
- Select backend/config/intellij-code-style.xml

**[Visual: Run configurations]**

"Create run configurations:"
- Backend: UlmsApplication with profile 'dev'
- Frontend: npm run dev

---

## Scene 8: Verification (1 minute)

**[Visual: Browser - testing the application]**

**Narrator:**
"Let's verify everything is working."

"1. Login with test credentials:
   - Username: dev.user@bank.com
   - Password: DevPass123!"

"2. Navigate to Dashboard"

"3. Create a test customer"

"4. Create a test loan application"

"If all steps work, your environment is ready!"

---

## Scene 9: Conclusion (1 minute)

**[Visual: Summary slide]**

**Narrator:**
"Congratulations! Your ULMS development environment is now set up."

"Key takeaways:
- Use Docker for dependencies
- Backend runs on port 8080
- Frontend runs on port 5173
- Dev profile has pre-configured settings
- Use IntelliJ for backend, VS Code for frontend (optional)"

"Next steps:
- Review the Codebase Navigation Guide
- Explore the Common Development Tasks Guide
- Join the developer Slack channel"

"For help, contact: dev-support@uslbd.com"

**[Visual: Contact information and resources]**

"Thank you for watching!"

---

## Production Notes

### Recording Checklist

- [ ] Screen recording software configured (OBS/ Camtasia)
- [ ] Audio quality tested
- [ ] All terminal commands tested
- [ ] Sample data prepared
- [ ] Zoom level appropriate for text readability

### Post-Production

- [ ] Add captions/subtitles
- [ ] Add zoom highlights for important clicks
- [ ] Add chapter markers
- [ ] Compress for web streaming
- [ ] Upload to training portal

### Related Materials

- Video file: ULMS-Dev-Setup-Video-v1.0.mp4
- Location: Training Portal / Developer Onboarding
- Companion document: Codebase Navigation Guide

---

**Document Control Footer**

*Classification: Internal - Training*
*Next Review: Per Release*
*Owner: Training Lead*

**END OF DOCUMENT**
