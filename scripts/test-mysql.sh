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

# Check if MySQL is running
echo "Checking MySQL connection..."
if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
    echo "Error: Cannot connect to MySQL. Please ensure MySQL is running and accessible."
    echo "You can start MySQL with: docker run --name mysql-test -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=test_db -p 3306:3306 -d mysql:5.7"
    exit 1
fi

echo "MySQL connection successful!"

# Create test database if it doesn't exist
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" >/dev/null 2>&1

echo "Running tests against MySQL..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    vitest run
else
    vitest run "$@"
fi