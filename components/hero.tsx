"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Recycle, Heart, Star } from 'lucide-react'

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isCompact, setIsCompact] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 768)
    handleResize()

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    controls.start({
      background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`,
    })
  }, [mousePosition, controls])

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-gradient-to-br from-[#07100c] via-emerald-900/30 to-[#050b08] py-12 sm:py-16"
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0"
        animate={controls}
        transition={{ duration: 0.3 }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 hidden md:block">
        {[...Array(isCompact ? 8 : 20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-400/30 rounded-full"
            initial={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              scale: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              y: [null, -100],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glassmorphism container */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 container mx-auto px-4 text-center"
      >
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-12 border border-white/20 shadow-2xl">
          {/* Animated icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 sm:mb-8 shadow-lg"
          >
            <Recycle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-6 bg-gradient-to-r from-white via-emerald-100 to-green-200 bg-clip-text text-transparent drop-shadow-md"
          >
            Eco-Friendly Accessories
            <br />
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="inline-flex flex-col items-center text-emerald-200"
            >
              Upcycled & Handmade in Sri Lanka
              <div className="mt-3 h-1 w-[82%] overflow-hidden rounded-full">
                <motion.div
                  className="h-full w-full rounded-full bg-gradient-to-r from-emerald-300 to-green-500 origin-center"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                />
              </div>
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-sm sm:text-base md:text-xl text-gray-300 mb-7 sm:mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Discover unique, sustainable jewelry pieces crafted from upcycled materials.
            Each item tells a story of transformation and environmental consciousness, with carbon-light packaging and global shipping.
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-6 mb-7 sm:mb-8"
          >
            {[
              { icon: Sparkles, text: "Handcrafted", color: "text-yellow-400" },
              { icon: Heart, text: "Sustainable", color: "text-pink-400" },
              { icon: Star, text: "Unique", color: "text-blue-400" },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-white/10"
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-white/90 text-xs sm:text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            >
              <Link href="/catalog">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Browse Collection
                </Button>
              </motion.div>
            </Link>

            <Link href="/contact">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-3 rounded-full transition-all duration-300"
                >
                  Custom Order
                </Button>
              </motion.div>
            </Link>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-slate-900 bg-white/90 hover:bg-white font-semibold px-8 py-3 rounded-full transition-all duration-300 border border-emerald-100/60"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('openChat', { detail: { mode: 'person' } }))
                }}
              >
                <Star className="w-5 h-5 mr-2 text-emerald-600" />
                Talk to a Specialist
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.0 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
