#!/bin/bash

# MySQL Test Runner Script
# This script sets up environment variables for MySQL testing

echo "Setting up MySQL test environment..."

# Default MySQL configuration
export DB_CONNECTOR="mysql"
export DB_HOST=${DB_HOST:-"localhost"}
export DB_PORT=${DB_PORT:-"3306"}
export DB_USER=${DB_USER:-"root"}
export DB_PASSWORD=${DB_PASSWORD:-"123"}
export DB_NAME=${DB_NAME:-"test_db"}

echo "Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"

# Set MySQL password environment variable for consistent authentication
export MYSQL_PWD="$DB_PASSWORD"

# Wait for MySQL to be ready
echo "Waiting for MySQL connection..."
for i in {1..10}; do
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
        echo "MySQL connection successful!"
        break
    fi
    echo "MySQL not ready, retrying in 3 seconds... (attempt $i/10)"
    sleep 3
done

# Final check if MySQL is running
if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
    echo "Error: Cannot connect to MySQL after multiple retries. Please ensure MySQL is running and accessible."
    echo "You can start MySQL with: docker run --name mysql-test -e MYSQL_ROOT_PASSWORD=123 -e MYSQL_DATABASE=test_db -p 3306:3306 -d mysql:5.7"
    exit 1
fi

# Create test database if it doesn't exist
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" >/dev/null 2>&1

echo "Running tests against MySQL..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    vitest run
else
    vitest run "$@"
fi
