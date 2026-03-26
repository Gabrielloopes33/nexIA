import { Spinner } from '@/components/ui/spinner'

/**
 * Loading State para a página de boas-vindas
 * 
 * Exibe um spinner simples centralizado
 */
export default function OnboardingBemVindoLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-12">
      <Spinner className="size-10" />
      <p className="mt-4 text-sm text-gray-500">Preparando tudo...</p>
    </div>
  )
}
