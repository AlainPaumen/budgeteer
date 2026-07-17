#!/bin/bash
set -euo pipefail

# Budgeteer Docker Deploy Packager
# Creates a deploy_docker/ folder with everything needed to run on a target machine.
# Usage: ./docker-package.sh

DEPLOY_DIR="deploy_docker"

echo "==> Cleaning previous package..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo "==> Exporting Docker images..."
docker save budgeteer_api:latest -o "$DEPLOY_DIR/budgeteer_api.tar"
docker save budgeteer_web:latest -o "$DEPLOY_DIR/budgeteer_web.tar"
docker save caddy:2-alpine -o "$DEPLOY_DIR/caddy_alpine.tar"
echo "    Images exported ($(du -sh "$DEPLOY_DIR"/*.tar | awk '{print $1}' | paste -sd+ | bc))"

echo "==> Copying runtime files..."
cp Caddyfile.docker "$DEPLOY_DIR/"
cp entrypoint.sh "$DEPLOY_DIR/"

echo "==> Creating production docker-compose.yml (no build directives)..."
cat > "$DEPLOY_DIR/docker-compose.yml" << 'COMPOSE'
services:
  api:
    image: budgeteer_api:latest
    container_name: budgeteer-api
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - api-data:/app/apps/api/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  web:
    image: budgeteer_web:latest
    container_name: budgeteer-web
    restart: unless-stopped
    volumes:
      - api-public:/usr/share/caddy:ro

  caddy:
    image: caddy:2-alpine
    container_name: budgeteer-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile.docker:/etc/caddy/Caddyfile:ro
      - api-public:/srv:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - web
      - api

volumes:
  api-data:
  api-public:
  caddy-data:
  caddy-config:
COMPOSE

echo "==> Copying .env..."
if [ -f .env ]; then
  cp .env "$DEPLOY_DIR/"
else
  echo "    WARNING: .env not found — create one on the target machine"
fi

echo "==> Creating target machine setup scripts..."

# Linux/macOS setup
cat > "$DEPLOY_DIR/setup.sh" << 'SETUP'
#!/bin/bash
set -euo pipefail

echo "==> Loading Docker images..."
docker load -i budgeteer_api.tar
docker load -i budgeteer_web.tar
docker load -i caddy_alpine.tar

echo "==> Starting services..."
docker compose up -d

echo "==> Checking status..."
sleep 3
docker compose ps

echo ""
echo "==> Deploy complete"
echo "    API health: curl http://localhost/api/health"
SETUP
chmod +x "$DEPLOY_DIR/setup.sh"

# Windows setup
cat > "$DEPLOY_DIR/setup.bat" << 'SETUP'
@echo off
echo ==> Loading Docker images...
docker load -i budgeteer_api.tar
docker load -i budgeteer_web.tar
docker load -i caddy_alpine.tar

echo ==> Starting services...
docker compose up -d

echo ==> Checking status...
timeout /t 3 /nobreak >nul
docker compose ps

echo.
echo ==> Deploy complete
echo     API health: curl http://localhost/api/health
pause
SETUP

echo ""
echo "==> Package ready: $DEPLOY_DIR/"
echo ""
ls -lh "$DEPLOY_DIR/"
echo ""
echo "To deploy on target machine:"
echo "  Linux/macOS:  scp -r $DEPLOY_DIR user@server:~/budgeteer"
echo "                ssh user@server 'cd ~/budgeteer && ./setup.sh'"
echo ""
echo "  Windows:      Copy $DEPLOY_DIR\\ to the machine"
echo "                Open PowerShell in that folder and run: .\setup.bat"
