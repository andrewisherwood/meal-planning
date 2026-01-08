'use client'

import { useState } from 'react'

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-secondary)]">Invite code:</span>
      <code className="font-mono text-sm bg-[var(--surface-muted)] px-2 py-1 rounded text-[var(--text-primary)]">
        {code}
      </code>
      <button
        onClick={handleCopy}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
