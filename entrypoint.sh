#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
bun src/migrate.ts

echo "Starting API server..."
exec bun src/index.ts
