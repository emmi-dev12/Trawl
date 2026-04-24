# Build & Release Guide

This document explains how to build Trawl and create releases.

## Quick Build

```bash
# Build the app
make dist

# Output appears in dist/
```

## Full Release Workflow

### Automatic (GitHub Actions)

Push to `main` branch:

```bash
git commit -m "Your changes"
git push origin main
```

GitHub Actions will:
1. ✅ Install dependencies
2. ✅ Build the Electron app
3. ✅ Create DMG installer
4. ✅ Generate version tag: `DD.MM.YYYY-HHMM`
5. ✅ Create GitHub Release
6. ✅ Upload artifacts (DMG + ZIP)

The app will use this release for auto-updates.

### Manual (Local Build)

```bash
# Install dependencies
make install

# Build
make dist

# The DMG and ZIP are in dist/
```

## Distribution Formats

### DMG (Recommended)
- **File**: `Trawl-DD.MM.YYYY-HHMM.dmg`
- **Size**: ~200-400 MB
- **Use case**: User-friendly macOS installer
- **Install**: Mount → Drag to Applications

### ZIP
- **File**: `Trawl-DD.MM.YYYY-HHMM.zip`
- **Size**: ~150-300 MB
- **Use case**: Command-line or archive
- **Install**: Extract → Copy to Applications

## Version Format

All releases use the timestamp format:

```
DD.MM.YYYY-HHMM
```

Examples:
- `24.04.2026-1430` = April 24, 2026, 2:30 PM
- `01.01.2027-0900` = January 1, 2027, 9:00 AM

This ensures:
- ✅ Chronological ordering
- ✅ Unique identifiers
- ✅ Human-readable dates
- ✅ Automatic comparison for updates

## Auto-Update System

### How Updates Work

1. **Check**: App checks GitHub releases hourly (or user clicks version button)
2. **Download**: If newer version found, user clicks "Download"
3. **Install**: Once downloaded, user clicks "Install"
4. **Restart**: App restarts with new version

### Example Flow

```
User opens app (v24.04.2026-1430)
  ↓
Auto-check for updates (every hour)
  ↓
Backend checks GitHub API for latest release
  ↓
Found newer: v25.04.2026-1200
  ↓
Show notification: "Update available: v25.04.2026-1200"
  ↓
User clicks "Download"
  ↓
Download DMG (~300 MB) with progress
  ↓
User clicks "Install"
  ↓
App quits and installs update
  ↓
App launches with v25.04.2026-1200
```

## Build System Components

### npm Scripts

```bash
npm run build          # Build without publishing
npm run build-release  # Build and prepare for release
npm run dist          # Create DMG and ZIP (electron-builder)
make dist             # Same as npm run dist
```

### GitHub Actions (`.github/workflows/build-release.yml`)

Triggers on:
- Push to `main` branch
- Manual trigger (`workflow_dispatch`)

Does:
1. Checkout code
2. Setup Node.js 18
3. Setup Python 3.11
4. Install all dependencies
5. Generate timestamp version
6. Build the app
7. Find artifacts (DMG, ZIP)
8. Create GitHub Release
9. Upload artifacts

### electron-builder Configuration

In `package.json`:

```json
{
  "build": {
    "appId": "com.trawl.app",
    "productName": "Trawl",
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.utilities"
    },
    "publish": {
      "provider": "github",
      "owner": "emmi-dev12",
      "repo": "trawl"
    }
  }
}
```

Enables automatic DMG/ZIP creation and GitHub integration.

### electron-updater Configuration

In `frontend/main.js`:

```javascript
const { autoUpdater } = require("electron-updater");

autoUpdater.checkForUpdates(); // Check for new releases
autoUpdater.downloadUpdate();  // Download when available
autoUpdater.quitAndInstall();  // Install and restart
```

Uses GitHub releases as update source automatically.

## File Locations

After build, artifacts appear in:

```
trawl/
├── dist/
│   ├── Trawl-DD.MM.YYYY-HHMM.dmg  ← User downloads this
│   ├── Trawl-DD.MM.YYYY-HHMM.zip  ← Alternative
│   ├── Trawl-DD.MM.YYYY-HHMM.dmg.blockmap
│   └── latest-mac.yml             ← Update manifest
└── out/
    └── Trawl-DD.MM.YYYY-HHMM.dmg
```

The `latest-mac.yml` file is used by electron-updater to check for updates.

## Troubleshooting Build

### Build Fails: "Python not found"

```bash
# Install Python 3.8+
brew install python3

# Or ensure it's on PATH
which python3
```

### Build Fails: "Playwright not found"

```bash
pip install -r backend/requirements.txt
playwright install chromium
```

### Build Fails: "Node modules missing"

```bash
rm -rf node_modules
npm install
```

### Build Fails: "Port 5555 in use"

```bash
# Kill any existing process
lsof -i :5555
kill -9 <PID>
```

### GitHub Actions Fails

Check workflow logs:
1. Push to repo
2. Go to Actions tab
3. Click latest workflow run
4. Check logs for errors

Common issues:
- Missing `GITHUB_TOKEN` (provided automatically)
- Python version mismatch
- Node.js cache outdated

## Performance

Build times on macOS:
- Fresh build: 3-5 minutes
- Incremental: 1-2 minutes
- DMG creation: 30-60 seconds

## Security

### Signing

Currently unsigned builds. To sign:

1. Get Apple Developer Certificate
2. Configure code signing in `electron-builder`
3. Update build config

### Notarization

For distribution outside App Store:

1. Apple Developer account
2. Configure notarization in build
3. Submit to Apple for approval

See [electron-builder docs](https://www.electron.build/code-signing) for details.

## Next Steps

After building:

1. **Test**: Download and install from release
2. **Verify**: Check version in app header
3. **Test updates**: Build new version and check auto-update
4. **Share**: Link users to GitHub releases

## Support

For issues:
- Check [Troubleshooting](../README.md#troubleshooting) in README
- Review build logs in GitHub Actions
- File issue on GitHub

