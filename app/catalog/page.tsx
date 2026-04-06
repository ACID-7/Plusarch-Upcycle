"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { useAuth } from '@/lib/auth'
import { Heart, ShoppingCart } from 'lucide-react'
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

  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuth()
  const { addItem: addToCart } = useCart()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()

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

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categories?.[0]?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      await addToCart(productId)
      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart.",
        variant: "destructive",
      })
    }
  }

  const handleWishlistToggle = async (productId: string, productName: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const inWishlist = isInWishlist(productId)
      if (inWishlist) {
        const existingItem = wishlistItems.find(item => item.product_id === productId)
        if (existingItem) {
          await removeFromWishlist(existingItem.id)
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
        description: error instanceof Error ? error.message : "Failed to update wishlist.",
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
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

                </div>
              </Link>

              <div className="p-6">
                <div className="mb-2">
                  <span className="text-sm text-gray-400 font-medium">
                    {product.categories?.[0]?.name}
                  </span>
                </div>

                <Link href={`/product/${product.id}`}>
                  <h3 className="font-semibold text-lg mb-2 text-white hover:text-green-400 transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-2xl font-bold text-green-400">
                    LKR {product.price_lkr.toLocaleString()}
                  </span>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(product.id, product.name)}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{user ? 'Add to Cart' : 'Login / Signup'}</span>
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
