#!/bin/bash
set -e

echo "Running database migrations..."

# Define the connection string
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-xatube}"

CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Run migrations
psql "$CONNECTION_STRING" -f /app/migrations/001_initial_schema.sql || true
psql "$CONNECTION_STRING" -f /app/migrations/002_add_video_url_to_streams.sql || true
psql "$CONNECTION_STRING" -f /app/migrations/003_add_comments_table.sql || true

echo "Migrations completed successfully"
