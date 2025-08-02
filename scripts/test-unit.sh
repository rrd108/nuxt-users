#!/bin/bash

# Unit Test Runner Script
# This script runs tests that don't require database access

echo "Running unit tests (no database required)..."

# Check if any arguments were passed
if [ $# -eq 0 ]; then
    # Run all unit tests
    vitest run test/unit/
else
    # Run only the specified test
    vitest run "$@"
fi 