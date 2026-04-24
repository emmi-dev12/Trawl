import { ExternalLink, Loader } from 'lucide-react'
import '../styles/table.css'

interface ScrapedPage {
  url: string
  title: string
  text: string
  links: string[]
  structured: Record<string, unknown>
}

interface ResultsTableProps {
  results: ScrapedPage[]
  isLoading: boolean
}

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="results-empty">
        {isLoading ? (
          <>
            <Loader className="spinner" size={32} />
            <p>Scraping in progress...</p>
          </>
        ) : (
          <>
            <p>No results yet</p>
            <span className="empty-hint">Enter a URL and click Scrape to get started</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="results-table-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            <th className="col-url">URL</th>
            <th className="col-title">Title</th>
            <th className="col-links">Links</th>
            <th className="col-text">Preview</th>
          </tr>
        </thead>
        <tbody>
          {results.map((page, idx) => (
            <tr key={idx} className="result-row">
              <td className="col-url">
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="url-link"
                  title={page.url}
                >
                  {new URL(page.url).hostname}
                  <ExternalLink size={12} className="external-icon" />
                </a>
              </td>
              <td className="col-title">
                <span className="title-text" title={page.title}>
                  {page.title || '—'}
                </span>
              </td>
              <td className="col-links">
                <span className="links-count">{page.links?.length || 0}</span>
              </td>
              <td className="col-text">
                <span className="text-preview" title={page.text}>
                  {(page.text || '').substring(0, 80)}
                  {(page.text || '').length > 80 ? '...' : ''}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
