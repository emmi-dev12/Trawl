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
	@echo "  build           - Build the Electron app"
	@echo "  dist            - Create distributable DMG (macOS)"
	@echo "  dev             - Run backend and frontend concurrently"
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
	npm start

dev:
	@echo "Starting Trawl in development mode..."
	npm run dev

build:
	@echo "Building app bundle..."
	npm run build

dist:
	@echo "Creating distribution DMG..."
	npm run dist

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/
	rm -rf backend/__pycache__/
	rm -rf *.dmg
	rm -rf out/
	@echo "✓ Clean complete"

.DEFAULT_GOAL := help
