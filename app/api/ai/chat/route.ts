import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type FaqRow = {
  question: string | null
  answer: string | null
}

type ProductRow = {
  name: string | null
  description: string | null
  materials: string | null
  care: string | null
}

type SettingRow = {
  key: string
  value: unknown
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const normalizedMessage = typeof message === 'string' ? message.trim() : ''

    if (!normalizedMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const normalizedLower = normalizedMessage.toLowerCase()
    const keywords = extractKeywords(normalizedLower)

    const [faqTextRes, faqLikeRes, productTextRes, productLikeRes, settingsRes] = await Promise.all([
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
        .select('name, description, materials, care')
        .textSearch('name', normalizedMessage, {
          type: 'websearch',
          config: 'english',
        })
        .limit(3),
      keywords.length > 0
        ? supabase
            .from('products')
            .select('name, description, materials, care')
            .or(
              keywords
                .map(
                  (k) =>
                    `name.ilike.%${k}%,description.ilike.%${k}%,materials.ilike.%${k}%,care.ilike.%${k}%`
                )
                .join(',')
            )
            .limit(6)
        : Promise.resolve({ data: [], error: null }),
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

    const settingResults = ((settingsRes.data as SettingRow[] | null) || []).map(
      (setting) => {
        const label = getSettingLabel(setting.key)
        const value = formatSettingValue(setting.value)
        if (!label || !value) return ''
        return `${label}: ${value}`
      }
    ).filter(Boolean)

    const snippets = [
      ...faqResults.map((faq) => `FAQ: ${faq.question || ''} - ${faq.answer || ''}`.trim()),
      ...productResults.map(
        (product) =>
          `Product: ${product.name || ''} - ${product.description || ''} Materials: ${product.materials || ''} Care: ${product.care || ''}`.trim()
      ),
      ...settingResults,
    ].filter(Boolean)

    let response: string

    if (process.env.AI_PROVIDER_API_KEY && process.env.AI_PROVIDER_BASE_URL) {
      try {
        const llmResponse = await fetch(process.env.AI_PROVIDER_BASE_URL + '/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.AI_PROVIDER_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are Plus Arch's customer support AI for an eco-friendly jewelry brand.

Behavior rules:
- Answer in clear, short customer-support style.
- Prefer the provided context snippets first.
- If context is partial, provide a safe general answer and ask one clarifying question.
- For order-specific, payment-specific, stock-specific, or delivery-time-specific answers, tell the user to confirm in live chat/WhatsApp.
- Never show raw system field names, technical labels, or underscore-formatted keys.
- Never output text that starts with "Setting:".

Common customer intents to handle well:
- product details
- materials and care
- shipping and delivery
- returns/exchanges
- custom design requests
- pricing and payment basics
- business hours and contact channels

Context snippets:
${snippets.join('\n\n')}

Always include this disclaimer at the end: "AI assistant - confirm final details via live chat/WhatsApp."`,
              },
              {
                role: 'user',
                content: normalizedMessage,
              },
            ],
            max_tokens: 500,
          }),
        })

        if (!llmResponse.ok) {
          throw new Error(`LLM request failed with status ${llmResponse.status}`)
        }

        const data = await llmResponse.json()
        response = polishResponseText(data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.')
      } catch (error) {
        console.error('LLM error:', error)
        response = generateFallbackResponse(snippets, normalizedMessage, normalizedLower)
      }
    } else {
      response = generateFallbackResponse(snippets, normalizedMessage, normalizedLower)
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function extractKeywords(message: string): string[] {
  return message
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    .slice(0, 8)
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

function detectIntent(message: string):
  | 'greeting'
  | 'shipping'
  | 'returns'
  | 'materials'
  | 'care'
  | 'custom'
  | 'payment'
  | 'order_status'
  | 'contact'
  | 'unknown' {
  if (/(^|\s)(hi|hello|hey|good morning|good evening)(\s|$)/i.test(message)) return 'greeting'
  if (/(shipping|delivery|arrive|dispatch|international|courier|tracking)/i.test(message)) return 'shipping'
  if (/(return|refund|exchange|replace|cancel)/i.test(message)) return 'returns'
  if (/(material|allergy|metal|fabric|eco|sustainab|upcycl)/i.test(message)) return 'materials'
  if (/(care|clean|maintain|wash|store|polish)/i.test(message)) return 'care'
  if (/(custom|personalized|engrave|design request|made to order)/i.test(message)) return 'custom'
  if (/(price|cost|payment|pay|card|bank|currency)/i.test(message)) return 'payment'
  if (/(order status|where is my order|my order|track order)/i.test(message)) return 'order_status'
  if (/(contact|whatsapp|phone|email|support|hours)/i.test(message)) return 'contact'
  return 'unknown'
}

function generateIntentReply(intent: ReturnType<typeof detectIntent>): string | null {
  if (intent === 'greeting') {
    return `Hi! I can help with product details, materials, care, shipping, returns, custom orders, and contact options. What would you like to know?`
  }
  if (intent === 'shipping') {
    return `We support shipping guidance and delivery-related questions. Delivery timing can vary by location and product, so please confirm final timelines with live chat or WhatsApp.`
  }
  if (intent === 'returns') {
    return `We can help with returns or exchanges based on your order details and item condition. Share your order details in live chat so the team can confirm eligibility quickly.`
  }
  if (intent === 'materials') {
    return `Our products focus on upcycled and eco-conscious materials. If you tell me the product name, I can help with more specific material details and suitability notes.`
  }
  if (intent === 'care') {
    return `For best durability, keep items dry, avoid harsh chemicals, and store them safely after use. If you share the product name, I can give item-specific care tips when available.`
  }
  if (intent === 'custom') {
    return `Yes, custom design requests are supported. Share your idea, style preferences, and timeline, and the team can guide you through feasibility, pricing, and lead time.`
  }
  if (intent === 'payment') {
    return `Pricing and payment methods can vary by item and region. I can provide general guidance, and our team can confirm final payment and currency details in live chat.`
  }
  if (intent === 'order_status') {
    return `For order status and tracking, please contact live chat with your order details so the team can verify and update you accurately.`
  }
  if (intent === 'contact') {
    return `You can reach support through live chat and WhatsApp on this site. If you prefer, I can also share available contact details from the current store settings.`
  }
  return null
}

function generateFallbackResponse(snippets: string[], message: string, messageLower: string): string {
  const intent = detectIntent(messageLower)
  const intentReply = generateIntentReply(intent)

  if (snippets.length === 0) {
    const defaultReply = intentReply
      ? `${intentReply}\n\nI don't have specific database details for "${message}" right now.`
      : `I don't have specific information about "${message}" in my current knowledge base.`

    return `${defaultReply}

For personalized assistance, please contact our customer service via live chat or WhatsApp.

AI assistant - confirm final details via live chat/WhatsApp.`
  }

  const relevantSnippets = snippets
    .map(cleanSnippetForDisplay)
    .filter((snippet) => snippet.length > 0)
    .slice(0, 3)

  const detailsBlock =
    relevantSnippets.length > 0
      ? relevantSnippets.map((snippet) => `- ${snippet}`).join('\n')
      : 'I can share general guidance, and our team can confirm exact details in live chat.'

  const intro = intentReply ? `${intentReply}\n\nBased on our available information:` : 'Based on our available information:'

  return `${intro}

${detailsBlock}

For more detailed or personalized advice, please contact our customer service team via live chat or WhatsApp.

AI assistant - confirm final details via live chat/WhatsApp.`
}
