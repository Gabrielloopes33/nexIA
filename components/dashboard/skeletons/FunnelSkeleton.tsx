'use client';

/**
 * Skeleton específico para o card de Funil
 * Espelha a estrutura visual do FunnelCard
 */
export function FunnelSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-40 bg-gray-100 rounded skeleton-shimmer" />
        <div className="h-4 w-24 bg-gray-100 rounded skeleton-shimmer" />
      </div>
      
      {/* Funnel visualization */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="flex items-center gap-3"
            style={{ paddingLeft: `${i * 12}px` }}
          >
            <div 
              className="h-10 bg-gray-100 rounded skeleton-shimmer"
              style={{ width: `${100 - i * 15}%` }}
            />
            <div className="h-4 w-12 bg-gray-100 rounded skeleton-shimmer flex-shrink-0" />
          </div>
        ))}
      </div>
      
      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-gray-100 rounded skeleton-shimmer mb-2" />
            <div className="h-6 w-20 bg-gray-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
