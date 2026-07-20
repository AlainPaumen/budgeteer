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

# Build frontend (VITE_ vars must be set at build time)
ARG VITE_API_URL=http://localhost/api/auth
ENV VITE_API_URL=$VITE_API_URL
RUN cd apps/web && bun run build

# Stage 2: Runtime
FROM oven/bun:slim
WORKDIR /app

# Copy everything from builder (source + node_modules)
COPY --from=builder /app ./

# Copy built frontend directly into public directory (API runs from apps/api/)
COPY --from=builder /app/apps/web/dist/ /app/apps/api/public/

# Create data directory for SQLite
RUN mkdir -p /app/apps/api/data

EXPOSE 3000

CMD ["bun", "run", "start"]
