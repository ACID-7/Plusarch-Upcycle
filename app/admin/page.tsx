"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight,
  FileText,
  MessageSquare,
  ShoppingCart,
  UserRound,
  Wallet,
} from 'lucide-react'

type ConversationStatus = 'open' | 'pending' | 'closed'
type InquiryStatus = 'new' | 'seen' | 'closed'

interface DashboardStats {
  newInquiries: number
  openChats: number
  pendingChats: number
  totalChats: number
  activeProducts: number
  hiddenProducts: number
  totalOrders: number
  pendingOrders: number
  paidOrders: number
  totalUsers: number
  monthlyRevenue: number
}

interface RecentConversation {
  id: string
  user_id: string
  status: ConversationStatus
  created_at: string
  last_message_at: string
}

interface RecentInquiry {
  id: string
  user_id: string
  subject: string | null
  status: InquiryStatus
  created_at: string
}

interface Profile {
  user_id: string
  name: string | null
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    newInquiries: 0,
    openChats: 0,
    pendingChats: 0,
    totalChats: 0,
    activeProducts: 0,
    hiddenProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
  })
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([])
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([])
  const [profiles, setProfiles] = useState<Record<string, string>>({})

  const loadDashboard = async () => {
    setLoading(true)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [
      inquiriesRes,
      conversationsRes,
      recentChatsRes,
      productsRes,
      ordersRes,
      monthOrdersRes,
      recentInquiriesRes,
      usersRes,
    ] = await Promise.all([
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('conversations').select('status'),
      supabase
        .from('conversations')
        .select('id, user_id, status, created_at, last_message_at')
        .order('last_message_at', { ascending: false })
        .limit(5),
      supabase.from('products').select('status'),
      supabase.from('orders').select('status, payment_status'),
      supabase
        .from('orders')
        .select('total_amount_lkr, payment_status, created_at')
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('inquiries')
        .select('id, user_id, subject, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
    ])

    const conversationRows = recentChatsRes.data || []
    const inquiryRows = recentInquiriesRes.data || []
    const allConversationStatuses = conversationsRes.data || []
    const allProductStatuses = productsRes.data || []
    const allOrders = ordersRes.data || []
    const monthOrders = monthOrdersRes.data || []

    const allUserIds = Array.from(
      new Set(
        [...conversationRows, ...inquiryRows]
          .map((item) => item.user_id)
          .filter(Boolean)
      )
    )

    let profileMap: Record<string, string> = {}
    if (allUserIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', allUserIds)

      profileMap = Object.fromEntries(
        ((profileRows || []) as Profile[]).map((profile) => [profile.user_id, profile.name || 'Customer'])
      )
    }

    const openChats = allConversationStatuses.filter((item) => item.status === 'open').length
    const pendingChats = allConversationStatuses.filter((item) => item.status === 'pending').length
    const activeProducts = allProductStatuses.filter((item) => item.status === 'active').length
    const hiddenProducts = allProductStatuses.filter((item) => item.status === 'hidden').length
    const pendingOrders = allOrders.filter((item) =>
      ['pending', 'confirmed', 'processing'].includes(item.status)
    ).length
    const paidOrders = allOrders.filter((item) => item.payment_status === 'paid').length
    const monthlyRevenue = monthOrders
      .filter((item) => item.payment_status === 'paid')
      .reduce((total, item) => total + Number(item.total_amount_lkr || 0), 0)

    setStats({
      newInquiries: inquiriesRes.count || 0,
      openChats,
      pendingChats,
      totalChats: allConversationStatuses.length,
      activeProducts,
      hiddenProducts,
      totalOrders: allOrders.length,
      pendingOrders,
      paidOrders,
      totalUsers: usersRes.count || 0,
      monthlyRevenue,
    })
    setRecentConversations(conversationRows as RecentConversation[])
    setRecentInquiries(inquiryRows as RecentInquiry[])
    setProfiles(profileMap)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadDashboard)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const backlogLabel = useMemo(() => {
    const backlog = stats.newInquiries + stats.openChats + stats.pendingChats + stats.pendingOrders
    if (backlog === 0) return 'No active backlog'
    if (backlog <= 5) return 'Light backlog'
    if (backlog <= 12) return 'Manageable backlog'
    return 'High backlog'
  }, [stats])

  const formatCustomer = (userId: string) => profiles[userId] || `User ${userId.slice(0, 8)}`

  return (
    <div className="space-y-8 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Operations Pulse</p>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-emerald-100/80">
              Monitor support load, catalog visibility, order flow, and recent customer activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-300/50 text-emerald-100">
              {backlogLabel}
            </Badge>
            <Button
              variant="outline"
              onClick={loadDashboard}
              disabled={loading}
              className="border-emerald-200/50 text-emerald-50 hover:bg-white/10"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="New inquiries" value={stats.newInquiries} detail="Need first response" icon={FileText} />
        <MetricCard title="Live chat queue" value={stats.openChats + stats.pendingChats} detail={`${stats.openChats} open, ${stats.pendingChats} pending`} icon={MessageSquare} />
        <MetricCard title="Orders in progress" value={stats.pendingOrders} detail={`${stats.totalOrders} total orders`} icon={ShoppingCart} />
        <MetricCard title="Paid this month" value={`LKR ${stats.monthlyRevenue.toLocaleString()}`} detail={`${stats.paidOrders} paid orders`} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base text-white">Store health</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <HealthTile label="Customers" value={stats.totalUsers} note="Profiles registered" />
            <HealthTile label="Products live" value={stats.activeProducts} note={`${stats.hiddenProducts} hidden`} />
            <HealthTile label="Total chats" value={stats.totalChats} note="Conversation records" />
            <HealthTile label="Order completion" value={stats.totalOrders === 0 ? '0%' : `${Math.round(((stats.totalOrders - stats.pendingOrders) / stats.totalOrders) * 100)}%`} note="Completed or resolved orders" />
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-white">Priority actions</CardTitle>
            <ArrowRight className="h-4 w-4 text-emerald-300" />
          </CardHeader>
          <CardContent className="space-y-3">
            <PriorityRow
              title="Support inbox"
              value={`${stats.newInquiries} new`}
              href="/admin/inquiries"
              accent={stats.newInquiries > 0 ? 'text-amber-300' : 'text-emerald-300'}
            />
            <PriorityRow
              title="Live chat queue"
              value={`${stats.openChats + stats.pendingChats} waiting`}
              href="/admin/chat"
              accent={stats.openChats + stats.pendingChats > 0 ? 'text-amber-300' : 'text-emerald-300'}
            />
            <PriorityRow
              title="Product visibility"
              value={`${stats.hiddenProducts} hidden`}
              href="/admin/products"
              accent={stats.hiddenProducts > 0 ? 'text-sky-300' : 'text-emerald-300'}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-white">Recent chats</CardTitle>
            <Link href="/admin/chat" className="text-xs text-emerald-200 hover:text-white">
              Open chat
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentConversations.length === 0 && <EmptyState text="No live chats yet." />}
            {recentConversations.map((conversation) => (
              <div key={conversation.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{formatCustomer(conversation.user_id)}</p>
                  <Badge variant="outline" className="border-emerald-300/50 text-emerald-100 capitalize">
                    {conversation.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-emerald-100/65">
                  Updated {new Date(conversation.last_message_at || conversation.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-white">Recent inquiries</CardTitle>
            <Link href="/admin/inquiries" className="text-xs text-emerald-200 hover:text-white">
              Open inbox
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInquiries.length === 0 && <EmptyState text="No inquiries yet." />}
            {recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{inquiry.subject || 'General inquiry'}</p>
                  <Badge variant="outline" className="border-emerald-300/50 text-emerald-100 capitalize">
                    {inquiry.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-emerald-100/65">
                  {formatCustomer(inquiry.user_id)} | {new Date(inquiry.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: number | string
  detail: string
  icon: typeof FileText
}) {
  return (
    <Card className="border border-emerald-900/60 bg-white/5 shadow-lg shadow-emerald-950/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-emerald-50">{title}</CardTitle>
        <Icon className="h-4 w-4 text-emerald-300/80" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="mt-1 text-xs text-emerald-100/65">{detail}</p>
      </CardContent>
    </Card>
  )
}

function HealthTile({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-100/65">{note}</p>
    </div>
  )
}

function PriorityRow({
  title,
  value,
  href,
  accent,
}: {
  title: string
  value: string
  href: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-emerald-900/60 bg-white/5 px-4 py-3 transition hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-emerald-800/70 bg-emerald-500/10 p-2">
          <UserRound className="h-4 w-4 text-emerald-200" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className={`text-xs ${accent}`}>{value}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-emerald-300" />
    </Link>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-emerald-100/65">{text}</p>
}
