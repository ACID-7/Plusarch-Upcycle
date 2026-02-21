"use client"

import { Hero } from '@/components/hero'
import { FeaturedProducts } from '@/components/featured-products'
import { SocialProof } from '@/components/social-proof'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedProducts />
      <SocialProof />
    </div>
  )
}

