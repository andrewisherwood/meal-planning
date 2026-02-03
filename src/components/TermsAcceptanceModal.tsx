'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TERMS_VERSION = '2026-01'
const PRIVACY_VERSION = '2026-01'

type TermsAcceptanceModalProps = {
  userId: string
  onAccepted: () => void
}

export function TermsAcceptanceModal({ userId, onAccepted }: TermsAcceptanceModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!termsAccepted) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        privacy_policy_version: PRIVACY_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      setError('Failed to save your acceptance. Please try again.')
      setLoading(false)
      return
    }

    onAccepted()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Updated Terms & Privacy Policy
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          We&apos;ve updated our Terms of Service and Privacy Policy. Please review and accept them
          to continue using Suppertime.
        </p>

        <div className="space-y-3 mb-6">
          <Link
            href="/terms"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-muted transition-colors"
          >
            <span className="text-sm font-medium text-text-primary">Terms of Service</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
          <Link
            href="/privacy"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-muted transition-colors"
          >
            <span className="text-sm font-medium text-text-primary">Privacy Policy</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            id="accept-terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-text-primary focus:ring-text-primary"
          />
          <label htmlFor="accept-terms" className="text-sm text-text-secondary">
            I have read and agree to the Terms of Service and Privacy Policy
          </label>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleAccept}
          disabled={!termsAccepted || loading}
          className="w-full px-4 py-3 rounded-xl bg-text-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? 'Saving...' : 'Accept and continue'}
        </button>

        <p className="mt-4 text-xs text-text-muted text-center">
          If you don&apos;t agree, you can{' '}
          <Link href="/settings" className="underline hover:text-text-secondary">
            delete your account
          </Link>{' '}
          in settings.
        </p>
      </div>
    </div>
  )
}
