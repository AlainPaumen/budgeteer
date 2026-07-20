# Docker Deployment Design

## Goal

Deploy Budgeteer as a single Docker container on Windows 11, accessible at `localhost:1234`, with SQLite database persisted on a bind-mounted volume.

## Architecture

Single multi-stage Docker container:

- **Stage 1 (Builder):** Installs dependencies, builds the Vite frontend
- **Stage 2 (Runtime):** Runs the Elysia API, which serves the built frontend as static files in production mode

The API's existing production mode (`apps/api/src/index.ts:75-95`) serves the frontend from `./public` via `staticPlugin` and a catch-all HTML fallback — no separate nginx or frontend container needed.

```
localhost:1234 (host)
        ↕ port mapping
┌─────────────────────────────────────┐
│  Container (port 3000)              │
│  Elysia API + static frontend       │
│  SQLite DB at /app/data/budgeteer.db│
└─────────────────────────────────────┘
        ↕ bind mount
./data-volume/budgeteer.db (host)
```

## Files to create

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build (builder + runtime) |
| `.dockerignore` | Exclude node_modules, .git, data/, etc. |
| `docker-compose.yml` | Port mapping, volume, env vars, restart policy |

## Files to modify

| File | Change |
|---|---|
| `.env.docker` | Update `VITE_API_URL` to use port 1234 for browser-facing auth URL |

## Dockerfile

### Stage 1: Builder

```dockerfile
FROM oven/bun:latest AS builder
WORKDIR /app
```

1. Copy workspace root files: `package.json`, `bun.lock`, `tsconfig.json`
2. Copy `apps/web/package.json`, `apps/api/package.json`, `packages/api-types/package.json`
3. Run `bun install`
4. Copy all source files
5. Build frontend: `cd apps/web && bun run build`

### Stage 2: Runtime

```dockerfile
FROM oven/bun:slim
WORKDIR /app
```

1. Copy built frontend from builder: `apps/web/dist/` → `./public`
2. Copy API source: `apps/api/` → `apps/api/`
3. Copy shared package: `packages/api-types/` → `packages/api-types/`
4. Copy workspace configs: `package.json`, `bun.lock`, `tsconfig.json`
5. Install production dependencies: `bun install --production`
6. Create data directory: `mkdir -p /app/data`
7. Expose port 3000
8. CMD: `bun run start`

### Key details

- The API runs migrations on startup (`runMigrations("./data/budgeteer.db")`), so no separate migration step needed
- `NODE_ENV=production` enables the static file serving path in the API
- The `./public` path in `staticPlugin` resolves to `/app/public` in the container, which is where the built frontend lives

## .dockerignore

```
node_modules
.git
data
*.db
*.db.backup.*
graphify-out
.opencode
.superpowers
.agents
docs
superpowers
```

## docker-compose.yml

```yaml
services:
  budgeteer:
    build: .
    ports:
      - "1234:3000"
    volumes:
      - ./data-volume:/app/data
    env_file:
      - .env.docker
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

**Note:** Uses a bind mount (`./data-volume:/app/data`) so the SQLite database is directly accessible from the host filesystem. The `data-volume/` directory is created next to the project root. On Windows with Docker Desktop WSL2 backend, this path is translated automatically.

## .env.docker changes

```env
# API
PORT=3000
FRONTEND_URL=http://localhost:1234
BETTER_AUTH_SECRET=8R31aFkADULS4pfkv5c8uP9IS1OSxr7okaKn9dCbqMk=
BETTER_AUTH_URL=http://localhost:1234
SKIP_MIGRATIONS=false

# Frontend (Vite)
VITE_API_URL=http://localhost:1234/api/auth
VITE_DATE_FORMAT=YYYY-MM-DD
```

Key change: `BETTER_AUTH_URL` and `FRONTEND_URL` set to port 1234 (the host-facing port) since these are used for auth callback URLs that the browser hits.

## Usage

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Backup database (from host)
cp ./data-volume/budgeteer.db ./data-volume/budgeteer.db.backup
```

## Windows prerequisites

- Docker Desktop with **WSL2 backend** (default on Windows 11)
- `data-volume/` directory is created automatically on first run
- Database file directly accessible at `./data-volume/budgeteer.db` from Windows Explorer
