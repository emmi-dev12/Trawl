import { useState } from 'react'
import { Play, Settings } from 'lucide-react'
import '../styles/form.css'

interface ScraperFormProps {
  onScrape: (config: any) => void
  isLoading: boolean
}

export function ScraperForm({ onScrape, isLoading }: ScraperFormProps) {
  const [url, setUrl] = useState('https://example.com')
  const [mode, setMode] = useState<'single' | 'crawl'>('single')
  const [depth, setDepth] = useState(2)
  const [maxPages, setMaxPages] = useState(50)
  const [scroll, setScroll] = useState(true)
  const [extractLinks, setExtractLinks] = useState(true)
  const [extractText, setExtractText] = useState(true)
  const [extractStructured, setExtractStructured] = useState(true)
  const [extractBranding, setExtractBranding] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const extract = []
    if (extractLinks) extract.push('links')
    if (extractText) extract.push('text')
    if (extractStructured) extract.push('structured')
    if (extractBranding) extract.push('branding')

    onScrape({
      url,
      mode,
      depth,
      max_pages: maxPages,
      scroll,
      extract
    })
  }

  return (
    <form onSubmit={handleSubmit} className="scraper-form">
      {/* URL Input */}
      <div className="form-section url-section">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="url-input"
          disabled={isLoading}
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="scrape-btn"
        >
          <Play size={16} />
          <span>{isLoading ? 'Scraping...' : 'Scrape'}</span>
        </button>
      </div>

      {/* Mode Selection */}
      <div className="form-section mode-section">
        <div className="mode-group">
          <label className="radio-label">
            <input
              type="radio"
              value="single"
              checked={mode === 'single'}
              onChange={(e) => setMode(e.target.value as 'single')}
              disabled={isLoading}
            />
            <span>Single Page</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value="crawl"
              checked={mode === 'crawl'}
              onChange={(e) => setMode(e.target.value as 'crawl')}
              disabled={isLoading}
            />
            <span>Crawl (follow links)</span>
          </label>
        </div>

        {mode === 'crawl' && (
          <div className="crawl-options">
            <div className="input-group">
              <label>Depth</label>
              <input
                type="number"
                min="1"
                max="10"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <label>Max Pages</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value))}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="form-section options-section">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="advanced-toggle"
          disabled={isLoading}
        >
          <Settings size={14} />
          <span>Advanced Options</span>
          <span className={`toggle-icon ${showAdvanced ? 'open' : ''}`}>›</span>
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scroll}
                onChange={(e) => setScroll(e.target.checked)}
                disabled={isLoading}
              />
              <span>Handle infinite scroll</span>
            </label>

            <div className="extract-options">
              <label>Extract:</label>
              <div className="extract-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={extractLinks}
                    onChange={(e) => setExtractLinks(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Links</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={extractText}
                    onChange={(e) => setExtractText(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Text</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={extractStructured}
                    onChange={(e) => setExtractStructured(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Structured</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={extractBranding}
                    onChange={(e) => setExtractBranding(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Branding</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
