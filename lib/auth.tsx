"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      const client = createClient()
      setSupabase(client)

      // Get initial session
      const getSession = async () => {
        try {
          const { data: { session } } = await client.auth.getSession()
          setUser(session?.user ?? null)
        } catch (error) {
          console.error('Error getting session:', error)
        } finally {
          setLoading(false)
        }
      }

      getSession()

      // Listen for auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    } else {
      // On server side, just set loading to false
      setLoading(false)
    }
  }, [])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}