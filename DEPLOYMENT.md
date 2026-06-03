# Deployment (fast path to a live URL)

This repo supports a “single VPS” deployment via `docker-compose.prod.yml` (Caddy + Nginx + NestJS + Postgres). This is the fastest way to get a stable, testable live URL without splitting services across multiple providers.

If you prefer managed hosting, see `PRODUCTION.md` (Option B) for the split frontend/backend approach.

## Preferred path: single VPS + Docker Compose

### 0) What you need

- A VPS (Ubuntu/Debian recommended) with Docker installed (and the Docker Compose plugin).
- Two DNS records pointing to the VPS public IP:
  - `APP_DOMAIN` (example: `app.example.com`)
  - `API_DOMAIN` (example: `api.example.com`)

### 1) Copy the repo to the server

Any method is fine (git clone, rsync, etc.). The server should have this repo checked out on disk.

### 2) Create a production `.env` on the server

In the repo root on the server (same folder as `docker-compose.prod.yml`), create `.env` (do not commit):

```bash
# Database
POSTGRES_PASSWORD=change_me

# Auth (>= 32 chars each)
JWT_ACCESS_SECRET=change_me_at_least_32_chars
JWT_REFRESH_SECRET=change_me_at_least_32_chars

# TLS + domains
LETSENCRYPT_EMAIL=you@company.com
APP_DOMAIN=app.example.com
API_DOMAIN=api.example.com

# Frontend build-time API URL
VITE_API_URL=https://api.example.com

# Backend CORS allowlist (comma-separated origins)
FRONTEND_URL=https://app.example.com

# Payments (Midtrans) - required by current prod compose
MIDTRANS_SERVER_KEY=change_me
VITE_MIDTRANS_CLIENT_KEY=change_me
MIDTRANS_ENV=production
VITE_MIDTRANS_ENV=production
```

### 3) Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4) Verify + capture your live URL

- App should be reachable at `https://APP_DOMAIN`
- API should be reachable at `https://API_DOMAIN`

Put the final app URL into `LIVE_URL.txt`.

## Notes / common pitfalls

- Vite variables are baked in at build time; for prod you must set `VITE_API_URL` before building.
- If you don’t want payments enabled for the demo, we can make `MIDTRANS_SERVER_KEY` optional in `docker-compose.prod.yml` (tell me what the evaluator expects).

