"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { canAccessAdmin, fetchRole } from '@/lib/auth-utils'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

// This layout protects the entire admin area before rendering dashboard navigation or content.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAdminAccess() {
      // Admin access is verified from both the roles table and the email allowlist fallback.
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      let role: string | null = null
      try {
        role = await fetchRole(supabase, user.id)
      } catch (error) {
        console.warn('Admin check roles lookup failed:', error)
      }

      if (canAccessAdmin(role, user.email)) {
        setIsAdmin(true)
      } else {
        router.push('/')
        return
      }

      setLoading(false)
    }

    checkAdminAccess()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#050b08] text-emerald-50">
      <AdminHeader />
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gradient-to-br from-[rgba(7,16,12,0.92)] via-[rgba(10,22,16,0.92)] to-[rgba(6,14,10,0.92)]">
          {children}
        </main>
      </div>
    </div>
  )
}
