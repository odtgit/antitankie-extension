#!/bin/bash

# Build script for packaging the antitankie-extension
# Creates both Chrome and Firefox builds as zip files

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
CHROME_DIR="$DIST_DIR/chrome"
FIREFOX_DIR="$DIST_DIR/firefox"

echo "Building antitankie-extension..."
echo "Working directory: $SCRIPT_DIR"

# Clean up any existing dist directory
if [ -d "$DIST_DIR" ]; then
    echo "Removing existing dist directory..."
    rm -rf "$DIST_DIR"
fi

# Create dist directories
echo "Creating dist directories..."
mkdir -p "$CHROME_DIR"
mkdir -p "$FIREFOX_DIR"

# List of files to copy for both builds
COMMON_FILES=(
    "popup.html"
    "popup.css"
    "popup.js"
    "background.js"
    "config.js"
    "replacements.js"
    "LICENSE"
)

# Check for optional content.js
if [ -f "$SCRIPT_DIR/content.js" ]; then
    COMMON_FILES+=("content.js")
fi

# Copy files for Chrome build
echo "Creating Chrome build..."
for file in "${COMMON_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$CHROME_DIR/$file"
    else
        echo -e "${RED}Warning: $file not found${NC}"
    fi
done

# Copy manifest.json for Chrome
if [ -f "$SCRIPT_DIR/manifest.json" ]; then
    cp "$SCRIPT_DIR/manifest.json" "$CHROME_DIR/manifest.json"
else
    echo -e "${RED}Error: manifest.json not found${NC}"
    exit 1
fi

# Copy icons folder for Chrome
if [ -d "$SCRIPT_DIR/icons" ]; then
    cp -r "$SCRIPT_DIR/icons" "$CHROME_DIR/icons"
else
    echo -e "${RED}Warning: icons folder not found${NC}"
fi

# Copy files for Firefox build
echo "Creating Firefox build..."
for file in "${COMMON_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$FIREFOX_DIR/$file"
    fi
done

# Copy manifest.firefox.json as manifest.json for Firefox
if [ -f "$SCRIPT_DIR/manifest.firefox.json" ]; then
    cp "$SCRIPT_DIR/manifest.firefox.json" "$FIREFOX_DIR/manifest.json"
else
    echo -e "${RED}Error: manifest.firefox.json not found${NC}"
    exit 1
fi

# Copy icons folder for Firefox
if [ -d "$SCRIPT_DIR/icons" ]; then
    cp -r "$SCRIPT_DIR/icons" "$FIREFOX_DIR/icons"
fi

# Create zip files
echo "Creating zip archives..."

# Chrome zip - zip contents from inside the chrome directory
if [ -d "$CHROME_DIR" ]; then
    cd "$CHROME_DIR"
    zip -r "$DIST_DIR/chrome.zip" . > /dev/null
    echo -e "${GREEN}✓${NC} Chrome build: $DIST_DIR/chrome.zip"
fi

# Firefox zip - zip contents from inside the firefox directory
if [ -d "$FIREFOX_DIR" ]; then
    cd "$FIREFOX_DIR"
    zip -r "$DIST_DIR/firefox.zip" . > /dev/null
    echo -e "${GREEN}✓${NC} Firefox build: $DIST_DIR/firefox.zip"
fi

cd "$SCRIPT_DIR"

# Clean up temporary directories
echo "Cleaning up temporary directories..."
rm -rf "$CHROME_DIR"
rm -rf "$FIREFOX_DIR"

# Print summary
echo ""
echo -e "${GREEN}Build complete!${NC}"
echo "Distribution files:"
echo "  - $DIST_DIR/chrome.zip"
echo "  - $DIST_DIR/firefox.zip"
