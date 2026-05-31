<div align="center">
  <h1>🔐 AuthForge</h1>
  <p><strong>Enterprise Authentication & Authorization Platform</strong></p>
  <p>A production-ready, security-first authentication service built with modern best practices</p>

  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

  <br />
  
  [Features](#-features) •
  [Architecture](#-architecture) •
  [Quick Start](#-quick-start) •
  [API Docs](#-api-documentation) •
  [Security](#-security)

</div>

---

## 🎯 Overview

**AuthForge** is a centralized authentication and authorization microservice designed to provide secure, reusable identity management for multiple applications. Built with TypeScript, it implements industry best practices for enterprise security.

### Why AuthForge?

| Challenge | Solution |
|-----------|----------|
| Multiple apps need auth | Centralized service, single integration |
| Security complexity | Pre-built with OWASP guidelines |
| Token management | Automatic rotation & revocation |
| Permission sprawl | Flexible RBAC with hierarchical scopes |

---

## ✨ Features

### 🔐 Authentication

- **JWT-based** stateless authentication with RS256/HS256
- **Refresh Token Rotation** — automatic token rotation on use
- **Multi-Factor Authentication** — TOTP, WebAuthn ready
- **OAuth2 Ready** — Authorization Code + PKCE flow support

### 🛡️ Security

- **Argon2id Password Hashing** — memory-hard, GPU-resistant
- **Brute Force Protection** — IP + account-based throttling
- **Rate Limiting** — sliding window algorithm with Redis
- **Security Headers** — Helmet.js with strict CSP
- **Input Sanitization** — protection against XSS, SQL injection

### 👥 Access Control

- **Role-Based Access Control (RBAC)** — flexible role hierarchy
- **Permission Scopes** — `resource:action:scope` format
- **Wildcard Permissions** — `*:*:*` for super admins
- **Scope Hierarchy** — `all > org > own`

### 📊 Observability

- **Audit Logging** — security event tracking
- **Request Tracing** — X-Request-ID propagation
- **Health Checks** — Kubernetes-ready endpoints

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                     │
│              (Web, Mobile, API, Microservices)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        AuthForge API                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ Auth Service │  │ Token Service│  │   RBAC Engine     │   │
│  │  - Login     │  │  - Generate  │  │   - Permissions   │   │
│  │  - Signup    │  │  - Validate  │  │   - Roles         │   │
│  │  - Logout    │  │  - Revoke    │  │   - Policies      │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │PostgreSQL│    │  Redis   │    │  Audit   │
    │ (Users,  │    │ (Tokens, │    │  (Logs)  │
    │  Roles)  │    │  Cache)  │    │          │
    └──────────┘    └──────────┘    └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Option 1: Docker (Recommended)

```bash
# Clone and start
git clone <repo-url> && cd AuthForge

# Start all services
docker-compose up -d

# Run migrations
docker-compose run migrate

# API available at http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Test the API

```bash
# Login with demo admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@authforge.io","password":"Admin@123456!"}'
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup` | Register new user |
| `POST` | `/api/v1/auth/login` | Authenticate user |
| `POST` | `/api/v1/auth/logout` | Terminate session |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset |
| `POST` | `/api/v1/auth/reset-password` | Reset with token |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/me` | Get current user |
| `PATCH` | `/api/v1/users/me` | Update profile |
| `GET` | `/api/v1/users` | List users (admin) |
| `POST` | `/api/v1/users/:id/roles` | Assign role (admin) |

### Full API Documentation

📖 See [OpenAPI Specification](./docs/openapi.yaml)

---

## 🔒 Security

### Password Requirements

- Minimum 12 characters
- Uppercase + lowercase letters
- Numbers + special characters
- Breach database checking (HaveIBeenPwned)

### Token Strategy

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access | 15 minutes | Memory |
| Refresh | 7 days | HttpOnly Cookie |

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| Login | 5 / 15 min |
| Signup | 3 / hour |
| API | 100 / min |

---

## 📁 Project Structure

```
AuthForge/
├── src/
│   ├── config/         # Configuration & database
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, rate limiting, security
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helpers & validators
├── prisma/
│   ├── schema.prisma   # Database models
│   └── seed.ts         # Initial data
├── tests/              # Test suite
├── docs/               # API documentation
├── examples/           # Integration examples
└── docker-compose.yml  # Container orchestration
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript 5.x |
| **Framework** | Express.js |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache** | Redis |
| **Auth** | JWT (jsonwebtoken) |
| **Password** | Argon2id |
| **Validation** | Zod |
| **Security** | Helmet, CORS, Rate Limiting |
| **Testing** | Jest + Supertest |
| **Container** | Docker + Docker Compose |

---

## 📄 License

MIT © 2026

---

<div align="center">
  <sub>Built with ❤️ for enterprise security</sub>
</div>
