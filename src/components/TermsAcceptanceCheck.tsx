'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TermsAcceptanceModal } from './TermsAcceptanceModal'

type TermsAcceptanceCheckProps = {
  userId: string
  children: React.ReactNode
}

export function TermsAcceptanceCheck({ userId, children }: TermsAcceptanceCheckProps) {
  const pathname = usePathname()
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean | null>(null)

  // Allow settings page access even without terms acceptance (for deletion)
  const isSettingsPage = pathname === '/settings'

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      const supabase = createClient()

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('terms_accepted_at')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, they need to accept
        setNeedsAcceptance(true)
        return
      }

      setNeedsAcceptance(!profile?.terms_accepted_at)
    }

    checkTermsAcceptance()
  }, [userId])

  // Still loading
  if (needsAcceptance === null) {
    return <>{children}</>
  }

  // Needs acceptance but on settings page - allow access
  if (needsAcceptance && isSettingsPage) {
    return <>{children}</>
  }

  // Needs acceptance - show modal
  if (needsAcceptance) {
    return (
      <>
        {children}
        <TermsAcceptanceModal
          userId={userId}
          onAccepted={() => setNeedsAcceptance(false)}
        />
      </>
    )
  }

  // All good
  return <>{children}</>
}
