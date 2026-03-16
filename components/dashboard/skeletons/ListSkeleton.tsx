'use client';

interface ListSkeletonProps {
  itemCount?: number;
  showHeader?: boolean;
}

/**
 * Skeleton específico para cards com lista de itens
 * Usado em: RecoveryCard, LossReasonsCard
 */
export function ListSkeleton({ itemCount = 5, showHeader = true }: ListSkeletonProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-100 rounded skeleton-shimmer" />
          <div className="h-4 w-16 bg-gray-100 rounded skeleton-shimmer" />
        </div>
      )}
      
      {/* List items */}
      <div className="flex-1 space-y-3">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {/* Avatar/Icon placeholder */}
            <div className="w-10 h-10 rounded-full bg-gray-100 skeleton-shimmer flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="h-4 w-3/4 bg-gray-100 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 rounded skeleton-shimmer" />
            </div>
            
            {/* Value */}
            <div className="h-5 w-16 bg-gray-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="h-4 w-32 bg-gray-100 rounded skeleton-shimmer mx-auto" />
      </div>
    </div>
  );
}
