# URL Shortener API

A production-ready URL shortener backend built with NestJS, Prisma, PostgreSQL, and Redis.

## Features

- **URL Shortening**: Generate short, memorable links
- **Custom Short Codes**: Optional custom aliases
- **Link Expiration**: Set expiry dates for links
- **Click Analytics**: Track click counts and visitor metadata
- **Redis Caching**: Fast URL lookups with caching
- **Rate Limiting**: Protect against abuse
- **API Documentation**: Interactive Swagger UI

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, CORS, rate limiting
- **Docs**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose up -d

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run start:dev
```

### Access

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

## API Endpoints

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| POST   | `/urls`             | Create short URL     |
| GET    | `/urls/:code`       | Get URL info         |
| GET    | `/urls/:code/stats` | Get analytics        |
| DELETE | `/urls/:code`       | Delete URL           |
| GET    | `/:code`            | Redirect to original |
| GET    | `/health`           | Health check         |

## Usage Examples

```bash
# Create a short URL
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com"}'

# With custom code
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com", "customCode": "gh"}'

# Get stats
curl http://localhost:3000/urls/gh/stats

# Delete URL
curl -X DELETE http://localhost:3000/urls/gh
```

## Environment Variables

| Variable         | Description                  | Default               |
| ---------------- | ---------------------------- | --------------------- |
| `DATABASE_URL`   | PostgreSQL connection string | -                     |
| `REDIS_HOST`     | Redis host                   | localhost             |
| `REDIS_PORT`     | Redis port                   | 6379                  |
| `BASE_URL`       | Base URL for short links     | http://localhost:3000 |
| `PORT`           | Server port                  | 3000                  |
| `THROTTLE_TTL`   | Rate limit window (seconds)  | 60                    |
| `THROTTLE_LIMIT` | Max requests per window      | 100                   |

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires running DB)
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── config/           # Configuration
├── prisma/           # Database service
├── url/              # URL shortening module
│   ├── dto/          # Data transfer objects
│   ├── url.controller.ts
│   ├── url.service.ts
│   └── url.module.ts
├── health/           # Health checks
├── app.module.ts
└── main.ts
```

## License

MIT
