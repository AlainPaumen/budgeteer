# Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single Docker container that builds the frontend and runs the Elysia API in production mode, accessible at `localhost:1234` with SQLite persisted on a bind mount.

**Architecture:** Multi-stage Dockerfile — builder stage compiles the Vite frontend, runtime stage runs the Elysia API which serves the built static files. Docker Compose handles port mapping (1234→3000), bind mount (`./data-volume:/app/data`), and environment variables.

**Tech Stack:** Bun, Docker, Docker Compose, Elysia, Vite, SQLite (bun:sqlite)

## Global Constraints

- Use `oven/bun:latest` for builder, `oven/bun:slim` for runtime
- Container internal port: 3000 (mapped to host 1234)
- Database path in container: `/app/data/budgeteer.db`
- `NODE_ENV=production` must be set for static file serving
- All environment variables come from `.env.docker` via `env_file`
- Do not modify any existing application source code

---

### Task 1: Create `.dockerignore`

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create the .dockerignore file**

```gitignore
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
*.md
!README.md
.env
.env.example
.env.production
.husky
biome.json
skills-lock.json
opencode.json
```

- [ ] **Step 2: Verify the file exists**

Run: `cat .dockerignore`
Expected: file contents displayed, no errors

- [ ] **Step 3: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

### Task 2: Update `.env.docker` for port 1234

**Files:**
- Modify: `.env.docker`

- [ ] **Step 1: Read the current .env.docker**

Run: `cat .env.docker`
Expected: current contents with port 3000 references

- [ ] **Step 2: Update FRONTEND_URL, BETTER_AUTH_URL, and VITE_API_URL to port 1234**

Replace the entire file with:

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

- [ ] **Step 3: Verify changes**

Run: `cat .env.docker`
Expected: `FRONTEND_URL=http://localhost:1234`, `BETTER_AUTH_URL=http://localhost:1234`, `VITE_API_URL=http://localhost:1234/api/auth`

- [ ] **Step 4: Commit**

```bash
git add .env.docker
git commit -m "chore: update .env.docker for port 1234 mapping"
```

---

### Task 3: Create the Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the Dockerfile with multi-stage build**

```dockerfile
# Stage 1: Build frontend
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock tsconfig.json ./

# Copy workspace package manifests
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/api-types/package.json packages/api-types/package.json

# Install all dependencies
RUN bun install

# Copy all source files
COPY apps/ apps/
COPY packages/ packages/
COPY vite.config.ts ./

# Build frontend
RUN cd apps/web && bun run build

# Stage 2: Runtime
FROM oven/bun:slim
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock tsconfig.json ./

# Copy workspace package manifests
COPY apps/api/package.json apps/api/package.json
COPY packages/api-types/package.json packages/api-types/package.json

# Install production dependencies only
RUN bun install --production

# Copy API source (includes migrations)
COPY apps/api/ apps/api/

# Copy shared types package
COPY packages/api-types/ packages/api-types/

# Copy built frontend from builder stage into public directory
# (matches staticPlugin assets path in apps/api/src/index.ts)
COPY --from=builder /app/apps/web/dist/ ./public/

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "run", "start"]
```

- [ ] **Step 2: Verify the Dockerfile syntax**

Run: `docker build --check .` or `docker buildx build --check .`
Expected: no syntax errors (if `--check` is not supported, skip to step 3)

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile"
```

---

### Task 4: Create `docker-compose.yml`

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create the docker-compose.yml file**

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

- [ ] **Step 2: Verify the file exists**

Run: `cat docker-compose.yml`
Expected: file contents displayed

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose.yml with port 1234 and bind mount"
```

---

### Task 5: Build and test the Docker image locally

**Files:**
- No file changes — verification only

- [ ] **Step 1: Create the data-volume directory**

Run: `mkdir -p data-volume`

- [ ] **Step 2: Build the Docker image**

Run: `docker compose build`
Expected: build completes without errors, both stages succeed

- [ ] **Step 3: Start the container**

Run: `docker compose up -d`
Expected: container starts, `docker compose ps` shows "running"

- [ ] **Step 4: Check container logs for successful startup**

Run: `docker compose logs`
Expected: logs show "Elysia server running at http://localhost:3000" and "Migrations applied successfully"

- [ ] **Step 5: Test the health endpoint**

Run: `curl http://localhost:1234/api/health`
Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 6: Test that the frontend is served**

Run: `curl -s http://localhost:1234/ | head -5`
Expected: HTML content with `<div id="root">` or similar React mount point

- [ ] **Step 7: Verify the database was created on the host**

Run: `ls -la data-volume/`
Expected: `budgeteer.db` file exists in the directory

- [ ] **Step 8: Stop the container**

Run: `docker compose down`

- [ ] **Step 9: Commit the data-volume directory to .gitignore**

Add `data-volume/` to `.gitignore` if not already present:

```bash
echo "data-volume/" >> .gitignore
git add .gitignore
git commit -m "chore: add data-volume to .gitignore"
```
