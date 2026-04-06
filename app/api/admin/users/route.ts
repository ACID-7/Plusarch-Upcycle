import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { canAccessAdmin, mapDbRoleToAppRole } from '@/lib/auth-utils'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getErrorMessage } from '@/lib/errors'

type DbRoleType = 'admin' | 'customer' | 'operator'

export async function GET() {
  try {
    // First verify the caller from the request cookies before switching to the service-role client.
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The service-role client is only used on the server to read auth users and protected admin tables.
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: roleRow } = await adminClient
      .from('roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!canAccessAdmin(roleRow?.role, user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Profiles, roles, and auth emails live in different places, so we merge them into one admin-friendly payload.
    const [{ data: profiles }, { data: roles }, authUsers] = await Promise.all([
      adminClient.from('profiles').select('user_id, name, phone').order('name', { ascending: true }),
      adminClient.from('roles').select('user_id, role'),
      listAllAuthUsers(adminClient),
    ])

    const roleMap = new Map<string, DbRoleType>(
      ((roles || []) as Array<{ user_id: string; role: DbRoleType }>).map((row) => [row.user_id, row.role])
    )
    const emailMap = new Map<string, string | null>(
      authUsers.map((authUser) => [authUser.id, authUser.email || null])
    )

    const merged = ((profiles || []) as Array<{ user_id: string; name: string | null; phone: string | null }>).map(
      (profile) => ({
        user_id: profile.user_id,
        name: profile.name,
        phone: profile.phone,
        email: emailMap.get(profile.user_id) || null,
        role: mapDbRoleToAppRole(roleMap.get(profile.user_id)),
      })
    )

    if (!merged.some((entry) => entry.user_id === user.id)) {
      merged.unshift({
        user_id: user.id,
        name: (user.user_metadata?.name as string | undefined) || 'Me',
        phone: (user.user_metadata?.phone as string | undefined) || null,
        email: user.email || null,
        role: mapDbRoleToAppRole(roleMap.get(user.id)),
      })
    }

    return NextResponse.json({ users: merged })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

type AdminClient = {
  auth: {
    admin: {
      listUsers: (params: { page: number; perPage: number }) => Promise<{
        data: { users: Array<{ id: string; email?: string | null }> }
        error: { message: string } | null
      }>
    }
  }
}

async function listAllAuthUsers(adminClient: AdminClient) {
  const allUsers: Array<{ id: string; email?: string | null }> = []
  let page = 1
  const perPage = 200

  while (true) {
    // Supabase Auth user listing is paginated, so we keep fetching until we receive a short page.
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const batch = data.users || []
    allUsers.push(...batch)

    if (batch.length < perPage) break
    page += 1
  }

  return allUsers
}
