# URL Shortener API

A **production-ready** URL shortening service built with modern backend technologies. Features comprehensive authentication, analytics tracking, role-based access control, and enterprise-grade logging.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)

## ✨ Features

### Core Functionality

- **URL Shortening**: Generate short, memorable links using nanoid
- **Custom Short Codes**: Create branded, custom aliases
- **Link Expiration**: Set TTL for temporary links
- **Anonymous URLs**: Auto-expire in 24 hours for unauthenticated users
- **Click Analytics**: Track clicks with metadata (IP, User-Agent, Referer)
- **Smart Caching**: Redis-powered URL lookups with fallback to in-memory

### Authentication & Security

- **JWT Authentication**: Access tokens (1h) + Refresh tokens (7d)
- **Role-Based Access Control (RBAC)**: USER and ADMIN roles
- **Password Security**: bcrypt hashing
- **Rate Limiting**: Configurable throttling to prevent abuse
- **Security Headers**: Helmet.js integration
- **CORS**: Configurable cross-origin policies

### Admin Features

- **URL Management**: View and delete all URLs
- **User Management**: List users and update roles
- **System Monitoring**: Health checks for database and cache

### Developer Experience

- **Centralized Logging**: Winston with console + file transports (JSON)
- **API Documentation**: Interactive Swagger/OpenAPI UI
- **Type Safety**: Full TypeScript coverage
- **Validation**: class-validator with DTO pattern
- **Testing**: Unit + E2E test suites

## 🏗️ Tech Stack

| Layer              | Technology                 |
| ------------------ | -------------------------- |
| **Framework**      | NestJS 11                  |
| **Language**       | TypeScript 5.7             |
| **Database**       | PostgreSQL 16 (Prisma ORM) |
| **Cache**          | Redis 7                    |
| **Authentication** | JWT (Passport.js)          |
| **Logging**        | Winston                    |
| **Validation**     | class-validator            |
| **Documentation**  | Swagger/OpenAPI            |
| **Security**       | Helmet, Throttler          |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** & Docker Compose

### Installation

```bash
# Clone the repository
git clone https://github.com/dev-saiful/url-shortener.git
cd url-shortener

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL and Redis
docker-compose up -d

# Push database schema
npx prisma db push

# Start development server
npm run start:dev
```

### Access Points

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint         | Description          | Auth |
| ------ | ---------------- | -------------------- | ---- |
| POST   | `/auth/register` | Register new user    | ❌   |
| POST   | `/auth/login`    | Login user           | ❌   |
| POST   | `/auth/refresh`  | Refresh access token | ❌   |
| POST   | `/auth/logout`   | Logout user          | ❌   |
| GET    | `/auth/me`       | Get current user     | ✅   |

### URL Endpoints

| Method | Endpoint            | Description          | Auth     |
| ------ | ------------------- | -------------------- | -------- |
| POST   | `/urls`             | Create short URL     | Optional |
| GET    | `/urls/:code`       | Get URL info         | ❌       |
| GET    | `/urls/:code/stats` | Get analytics        | ❌       |
| DELETE | `/urls/:code`       | Delete URL           | Optional |
| GET    | `/users/me/urls`    | Get my URLs          | ✅       |
| GET    | `/:code`            | Redirect to original | ❌       |

### Admin Endpoints

| Method | Endpoint                | Description      | Auth     |
| ------ | ----------------------- | ---------------- | -------- |
| GET    | `/admin/urls`           | List all URLs    | 🔐 Admin |
| DELETE | `/admin/urls/:code`     | Delete any URL   | 🔐 Admin |
| GET    | `/admin/users`          | List all users   | 🔐 Admin |
| PATCH  | `/admin/users/:id/role` | Update user role | 🔐 Admin |

### User Endpoints

| Method | Endpoint    | Description    | Auth |
| ------ | ----------- | -------------- | ---- |
| GET    | `/users/me` | Get profile    | ✅   |
| PATCH  | `/users/me` | Update profile | ✅   |

