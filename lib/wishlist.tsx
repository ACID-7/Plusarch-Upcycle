"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface WishlistItem {
  id: string
  product_id: string
  product: {
    name: string
    price_lkr: number
    product_images: { path: string }[]
  }
}

interface WishlistContextType {
  items: WishlistItem[]
  itemCount: number
  addItem: (productId: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  loading: boolean
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  itemCount: 0,
  addItem: async () => {},
  removeItem: async () => {},
  isInWishlist: () => false,
  loading: true,
})

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchWishlist = async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          id,
          product_id,
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
        product: Array.isArray(item.products) ? item.products[0] : item.products
      }))

      setItems(transformedData)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [user])

  const addItem = async (productId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          user_id: user.id,
          product_id: productId,
        })

      if (error) throw error
      await fetchWishlist()
    } catch (error) {
      console.error('Error adding item to wishlist:', error)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await fetchWishlist()
    } catch (error) {
      console.error('Error removing item from wishlist:', error)
    }
  }

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId)
  }

  const itemCount = items.length

  return (
    <WishlistContext.Provider value={{
      items,
      itemCount,
      addItem,
      removeItem,
      isInWishlist,
      loading,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  return useContext(WishlistContext)
}