import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'

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
  categories?: Array<{ name: string | null }> | { name: string | null } | null
  product_variants?: Array<{
    name: string | null
    value: string | null
    is_available?: boolean | null
    stock_quantity?: number | null
  }> | {
    name: string | null
    value: string | null
    is_available?: boolean | null
    stock_quantity?: number | null
  } | null
}

type SettingRow = {
  key: string
  value: unknown
}

type QueryResult<T> = {
  data: T | null
  error: { message?: string } | null
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

    const normalizedLower = normalizedMessage.toLowerCase()
    const keywords = extractKeywords(normalizedLower)
    const primaryIntent = detectIntent(normalizedLower)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase =
      supabaseUrl && supabaseKey
        ? createSupabaseClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null

    const emptyResult: QueryResult<any[]> = { data: [], error: null }
    const [faqTextRes, faqLikeRes, productTextRes, productLikeRes, productCatalogRes, settingsRes] = supabase
      ? await Promise.all([
          safeQuery(
            supabase
              .from('faqs')
              .select('question, answer')
              .textSearch('question', normalizedMessage, {
                type: 'websearch',
                config: 'english',
              })
              .limit(3),
            'faqs text search'
          ),
          keywords.length > 0
            ? safeQuery(
                supabase
                  .from('faqs')
                  .select('question, answer')
                  .or(keywords.map((k) => `question.ilike.%${k}%,answer.ilike.%${k}%`).join(','))
                  .limit(5),
                'faqs keyword search'
              )
            : Promise.resolve(emptyResult),
          safeQuery(
            supabase
              .from('products')
              .select('name, price_lkr, description, materials, care')
              .textSearch('name', normalizedMessage, {
                type: 'websearch',
                config: 'english',
              })
              .limit(3),
            'products text search'
          ),
          keywords.length > 0
            ? safeQuery(
                supabase
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
                  .limit(6),
                'products keyword search'
              )
            : Promise.resolve(emptyResult),
          safeQuery(
            supabase
              .from('products')
              .select('name, price_lkr, description, materials, care, categories(name), product_variants(name, value, is_available, stock_quantity)')
              .eq('status', 'active')
              .limit(120),
            'products catalog'
          ),
          safeQuery(
            supabase
              .from('site_settings')
              .select('key, value')
              .in('key', ['whatsapp_number', 'email', 'business_hours', 'shipping_policy', 'return_policy']),
            'site settings'
          ),
        ])
      : [emptyResult, emptyResult, emptyResult, emptyResult, emptyResult, emptyResult]

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

    // For product intent we only use catalog (checked products). For everything else we use dataset + catalog + FAQs.
    const datasetSnippets =
      primaryIntent === 'product'
        ? []
        : getDatasetSnippets(normalizedLower, keywords, 14)
    const catalogAndProductSnippets = [
      ...catalogMatches.map((product) => formatCatalogMatchSnippet(product, normalizedLower)),
      ...productResults.map(
        (product) =>
          `Product: ${product.name || ''} - ${product.description || ''} Materials: ${product.materials || ''} Care: ${product.care || ''}`.trim()
      ),
    ]
    const faqSnippets = faqResults.map((faq) => `FAQ: ${faq.question || ''} - ${faq.answer || ''}`.trim())
    const snippets = [
      ...datasetSnippets,
      ...catalogAndProductSnippets,
      ...faqSnippets,
    ].filter(Boolean) as string[]
    const rankedSnippets = rankSnippets(snippets, keywords, normalizedLower).slice(0, 12)

    const llmAnswer = await tryLlmAnswer({
      message: normalizedMessage,
      history,
      snippets: rankedSnippets,
    })

    if (llmAnswer) {
      return NextResponse.json({ response: makeConciseAnswer(polishResponseText(llmAnswer)) })
    }

    const baseUrl = process.env.AI_PROVIDER_BASE_URL
    const ollamaHint =
      baseUrl && isOllamaUrl(baseUrl)
        ? ' The local AI (Ollama) did not respond. Check that Ollama is running and you have pulled the model (e.g. ollama pull llama3.2:3b).'
        : ''

    return NextResponse.json({
      response: makeConciseAnswer(
        'I can help with product details, care, shipping, returns, and contact support. Please ask a specific question.' +
          ollamaHint
      ),
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function safeQuery<T>(
  query: PromiseLike<QueryResult<T>>,
  label: string
): Promise<QueryResult<T>> {
  try {
    const result = await query
    if (result.error) {
      console.warn(`[AI Chat] ${label} failed:`, result.error.message || result.error)
      return { data: null, error: result.error }
    }
    return result
  } catch (error) {
    console.warn(`[AI Chat] ${label} threw:`, error)
    return { data: null, error: { message: `${label} failed` } }
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
    'show',
    'need',
    'looking',
    'find',
    'tell',
    'give',
    'about',
    'please',
  ])

  const unique = new Set(
    message
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .map((part) => part.trim())
      .flatMap((part) => expandKeywordVariants(part))
      .filter((part) => part.length >= 3 && !stopWords.has(part))
  )

  return Array.from(unique).slice(0, 8)
}

function expandKeywordVariants(rawKeyword: string): string[] {
  const keyword = rawKeyword.trim().toLowerCase()
  if (!keyword) return []

  const variants = new Set<string>([keyword])

  if (keyword.endsWith('ies') && keyword.length > 4) {
    variants.add(`${keyword.slice(0, -3)}y`)
  }

  if (keyword.endsWith('es') && keyword.length > 4) {
    variants.add(keyword.slice(0, -2))
  }

  if (keyword.endsWith('s') && keyword.length > 3) {
    variants.add(keyword.slice(0, -1))
  }

  const aliasMap: Record<string, string[]> = {
    earring: ['earrings'],
    earrings: ['earring'],
    ring: ['rings'],
    rings: ['ring'],
    necklace: ['necklaces'],
    necklaces: ['necklace'],
    bracelet: ['bracelets'],
    bracelets: ['bracelet'],
    jewelry: ['jewellery'],
    jewellery: ['jewelry'],
  }

  for (const alias of aliasMap[keyword] || []) {
    variants.add(alias)
  }

  return Array.from(variants)
}

function rankSnippets(snippets: string[], keywords: string[], messageLower: string): string[] {
  if (snippets.length === 0) return []
  const safeKeywords = keywords.length > 0 ? keywords : extractKeywords(messageLower)

  return [...snippets]
    .map((snippet) => {
      const lower = snippet.toLowerCase()
      const score = safeKeywords.reduce((total, keyword) => {
        return total + (containsKeyword(lower, keyword) ? 1 : 0)
      }, 0)
      return { snippet, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.snippet)
}

type DatasetPair = { intent?: string; question?: string; answer?: string }
let datasetCache: DatasetPair[] | null = null

function loadFaqDataset(): DatasetPair[] {
  if (datasetCache) return datasetCache
  try {
    const candidates = [
      path.join(process.cwd(), 'data', 'ai-training', 'faq-dataset.cleaned.json'),
      path.join(process.cwd(), 'data', 'ai-training', 'faq-dataset.json'),
    ]

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue
      const raw = fs.readFileSync(candidate, 'utf8')
      const data = JSON.parse(raw) as { pairs?: DatasetPair[] }
      const pairs = data.pairs ?? []
      datasetCache = pairs.filter((x) => x?.question && x?.answer)
      return datasetCache
    }

    return []
  } catch {
    return []
  }
}

function getDatasetSnippets(messageLower: string, keywords: string[], limit: number): string[] {
  const pairs = loadFaqDataset()
  if (pairs.length === 0) return []
  const safeKeywords = keywords.length > 0 ? keywords : extractKeywords(messageLower)
  const scored = pairs.map((p) => {
    const text = `${p.question ?? ''} ${p.answer ?? ''}`.toLowerCase()
    const score = safeKeywords.reduce((total, k) => total + (containsKeyword(text, k) ? 1 : 0), 0)
    return { pair: p, score }
  })
  const withScore = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score)
  const fallback = scored.slice(0, limit).map((x) => x.pair)
  const chosen = withScore.length > 0 ? withScore : fallback.map((p) => ({ pair: p, score: 0 }))
  return chosen.slice(0, limit).map((x) => `FAQ: ${x.pair.question ?? ''} - ${x.pair.answer ?? ''}`.trim())
}

/** Get one answer from the local dataset for a given intent (e.g. returns, shipping, greeting). */
function getDatasetAnswerForIntent(intent: Intent, messageLower: string): string | null {
  const pairs = loadFaqDataset()
  if (pairs.length === 0) return null
  const intentMatch = (p: DatasetPair) => (p.intent ?? '').toLowerCase() === intent
  const forIntent = pairs.filter((p) => intentMatch(p) && p.answer?.trim())
  if (forIntent.length > 0) {
    const keywords = extractKeywords(messageLower)
    const scored = forIntent.map((p) => {
      const text = `${p.question ?? ''} ${p.answer ?? ''}`.toLowerCase()
      const score = keywords.reduce((total, k) => total + (containsKeyword(text, k) ? 1 : 0), 0)
      return { pair: p, score }
    })
    const best = scored.sort((a, b) => b.score - a.score)[0] ?? scored[0]
    return best?.pair?.answer?.trim() ?? null
  }
  const keywords = extractKeywords(messageLower)
  const anyMatch = pairs
    .filter((p) => p.answer?.trim())
    .map((p) => {
      const text = `${p.question ?? ''} ${p.answer ?? ''}`.toLowerCase()
      const score = keywords.reduce((total, k) => total + (containsKeyword(text, k) ? 1 : 0), 0)
      return { pair: p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]
  return anyMatch?.pair?.answer?.trim() ?? null
}

function findCatalogMatches(products: ProductRow[], messageLower: string): ProductRow[] {
  const keywords = extractKeywords(messageLower)
  if (keywords.length === 0) return []

  const requestedCategory = detectRequestedCategory(messageLower)

  return [...products]
    .map((product) => {
      const categories = toArray(product.categories)
      const variants = toArray(product.product_variants)
      const categoryNames = categories.map((category) => category?.name || '')
      const haystackParts = [
        product.name || '',
        product.description || '',
        product.materials || '',
        product.care || '',
        ...categoryNames,
        ...variants.flatMap((variant) => [variant?.name || '', variant?.value || '']),
      ]
      const haystack = haystackParts.join(' ').toLowerCase()
      const expandedHaystack = new Set(
        haystackParts.flatMap((value) =>
          value
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .flatMap((part) => expandKeywordVariants(part))
            .filter(Boolean)
        )
      )

      let score = keywords.reduce((total, keyword) => {
        return total + (containsKeyword(haystack, keyword) || expandedHaystack.has(keyword) ? 1 : 0)
      }, 0)

      if (requestedCategory) {
        const categoryMatch = categoryNames.some((name) => containsKeyword(name.toLowerCase(), requestedCategory))
        const nameMatch = containsKeyword((product.name || '').toLowerCase(), requestedCategory)
        if (categoryMatch) score += 4
        if (nameMatch) score += 2
      }

      return { product, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)
}

function detectRequestedCategory(message: string): string | null {
  const normalized = message.toLowerCase()
  if (/\bearrings?\b/.test(normalized)) return 'earring'
  if (/\bnecklaces?\b/.test(normalized)) return 'necklace'
  if (/\bbracelets?\b/.test(normalized)) return 'bracelet'
  if (/\brings?\b/.test(normalized)) return 'ring'
  return null
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
}

function formatCatalogMatchSnippet(product: ProductRow, messageLower: string): string {
  const name = product.name?.trim() || 'Unnamed product'
  const category = toArray(product.categories)
    .map((item) => item?.name?.trim() || '')
    .find((value) => value.length > 0)
  const matchingVariantValues = toArray(product.product_variants)
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
    const fromDataset = getDatasetAnswerForIntent('greeting', messageLower)
    if (fromDataset) return fromDataset
    return 'Hi! I can help with product availability, materials, care, shipping, returns, and contact details.'
  }

  if (intent === 'contact') {
    const bits: string[] = []
    if (settingsMap.whatsapp_number) bits.push(`WhatsApp: ${settingsMap.whatsapp_number}`)
    if (settingsMap.email) bits.push(`Email: ${settingsMap.email}`)
    if (settingsMap.business_hours) bits.push(`Hours: ${settingsMap.business_hours}`)
    if (bits.length > 0) return bits.join(' | ')
    const fromDataset = getDatasetAnswerForIntent('contact', messageLower)
    if (fromDataset) return fromDataset
    return 'You can contact support via live chat or WhatsApp.'
  }

  if (intent === 'shipping') {
    if (settingsMap.shipping_policy) return settingsMap.shipping_policy
    if (faqForIntent?.answer) return faqForIntent.answer
    const fromDataset = getDatasetAnswerForIntent('shipping', messageLower)
    if (fromDataset) return fromDataset
    return 'Shipping time depends on location and item type. Please confirm exact delivery timing in live chat.'
  }

  if (intent === 'returns') {
    if (settingsMap.return_policy) return settingsMap.return_policy
    if (faqForIntent?.answer) return faqForIntent.answer
    const fromDataset = getDatasetAnswerForIntent('returns', messageLower)
    if (fromDataset) return fromDataset
    return 'Returns and exchanges depend on item condition and timeline. Please contact live chat for exact eligibility.'
  }

  if (intent === 'materials' || intent === 'care') {
    const top = productResults[0] || catalogMatches[0]
    if (top) {
      if (intent === 'materials' && top.materials) return `${top.name || 'This item'} uses ${top.materials}.`
      if (intent === 'care' && top.care) return `${top.name || 'This item'} care: ${top.care}.`
    }
    if (faqForIntent?.answer) return faqForIntent.answer
    const fromDataset = getDatasetAnswerForIntent(intent, messageLower)
    if (fromDataset) return fromDataset
    return intent === 'materials'
      ? 'Most pieces use recycled or eco-conscious materials. Ask for a specific product to get exact materials.'
      : 'Care varies by product. Ask with a product name for exact care instructions.'
  }

  // Products: answer only from checked catalog (Supabase), never from dataset.
  if (intent === 'product') {
    const topMatches = catalogMatches.slice(0, 5)
    if (topMatches.length === 0) {
      return `I could not find "${message}" in the current catalog. Try asking for rings, necklaces, bracelets, or earrings.`
    }

    const details = topMatches.map((product) => {
      const name = product.name || 'Unnamed item'
      const category = toArray(product.categories)
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

function isFinetunedModel(model: string | undefined): boolean {
  return Boolean(model && model.startsWith('ft:'))
}

function isOllamaUrl(url: string | undefined): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  return u.includes('11434') || (u.includes('localhost') && u.includes('ollama'))
}

async function tryLlmAnswer(input: {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  snippets: string[]
}): Promise<string | null> {
  const baseUrl = process.env.AI_PROVIDER_BASE_URL?.replace(/\/$/, '')
  const useOllama = baseUrl && isOllamaUrl(baseUrl)
  const hasKey = Boolean(process.env.AI_PROVIDER_API_KEY)
  if (!baseUrl || (!useOllama && !hasKey)) return null

  const { message, history, snippets } = input
  const model = process.env.AI_PROVIDER_MODEL || (useOllama ? 'llama3.2:3b' : 'gpt-3.5-turbo')
  const useFinetuned = isFinetunedModel(model)

  const systemContent = useOllama
    ? `You are Plus Arch Upcycle customer support. Answer using ONLY the FAQ and product context below. Reply in 1-3 short sentences. Be friendly and direct. If the context does not contain the answer, say you can help with shipping, returns, materials, care, and products and suggest they ask specifically.

Context:
${snippets.join('\n\n')}`
    : useFinetuned
      ? `You are Plus Arch Upcycle customer support. You were trained on our FAQ (shipping, returns, materials, care, products). Reply in 1-3 short, direct sentences. Use the context below only for live product names/prices or when your training does not cover the question.

Context:
${snippets.join('\n\n')}`
      : `You are Plus Arch customer support AI.
- Reply in max 2 short sentences.
- Be direct and human.
- Answer only the asked question.
- Use context snippets when relevant.
- If uncertain, say what is unknown and ask one short clarifying question.

Context snippets:
${snippets.join('\n\n')}`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.AI_PROVIDER_API_KEY) headers.Authorization = `Bearer ${process.env.AI_PROVIDER_API_KEY}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), useOllama ? 60000 : 15000)
    try {
      const llmResponse = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemContent },
            ...history,
            { role: 'user', content: message },
          ],
          max_tokens: useOllama ? 320 : useFinetuned ? 280 : 220,
        }),
      })

      if (!llmResponse.ok) {
        if (useOllama) {
          const errBody = await llmResponse.text()
          console.error('[AI Chat] Ollama returned', llmResponse.status, errBody)
        }
        return null
      }
      const data = await llmResponse.json()
      const output = data?.choices?.[0]?.message?.content
      return typeof output === 'string' && output.trim() ? output.trim() : null
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    if (useOllama) {
      console.error('[AI Chat] Ollama request failed. Is Ollama running? Run: ollama pull', model, err)
    }
    return null
  }
}

function makeConciseAnswer(text: string): string {
  const cleaned = repairMojibake(text)
    .replace(/\s+/g, ' ')
    .replace(/\s*([.!?])\s*/g, '$1 ')
    .trim()

  if (!cleaned) return ''

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= 3) return cleaned
  const taken = sentences.slice(0, 3).join(' ').trim()
  const wordCount = taken.split(/\s+/).length
  if (wordCount <= 60) return taken
  let out = ''
  let words = 0
  for (const s of sentences) {
    const nextWords = s.split(/\s+/).length
    if (words + nextWords > 60) break
    out += (out ? ' ' : '') + s
    words += nextWords
  }
  return out.trim() || taken
}

function repairMojibake(text: string): string {
  if (!/[Ã¢Ãƒ]/.test(text)) return text

  try {
    const repaired = Buffer.from(text, 'latin1').toString('utf8')
    const originalArtifacts = (text.match(/[Ã¢Ãƒ]/g) || []).length
    const repairedArtifacts = (repaired.match(/[Ã¢Ãƒ]/g) || []).length
    return repairedArtifacts < originalArtifacts ? repaired : text
  } catch {
    return text
  }
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

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
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

function polishResponseText(text: string): string {
  return text
    .replace(/^Setting:\s*/gim, '')
    .replace(/_/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function detectIntent(message: string): Intent {
  if (/(^|\s)(hi|hello|hey|howdy|hiya|good morning|good afternoon|good evening|good day|greetings)(\s|$)/i.test(message) || /^(hi|hello|hey|howdy|yo)$/i.test(message.trim())) return 'greeting'
  if (/(order status|where is my order|my order|track order|delivery update|shipping update|status update|has it shipped|where is it|order update)/i.test(message)) return 'order_status'
  if (/(shipping|delivery|arrive|dispatch|international|courier|tracking)/i.test(message)) return 'shipping'
  if (/(return|refund|exchange|replace|cancel)/i.test(message)) return 'returns'
  if (/(material|allergy|metal|fabric|eco|sustainab|upcycl)/i.test(message)) return 'materials'
  if (/(care|clean|maintain|wash|store|polish)/i.test(message)) return 'care'
  if (/(custom|personalized|engrave|design request|made to order)/i.test(message)) return 'custom'
  if (/(price|cost|payment|pay|card|bank|currency)/i.test(message)) return 'payment'
  if (/(contact|whatsapp|phone|email|support|hours)/i.test(message)) return 'contact'
  if (/(ring|necklace|bracelet|earring|jewelry|jewellery|product|item|stock|available|availability|color|colour|size)/i.test(message)) return 'product'
  return 'unknown'
}

