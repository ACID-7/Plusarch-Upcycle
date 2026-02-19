"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, X, Sparkles, SendHorizonal } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

interface Message {
  id: string
  sender_type: 'user' | 'ai' | 'admin'
  body: string
  created_at: string
}

interface Conversation {
  id: string
  status: 'open' | 'pending' | 'closed'
}

interface OpenChatDetail {
  mode?: 'ai' | 'person' | 'live'
  prefill?: string
}

const DEFAULT_AI_QUICK_REPLIES = [
  'Shipping options',
  'Returns & exchanges',
  'Care instructions',
  'Custom orders',
  'Contact support',
]

export function ChatWidget() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [chatMode, setChatMode] = useState<'live' | 'ai'>('live')
  const [aiMessages, setAiMessages] = useState<Message[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiQuickReplies, setAiQuickReplies] = useState<string[]>(DEFAULT_AI_QUICK_REPLIES)
  const [statusNote, setStatusNote] = useState('You are connected to a live specialist.')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const quickReplies = ['Order details', 'Custom design request', 'Shipping info', 'Care instructions']

  const supabase = createClient()

  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<OpenChatDetail>) => {
      const mode = event.detail?.mode === 'ai' ? 'ai' : 'live'
      const prefill = event.detail?.prefill?.trim()
      setChatMode(mode)
      setStatusNote(
        mode === 'ai'
          ? 'AI assistant is ready. Verify final order details in live chat or WhatsApp.'
          : user
            ? 'You are connected to a live specialist.'
            : 'Sign in to start live chat with a specialist.'
      )
      if (prefill) setNewMessage(prefill)
      setIsOpen(true)
    }

    document.addEventListener('openChat', handleOpenChat as EventListener)

    return () => {
      document.removeEventListener('openChat', handleOpenChat as EventListener)
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiMessages, aiLoading])

  useEffect(() => {
    if (!isOpen || !user || chatMode !== 'live') return
    initializeChat()
  }, [isOpen, user, chatMode])

  useEffect(() => {
    if (!user) return
    loadAiQuickReplies()
  }, [user?.id])

  useEffect(() => {
    if (!conversation) return

    const channel = supabase
      .channel(`chat-messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages((prev) => {
            if (prev.some((item) => item.id === incoming.id)) return prev
            return [...prev, incoming]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation?.id])

  const initializeChat = async () => {
    if (!user) return

    setStatusNote('Connecting you with a live specialist...')
    // Find or create live chat conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .single()

    if (existingConv) {
      setConversation(existingConv)
      loadMessages(existingConv.id)
      setStatusNote('You are connected. Ask us anything.')
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (!error && newConv) {
        setConversation(newConv)
        setMessages([])
        setStatusNote('Say hello! A specialist will join shortly.')
      }
    }
  }

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  const loadAiQuickReplies = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ai_quick_replies')
      .maybeSingle()

    const raw = data?.value
    if (!raw) {
      setAiQuickReplies(DEFAULT_AI_QUICK_REPLIES)
      return
    }

    let parsed: unknown = raw
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = raw
      }
    }

    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
        .slice(0, 8)
      setAiQuickReplies(cleaned.length > 0 ? cleaned : DEFAULT_AI_QUICK_REPLIES)
      return
    }

    if (typeof parsed === 'string') {
      const cleaned = parsed
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 8)
      setAiQuickReplies(cleaned.length > 0 ? cleaned : DEFAULT_AI_QUICK_REPLIES)
      return
    }

    setAiQuickReplies(DEFAULT_AI_QUICK_REPLIES)
  }

  const sendMessage = async (messageOverride?: string) => {
    const messageToSend = (messageOverride ?? newMessage).trim()
    if (!messageToSend || !user) return

    if (chatMode === 'ai') {
      await sendAiMessage(messageToSend)
      return
    }

    setLoading(true)

    if (conversation) {
      // Send live chat message
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'user',
          body: messageToSend,
        })

      if (!error) {
        setStatusNote('We will reply shortly. Keep this window open for updates.')
        setNewMessage('')
      }
    }

    setLoading(false)
  }

  const sendAiMessage = async (messageToSend: string) => {
    const now = new Date().toISOString()
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender_type: 'user',
      body: messageToSend,
      created_at: now,
    }

    setAiMessages((prev) => [...prev, userMessage])
    setNewMessage('')
    setAiLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string' && payload.error.trim()
            ? payload.error
            : 'AI request failed.'
        )
      }

      const body =
        typeof payload?.response === 'string' && payload.response.trim()
          ? payload.response
          : 'I could not generate a response right now. Please try again.'

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender_type: 'ai',
        body,
        created_at: new Date().toISOString(),
      }
      setAiMessages((prev) => [...prev, aiMessage])
    } catch {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender_type: 'ai',
        body: 'I hit a temporary issue while responding. Please try again in a moment.',
        created_at: new Date().toISOString(),
      }
      setAiMessages((prev) => [...prev, aiMessage])
    } finally {
      setAiLoading(false)
    }
  }

  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6"
        animate={{ y: isOpen ? -8 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.div
          className={`absolute inset-0 rounded-full blur-md ${isOpen ? 'bg-emerald-300/40' : 'bg-emerald-500/30'}`}
          animate={{ scale: isOpen ? 1.15 : [1, 1.1, 1] }}
          transition={isOpen ? { duration: 0.3 } : { duration: 2, repeat: Infinity }}
        />
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={`relative rounded-full h-14 w-14 p-0 border transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-r from-emerald-300 to-green-400 text-slate-950 border-emerald-100 shadow-2xl shadow-emerald-500/40'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-300/50 shadow-lg hover:shadow-xl'
          }`}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-24 right-2 z-50 w-[calc(100vw-1rem)] sm:right-6 sm:w-[440px] h-[78vh] sm:h-[680px] max-h-[78vh] sm:max-h-[760px]"
          >
            <Card className="h-full flex flex-col overflow-hidden border border-emerald-800/60 shadow-2xl shadow-black/50 bg-gradient-to-b from-[rgba(7,17,12,0.97)] via-[rgba(9,20,14,0.95)] to-[rgba(6,14,10,0.98)]">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3 border-b border-emerald-900/70 bg-white/5 backdrop-blur-xl">
                <motion.div
                  className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {chatMode === 'live' ? 'Live Chat' : 'AI Assistant'}
                  </CardTitle>
                  <p className="text-xs text-emerald-100/80 mt-1">{statusNote}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-emerald-900/50 bg-white/5 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChatMode('live')
                      setStatusNote('You are connected to a live specialist.')
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      chatMode === 'live'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-emerald-100/85 hover:bg-white/10'
                    }`}
                  >
                    Live Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatMode('ai')
                      setStatusNote('AI assistant is ready. Verify final order details in live chat or WhatsApp.')
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      chatMode === 'ai'
                        ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/40'
                        : 'text-emerald-100/75 hover:bg-white/10'
                    }`}
                  >
                    AI Chat
                  </button>
                </div>

                {chatMode === 'live' ? (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setNewMessage(reply)}
                          className="rounded-full border border-emerald-800/70 bg-white/5 px-3 py-1 text-[11px] text-emerald-100/90 hover:bg-emerald-500/15 hover:border-emerald-500/70 transition"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>

                    {user ? (
                      <>
                        {/* Messages */}
                        <div className="chat-scrollbar mb-3 min-h-0 flex-1 overflow-y-auto space-y-2 px-1">
                          {messages.length === 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-xl border border-emerald-900/50 bg-white/5 p-3 shadow-sm text-emerald-50/80"
                            >
                              <p className="text-sm font-medium text-white">Start a live chat with our team.</p>
                              <p className="text-xs text-emerald-100/70 mt-1">
                                We reply during business hours and can continue over WhatsApp if needed.
                              </p>
                            </motion.div>
                          )}
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${
                                message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[94%] rounded-2xl px-4 py-2 text-sm leading-snug break-words shadow-sm ${
                                  message.sender_type === 'user'
                                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950'
                                    : 'ml-1 border border-emerald-800/60 bg-white/10 text-emerald-50'
                                }`}
                              >
                                {message.body}
                              </div>
                            </motion.div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </>
                    ) : (
                      <div className="mb-3 flex min-h-0 flex-1 items-center justify-center rounded-xl border border-emerald-900/50 bg-white/5 p-4 text-center">
                        <div>
                          <p className="text-sm font-medium text-white">Sign in required for live chat.</p>
                          <p className="mt-1 text-xs text-emerald-100/70">You can still use AI chat without signing in.</p>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-3 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            onClick={() => {
                              window.location.href = `/auth/login?next=${encodeURIComponent(pathname || '/')}`
                            }}
                          >
                            Sign In
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Message Input */}
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={loading || !user}
                        className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                      />
                      <Button
                        onClick={() => sendMessage()}
                        disabled={loading || !newMessage.trim() || !user}
                        className="bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 hover:from-emerald-300 hover:to-green-400"
                      >
                        <SendHorizonal className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-3 rounded-xl border border-emerald-900/50 bg-white/5 p-3 text-xs text-emerald-100/85">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <Sparkles className="h-4 w-4" />
                        <span>Ask about products, materials, care, and shipping basics.</span>
                      </div>
                    </div>

                    <div className="chat-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
                      {aiQuickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => sendMessage(reply)}
                          disabled={aiLoading}
                          className="shrink-0 rounded-full border border-emerald-800/70 bg-white/5 px-3 py-1 text-[11px] text-emerald-100/90 hover:bg-emerald-500/15 hover:border-emerald-500/70 transition disabled:opacity-50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>

                    <div className="chat-scrollbar mb-3 min-h-0 flex-1 overflow-y-auto space-y-2 px-1">
                      {aiMessages.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-emerald-900/50 bg-white/5 p-3 shadow-sm text-emerald-50/80"
                        >
                          <p className="text-sm font-medium text-white">Ask the AI assistant anything about Plus Arch.</p>
                          <p className="text-xs text-emerald-100/70 mt-1">
                            Final availability and order details should still be confirmed in live chat or WhatsApp.
                          </p>
                        </motion.div>
                      )}
                      {aiMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[94%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-snug break-words shadow-sm ${
                              message.sender_type === 'user'
                                ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950'
                                : 'ml-1 border border-emerald-800/60 bg-white/10 text-emerald-50'
                            }`}
                          >
                            {message.body}
                          </div>
                        </motion.div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="ml-1 rounded-2xl border border-emerald-800/60 bg-white/10 px-4 py-2 text-sm text-emerald-100/80">
                            Thinking...
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask the AI assistant..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={aiLoading}
                        className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                      />
                      <Button
                        onClick={() => sendMessage()}
                        disabled={aiLoading || !newMessage.trim()}
                        className="bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 hover:from-emerald-300 hover:to-green-400"
                      >
                        <SendHorizonal className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
