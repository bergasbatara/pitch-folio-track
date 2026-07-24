# Pitch Folio Track

Full-stack business finance app:
- Frontend: React + Vite + Tailwind/shadcn
- Backend: NestJS + Prisma
- Database: PostgreSQL

## Local setup (recommended)

### Prereqs
- Node.js 18+ (Node 20+ OK)
- npm
- Docker (recommended for local Postgres)

### 1) Start Postgres (Docker)

```bash
cd src/backend
docker compose up -d
```

This exposes Postgres on `localhost:5433` (see `src/backend/docker-compose.yml`).

### 2) Configure backend env

Create `src/backend/.env` (you can start from `src/backend/.env.example`):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pitch_folio_track
JWT_ACCESS_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
PORT=3000
FRONTEND_URL=http://localhost:8080

# Payments (optional for local dev; leave empty if not testing payments)
MIDTRANS_SERVER_KEY=
MIDTRANS_ENV=sandbox
```

### 3) Migrate + seed + run backend

```bash
cd src/backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
npm run start:dev
```

Backend runs at `http://localhost:3000`.

### 4) Configure frontend env

Root `.env` already exists for local dev. Ensure it points at your backend:

```bash
VITE_API_URL=http://localhost:3000
VITE_MIDTRANS_ENV=sandbox
VITE_MIDTRANS_CLIENT_KEY=
```

### 5) Run frontend

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`.

## Tests (optional)

```bash
# frontend
npm test

# backend
cd src/backend
npm test
```

### Browser e2e (Playwright)

Playwright runs the app in a real Chromium browser and covers full user flows across frontend + backend.

```bash
# one-time browser install
npx playwright install chromium

# run browser e2e
npm run test:browser
```

Playwright uses the local app on:
- frontend: `http://localhost:8080`
- backend: `http://localhost:3000`

It will reuse already-running local dev servers on those ports when available.

Current Playwright flows cover:
- register + onboarding
- business vs professional route gating
- renewal navigation from subscription to payment

## Production

- Single-server Docker Compose: `docker-compose.prod.yml` + `deploy/` (Caddy + Nginx + Nest + Postgres)
- Fast path to a live URL: `DEPLOYMENT.md`
- More detailed guidance (VPS + managed hosting): `PRODUCTION.md`

## Backend API (selected endpoints)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

### Company
- `GET /companies/current`
- `PATCH /companies/:companyId`

### Reports
- `GET /companies/:companyId/reports/daily?date=YYYY-MM-DD`

## Notes

- Vite env vars are baked in at build time (set `VITE_API_URL` correctly before building).
- The backend expects `FRONTEND_URL` (comma-separated origins in production) for CORS/CSRF configuration.

Edit