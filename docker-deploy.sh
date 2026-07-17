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

# Detect docker compose command (returns via DC array)
detect_dc() {
  local candidates=(
    "docker compose"
    "docker-compose"
    "sudo docker compose"
    "sudo docker-compose"
  )
  for cmd in "${candidates[@]}"; do
    # shellcheck disable=SC2086
    if $cmd ps &>/dev/null 2>&1; then
      DC=($cmd)
      return 0
    fi
  done
  return 1
}

detect_dc || {
  echo "ERROR: Cannot connect to Docker daemon"
  echo ""
  echo "Fix by adding yourself to the docker group:"
  echo "  sudo usermod -aG docker \$USER"
  echo "  newgrp docker"
  echo ""
  echo "Or run this script with sudo."
  exit 1
}

echo "==> Using: ${DC[*]}"

if [ -d .git ]; then
  echo "==> Pulling latest code..."
  git pull origin main
else
  echo "==> No git repo found, skipping pull"
fi

echo "==> Building containers..."
"${DC[@]}" build $NO_CACHE

echo "==> Starting services..."
"${DC[@]}" down 2>/dev/null || true
"${DC[@]}" up -d

echo "==> Verifying API health..."
sleep 3
if curl -sf http://localhost/api/health > /dev/null 2>&1; then
  echo "==> API is healthy"
else
  echo "==> WARNING: API health check failed. Check logs: ${DC[*]} logs api"
  exit 1
fi

echo "==> Deploy complete"
"${DC[@]}" ps

if [ "$TAIL_LOGS" = true ]; then
  echo "==> Tailing logs (Ctrl+C to stop)..."
  "${DC[@]}" logs -f
fi
