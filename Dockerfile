# Stage 1: Build web app
FROM oven/bun:1 AS web-builder
WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/api-types/package.json packages/api-types/
RUN bun install --frozen-lockfile

COPY apps/web/ apps/web/
COPY apps/api/ apps/api/
COPY packages/api-types/ packages/api-types/
RUN cd apps/web && bun run build

# Stage 2: Production
FROM oven/bun:1-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/api-types/package.json packages/api-types/
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY apps/api/ apps/api/
COPY --from=web-builder /app/apps/web/dist apps/api/public
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh && mkdir -p apps/api/data

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
