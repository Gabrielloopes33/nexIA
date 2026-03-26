import { Spinner } from '@/components/ui/spinner'

/**
 * Loading State para a página de boas-vindas
 * 
 * Exibe um spinner simples centralizado
 */
export default function OnboardingBemVindoLoading() {
  return (
    <div className="w-full max-w-[600px]">
      <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50">
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="size-10" />
          <p className="mt-4 text-sm text-gray-500">Preparando tudo...</p>
        </div>
      </div>
    </div>
  )
}
