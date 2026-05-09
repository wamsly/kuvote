# KUVOTE — Kenyatta University Voting System

A full-stack digital voting platform for Kenyatta University student elections.

---

## Project Structure

```
kuvote/
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   ├── app.ts              # Express application setup
│   │   ├── index.ts            # Server entry point
│   │   ├── seed.ts             # Database seeder
│   │   ├── controllers/        # Business logic handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── polls.controller.ts
│   │   │   ├── candidates.controller.ts
│   │   │   ├── profile.controller.ts
│   │   │   ├── catalog.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── routes/             # API endpoint definitions
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── admin.ts
│   │   │   ├── polls.ts
│   │   │   ├── candidates.ts
│   │   │   ├── profile.ts
│   │   │   ├── catalog.ts
│   │   │   └── health.ts
│   │   ├── middleware/         # Auth, error handling middleware
│   │   │   ├── auth.ts         # requireAuth, requireRole
│   │   │   └── error.ts        # errorHandler, notFoundHandler
│   │   ├── db/                 # Database exports
│   │   │   └── index.ts
│   │   ├── lib/                # Utility functions
│   │   │   ├── auth.ts         # JWT, password hashing, user profile
│   │   │   ├── email.ts        # SendGrid email sending
│   │   │   ├── audit.ts        # Audit log writer
│   │   │   └── logger.ts       # Pino logger
│   │   └── data/
│   │       └── schools.ts      # KU schools/courses seed data
│   ├── .env                    # Environment variables (see setup below)
│   └── package.json
│
├── frontend/         # React + Vite SPA
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   ├── pages/              # Page components (student + admin)
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Auth helpers, utilities
│   ├── public/                 # Static assets
│   ├── .env                    # Frontend environment variables
│   └── package.json
│
└── README.md
```

---

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL database

---

## Installation

```bash
# From the workspace root, install all dependencies
pnpm install
```

---

## Environment Setup

### Backend (`kuvote/backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kuvote
SESSION_SECRET=your-strong-secret-here-change-in-production
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
SENDGRID_API_KEY=        # Optional — OTPs log to console in dev if unset
SENDGRID_FROM=noreply@kuvote.ku.ac.ke
```

### Frontend (`kuvote/frontend/.env`)

```env
VITE_API_URL=http://localhost:8080
```

---

## Running the Application

### Backend

```bash
# From workspace root
pnpm --filter @workspace/api-server run dev

# Or from kuvote/backend/
npm run dev
```

### Frontend

```bash
# From workspace root
pnpm --filter @workspace/kuvote run dev

# Or from kuvote/frontend/
npm run dev
```

---

## API Overview

All API routes are prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/verify-otp` | Email OTP verification |
| POST | `/api/auth/login` | Student login |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/polls` | List polls (authenticated) |
| GET | `/api/polls/:id` | Poll details with seats & candidates |
| POST | `/api/polls/:id/vote` | Cast vote |
| GET | `/api/polls/:id/results` | Poll results (closed polls) |
| POST | `/api/candidates/apply` | Apply as candidate |
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/users` | Manage voters |
| GET | `/api/catalog/schools` | Schools, departments, courses |
| GET | `/api/catalog/hostels` | Available hostels |

---

## Default Admin Account

After first run, the database is seeded with:

- **Email:** `admin@ku.ac.ke`
- **Password:** `Admin123`

Change this password immediately in production.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Custom JWT (HS256) |
| Email | SendGrid |
| Logging | Pino |
