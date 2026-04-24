# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

**Trawl** is a native macOS web scraper combining a React frontend, Python backend, and Tauri runtime.

### Stack
- **Frontend**: React 18 + TypeScript + Vite, runs in Tauri webview
- **Backend**: Python 3.11+ with FastAPI, runs as separate process spawned by Rust main
- **Native**: Tauri 1.5 (Rust-based) provides system tray, window management, IPC
- **Build**: npm for frontend (Vite), cargo for Rust, Python subprocess for backend

### Directory Structure
```
src/                    # React frontend (TypeScript)
  components/           # Reusable UI components
  styles/               # CSS for components
  App.tsx              # Main React component
src-tauri/             # Tauri Rust code
  src/main.rs          # Tauri app entry, spawns Python backend
  Cargo.toml           # Rust dependencies (Tauri 1.5)
backend/               # Python scraper backend
  server.py            # FastAPI HTTP server on :5555
  scraper.py           # Playwright-based web scraper
  requirements.txt     # Python dependencies
dist/                  # Built frontend (Vite output)
```

### Data Flow
1. User interacts with React UI (runs in Tauri webview)
2. Frontend sends HTTP POST to `http://127.0.0.1:5555/scrape` (backend API)
3. Python backend starts browser, scrapes pages, returns results
4. Frontend displays results, allows CSV/JSON export

## Key Configuration Files

### `tauri.conf.json` (at root)
- **windows**: Define app window (1400x900)
- **bundle.targets**: macOS bundles (`["app", "dmg"]`)
- **allowlist.http**: Scopes HTTP requests to `127.0.0.1:5555` (backend only)
- **distDir**: Points to Vite output (`dist/`)

### `src-tauri/Cargo.toml`
- Features: `["shell-open", "http-all", "updater"]` (must match tauri.conf.json)
- Key deps: tauri, tokio, serde_json
- Features mismatch causes build failure—ensure both files align

### `package.json` Scripts
- `npm run dev`: Start Vite dev server (for frontend-only iteration)
- `npm run build`: TypeScript + Vite build → `dist/`
- `npm run tauri-dev`: Start Tauri app in dev mode
- `npm run tauri-build`: Build native macOS .dmg + .app

## Common Commands

### Development
```bash
# Terminal 1: Start Python backend
cd backend && python server.py

# Terminal 2: Run Tauri app in dev mode
npm run tauri-dev

# Frontend-only iteration (without Tauri):
npm run dev  # Starts Vite on :5173
```

### Building
```bash
# Build frontend first
npm run build

# Build native Tauri app (produces .dmg, .app)
npm run tauri-build
```

### Testing Backend
```bash
curl -X POST http://127.0.0.1:5555/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","mode":"single","scroll":false}'
curl http://127.0.0.1:5555/health
```

## Branding & UI

The design system is defined in `BRANDING.md`:
- **Primary color**: Aqua Blue (`#4CC9F0`)
- **Dark theme**: Deep Navy background (`#0B1220`)
- **Fonts**: System fonts (SF Pro macOS, Segoe UI Windows fallback)
- **Components**: Use CSS variables (`--color-primary`, `--color-bg`, etc.) defined in root styles
- **Logo**: SVG-based T+Net hybrid symbol (scalable 16px–512px)

All color/spacing uses CSS variables for consistency. Do not hardcode color hex values.

## Important Implementation Notes

### Frontend–Backend Communication
- Frontend sends JSON to `http://127.0.0.1:5555` (backend API)
- Backend runs as Python subprocess (spawned in Rust main.rs)
- Status polling every 500ms during scraping (frontend polls `/status` endpoint)

### Tauri Feature Parity
The `updater` feature in `src-tauri/Cargo.toml` must have a corresponding entry in `tauri.conf.json`:
```json
"updater": { "active": false }
```
Mismatch causes build failure with: "tauri dependency features do not match allowlist".

### macOS-Only Currently
- Project targets macOS (see `entitlements.mac.plist`)
- Linux build requires GTK+WebKit dev libraries
- Windows support not yet implemented

### Hot Reload in Development
- `npm run tauri-dev`: Frontend auto-reloads on code changes (Vite handles this)
- Backend changes require manual restart of Python process

## Troubleshooting

### Build Fails: "Package X was not found" (Linux)
GTK/WebKit libraries are system-level. Install:
```bash
apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libsoup2.4-dev libappindicator3-dev librsvg2-dev
```

### Port 5555 in Use
```bash
lsof -i :5555
kill -9 <PID>
```

### Tauri Feature Mismatch
Sync `Cargo.toml` features with `tauri.conf.json` allowlist. Both files must reference the same set of features.

### Playwright Missing
```bash
pip install -r backend/requirements.txt
playwright install chromium
```

## Development Workflow

1. **Frontend changes**: Edit `src/`, `npm run tauri-dev` auto-reloads
2. **Backend changes**: Stop/restart Python server in `cd backend && python server.py`
3. **Tauri/Rust changes**: Stop/restart `npm run tauri-dev`
4. **Release**: `npm run tauri-build` → DMG in dist/

## Git Workflow

Push changes to the designated feature branch (specified in session setup). PRs follow standard GitHub flow with required reviews before merge to main.
