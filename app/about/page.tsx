"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Leaf, Recycle, Globe2, Sparkles } from 'lucide-react'

export default function AboutPage() {
  const [content, setContent] = useState({
    mission: '',
    upcycling_process: '',
    materials_sustainability: '',
    environmental_impact: '',
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchContent() {
      const keys = ['mission', 'upcycling_process', 'materials_sustainability', 'environmental_impact']
      const promises = keys.map(key =>
        supabase
          .from('site_settings')
          .select('value')
          .eq('key', key)
          .single()
      )

      const results = await Promise.all(promises)

      const newContent: any = {}
      results.forEach((result, index) => {
        if (result.data) {
          newContent[keys[index]] = result.data.value.replace(/"/g, '')
        }
      })

      setContent(newContent)
    }

    fetchContent()
  }, [])

  return (
    <div className="container mx-auto px-4 py-16 space-y-12">
      <div className="rounded-3xl border border-emerald-900/60 bg-gradient-to-r from-[rgba(8,18,13,0.9)] via-[rgba(9,26,18,0.92)] to-[rgba(8,18,13,0.9)] shadow-2xl shadow-emerald-950/40 p-10 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Our Story</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Plus Arch is an upcycle atelier for travelers who collect meaningful accessories.
            </h1>
            <p className="text-emerald-100/80 text-lg">
              We blend Sri Lankan craftsmanship with circular design principles to create pieces that can travel anywhere and last for years.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full md:w-72">
            {[
              { label: 'Reclaimed metals', value: '82%', icon: Recycle },
              { label: 'Local artisans', value: '14', icon: Sparkles },
              { label: 'Countries shipped', value: '22', icon: Globe2 },
              { label: 'Avg. CO₂ saved', value: '1.8kg', icon: Leaf },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-emerald-200">
                  <stat.icon className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-wide text-emerald-100/70">{stat.label}</span>
                </div>
                <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[
          { title: 'Our Mission', body: content.mission || 'At Plus Arch, we give materials a second life and build a new aesthetic for circular luxury.' },
          { title: 'Upcycling Process', body: content.upcycling_process || 'We recover metals and textiles, melt, weave, and finish them with low-impact techniques in small batches.' },
          { title: 'Materials & Sustainability', body: content.materials_sustainability || 'We source locally where possible, trace suppliers, and keep everything recyclable or renewable.' },
          { title: 'Environmental Impact', body: content.environmental_impact || 'Choosing upcycled pieces keeps waste out of landfills and reduces the need for virgin mining.' },
        ].map((section) => (
          <div
            key={section.title}
            className="rounded-3xl border border-emerald-900/60 bg-[rgba(255,255,255,0.04)] p-8 shadow-inner shadow-emerald-950/30"
          >
            <h2 className="text-2xl font-semibold text-white mb-3">{section.title}</h2>
            <p className="text-emerald-50/80 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-8 shadow-2xl shadow-emerald-950/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">How we work</p>
            <h3 className="text-3xl font-bold text-white">From discarded to desired</h3>
          </div>
          <div className="text-emerald-100/80 text-sm md:max-w-md">
            Small-batch drops, meticulous finishing, and transparent care guides ensure each piece can be repaired, not replaced.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            'Sourcing & sorting reclaimed metals and textiles',
            'Cleaning, melting, weaving, and forming by hand',
            'Finishing with hypoallergenic, low-tox coatings',
            'Quality checks, recycled packaging, global dispatch',
          ].map((step, index) => (
            <div key={step} className="rounded-2xl border border-emerald-800/60 bg-[rgba(7,16,12,0.7)] p-5 h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-300/40 flex items-center justify-center text-emerald-200 font-semibold">
                  {index + 1}
                </div>
                <span className="text-sm uppercase tracking-wide text-emerald-100/80">Step {index + 1}</span>
              </div>
              <p className="text-emerald-50/80">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
