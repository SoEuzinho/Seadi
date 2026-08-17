#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Waiting for database..."
node wait-for-db.js

echo "Applying database migrations (migrate deploy)..."
npx prisma migrate deploy || { echo "Falha ao aplicar migrações. Revise as migrations."; exit 1; }

echo "Seeding database..."
npx prisma db seed || echo "Seed skipped (data may already exist)"

echo "Starting application..."
node dist/main
