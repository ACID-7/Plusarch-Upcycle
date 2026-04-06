"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ensureCustomerRole, fetchProfile } from '@/lib/auth-utils'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (data.session) {
          await ensureCustomerRole(supabase, data.session.user.id)

          const profile = await fetchProfile(supabase, data.session.user.id)

          if (!profile) {
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
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          title: "Authentication failed",
          description: getErrorMessage(error, 'Authentication failed.'),
          variant: "destructive",
        })
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  )
}
