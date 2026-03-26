'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

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
  const [hasChecked, setHasChecked] = useState(false)

  // Busca o nome da organização
  useEffect(() => {
    if (organization?.name) {
      setOrgName(organization.name)
    }
  }, [organization])

  // Redireciona apenas após confirmar que não tem organização
  useEffect(() => {
    if (!isLoading && !hasChecked) {
      setHasChecked(true)
      
      if (!organization) {
        const timer = setTimeout(() => {
          toast.error('Você precisa estar logado para acessar esta página')
          router.push('/login?from=/onboarding/bem-vindo')
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [organization, isLoading, hasChecked, router])

  const handleStart = () => {
    router.push('/dashboard')
  }

  // Loading state - dentro do card
  if (isLoading || !hasChecked) {
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

  // Se não tem organização, mostra mensagem no card
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50"
      >
        <WelcomeScreen
          organizationName={orgName}
          onStart={handleStart}
        />
      </motion.div>
    </div>
  )
}
