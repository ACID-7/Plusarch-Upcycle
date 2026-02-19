"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Plus, Search } from 'lucide-react'

interface CategoryRow {
  id: string
  name: string
  slug: string
}

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function AdminCategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data || []) as CategoryRow[])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    setSaving(true)
    const baseSlug = toSlug(name)
    const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), slug })
      .select()
      .single()
    setSaving(false)
    if (error) {
      toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      return
    }
    setCategories(prev => [...prev, data as CategoryRow].sort((a, b) => a.name.localeCompare(b.name)))
    setName('')
    toast({ title: 'Category added' })
  }

  const startEdit = (category: CategoryRow) => {
    setEditingId(category.id)
    setEditName(category.name)
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    const baseSlug = toSlug(editName)
    const current = categories.find(category => category.id === editingId)
    const slug = current?.slug || `${baseSlug}-${Date.now().toString().slice(-5)}`

    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), slug: baseSlug || slug })
      .eq('id', editingId)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    setCategories(prev =>
      prev
        .map(category =>
          category.id === editingId ? { ...category, name: editName.trim(), slug: baseSlug || category.slug } : category
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    )
    setEditingId(null)
    setEditName('')
    toast({ title: 'Category updated' })
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    setCategories(prev => prev.filter(category => category.id !== id))
    toast({ title: 'Category deleted' })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return categories.filter(category => !q || category.name.toLowerCase().includes(q) || category.slug.includes(q))
  }, [categories, search])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Catalog</p>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-sm text-emerald-100/80">Create, update, and delete product categories.</p>
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
            Add category
          </CardTitle>
          <div className="flex gap-3 flex-col md:flex-row">
            <Input
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
            />
            <Button onClick={handleAdd} disabled={saving} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories"
              className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
            />
          </div>
          {loading && <p className="text-sm text-emerald-100/70">Loading...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-emerald-100/70">No categories yet.</p>
          )}
          {!loading &&
            filtered.map((category) => (
              <div key={category.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 space-y-3">
                {editingId === category.id ? (
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/5 border-emerald-900/60 text-white"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{category.name}</p>
                      <p className="text-sm text-emerald-100/70">/{category.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => startEdit(category)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-400/60 text-red-300 hover:bg-red-500/10" onClick={() => remove(category.id)}>
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
