# Trawl – Fast Web Scraper for macOS

A clean, minimal, developer-grade web scraper with a native Electron UI. Handles JavaScript-heavy websites, infinite scroll, and dynamic content extraction. Fully offline, no cloud dependencies.

## Features

- **Fast & Reliable**: Uses Playwright + Chromium for real-world JavaScript rendering
- **Multiple Extraction Modes**: Links, text content, structured data (tables)
- **Smart Scrolling**: Detects and handles infinite/virtual scroll
- **Breadth-First Crawling**: Follow links up to configurable depth
- **Robust**: Automatic retries, cookie handling, timeouts
- **Export**: CSV, JSON, or clipboard
- **Native macOS App**: Dark theme, clean UI, instant startup

## Architecture

- **Backend**: Python + FastAPI + Playwright (localhost:5555)
- **Frontend**: Electron + JavaScript
- **IPC**: HTTP API (no network exposure)

## Installation

### Option 1: Download Pre-Built App (Recommended)

Download the latest DMG from [Releases](https://github.com/emmi-dev12/trawl/releases):

1. Download `Trawl-DD.MM.YYYY-HHMM.dmg`
2. Double-click to mount the DMG
3. Drag **Trawl** to the **Applications** folder
4. Launch from Applications

The app will automatically check for updates on startup.

### Option 2: Build from Source

#### Prerequisites

- macOS 10.13+
- Python 3.8+
- Node.js 16+
- Homebrew (optional but recommended)

#### Quick Setup

```bash
# Clone and navigate
git clone https://github.com/emmi-dev12/trawl.git
cd trawl

# One-command install
make install

# Run
make run
```

Or manually:

```bash
# Install Python dependencies
pip install -r backend/requirements.txt
playwright install chromium

# Install Node dependencies
npm install

# Run
npm start
```

#### Build DMG Distribution

```bash
make dist
```

The DMG will be created in `dist/` folder.

### Development

```bash
make dev
```

Or:

```bash
npm run dev
```

This starts both the backend and Electron app with hot-reload.

## Auto-Updates

Trawl includes built-in auto-update functionality:

- **Automatic checks**: The app checks for updates every hour in the background
- **Manual check**: Click the version button (e.g., "v1.0.0") in the top-right header to check for updates anytime
- **One-click install**: When an update is available, download and install with a single click
- **Seamless**: The app restarts automatically after installing an update
- **Release format**: `DD.MM.YYYY-HHMM` (e.g., `24.04.2026-1430`)

To install updates:
1. A notification will appear when a new version is available (or click the version button to check)
2. Click "Download"
3. Once downloaded, click "Install" to apply the update

## API Endpoints

### POST `/scrape`
Start a scrape job.

**Request**:
```json
{
  "url": "https://example.com",
  "mode": "single" | "crawl",
  "depth": 2,
  "max_pages": 50,
  "scroll": true,
  "extract": ["links", "text", "structured"]
}
```

**Response**:
```json
{
  "pages": [
    {
      "url": "...",
      "title": "...",
      "text": "...",
      "links": ["..."],
      "structured": {}
    }
  ],
  "count": 42,
  "duration_seconds": 12.3
}
```

### GET `/status`
Get current scrape progress.

**Response**:
```json
{
  "current": 5,
  "total": 50,
  "message": "Scraping: https://...",
  "pages": [...]
}
```

### POST `/stop`
Cancel an active scrape.

### GET `/health`
Check backend status.

## Usage

1. Enter a URL
2. Choose options:
   - **Mode**: Single page or crawl (follow links)
   - **Depth**: How many levels to follow links (crawl mode)
   - **Max Pages**: Stop after N pages
   - **Scroll**: Handle infinite scroll
   - **Extract**: What data to extract
3. Click **Scrape**
4. Wait for results
5. Export as CSV, JSON, or copy to clipboard

## Extraction Rules

### Text
- Full `<body>` text content
- Whitespace normalized

### Links
- All `<a href>` URLs
- Normalized to absolute URLs
- Skips social media, CDNs, downloads

### Structured
- Detects and extracts tables
- Future: Card layouts, lists

## Scraping Behavior

### Single Page Mode
Scrapes only the given URL.

### Crawl Mode
- Breadth-first traversal
- Follows links up to `depth` levels
- Stops at `max_pages`
- Same-domain only (by default)

### Robustness
- Retries failed pages (3x with exponential backoff)
- 20s timeout per page
- Auto-accepts cookie banners
- Handles JavaScript rendering
- Detects virtual scroll

## Building for macOS

```bash
npm run build
```

This creates a `.dmg` installer and `.zip` archive.

## Troubleshooting

### Backend won't start
- Check Python installation: `python3 --version`
- Verify dependencies: `pip install -r backend/requirements.txt`
- Check port 5555 is available: `lsof -i :5555`

### Playwright issues
- Reinstall Chromium: `playwright install chromium`
- Clear cache: `rm -rf ~/.cache/ms-playwright/`

### Slow scraping
- Disable scroll handling if not needed
- Reduce max_pages
- Use single mode instead of crawl

## Performance

- Typical page: 1-3 seconds
- With scrolling: 2-5 seconds
- Crawl 50 pages: 1-3 minutes

## License

MIT
Last built: Fri Apr 24 06:14:18 UTC 2026
