"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Search, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type CustomStatus = 'new' | 'in_progress' | 'done'

interface CustomOrderRow {
  id: string
  user_id: string
  style: string | null
  colors: string | null
  budget_range: string | null
  deadline: string | null
  notes: string | null
  status: CustomStatus
  created_at: string
}

interface ProfileRow {
  user_id: string
  name: string | null
  phone: string | null
}

interface CustomOrderImageRow {
  custom_order_id: string
  path: string
}

export default function AdminCustomOrdersPage() {
  const supabase = createClient()
  const [items, setItems] = useState<CustomOrderRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({})
  const [imagesByOrder, setImagesByOrder] = useState<Record<string, string[]>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomStatus>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('custom_orders')
      .select('id, user_id, style, colors, budget_range, deadline, notes, status, created_at')
      .order('created_at', { ascending: false })

    const rows = (data || []) as CustomOrderRow[]
    setItems(rows)

    const orderIds = rows.map(row => row.id)
    const userIds = Array.from(new Set(rows.map(row => row.user_id)))

    if (userIds.length) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, name, phone')
        .in('user_id', userIds)

      const map: Record<string, ProfileRow> = {}
      for (const profile of (profileData || []) as ProfileRow[]) {
        map[profile.user_id] = profile
      }
      setProfiles(map)
    } else {
      setProfiles({})
    }

    if (orderIds.length) {
      const { data: imageData } = await supabase
        .from('custom_order_images')
        .select('custom_order_id, path')
        .in('custom_order_id', orderIds)

      const map: Record<string, string[]> = {}
      for (const row of (imageData || []) as CustomOrderImageRow[]) {
        if (!map[row.custom_order_id]) map[row.custom_order_id] = []
        map[row.custom_order_id].push(row.path)
      }
      setImagesByOrder(map)
    } else {
      setImagesByOrder({})
    }

    setLoading(false)
  }

  const updateStatus = async (id: string, status: CustomStatus) => {
    const { error } = await supabase.from('custom_orders').update({ status }).eq('id', id)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    setItems(prev => prev.map(order => (order.id === id ? { ...order, status } : order)))
    toast({ title: 'Status updated' })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => {
      const profile = profiles[item.user_id]
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesSearch =
        !q ||
        (item.style || '').toLowerCase().includes(q) ||
        (item.colors || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q) ||
        (profile?.name || '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [items, search, statusFilter, profiles])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Service</p>
          <h1 className="text-3xl font-bold text-white">Custom Orders</h1>
          <p className="text-sm text-emerald-100/80">Track briefs, references, and production status.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-white">Requests</CardTitle>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative w-full md:w-72">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search style, notes, customer"
                className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: CustomStatus | 'all') => setStatusFilter(v)}>
              <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-emerald-100/70">Loading...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-emerald-100/70">No custom orders.</p>
          )}
          {!loading && filtered.map((order) => {
            const profile = profiles[order.user_id]
            const references = imagesByOrder[order.id] || []
            return (
              <div key={order.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{profile?.name || `User ${order.user_id.slice(0, 8)}`}</p>
                    {profile?.phone && <p className="text-sm text-emerald-100/70">{profile.phone}</p>}
                    <p className="text-xs text-emerald-100/70">Submitted: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-300/60 text-emerald-50 capitalize">{order.status.replace('_', ' ')}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-emerald-100/70">Style</p>
                    <p className="text-white">{order.style || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100/70">Colors</p>
                    <p className="text-white">{order.colors || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100/70">Budget</p>
                    <p className="text-white">{order.budget_range || 'Not specified'}</p>
                  </div>
                </div>

                {order.deadline && (
                  <p className="text-sm text-emerald-100/80">Deadline: {new Date(order.deadline).toLocaleDateString()}</p>
                )}

                <p className="text-sm text-emerald-100/80 whitespace-pre-line">{order.notes || 'No notes provided.'}</p>

                {references.length > 0 && (
                  <div className="space-y-1">
                    {references.map((path) => (
                      <a
                        key={path}
                        href={path}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-emerald-100/80 break-all hover:text-emerald-200"
                      >
                        <ImageIcon className="h-4 w-4" />
                        {path}
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(['new', 'in_progress', 'done'] as CustomStatus[]).map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      className="border-emerald-200/50 text-emerald-50"
                      onClick={() => updateStatus(order.id, status)}
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
