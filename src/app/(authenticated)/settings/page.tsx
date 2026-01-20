import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'
import { InviteCode } from './invite-code'
import { MealSettings } from './meal-settings'

type HouseholdData = {
  id: string;
  name: string;
  invite_code: string;
  dinner_time: string | null;
  notifications_enabled: boolean | null;
  notification_time: string | null;
  notification_sound: boolean | null;
};

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
        invite_code,
        dinner_time,
        notifications_enabled,
        notification_time,
        notification_sound
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  // Supabase returns single relations as objects, not arrays
  const household = membership.households as unknown as HouseholdData
  if (!household) redirect('/onboarding')

  // Get all members of the household
  const { data: members } = await supabase
    .from('household_members')
    .select('id, name, role')
    .eq('household_id', household.id)

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Settings</h1>

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

      <section className="mb-8">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Meal Settings</h2>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <MealSettings
            householdId={household.id}
            initialDinnerTime={household.dinner_time ?? "18:00"}
            initialNotificationsEnabled={household.notifications_enabled ?? true}
            initialNotificationTime={household.notification_time ?? "19:00"}
            initialNotificationSound={household.notification_sound ?? false}
          />
        </div>
      </section>

      <SignOutButton />
    </main>
  )
}
