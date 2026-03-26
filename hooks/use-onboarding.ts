'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface OnboardingData {
  name: string
  segment: string
  slug: string
  logoUrl: string | null
  inviteEmails: string[]
}

interface UseOnboardingOptions {
  organizationId: string
  onComplete?: () => void
}

interface GenerateSlugResponse {
  slug: string
}

interface UpdateOrganizationData {
  name: string
  slug: string
  segment: string
  logoUrl: string | null
  setupComplete: true
}

interface InviteData {
  emails: string[]
  organizationId: string
}

export function useOnboarding({ organizationId, onComplete }: UseOnboardingOptions) {
  const queryClient = useQueryClient()
  
  // Estado do formulário
  const [data, setData] = useState<OnboardingData>({
    name: '',
    segment: '',
    slug: '',
    logoUrl: null,
    inviteEmails: [],
  })

  // Estado do step atual (1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1)

  // Mutation para gerar slug
  const generateSlugMutation = useMutation({
    mutationFn: async (name: string): Promise<string> => {
      const response = await fetch('/api/organizations/generate-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar slug')
      }

      const result: GenerateSlugResponse = await response.json()
      return result.slug
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar slug')
    },
  })

  // Mutation para atualizar organização
  const updateOrganizationMutation = useMutation({
    mutationFn: async (updateData: UpdateOrganizationData) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar organização')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalida o cache da organização
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar organização')
    },
  })

  // Mutation para enviar convites
  const sendInvitesMutation = useMutation({
    mutationFn: async (inviteData: InviteData) => {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao enviar convites')
      }

      return response.json()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar convites')
    },
  })

  // Atualiza dados do formulário
  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }, [])

  // Navegação entre steps
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const nextStep = useCallback(async () => {
    // Se estiver no step 1, gera o slug automaticamente
    if (currentStep === 1 && data.name && !data.slug) {
      try {
        const slug = await generateSlugMutation.mutateAsync(data.name)
        setData((prev) => ({ ...prev, slug }))
      } catch {
        // Erro já tratado no onError da mutation
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }, [currentStep, data.name, data.slug, generateSlugMutation])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  // Submissão final do onboarding
  const submitOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Atualiza a organização com todos os dados
      await updateOrganizationMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        segment: data.segment,
        logoUrl: data.logoUrl,
        setupComplete: true,
      })

      // 2. Envia convites se houver emails
      if (data.inviteEmails.length > 0) {
        await sendInvitesMutation.mutateAsync({
          emails: data.inviteEmails,
          organizationId,
        })
        toast.success(`${data.inviteEmails.length} convite(s) enviado(s) com sucesso!`)
      }

      toast.success('Organização configurada com sucesso!')
      onComplete?.()
      return true
    } catch {
      // Erros já tratados nos onError das mutations
      return false
    }
  }, [
    data,
    organizationId,
    updateOrganizationMutation,
    sendInvitesMutation,
    onComplete,
  ])

  // Loading state geral
  const isLoading = 
    generateSlugMutation.isPending ||
    updateOrganizationMutation.isPending ||
    sendInvitesMutation.isPending

  return {
    // Estado
    data,
    currentStep,
    isLoading,
    
    // Ações
    updateData,
    goToStep,
    nextStep,
    previousStep,
    submitOnboarding,
    
    // Estados individuais das mutations
    isGeneratingSlug: generateSlugMutation.isPending,
    isUpdatingOrganization: updateOrganizationMutation.isPending,
    isSendingInvites: sendInvitesMutation.isPending,
  }
}
