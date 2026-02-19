"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart'
import { createClient } from '@/lib/supabase/client'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart, loading } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const supabase = createClient()

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (itemId: string, productName: string) => {
    try {
      await removeItem(itemId)
      toast({
        title: "Item removed",
        description: `${productName} has been removed from your cart.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      })
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      })
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      const { data: setting } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle()

      let whatsappNumber = '94774442642'
      if (setting?.value) {
        const raw =
          typeof setting.value === 'string'
            ? setting.value.replace(/"/g, '')
            : String(setting.value)
        const cleaned = raw.replace(/\D/g, '')
        if (cleaned) whatsappNumber = cleaned
      }

      const itemLines = items
        .map((item) => `- ${item.product.name} x${item.quantity} (LKR ${(item.product.price_lkr * item.quantity).toLocaleString()})`)
        .join('\n')

      const message = encodeURIComponent(
        `Hi Plus Arch, I want to place this order:\n\n${itemLines}\n\nSubtotal: LKR ${total.toLocaleString()}\nEstimated total: LKR ${(total * 1.08).toLocaleString()}`
      )

      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
      toast({
        title: "Checkout started",
        description: "We opened WhatsApp with your order summary.",
      })
    } catch {
      toast({
        title: "Checkout failed",
        description: "Unable to open WhatsApp checkout right now.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingOut(false)
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
            <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-8" />
            <h1 className="text-4xl font-bold text-white mb-4">Your cart is empty</h1>
            <p className="text-gray-400 mb-8 text-lg">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link href="/catalog">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                Continue Shopping
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
          <h1 className="text-4xl font-bold text-white mb-2">Shopping Cart</h1>
          <p className="text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Link href={`/product/${item.product_id}`}>
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      {item.product.product_images[0] && (
                        <Image
                          src={item.product.product_images[0].path}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1">
                    <Link href={`/product/${item.product_id}`}>
                      <h3 className="font-semibold text-lg text-white hover:text-green-400 transition-colors duration-300">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-green-400 font-bold text-xl">
                      LKR {(item.product.price_lkr * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    <div className="flex items-center bg-white/10 rounded-full p-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-2 text-white hover:text-green-400 transition-colors duration-300"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>

                      <span className="px-4 py-2 text-white font-semibold min-w-[3rem] text-center">
                        {item.quantity}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-2 text-white hover:text-green-400 transition-colors duration-300"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveItem(item.id, item.product.name)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors duration-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-between items-center pt-4"
            >
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white transition-all duration-300"
              >
                Clear Cart
              </Button>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-fit"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>LKR {total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>Tax</span>
                <span>LKR {(total * 0.08).toLocaleString()}</span>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span className="text-green-400">LKR {(total * 1.08).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Proceed to Checkout'
              )}
            </motion.button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Secure checkout powered by industry-standard encryption
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
