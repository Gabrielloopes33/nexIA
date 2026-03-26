'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

import { ProgressSteps } from '@/components/onboarding/progress-steps'
import { StepDadosEmpresa } from '@/components/onboarding/steps/step-dados-empresa'
import { StepLogo } from '@/components/onboarding/steps/step-logo'
import { StepConvites } from '@/components/onboarding/steps/step-convites'
import { useOnboarding } from '@/hooks/use-onboarding'
import { Spinner } from '@/components/ui/spinner'

const steps = [
  { label: 'Dados' },
  { label: 'Logo' },
  { label: 'Convites' },
]

interface Organization {
  id: string
  name: string
  slug: string
  status: string
  setupComplete: boolean
  logoUrl: string | null
  segment: string | null
  role: string | null
}

/**
 * Página de Onboarding da Organização
 * 
 * Fluxo de 3 steps para configurar a organização:
 * 1. Dados da empresa (nome e segmento)
 * 2. Logo da empresa (opcional)
 * 3. Convites para equipe (opcional)
 */
export default function OnboardingOrganizacaoPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  // Busca a organização atual da sessão
  useEffect(() => {
    const fetchCurrentOrg = async () => {
      try {
        const response = await fetch('/api/user/current-organization')
        if (response.ok) {
          const data = await response.json()
          setOrganization(data)
        } else if (response.status === 401) {
          setOrganization(null)
        } else {
          console.error('Erro ao buscar organização:', await response.text())
          setOrganization(null)
        }
      } catch (error) {
        console.error('Erro ao buscar organização:', error)
        setOrganization(null)
      } finally {
        setIsLoadingOrg(false)
        setHasChecked(true)
      }
    }

    fetchCurrentOrg()
  }, [])

  const handleComplete = useCallback(() => {
    router.push('/onboarding/bem-vindo')
  }, [router])

  const {
    data,
    currentStep,
    isLoading,
    updateData,
    nextStep,
    previousStep,
    submitOnboarding,
  } = useOnboarding({
    organizationId: organization?.id || '',
    onComplete: handleComplete,
  })

  // Redireciona se não tiver organização ou se setup já estiver completo
  useEffect(() => {
    if (hasChecked && !isLoadingOrg) {
      if (!organization) {
        const timer = setTimeout(() => {
          toast.error('Você precisa estar logado para acessar esta página')
          router.push('/login?from=/onboarding/organizacao')
        }, 500)
        return () => clearTimeout(timer)
      }

      // Redireciona se o setup já estiver completo
      if (organization.setupComplete) {
        router.push('/dashboard')
      }
    }
  }, [organization, isLoadingOrg, hasChecked, router])

  const handleStep1Complete = useCallback(async () => {
    await nextStep()
  }, [nextStep])

  const handleStep2Complete = useCallback(() => {
    nextStep()
  }, [nextStep])

  const handleStep3Complete = useCallback(async () => {
    const success = await submitOnboarding()
    if (success) {
      // O redirecionamento é feito pelo onComplete do hook
    }
  }, [submitOnboarding])

  // Loading state - mostra dentro do card
  if (isLoadingOrg || !hasChecked) {
    return (
      <div className="w-full max-w-[600px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50"
        >
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner className="size-8" />
            <p className="mt-4 text-sm text-gray-500">Carregando...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Se não tem organização, mostra mensagem de erro no card
  if (!organization) {
    return (
      <div className="w-full max-w-[600px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50"
        >
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para acessar esta página.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[600px]">
      {/* Card Principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configurar Organização
          </h1>
          <p className="text-gray-600">
            Vamos personalizar sua experiência no NexIA
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <ProgressSteps
            currentStep={currentStep}
            steps={steps}
          />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <StepDadosEmpresa
              key="step1"
              data={{ name: data.name, segment: data.segment }}
              onChange={(newData) => updateData(newData)}
              onNext={handleStep1Complete}
            />
          )}

          {currentStep === 2 && (
            <StepLogo
              key="step2"
              logoUrl={data.logoUrl}
              onChange={(logoUrl) => updateData({ logoUrl })}
              onNext={handleStep2Complete}
              onBack={previousStep}
            />
          )}

          {currentStep === 3 && (
            <StepConvites
              key="step3"
              emails={data.inviteEmails}
              onChange={(emails) => updateData({ inviteEmails: emails })}
              onNext={handleStep3Complete}
              onBack={previousStep}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
            <Spinner className="size-8" />
            <p className="mt-3 text-sm text-gray-600">
              Salvando configurações...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
