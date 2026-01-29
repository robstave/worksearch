# WorkSearch API

NestJS + Prisma + PostgreSQL backend for the WorkSearch job application tracker.

## Quick Start

The API runs via Docker Compose from the project root:

```bash
cd /path/to/worksearch
docker compose up -d
```

API will be available at `http://localhost:3000`

## Default Admin User

After starting the stack, seed the database with a default admin:

```bash
docker compose exec api npx ts-node prisma/seed.ts
```

| Field | Value |
|-------|-------|
| Email | `admin@worksearch.local` |
| Password | `admin123` |
| Role | `admin` |

⚠️ **Change this password after first login!**

## Database Commands

```bash
# Push schema changes to database
docker compose exec api npx prisma db push

# Run seed script
docker compose exec api npx ts-node prisma/seed.ts

# Open Prisma Studio (database GUI)
docker compose exec api npx prisma studio

# Generate Prisma client after schema changes
docker compose exec api npx prisma generate
```

## API Endpoints

### Health Check
- `GET /` - Returns "Hello World!"
- `GET /api/health` - Returns status, database connection, user count

### Auth
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Clear session
- `GET /auth/me` - Get current user

### Companies
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /companies/:id` - Get company
- `PATCH /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

### Applications
- `GET /applications` - List applications
- `POST /applications` - Create application
- `GET /applications/:id` - Get application
- `PATCH /applications/:id` - Update application
- `POST /applications/:id/move` - Transition state

## Environment Variables

Set in `.env` at project root (used by docker-compose):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (composed from POSTGRES_*) |
| `APP_SECRET` | Session/cookie signing secret | - |
| `FRONTEND_ORIGIN` | CORS allowed origin | `http://localhost:5173` |

## Development

```bash
# Run locally without Docker
npm install
npm run start:dev

# Run tests
npm test

# Lint
npm run lint
```
