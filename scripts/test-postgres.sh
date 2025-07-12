#!/bin/bash

# PostgreSQL Test Runner Script
# This script sets up environment variables for PostgreSQL testing

echo "Setting up PostgreSQL test environment..."

# Default PostgreSQL configuration
export DB_CONNECTOR="postgres"
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

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
    echo "Error: Cannot connect to PostgreSQL. Please ensure PostgreSQL is running and accessible."
    echo "You can start PostgreSQL with: docker run --name postgres-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test_db -p 5432:5432 -d postgres:13"
    exit 1
fi

echo "PostgreSQL connection successful!"

# Create test database if it doesn't exist
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1

echo "Running tests against PostgreSQL..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    vitest run
else
    vitest run "$@"
fi
