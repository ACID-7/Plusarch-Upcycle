"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Clock, MessageSquare, RefreshCw, Search, User } from 'lucide-react'

type ConversationStatus = 'open' | 'pending' | 'closed'

interface Conversation {
  id: string
  user_id: string
  status: ConversationStatus
  created_at: string
}

interface Message {
  id: string
  sender_type: 'user' | 'ai' | 'admin'
  body: string
  created_at: string
}

interface Profile {
  user_id: string
  name: string
  phone: string | null
}

interface ConversationWithProfile extends Conversation {
  name?: string
  phone?: string | null
}

const statusStyles: Record<ConversationStatus, string> = {
  open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function AdminChatPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState<ConversationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  )

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesFilter = filter === 'all' || conversation.status === filter
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        conversation.id.toLowerCase().includes(query) ||
        conversation.user_id.toLowerCase().includes(query) ||
        conversation.name?.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [conversations, filter, search])

  const fetchConversations = async () => {
    setLoading(true)
    const { data: convoData } = await supabase
      .from('conversations')
      .select('id, user_id, status, created_at')
      .order('created_at', { ascending: false })

    const conversationsList = (convoData || []) as Conversation[]
    const userIds = conversationsList.map((conversation) => conversation.user_id)

    let profiles: Profile[] = []
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, name, phone')
        .in('user_id', userIds)

      profiles = (profileData || []) as Profile[]
    }

    const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]))
    const withProfiles = conversationsList.map((conversation) => {
      const profile = profileMap.get(conversation.user_id)
      return {
        ...conversation,
        name: profile?.name,
        phone: profile?.phone ?? null,
      }
    })

    setConversations(withProfiles)
    if (!selectedId && withProfiles.length > 0) {
      setSelectedId(withProfiles[0].id)
    }
    setLoading(false)
  }

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    setMessages((data || []) as Message[])
  }

  const handleStatusChange = async (status: ConversationStatus) => {
    if (!selectedId) return

    await supabase
      .from('conversations')
      .update({ status })
      .eq('id', selectedId)

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedId ? { ...conversation, status } : conversation
      )
    )
  }

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedId) return
    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedId,
        sender_type: 'admin',
        body: reply,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message])
      setReply('')
    }

    setSending(false)
  }

  const useSuggestedReply = () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.sender_type === 'user')
    const suggestion = lastUserMessage
      ? `Thanks for your message about "${lastUserMessage.body.slice(0, 60)}". We're reviewing it now and will update you shortly.`
      : 'Thank you for reaching out. We received your message and will get back to you shortly.'
    setReply(suggestion)
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    fetchMessages(selectedId)
  }, [selectedId])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Service Desk</p>
          <h1 className="text-3xl font-bold text-white">Live Chat Center</h1>
          <p className="text-sm text-emerald-100/80">
            Manage customer conversations, update statuses, and respond in real time.
          </p>
        </div>
        <Button variant="outline" onClick={fetchConversations} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or ID..."
                className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'open', 'pending', 'closed'] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filter === status ? 'default' : 'outline'}
                  onClick={() => setFilter(status)}
                  className={filter === status ? 'bg-emerald-500 text-slate-950' : 'border-emerald-800/60 text-emerald-100'}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[320px] md:max-h-[540px] overflow-y-auto">
            {loading && <p className="text-sm text-emerald-100/70">Loading conversations...</p>}
            {!loading && filteredConversations.length === 0 && (
              <p className="text-sm text-emerald-100/70">No conversations found.</p>
            )}
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition',
                  selectedId === conversation.id
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-inner shadow-emerald-900/30'
                    : 'border-emerald-900/40 bg-white/5 hover:bg-white/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {conversation.name || 'Guest Customer'}
                    </p>
                    <p className="text-xs text-emerald-100/70">
                      {conversation.phone || conversation.user_id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge className={cn('border', statusStyles[conversation.status])}>
                    {conversation.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(conversation.created_at).toLocaleString()}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
          <CardHeader className="border-b border-emerald-900/60">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-300" />
                  Conversation
                </CardTitle>
                <p className="text-xs text-emerald-100/70 mt-1">
                  {selectedConversation
                    ? `Chat with ${selectedConversation.name || 'Guest Customer'}`
                    : 'Select a conversation to view messages.'}
                </p>
              </div>
              {selectedConversation && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('pending')} className="border-emerald-800/60 text-emerald-100">
                    Mark Pending
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('closed')} className="border-emerald-800/60 text-emerald-100">
                    Close
                  </Button>
                  <Button size="sm" variant="outline" className="border-emerald-800/60 text-emerald-100" onClick={useSuggestedReply}>
                    Suggest reply
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-[60vh] md:h-[560px]">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {!selectedConversation && (
                <div className="h-full flex flex-col items-center justify-center text-center text-emerald-100/70">
                  <User className="h-8 w-8 mb-3 text-emerald-200" />
                  <p className="text-sm">Select a conversation to start replying.</p>
                </div>
              )}
              {selectedConversation && messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-emerald-100/70">
                  <MessageSquare className="h-8 w-8 mb-3 text-emerald-200" />
                  <p className="text-sm">No messages yet in this conversation.</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                      message.sender_type === 'admin'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/10 border border-emerald-900/60 text-emerald-50'
                    )}
                  >
                    <p>{message.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-emerald-900/60 pt-4">
              <div className="flex gap-2">
                <Input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a reply..."
                  disabled={!selectedConversation || sending}
                  onKeyPress={(event) => event.key === 'Enter' && handleSendReply()}
                  className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!selectedConversation || sending || !reply.trim()}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

