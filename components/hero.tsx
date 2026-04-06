"use client"

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Recycle, Heart, Star } from 'lucide-react'

export function Hero() {
  const [particleOffsets, setParticleOffsets] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth < 768
      setParticleOffsets(Array.from({ length: compact ? 6 : 12 }, (_, index) => index))
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    let frameId = 0

    const updateSpotlight = (event: PointerEvent) => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        sectionRef.current?.style.setProperty('--spotlight-x', `${event.clientX}px`)
        sectionRef.current?.style.setProperty('--spotlight-y', `${event.clientY}px`)
      })
    }

    window.addEventListener('pointermove', updateSpotlight, { passive: true })

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
      window.removeEventListener('pointermove', updateSpotlight)
    }
  }, [prefersReducedMotion])

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-gradient-to-br from-[#07100c] via-emerald-900/30 to-[#050b08] py-12 sm:py-16"
      style={
        {
          '--spotlight-x': '50%',
          '--spotlight-y': '20%',
        } as CSSProperties
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background: prefersReducedMotion
            ? 'radial-gradient(circle at 50% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 45%)'
            : 'radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), rgba(34, 197, 94, 0.1) 0%, transparent 45%)',
        }}
      />

      <div className="absolute inset-0 hidden md:block">
        {particleOffsets.map((offset) => (
          <motion.div
            key={offset}
            className="absolute h-2 w-2 rounded-full bg-green-400/30"
            initial={{
              left: `${(offset * 17) % 100}%`,
              top: `${(offset * 23) % 100}%`,
              scale: 0,
            }}
            animate={prefersReducedMotion ? { opacity: 0.35 } : { scale: [0, 1, 0], y: [0, -80] }}
            transition={{
              duration: 3 + (offset % 4),
              repeat: prefersReducedMotion ? 0 : Infinity,
              delay: offset * 0.12,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative z-10 container mx-auto px-4 text-center"
      >
        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg sm:mb-8 sm:h-20 sm:w-20"
          >
            <Recycle className="h-8 w-8 text-white sm:h-10 sm:w-10" />
          </motion.div>

          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-5 text-3xl font-bold text-transparent drop-shadow-md sm:mb-6 sm:text-4xl md:text-6xl lg:text-7xl"
          >
            <span className="bg-gradient-to-r from-white via-emerald-100 to-green-200 bg-clip-text">
              Eco-Friendly Accessories
            </span>
            <br />
            <motion.span
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="inline-flex flex-col items-center text-emerald-200"
            >
              Upcycled & Handmade in Sri Lanka
              <div className="mt-3 h-1 w-[82%] overflow-hidden rounded-full">
                <motion.div
                  className="h-full w-full origin-center rounded-full bg-gradient-to-r from-emerald-300 to-green-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.95 }}
                />
              </div>
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-gray-300 sm:mb-8 sm:text-base md:text-xl"
          >
            Discover unique, sustainable jewelry pieces crafted from upcycled materials.
            Each item tells a story of transformation and environmental consciousness, with carbon-light packaging and global shipping.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mb-7 flex flex-wrap justify-center gap-2 sm:mb-8 sm:gap-3 md:gap-6"
          >
            {[
              { icon: Sparkles, text: 'Handcrafted', color: 'text-yellow-400' },
              { icon: Heart, text: 'Sustainable', color: 'text-pink-400' },
              { icon: Star, text: 'Unique', color: 'text-blue-400' },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.35, delay: 1 + index * 0.08 }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2"
              >
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-xs font-medium text-white/90 sm:text-sm">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link href="/catalog">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="w-full rounded-full border-0 bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl sm:w-auto"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Browse Collection
                </Button>
              </motion.div>
            </Link>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                size="lg"
                className="w-full rounded-full border border-emerald-100/60 bg-white/90 px-8 py-3 font-semibold text-slate-900 transition-all duration-300 hover:bg-white sm:w-auto"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('openChat', { detail: { mode: 'person', prefill: 'Hi, I need to talk to a specialist.' } }))
                }}
              >
                <Star className="mr-2 h-5 w-5 text-emerald-600" />
                Talk to a Specialist
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  )
}
