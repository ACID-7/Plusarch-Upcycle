"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

type WishlistRow = {
  id: string
  product_id: string
  products: WishlistItem['product'] | WishlistItem['product'][]
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

  const fetchWishlist = useCallback(async () => {
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

      // As with cart joins, we normalize relation output so UI components can treat every item consistently.
      const transformedData = ((data || []) as WishlistRow[]).map((item) => ({
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
  }, [supabase, user])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const addItem = async (productId: string) => {
    if (!user) {
      throw new Error('Please sign in to save items to your wishlist.')
    }

    try {
      // Wishlist items are unique by product, so we short-circuit if it already exists locally.
      const existingItem = items.find(item => item.product_id === productId)
      if (existingItem) return

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
      throw error
    }
  }

  const removeItem = async (itemId: string) => {
    if (!user) {
      throw new Error('Please sign in to manage your wishlist.')
    }

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await fetchWishlist()
    } catch (error) {
      console.error('Error removing item from wishlist:', error)
      throw error
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
