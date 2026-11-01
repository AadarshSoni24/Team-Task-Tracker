/** Cadence mark: three ascending beats inside a rounded tile. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="cadence-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-logo-start)" />
          <stop offset="1" stopColor="var(--color-logo-stop)" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6.5" fill="url(#cadence-g)" />
      <rect x="5.5" y="12.5" width="3" height="6" rx="1.5" fill="var(--color-logo-bars)" />
      <rect x="10.5" y="9" width="3" height="9.5" rx="1.5" fill="var(--color-logo-bars)" />
      <rect x="15.5" y="5.5" width="3" height="13" rx="1.5" fill="var(--color-logo-bars)" />
    </svg>
  )
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-fg">Cadence</span>
    </span>
  )
}

