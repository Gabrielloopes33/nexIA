'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  children: React.ReactNode
  className?: string
  showAnimation?: boolean
}

const auroraGradient = `
  radial-gradient(ellipse 80% 60% at 70% 20%, rgba(175, 109, 255, 0.85), transparent 68%),
  radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.75), transparent 68%),
  radial-gradient(ellipse 60% 50% at 60% 65%, rgba(255, 235, 170, 0.98), transparent 68%),
  radial-gradient(ellipse 65% 40% at 50% 60%, rgba(120, 190, 255, 0.3), transparent 68%),
  linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
`

export function AuroraBackground({
  children,
  className,
  showAnimation = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen w-full overflow-hidden',
        className
      )}
      style={{
        background: auroraGradient,
      }}
    >
      {/* Animated overlay for subtle movement effect */}
      {showAnimation && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 20%, rgba(175, 109, 255, 0.3), transparent 68%),
              radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.25), transparent 68%)
            `,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Content container */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  )
}
