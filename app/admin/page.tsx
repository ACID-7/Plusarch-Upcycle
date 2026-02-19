"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Package, FileText, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ConversationSummary {
  id: string
  user_id: string
  status: 'open' | 'pending' | 'closed'
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    inquiries: 0,
    customOrders: 0,
    openChats: 0,
    pendingChats: 0,
  })
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const [inquiriesRes, ordersRes, chatsRes, recentChatsRes] = await Promise.all([
        supabase.from('inquiries').select('id', { count: 'exact' }).eq('status', 'new'),
        supabase.from('custom_orders').select('id', { count: 'exact' }).eq('status', 'new'),
        supabase.from('conversations').select('status'),
        supabase
          .from('conversations')
          .select('id, user_id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const openChats = chatsRes.data?.filter(c => c.status === 'open').length || 0
      const pendingChats = chatsRes.data?.filter(c => c.status === 'pending').length || 0

      setStats({
        inquiries: inquiriesRes.count || 0,
        customOrders: ordersRes.count || 0,
        openChats,
        pendingChats,
      })

      if (recentChatsRes.data) {
        setRecentConversations(recentChatsRes.data as ConversationSummary[])
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Operations Pulse</p>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Track inquiries, custom orders, and live chat coverage at a glance.</p>
        </div>
        <Badge variant="outline" className="border-emerald-300/50 text-emerald-100">
          {new Date().toLocaleDateString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-emerald-900/60 bg-white/5 shadow-lg shadow-emerald-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Inquiries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inquiries}</div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-lg shadow-emerald-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-lg shadow-emerald-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openChats}</div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-lg shadow-emerald-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Chats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingChats}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Live Chat Queue</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {recentConversations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent conversations yet.
              </p>
            )}
            {recentConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <p className="text-sm font-semibold">User {conversation.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{conversation.status}</Badge>
              </div>
            ))}
            </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Today's Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-900/60 p-4 bg-white/5">
              <p className="text-sm font-semibold text-white">Open inquiries</p>
              <p className="text-xs text-emerald-100/80">
                Prioritize new inquiries and send follow-ups within 24 hours.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-900/60 p-4 bg-white/5">
              <p className="text-sm font-semibold text-white">Custom orders</p>
              <p className="text-xs text-emerald-100/80">
                Confirm material availability and share progress photos.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-900/60 p-4 bg-white/5">
              <p className="text-sm font-semibold text-white">Live chat coverage</p>
              <p className="text-xs text-emerald-100/80">
                Assign an admin for peak hours and update the queue status.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

