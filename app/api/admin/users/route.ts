import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

type DbRoleType = 'admin' | 'customer' | 'operator'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const adminAllowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    const emailIsAdmin = !!user.email && adminAllowlist.includes(user.email.toLowerCase())

    const { data: roleRow } = await adminClient
      .from('roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const roleIsAdmin = roleRow?.role === 'admin'

    if (!emailIsAdmin && !roleIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
        role: roleMap.get(profile.user_id) === 'admin' ? 'admin' : 'customer',
      })
    )

    if (!merged.some((entry) => entry.user_id === user.id)) {
      merged.unshift({
        user_id: user.id,
        name: (user.user_metadata?.name as string | undefined) || 'Me',
        phone: (user.user_metadata?.phone as string | undefined) || null,
        email: user.email || null,
        role: roleMap.get(user.id) === 'admin' ? 'admin' : 'customer',
      })
    }

    return NextResponse.json({ users: merged })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}

async function listAllAuthUsers(adminClient: any) {
  const allUsers: Array<{ id: string; email?: string | null }> = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const batch = data.users || []
    allUsers.push(...batch)

    if (batch.length < perPage) break
    page += 1
  }

  return allUsers
}
