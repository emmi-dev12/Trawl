import '../styles/status.css'

interface StatusBarProps {
  current: number
  total: number
  message: string
  isLoading: boolean
}

export function StatusBar({ current, total, message, isLoading }: StatusBarProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={`status-bar ${isLoading ? 'active' : ''}`}>
      <div className="status-content">
        <div className="status-text">
          {isLoading ? (
            <span className="progress-info">
              {current} / {total} pages
              {message && ` • ${message}`}
            </span>
          ) : message ? (
            <span className={message.includes('Error') ? 'error' : 'completed'}>
              {message}
            </span>
          ) : (
            <span className="idle">Ready</span>
          )}
        </div>
        {isLoading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-percent">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
