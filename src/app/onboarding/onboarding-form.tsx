'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TERMS_VERSION = '2026-01'
const PRIVACY_VERSION = '2026-01'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create household
  const [householdName, setHouseholdName] = useState('')
  const [memberName, setMemberName] = useState('')

  // Join household
  const [inviteCode, setInviteCode] = useState('')
  const [joinName, setJoinName] = useState('')

  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Generate ID client-side to avoid needing RETURNING (which triggers SELECT policy)
    const householdId = crypto.randomUUID()

    // Create household
    const { error: hhErr } = await supabase
      .from('households')
      .insert({
        id: householdId,
        name: householdName,
        slug: slugify(householdName) + '-' + Date.now().toString(36),
        invite_code: generateInviteCode(),
      })

    if (hhErr) {
      setError(hhErr.message)
      setLoading(false)
      return
    }

    // Add user as member
    const { error: memErr } = await supabase
      .from('household_members')
      .insert({
        household_id: householdId,
        user_id: userId,
        name: memberName,
        role: 'parent',
      })

    if (memErr) {
      setError(memErr.message)
      setLoading(false)
      return
    }

    // Update profile with terms acceptance
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        privacy_policy_version: PRIVACY_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileErr) {
      console.error('Failed to update profile:', profileErr)
      // Continue anyway - non-critical
    }

    router.push('/plan')
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Find household by invite code using RPC function (bypasses RLS)
    const { data: householdId, error: hhErr } = await supabase
      .rpc('get_household_id_by_invite_code', { code: inviteCode.trim() })

    if (hhErr || !householdId) {
      setError('Invalid invite code')
      setLoading(false)
      return
    }

    // Add user as member
    const { error: memErr } = await supabase
      .from('household_members')
      .insert({
        household_id: householdId,
        user_id: userId,
        name: joinName,
        role: 'parent',
      })

    if (memErr) {
      setError(memErr.message)
      setLoading(false)
      return
    }

    // Update profile with terms acceptance
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        privacy_policy_version: PRIVACY_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileErr) {
      console.error('Failed to update profile:', profileErr)
      // Continue anyway - non-critical
    }

    router.push('/plan')
  }

  const TermsCheckbox = () => (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id="terms"
        checked={termsAccepted}
        onChange={(e) => setTermsAccepted(e.target.checked)}
        required
        className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--text-primary)]"
      />
      <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]">
        I agree to the{' '}
        <Link href="/terms" target="_blank" className="underline hover:text-[var(--text-primary)]">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" target="_blank" className="underline hover:text-[var(--text-primary)]">
          Privacy Policy
        </Link>
      </label>
    </div>
  )

  if (mode === 'choice') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode('create')}
          className="w-full p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] text-left transition-colors"
        >
          <div className="font-medium text-[var(--text-primary)]">Create a household</div>
          <div className="text-sm text-[var(--text-secondary)]">Start fresh with your family</div>
        </button>
        <button
          onClick={() => setMode('join')}
          className="w-full p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] text-left transition-colors"
        >
          <div className="font-medium text-[var(--text-primary)]">Join a household</div>
          <div className="text-sm text-[var(--text-secondary)]">I have an invite code</div>
        </button>
      </div>
    )
  }

  // Create form
  if (mode === 'create') {
    return (
      <form onSubmit={handleCreate} className="space-y-4">
        <button
          type="button"
          onClick={() => setMode('choice')}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          &larr; Back
        </button>
        <div>
          <label htmlFor="householdName" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Household name
          </label>
          <input
            id="householdName"
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="e.g., The Smiths"
            required
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="memberName" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Your name
          </label>
          <input
            id="memberName"
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="e.g., Sarah"
            required
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2"
          />
        </div>
        <TermsCheckbox />
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full px-4 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--surface)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? 'Creating...' : 'Create household'}
        </button>
      </form>
    )
  }

  // Join form
  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <button
        type="button"
        onClick={() => setMode('choice')}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        &larr; Back
      </button>
      <div>
        <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Invite code
        </label>
        <input
          id="inviteCode"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="e.g., ABC12345"
          required
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2 uppercase"
        />
      </div>
      <div>
        <label htmlFor="joinName" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Your name
        </label>
        <input
          id="joinName"
          type="text"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          placeholder="e.g., Sarah"
          required
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2"
        />
      </div>
      <TermsCheckbox />
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <button
        type="submit"
        disabled={loading || !termsAccepted}
        className="w-full px-4 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--surface)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Joining...' : 'Join household'}
      </button>
    </form>
  )
}
