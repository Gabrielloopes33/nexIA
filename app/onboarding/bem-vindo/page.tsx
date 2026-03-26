'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { WelcomeScreen } from '@/components/onboarding/welcome-screen'
import { useOrganization } from '@/lib/contexts/organization-context'
import { Spinner } from '@/components/ui/spinner'

/**
 * Página de Boas-vindas
 * 
 * Exibida após o onboarding ser concluído com sucesso.
 * Mostra mensagem de sucesso e ações rápidas.
 */
export default function OnboardingBemVindoPage() {
  const router = useRouter()
  const { organization, isLoading } = useOrganization()
  const [orgName, setOrgName] = useState('Sua Organização')

  // Busca o nome da organização
  useEffect(() => {
    if (organization?.name) {
      setOrgName(organization.name)
    }
  }, [organization])

  // Redireciona se não tiver organização
  useEffect(() => {
    if (!isLoading && !organization) {
      toast.error('Você precisa estar logado para acessar esta página')
      router.push('/login?from=/onboarding/bem-vindo')
    }
  }, [organization, isLoading, router])

  const handleStart = () => {
    router.push('/dashboard')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-12">
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
    <WelcomeScreen
      organizationName={orgName}
      onStart={handleStart}
    />
  )
}
