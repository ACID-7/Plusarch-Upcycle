import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type FaqRow = {
  question: string | null
  answer: string | null
}

type ProductRow = {
  name: string | null
  price_lkr?: number | null
  description: string | null
  materials: string | null
  care: string | null
  categories?: Array<{ name: string | null }> | null
  product_variants?: Array<{
    name: string | null
    value: string | null
    is_available?: boolean | null
    stock_quantity?: number | null
  }> | null
}

type SettingRow = {
  key: string
  value: unknown
}

type Intent =
  | 'greeting'
  | 'shipping'
  | 'returns'
  | 'materials'
  | 'care'
  | 'custom'
  | 'payment'
  | 'order_status'
  | 'contact'
  | 'product'
  | 'unknown'

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(1000),
})

const aiChatRequestSchema = z.object({
  message: z.string().min(1).max(1500),
  history: z.array(historyMessageSchema).max(10).optional().default([]),
})

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null)
    const parsedRequest = aiChatRequestSchema.safeParse(payload)
    if (!parsedRequest.success) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    const normalizedMessage = parsedRequest.data.message.trim()
    const history = parsedRequest.data.history
      .map((item) => ({
        role: item.role,
        content: item.content.trim(),
      }))
      .filter((item) => item.content.length > 0)
      .slice(-10)

    if (!normalizedMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const normalizedLower = normalizedMessage.toLowerCase()
    const keywords = extractKeywords(normalizedLower)
    const primaryIntent = detectIntent(normalizedLower)

    const [faqTextRes, faqLikeRes, productTextRes, productLikeRes, productCatalogRes, settingsRes] = await Promise.all([
      supabase
        .from('faqs')
        .select('question, answer')
        .textSearch('question', normalizedMessage, {
          type: 'websearch',
          config: 'english',
        })
        .limit(3),
      keywords.length > 0
        ? supabase
            .from('faqs')
            .select('question, answer')
            .or(keywords.map((k) => `question.ilike.%${k}%,answer.ilike.%${k}%`).join(','))
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('products')
        .select('name, price_lkr, description, materials, care')
        .textSearch('name', normalizedMessage, {
          type: 'websearch',
          config: 'english',
        })
        .limit(3),
      keywords.length > 0
        ? supabase
            .from('products')
            .select('name, price_lkr, description, materials, care, categories(name), product_variants(name, value, is_available, stock_quantity)')
            .or(
              keywords
                .map(
                  (k) =>
                    `name.ilike.%${k}%,description.ilike.%${k}%,materials.ilike.%${k}%,care.ilike.%${k}%`
                )
                .join(',')
            )
            .eq('status', 'active')
            .limit(6)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('products')
        .select('name, price_lkr, description, materials, care, categories(name), product_variants(name, value, is_available, stock_quantity)')
        .eq('status', 'active')
        .limit(120),
      supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['whatsapp_number', 'email', 'business_hours', 'shipping_policy', 'return_policy']),
    ])

    const faqResults = dedupeFaqs([
      ...((faqTextRes.data as FaqRow[] | null) || []),
      ...((faqLikeRes.data as FaqRow[] | null) || []),
    ])

    const productResults = dedupeProducts([
      ...((productTextRes.data as ProductRow[] | null) || []),
      ...((productLikeRes.data as ProductRow[] | null) || []),
    ])

    const catalogProducts = ((productCatalogRes.data as ProductRow[] | null) || [])
    const catalogMatches = findCatalogMatches(catalogProducts, normalizedLower).slice(0, 5)
    const settingsMap = buildSettingsMap((settingsRes.data as SettingRow[] | null) || [])
    const faqForIntent = pickFaqForIntent(faqResults, primaryIntent, normalizedLower)

    const deterministicResponse = generateDeterministicResponse({
      intent: primaryIntent,
      message: normalizedMessage,
      messageLower: normalizedLower,
      catalogMatches,
      productResults,
      faqForIntent,
      settingsMap,
    })

    if (deterministicResponse) {
      return NextResponse.json({ response: makeConciseAnswer(deterministicResponse) })
    }

    const snippets = [
      ...catalogMatches.map((product) => formatCatalogMatchSnippet(product, normalizedLower)),
      ...faqResults.map((faq) => `FAQ: ${faq.question || ''} - ${faq.answer || ''}`.trim()),
      ...productResults.map(
        (product) =>
          `Product: ${product.name || ''} - ${product.description || ''} Materials: ${product.materials || ''} Care: ${product.care || ''}`.trim()
      ),
    ].filter(Boolean) as string[]
    const rankedSnippets = rankSnippets(snippets, keywords, normalizedLower).slice(0, 8)

    const llmAnswer = await tryLlmAnswer({
      message: normalizedMessage,
      history,
      snippets: rankedSnippets,
    })

    if (llmAnswer) {
      return NextResponse.json({ response: makeConciseAnswer(polishResponseText(llmAnswer)) })
    }

    return NextResponse.json({
      response: makeConciseAnswer(
        'I can help with product details, care, shipping, returns, and contact support. Please ask a specific question.'
      ),
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function extractKeywords(message: string): string[] {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'what',
    'where',
    'when',
    'from',
    'your',
    'about',
    'have',
    'need',
    'want',
    'please',
    'help',
    'how',
    'are',
    'can',
    'you',
    'our',
  ])

  const unique = new Set(
    message
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 3 && !stopWords.has(part))
  )

  return Array.from(unique).slice(0, 8)
}

