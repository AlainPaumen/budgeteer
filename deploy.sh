#!/bin/bash
set -euo pipefail

# Budgeteer Deploy Script
# Run this on your VPS after pushing to main

DEPLOY_DIR="/opt/budgeteer"
SERVICE_NAME="budgeteer"

echo "🚀 Deploying Budgeteer..."

# Navigate to deploy directory
cd "$DEPLOY_DIR"

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Build frontend
echo "🔨 Building frontend..."
cd apps/web && bun run build && cd ../..

# Run database migrations (if any)
echo "🗄️  Running database migrations..."
cd apps/api && bun run db:generate && cd ../..

# Restart API service
echo "🔄 Restarting API service..."
sudo systemctl restart "$SERVICE_NAME"

# Verify service is running
echo "✅ Verifying service..."
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Deployment successful! API is running."
else
    echo "❌ Service failed to start. Check logs: sudo journalctl -u $SERVICE_NAME -f"
    exit 1
fi

echo "🎉 Deployment complete!"
