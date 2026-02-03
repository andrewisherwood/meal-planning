import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client for privileged operations
    const adminClient = createAdminClient()

    // Call the delete_user_account function
    const { data, error: deleteError } = await adminClient.rpc(
      'delete_user_account',
      { target_user_id: user.id }
    )

    if (deleteError) {
      console.error('Failed to delete user data:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account data' },
        { status: 500 }
      )
    }

    // Delete the auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete auth account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      householdDeleted: data?.household_deleted ?? false,
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
