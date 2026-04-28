#!/bin/bash

# Setup script for Trawl on macOS
# This ensures all dependencies are properly installed

set -e

echo "🚀 Setting up Trawl..."

# Check Python
PYTHON_BIN=""
if command -v python3.12 &> /dev/null; then
    PYTHON_BIN="python3.12"
elif command -v python3.11 &> /dev/null; then
    PYTHON_BIN="python3.11"
else
    echo "❌ Python 3.11 or 3.12 not found."
    echo "   Install from https://www.python.org/ or using Homebrew: brew install python@3.12"
    exit 1
fi

echo "✓ Python found: $($PYTHON_BIN --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16 or later."
    echo "   Install from https://nodejs.org/ or using Homebrew: brew install node"
    echo "   If you need the Tauri CLI globally: npm install -g @tauri-apps/cli"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Install dependencies
echo ""
echo "📦 Creating backend virtualenv..."
$PYTHON_BIN -m venv backend/.venv

echo "📦 Installing Python dependencies..."
backend/.venv/bin/pip install -r backend/requirements.txt

echo "📦 Installing Playwright browsers..."
backend/.venv/bin/playwright install chromium

echo "📦 Installing Node dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Backend python: backend/.venv/bin/python"
echo "Next steps:"
echo "  1. Run: make run"
echo "  2. Or use: npm run tauri-dev"
echo ""
