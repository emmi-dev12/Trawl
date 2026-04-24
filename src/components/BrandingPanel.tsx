import '../styles/branding.css'

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

interface BrandingPanelProps {
  branding: BrandingData
  url: string
}

export function BrandingPanel({ branding, url }: BrandingPanelProps) {
  if (!branding || Object.keys(branding).length === 0) return null

  return (
    <div className="branding-panel">
      <h3 className="branding-title">Branding</h3>

      {branding.logos?.length > 0 && (
        <div className="branding-section">
          <label>Logos</label>
          <div className="branding-logos">
            {branding.logos.map((src, i) => (
              <img key={i} src={src} alt="logo" className="branding-logo-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ))}
          </div>
        </div>
      )}

      {branding.colors?.length > 0 && (
        <div className="branding-section">
          <label>Colors</label>
          <div className="branding-colors">
            {branding.colors.map((color, i) => (
              <div key={i} className="color-swatch" title={color}>
                <div className="color-block" style={{ background: color }} />
                <span className="color-label">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {branding.fonts?.length > 0 && (
        <div className="branding-section">
          <label>Fonts</label>
          <div className="branding-tags">
            {branding.fonts.map((font, i) => (
              <span key={i} className="branding-tag">{font}</span>
            ))}
          </div>
        </div>
      )}

      {branding.meta?.site_name && (
        <div className="branding-section">
          <label>Site Name</label>
          <span className="branding-value">{branding.meta.site_name}</span>
        </div>
      )}

      {branding.meta?.description && (
        <div className="branding-section">
          <label>Description</label>
          <span className="branding-value branding-desc">{branding.meta.description}</span>
        </div>
      )}

      {branding.images?.length > 0 && (
        <div className="branding-section">
          <label>Images</label>
          <div className="branding-images">
            {branding.images.slice(0, 6).map((src, i) => (
              <img key={i} src={src} alt="" className="branding-thumb" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
