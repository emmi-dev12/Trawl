import { useState, useEffect } from 'react'
import { Copy, FileJson, FileText, Check } from 'lucide-react'
import { ScraperForm } from './components/ScraperForm'
import { ResultsTable } from './components/ResultsTable'
import { BrandingPanel } from './components/BrandingPanel'
import { StatusBar } from './components/StatusBar'
import { UpdateNotification } from './components/UpdateNotification'
import { MenuBar } from './components/MenuBar'
import './App.css'

interface ScrapedPage {
  url: string
  title: string
  text: string
  links: string[]
  structured: Record<string, unknown>
}

export function App() {
  const [results, setResults] = useState<ScrapedPage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setInterval(async () => {
      if (isLoading) {
        try {
          const response = await fetch('http://127.0.0.1:5555/status')
          const data = await response.json()
          setProgress(data)
        } catch (error) {
          console.error('Status fetch error:', error)
        }
      }
    }, 500)

    return () => clearInterval(timer)
  }, [isLoading])

  const handleScrape = async (config: {
    url: string
    mode: 'single' | 'crawl'
    depth: number
    max_pages: number
    scroll: boolean
    extract: string[]
  }) => {
    setIsLoading(true)
    setResults([])
    setProgress({ current: 0, total: config.max_pages, message: 'Starting...' })

    try {
      const response = await fetch('http://127.0.0.1:5555/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()
      setResults(data.pages)
      setProgress({
        current: data.count,
        total: data.count,
        message: `Completed in ${data.duration_seconds}s`
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

        {/* Scraper Form */}
        <ScraperForm onScrape={handleScrape} isLoading={isLoading} />

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

          {results.length > 0 && results[0]?.branding && Object.keys(results[0].branding).length > 0 && (
            <BrandingPanel branding={results[0].branding as any} url={results[0].url} />
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
