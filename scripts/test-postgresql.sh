#!/bin/bash

# PostgreSQL Test Runner Script
# This script sets up environment variables for PostgreSQL testing

echo "Setting up PostgreSQL test environment..."

# Default PostgreSQL configuration
export DB_CONNECTOR="postgresql"
export DB_HOST=${DB_HOST:-"localhost"}
export DB_PORT=${DB_PORT:-"5432"}
export DB_USER=${DB_USER:-"postgres"}
export DB_PASSWORD=${DB_PASSWORD:-"123"}
export DB_NAME=${DB_NAME:-"test_db"}

echo "Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL connection..."
for i in {1..10}; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; then
        echo "PostgreSQL connection successful!"
        break
    fi
    echo "PostgreSQL not ready, retrying in 3 seconds... (attempt $i/10)"
    sleep 3
done

# Final check if PostgreSQL is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; then
    echo "Error: Cannot connect to PostgreSQL after multiple retries. Please ensure PostgreSQL is running and accessible."
    echo "You can start PostgreSQL with: docker run --name postgres-test -e POSTGRES_PASSWORD=123 -e POSTGRES_DB=test_db -p 5432:5432 -d postgres:13"
    exit 1
fi

# Create test database if it doesn't exist
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1

echo "Running tests against PostgreSQL..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    vitest run
else
    vitest run "$@"
fi