"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Settings,
  Image,
  HelpCircle,
  Users
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FileText },
  { name: 'Gallery', href: '/admin/gallery', icon: Image },
  { name: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
  { name: 'Inquiries', href: '/admin/inquiries', icon: FileText },
  { name: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Users', href: '/admin/users', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-full md:w-72 bg-[rgba(7,16,12,0.96)] border-b md:border-b-0 md:border-r border-emerald-900/60 md:min-h-screen shadow-xl shadow-emerald-950/30">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white">Control Center</h2>
        <p className="text-xs text-emerald-100/80 mt-1">Content, commerce, and service</p>
      </div>

      <nav className="px-3 pb-4 md:pb-0 flex md:block gap-2 md:space-y-1 overflow-x-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group shrink-0 flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors border',
                isActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-900/40'
                  : 'text-emerald-50 border-transparent hover:border-emerald-800/60 hover:bg-white/5'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
