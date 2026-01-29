# WorkSearch - AI Agent Context

> This file helps AI assistants understand the project state and continue work.
> Last updated: 2026-01-27

## Project Overview

**WorkSearch** is a job application tracking app with a Kanban board UI.

- **Stack**: NestJS (API) + React/Vite (Web) + PostgreSQL + Prisma
- **Auth**: Session cookies with express-session
- **State Machine**: Applications flow through: INTERESTED → APPLIED → SCREENING → INTERVIEW → (REJECTED|GHOSTED|TRASH)

## Quick Start

```bash
# Start everything
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f api
docker compose logs -f web

# Login credentials (dev)
# Admin
# Email: admin@worksearch.local
# Password: admin123
#
# Demo
# Email: demo@worksearch.local
# Password: demo123
```

## Project Structure

```
apps/
  api/           # NestJS backend (port 3000)
    src/
      auth/      # Session-based auth (login/logout/me)
      companies/ # Company CRUD
      applications/ # Applications CRUD + state machine
      job-boards/  # Job Boards CRUD
      prisma/    # PrismaService
    prisma/
      schema.prisma
      seed.ts    # Creates default users (admin + demo)
  web/           # React/Vite frontend (port 5173)
    src/
      api.ts     # Typed API client
      auth.tsx   # AuthProvider context
      Layout.tsx # Protected nav layout
      pages/
        LoginPage.tsx
        BoardPage.tsx    # Kanban board with drag-drop
        ListPage.tsx     # Table view with filters
        CompaniesPage.tsx
        ApplicationPage.tsx  # Application detail/edit
        JobBoardsPage.tsx    # Job boards list
        JobBoardPage.tsx     # Job board detail/edit
docs/
  specs/         # Original requirements
```

## Implementation Status

### ✅ Complete

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Auth (login/logout/me) | ✅ | ✅ | Session cookies |
| Companies CRUD | ✅ | ✅ | With ownership |
| Applications CRUD | ✅ | ✅ | Full state machine |
| Kanban Board | ✅ | ✅ | Drag-drop moves |
| List View | ✅ | ✅ | Search + filter |
| Tags | ✅ | ✅ | Simple string array |
| Application Detail Page | ✅ | ✅ | Title, URL, tags, markdown description |
| Applied Date | ✅ | ✅ | Captured on APPLIED transition |
| Job Boards | ✅ | ✅ | Save job board bookmarks with markdown notes |
| Work Location Type | ✅ | ✅ | REMOTE/ONSITE/HYBRID/CONTRACT enum field |
| Admin User CRUD | ✅ | ✅ | Full admin panel at /admin/users |

### 🔲 Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Events/Notes | High | Timestamped notes on applications |
| State Transition History | Medium | Show history in detail view |
| Inline Company Creation | Medium | "Add new" in application modal |
| Sorting within columns | Low | By date, company name |
| Bulk Actions | Low | Multi-select to trash |
| Export/Import CSV | Low | |
| Mobile polish | Low | Board scrollable but could improve |
| E2E Tests | Medium | |
| Self-Service Password | Medium | User changes own password |
| Company AI Autofill | Medium | LLM-powered company info lookup |

## Key Technical Decisions

1. **Prisma 6** (not 7) - v7 has breaking ESM changes, driver adapters
2. **Simple tags** - Using `tagsList String[]` not relational tags (faster MVP)
3. **Session auth** - Not JWT; simpler for single-user local app
4. **Tailwind 4** - Required `@tailwindcss/postcss` and `postcss.config.cjs`

## State Machine Rules

```
INTERESTED → APPLIED, TRASH
APPLIED → SCREENING, REJECTED, GHOSTED, TRASH
SCREENING → INTERVIEW, REJECTED, GHOSTED, TRASH
INTERVIEW → OFFER, REJECTED, GHOSTED, TRASH
OFFER → ACCEPTED, REJECTED, GHOSTED
ACCEPTED → (terminal)
REJECTED → (terminal)
GHOSTED → (terminal)
TRASH → (terminal)
```

## API Endpoints

```
POST   /api/auth/login     { email, password }
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/companies
POST   /api/companies      { name, website? }
GET    /api/companies/:id
PATCH  /api/companies/:id  { name?, website? }
DELETE /api/companies/:id

GET    /api/applications   ?state=&search=&sort=&order=
POST   /api/applications   { companyId, jobTitle, jobReqUrl? }
GET    /api/applications/:id
PATCH  /api/applications/:id { jobTitle?, jobReqUrl?, jobDescriptionMd?, tags? }
POST   /api/applications/:id/move { toState, note? }
DELETE /api/applications/:id

GET    /api/job-boards
POST   /api/job-boards     { name, link?, notesMd? }
GET    /api/job-boards/:id
PATCH  /api/job-boards/:id { name?, link?, notesMd? }
DELETE /api/job-boards/:id

# Admin (requires admin role)
GET    /api/admin/users
POST   /api/admin/users    { email, password, role? }
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id { email?, role? }
POST   /api/admin/users/:id/set-password { password }
DELETE /api/admin/users/:id
POST   /api/admin/users/:id/clear-data
```

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access + admin panel (user CRUD) |
| `aiuser` | All user features + AI features (future) |
| `user` | Standard access: companies, applications, job boards |

## Common Tasks

### Add a new API endpoint

1. Create/update DTO in `apps/api/src/<module>/dto/`
2. Add method to service in `apps/api/src/<module>/<module>.service.ts`
3. Add route to controller in `apps/api/src/<module>/<module>.controller.ts`
4. Add to frontend API client in `apps/web/src/api.ts`

### Add a new page

1. Create component in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.tsx`
3. Add nav link in `apps/web/src/Layout.tsx` (if needed)

### Modify database schema

```bash
# Edit apps/api/prisma/schema.prisma, then:
docker compose exec api npx prisma migrate dev --name <name>
```

### Reset database

```bash
docker compose exec api npx prisma migrate reset --force
docker compose exec api npx prisma db seed
```

## Known Issues / Gotchas

- TypeScript in API container sometimes needs `touch` to trigger recompile
- After Prisma schema changes, may need `docker compose restart api`
- Frontend uses `verbatimModuleSyntax` - must use `import type` for types

## Spec Documents

For detailed requirements, see:

- [docs/specs/000-overview.md](docs/specs/000-overview.md) - High-level goals
- [docs/specs/010-domain-model.md](docs/specs/010-domain-model.md) - Data model
- [docs/specs/020-api-contract.md](docs/specs/020-api-contract.md) - API spec
- [docs/specs/030-ui-spec.md](docs/specs/030-ui-spec.md) - UI requirements
