'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DeleteAccountProps = {
  memberCount: number
  isOwner: boolean
}

export function DeleteAccount({ memberCount, isOwner }: DeleteAccountProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSoleMember = memberCount === 1
  const canDelete = confirmText.toLowerCase() === 'delete my account'

  const handleDelete = async () => {
    if (!canDelete) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out and redirect
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  if (!showConfirm) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Delete my account
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-red-900">Delete Account</h4>
        <p className="text-sm text-red-800 mt-1">
          This action cannot be undone.
        </p>
      </div>

      <div className="text-sm text-red-700 space-y-2">
        {isSoleMember ? (
          <>
            <p>
              <strong>You are the only member of your household.</strong> Deleting your
              account will also delete:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your household and all meal plans</li>
              <li>All recipes you&apos;ve created</li>
              <li>Shopping lists and meal completions</li>
              <li>All notification preferences</li>
            </ul>
          </>
        ) : (
          <>
            <p>Deleting your account will:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Remove you from your household</li>
              <li>Remove your notification subscriptions</li>
              {isOwner && (
                <li>Transfer household ownership to another parent member</li>
              )}
            </ul>
            <p className="mt-2">
              Your household, recipes, and meal plans will remain for other members.
            </p>
          </>
        )}
      </div>

      <div>
        <label htmlFor="confirm-delete" className="block text-sm font-medium text-red-800 mb-1">
          Type &quot;delete my account&quot; to confirm
        </label>
        <input
          id="confirm-delete"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="delete my account"
          className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-red-900 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
        >
          {deleting ? 'Deleting...' : 'Permanently delete account'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowConfirm(false)
            setConfirmText('')
            setError(null)
          }}
          disabled={deleting}
          className="px-4 py-2 rounded-lg border border-red-300 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
