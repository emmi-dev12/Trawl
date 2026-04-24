# Development Guide

## Local Development Setup

### Quick Start

```bash
# Install all dependencies
make install

# Run in development mode (backend + frontend with hot-reload)
make dev
```

### Individual Commands

```bash
# Just the backend
cd backend && python server.py

# Just the frontend (requires backend running)
npm start

# Full build (DMG + ZIP)
make dist
```

## Project Structure

```
trawl/
├── backend/
│   ├── scraper.py      # Core Playwright scraper
│   ├── server.py       # FastAPI HTTP server
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── main.js         # Electron main process
│   ├── preload.js      # IPC bridge
│   ├── renderer.js     # UI logic & updates
│   ├── index.html      # UI structure
│   └── styles.css      # Dark theme styles
├── scripts/
│   ├── build-standalone.sh  # PyInstaller build
│   └── setup-macos.sh       # Setup helper
├── .github/workflows/
│   └── build-release.yml    # GitHub Actions CI/CD
├── Makefile            # Build automation
├── package.json        # Node.js config
├── entitlements.mac.plist   # macOS signing config
└── README.md
```

## Development Workflow

### Making Changes

1. **Backend changes**: Modify `backend/scraper.py` or `backend/server.py`
   - No restart needed; backend reloads automatically
   - Test with: `curl http://127.0.0.1:5555/health`

2. **Frontend changes**: Modify files in `frontend/`
   - Electron auto-refreshes on save
   - Use DevTools (F12) for debugging
   - Check console for errors

### Testing

```bash
# Test backend API directly
curl -X POST http://127.0.0.1:5555/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "mode": "single",
    "scroll": false
  }'

# Check status
curl http://127.0.0.1:5555/status

# Check health
curl http://127.0.0.1:5555/health
```

## Building for Release

### GitHub Actions (Automatic)

Push to `main` branch to trigger automatic build:

```bash
git push origin main
```

This will:
1. Install all dependencies
2. Build the Electron app
3. Create a DMG and ZIP
4. Create a GitHub Release with `DD.MM.YYYY-HHMM` tag
5. Upload artifacts

### Local Build

```bash
# Build without signing (for testing)
npm run build

# Build with signing (requires signing key)
npm run build-release

# Or use Makefile
make dist
```

### Build Output

- `dist/Trawl-*.dmg` - macOS installer
- `dist/Trawl-*.zip` - macOS app archive
- `dist/Trawl-*.tar.gz` - Linux build (if applicable)

## Auto-Update System

### How It Works

1. App checks GitHub releases API every hour
2. Compares local version with latest release
3. If newer found, notifies user
4. User clicks "Download" to fetch update
5. User clicks "Install" to apply and restart

### Testing Updates

```bash
# Manually check for updates
window.api.checkForUpdates()

# Simulate update available (in DevTools console)
ipcRenderer.send('update-available', {version: '25.04.2026-1200'})
```

## Code Style

### Python
- Follow PEP 8
- Use type hints
- Max line length: 100

### JavaScript
- Use semicolons
- Const by default, let if needed
- Arrow functions for callbacks

### CSS
- BEM naming (block-element-modifier)
- Mobile-first responsive design
- CSS variables for colors

## Performance Tips

### Scraping
- Test with `max_pages: 5` first
- Use single mode for initial testing
- Monitor CPU in Activity Monitor

### App
- Check DevTools Performance tab
- Profile Electron process: `npm run dev` then Chrome DevTools

## Troubleshooting

### Port 5555 in Use

```bash
# Find process using port
lsof -i :5555

# Kill it
kill -9 <PID>
```

### Playwright Chromium Missing

```bash
playwright install chromium
```

### Module Not Found Errors

```bash
# Reinstall
pip install -r backend/requirements.txt
npm install
```

### App Won't Start

```bash
# Check main.js logs
cat ~/Library/Logs/Trawl/main.log

# Check backend
cd backend && python server.py  # Should show no errors
```

## Release Process

### Version Format

Releases use: `DD.MM.YYYY-HHMM`

Example: `24.04.2026-1430` (April 24, 2026, 2:30 PM)

### Manual Release

```bash
# Build locally
make dist

# Create release manually on GitHub
# Upload DMG and ZIP files
# Tag: DD.MM.YYYY-HHMM
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-updater](https://www.electron.build/auto-update)
- [Playwright](https://playwright.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `make dev`
5. Submit a pull request

## License

MIT
