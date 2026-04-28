.PHONY: help install install-deps backend-deps frontend-deps build run clean dev dist

help:
	@echo "Trawl - Web Scraper for macOS"
	@echo ""
	@echo "Available targets:"
	@echo "  install         - Install all dependencies"
	@echo "  install-deps    - Install all dependencies (alias)"
	@echo "  backend-deps    - Install Python dependencies"
	@echo "  frontend-deps   - Install Node dependencies"
	@echo "  run             - Run the app in development mode"
	@echo "  build           - Build the frontend bundle"
	@echo "  dist            - Build the Tauri macOS app bundle"
	@echo "  run             - Launch the Tauri app in development mode"
	@echo "  dev             - Run the frontend dev server"
	@echo "  clean           - Clean build artifacts"
	@echo ""

install: frontend-deps backend-deps
	@echo "✓ All dependencies installed"

install-deps: install

backend-deps:
	@echo "Installing Python dependencies..."
	pip install -r backend/requirements.txt
	@echo "Installing Playwright browsers..."
	playwright install chromium
	@echo "✓ Python dependencies installed"

frontend-deps:
	@echo "Installing Node dependencies..."
	npm install
	@echo "✓ Node dependencies installed"

run:
	@echo "Starting Trawl app..."
	npm run tauri-dev

dev:
	@echo "Starting Trawl frontend dev server..."
	npm run dev

build:
	@echo "Building app bundle..."
	npm run build

dist:
	@echo "Building Tauri macOS app..."
	npm run tauri-build

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/
	rm -rf backend/__pycache__/
	rm -rf *.dmg
	rm -rf out/
	@echo "✓ Clean complete"

.DEFAULT_GOAL := help
