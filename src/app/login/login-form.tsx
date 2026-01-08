'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="sr-only">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--surface)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Sending...' : 'Send magic link'}
      </button>
      {message && (
        <p className={`text-sm text-center ${message.type === 'error' ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}
