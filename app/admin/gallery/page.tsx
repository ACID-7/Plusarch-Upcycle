"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Plus, Search, Image as ImageIcon } from 'lucide-react'

interface GalleryItem {
  id: string
  path: string
  caption: string | null
  sort_order: number
}

export default function AdminGalleryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [path, setPath] = useState('')
  const [caption, setCaption] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPath, setEditPath] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editSortOrder, setEditSortOrder] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('gallery_items').select('*').order('sort_order', { ascending: true })
    setItems((data || []) as GalleryItem[])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!path.trim()) {
      toast({ title: 'Image path required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const order = Number(sortOrder || items.length + 1)
    const { data, error } = await supabase
      .from('gallery_items')
      .insert({ path: path.trim(), caption: caption.trim() || null, sort_order: order })
      .select()
      .single()
    setSaving(false)
    if (error) {
      toast({ title: 'Add failed', description: error.message, variant: 'destructive' })
      return
    }
    setItems(prev => [...prev, data as GalleryItem].sort((a, b) => a.sort_order - b.sort_order))
    setPath('')
    setCaption('')
    setSortOrder('')
    toast({ title: 'Gallery item added' })
  }

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id)
    setEditPath(item.path)
    setEditCaption(item.caption || '')
    setEditSortOrder(String(item.sort_order))
  }

  const saveEdit = async () => {
    if (!editingId || !editPath.trim()) return
    const payload = {
      path: editPath.trim(),
      caption: editCaption.trim() || null,
      sort_order: Number(editSortOrder || 0),
    }
    const { error } = await supabase.from('gallery_items').update(payload).eq('id', editingId)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    setItems(prev =>
      prev
        .map(item => (item.id === editingId ? { ...item, ...payload } : item))
        .sort((a, b) => a.sort_order - b.sort_order)
    )
    setEditingId(null)
    toast({ title: 'Gallery item updated' })
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('gallery_items').delete().eq('id', id)
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    setItems(prev => prev.filter(item => item.id !== id))
    toast({ title: 'Deleted' })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => !q || (item.caption || '').toLowerCase().includes(q) || item.path.toLowerCase().includes(q))
  }, [items, search])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Content</p>
          <h1 className="text-3xl font-bold text-white">Gallery</h1>
          <p className="text-sm text-emerald-100/80">Create, update, and delete gallery items.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader className="space-y-4">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add gallery item
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Image URL / path" value={path} onChange={(e) => setPath(e.target.value)} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
            <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
            <Input placeholder="Sort order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
            <Button onClick={handleAdd} disabled={saving} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">{saving ? 'Saving...' : 'Add'}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search caption or path" className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
          </div>
          {loading && <p className="text-sm text-emerald-100/70">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="text-sm text-emerald-100/70">No items yet.</p>}
          {!loading &&
            filtered.map((item) => (
              <div key={item.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 space-y-3">
                {editingId === item.id ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input value={editPath} onChange={(e) => setEditPath(e.target.value)} className="bg-white/5 border-emerald-900/60 text-white" />
                      <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="bg-white/5 border-emerald-900/60 text-white" />
                      <Input value={editSortOrder} onChange={(e) => setEditSortOrder(e.target.value)} type="number" className="bg-white/5 border-emerald-900/60 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Save</Button>
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/15 border border-emerald-300/30 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-emerald-200" />
                      </div>
                      <div>
                        <p className="text-white">{item.caption || 'No caption'}</p>
                        <p className="text-xs text-emerald-100/70 break-all">{item.path}</p>
                        <p className="text-xs text-emerald-100/70">Sort: {item.sort_order}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-400/60 text-red-300 hover:bg-red-500/10" onClick={() => remove(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
