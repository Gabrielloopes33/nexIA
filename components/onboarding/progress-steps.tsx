'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  label: string
}

interface ProgressStepsProps {
  currentStep: number
  steps: Step[]
  className?: string
}

export function ProgressSteps({
  currentStep,
  steps,
  className,
}: ProgressStepsProps) {
  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isPending = stepNumber > currentStep

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 flex-1 relative"
            >
              {/* Connector line - left side */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute top-3 left-0 w-1/2 h-0.5 -translate-x-1/2 transition-colors duration-500',
                    isCompleted || isCurrent ? 'bg-purple-500' : 'bg-gray-300'
                  )}
                />
              )}

              {/* Connector line - right side */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-3 right-0 w-1/2 h-0.5 translate-x-1/2 transition-colors duration-500',
                    isCompleted ? 'bg-purple-500' : 'bg-gray-300'
                  )}
                />
              )}

              {/* Step circle */}
              <motion.div
                className={cn(
                  'relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-500',
                  isCompleted && 'bg-green-500 border-green-500 size-8',
                  isCurrent && 'bg-purple-600 border-purple-600 size-10 shadow-lg',
                  isPending && 'bg-white border-gray-300 size-8'
                )}
                animate={
                  isCurrent
                    ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(147, 51, 234, 0.4)',
                          '0 0 0 8px rgba(147, 51, 234, 0)',
                          '0 0 0 0 rgba(147, 51, 234, 0.4)',
                        ],
                      }
                    : {}
                }
                transition={
                  isCurrent
                    ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : {}
                }
              >
                {isCompleted && (
                  <Check className="size-4 text-white stroke-[3]" />
                )}
                {isCurrent && (
                  <span className="text-white text-sm font-semibold">
                    {stepNumber}
                  </span>
                )}
                {isPending && (
                  <span className="text-gray-400 text-sm font-medium">
                    {stepNumber}
                  </span>
                )}
              </motion.div>

              {/* Step label */}
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-300 text-center',
                  isCurrent && 'text-purple-700',
                  isCompleted && 'text-green-600',
                  isPending && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
