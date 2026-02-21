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

const FIELDS: { key: SettingKey; label: string; type: 'text' | 'textarea' }[] = [
  { key: 'email', label: 'Contact email', type: 'text' },
  { key: 'whatsapp_number', label: 'WhatsApp number', type: 'text' },
  { key: 'whatsapp_prefill_message', label: 'WhatsApp prefilled message', type: 'text' },
  { key: 'ai_quick_replies', label: 'AI quick replies JSON array', type: 'textarea' },
  { key: 'social_links', label: 'Social links JSON (instagram/facebook/youtube)', type: 'textarea' },
  { key: 'business_hours', label: 'Business hours', type: 'text' },
  { key: 'lkr_to_usd_rate', label: 'LKR to USD rate', type: 'text' },
  { key: 'usd_to_lkr_rate', label: 'USD to LKR rate', type: 'text' },
  { key: 'mission', label: 'Mission', type: 'textarea' },
  { key: 'upcycling_process', label: 'Upcycling process', type: 'textarea' },
  { key: 'materials_sustainability', label: 'Materials & sustainability', type: 'textarea' },
  { key: 'environmental_impact', label: 'Environmental impact', type: 'textarea' },
]

const AI_FIELD: { key: SettingKey; label: string; type: 'textarea' } = {
  key: 'ai_quick_replies',
  label: 'AI quick replies JSON array',
  type: 'textarea',
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [values, setValues] = useState<Record<SettingKey, string>>({
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
  })
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
      .in('key', FIELDS.map(f => f.key))

    const map: Record<SettingKey, string> = {
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
    data?.forEach(row => {
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
    const rows = Object.entries(values).map(([key, value]) => {
      if (key === 'social_links') {
        try {
          return { key, value: value ? JSON.parse(value) : {} }
        } catch {
          return { key, value: {} }
        }
      }
      if (key === 'ai_quick_replies') {
        try {
          const parsed = value ? JSON.parse(value) : []
          return { key, value: Array.isArray(parsed) ? parsed : [] }
        } catch {
          return { key, value: [] }
        }
      }
      return { key, value }
    })
    const { error } = await supabase.from('site_settings').upsert(rows)
    setSaving(false)
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Settings saved' })
    }
  }

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Configuration</p>
          <h1 className="text-3xl font-bold text-white">Site Settings</h1>
          <p className="text-sm text-emerald-100/80">Update common content, contact points, and currency rate.</p>
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

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">AI Assistant Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-emerald-100/80">
            Edit the quick suggestion chips shown in AI chat. Use a JSON array of strings.
          </p>
          <div className="space-y-2">
            <label className="text-sm text-emerald-100/80">{AI_FIELD.label}</label>
            <Textarea
              value={values[AI_FIELD.key]}
              onChange={(e) => setValues({ ...values, [AI_FIELD.key]: e.target.value })}
              className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
              placeholder={'[\n  "Shipping options",\n  "Returns & exchanges",\n  "Care instructions",\n  "Product availability",\n  "Contact support"\n]'}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Content blocks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.filter((field) => field.key !== 'ai_quick_replies').map(field => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm text-emerald-100/80">{field.label}</label>
              {field.type === 'text' ? (
                <Input
                  value={values[field.key]}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                />
              ) : (
                <Textarea
                  value={values[field.key]}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                  placeholder={
                    field.key === 'social_links'
                      ? '{\n  "instagram": "https://instagram.com/yourpage",\n  "facebook": "https://facebook.com/yourpage",\n  "youtube": "https://youtube.com/@yourpage"\n}'
                      : ''
                  }
                  rows={3}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
