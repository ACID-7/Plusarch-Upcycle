"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    name: string
    price_lkr: number
    product_images: { path: string }[]
  }
}

interface CartContextType {
  items: CartItem[]
  total: number
  itemCount: number
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType>({
  items: [],
  total: 0,
  itemCount: 0,
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  loading: true,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchCart = async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price_lkr,
            product_images(path)
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: Array.isArray(item.products) ? item.products[0] : item.products
      }))

      setItems(transformedData)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [user])

  const addItem = async (productId: string, quantity = 1) => {
    if (!user) return

    try {
      // Check if item already exists
      const existingItem = items.find(item => item.product_id === productId)

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity)
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          })

        if (error) throw error
        await fetchCart()
      }
    } catch (error) {
      console.error('Error adding item to cart:', error)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('Error removing item from cart:', error)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user || quantity < 1) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('Error updating cart item quantity:', error)
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const total = items.reduce((sum, item) => sum + (item.product.price_lkr * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      total,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      loading,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}