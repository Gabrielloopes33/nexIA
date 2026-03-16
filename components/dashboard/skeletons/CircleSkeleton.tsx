'use client';

/**
 * Skeleton específico para cards com indicador circular
 * Usado em: HealthScoreCard
 */
export function CircleSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="h-6 w-32 bg-gray-100 rounded skeleton-shimmer mb-6" />
      
      {/* Circle */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Outer circle */}
          <div className="w-32 h-32 rounded-full bg-gray-100 skeleton-shimmer" />
          {/* Inner content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-16 bg-gray-200 rounded skeleton-shimmer mx-auto mb-2" />
              <div className="h-4 w-10 bg-gray-200 rounded skeleton-shimmer mx-auto" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-center">
        <div className="h-4 w-24 bg-gray-100 rounded skeleton-shimmer mx-auto" />
      </div>
    </div>
  );
}
