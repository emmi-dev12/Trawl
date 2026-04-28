import { useState, useEffect } from 'react'
import { Copy, FileJson, FileText, Check } from 'lucide-react'
import { ScraperForm } from './components/ScraperForm'
import { ResultsTable } from './components/ResultsTable'
import { BrandingPanel } from './components/BrandingPanel'
import { StatusBar } from './components/StatusBar'
import { UpdateNotification } from './components/UpdateNotification'
import { MenuBar } from './components/MenuBar'
import type { ScrapeConfig } from './components/ScraperForm'
import './App.css'

interface ScrapedPage {
  url: string
  title: string
  text: string
  links: string[]
  structured: Record<string, unknown>
  branding?: Record<string, unknown>
}

interface BrandingData {
  colors: string[]
  fonts: string[]
  logos: string[]
  favicon: string | null
  images: string[]
  meta: {
    description: string | null
    site_name: string | null
    theme_color: string | null
    og_image: string | null
  }
}

interface ProgressState {
  current: number
  total: number
  message: string
}

interface ScrapeResponse {
  pages: ScrapedPage[]
  count: number
  duration_seconds: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseProgressState(data: unknown): ProgressState | null {
  if (!isRecord(data)) return null

  const { current, total, message } = data
  if (typeof current !== 'number' || typeof total !== 'number' || typeof message !== 'string') {
    return null
  }

  return { current, total, message }
}

function parseScrapeResponse(data: unknown): ScrapeResponse | null {
  if (!isRecord(data)) return null

  const { pages, count, duration_seconds } = data
  if (!Array.isArray(pages) || typeof count !== 'number' || typeof duration_seconds !== 'number') {
    return null
  }

  return {
    pages: pages as ScrapedPage[],
    count,
    duration_seconds
  }
}

function parseBrandingData(data: unknown): BrandingData | null {
  if (!isRecord(data)) return null

  const { colors, fonts, logos, favicon, images, meta } = data
  if (
    !Array.isArray(colors) ||
    !Array.isArray(fonts) ||
    !Array.isArray(logos) ||
    !Array.isArray(images) ||
    (favicon !== null && typeof favicon !== 'string') ||
    !isRecord(meta)
  ) {
    return null
  }

  return {
    colors: colors.filter((value): value is string => typeof value === 'string'),
    fonts: fonts.filter((value): value is string => typeof value === 'string'),
    logos: logos.filter((value): value is string => typeof value === 'string'),
    favicon,
    images: images.filter((value): value is string => typeof value === 'string'),
    meta: {
      description: typeof meta.description === 'string' || meta.description === null ? meta.description : null,
      site_name: typeof meta.site_name === 'string' || meta.site_name === null ? meta.site_name : null,
      theme_color: typeof meta.theme_color === 'string' || meta.theme_color === null ? meta.theme_color : null,
      og_image: typeof meta.og_image === 'string' || meta.og_image === null ? meta.og_image : null
    }
  }
}

export function App() {
  const [results, setResults] = useState<ScrapedPage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [copied, setCopied] = useState(false)
  const [backendReady, setBackendReady] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)
  const branding = parseBrandingData(results[0]?.branding)

  // Poll backend health until ready
  useEffect(() => {
    let attempts = 0
    const check = setInterval(async () => {
      try {
        const r = await fetch('http://127.0.0.1:5555/health')
        if (r.ok) {
          setBackendReady(true)
          setBackendError(null)
          clearInterval(check)
        }
      } catch {
        attempts++
        if (attempts > 60) {
          setBackendError(
            'Backend failed to start. Install backend dependencies with `pip install -r backend/requirements.txt` and `playwright install chromium`, or point `TRAWL_PYTHON` at a prepared Python environment.'
          )
          clearInterval(check)
        }
      }
    }, 500)
    return () => clearInterval(check)
  }, [])

  useEffect(() => {
    const timer = setInterval(async () => {
      if (isLoading) {
        try {
          const response = await fetch('http://127.0.0.1:5555/status')
          const data: unknown = await response.json()
          const nextProgress = parseProgressState(data)
          if (nextProgress) {
            setProgress(nextProgress)
          }
        } catch (error) {
          console.error('Status fetch error:', error)
        }
      }
    }, 500)

    return () => clearInterval(timer)
  }, [isLoading])

  const handleScrape = async (config: ScrapeConfig) => {
    setIsLoading(true)
    setResults([])
    setProgress({ current: 0, total: config.max_pages, message: 'Starting...' })

    try {
      const response = await fetch('http://127.0.0.1:5555/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data: unknown = await response.json()
      const parsed = parseScrapeResponse(data)
      if (!parsed) {
        throw new Error('Invalid scrape response from backend')
      }

      setResults(parsed.pages)
      setProgress({
        current: parsed.count,
        total: parsed.count,
        message: `Completed in ${parsed.duration_seconds}s`
      })
    } catch (error) {
      setProgress({
        current: 0,
        total: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportCSV = () => {
    if (results.length === 0) return

    const headers = ['URL', 'Title', 'Links', 'Text Preview']
    const rows = results.map(page => [
      page.url,
      page.title || '',
      page.links?.length || 0,
      (page.text || '').substring(0, 100)
    ])

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row =>
        row.map(cell => {
          if (typeof cell === 'string') {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join(',')
      )
    ].join('\n')

    download(csv, 'trawl_results.csv', 'text/csv')
  }

  const exportJSON = () => {
    if (results.length === 0) return
    download(JSON.stringify(results, null, 2), 'trawl_results.json', 'application/json')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(results, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <MenuBar version="1.0.0" />
      <UpdateNotification />

      <main className="app-main">
        {/* Header */}
        <div className="app-header">
          <div className="header-content">
            <div>
              <h1>Trawl</h1>
              <p className="subtitle">Fast web scraper for macOS</p>
            </div>
          </div>
        </div>

        {!backendReady && (
          <div className="backend-starting">
            <span className="backend-dot" />
            {backendError ?? 'Starting backend…'}
          </div>
        )}

        {/* Scraper Form */}
        <ScraperForm onScrape={handleScrape} isLoading={isLoading || !backendReady} />

        {/* Status Bar */}
        <StatusBar
          current={progress.current}
          total={progress.total}
          message={progress.message}
          isLoading={isLoading}
        />

        {/* Results */}
        <div className="results-container">
          <div className="results-header">
            <h2>Results</h2>
            {results.length > 0 && (
              <div className="result-count">{results.length} items</div>
            )}
          </div>

          <ResultsTable
            results={results}
            isLoading={isLoading}
          />

          {branding && Object.keys(branding).length > 0 && (
            <BrandingPanel branding={branding} />
          )}

          {/* Export Buttons */}
          {results.length > 0 && (
            <div className="export-controls">
              <button
                onClick={exportCSV}
                className="export-btn csv-btn"
                title="Export as CSV"
              >
                <FileText size={16} />
                <span>CSV</span>
              </button>
              <button
                onClick={exportJSON}
                className="export-btn json-btn"
                title="Export as JSON"
              >
                <FileJson size={16} />
                <span>JSON</span>
              </button>
              <button
                onClick={copyToClipboard}
                className={`export-btn copy-btn ${copied ? 'copied' : ''}`}
                title="Copy JSON to clipboard"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
