"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mapDbRoleToAppRole } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/client'
import { Search, ShieldCheck, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'

type RoleType = 'admin' | 'customer'
type DbRoleType = 'admin' | 'customer' | 'operator'

interface ProfileRow {
  user_id: string
  name: string | null
  email: string | null
  phone: string | null
  role: RoleType | null
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string' && payload.error.trim()
            ? payload.error
            : 'Failed to load admin users.'
        )
      }

      setUsers(Array.isArray(payload?.users) ? (payload.users as ProfileRow[]) : [])
    } catch (error) {
      toast({
        title: 'Could not load users',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleRoleChange = async (userId: string, role: RoleType) => {
    setSavingId(userId)
    const roleCandidates: DbRoleType[] = role === 'admin' ? ['admin'] : ['customer', 'operator']
    let updateError: { message: string } | null = null

    for (const dbRole of roleCandidates) {
      const { error } = await supabase
        .from('roles')
        .upsert({ user_id: userId, role: dbRole })

      if (!error) {
        updateError = null
        break
      }
      updateError = error ? { message: error.message } : null
    }

    setSavingId(null)
    if (updateError) {
      toast({ title: 'Update failed', description: updateError.message, variant: 'destructive' })
    } else {
      toast({ title: 'Role updated', description: `User is now ${role}.` })
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: mapDbRoleToAppRole(role) } : u))
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u =>
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.user_id.toLowerCase().includes(q)
    )
  }, [search, users])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Access Control</p>
          <h1 className="text-3xl font-bold text-white">Users & Roles</h1>
          <p className="text-sm text-emerald-100/80">
            Set each account as `admin` or `customer`. Customers can only access the website.
          </p>
        </div>
        <Button variant="outline" onClick={loadUsers} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
          Refresh
        </Button>
      </div>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-emerald-100/70">Loading users...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-emerald-100/70">No users found.</p>
          )}
          {!loading && filtered.map(user => (
            <div key={user.user_id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              <div className="md:col-span-2">
                <p className="font-semibold text-white">{user.name || 'No name yet'}</p>
                <p className="text-sm text-emerald-100/70">{user.email || 'No email on file'}</p>
                <p className="text-xs text-emerald-200/70">ID: {user.user_id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-emerald-100/70">Phone</p>
                <p className="text-white">{user.phone || '-'}</p>
              </div>
              <div className="flex items-center gap-2">
              <Select
                value={user.role || 'customer'}
                onValueChange={(val: RoleType) => handleRoleChange(user.user_id, val)}
                disabled={savingId === user.user_id}
              >
                <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {user.role === 'admin' && <ShieldCheck className="h-4 w-4 text-emerald-300" />}
              <span className="text-sm text-emerald-100/80 capitalize">{user.role || 'customer'}</span>
            </div>
          </div>
        ))}
      </CardContent>
      </Card>
    </div>
  )
}