## 💡 Usage Examples

### Register & Login

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Create Short URLs

```bash
# Anonymous URL (expires in 24h)
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com/nestjs/nest"}'

# Authenticated URL (no expiration)
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"originalUrl": "https://github.com"}'

# Custom short code
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://github.com",
    "customCode": "gh"
  }'

# With expiration
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com",
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

### Analytics

```bash
# Get click statistics
curl http://localhost:3000/urls/gh/stats

# Response includes:
# - Total click count
# - Recent clicks (last 10)
# - User agents, referers, timestamps
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urlshortener"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Application
BASE_URL=http://localhost:3000
PORT=3000
CORS_ORIGIN=*

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Docker Services

The `docker-compose.yml` provides:

- **PostgreSQL 16**: Primary database with health checks
- **Redis 7**: Caching layer with persistence

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests (requires running database)
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

**Test Coverage:**

- ✅ Auth integration tests (11 tests)
- ✅ URL operations E2E tests (10 tests)
- ✅ Unit tests for services

## 📁 Project Structure

```
url-shortener/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── admin/                 # Admin management
│   │   ├── admin.controller.ts
│   │   └── admin.service.ts
│   ├── auth/                  # Authentication
│   │   ├── decorators/        # Custom decorators
│   │   ├── dto/               # Data transfer objects
│   │   ├── guards/            # Auth guards
│   │   ├── strategies/        # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── config/                # Configuration
│   │   └── configuration.ts
│   ├── health/                # Health checks
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── prisma/                # Database service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── url/                   # URL shortening
│   │   ├── dto/
│   │   ├── url.controller.ts
│   │   ├── url.service.ts
│   │   └── url.module.ts
│   ├── user/                  # User management
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry
├── test/
│   ├── auth.e2e-spec.ts       # Auth E2E tests
│   └── app.e2e-spec.ts        # URL E2E tests
├── logs/                      # Winston log files
│   ├── combined.log           # All logs (JSON)
│   └── error.log              # Error logs (JSON)
└── docker-compose.yml         # Docker services
```

## 🗄️ Database Schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  name          String?
  role          Role           @default(USER)
  urls          Url[]
  refreshTokens RefreshToken[]
}

model Url {
  id          String    @id @default(uuid())
  shortCode   String    @unique
  originalUrl String
  clickCount  Int       @default(0)
  expiresAt   DateTime?
  userId      String?
  user        User?
  clicks      Click[]
}

model Click {
  id        String   @id @default(uuid())
  urlId     String
  url       Url
  userAgent String?
  referer   String?
  ipAddress String?
  clickedAt DateTime @default(now())
}
```

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Short-lived access tokens + refresh mechanism
3. **Rate Limiting**: Configurable per-endpoint throttling
4. **Input Validation**: DTO validation with class-validator
5. **SQL Injection Protection**: Prisma parameterized queries
6. **CORS**: Configurable origin policies
7. **Security Headers**: Helmet.js middleware

## 📊 Logging

Winston logger configured with:

- **Console Transport**: Pretty-printed for development
- **File Transport (combined.log)**: All logs in JSON format
- **File Transport (error.log)**: Error-level logs only

```typescript
// Logs are automatically written to:
logs / combined.log; // All application logs
logs / error.log; // Error logs only
```

## 🚢 Production Deployment

### Build

```bash
npm run build
npm run start:prod
```

### Recommendations

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
3. **Cache**: Use managed Redis (AWS ElastiCache, Redis Cloud)
4. **Secrets**: Use environment-specific secrets management
5. **Monitoring**: Integrate logs with Datadog, Splunk, or ELK
6. **Reverse Proxy**: Use Nginx or similar for SSL termination

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Saiful Islam**

- GitHub: [@dev-saiful](https://github.com/dev-saiful)

---

**Built with ❤️ using NestJS**
