# WorkSearch - AI Agent Context

> This file helps AI assistants understand the project state and continue work.
> Last updated: 2026-02-19

## Project Overview

**WorkSearch** is a job application tracking app with a Kanban board UI, responsive design, and analytics.

- **Stack**: NestJS (API) + React/Vite (Web) + PostgreSQL + Prisma
- **Auth**: Session cookies with express-session, avatar dropdown with role-based access
- **State Machine**: Applications flow through: INTERESTED → APPLIED → SCREENING → INTERVIEW (1/2/3) → OFFER → (ACCEPTED|DECLINED|REJECTED|GHOSTED|TRASH)
- **Responsive**: Optimized for desktop, tablet, and mobile with breakpoint at 1024px

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
        BoardPage.tsx        # Kanban board with drag-drop
        ListPage.tsx         # Table view with filters
        CompaniesPage.tsx    # Companies list with star/revisit flags
        CompanyPage.tsx      # Company detail/edit with notes + visits
        ApplicationPage.tsx  # Application detail/edit
        CalendarPage.tsx     # Monthly calendar view for events
        EventPage.tsx        # Event detail/edit (create/update/delete)
        JobBoardsPage.tsx    # Job boards list with search
        JobBoardPage.tsx     # Job board detail/edit
        AdminUsersPage.tsx   # Admin user management
        SankeyPage.tsx       # State transition Sankey analytics
        HeatmapPage.tsx      # GitHub-style activity heatmap
        SwimlanePage.tsx     # Application timeline swimlane view
        SettingsPage.tsx     # User settings (placeholder)
        ProfilePage.tsx      # User profile (placeholder)
      theme.tsx      # Theme context with dark mode support
      components/
        ui/          # Reusable UI components (Button, Spinner, etc.)
      lib/
        stateColors.ts  # State color/label constants shared across views
docs/
  specs/         # Original requirements
```

## Implementation Status

### ✅ Complete

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Auth (login/logout/me) | ✅ | ✅ | Session cookies |
| Avatar Dropdown | ✅ | ✅ | Color-coded user avatars with menu (Profile/Settings/Display Mode/Admin/Logout) |
| Theme System | ✅ | ✅ | Dark mode (light mode placeholder) |
| Companies CRUD | ✅ | ✅ | With ownership, star/revisit flags, markdown notes |
| Company Search | ✅ | ✅ | Filter by name |
| Company Filters | ✅ | ✅ | Filter by starred or revisit flag |
| Company Detail Page | ✅ | ✅ | Create/edit, markdown notes, star/revisit toggles, visit history, apps list with applied dates |
| Company Visits | ✅ | ✅ | Track check-ins with timestamps, notes, status |
| Applications CRUD | ✅ | ✅ | Full state machine with 3 interview stages |
| Application Creation | ✅ | ✅ | Two-button flow: "Save as Interested" or "Create Application" (starts in APPLIED state) |
| Kanban Board | ✅ | ✅ | Drag-drop moves |
| List View | ✅ | ✅ | Search + filter + sort |
| List View Analytics | ✅ | ✅ | Dashboard stats (applied/interviewed/passed on) |
| Timeline Graph | ✅ | ✅ | Interactive 30/60/90/365-day chart with company tooltips and date filtering |
| Tags | ✅ | ✅ | Simple string array |
| Application Detail Page | ✅ | ✅ | Edit all fields including applied date, title, URL, tags, markdown description |
| Applied Date | ✅ | ✅ | Editable field, auto-set on APPLIED creation, filterable by date |
| Transition History | ✅ | ✅ | Inline editing of transition dates and notes |
| Job Boards | ✅ | ✅ | Save job board bookmarks with markdown notes and search |
| Work Location Type | ✅ | ✅ | REMOTE/ONSITE/HYBRID/CONTRACT with compact badges (R/O/H/C) |
| Application Flags | ✅ | ✅ | Easy Apply (⚡), Cover Letter (📝), Hot (🔥) checkboxes |
| Hot Applications | ✅ | ✅ | Fire icon toggle, auto-dated, "Check Hot" cleans stale (>1 month) |
| Admin User CRUD | ✅ | ✅ | Full admin panel at /admin/users |
| Sankey Analytics | ✅ | ✅ | State transition flow visualization |
| Heatmap Analytics | ✅ | ✅ | GitHub-style activity heatmap at /analytics/heatmap |
| Swimlane / Timeline | ✅ | ✅ | Per-application timeline bars at /analytics/timeline |
| Calendar / Events | ✅ | ✅ | Monthly calendar view + full Events CRUD (/calendar, /events/:id) |
| Responsive Design | ✅ | ✅ | Card layouts for mobile/tablet, tables for desktop (1024px breakpoint) |

### 🔲 Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Light Mode | Low | Infrastructure exists, needs styling |
| Settings Page | Low | Placeholder exists |
| Profile Page | Low | Basic display only |
| Sorting within columns | Low | By date, company name |
| Bulk Actions | Low | Multi-select to trash |
| Export/Import CSV | Low | |
| E2E Tests | Medium | |
| Self-Service Password | Medium | User changes own password |
| Company AI Autofill | Low | LLM-powered company info lookup |

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
INTERVIEW → INTERVIEW_2, OFFER, REJECTED, GHOSTED, TRASH
INTERVIEW_2 → INTERVIEW_3, OFFER, REJECTED, GHOSTED, TRASH
INTERVIEW_3 → OFFER, REJECTED, GHOSTED, TRASH
OFFER → ACCEPTED, DECLINED, REJECTED, GHOSTED
ACCEPTED → (terminal)
DECLINED → (terminal)
REJECTED → (terminal)
GHOSTED → (terminal)
TRASH → (terminal)
```

## API Endpoints

```
POST   /api/auth/login     { email, password }
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/companies      ?search=&starred=&revisit=
POST   /api/companies      { name, website?, notesMd?, star?, revisit? }
GET    /api/companies/:id
PATCH  /api/companies/:id  { name?, website?, notesMd?, star?, revisit? }
DELETE /api/companies/:id
GET    /api/companies/:id/visits
POST   /api/companies/:id/visits { note?, status? }

GET    /api/applications   ?state=&search=&sort=&order=&from=&to=
GET    /api/applications/timeline ?days=30|60|90|365
POST   /api/applications   { companyId, jobTitle, jobReqUrl?, initialState? }
GET    /api/applications/:id
PATCH  /api/applications/:id { jobTitle?, jobReqUrl?, jobDescriptionMd?, tags?, appliedAt? }
POST   /api/applications/:id/move { toState, note? }
DELETE /api/applications/:id

GET    /api/job-boards     ?search=
POST   /api/job-boards     { name, link?, notesMd? }
GET    /api/job-boards/:id
PATCH  /api/job-boards/:id { name?, link?, notesMd? }
DELETE /api/job-boards/:id

GET    /api/events        ?from=&to=&companyId=&applicationId=&type=
POST   /api/events        { title, eventType?, scheduledAt?, notesMd?, companyId?, applicationId? }
GET    /api/events/:id
PATCH  /api/events/:id    { title?, eventType?, scheduledAt?, notesMd?, companyId?, applicationId? }
DELETE /api/events/:id

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
- [docs/specs/040-deployment.md](docs/specs/040-deployment.md) - Deployment notes
- [docs/specs/050-future-features.md](docs/specs/050-future-features.md) - Backlog / future work
