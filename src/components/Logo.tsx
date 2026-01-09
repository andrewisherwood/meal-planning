type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { icon: 24, text: 'text-xl', gap: 'gap-2' },
  md: { icon: 32, text: 'text-[1.75rem]', gap: 'gap-3' },
  lg: { icon: 40, text: 'text-[2.5rem]', gap: 'gap-3' },
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const { icon, text, gap } = sizes[size]

  // Brand colors - using CSS variables
  const brandPrimary = 'var(--color-brand-primary, #d4846a)'
  const brandAccent = 'var(--color-brand-accent, #f8ebe4)'

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        className="flex-shrink-0"
      >
        <circle cx="20" cy="20" r="16" fill={brandAccent} stroke={brandPrimary} strokeWidth="2" />
        <circle cx="20" cy="20" r="8" fill={brandPrimary} />
        <line x1="20" y1="4" x2="20" y2="10" stroke={brandPrimary} strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="8" x2="24" y2="12" stroke={brandPrimary} strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="8" x2="16" y2="12" stroke={brandPrimary} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span
        className={`font-brand font-bold tracking-[0.02em] ${text}`}
        style={{ color: brandPrimary }}
      >
        suppertime
      </span>
    </div>
  )
}
