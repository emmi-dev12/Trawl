import '../styles/menubar.css'

interface MenuBarProps {
  version: string
}

export function MenuBar({ version }: MenuBarProps) {
  return (
    <div className="menubar">
      <div className="menubar-left">
        <span className="app-title">Trawl</span>
      </div>
      <div className="menubar-right">
        <button className="version-btn" title="Check for updates">
          v{version}
        </button>
      </div>
    </div>
  )
}
