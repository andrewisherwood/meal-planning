'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Create household
    const { data: household, error: hhErr } = await supabase
      .from('households')
      .insert({
        name: householdName,
        slug: slugify(householdName) + '-' + Date.now().toString(36),
        invite_code: generateInviteCode(),
      })
      .select('id')
      .single()

    if (hhErr) {
      setError(hhErr.message)
      setLoading(false)
      return
    }

    // Add user as member
    const { error: memErr } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: userId,
        name: memberName,
        role: 'parent',
      })

    if (memErr) {
      setError(memErr.message)
      setLoading(false)
      return
    }

    router.push('/plan')
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Find household by invite code
    const { data: household, error: hhErr } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .maybeSingle()

    if (hhErr || !household) {
      setError('Invalid invite code')
      setLoading(false)
      return
    }

    // Add user as member
    const { error: memErr } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: userId,
        name: joinName,
        role: 'parent',
      })

    if (memErr) {
      setError(memErr.message)
      setLoading(false)
      return
    }

    router.push('/plan')
  }

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
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
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
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--surface)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Joining...' : 'Join household'}
      </button>
    </form>
  )
}
