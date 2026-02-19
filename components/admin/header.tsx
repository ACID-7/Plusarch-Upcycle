"use client"

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'

export function AdminHeader() {
  const { signOut } = useAuth()

  return (
    <header className="bg-gradient-to-r from-[rgba(8,18,13,0.95)] via-[rgba(10,24,16,0.92)] to-[rgba(8,18,13,0.95)] border-b border-emerald-900/60 shadow-lg shadow-emerald-950/30">
      <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden">
            <Image src="https://jcapynmebqoehrcscxiq.supabase.co/storage/v1/object/public/Images/logo%20plus%20arch.jpeg" alt="Plus Arch" fill className="object-contain" sizes="40px" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Plus Arch Admin</h1>
            <p className="text-xs text-emerald-100/80 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Live systems: orders, chat, content
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={signOut} className="border-emerald-200/50 text-emerald-50 hover:bg-white/10">
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
