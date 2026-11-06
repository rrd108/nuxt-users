#!/bin/bash

# Integration test script for nuxt-users module
# Tests playground middleware functionality locally

set -e

echo "🚀 Starting nuxt-users integration tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to cleanup background processes
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status $YELLOW "🧹 Cleaning up server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
}

# Set up trap for cleanup on script exit
trap cleanup EXIT

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "playground" ]; then
    print_status $RED "❌ Please run this script from the nuxt-users root directory"
    exit 1
fi

print_status $BLUE "📦 Preparing development environment..."

# Prepare the module
npm run dev:prepare

print_status $BLUE "🏗️  Building playground..."

# Build the playground
cd playground
npm run build

print_status $BLUE "🖥️  Starting production server..."

# Start the server in background
node .output/server/index.mjs &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    print_status $RED "❌ Server failed to start"
    exit 1
fi

print_status $GREEN "✅ Server started successfully (PID: $SERVER_PID)"

# Wait a bit more for server to be fully ready
sleep 2

print_status $BLUE "🧪 Running integration tests..."

# Test 1: /me endpoint should require authentication (401 without token)
print_status $YELLOW "🔐 Testing /me endpoint requires authentication..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/nuxt-users/me" || echo "000")

if [ "$response" = "401" ]; then
    print_status $GREEN "✅ /me endpoint properly requires authentication (401 without token)"
else
    print_status $RED "❌ /me endpoint should require authentication - expected 401, got $response"
    print_status $RED "   This means server middleware is not properly registered!"
    exit 1
fi

# Test 1b: A dot in the query string must not skip authentication
print_status $YELLOW "🔐 Testing user creation with a dot in the query string requires authentication..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/nuxt-users?x=a.b" -X POST -H "Content-Type: application/json" -d '{"email":"bypass@example.com","name":"Bypass","password":"Bypass-123456","role":"admin"}' || echo "000")

if [ "$response" = "401" ]; then
    print_status $GREEN "✅ Query string with a dot does not bypass authentication (401)"
else
    print_status $RED "❌ POST /api/nuxt-users?x=a.b should return 401, got $response - authentication bypass!"
    exit 1
fi

# Test 2: Session endpoint should be accessible (not 401)
print_status $YELLOW "📝 Testing session endpoint /api/nuxt-users/session..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/nuxt-users/session" -X POST || echo "000")

if [ "$response" != "401" ]; then
    print_status $GREEN "✅ Session endpoint accessible (HTTP $response - auth not blocking)"
else
    print_status $RED "❌ Session endpoint blocked by auth - should be accessible for login"
    exit 1
fi

# Test 3: Registration endpoint should be auto-whitelisted
print_status $YELLOW "📋 Testing registration endpoint /api/nuxt-users/register..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/nuxt-users/register" -X POST || echo "000")

if [ "$response" != "401" ]; then
    print_status $GREEN "✅ Registration endpoint accessible (HTTP $response - auto-whitelisted)"
else
    print_status $RED "❌ Registration endpoint blocked - auto-whitelisting not working"
    exit 1
fi

# Test 4: Test a few more protected endpoints if they exist
print_status $YELLOW "🔍 Testing other protected endpoints..."

endpoints=(
    "/api/nuxt-users/profile"
    "/api/nuxt-users/users"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" || echo "000")
    
    if [ "$response" = "401" ]; then
        print_status $GREEN "✅ $endpoint properly protected (401)"
    elif [ "$response" = "404" ]; then
        print_status $YELLOW "⚠️  $endpoint not found (404) - endpoint may not exist"
    else
        print_status $YELLOW "⚠️  $endpoint returned $response - verify this is expected"
    fi
done

print_status $GREEN "🎉 All integration tests passed!"
print_status $BLUE "📊 Test Summary:"
print_status $BLUE "   • Server middleware registration: ✅ Working"
print_status $BLUE "   • Authentication enforcement: ✅ Working"
print_status $BLUE "   • Auto-whitelisting: ✅ Working"
print_status $BLUE "   • Endpoint accessibility: ✅ Working"

print_status $GREEN "✨ Your nuxt-users module is ready for production!"
