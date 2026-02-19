"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Facebook, Instagram, Mail, MessageCircle, Phone, Youtube } from 'lucide-react'

type SocialLinks = {
  instagram?: string
  facebook?: string
  youtube?: string
}

function ensureExternalUrl(input: string) {
  const value = input.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('@')) return `https://instagram.com/${value.slice(1)}`
  return `https://${value}`
}

function cleanJsonValue(value: unknown) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export function Footer() {
  const supabase = createClient()
  const [email, setEmail] = useState('hello@plusarch.com')
  const [whatsappNumber, setWhatsappNumber] = useState('94712345678')
  const [whatsappMessage, setWhatsappMessage] = useState('Hi Plus Arch, I need help with an order.')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: 'https://www.instagram.com/plusarch_upcycle/',
    facebook: 'https://facebook.com/plusarchupcycle',
  })

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['email', 'whatsapp_number', 'social_links', 'whatsapp_prefill_message'])

      for (const row of data || []) {
        if (row.key === 'email') {
          const parsed = cleanJsonValue(row.value)
          if (typeof parsed === 'string' && parsed.trim()) setEmail(parsed.replace(/"/g, '').trim())
        }

        if (row.key === 'whatsapp_number') {
          const parsed = cleanJsonValue(row.value)
          const cleaned = String(parsed ?? '').replace(/\D/g, '')
          if (cleaned) setWhatsappNumber(cleaned)
        }

        if (row.key === 'whatsapp_prefill_message') {
          const parsed = cleanJsonValue(row.value)
          if (typeof parsed === 'string' && parsed.trim()) setWhatsappMessage(parsed.trim())
        }

        if (row.key === 'social_links') {
          const parsed = cleanJsonValue(row.value)
          if (parsed && typeof parsed === 'object') {
            setSocialLinks((prev) => ({ ...prev, ...(parsed as SocialLinks) }))
          }
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const whatsappHref = useMemo(
    () => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
    [whatsappMessage, whatsappNumber]
  )

  const socials = [
    { label: 'Instagram', href: ensureExternalUrl(socialLinks.instagram || ''), icon: Instagram },
    { label: 'Facebook', href: ensureExternalUrl(socialLinks.facebook || ''), icon: Facebook },
    { label: 'YouTube', href: ensureExternalUrl(socialLinks.youtube || ''), icon: Youtube },
  ].filter((item) => !!item.href)

  return (
    <footer className="border-t border-emerald-900/60 bg-gradient-to-b from-[rgba(7,16,12,0.95)] to-black">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-emerald-700/50">
                <Image
                  src="https://jcapynmebqoehrcscxiq.supabase.co/storage/v1/object/public/Images/logo%20plus%20arch.jpeg"
                  alt="Plus Arch"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Plus Arch</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Upcycled Accessories</p>
              </div>
            </div>
            <p className="text-sm text-emerald-100/75">
              Sustainable handmade accessories with a focus on quality, repairability, and timeless design.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="/catalog" className="text-emerald-100/80 hover:text-emerald-300">Catalog</Link>
              <Link href="/gallery" className="text-emerald-100/80 hover:text-emerald-300">Gallery</Link>
              <Link href="/faq" className="text-emerald-100/80 hover:text-emerald-300">FAQ</Link>
              <Link href="/contact" className="text-emerald-100/80 hover:text-emerald-300">Contact</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Connect</h4>
            <div className="space-y-2 text-sm">
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-emerald-100/80 hover:text-emerald-300">
                <Mail className="h-4 w-4" />
                {email}
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-700/60 bg-emerald-500/10 px-3 py-1.5 text-emerald-100 hover:border-emerald-400/70 hover:text-emerald-200"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp support
              </a>
              <p className="inline-flex items-center gap-2 text-emerald-100/70">
                <Phone className="h-4 w-4" />
                +94 11 123 4567
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-800/70 bg-white/5 text-emerald-100/80 hover:border-emerald-500/70 hover:text-emerald-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-emerald-900/60 pt-5 text-xs text-emerald-100/65 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Plus Arch. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-emerald-300">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-300">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
