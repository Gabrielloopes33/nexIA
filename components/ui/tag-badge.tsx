/**
 * TagBadge Component
 * Componente reutilizável para exibir tags no formato pill
 * Suporta cores, tamanhos e modo removível
 */

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TagColor } from '@/lib/types/tag'
import { TAG_COLOR_MAP } from '@/lib/types/tag'

export interface TagBadgeProps {
  /** Nome da tag a exibir */
  name: string
  /** Cor da tag */
  color: TagColor
  /** Tamanho do badge */
  size?: 'sm' | 'md'
  /** Se true, mostra botão X para remover */
  removable?: boolean
  /** Callback quando tag é removida */
  onRemove?: () => void
  /** Classes CSS adicionais */
  className?: string
}

/**
 * Componente TagBadge
 * 
 * @example
 * ```tsx
 * <TagBadge name="VIP" color="yellow" size="sm" />
 * <TagBadge 
 *   name="Demo Solicitada" 
 *   color="green" 
 *   removable 
 *   onRemove={() => console.log('Removed')} 
 * />
 * ```
 */
export function TagBadge({
  name,
  color,
  size = 'sm',
  removable = false,
  onRemove,
  className
}: TagBadgeProps) {
  const colors = TAG_COLOR_MAP[color]
  
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        colors.bg,
        colors.text,
        sizeClasses[size],
        removable && 'pr-1.5',
        className
      )}
    >
      <span className="truncate">{name}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className={cn(
            'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors',
            'hover:bg-black/10',
            colors.text
          )}
          aria-label={`Remover tag ${name}`}
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

/**
 * TagBadgeList Component
 * Lista horizontal de tags com scroll
 */
export interface TagBadgeListProps {
  /** Array de tags para exibir */
  tags: Array<{ id: string; name: string; color: TagColor }>
  /** Número máximo de tags a exibir */
  maxDisplay?: number
  /** Tamanho dos badges */
  size?: 'sm' | 'md'
  /** Se true, mostra botão X em cada tag */
  removable?: boolean
  /** Callback quando tag é removida */
  onRemoveTag?: (tagId: string) => void
  /** Classes CSS adicionais */
  className?: string
}

export function TagBadgeList({
  tags,
  maxDisplay = 5,
  size = 'sm',
  removable = false,
  onRemoveTag,
  className
}: TagBadgeListProps) {
  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = Math.max(0, tags.length - maxDisplay)
  
  if (tags.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Nenhuma tag
      </span>
    )
  }
  
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {displayTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          size={size}
          removable={removable}
          onRemove={() => onRemoveTag?.(tag.id)}
        />
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
