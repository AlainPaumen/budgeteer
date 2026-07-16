#!/bin/bash
set -euo pipefail

# Budgeteer Docker Deploy Script
# Usage: ./docker-deploy.sh [--no-cache] [--logs]

NO_CACHE=""
TAIL_LOGS=false

for arg in "$@"; do
  case $arg in
    --no-cache) NO_CACHE="--no-cache" ;;
    --logs) TAIL_LOGS=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

echo "==> Pulling latest code..."
git pull origin main

echo "==> Building containers..."
docker compose build $NO_CACHE

echo "==> Starting services..."
docker compose up -d

echo "==> Verifying API health..."
sleep 3
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "==> API is healthy"
else
  echo "==> WARNING: API health check failed. Check logs: docker compose logs api"
  exit 1
fi

echo "==> Deploy complete"
docker compose ps

if [ "$TAIL_LOGS" = true ]; then
  echo "==> Tailing logs (Ctrl+C to stop)..."
  docker compose logs -f
fi
