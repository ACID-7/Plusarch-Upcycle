"use client"

import { Hero } from '@/components/hero'
import { FeaturedProducts } from '@/components/featured-products'
import { SocialProof } from '@/components/social-proof'
import { motion } from 'framer-motion'
import { Globe2, Leaf, ShieldCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedProducts />
      <SocialProof />

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="rounded-2xl md:rounded-3xl border border-emerald-900/60 bg-gradient-to-r from-[rgba(8,18,13,0.85)] via-[rgba(9,26,18,0.9)] to-[rgba(8,18,13,0.85)] shadow-2xl shadow-emerald-950/40 p-5 sm:p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 mb-2">For conscious travelers</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Circular luxury, shipped islandwide</h2>
              <p className="text-emerald-100/80 mt-3 max-w-2xl">
                We design for global wardrobes, streamlined customs-ready packing, carbon-light materials, and repairs on us for the first year.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-3 rounded-full border border-emerald-500/40 bg-white/10 text-emerald-100 inline-flex items-center gap-2 text-sm"
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live artisan support 9am-10pm GMT+5:30
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Globe2,
                title: 'Islandwide delivery',
                body: 'Express options, duties guidance, and recyclable packaging tailored per region.',
              },
              {
                icon: Leaf,
                title: 'Certified upcycled',
                body: 'Tracked materials, low-impact finishes, and lifetime polishing credits.',
              },
              {
                icon: ShieldCheck,
                title: 'Care guarantee',
                body: 'One-year repairs on us + optional refresh kits to keep every piece glowing.',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl border border-emerald-900/60 bg-[rgba(255,255,255,0.04)] p-6 shadow-inner shadow-emerald-950/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-300/30 flex items-center justify-center text-emerald-200">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-emerald-100/80 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

