"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/lib/wishlist'
import { useCart } from '@/lib/cart'
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function WishlistPage() {
  const { items, removeItem, loading } = useWishlist()
  const { addItem: addToCart } = useCart()

  const handleRemoveFromWishlist = async (itemId: string, productName: string) => {
    try {
      await removeItem(itemId)
      toast({
        title: "Removed from wishlist",
        description: `${productName} has been removed from your wishlist.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
      })
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Heart className="w-24 h-24 text-gray-400 mx-auto mb-8" />
            <h1 className="text-4xl font-bold text-white mb-4">Your wishlist is empty</h1>
            <p className="text-gray-400 mb-8 text-lg">
              Save items you love for later. Start browsing our collection!
            </p>
            <Link href="/catalog">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                Browse Collection
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/catalog" className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors duration-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">My Wishlist</h1>
          <p className="text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''} in your wishlist</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-pink-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl group"
            >
              <Link href={`/product/${item.product_id}`}>
                <div className="relative overflow-hidden">
                  {item.product.product_images[0] && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={item.product.product_images[0].path}
                        alt={item.product.name}
                        width={400}
                        height={400}
                        className="w-full h-64 object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Wishlist overlay */}
                  <div className="absolute top-3 right-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault()
                        handleRemoveFromWishlist(item.id, item.product.name)
                      }}
                      className="p-2 bg-pink-500 hover:bg-pink-600 rounded-full text-white shadow-lg transition-colors duration-300"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </motion.button>
                  </div>
                </div>
              </Link>

              <div className="p-6">
                <Link href={`/product/${item.product_id}`}>
                  <h3 className="font-semibold text-lg mb-2 text-white hover:text-green-400 transition-colors duration-300 line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-2xl font-bold text-green-400">
                    LKR {item.product.price_lkr.toLocaleString()}
                  </span>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(item.product_id, item.product.name)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
