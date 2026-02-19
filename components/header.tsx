"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Search
} from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { itemCount: cartCount } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setDisplayName(null)
      return
    }

    const adminAllowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const loadRoleAndName = async () => {
      // role check
      const { data: roleRow, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (roleError) {
        console.warn('roles lookup failed (check RLS):', roleError.message)
      }

      const emailIsAdmin =
        !!user.email &&
        adminAllowlist.includes(user.email.toLowerCase())

      setIsAdmin(
        roleRow?.role === 'admin' || emailIsAdmin
      )

      // display name: prefer metadata, then profile table, then email prefix
      const metaName = (user as any)?.user_metadata?.name
      if (metaName) {
        setDisplayName(metaName)
        return
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) {
        console.warn('profile lookup failed (check RLS):', profileError.message)
      }
      if (profileRow?.name) {
        setDisplayName(profileRow.name)
      } else {
        setDisplayName(user.email?.split('@')[0] || 'Account')
      }
    }

    loadRoleAndName()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // avoid re-running on every render

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[rgba(7,16,12,0.85)] backdrop-blur-2xl border-b border-emerald-900/50 shadow-xl shadow-emerald-950/40'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative h-16 w-16 overflow-hidden">
            <Image
              src="https://jcapynmebqoehrcscxiq.supabase.co/storage/v1/object/public/Images/logo%20plus%20arch.jpeg"
              alt="Plus Arch logo"
              fill
              className="object-contain"
              sizes="56px"
              priority
            />
          </div>
          <div className="leading-tight">
            <span className="block text-xl font-bold text-white drop-shadow-sm">
              Plus Arch
            </span>
            <span className="block text-xs uppercase tracking-[0.2em] text-emerald-200/90">
              Upcycle Atelier
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {[
            { href: '/', label: 'Home' },
            { href: '/about', label: 'About' },
            { href: '/catalog', label: 'Catalog' },
            { href: '/gallery', label: 'Gallery' },
            { href: '/faq', label: 'FAQ' },
            { href: '/contact', label: 'Contact' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.span
                className="inline-flex pb-1 text-emerald-100/90 hover:text-emerald-300 transition-colors duration-300 font-medium relative group"
                whileHover={{ scale: 1.05 }}
              >
                {item.label}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-emerald-300 to-green-500 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                />
              </motion.span>
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {isAdmin && (
            <Link href="/admin">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 rounded-full border border-emerald-300/40 text-emerald-100 hover:bg-white/10 transition-colors text-sm"
              >
                Admin
              </motion.button>
            </Link>
          )}
          {/* Search */}
          <Link href="/catalog" className="hidden sm:inline-flex">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-emerald-100/70 hover:text-emerald-300 transition-colors duration-300"
              aria-label="Search catalog"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-emerald-100/70 hover:text-emerald-300 transition-colors duration-300 relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </motion.button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-emerald-100/70 hover:text-emerald-300 transition-colors duration-300 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </Link>

          {/* User menu */}
          {user ? (
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-emerald-200/30 hover:bg-white/15 transition-all duration-300"
              >
                <User className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium hidden sm:block">
                  {displayName || user.email?.split('@')[0] || 'Account'}
                </span>
              </motion.button>

              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-[rgba(9,20,15,0.95)] backdrop-blur-xl rounded-xl border border-emerald-900/60 shadow-2xl shadow-black/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <Link href="/profile" className="block px-4 py-2 text-emerald-50 hover:bg-white/5 transition-colors duration-300">
                  My Profile
                </Link>
                <Link href="/orders" className="block px-4 py-2 text-emerald-50 hover:bg-white/5 transition-colors duration-300">
                  My Orders
                </Link>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-4 py-2 text-emerald-50 hover:bg-white/5 transition-colors duration-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block"
              >
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-600 text-slate-950 font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-emerald-700/40 transition-all duration-300 border-0">
                  Sign In
                </Button>
              </motion.div>
            </Link>
          )}

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-emerald-100/70 hover:text-emerald-300 transition-colors duration-300"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[rgba(7,16,12,0.9)] backdrop-blur-xl border-t border-emerald-900/50"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About' },
                { href: '/catalog', label: 'Catalog' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/faq', label: 'FAQ' },
                { href: '/contact', label: 'Contact' },
                { href: '/wishlist', label: 'Wishlist' },
                { href: '/cart', label: 'Cart' },
                ...(user ? [{ href: '/profile', label: 'Profile' }] : [{ href: '/auth/login', label: 'Sign In' }]),
              ].map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-white/90 hover:text-green-400 transition-colors duration-300 font-medium py-2"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
