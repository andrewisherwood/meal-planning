import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/plan')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--surface)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-2 text-[var(--text-primary)]">
          Meal Planning
        </h1>
        <p className="text-[var(--text-secondary)] text-center mb-8">
          Sign in to access your household&apos;s meal plan
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
