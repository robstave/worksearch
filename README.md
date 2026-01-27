# Job Search Tracker

Spec-kit-driven job search tracking application.

- Backend: NestJS + Postgres
- Frontend: Vite + React + Tailwind
- Deployment: Docker Compose (local + Proxmox)

Specs live in /docs.

## Quickstart (Docker Compose)

1) Create env file:

- Copy `.env.example` to `.env`
- Set at least `APP_SECRET` (long random string)

2) Start services:

- `docker compose up -d`

3) URLs:

- API: `http://localhost:${API_PORT:-3000}/api`
- Web: `http://localhost:${WEB_PORT:-5173}`

