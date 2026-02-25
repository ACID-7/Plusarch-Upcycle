"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Save } from 'lucide-react'

type SettingKey =
  | 'email'
  | 'whatsapp_number'
  | 'whatsapp_prefill_message'
  | 'ai_quick_replies'
  | 'social_links'
  | 'business_hours'
  | 'lkr_to_usd_rate'
  | 'usd_to_lkr_rate'
  | 'mission'
  | 'upcycling_process'
  | 'materials_sustainability'
  | 'environmental_impact'

type SettingField = {
  key: SettingKey
  label: string
  type: 'text' | 'textarea'
  section: 'contact' | 'commerce' | 'brand'
  description?: string
  placeholder?: string
  rows?: number
}

const FIELDS: SettingField[] = [
  {
    key: 'email',
    label: 'Contact email',
    type: 'text',
    section: 'contact',
    description: 'Shown in footer and contact areas.',
    placeholder: 'plusarch.lk@gmail.com',
  },
  {
    key: 'whatsapp_number',
    label: 'WhatsApp number',
    type: 'text',
    section: 'contact',
    description: 'Use international format, digits only or with +.',
    placeholder: '94774442642',
  },
  {
    key: 'whatsapp_prefill_message',
    label: 'WhatsApp prefilled message',
    type: 'text',
    section: 'contact',
    description: 'Default message used when users open WhatsApp support.',
    placeholder: 'Hi Plus Arch, I need help with an order.',
  },
  {
    key: 'social_links',
    label: 'Social links (JSON)',
    type: 'textarea',
    section: 'contact',
    description: 'Keys: instagram, facebook, youtube.',
    placeholder:
      '{\n  "instagram": "https://instagram.com/yourpage",\n  "facebook": "https://facebook.com/yourpage",\n  "youtube": "https://youtube.com/@yourpage"\n}',
    rows: 5,
  },
  {
    key: 'business_hours',
    label: 'Business hours',
    type: 'text',
    section: 'commerce',
    description: 'Used in customer-facing support information.',
    placeholder: 'Mon-Sat 9:00 AM - 6:00 PM',
  },
  {
    key: 'lkr_to_usd_rate',
    label: 'LKR to USD rate',
    type: 'text',
    section: 'commerce',
    description: 'Numeric value only.',
    placeholder: '0.0033',
  },
  {
    key: 'usd_to_lkr_rate',
    label: 'USD to LKR rate',
    type: 'text',
    section: 'commerce',
    description: 'Numeric value only.',
    placeholder: '300',
  },
  {
    key: 'ai_quick_replies',
    label: 'AI quick replies (JSON array)',
    type: 'textarea',
    section: 'commerce',
    description: 'List the quick chips users tap in AI chat.',
    placeholder:
      '[\n  "Shipping options",\n  "Returns & exchanges",\n  "Care instructions",\n  "Product availability",\n  "Contact support"\n]',
    rows: 4,
  },
  {
    key: 'mission',
    label: 'Mission',
    type: 'textarea',
    section: 'brand',
    description: 'Short brand mission statement.',
    rows: 4,
  },
  {
    key: 'upcycling_process',
    label: 'Upcycling process',
    type: 'textarea',
    section: 'brand',
    description: 'Explain how products are made.',
    rows: 4,
  },
  {
    key: 'materials_sustainability',
    label: 'Materials and sustainability',
    type: 'textarea',
    section: 'brand',
    description: 'Describe sustainable materials and sourcing.',
    rows: 4,
  },
  {
    key: 'environmental_impact',
    label: 'Environmental impact',
    type: 'textarea',
    section: 'brand',
    description: 'Impact claims and measurable outcomes.',
    rows: 4,
  },
]

