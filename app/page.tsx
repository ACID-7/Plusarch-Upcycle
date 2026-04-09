import { Hero } from '@/components/hero'
import { SocialProof } from '@/components/social-proof'

// Home page with hero and social proof
export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <SocialProof />
    </div>
  )
}
