#!/bin/bash

# Nuxt 3 Local Test Runner
# This script temporarily installs Nuxt 3, runs the specified test,
# and then restores the original Nuxt 4 dependencies.

set -e

# --- Configuration ---
NUXT3_VERSION="^3.17.6"
TEST_TYPE=$1

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Helper functions ---
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# --- Cleanup function ---
cleanup() {
    print_status "🧹 Restoring original dependencies..."
    if [ -f "package.json.bak" ]; then
        mv package.json.bak package.json
    fi
    if [ -f "yarn.lock.bak" ]; then
        mv yarn.lock.bak yarn.lock
    fi
    yarn install
    print_success "Dependencies restored to Nuxt 4."
}

# --- Main script ---

# 1. Validate input
if [ -z "$TEST_TYPE" ]; then
    print_error "Usage: ./scripts/test-nuxt3.sh [sqlite|mysql|postgresql|unit|integration]"
    exit 1
fi

# 2. Set up cleanup trap
trap cleanup EXIT

# 3. Ensure lockfile matches package.json (nuxt 4.3.x), then backup
print_status "📦 Syncing lockfile and backing up package files..."
yarn install
cp package.json package.json.bak
cp yarn.lock yarn.lock.bak

# 4. Drop resolutions so Nuxt 3 gets Kit 3.x (otherwise resolution forces Kit 4 and breaks Nuxt 3)
node -e "const p=require('./package.json'); delete p.resolutions; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

# 5. Install Nuxt 3
print_status "🚀 Installing Nuxt v3 (version: ${NUXT3_VERSION})..."
npx nypm@latest i nuxt@${NUXT3_VERSION}
print_success "Nuxt 3 installed."

# 6. Run the specified test
print_status "🧪 Running tests for '$TEST_TYPE' against Nuxt 3..."
if [ -f "scripts/test-${TEST_TYPE}.sh" ]; then
    "./scripts/test-${TEST_TYPE}.sh"
else
    print_error "Invalid test type '$TEST_TYPE'. No script found at scripts/test-${TEST_TYPE}.sh"
    exit 1
fi

print_success "Nuxt 3 tests completed successfully!"

# 7. Cleanup will be handled by the trap
exit 0
