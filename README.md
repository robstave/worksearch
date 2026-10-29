<div align="center">

# 🐱 WorkSearch

**Your job hunt, organized.**

A self-hosted job application tracker with Kanban and list views, filtering, analytics, and full control over your data.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)

</div>

---

## ✨ Features

- Track applications from INTERESTED through outcome states
- Use Kanban and list views with search, filters, and sorting
- Manage companies with notes, starred/revisit flags, and visit history
- Save job boards with links and notes
- Tag roles and filter by work location (Remote, Hybrid, Onsite, Contract)
- Review analytics (Sankey flow, heatmap, and timeline/swimlane views)
- Manage events on a calendar with follow-up support
- Run multi-user with role-based access and an admin panel
- Self-host everything with your data staying on your infrastructure

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- That's it! Everything runs in containers.

### 1. Clone and Configure

```bash
git clone https://github.com/robstave/worksearch.git
cd worksearch

# Create your environment file
cp .env.example .env

# Edit .env and set a secure APP_SECRET (any long random string)
```

### 2. Start the Stack

```bash
docker compose up -d
```

### 3. Open and Sign In

| Service | URL |
|---------|-----|
| **Web App** | [http://localhost:5173](http://localhost:5173) |
| **API** | [http://localhost:3000/api](http://localhost:3000/api) |

**Default credentials:**

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | `admin@worksearch.local` | `admin123` | Full access + user management |
| Demo | `demo@worksearch.local` | `demo123` | Standard user |

> ⚠️ Change these passwords after first login.

---

## 📸 Screenshots

 
### Kanban Board
*Drag applications between columns as they progress*

![Kanban Board](docs/images/ws2-kaban.png)

### List View
*Search, filter, and sort all your applications*

![List View](docs/images/ws2-list.png)

### Application Detail
*Job detail editing with markdown support*

![Application Form](docs/images/ws2-app.png)

### Analytics
*Sankey diagram showing your application flow*

![Sankey Diagram](docs/images/ws2-sankey.png)

 
---

## 🔄 Application States

Applications flow through a state machine:

```mermaid
stateDiagram-v2
    [*] --> INTERESTED
    
    INTERESTED --> APPLIED
    INTERESTED --> TRASH
    
    APPLIED --> SCREENING
    APPLIED --> REJECTED
    APPLIED --> GHOSTED
    APPLIED --> TRASH
    
    SCREENING --> INTERVIEW
    SCREENING --> REJECTED
    SCREENING --> GHOSTED
    SCREENING --> TRASH
    
    INTERVIEW --> INTERVIEW_2
    INTERVIEW --> OFFER
    INTERVIEW --> REJECTED
    INTERVIEW --> GHOSTED
    INTERVIEW --> TRASH

    INTERVIEW_2 --> INTERVIEW_3
    INTERVIEW_2 --> OFFER
    INTERVIEW_2 --> REJECTED
    INTERVIEW_2 --> GHOSTED
    INTERVIEW_2 --> TRASH

    INTERVIEW_3 --> OFFER
    INTERVIEW_3 --> REJECTED
    INTERVIEW_3 --> GHOSTED
    INTERVIEW_3 --> TRASH
    
    OFFER --> ACCEPTED
    OFFER --> DECLINED
    OFFER --> REJECTED
    OFFER --> GHOSTED
    
    ACCEPTED --> [*]
    DECLINED --> [*]
    REJECTED --> [*]
    GHOSTED --> [*]
    TRASH --> [*]
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, TypeScript |
| **Backend** | NestJS, Prisma ORM, Express Session |
| **Database** | PostgreSQL |
| **Deployment** | Docker Compose |

---

## 📁 Project Structure

```
worksearch/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/        # Session authentication
│   │   │   ├── companies/   # Company CRUD
│   │   │   ├── applications/# Applications + state machine
│   │   │   ├── job-boards/  # Job board bookmarks
│   │   │   └── admin/       # User administration
│   │   └── prisma/          # Database schema & migrations
│   │
│   └── web/                 # React frontend
│       └── src/
│           ├── pages/       # Route components
│           ├── components/  # Shared UI components
│           └── api.ts       # Typed API client
│
├── docs/
│   └── specs/               # Feature specifications
│
└── docker-compose.yml       # One-command deployment
```

---

## 🔧 Development

### Running Locally (Without Docker)

```bash
# API
cd apps/api
npm install
npm run start:dev

# Web (in another terminal)
cd apps/web
npm install
npm run dev
```

### Database Commands

```bash
# Run migrations
docker compose exec api npx prisma migrate dev

# Reset database (⚠️ destroys data)
docker compose exec api npx prisma migrate reset --force

# Seed default users
docker compose exec api npm run db:seed

# Open Prisma Studio (database GUI)
docker compose exec api npx prisma studio
```

### Backup and Restore

**⚠️ Important:** Always back up before running migrations or resets.

```bash
# Create a backup
docker compose exec db pg_dump -U postgres worksearch > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup (⚠️ will overwrite current data)
docker compose exec -T db psql -U postgres worksearch < backup-20260206-210000.sql

# Quick backup before risky operations
docker compose exec db pg_dump -U postgres worksearch > backup-before-migration.sql
```

### Logs

```bash
docker compose logs -f api   # Backend logs
docker compose logs -f web   # Frontend logs
docker compose logs -f db    # Database logs
```

---

## 🔐 User Roles

| Role | Capabilities |
|------|-------------|
| `admin` | Everything + User management panel |
| `aiuser` | Everything + AI features (coming soon) |
| `user` | Companies, Applications, Job Boards |

---

## 🗺️ Roadmap

- [x] Core application tracking
- [x] Kanban board with drag-drop
- [x] Multi-user with admin panel
- [x] Analytics dashboard
- [x] Application notes/events timeline
- [ ] AI-powered company autofill
- [ ] CSV import/export
- [x] Mobile-optimized views
- [ ] Browser extension for quick capture

---

## 🤝 Contributing

Contributions welcome! Please read the specs in `/docs/specs/` to understand the project architecture.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for personal use. See LICENSE file for details.

---

<div align="center">

Built for focused, consistent job-search execution.

</div>
