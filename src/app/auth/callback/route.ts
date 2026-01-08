import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has a household
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membership } = await supabase
          .from('household_members')
          .select('household_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (membership) {
          // User already has a household, go to plan
          return NextResponse.redirect(`${origin}/plan`)
        }
      }
      // New user or no household, go to onboarding
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
