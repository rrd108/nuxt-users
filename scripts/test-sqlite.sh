#!/bin/bash

# SQLite Test Runner Script
# This script sets up environment variables for SQLite testing

echo "Setting up SQLite test environment..."

# Force SQLite configuration
export DB_CONNECTOR="sqlite"

echo "Database configuration:"
echo "  Type: SQLite"
echo "  Path: ./_test-db (default)"

echo "Running tests against SQLite..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    vitest run
else
    vitest run "$@"
fi 