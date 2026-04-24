import { useState } from 'react'
import { Download, X } from 'lucide-react'
import '../styles/update.css'

export function UpdateNotification() {
  const [show, setShow] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // TODO: Implement actual update checking

  return (
    <>
      {show && (
        <div className="update-notification">
          <div className="update-content">
            <div className="update-message">
              {downloading ? (
                <>
                  <span>Downloading update...</span>
                  <div className="download-progress">
                    <div className="progress-fill" />
                  </div>
                </>
              ) : (
                <span>Update available</span>
              )}
            </div>
            <div className="update-actions">
              {!downloading && (
                <button
                  onClick={() => setDownloading(true)}
                  className="btn-download"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
              <button
                onClick={() => setShow(false)}
                className="btn-dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
