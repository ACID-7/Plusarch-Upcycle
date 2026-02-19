"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Search, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type InquiryStatus = 'new' | 'seen' | 'closed'

interface InquiryRow {
  id: string
  user_id: string
  subject?: string | null
  message: string
  status: InquiryStatus
  created_at: string
}

interface ProfileRow {
  user_id: string
  name: string | null
  phone: string | null
}

interface InquiryRowNoSubject {
  id: string
  user_id: string
  message: string
  status: InquiryStatus
  created_at: string
}

function getSanitizedInquiryBody(message: string) {
  const lines = message.split('\n')
  const filtered = lines.filter((line) => {
    const normalized = line.trim()
    if (!normalized) return true
    return !/^(name|email|phone|subject)\s*:/i.test(normalized)
  })
  return filtered.join('\n').trim()
}

export default function AdminInquiriesPage() {
  const supabase = createClient()
  const [items, setItems] = useState<InquiryRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({})
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    let { data, error } = await supabase
      .from('inquiries')
      .select('id, user_id, subject, message, status, created_at')
      .order('created_at', { ascending: false })

    if (error?.message?.toLowerCase().includes('subject')) {
      const fallback = await supabase
        .from('inquiries')
        .select('id, user_id, message, status, created_at')
        .order('created_at', { ascending: false })
      data = ((fallback.data || []) as InquiryRowNoSubject[]).map((row) => ({ ...row, subject: null }))
    }

    const rows = (data || []) as InquiryRow[]
    setItems(rows)

    const userIds = Array.from(new Set(rows.map(row => row.user_id)))
    if (userIds.length) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, name, phone')
        .in('user_id', userIds)

      const profileMap: Record<string, ProfileRow> = {}
      for (const profile of (profileData || []) as ProfileRow[]) {
        profileMap[profile.user_id] = profile
      }
      setProfiles(profileMap)
    } else {
      setProfiles({})
    }

    const emailMap: Record<string, string> = {}
    for (const row of rows) {
      const parsedEmail = row.message.match(/Email:\s*([^\n]+)/i)?.[1]?.trim()
      if (parsedEmail) emailMap[row.user_id] = parsedEmail
    }
    setEmails(emailMap)

    setLoading(false)
  }

  const updateStatus = async (id: string, status: InquiryStatus) => {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    setItems(prev => prev.map(item => (item.id === id ? { ...item, status } : item)))
    toast({ title: 'Status updated' })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => {
      const profile = profiles[item.user_id]
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesSearch =
        !q ||
        (item.subject || '').toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (profile?.name || '').toLowerCase().includes(q) ||
        (emails[item.user_id] || '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [items, search, statusFilter, profiles, emails])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Service</p>
          <h1 className="text-3xl font-bold text-white">Inquiries</h1>
          <p className="text-sm text-emerald-100/80">Track and respond to verified inquiry submissions.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-white">Inbox</CardTitle>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative w-full md:w-72">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, message, user"
                className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: InquiryStatus | 'all') => setStatusFilter(v)}>
              <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="seen">Seen</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-emerald-100/70">Loading...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-emerald-100/70">No inquiries.</p>
          )}
          {!loading && filtered.map((inquiry) => {
            const profile = profiles[inquiry.user_id]
            const email = emails[inquiry.user_id] || 'Not provided'
            const cleanBody = getSanitizedInquiryBody(inquiry.message) || inquiry.message

            return (
              <div key={inquiry.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{profile?.name || `User ${inquiry.user_id.slice(0, 8)}`}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-100/70">
                      <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{email}</span>
                      {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{profile.phone}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-300/60 text-emerald-50 capitalize">{inquiry.status}</Badge>
                </div>
                <p className="font-medium text-white">{inquiry.subject || 'General inquiry'}</p>
                <p className="text-sm text-emerald-100/80 whitespace-pre-line">{cleanBody}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => updateStatus(inquiry.id, 'seen')}>
                    Mark seen
                  </Button>
                  <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => updateStatus(inquiry.id, 'closed')}>
                    Close
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
