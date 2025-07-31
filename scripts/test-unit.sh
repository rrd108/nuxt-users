#!/bin/bash

# Unit Test Runner Script
# This script runs tests that don't require database access

echo "Running unit tests (no database required)..."

# Run only database-independent tests
vitest run test/unit/ 