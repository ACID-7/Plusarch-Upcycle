"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { ShoppingCart, Heart, Star, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  price_lkr: number
  product_images: { path: string }[]
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { addItem: addToCart } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    async function fetchFeaturedProducts() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_lkr,
          product_images(path)
        `)
        .eq('is_featured', true)
        .limit(6)

      if (!error && data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchFeaturedProducts()
  }, [])

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
      const inWishlist = isInWishlist(productId)
      if (inWishlist) {
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
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Featured Collection</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 animate-pulse"
              >
                <div className="bg-gray-700 h-64 mb-4"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-green-400/30">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">Featured Collection</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Handcrafted
            <span className="block bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Masterpieces
            </span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover our most beloved pieces, carefully selected for their unique beauty and sustainable craftsmanship.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
                        <Star className="w-3 h-3" />
                        <span>FEATURED</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-6">
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
                      <span>Add to Cart</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link href="/catalog">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 group">
                <span>Explore Full Collection</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
