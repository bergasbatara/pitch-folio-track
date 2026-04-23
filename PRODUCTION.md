# Production deployment (sell to the public)

This repo is a full-stack app:
- Frontend: Vite/React (static files)
- Backend: NestJS (API) + Prisma
- Database: PostgreSQL

## Which path are we going for?

If your goal is **scalability** and “real” production hosting, the recommended path is:

**Path C (Recommended): AWS managed services**
- Frontend: S3 + CloudFront
- Backend: ECS on Fargate (behind an ALB) using the `src/backend/Dockerfile`
- Database: RDS PostgreSQL
- Secrets: AWS Secrets Manager / SSM Parameter Store

This file also includes a concrete “single server” setup for simpler launches:

**Path A: Single VPS (Docker Compose)**

## Path A) Single VPS (Docker Compose)

The simplest self-managed production setup is a single VPS (Docker Compose) with:
- `caddy` as HTTPS reverse proxy (automatic TLS)
- `frontend` served by Nginx
- `backend` private behind the proxy
- `db` private Postgres with a persistent volume

## 1) Prerequisites

- A server (Ubuntu/Debian recommended) with Docker + Docker Compose plugin installed
- A domain with DNS records:
  - `APP_DOMAIN` (e.g. `app.example.com`) → server public IP
  - `API_DOMAIN` (e.g. `api.example.com`) → server public IP

## 2) Create production env file

On the server, in the repo folder, create a `.env` for Compose (do **not** commit it):

```bash
POSTGRES_PASSWORD=change_me
JWT_ACCESS_SECRET=change_me_at_least_32_chars
JWT_REFRESH_SECRET=change_me_at_least_32_chars

LETSENCRYPT_EMAIL=you@company.com
APP_DOMAIN=app.example.com
API_DOMAIN=api.example.com

VITE_API_URL=https://api.example.com

# Backend CORS: comma-separated allowed origins (no wildcard in production)
FRONTEND_URL=https://app.example.com

# Midtrans (if used)
MIDTRANS_SERVER_KEY=change_me
VITE_MIDTRANS_CLIENT_KEY=change_me
MIDTRANS_ENV=production
VITE_MIDTRANS_ENV=production
```

## 3) Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Backend runs `prisma migrate deploy` automatically on startup.

## 4) Verify

- Frontend: `https://APP_DOMAIN/healthz`
- API: `https://API_DOMAIN/` (response depends on `AppController`)

## 5) Operational checklist (recommended before selling)

- **Domains + TLS**
  - Confirm DNS is correct for `APP_DOMAIN` and `API_DOMAIN`.
  - Enforce HTTPS-only (redirect HTTP → HTTPS) and keep TLS cert renewal working (Caddy handles this).
- **Secrets + environment**
  - Use strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (>= 32 chars; not `dev_*`).
  - Store secrets outside git (VPS: `.env` file with correct permissions; cloud: secrets manager).
  - Set `NODE_ENV=production`, `CSRF_ENABLED=true`, `CORS_ALLOW_NO_ORIGIN=false`.
  - Set `FRONTEND_URL` to the exact production origin(s), comma-separated (no wildcards in prod).
- **Database safety**
  - Ensure persistent storage is configured (volume / managed DB).
  - Backups: daily automated backups + verified restore procedure (don’t skip restore testing).
  - Run migrations on deploy (`prisma migrate deploy`) and avoid destructive reset migrations in prod.
  - Don’t seed demo users/data in prod (seed script refuses prod unless `ALLOW_SEED_IN_PROD=true`).
- **Scaling + reliability**
  - Run more than 1 backend instance behind a reverse proxy/load balancer for high availability.
  - Define health checks and restart policies (Compose `restart: unless-stopped` is the minimum).
  - Plan for zero-downtime deploys (rolling update strategy if moving beyond a single VPS).
- **Observability**
  - Centralize logs (at minimum: container logs shipped/retained) and set up alerting.
  - Add error tracking (e.g. Sentry) for frontend + backend so you see production crashes.
  - Add uptime checks for `APP_DOMAIN` and `API_DOMAIN`.
- **Security hardening**
  - Keep rate limits tuned for real traffic (`RATE_LIMIT_*`) and monitor for abuse.
  - Keep dependencies updated and run the backend security scripts periodically (`npm run security:check` in `src/backend`).
  - Confirm cookies are `secure` in production (already tied to `NODE_ENV=production`).
- **Payments (Midtrans)**
  - Use production keys + environment (`MIDTRANS_ENV=production`, `VITE_MIDTRANS_ENV=production`).
  - Verify your payment notification/callback flows end-to-end in production mode before launch.
- **Legal + compliance**
  - Publish Terms + Privacy Policy, and document what data you store and retention/deletion policies.
  - If you’re serving the public, add a support contact and incident response process.

## Option B) Managed hosting (no VPS)

If you prefer not to manage a server:

- Database: managed Postgres (Neon/Supabase/RDS/etc.)
- Backend: container deploy (Render/Fly.io/Railway/etc.) running `npm run prisma:migrate:deploy && node dist/main`
- Frontend: static hosting (Cloudflare Pages/Netlify/Vercel/etc.) built with `VITE_API_URL=https://your-api-domain`

Key points:
- Vite env vars are baked in at build time (so set `VITE_API_URL` correctly for prod builds).
- Keep `FRONTEND_URL` on the backend set to your real app URL(s) (comma-separated), e.g. `https://app.example.com`.

## Path C) AWS (scalable)

Use this when you want to scale to many customers and avoid running Postgres yourself:

- **Network**: VPC with public subnets (ALB/CloudFront) and private subnets (ECS/RDS).
- **Database**: RDS PostgreSQL (private), backups + Multi-AZ as needed.
- **Backend**: ECS/Fargate service + ALB (HTTPS). Run migrations on deploy:
  - container command: `npm run prisma:migrate:deploy && node dist/main`
- **Frontend**: build with `VITE_API_URL=https://api.yourdomain.com`, upload `dist/` to S3, serve via CloudFront.
- **CORS/CSRF**: set `FRONTEND_URL=https://app.yourdomain.com` and keep `CSRF_ENABLED=true` in production.
