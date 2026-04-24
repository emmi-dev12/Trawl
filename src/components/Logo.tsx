export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className="logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4cc9f0', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Main T shape */}
      <rect x="22" y="12" width="20" height="4" rx="2" fill="url(#logoGrad)" />
      <rect x="30" y="12" width="4" height="32" rx="2" fill="url(#logoGrad)" />

      {/* Net/web curves */}
      <path d="M 18 40 Q 32 52 46 40" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Connection points */}
      <circle cx="22" cy="40" r="2.5" fill="url(#logoGrad)" opacity="0.8" />
      <circle cx="32" cy="44" r="2.5" fill="url(#logoGrad)" />
      <circle cx="42" cy="40" r="2.5" fill="url(#logoGrad)" opacity="0.8" />

      {/* Accent dots */}
      <circle cx="28" cy="46" r="1.5" fill="url(#logoGrad)" opacity="0.6" />
      <circle cx="36" cy="46" r="1.5" fill="url(#logoGrad)" opacity="0.6" />
    </svg>
  )
}
