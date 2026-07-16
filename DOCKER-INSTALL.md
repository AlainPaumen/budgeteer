# Docker Installation Guide

Deploy Budgeteer using Docker Compose.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Docker Compose                      │
│                                                          │
│  ┌─────────────┐     ┌─────────────┐     ┌────────────┐ │
│  │   Caddy     │────▶│   Web       │     │    API     │ │
│  │   :80/:443  │     │  (scratch)  │     │   :3000    │ │
│  │             │     │             │     │            │ │
│  │ - TLS       │     │ - Static    │     │ - Elysia   │ │
│  │ - SPA       │     │   files     │     │ - SQLite   │ │
│  │ - Proxy     │     │ - Volume    │     │ - Auth     │ │
│  └─────────────┘     └─────────────┘     └────────────┘ │
│         │                                     │          │
│         │         ┌─────────────┐             │          │
│         └────────▶│   Volumes   │◀────────────┘          │
│                   │             │                        │
│                   │ - api-data  │ (SQLite database)      │
│                   │ - api-public│ (built SPA)            │
│                   │ - caddy-data│ (TLS certificates)     │
│                   └─────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

### Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `caddy` | `caddy:2-alpine` | 80, 443 | Reverse proxy, TLS, static file serving |
| `web` | scratch (builder) | - | Builds web SPA, copies to shared volume |
| `api` | `oven/bun:1-slim` | 3000 | Elysia API server |

### How it works

1. **Web** service builds the React SPA and copies the output to the `api-public` volume
2. **API** service runs the Elysia backend, persisting SQLite data to `api-data` volume
3. **Caddy** serves the SPA from `api-public` volume and proxies `/api/*` requests to the API service

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+ (or docker-compose v1)
- Domain pointed to your server IP
- User in the `docker` group (or use `sudo`)

### Docker permissions (first time only)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url> /opt/budgeteer
cd /opt/budgeteer
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Edit with your values:

```bash
nano .env
```

Required:

```
PORT=3000
FRONTEND_URL=https://your-domain.com
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
VITE_API_URL=https://your-domain.com
```

### 3. Configure Caddy

```bash
cp Caddyfile Caddyfile.docker
```

Edit `Caddyfile.docker` — replace `budgeteer.example.com` with your domain:

```bash
nano Caddyfile.docker
```

### 4. Open firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Deploy

### First deploy

```bash
# First deploy
docker-compose up -d --build
# or if you have docker compose v2 plugin:
docker compose up -d --build
```

This will:
1. Build the web SPA
2. Build the API container
3. Start all services

### Updating

After pushing to main:

```bash
./docker-deploy.sh
```

Options:
- `--no-cache` — rebuild without Docker cache
- `--logs` — tail logs after deploy

```bash
# Full rebuild, then tail logs
./docker-deploy.sh --no-cache --logs
```

### Check status

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f caddy
```

### Verify

```bash
# API health check
curl -i https://your-domain.com/api/health

# Check logs
docker compose logs api
docker compose logs caddy
```

## Common commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Rollback

### Option A: Rollback code + database (safest)

Restore both the database and code to the version that created the backup.

```bash
# 1. List available backups (filenames include git commit hash)
docker-compose exec api ls /app/data/budgeteer.db.backup.*
# Example output: budgeteer.db.backup.a8d6e85.2025-07-16T10-30-00

# 2. Stop container
docker-compose down

# 3. Restore database
docker-compose run --rm api cp \
  /app/data/budgeteer.db.backup.<commit>.<timestamp> \
  /app/data/budgeteer.db

# 4. Checkout matching code
git checkout <commit>

# 5. Rebuild and start
docker-compose up -d --build
```

### Option B: Rollback database only (skip migrations)

If the backup is from the **same code version**, skip migrations to avoid conflicts.

```bash
# 1. Restore database
docker-compose run --rm api cp \
  /app/data/budgeteer.db.backup.<commit>.<timestamp> \
  /app/data/budgeteer.db

# 2. Start with migrations skipped
SKIP_MIGRATIONS=true docker-compose up -d
```

### Backup details

- Backups are created automatically on each container startup (before migrations)
- Backup filename: `budgeteer.db.backup.<git-hash>.<timestamp>`
- Only the last 5 backups are kept (older ones are deleted)
- Backups are stored in the `api-data` volume at `/app/data/`

## Troubleshooting

**Caddy not getting TLS certificate**
- Ensure DNS A record points to your server IP
- Wait a few minutes, then: `docker-compose restart caddy`
- Check logs: `docker-compose logs caddy`

**API won't start**
- Check logs: `docker-compose logs api`
- Verify `.env` exists and has valid `BETTER_AUTH_SECRET`
- Check database volume: `docker-compose exec api ls -la /app/data`

**CORS errors in browser**
- Ensure `FRONTEND_URL` in `.env` matches your exact domain (including `https://`)
- Restart API after changing env: `docker-compose restart api`

**Permission denied on volumes**
- Fix: `docker-compose down && docker-compose up -d --build`

**Container keeps restarting**
- Check logs: `docker-compose logs api --tail=50`
- Common cause: missing `.env` or invalid `BETTER_AUTH_SECRET`
