"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, Instagram, Clock, Globe2, MessageCircle, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { toast } from '@/hooks/use-toast'

type Settings = {
  whatsapp_number: string
  email: string
  social_links: Record<string, string>
  business_hours: string
}

function normalizeExternalUrl(input: string) {
  const value = input.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('@')) return `https://instagram.com/${value.slice(1)}`
  if (/^[\w.]+$/.test(value)) return `https://instagram.com/${value.replace(/^@/, '')}`
  return `https://${value}`
}

export default function ContactPage() {
  const INQUIRY_COOLDOWN_SECONDS = 180
  const supabase = createClient()
  const { user } = useAuth()

  const [settings, setSettings] = useState<Settings>({
    whatsapp_number: '',
    email: '',
    social_links: {},
    business_hours: '',
  })

  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [submittingCustom, setSubmittingCustom] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [inquiryCooldownRemaining, setInquiryCooldownRemaining] = useState(0)

  const [inquiry, setInquiry] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [customOrder, setCustomOrder] = useState({
    fullName: '',
    email: '',
    phone: '',
    style: '',
    colors: '',
    budgetRange: '',
    deadline: '',
    notes: '',
    referenceImageUrl: '',
  })

  useEffect(() => {
    async function fetchSettings() {
      const keys = ['whatsapp_number', 'email', 'social_links', 'business_hours']
      const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
      if (!data) return

      const next: Settings = {
        whatsapp_number: '',
        email: '',
        social_links: {},
        business_hours: '',
      }

      for (const row of data) {
        try {
          const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
          if (row.key === 'social_links' && typeof parsed === 'object' && parsed !== null) {
            next.social_links = parsed as Record<string, string>
          } else if (typeof parsed === 'string') {
            ;(next as any)[row.key] = parsed
          } else if (typeof row.value === 'string') {
            ;(next as any)[row.key] = row.value.replace(/"/g, '')
          }
        } catch {
          if (typeof row.value === 'string') {
            ;(next as any)[row.key] = row.value.replace(/"/g, '')
          }
        }
      }

      setSettings(next)
    }

    async function hydrateProfile() {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('user_id', user.id)
        .maybeSingle()

      const name = data?.name || ''
      const phone = data?.phone || ''
      const email = user.email || ''

      setInquiry(prev => ({ ...prev, fullName: name, phone, email }))
      setCustomOrder(prev => ({ ...prev, fullName: name, phone, email }))
    }

    async function hydrateInquiryCooldown() {
      if (!user) {
        setInquiryCooldownRemaining(0)
        return
      }

      const { data } = await supabase
        .from('inquiries')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data?.created_at) {
        setInquiryCooldownRemaining(0)
        return
      }

      const elapsed = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000)
      const remaining = Math.max(0, INQUIRY_COOLDOWN_SECONDS - elapsed)
      setInquiryCooldownRemaining(remaining)
    }

    fetchSettings()
    hydrateProfile()
    hydrateInquiryCooldown()
  }, [supabase, user])

  useEffect(() => {
    if (inquiryCooldownRemaining <= 0) return
    const timer = window.setInterval(() => {
      setInquiryCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [inquiryCooldownRemaining])

  const getCooldownText = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return `${minutes}:${remainder.toString().padStart(2, '0')}`
  }

  const handleWhatsAppClick = () => {
    const number = settings.whatsapp_number.replace(/\D/g, '')
    if (!number) {
      toast({
        title: 'WhatsApp unavailable',
        description: 'WhatsApp contact is not configured yet.',
        variant: 'destructive',
      })
      return
    }
    window.open(`https://wa.me/${number}`, '_blank')
  }

  const handleEmailClick = () => {
    if (!settings.email) {
      toast({
        title: 'Email unavailable',
        description: 'Support email is not configured yet.',
        variant: 'destructive',
      })
      return
    }
    window.open(`mailto:${settings.email}`, '_blank')
  }

  const handleInstagramClick = () => {
    const instagram = normalizeExternalUrl(settings.social_links?.instagram || '')
    if (!instagram) {
      toast({
        title: 'Instagram unavailable',
        description: 'Instagram profile is not configured yet.',
        variant: 'destructive',
      })
      return
    }
    window.open(instagram, '_blank', 'noopener,noreferrer')
  }

  const uploadReferenceImage = async (file: File) => {
    if (!user) return null
    setUploadingImage(true)
    const safeName = file.name.replace(/\s+/g, '-').toLowerCase()
    const path = `${user.id}/${Date.now()}-${safeName}`

    const { error } = await supabase.storage
      .from('custom-order-images')
      .upload(path, file, { upsert: false })
    setUploadingImage(false)

    if (error) {
      toast({
        title: 'Image upload failed',
        description: 'You can still submit using an image URL.',
        variant: 'destructive',
      })
      return null
    }

    const { data } = supabase.storage.from('custom-order-images').getPublicUrl(path)
    return data.publicUrl
  }

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (inquiryCooldownRemaining > 0) {
      toast({
        title: 'Please wait before sending again',
        description: `You can submit another inquiry in ${getCooldownText(inquiryCooldownRemaining)}.`,
      })
      return
    }

    setSubmittingInquiry(true)
    const formattedMessage = [
      `Name: ${inquiry.fullName}`,
      `Email: ${inquiry.email}`,
      inquiry.phone ? `Phone: ${inquiry.phone}` : null,
      '',
      inquiry.message,
    ].filter(Boolean).join('\n')

    const payload = {
      user_id: user.id,
      subject: inquiry.subject.trim(),
      message: formattedMessage.trim(),
      status: 'new',
    }

    let { error } = await supabase.from('inquiries').insert(payload)
    if (error?.message?.toLowerCase().includes('subject')) {
      // Backward-compat for environments where subject column is missing.
      const fallbackMessage = `Subject: ${inquiry.subject.trim()}\n${formattedMessage.trim()}`
      const fallback = await supabase.from('inquiries').insert({
        user_id: user.id,
        message: fallbackMessage,
        status: 'new',
      })
      error = fallback.error
    }
    setSubmittingInquiry(false)

    if (error) {
      toast({ title: 'Inquiry failed', description: error.message, variant: 'destructive' })
      return
    }

    let notifyFailed = false
    const notifyResponse = await fetch('/api/inquiries/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: inquiry.fullName,
        email: inquiry.email,
        phone: inquiry.phone,
        subject: inquiry.subject.trim() || 'General inquiry',
        message: inquiry.message.trim(),
        userId: user.id,
        createdAt: new Date().toISOString(),
      }),
    })
    if (!notifyResponse.ok) {
      notifyFailed = true
      const notifyPayload = await notifyResponse.json().catch(() => ({ error: 'Notification failed.' }))
      console.warn('Inquiry email notification failed:', notifyPayload?.error)
    }

    setInquiry(prev => ({ ...prev, subject: '', message: '' }))
    setInquiryCooldownRemaining(INQUIRY_COOLDOWN_SECONDS)
    toast({
      title: 'Inquiry submitted',
      description: notifyFailed
        ? 'Saved successfully, but admin email notification is not configured yet.'
        : 'We will reply soon.',
    })
  }

  const submitCustomOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmittingCustom(true)
    const notesWithContact = [
      `Name: ${customOrder.fullName}`,
      `Email: ${customOrder.email}`,
      customOrder.phone ? `Phone: ${customOrder.phone}` : null,
      '',
      customOrder.notes,
    ].filter(Boolean).join('\n')

    const primaryPayload = {
      user_id: user.id,
      style: customOrder.style.trim() || null,
      colors: customOrder.colors.trim() || null,
      budget_range: customOrder.budgetRange.trim() || null,
      deadline: customOrder.deadline || null,
      notes: notesWithContact.trim() || null,
      status: 'new' as const,
    }

    let { data: created, error } = await supabase
      .from('custom_orders')
      .insert(primaryPayload)
      .select('id')
      .single()

    if (error) {
      const fallback = await supabase
        .from('custom_orders')
        .insert({
          user_id: user.id,
          notes: notesWithContact.trim() || null,
        })
        .select('id')
        .single()

      created = fallback.data
      error = fallback.error
    }

    if (error || !created) {
      setSubmittingCustom(false)
      toast({ title: 'Custom order failed', description: error?.message || 'Please try again.', variant: 'destructive' })
      return
    }

    if (customOrder.referenceImageUrl.trim()) {
      await supabase.from('custom_order_images').insert({
        custom_order_id: created.id,
        path: customOrder.referenceImageUrl.trim(),
      })
    }

    setSubmittingCustom(false)
    setCustomOrder(prev => ({
      ...prev,
      style: '',
      colors: '',
      budgetRange: '',
      deadline: '',
      notes: '',
      referenceImageUrl: '',
    }))
    toast({ title: 'Custom order submitted', description: 'Thanks. We will contact you with next steps.' })
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 space-y-8 md:space-y-10">
      <div className="rounded-3xl border border-emerald-900/60 bg-gradient-to-r from-[rgba(8,18,13,0.9)] via-[rgba(9,26,18,0.92)] to-[rgba(8,18,13,0.9)] shadow-2xl shadow-emerald-950/40 p-6 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Talk to us</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white">Concierge for custom, care, and rapid updates.</h1>
            <p className="text-emerald-100/80 text-base md:text-lg max-w-3xl">
              Reach our team online for material options, sizing help, and shipping guidance for your country.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Globe2, label: 'Islandwide support' },
                { icon: Clock, label: settings.business_hours || 'Mon-Sat, 9am-10pm GMT+5:30' },
                { icon: MessageCircle, label: 'Live chat & WhatsApp' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-white/5 px-3 py-1 text-xs text-emerald-100/80"
                >
                  <chip.icon className="w-4 h-4" />
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-emerald-900/50 bg-[rgba(255,255,255,0.04)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Phone className="h-5 w-5" />
              WhatsApp
            </CardTitle>
            <CardDescription className="text-emerald-100/70">
              Fastest for orders, sizing, and shipping updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleWhatsAppClick} className="w-full" disabled={!settings.whatsapp_number}>
              Chat on WhatsApp
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/50 bg-[rgba(255,255,255,0.04)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
            <CardDescription className="text-emerald-100/70">
              Perfect for design briefs and detailed requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleEmailClick} className="w-full" disabled={!settings.email}>
              Send Email
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-emerald-900/50 bg-[rgba(255,255,255,0.04)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Instagram className="h-5 w-5" />
              Social
            </CardTitle>
            <CardDescription className="text-emerald-100/70">
              See new drops, workshops, and maker stories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleInstagramClick}
              className="w-full"
              disabled={!settings.social_links?.instagram}
            >
              Follow on Instagram
            </Button>
          </CardContent>
        </Card>
      </div>

      {!user && (
        <Card className="border border-emerald-900/50 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Sign in required for inquiries and custom orders</CardTitle>
            <CardDescription className="text-emerald-100/70">
              To reduce spam and keep conversations trackable, only verified users can submit forms and use live chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button>Sign in with Email OTP</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {user && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border border-emerald-900/50 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Inquiry Form</CardTitle>
              <CardDescription className="text-emerald-100/70">
                Ask about product availability, sizing, shipping, or care.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitInquiry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="inquiry-name">Full name</Label>
                    <Input
                      id="inquiry-name"
                      value={inquiry.fullName}
                      onChange={(e) => setInquiry(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="inquiry-email">Email</Label>
                    <Input
                      id="inquiry-email"
                      type="email"
                      value={inquiry.email}
                      onChange={(e) => setInquiry(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="inquiry-phone">Phone (optional)</Label>
                  <Input
                    id="inquiry-phone"
                    value={inquiry.phone}
                    onChange={(e) => setInquiry(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="inquiry-subject">Subject</Label>
                  <Input
                    id="inquiry-subject"
                    value={inquiry.subject}
                    onChange={(e) => setInquiry(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inquiry-message">Message</Label>
                  <Textarea
                    id="inquiry-message"
                    value={inquiry.message}
                    onChange={(e) => setInquiry(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" disabled={submittingInquiry || inquiryCooldownRemaining > 0}>
                  {submittingInquiry
                    ? 'Submitting...'
                    : inquiryCooldownRemaining > 0
                      ? `Wait ${getCooldownText(inquiryCooldownRemaining)}`
                      : 'Submit Inquiry'}
                </Button>
                {inquiryCooldownRemaining > 0 && (
                  <p className="text-xs text-emerald-100/70">
                    Anti-spam protection is active. You can send a new inquiry after the timer ends.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="border border-emerald-900/50 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Custom Order Request</CardTitle>
              <CardDescription className="text-emerald-100/70">
                Share style preferences, budget, deadline, and reference image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCustomOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="custom-name">Full name</Label>
                    <Input
                      id="custom-name"
                      value={customOrder.fullName}
                      onChange={(e) => setCustomOrder(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-email">Email</Label>
                    <Input
                      id="custom-email"
                      type="email"
                      value={customOrder.email}
                      onChange={(e) => setCustomOrder(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="custom-phone">Phone (optional)</Label>
                  <Input
                    id="custom-phone"
                    value={customOrder.phone}
                    onChange={(e) => setCustomOrder(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="custom-style">Style</Label>
                    <Input
                      id="custom-style"
                      value={customOrder.style}
                      onChange={(e) => setCustomOrder(prev => ({ ...prev, style: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-colors">Colors</Label>
                    <Input
                      id="custom-colors"
                      value={customOrder.colors}
                      onChange={(e) => setCustomOrder(prev => ({ ...prev, colors: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="custom-budget">Budget range</Label>
                    <Input
                      id="custom-budget"
                      value={customOrder.budgetRange}
                      onChange={(e) => setCustomOrder(prev => ({ ...prev, budgetRange: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-deadline">Target deadline</Label>
                    <Input
                      id="custom-deadline"
                      type="date"
                      value={customOrder.deadline}
                      onChange={(e) => setCustomOrder(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="custom-notes">Requirements</Label>
                  <Textarea
                    id="custom-notes"
                    value={customOrder.notes}
                    onChange={(e) => setCustomOrder(prev => ({ ...prev, notes: e.target.value }))}
                    rows={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-image-url">Reference image URL (optional)</Label>
                  <Input
                    id="custom-image-url"
                    value={customOrder.referenceImageUrl}
                    onChange={(e) => setCustomOrder(prev => ({ ...prev, referenceImageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                  <div>
                    <Label htmlFor="custom-upload" className="mb-1 block">Or upload image</Label>
                    <Input
                      id="custom-upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const url = await uploadReferenceImage(file)
                        if (url) {
                          setCustomOrder(prev => ({ ...prev, referenceImageUrl: url }))
                          toast({ title: 'Image uploaded', description: 'Reference image attached.' })
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-emerald-100/70 inline-flex items-center gap-2">
                    <Upload className="w-3 h-3" />
                    {uploadingImage ? 'Uploading image...' : 'Upload is optional.'}
                  </p>
                </div>
                <Button type="submit" disabled={submittingCustom || uploadingImage}>
                  {submittingCustom ? 'Submitting...' : 'Submit Custom Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
