"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const ensureCustomerRole = async (userId: string) => {
    const roleCandidates = ['customer', 'operator'] as const
    for (const role of roleCandidates) {
      const { error } = await supabase
        .from('roles')
        .upsert(
          { user_id: userId, role },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
      if (!error) return
    }
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (data.session) {
          await ensureCustomerRole(data.session.user.id)

          // Check if profile exists, if not create one
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', data.session.user.id)
            .single()

          if (!profile) {
            // Profile doesn't exist, redirect to profile setup
            router.push('/auth/profile-setup')
            return
          }

          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
          })

          router.push('/')
        } else {
          throw new Error('No session found')
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        })
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  )
}
