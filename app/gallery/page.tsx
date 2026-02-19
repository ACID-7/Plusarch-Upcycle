"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

interface GalleryItem {
  id: string
  path: string
  caption: string | null
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchGallery() {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!error && data) {
        setItems(data)
      }
      setLoading(false)
    }

    fetchGallery()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-10 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-emerald-500/15 border border-emerald-300/40 flex items-center justify-center text-emerald-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Gallery</p>
                <h1 className="text-3xl font-bold text-white">Works in circulation</h1>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse h-64 rounded-2xl bg-emerald-900/20 border border-emerald-900/40"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 space-y-10">
      <div className="max-w-5xl mx-auto rounded-3xl border border-emerald-900/60 bg-gradient-to-r from-[rgba(8,18,13,0.9)] via-[rgba(9,26,18,0.92)] to-[rgba(8,18,13,0.9)] shadow-2xl shadow-emerald-950/40 p-10">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-300/40 flex items-center justify-center text-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Gallery</p>
            <h1 className="text-4xl font-bold text-white">Pieces we love sending around the world</h1>
            <p className="text-emerald-100/80">
              A living archive of one-off commissions, small batch drops, and customer favorites.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="group cursor-pointer rounded-2xl border border-emerald-900/60 overflow-hidden bg-white/5 shadow-emerald-950/30 shadow-lg">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={item.path}
                alt={item.caption || 'Gallery item'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            {item.caption && (
              <p className="text-sm text-emerald-50/80 text-center px-4 py-3">
                {item.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No gallery items available at the moment.</p>
        </div>
      )}
    </div>
  )
}
