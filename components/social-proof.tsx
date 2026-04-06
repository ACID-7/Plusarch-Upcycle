"use client"

import { motion } from 'framer-motion'
import { Leaf, PackageCheck, Recycle } from 'lucide-react'

const proofItems = [
  { label: 'Handmade pieces delivered', value: '200+', icon: PackageCheck },
  { label: 'Materials rescued from waste streams', value: '85%', icon: Leaf },
  { label: 'Upcycled design collections launched', value: '12+', icon: Recycle },
]

export function SocialProof() {
  return (
    <section className="relative overflow-hidden bg-stone-950 px-4 py-14 text-stone-50 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-8 max-w-2xl"
        >
          <p className="mb-3 text-sm uppercase tracking-[0.28em] text-emerald-300">Trusted by conscious shoppers</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built around craft, reuse, and repeat customers.
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {proofItems.map((item, index) => (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <item.icon className="mb-4 h-6 w-6 text-emerald-300" />
              <div className="mb-2 text-3xl font-semibold text-white">{item.value}</div>
              <p className="text-sm leading-6 text-stone-300">{item.label}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
