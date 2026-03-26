import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading State para a página de onboarding da organização
 */
export default function OnboardingOrganizacaoLoading() {
  return (
    <div className="w-full max-w-[600px]">
      <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>

        {/* Progress Steps Skeleton */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-0.5 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-0.5 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <Skeleton className="h-7 w-48 mx-auto" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
