# Evaluator Service

> Secure, containerized code execution microservice for multi-language programming assessment

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Workflow](#workflow)
- [Docker Execution Strategy](#docker-execution-strategy)
- [Queue System](#queue-system)
- [Monitoring](#monitoring)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

The Evaluator Service executes user-submitted code in isolated Docker containers. It consumes jobs from a queue, compiles and runs code in multiple languages, enforces resource limits and timeouts, and returns execution results with security and scalability in mind.

**Key Features:**
- 🔒 Isolated Docker container execution
- ⚡ Asynchronous job processing with BullMQ
- 🌐 Multi-language support (Python, Java, C++)
- ⏱️ Configurable timeouts and resource limits
- 📊 Real-time monitoring with Bull Board UI
- 🎯 Automated result validation

---

## Architecture

**Service Type:** Background Worker (Queue Consumer)

**Data Flow:**
```
Submission Service → SubmissionQueue → Evaluator Service
                                             ↓
                                    Docker Container Execution
                                             ↓
                                    EvaluationQueue → Submission Service
```

**Responsibilities:**
- Execute code in isolated containers (256MB limit, 2s timeout)
- Compile and run Python, Java, and C++ code
- Decode Docker stream output and validate results
- Send structured results (SUCCESS, WRONG ANSWER, TLE, ERROR) to queue

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18+ with TypeScript |
| **Framework** | Express.js |
| **Queue** | BullMQ with Redis |
| **Containerization** | Dockerode (Docker API) |
| **Logging** | Winston |
| **Monitoring** | Bull Board UI |
| **Validation** | Zod |

**Project Structure:**
```
src/
├── config/         # Redis, logger, Bull Board
├── containers/     # Executor strategies (Python/Java/C++)
│   ├── containerFactory.ts
│   ├── dockerHelper.ts
│   └── [language]Executor.ts
├── jobs/           # Job handler definitions
├── workers/        # Queue workers
├── queues/         # Queue definitions
├── producers/      # Result publishers
├── types/          # TypeScript interfaces
└── utils/          # Executor factory, stream decoder
```

---

## Prerequisites

- **Docker Desktop** - Running and accessible
- **Redis Server** >= 6.0
- **Node.js** >= 18.0
- **npm** or **yarn** - Latest stable version

**Quick Verification:**
```bash
docker ps && redis-cli ping && node --version
```

---

## Installation

```bash
# Clone and install
git clone <repository-url>
cd evaluator-service
npm install

# Start the service
npm run dev    # Development with hot reload
npm start      # Production
```

---

## Configuration

Create `.env` file:

```env
PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Workflow

1. **Job Reception:** Worker consumes job from SubmissionQueue with code, language, test cases
2. **Image Management:** Pull Docker image if not cached (python:3.8-slim, eclipse-temurin:17, gcc:latest)
3. **Execution:** Create container → Inject code + input → Execute with timeout → Capture output
4. **Result Processing:** Decode stream → Compare output → Send status to EvaluationQueue
5. **Cleanup:** Remove container to free resources

---

## Docker Execution Strategy

Each language implements **Strategy Pattern** for flexible execution.

### Container Configuration

| Parameter | Value |
|-----------|-------|
| Memory Limit | 256MB |
| Network | Disabled |
| Timeout | 2 seconds |
| Isolation | Separate container per execution |

### Code Injection

**Example (C++):**
```bash
echo '<code>' > main.cpp && g++ main.cpp -o main && echo '<input>' | ./main
```

### Stream Decoding

Docker multiplexes stdout/stderr into a single stream with 8-byte headers. The service decodes this to separate compilation errors from runtime output.

**Supported Languages:**
- **Python** - `python:3.8-slim` image
- **Java** - `eclipse-temurin:17` image
- **C++** - `gcc:latest` image

---

## Queue System

### SubmissionQueue (Consumer)

**Payload:**
```javascript
{
  [submissionId]: {
    userId: "user123",
    submissionId: "sub789",
    code: "<user-code>",
    language: "python",
    inputTestCases: ["5", "10"],
    outputTestCases: ["25", "100"]
  }
}
```

### EvaluationQueue (Producer)

**Payload:**
```javascript
{
  submissionId: "sub789",
  userId: "user123",
  status: "SUCCESS",
  output: "25\n100",
  executionTime: 0.234
}
```

**Status Values:** `SUCCESS` | `WRONG ANSWER` | `Time Limit Exceeded` | `ERROR`

---

## Monitoring

Access Bull Board UI at `http://localhost:3001/ui`

**Available Metrics:**
- Active/completed/failed jobs
- Job processing times
- Queue health status

---

## Error Handling

| Error Type | Handling Strategy | Status |
|-----------|------------------|--------|
| **Compilation Errors** | Captured from stderr | ERROR |
| **Runtime Errors** | Exception traces in output | ERROR |
| **Timeout** | Container killed after 2s | Time Limit Exceeded |
| **Docker Failures** | Logged with message | ERROR |

### Timeout Implementation

Uses flag-based approach to prevent race conditions between stream end events and timeout triggers.

---

## Troubleshooting

### Docker Connection Failed

```bash
# Ensure Docker is running
docker ps

# Check Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Redis Connection Error

```bash
# Verify Redis is running
redis-cli ping
# Expected: PONG
```

### Port Already in Use

```bash
# Change PORT in .env or kill process
lsof -ti:3001 | xargs kill -9
```

### Jobs Not Processing

```bash
# Check queue depth
redis-cli LLEN bull:SubmissionQueue:wait

# Verify worker is running
ps aux | grep node

# Check Bull Board
curl http://localhost:3001/ui
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

ISC License

---

<p align="center">
  Made with ❤️ by <b>Krrish</b><br>
  <a href="https://github.com/yourusername/evaluator-service">Repository</a> •
  <a href="https://github.com/yourusername/evaluator-service/issues">Report Bug</a>
</p>
