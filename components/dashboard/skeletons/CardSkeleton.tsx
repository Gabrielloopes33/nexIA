'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardSkeletonVariants = cva(
  // Base styles
  'bg-gray-100 rounded-lg skeleton-shimmer',
  {
    variants: {
      size: {
        default: 'p-6',
        compact: 'p-4',
        large: 'p-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface CardSkeletonProps extends VariantProps<typeof cardSkeletonVariants> {
  className?: string;
  header?: boolean;
  rows?: number;
}

/**
 * Componente base de Skeleton para cards
 * 
 * @example
 * <CardSkeleton header={true} rows={4} />
 * <CardSkeleton size="compact" rows={2} />
 */
export function CardSkeleton({ 
  className, 
  size, 
  header = true, 
  rows = 3 
}: CardSkeletonProps) {
  return (
    <div className={cn(cardSkeletonVariants({ size }), className)}>
      {/* Header */}
      {header && (
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      )}
      
      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              'h-4 bg-gray-200 rounded',
              i === rows - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  );
}
