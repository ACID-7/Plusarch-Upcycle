"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  description: string
  materials: string
  care: string
  price_lkr: number
  categories: { name: string }[]
  product_images: { path: string; sort_order: number }[]
}

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [usdRate, setUsdRate] = useState(0.003)
  const [whatsappNumber, setWhatsappNumber] = useState('94774442642')

  const supabase = createClient()

  const parseSettingNumber = (value: unknown) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
      const direct = Number.parseFloat(value)
      if (Number.isFinite(direct)) return direct
      try {
        const parsed = JSON.parse(value)
        return parseSettingNumber(parsed)
      } catch {
        return 0
      }
    }
    return 0
  }

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          materials,
          care,
          price_lkr,
          categories(name),
          product_images(path, sort_order)
        `)
        .eq('id', params.id)
        .single()

      if (!error && data) {
        setProduct(data)
        data.product_images.sort((a, b) => a.sort_order - b.sort_order)
      }

      // Fetch rates/settings
      const { data: rateData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'lkr_to_usd_rate')
        .maybeSingle()

      const parsedLkrToUsd = parseSettingNumber(rateData?.value)
      if (parsedLkrToUsd > 0) {
        setUsdRate(parsedLkrToUsd)
      } else {
        const { data: reverseRateData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'usd_to_lkr_rate')
          .maybeSingle()
        const parsedUsdToLkr = parseSettingNumber(reverseRateData?.value)
        if (parsedUsdToLkr > 0) {
          setUsdRate(1 / parsedUsdToLkr)
        }
      }

      const { data: whatsappData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle()
      if (whatsappData?.value) {
        const raw =
          typeof whatsappData.value === 'string'
            ? whatsappData.value.replace(/\"/g, '')
            : String(whatsappData.value)
        const cleaned = raw.replace(/\D/g, '')
        if (cleaned) setWhatsappNumber(cleaned)
      }

      setLoading(false)
    }

    fetchProduct()
  }, [params.id])

  const handleOrderViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in ordering "${product?.name}". Can you provide more details? ${window.location.href}`
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
  }

  const handleAskAI = () => {
    const productName = product?.name?.trim()
    const prefill = productName ? `I need details about "${productName}".` : ''
    document.dispatchEvent(new CustomEvent('openChat', { detail: { mode: 'ai', prefill } }))
  }

  const handleChatWithPerson = () => {
    const productName = product?.name?.trim()
    const prefill = productName ? `Hi, I need help with "${productName}".` : ''
    document.dispatchEvent(new CustomEvent('openChat', { detail: { mode: 'person', prefill } }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={product.product_images[selectedImage]?.path || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          {product.product_images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.product_images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image.path}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <Badge variant="secondary">{product.categories?.[0]?.name}</Badge>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-semibold">
              LKR {product.price_lkr.toLocaleString()}
            </p>
            <p className="text-muted-foreground">~ ${(product.price_lkr * usdRate).toFixed(2)} USD</p>
          </div>

          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {product.materials && (
            <div>
              <h3 className="font-semibold mb-2">Materials</h3>
              <p className="text-muted-foreground">{product.materials}</p>
            </div>
          )}

          {product.care && (
            <div>
              <h3 className="font-semibold mb-2">Care Instructions</h3>
              <p className="text-muted-foreground">{product.care}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={handleOrderViaWhatsApp} className="w-full">
              Order via WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleAskAI}>
                Ask AI
              </Button>
              <Button variant="outline" onClick={handleChatWithPerson}>
                Chat with Person
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

