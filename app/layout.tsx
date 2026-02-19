import type { Metadata } from 'next'
import { Space_Grotesk, Playfair_Display } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import { ChatWidget } from '@/components/chat-widget'

// Dynamically import AuthProvider to avoid SSR issues
const AuthProvider = dynamic(() => import('@/lib/auth').then(mod => ({ default: mod.AuthProvider })), {
  ssr: false,
  loading: () => null
})

const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const display = Playfair_Display({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Plus Arch | Eco-Friendly Upcycled Accessories',
  description: 'Thoughtfully crafted accessories that celebrate circular design and Sri Lankan artistry.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${sans.className} ${sans.variable} ${display.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="pt-24">{children}</main>
              <Footer />
              <ChatWidget />
              <Toaster />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
