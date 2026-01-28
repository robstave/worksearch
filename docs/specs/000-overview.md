# 000 - Overview

This project is built using a spec-kit-driven design.

## Pages

- Dashboard (stats + Sankey)
- Applications Board
- Applications List
- Companies
- Job Boards

## Planned / Backlog

### Data portability

- Export applications/companies/job boards to JSON (primary)
- Export to CSV (secondary; useful for spreadsheets)
- Import from JSON (optional; helps backfill historical data)

### Admin actions

- Admin-only “maintenance” actions
  - Export all data (useful for backups)
  - Reset/clear database (dangerous; require confirmations)

### UI/UX

- Night/Day mode toggle (persisted)
- User icon/avatar in the top-right menu
- Kanban: sort cards within columns (e.g., Applied date, Last activity)

## Backend

- NestJS + PostgreSQL

## Frontend

- Vite + React + Tailwind
