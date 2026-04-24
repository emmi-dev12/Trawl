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

### Prerequisites

- macOS 10.13+
- Python 3.8+
- Node.js 16+
- pip, npm

### Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   playwright install chromium
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

## Running

### Development (with frontend reload)

```bash
npm run dev
```

This starts both the backend and Electron app.

### Production

```bash
npm start
```

### Run backend only (for testing)

```bash
cd backend
python server.py
```

The API will be available at `http://127.0.0.1:5555`.

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
