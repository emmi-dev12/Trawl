export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className="logo"
    >
      {/* Vertical stroke */}
      <line x1="32" y1="8" x2="32" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* Horizontal stroke */}
      <line x1="16" y1="8" x2="48" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* Net curve */}
      <path
        d="M 16 40 Q 32 56 48 40"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Data points */}
      <circle cx="22" cy="48" r="1.5" fill="currentColor" />
      <circle cx="32" cy="52" r="1.5" fill="currentColor" />
      <circle cx="42" cy="48" r="1.5" fill="currentColor" />
      <circle cx="28" cy="50" r="1.2" fill="currentColor" opacity="0.7" />
      <circle cx="38" cy="50" r="1.2" fill="currentColor" opacity="0.7" />
    </svg>
  )
}
