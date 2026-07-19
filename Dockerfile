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

# Copy workspace root files (no lockfile — runtime has fewer packages)
COPY package.json tsconfig.json ./

# Copy workspace package manifests
COPY apps/api/package.json apps/api/package.json
COPY packages/api-types/package.json packages/api-types/package.json

# Install production dependencies only (skip prepare scripts like husky)
RUN bun install --production --ignore-scripts

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
