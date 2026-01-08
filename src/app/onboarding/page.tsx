import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if already has household
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) {
    redirect('/plan')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--surface)]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-2 text-[var(--text-primary)]">
          Welcome!
        </h1>
        <p className="text-[var(--text-secondary)] text-center mb-8">
          Create a new household or join an existing one.
        </p>
        <OnboardingForm userId={user.id} />
      </div>
    </main>
  )
}
