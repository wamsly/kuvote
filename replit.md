# KUVOTE — Kenyatta University Voting System

## Overview
A full-stack electronic voting platform for Kenyatta University student elections. Built as a pnpm monorepo with a React+Vite frontend and Node.js+Express+Drizzle ORM backend connected to PostgreSQL.

## Architecture

### Monorepo Layout
```
/
├── frontend/          (@workspace/kuvote)    React 19 + Vite 6 + Tailwind
├── backend/           (@workspace/api-server) Express + Drizzle ORM
├── packages/
│   ├── db/            (@workspace/db)         Drizzle schema + DB connection
│   ├── api-zod/       (@workspace/api-zod)    Shared Zod schemas
│   └── api-client-react/ (@workspace/api-client-react) React Query hooks
├── tsconfig.base.json  Shared TS base config
├── pnpm-workspace.yaml Workspace + catalog config
└── package.json        Root workspace (packageManager: pnpm@10.26.1)
```

### Runtime Ports
- **Backend (Express)**: port 8080 — handles `/api/*` routes + proxies everything else to Vite
- **Frontend (Vite)**: port 3000 — React dev server (VITE_PORT env var)
- External: port 8080 → externalPort 80

### Key Design Decisions
- Backend proxies all non-API requests to Vite dev server in development (http-proxy-middleware)
- Frontend Vite uses `VITE_PORT` env var (default: 3000) to avoid conflict with backend `PORT`
- JWT-based authentication stored in localStorage (`kuvote_token`, `kuvote_user`)
- All API calls go through `/api` prefix, proxied by Vite in dev or handled directly by Express

## Database

### PostgreSQL Tables
1. `users` — students and admins (id: UUID, course_id: TEXT, hostel_id: TEXT)
2. `otps` — one-time passwords for email verification
3. `schools` — KU schools (id: TEXT slug)
4. `departments` — departments within schools (id: TEXT slug)
5. `courses` — courses within departments (id: TEXT slug)
6. `hostels` — student accommodation (id: TEXT slug)
7. `polls` — election polls
8. `poll_seats` — seats/positions within a poll (scope_ref_id: TEXT)
9. `candidates` — candidate applications per seat
10. `endorsements` — candidate endorsements
11. `ballot_tokens` — anonymous voting tokens
12. `votes` — encrypted cast votes
13. `audit_log` — system audit trail

### Seed Data
- Admin user: `admin@ku.ac.ke` / `Admin123`
- Catalog (schools, departments, courses, hostels) seeded via `backend/src/seed.ts` on startup

## Environment Variables
- `PORT=8080` — backend port
- `VITE_PORT=3000` — frontend Vite dev server port
- `NODE_ENV=development`
- `LOG_LEVEL=info`
- `SESSION_SECRET` — secret for sessions (stored as Replit secret)
- `DATABASE_URL` — PostgreSQL connection string (Replit-managed)

## Key Files
- `backend/src/index.ts` — entry point, runs seed then starts server
- `backend/src/app.ts` — Express app setup with Vite proxy
- `backend/src/seed.ts` — seeds admin user and catalog data
- `backend/src/routes/` — API route handlers
- `packages/db/src/index.ts` — Drizzle schema definitions + db connection
- `packages/api-client-react/src/index.ts` — all React Query hooks for API calls
- `frontend/src/App.tsx` — client-side routing (wouter)
- `frontend/src/lib/auth.ts` — auth state management
- `frontend/vite.config.ts` — Vite config with API proxy to backend

## Development
Both workflows auto-start:
- `backend: API Server`: `pnpm --filter @workspace/api-server run dev`
- `frontend: web`: `pnpm --filter @workspace/kuvote run dev`
