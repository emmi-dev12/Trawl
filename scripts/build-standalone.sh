#!/bin/bash

# Build Trawl as a fully self-contained macOS app
# This script bundles Python, dependencies, and the app together

set -e

echo "🔨 Building Trawl standalone app..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Installing dependencies${NC}"
pip install -r backend/requirements.txt
npm install

echo -e "${BLUE}Step 2: Creating PyInstaller spec${NC}"
# Use PyInstaller to create a standalone backend
pip install pyinstaller

echo -e "${BLUE}Step 3: Building standalone Python backend${NC}"
cd backend
pyinstaller \
  --onefile \
  --windowed \
  --icon=../assets/icon.png \
  --hidden-import=playwright \
  --hidden-import=fastapi \
  --hidden-import=uvicorn \
  server.py

cd ..

echo -e "${BLUE}Step 4: Building Electron app${NC}"
npm run dist

echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo "The DMG is ready in the dist/ folder."
echo "The standalone backend is in backend/dist/server"
