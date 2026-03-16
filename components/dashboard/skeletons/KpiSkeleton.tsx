'use client';

/**
 * Skeleton para item individual de KPI
 * Usado na coluna vertical de KPIs
 */
export function KpiSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-4 border-b">
      <div className="h-3 w-20 bg-gray-100 rounded skeleton-shimmer mb-2" />
      <div className="h-6 w-16 bg-gray-100 rounded skeleton-shimmer mb-1" />
      <div className="h-3 w-10 bg-gray-100 rounded skeleton-shimmer" />
    </div>
  );
}

/**
 * Skeleton para a coluna inteira de KPIs
 */
export function KpiColumnSkeleton() {
  return (
    <div className="h-full">
      {Array.from({ length: 5 }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}
