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

# Copy everything from builder (source + node_modules)
COPY --from=builder /app ./

# Copy built frontend into public directory (API's staticPlugin reads from ./public)
RUN cp -r /app/apps/web/dist /app/public

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "run", "start"]