const DEFAULT_VALUES: Record<SettingKey, string> = {
  email: '',
  whatsapp_number: '',
  whatsapp_prefill_message: '',
  ai_quick_replies: '',
  social_links: '',
  business_hours: '',
  lkr_to_usd_rate: '',
  usd_to_lkr_rate: '',
  mission: '',
  upcycling_process: '',
  materials_sustainability: '',
  environmental_impact: '',
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [values, setValues] = useState<Record<SettingKey, string>>(DEFAULT_VALUES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', FIELDS.map((f) => f.key))

    const map: Record<SettingKey, string> = { ...DEFAULT_VALUES }
    data?.forEach((row) => {
      if (row.key === 'social_links') {
        map.social_links = JSON.stringify(row.value ?? {}, null, 2)
      } else if (row.key === 'ai_quick_replies') {
        map.ai_quick_replies = JSON.stringify(row.value ?? [], null, 2)
      } else if (typeof row.value === 'string') {
        map[row.key as SettingKey] = row.value.replace(/"/g, '')
      } else {
        map[row.key as SettingKey] = String(row.value ?? '')
      }
    })

    setValues(map)
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)

    let parsedSocialLinks: Record<string, unknown> = {}
    let parsedQuickReplies: string[] = []

    try {
      parsedSocialLinks = values.social_links ? JSON.parse(values.social_links) : {}
      if (typeof parsedSocialLinks !== 'object' || Array.isArray(parsedSocialLinks)) {
        throw new Error('Social links must be a JSON object.')
      }
    } catch {
      setSaving(false)
      toast({ title: 'Invalid social links', description: 'Please enter a valid JSON object.', variant: 'destructive' })
      return
    }

    try {
      const parsed = values.ai_quick_replies ? JSON.parse(values.ai_quick_replies) : []
      if (!Array.isArray(parsed)) throw new Error('AI quick replies must be an array.')
      parsedQuickReplies = parsed.map((item) => String(item))
    } catch {
      setSaving(false)
      toast({ title: 'Invalid AI quick replies', description: 'Please enter a valid JSON array.', variant: 'destructive' })
      return
    }

    const rows = Object.entries(values).map(([key, value]) => {
      if (key === 'social_links') return { key, value: parsedSocialLinks }
      if (key === 'ai_quick_replies') return { key, value: parsedQuickReplies }
      return { key, value: value.trim() }
    })

    const { error } = await supabase.from('site_settings').upsert(rows)
    setSaving(false)

    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Settings saved' })
  }

  const renderField = (field: SettingField) => (
    <div key={field.key} className="space-y-2">
      <label className="text-sm text-emerald-100/90">{field.label}</label>
      {field.description && <p className="text-xs text-emerald-200/70">{field.description}</p>}
      {field.type === 'text' ? (
        <Input
          value={values[field.key]}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
          className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
          placeholder={field.placeholder}
        />
      ) : (
        <Textarea
          value={values[field.key]}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
          className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
          placeholder={field.placeholder}
          rows={field.rows || 3}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Configuration</p>
          <h1 className="text-3xl font-bold text-white">Site Settings</h1>
          <p className="text-sm text-emerald-100/80">Update contact details, store values, and brand content.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-900/50 bg-white/5 px-4 py-3 text-xs text-emerald-100/80 space-y-2">
        <p>
          How to use: edit values, then press <span className="font-semibold text-emerald-200">Save</span>. Use
          <span className="font-semibold text-emerald-200"> Reload</span> to discard unsaved changes.
        </p>
        <p className="text-emerald-100/70">
          JSON fields in this page: <span className="font-semibold text-emerald-200">Social links (JSON)</span> and
          <span className="font-semibold text-emerald-200"> AI quick replies (JSON array)</span>.
        </p>
        <p className="text-emerald-100/70">
          JSON rule: use double quotes for keys/text, keep commas between items, and do not leave trailing commas.
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-900/60 bg-black/20 p-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">Valid Social links JSON</p>
            <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed text-emerald-100/85">{`{
  "instagram": "https://instagram.com/plusarch_upcycle",
  "facebook": "https://facebook.com/plusarchupcycle",
  "youtube": "https://youtube.com/@plusarch"
}`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-900/60 bg-black/20 p-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">Valid AI quick replies JSON array</p>
            <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed text-emerald-100/85">{`[
  "Shipping options",
  "Returns and exchanges",
  "Care instructions"
]`}</pre>
          </div>
        </div>
      </div>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Contact and Social</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{FIELDS.filter((field) => field.section === 'contact').map(renderField)}</CardContent>
      </Card>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Store and AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{FIELDS.filter((field) => field.section === 'commerce').map(renderField)}</CardContent>
      </Card>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Brand Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{FIELDS.filter((field) => field.section === 'brand').map(renderField)}</CardContent>
      </Card>
    </div>
  )
}
