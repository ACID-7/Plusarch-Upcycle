"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Plus, Search } from 'lucide-react'

interface FAQRow {
  id: string
  question: string
  answer: string
  sort_order: number
}

export default function AdminFaqsPage() {
  const supabase = createClient()
  const [faqs, setFaqs] = useState<FAQRow[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true })
    setFaqs((data || []) as FAQRow[])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: 'Question and answer required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('faqs')
      .insert({ question: question.trim(), answer: answer.trim(), sort_order: faqs.length + 1 })
      .select()
      .single()
    setSaving(false)
    if (error) {
      toast({ title: 'Add failed', description: error.message, variant: 'destructive' })
      return
    }
    setFaqs(prev => [...prev, data as FAQRow])
    setQuestion('')
    setAnswer('')
    toast({ title: 'FAQ added' })
  }

  const startEdit = (faq: FAQRow) => {
    setEditingId(faq.id)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
  }

  const saveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return
    const { error } = await supabase
      .from('faqs')
      .update({ question: editQuestion.trim(), answer: editAnswer.trim() })
      .eq('id', editingId)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    setFaqs(prev =>
      prev.map(faq =>
        faq.id === editingId ? { ...faq, question: editQuestion.trim(), answer: editAnswer.trim() } : faq
      )
    )
    setEditingId(null)
    toast({ title: 'FAQ updated' })
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    setFaqs(prev => prev.filter(faq => faq.id !== id))
    toast({ title: 'FAQ deleted' })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return faqs.filter(
      faq => !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q)
    )
  }, [faqs, search])

  return (
    <div className="space-y-6 text-emerald-50">
      <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-6 shadow-emerald-950/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Content</p>
          <h1 className="text-3xl font-bold text-white">FAQs</h1>
          <p className="text-sm text-emerald-100/80">Create, update, and delete FAQs.</p>
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
            Add FAQ
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
            />
            <Textarea
              placeholder="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
              rows={3}
            />
            <div className="md:col-span-2">
              <Button onClick={handleAdd} disabled={saving} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                {saving ? 'Saving...' : 'Add FAQ'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs"
              className="pl-9 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
            />
          </div>
          {loading && <p className="text-sm text-emerald-100/70">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="text-sm text-emerald-100/70">No FAQs yet.</p>}

          {!loading &&
            filtered.map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-emerald-900/60 bg-white/5 p-4 space-y-3">
                {editingId === faq.id ? (
                  <>
                    <Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} className="bg-white/5 border-emerald-900/60 text-white" />
                    <Textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} rows={4} className="bg-white/5 border-emerald-900/60 text-white" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Save</Button>
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{faq.question}</p>
                      <p className="text-sm text-emerald-100/80 mt-1">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-200/50 text-emerald-50" onClick={() => startEdit(faq)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-400/60 text-red-300 hover:bg-red-500/10" onClick={() => remove(faq.id)}>
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
