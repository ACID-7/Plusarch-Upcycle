"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Search, Tag, Image as ImageIcon, Info } from 'lucide-react'

interface ProductRow {
  id: string
  name: string
  slug: string
  description?: string | null
  materials?: string | null
  care?: string | null
  price_lkr: number
  status: 'active' | 'hidden'
  category_id: string | null
  is_featured: boolean
  product_images?: { path: string; sort_order?: number | null }[]
}

interface CategoryRow {
  id: string
  name: string
}

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function AdminProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<ProductRow>>({})
  const [draft, setDraft] = useState<Partial<ProductRow>>({
    name: '',
    description: '',
    materials: '',
    care: '',
    price_lkr: 0,
    status: 'active',
    category_id: null,
    is_featured: false,
  })
  const [draftImages, setDraftImages] = useState<Array<{ path: string; sort_order?: number }>>([{ path: '', sort_order: 0 }])
  const [imageInputs, setImageInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: productData }, { data: categoryData }] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, description, materials, care, price_lkr, status, category_id, is_featured, product_images(path, sort_order)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
    ])
    setProducts((productData || []) as ProductRow[])
    setCategories((categoryData || []) as CategoryRow[])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!draft.name || !draft.price_lkr) {
      toast({ title: 'Name and price required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const slug = `${toSlug(draft.name)}-${Date.now().toString().slice(-6)}`
    const { error, data } = await supabase
      .from('products')
      .insert({
        name: draft.name.trim(),
        slug,
        description: draft.description || null,
        materials: draft.materials || null,
        care: draft.care || null,
        price_lkr: draft.price_lkr,
        status: draft.status || 'active',
        category_id: draft.category_id,
        is_featured: !!draft.is_featured,
      })
      .select()
      .single()
    setSaving(false)
    if (error) {
      toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      return
    }
    const newProduct = data as ProductRow
    const imagesToSave = draftImages.filter(img => img.path.trim())
    if (imagesToSave.length) {
      await supabase
        .from('product_images')
        .insert(imagesToSave.map(img => ({ ...img, product_id: newProduct.id })))
      newProduct.product_images = imagesToSave
    }
    setProducts(prev => [newProduct, ...prev])
    setDraft({
      name: '',
      description: '',
      materials: '',
      care: '',
      price_lkr: 0,
      status: 'active',
      category_id: null,
      is_featured: false,
    })
    setDraftImages([{ path: '', sort_order: 0 }])
    toast({ title: 'Product created' })
  }

  const startEdit = (product: ProductRow) => {
    setEditingId(product.id)
    setEditDraft({
      name: product.name,
      description: product.description || '',
      materials: product.materials || '',
      care: product.care || '',
      price_lkr: product.price_lkr,
      status: product.status,
      category_id: product.category_id,
      is_featured: product.is_featured,
    })
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft.name || !editDraft.price_lkr) return
    const payload = {
      name: editDraft.name.trim(),
      description: editDraft.description || null,
      materials: editDraft.materials || null,
      care: editDraft.care || null,
      price_lkr: editDraft.price_lkr,
      status: editDraft.status || 'active',
      category_id: editDraft.category_id || null,
      is_featured: !!editDraft.is_featured,
    }

    const { error } = await supabase.from('products').update(payload).eq('id', editingId)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    setProducts(prev => prev.map(product => (product.id === editingId ? { ...product, ...payload } as ProductRow : product)))
    setEditingId(null)
    toast({ title: 'Product updated' })
  }

  const remove = async (id: string) => {
    await supabase.from('product_images').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    setProducts(prev => prev.filter(product => product.id !== id))
    toast({ title: 'Product deleted' })
  }

  const handleStatusToggle = async (id: string, status: 'active' | 'hidden') => {
    const { error } = await supabase.from('products').update({ status }).eq('id', id)
    if (error) {
      toast({ title: 'Status update failed', description: error.message, variant: 'destructive' })
      return
    }
    setProducts(prev => prev.map(product => (product.id === id ? { ...product, status } : product)))
  }

  const removeImage = async (productId: string, path: string) => {
    const { error } = await supabase.from('product_images').delete().eq('product_id', productId).eq('path', path)
    if (error) {
      toast({ title: 'Image remove failed', description: error.message, variant: 'destructive' })
      return
    }
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, product_images: (product.product_images || []).filter(img => img.path !== path) }
          : product
      )
    )
    toast({ title: 'Image removed' })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(
      product =>
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q)
    )
  }, [products, search])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Catalog</p>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-sm text-emerald-100/80">Create, update, and delete products.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border border-emerald-900/60 bg-white/5 shadow-emerald-950/30 shadow-lg">
        <CardHeader className="space-y-4">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add product
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Input placeholder="Name" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="md:col-span-2 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
            <Input placeholder="Price LKR" type="number" value={draft.price_lkr || ''} onChange={(e) => setDraft({ ...draft, price_lkr: Number(e.target.value) })} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
            <Select value={draft.category_id || 'none'} onValueChange={(val) => setDraft({ ...draft, category_id: val === 'none' ? null : val })}>
              <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={draft.status || 'active'} onValueChange={(val: 'active' | 'hidden') => setDraft({ ...draft, status: val })}>
              <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={saving} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">{saving ? 'Saving...' : 'Create'}</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Textarea placeholder="Description" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" rows={3} />
            <Textarea placeholder="Materials" value={draft.materials || ''} onChange={(e) => setDraft({ ...draft, materials: e.target.value })} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" rows={3} />
            <Textarea placeholder="Care" value={draft.care || ''} onChange={(e) => setDraft({ ...draft, care: e.target.value })} className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" rows={3} />
          </div>

          <div className="flex items-center gap-2">
            <input id="featured" type="checkbox" checked={!!draft.is_featured} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })} />
            <label htmlFor="featured" className="text-sm text-emerald-100/80">Mark as featured</label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-100/80">
              <Info className="h-4 w-4" /> Photos (display order follows sort)
            </div>
            {draftImages.map((img, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <Input
                  placeholder="Image URL"
                  value={img.path}
                  onChange={(e) => {
                    const next = [...draftImages]
                    next[idx].path = e.target.value
                    setDraftImages(next)
                  }}
                  className="md:col-span-5 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                />
                <Input
                  type="number"
                  placeholder="Sort"
                  value={img.sort_order ?? 0}
                  onChange={(e) => {
                    const next = [...draftImages]
                    next[idx].sort_order = Number(e.target.value)
                    setDraftImages(next)
                  }}
                  className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                />
              </div>
            ))}
            <Button type="button" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => setDraftImages(prev => [...prev, { path: '', sort_order: prev.length }])}>
              Add another photo
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60" />
          </div>

          {loading && <p className="text-sm text-emerald-100/70">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="text-sm text-emerald-100/70">No products yet.</p>}

          {!loading &&
            filtered.map((product) => (
              <div key={product.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 space-y-3">
                {editingId === product.id ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                      <Input value={editDraft.name || ''} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="md:col-span-2 bg-white/5 border-emerald-900/60 text-white" />
                      <Input type="number" value={editDraft.price_lkr || ''} onChange={(e) => setEditDraft({ ...editDraft, price_lkr: Number(e.target.value) })} className="bg-white/5 border-emerald-900/60 text-white" />
                      <Select value={(editDraft.category_id as string) || 'none'} onValueChange={(val) => setEditDraft({ ...editDraft, category_id: val === 'none' ? null : val })}>
                        <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={(editDraft.status as 'active' | 'hidden') || 'active'} onValueChange={(val: 'active' | 'hidden') => setEditDraft({ ...editDraft, status: val })}>
                        <SelectTrigger className="bg-white/5 border-emerald-900/60 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 text-sm text-emerald-100/80">
                        <input type="checkbox" checked={!!editDraft.is_featured} onChange={(e) => setEditDraft({ ...editDraft, is_featured: e.target.checked })} />
                        Featured
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Textarea value={editDraft.description || ''} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} className="bg-white/5 border-emerald-900/60 text-white" rows={3} />
                      <Textarea value={editDraft.materials || ''} onChange={(e) => setEditDraft({ ...editDraft, materials: e.target.value })} className="bg-white/5 border-emerald-900/60 text-white" rows={3} />
                      <Textarea value={editDraft.care || ''} onChange={(e) => setEditDraft({ ...editDraft, care: e.target.value })} className="bg-white/5 border-emerald-900/60 text-white" rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Save</Button>
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-sm text-emerald-100/70">/{product.slug}</p>
                        <p className="text-sm text-emerald-100/70 flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-emerald-300/60 text-emerald-50 capitalize">{product.status}</Badge>
                        {product.is_featured && <Badge variant="outline" className="border-emerald-300/60 text-emerald-50">Featured</Badge>}
                        <span className="text-white">LKR {product.price_lkr.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => startEdit(product)}>Edit</Button>
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => handleStatusToggle(product.id, product.status === 'active' ? 'hidden' : 'active')}>
                        {product.status === 'active' ? 'Hide' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-400/60 text-red-300 hover:bg-red-500/10" onClick={() => remove(product.id)}>Delete</Button>
                    </div>

                    {(product.product_images || []).length > 0 && (
                      <div className="space-y-2">
                        {(product.product_images || []).map((image) => (
                          <div key={`${product.id}-${image.path}`} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-900/50 px-3 py-2">
                            <span className="text-xs text-emerald-100/70 break-all inline-flex items-center gap-1"><ImageIcon className="h-4 w-4" />{image.path}</span>
                            <Button size="sm" variant="outline" className="border-red-400/60 text-red-300 hover:bg-red-500/10" onClick={() => removeImage(product.id, image.path)}>Remove image</Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Add image URL"
                        value={imageInputs[product.id] || ''}
                        onChange={(e) => setImageInputs({ ...imageInputs, [product.id]: e.target.value })}
                        className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const url = imageInputs[product.id]
                          if (!url) return
                          const sortOrder = (product.product_images?.length || 0)
                          const { error } = await supabase.from('product_images').insert({ product_id: product.id, path: url, sort_order: sortOrder })
                          if (error) {
                            toast({ title: 'Add image failed', description: error.message, variant: 'destructive' })
                            return
                          }
                          setProducts(prev =>
                            prev.map(p => (p.id === product.id ? { ...p, product_images: [...(p.product_images || []), { path: url, sort_order: sortOrder }] } : p))
                          )
                          setImageInputs({ ...imageInputs, [product.id]: '' })
                          toast({ title: 'Image added' })
                        }}
                        className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      >
                        Save photo
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
