'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'

import { ProgressSteps } from '@/components/onboarding/progress-steps'
import { StepDadosEmpresa } from '@/components/onboarding/steps/step-dados-empresa'
import { StepLogo } from '@/components/onboarding/steps/step-logo'
import { StepConvites } from '@/components/onboarding/steps/step-convites'
import { useOnboarding } from '@/hooks/use-onboarding'
import { useOrganization } from '@/lib/contexts/organization-context'
import { Spinner } from '@/components/ui/spinner'

const steps = [
  { label: 'Dados' },
  { label: 'Logo' },
  { label: 'Convites' },
]

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
  const { organization, isLoading: isLoadingOrg } = useOrganization()

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

  // Redireciona se não tiver organização
  useEffect(() => {
    if (!isLoadingOrg && !organization) {
      toast.error('Você precisa estar logado para acessar esta página')
      router.push('/login?from=/onboarding/organizacao')
    }
  }, [organization, isLoadingOrg, router])

  // Redireciona se o setup já estiver completo
  useEffect(() => {
    // Assumindo que a organização tem uma propriedade setupComplete
    // ou podemos verificar de outra forma
    if (organization && 'setupComplete' in organization && (organization as any).setupComplete) {
      router.push('/dashboard')
    }
  }, [organization, router])

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

  // Loading state
  if (isLoadingOrg) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-12">
        <Spinner className="size-8" />
        <p className="mt-4 text-sm text-gray-500">Carregando...</p>
      </div>
    )
  }

  // Se não tem organização, não renderiza nada (vai redirecionar)
  if (!organization) {
    return null
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
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
