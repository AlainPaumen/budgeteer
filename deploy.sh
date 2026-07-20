#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Docker image..."
docker build -t budgeteer:latest .

echo "Saving image to /tmp/budgeteer.tar..."
docker save budgeteer:latest -o /tmp/budgeteer.tar

echo "Copying to /mnt/hgfs/docker/budgeteer/budgeteer.tar..."
cp /tmp/budgeteer.tar /mnt/hgfs/docker/budgeteer/budgeteer.tar

echo "Done: /tmp/budgeteer.tar ($(du -h /tmp/budgeteer.tar | cut -f1))"

cat <<'EOF'

--- Target machine commands ---
Load the image:
  docker load -i budgeteer.tar

Run the container:
  docker compose down
  docker compose up -d 

EOF
