#!/bin/bash

# Setup script for Trawl on macOS
# This ensures all dependencies are properly installed

set -e

echo "🚀 Setting up Trawl..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8 or later."
    echo "   Install from https://www.python.org/ or using Homebrew: brew install python3"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16 or later."
    echo "   Install from https://nodejs.org/ or using Homebrew: brew install node"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "📦 Installing Playwright browsers..."
playwright install chromium

echo "📦 Installing Node dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: make run"
echo "  2. Or use: npm start"
echo ""
