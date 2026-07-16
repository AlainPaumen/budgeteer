# Stage 1: Build web app
FROM oven/bun:1 AS web-builder
WORKDIR /app

COPY apps/web/package.json apps/web/bun.lock* ./
COPY packages/api-types/package.json packages/api-types/
RUN bun install --frozen-lockfile

COPY apps/web/ ./
COPY packages/api-types/ ../packages/api-types/
RUN bun run build

# Stage 2: Build API
FROM oven/bun:1 AS api-builder
WORKDIR /app

COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile

COPY apps/api/ ./
COPY --from=web-builder /app/dist ./public

# Stage 3: Production
FROM oven/bun:1-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY apps/api/src ./src
COPY --from=api-builder /app/public ./public

RUN mkdir -p data

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "src/index.ts"]
