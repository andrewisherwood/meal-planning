'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type PrivacySectionProps = {
  userId: string
}

type ProfileData = {
  terms_accepted_at: string | null
  terms_version: string | null
  notification_consent_at: string | null
  notification_consent_withdrawn_at: string | null
}

export function PrivacySection({ userId }: PrivacySectionProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('terms_accepted_at, terms_version, notification_consent_at, notification_consent_withdrawn_at')
        .eq('id', userId)
        .single()

      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [userId])

  const handleWithdrawNotificationConsent = async () => {
    setWithdrawing(true)

    const supabase = createClient()

    // First, remove all push subscriptions for this user
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    // Then, record the withdrawal
    const { data, error } = await supabase
      .from('profiles')
      .update({
        notification_consent_withdrawn_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }

    setWithdrawing(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not recorded'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const hasActiveNotificationConsent =
    profile?.notification_consent_at &&
    (!profile.notification_consent_withdrawn_at ||
      new Date(profile.notification_consent_at) > new Date(profile.notification_consent_withdrawn_at))

  if (loading) {
    return <p className="text-sm text-text-muted">Loading...</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Terms of Service</p>
            <p className="text-xs text-text-muted">
              {profile?.terms_accepted_at
                ? `Accepted on ${formatDate(profile.terms_accepted_at)}`
                : 'Not yet accepted'}
              {profile?.terms_version && ` (v${profile.terms_version})`}
            </p>
          </div>
          <Link
            href="/terms"
            target="_blank"
            className="text-sm text-text-secondary hover:text-text-primary underline"
          >
            View
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Privacy Policy</p>
            <p className="text-xs text-text-muted">
              {profile?.terms_accepted_at
                ? `Accepted on ${formatDate(profile.terms_accepted_at)}`
                : 'Not yet accepted'}
            </p>
          </div>
          <Link
            href="/privacy"
            target="_blank"
            className="text-sm text-text-secondary hover:text-text-primary underline"
          >
            View
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Notification Consent</p>
            <p className="text-xs text-text-muted">
              {hasActiveNotificationConsent
                ? `Consented on ${formatDate(profile?.notification_consent_at ?? null)}`
                : profile?.notification_consent_withdrawn_at
                  ? `Withdrawn on ${formatDate(profile.notification_consent_withdrawn_at)}`
                  : 'Not given'}
            </p>
          </div>
          {hasActiveNotificationConsent && (
            <button
              type="button"
              onClick={handleWithdrawNotificationConsent}
              disabled={withdrawing}
              className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
            >
              {withdrawing ? 'Withdrawing...' : 'Withdraw'}
            </button>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-text-muted">
          For data access requests or other privacy inquiries, contact us at{' '}
          <a href="mailto:hello@suppertime.uk" className="underline hover:text-text-secondary">
            hello@suppertime.uk
          </a>
        </p>
      </div>
    </div>
  )
}
