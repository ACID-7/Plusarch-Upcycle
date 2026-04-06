import type { SupabaseClient, User } from '@supabase/supabase-js'

export type AppRole = 'admin' | 'customer'
export type DbRole = 'admin' | 'customer' | 'operator'

type ProfileRow = {
  name?: string | null
  phone?: string | null
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false

  // Email allowlist is a fallback so the first admin can still get in even if the roles table is incomplete.
  const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase())
}

export function mapDbRoleToAppRole(role?: string | null): AppRole {
  return role === 'admin' ? 'admin' : 'customer'
}

export function canAccessAdmin(role?: string | null, email?: string | null) {
  return role === 'admin' || isAdminEmail(email)
}

export async function ensureCustomerRole(supabase: SupabaseClient, userId: string) {
  const roleCandidates: DbRole[] = ['customer', 'operator']
  let lastError: Error | null = null

  // Different environments may accept either `customer` or the older `operator` value.
  for (const role of roleCandidates) {
    const { error } = await supabase
      .from('roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id', ignoreDuplicates: true })

    if (!error) return
    lastError = error
  }

  if (lastError) throw lastError
}

export async function fetchRole(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.role ?? null
}

export async function fetchProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return (data as ProfileRow | null) ?? null
}

export async function upsertProfile(
  supabase: SupabaseClient,
  input: { userId: string; name: string; phone?: string | null }
) {
  const { error } = await supabase.from('profiles').upsert({
    user_id: input.userId,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
  })

  if (error) throw error
}

export function resolveDisplayName(user: User | null, profileName?: string | null) {
  // We prefer explicit profile data, but user metadata is a useful fallback right after signup.
  const metadataName = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : ''
  if (metadataName) return metadataName
  if (profileName?.trim()) return profileName.trim()
  return user?.email?.split('@')[0] || 'Account'
}
