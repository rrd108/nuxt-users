#!/bin/bash

# Configuration
SERVER_HOST="sravanam"
REMOTE_DOCS_PATH="/var/www/nuxt-users.webmania.cc"
LOCAL_BUILD_PATH="docs/.vitepress/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting documentation deployment...${NC}"

# Check if build directory exists
if [ ! -d "$LOCAL_BUILD_PATH" ]; then
    echo -e "${RED}❌ Build directory not found: $LOCAL_BUILD_PATH${NC}"
    echo -e "${YELLOW}💡 Make sure to run 'npm run docs:build' first${NC}"
    exit 1
fi

# Create a temporary tar file for transfer
TEMP_TAR="docs-build-$(date +%Y%m%d-%H%M%S).tar.gz"
echo -e "${YELLOW}📦 Creating archive: $TEMP_TAR${NC}"
tar -czf "$TEMP_TAR" -C "$LOCAL_BUILD_PATH" .

# Upload and deploy
echo -e "${YELLOW}📤 Uploading to $SERVER_HOST...${NC}"
ssh "$SERVER_HOST" << EOF
    # Create backup of current docs
    if [ -d "$REMOTE_DOCS_PATH" ]; then
        echo "📋 Creating backup of current documentation..."
        cp -r "$REMOTE_DOCS_PATH" "${REMOTE_DOCS_PATH}-backup-\$(date +%Y%m%d-%H%M%S)"
    fi
    
    # Create docs directory if it doesn't exist
    mkdir -p "$REMOTE_DOCS_PATH"
    
    # Clean the docs directory
    rm -rf "$REMOTE_DOCS_PATH"/*
    
    echo "✅ Ready for new files"
EOF

# Copy the tar file to server
scp "$TEMP_TAR" "$SERVER_HOST:/tmp/"

# Extract and deploy on server
ssh "$SERVER_HOST" << EOF
    echo "📦 Extracting documentation..."
    tar -xzf "/tmp/$TEMP_TAR" -C "$REMOTE_DOCS_PATH"
    
    # Set proper permissions
    chmod -R 755 "$REMOTE_DOCS_PATH"
    
    # Clean up temporary files
    rm "/tmp/$TEMP_TAR"
    
    echo "✅ Documentation deployed successfully!"
    echo "📁 Location: $REMOTE_DOCS_PATH"
EOF

# Clean up local temporary file
rm "$TEMP_TAR"

echo -e "${GREEN}✅ Documentation deployment completed!${NC}"
echo -e "${YELLOW}🌐 Your docs should now be available on your server${NC}" 