function rankSnippets(snippets: string[], keywords: string[], messageLower: string): string[] {
  if (snippets.length === 0) return []
  const safeKeywords = keywords.length > 0 ? keywords : extractKeywords(messageLower)

  return [...snippets]
    .map((snippet) => {
      const lower = snippet.toLowerCase()
      const score = safeKeywords.reduce((total, keyword) => {
        return total + (lower.includes(keyword) ? 1 : 0)
      }, 0)
      return { snippet, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.snippet)
}

function findCatalogMatches(products: ProductRow[], messageLower: string): ProductRow[] {
  const keywords = extractKeywords(messageLower)
  if (keywords.length === 0) return []

  return [...products]
    .map((product) => {
      const haystack = [
        product.name || '',
        product.description || '',
        product.materials || '',
        product.care || '',
        ...((product.categories || []).map((category) => category?.name || '')),
        ...((product.product_variants || []).flatMap((variant) => [variant?.name || '', variant?.value || ''])),
      ]
        .join(' ')
        .toLowerCase()

      const score = keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0)
      return { product, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)
}

function formatCatalogMatchSnippet(product: ProductRow, messageLower: string): string {
  const name = product.name?.trim() || 'Unnamed product'
  const category = (product.categories || [])
    .map((item) => item?.name?.trim() || '')
    .find((value) => value.length > 0)
  const matchingVariantValues = (product.product_variants || [])
    .map((variant) => variant?.value?.trim() || '')
    .filter((value) => value.length > 0 && messageLower.includes(value.toLowerCase()))
    .slice(0, 2)

  const categoryPart = category ? ` (${category})` : ''
  const variantPart = matchingVariantValues.length > 0 ? ` Variant: ${matchingVariantValues.join(', ')}.` : ''
  const description = (product.description || '').trim()
  const summary = description ? ` ${description}` : ''

  const pricePart = typeof product.price_lkr === 'number' ? ` Price: LKR ${Math.round(product.price_lkr)}.` : ''
  return `Product match: ${name}${categoryPart}.${summary}${pricePart}${variantPart}`.trim()
}

function buildSettingsMap(rows: SettingRow[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const row of rows) {
    const value = formatSettingValue(row.value)
    if (!value) continue
    map[row.key] = value
  }
  return map
}

function pickFaqForIntent(faqs: FaqRow[], intent: Intent, messageLower: string): FaqRow | null {
  const candidates = faqs.filter((faq) => {
    const q = (faq.question || '').toLowerCase()
    const a = (faq.answer || '').toLowerCase()
    const joined = `${q} ${a}`
    if (intent === 'shipping') return /(shipping|delivery|dispatch|courier|tracking)/.test(joined)
    if (intent === 'returns') return /(return|refund|exchange|replace|cancel)/.test(joined)
    if (intent === 'care') return /(care|clean|maintain|wash|store)/.test(joined)
    if (intent === 'materials') return /(material|metal|allergy|hypoallergenic|sustainab|upcycl)/.test(joined)
    return joined.includes(messageLower)
  })
  if (candidates.length > 0) return candidates[0]
  return faqs[0] || null
}

function generateDeterministicResponse(input: {
  intent: Intent
  message: string
  messageLower: string
  catalogMatches: ProductRow[]
  productResults: ProductRow[]
  faqForIntent: FaqRow | null
  settingsMap: Record<string, string>
}): string | null {
  const { intent, message, messageLower, catalogMatches, productResults, faqForIntent, settingsMap } = input

  if (intent === 'greeting') {
    return 'Hi! I can help with product availability, materials, care, shipping, returns, and contact details.'
  }

  if (intent === 'contact') {
    const bits: string[] = []
    if (settingsMap.whatsapp_number) bits.push(`WhatsApp: ${settingsMap.whatsapp_number}`)
    if (settingsMap.email) bits.push(`Email: ${settingsMap.email}`)
    if (settingsMap.business_hours) bits.push(`Hours: ${settingsMap.business_hours}`)
    if (bits.length > 0) return bits.join(' | ')
    return 'You can contact support via live chat or WhatsApp.'
  }

  if (intent === 'shipping') {
    if (settingsMap.shipping_policy) return settingsMap.shipping_policy
    if (faqForIntent?.answer) return faqForIntent.answer
    return 'Shipping time depends on location and item type. Please confirm exact delivery timing in live chat.'
  }

  if (intent === 'returns') {
    if (settingsMap.return_policy) return settingsMap.return_policy
    if (faqForIntent?.answer) return faqForIntent.answer
    return 'Returns and exchanges depend on item condition and timeline. Please contact live chat for exact eligibility.'
  }

  if (intent === 'materials' || intent === 'care') {
    const top = productResults[0] || catalogMatches[0]
    if (top) {
      if (intent === 'materials' && top.materials) return `${top.name || 'This item'} uses ${top.materials}.`
      if (intent === 'care' && top.care) return `${top.name || 'This item'} care: ${top.care}.`
    }
    if (faqForIntent?.answer) return faqForIntent.answer
    return intent === 'materials'
      ? 'Most pieces use recycled or eco-conscious materials. Ask for a specific product to get exact materials.'
      : 'Care varies by product. Ask with a product name for exact care instructions.'
  }

  if (intent === 'product') {
    const topMatches = catalogMatches.slice(0, 3)
    if (topMatches.length === 0) {
      return `I could not find "${message}" in the current catalog. Try asking for rings, necklaces, bracelets, or earrings.`
    }

    const details = topMatches.map((product) => {
      const name = product.name || 'Unnamed item'
      const category = (product.categories || [])
        .map((item) => item?.name?.trim() || '')
        .find((value) => value.length > 0)
      const price = typeof product.price_lkr === 'number' ? `LKR ${Math.round(product.price_lkr)}` : null
      const parts = [name, category ? `(${category})` : '', price ? `- ${price}` : ''].filter(Boolean)
      return parts.join(' ')
    })
    return `Available matches: ${details.join(', ')}.`
  }

  if (intent === 'order_status') {
    return 'Please share your order reference in live chat so we can check the exact status.'
  }

  if (intent === 'custom') {
    return faqForIntent?.answer || 'Custom requests depend on current availability. Please message live chat with your idea and budget.'
  }

  if (intent === 'payment') {
    return 'Payment confirmation is handled by support. Please use live chat to confirm current payment options.'
  }

  return null
}

async function tryLlmAnswer(input: {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  snippets: string[]
}): Promise<string | null> {
  if (!process.env.AI_PROVIDER_API_KEY || !process.env.AI_PROVIDER_BASE_URL) return null

  const { message, history, snippets } = input

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const llmResponse = await fetch(process.env.AI_PROVIDER_BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_PROVIDER_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.AI_PROVIDER_MODEL || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are Plus Arch customer support AI.
- Reply in max 2 short sentences.
- Be direct and human.
- Answer only the asked question.
- Use context snippets when relevant.
- If uncertain, say what is unknown and ask one short clarifying question.

Context snippets:
${snippets.join('\n\n')}`,
            },
            ...history,
            { role: 'user', content: message },
          ],
          max_tokens: 220,
        }),
      })

      if (!llmResponse.ok) return null
      const data = await llmResponse.json()
      const output = data?.choices?.[0]?.message?.content
      return typeof output === 'string' && output.trim() ? output.trim() : null
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return null
  }
}

function makeConciseAnswer(text: string): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s*([.!?])\s*/g, '$1 ')
    .trim()

  if (!cleaned) return ''

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean)
  const firstTwo = sentences.slice(0, 2).join(' ').trim()
  const source = firstTwo || cleaned
  const words = source.split(' ').filter(Boolean)
  if (words.length <= 45) return source
  return `${words.slice(0, 45).join(' ')}...`
}

function dedupeFaqs(rows: FaqRow[]): FaqRow[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.question || ''}|${row.answer || ''}`.toLowerCase()
    if (!key.trim() || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeProducts(rows: ProductRow[]): ProductRow[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.name || ''}|${row.description || ''}|${row.materials || ''}|${row.care || ''}`.toLowerCase()
    if (!key.trim() || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function formatSettingValue(value: unknown): string {
  if (typeof value === 'string') return value.replace(/"/g, '').trim()
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function getSettingLabel(key: string): string {
  if (key === 'whatsapp_number') return 'WhatsApp'
  if (key === 'email') return 'Email'
  if (key === 'business_hours') return 'Business hours'
  if (key === 'shipping_policy') return 'Shipping policy'
  if (key === 'return_policy') return 'Return policy'
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function polishResponseText(text: string): string {
  return text
    .replace(/^Setting:\s*/gim, '')
    .replace(/_/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanSnippetForDisplay(snippet: string): string {
  return snippet
    .replace(/^FAQ:\s*/i, '')
    .replace(/^Product:\s*/i, '')
    .replace(/^Setting:\s*/i, '')
    .replace(/\bMaterials:\s*/g, ' Materials: ')
    .replace(/\bCare:\s*/g, ' Care: ')
    .replace(/_/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function detectIntent(message: string): Intent {
  if (/(^|\s)(hi|hello|hey|good morning|good evening)(\s|$)/i.test(message)) return 'greeting'
  if (/(shipping|delivery|arrive|dispatch|international|courier|tracking)/i.test(message)) return 'shipping'
  if (/(return|refund|exchange|replace|cancel)/i.test(message)) return 'returns'
  if (/(material|allergy|metal|fabric|eco|sustainab|upcycl)/i.test(message)) return 'materials'
  if (/(care|clean|maintain|wash|store|polish)/i.test(message)) return 'care'
  if (/(custom|personalized|engrave|design request|made to order)/i.test(message)) return 'custom'
  if (/(price|cost|payment|pay|card|bank|currency)/i.test(message)) return 'payment'
  if (/(order status|where is my order|my order|track order)/i.test(message)) return 'order_status'
  if (/(contact|whatsapp|phone|email|support|hours)/i.test(message)) return 'contact'
  if (/(ring|necklace|bracelet|earring|jewelry|jewellery|product|item|stock|available|availability|color|colour|size)/i.test(message)) return 'product'
  return 'unknown'
}
