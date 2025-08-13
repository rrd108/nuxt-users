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

# Recreate the test database to ensure a clean state
echo "Recreating test database '$DB_NAME'"...
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

# Configure PostgreSQL for testing (increase connection limits)
echo "Configuring PostgreSQL for testing..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER SYSTEM SET max_connections = 500;"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER SYSTEM SET log_statement = 'none';"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER SYSTEM SET log_min_duration_statement = -1;"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER SYSTEM SET idle_in_transaction_session_timeout = '10s';"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_reload_conf();"

# Kill any idle connections to free up slots
echo "Cleaning up idle connections..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state IN ('idle', 'idle in transaction') AND pid <> pg_backend_pid();
"

echo "Running tests against PostgreSQL..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    # Run all tests except unit tests (database-independent)
    vitest run --exclude="test/unit/"
else
    vitest run "$@"
fi