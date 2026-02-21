"use client"

import { useEffect, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, MessageCircle, Sparkles } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchFAQs() {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!error && data) {
        setFaqs(data)
      }
      setLoading(false)
    }

    fetchFAQs()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-emerald-900/60 bg-white/5 p-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-emerald-500/15 border border-emerald-300/40 flex items-center justify-center text-emerald-200">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">FAQ</p>
                <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-emerald-900/20 border border-emerald-900/40 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 space-y-10">
      <div className="max-w-3xl mx-auto rounded-3xl border border-emerald-900/60 bg-gradient-to-r from-[rgba(8,18,13,0.9)] via-[rgba(9,26,18,0.92)] to-[rgba(8,18,13,0.9)] shadow-2xl shadow-emerald-950/40 p-10">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-300/40 flex items-center justify-center text-emerald-200">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Need clarity?</p>
            <h1 className="text-4xl font-bold text-white">Frequently Asked Questions</h1>
            <p className="text-emerald-100/80">
              Answers for international customers, materials, sizing, and our upcycle process. If you still need help, start a live chat.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-emerald-800/60 px-3 py-1 text-xs text-emerald-100/80">
                <Sparkles className="w-4 h-4" />
                Sustainable materials
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-emerald-800/60 px-3 py-1 text-xs text-emerald-100/80">
                <MessageCircle className="w-4 h-4" />
                Live specialist support
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto rounded-3xl border border-emerald-900/60 bg-white/5 p-8 shadow-2xl shadow-emerald-950/30">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b border-emerald-900/40">
              <AccordionTrigger className="text-left text-white">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-emerald-50/80">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {faqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No FAQs available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
