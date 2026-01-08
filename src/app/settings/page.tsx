import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'
import { InviteCode } from './invite-code'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's household membership with household details
  const { data: membership } = await supabase
    .from('household_members')
    .select(`
      name,
      role,
      households (
        id,
        name,
        invite_code
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  // Supabase returns single relations as objects, not arrays
  const household = membership.households as unknown as { id: string; name: string; invite_code: string }
  if (!household) redirect('/onboarding')

  // Get all members of the household
  const { data: members } = await supabase
    .from('household_members')
    .select('id, name, role')
    .eq('household_id', household.id)

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <Link
          href="/plan"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          &larr; Back to plan
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Your Account</h2>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
          <p className="text-sm">
            <span className="text-[var(--text-secondary)]">Email:</span>{' '}
            <span className="text-[var(--text-primary)]">{user.email}</span>
          </p>
          <p className="text-sm">
            <span className="text-[var(--text-secondary)]">Name:</span>{' '}
            <span className="text-[var(--text-primary)]">{membership.name}</span>
          </p>
          <p className="text-sm">
            <span className="text-[var(--text-secondary)]">Role:</span>{' '}
            <span className="text-[var(--text-primary)] capitalize">{membership.role}</span>
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Household</h2>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <p className="text-sm">
            <span className="text-[var(--text-secondary)]">Name:</span>{' '}
            <span className="text-[var(--text-primary)]">{household.name}</span>
          </p>
          <InviteCode code={household.invite_code} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Members</h2>
        <ul className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
          {members?.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="text-[var(--text-primary)]">{m.name}</span>{' '}
              <span className="text-[var(--text-muted)] capitalize">({m.role})</span>
            </li>
          ))}
        </ul>
      </section>

      <SignOutButton />
    </main>
  )
}
