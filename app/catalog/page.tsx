"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { Heart, ShoppingCart, Star, Sparkles } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  price_lkr: number
  status?: 'active' | 'hidden'
  categories: { name: string }[]
  product_images: { path: string }[]
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currency, setCurrency] = useState<'LKR' | 'USD'>('LKR')
  const [usdRate, setUsdRate] = useState(0.003) // LKR -> USD
  const [usdToLkr, setUsdToLkr] = useState(330) // USD -> LKR

  const supabase = createClient()
  const { addItem: addToCart } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    async function fetchData() {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesData) setCategories(categoriesData)

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_lkr,
          status,
          categories(name),
          product_images(path)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (productsData) setProducts(productsData)

      // Fetch USD rate
      const { data: rateData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['lkr_to_usd_rate', 'usd_to_lkr_rate'])

      if (rateData) {
        const map = Object.fromEntries(rateData.map((r: any) => [r.key, parseFloat(r.value)]))
        if (map.lkr_to_usd_rate) setUsdRate(map.lkr_to_usd_rate)
        if (map.usd_to_lkr_rate) setUsdToLkr(map.usd_to_lkr_rate)
      }

      // Refresh rate daily via API (server stores in site_settings)
      try {
        const res = await fetch('/api/rates/update')
        const json = await res.json()
        if (json?.lkr_to_usd_rate) setUsdRate(json.lkr_to_usd_rate)
        if (json?.usd_to_lkr_rate) setUsdToLkr(json.usd_to_lkr_rate)
      } catch (e) {
        // silent fail; keep existing rate
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categories?.[0]?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatPrice = (priceLkr: number) => {
    if (currency === 'USD') {
      if (usdToLkr > 0) {
        return `$${(priceLkr / usdToLkr).toFixed(2)}`
      }
      return `$${(priceLkr * usdRate).toFixed(2)}`
    }
    return `LKR ${priceLkr.toLocaleString()}`
  }

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      await addToCart(productId)
      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      })
    }
  }

  const handleWishlistToggle = async (productId: string, productName: string) => {
    try {
      const wishlistItem = products.find(p => p.id === productId)
      if (!wishlistItem) return

      const inWishlist = isInWishlist(productId)
      if (inWishlist) {
        // Find the wishlist item ID and remove it
        const { data } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('product_id', productId)
          .single()

        if (data) {
          await removeFromWishlist(data.id)
          toast({
            title: "Removed from wishlist",
            description: `${productName} has been removed from your wishlist.`,
          })
        }
      } else {
        await addToWishlist(productId)
        toast({
          title: "Added to wishlist",
          description: `${productName} has been added to your wishlist.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Collection</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/3"
        />

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currency} onValueChange={(value: 'LKR' | 'USD') => setCurrency(value)}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LKR">LKR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            layout
            className="group"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-green-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl">
              <Link href={`/product/${product.id}`}>
                <div className="relative overflow-hidden">
                  {product.product_images[0] && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={product.product_images[0].path}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="w-full h-64 object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.preventDefault()
                          handleAddToCart(product.id, product.name)
                        }}
                        className="p-3 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg transition-colors duration-300"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.preventDefault()
                          handleWishlistToggle(product.id, product.name)
                        }}
                        className={`p-3 rounded-full text-white shadow-lg transition-colors duration-300 ${
                          isInWishlist(product.id)
                            ? 'bg-pink-500 hover:bg-pink-600'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Featured badge */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>FEATURED</span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 font-medium">
                    {product.categories?.[0]?.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-300">4.8</span>
                  </div>
                </div>

                <Link href={`/product/${product.id}`}>
                  <h3 className="font-semibold text-lg mb-2 text-white hover:text-green-400 transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-2xl font-bold text-green-400">
                    {formatPrice(product.price_lkr)}
                  </span>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(product.id, product.name)}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
