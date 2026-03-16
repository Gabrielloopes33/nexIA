'use client';

/**
 * Skeleton específico para cards com gráficos
 * Usado em: RevenueCard, ChannelsCard
 */
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-gray-100 rounded skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-100 rounded skeleton-shimmer" />
          <div className="h-8 w-20 bg-gray-100 rounded skeleton-shimmer" />
        </div>
      </div>
      
      {/* Chart area */}
      <div className="h-64 bg-gray-50 rounded-lg skeleton-shimmer relative overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-px bg-gray-200 w-full" />
          ))}
        </div>
        {/* Placeholder bars/lines */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i}
              className="w-full bg-gray-200 rounded-t skeleton-shimmer"
              style={{ height: `${Math.max(20, 80 - i * 8)}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100 skeleton-shimmer" />
            <div className="h-4 w-20 bg-gray-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
