/**
 * TagFilter Component
 * Filtro avançado de tags com lógica AND/OR e modo de exclusão
 * Para uso em toolbars de listagens
 */

'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TagBadge } from '@/components/ui/tag-badge'
import { getTagById } from '@/lib/mock-tags'
import type { TagFilter as TagFilterType } from '@/lib/types/tag'

export interface TagFilterProps {
  /** Filtro atual */
  filter: TagFilterType
  /** Callback quando filtro muda */
  onChange: (filter: TagFilterType) => void
  /** Classes CSS adicionais */
  className?: string
}

export function TagFilter({
  filter,
  onChange,
  className
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Contagem de filtros ativos
  const activeFiltersCount = filter.include.length + (filter.exclude?.length || 0)
  
  // Limpar filtros
  const clearFilters = () => {
    onChange({
      mode: 'OR',
      include: [],
      exclude: []
    })
  }
  
  // Toggle modo AND/OR
  const toggleMode = () => {
    onChange({
      ...filter,
      mode: filter.mode === 'AND' ? 'OR' : 'AND'
    })
  }
  
  // Remover tag de include
  const removeIncludeTag = (tagId: string) => {
    onChange({
      ...filter,
      include: filter.include.filter(id => id !== tagId)
    })
  }
  
  // Remover tag de exclude
  const removeExcludeTag = (tagId: string) => {
    onChange({
      ...filter,
      exclude: filter.exclude?.filter(id => id !== tagId) || []
    })
  }
  
  return (
    <div className={cn('relative', className)}>
      {/* Filter Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className={cn(
          'relative rounded-sm border-2',
          activeFiltersCount > 0 && 'border-primary bg-primary/10'
        )}
      >
        <Filter className="mr-2 h-4 w-4" />
        Filtrar por Tags
        {activeFiltersCount > 0 && (
          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {activeFiltersCount}
          </span>
        )}
      </Button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full z-50 mt-2 w-[400px] rounded-sm border-2 border-border bg-card shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Filtrar por Tags</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Mode Toggle */}
            <div className="border-b-2 border-border px-4 py-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Modo de Combinação
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onChange({ ...filter, mode: 'OR' })}
                  className={cn(
                    'flex-1 rounded-sm border-2 px-3 py-2 text-sm font-medium transition-colors',
                    filter.mode === 'OR'
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <div className="font-semibold">OR (Qualquer)</div>
                  <div className="text-xs opacity-80">
                    Mostra contatos com qualquer tag selecionada
                  </div>
                </button>
                <button
                  onClick={() => onChange({ ...filter, mode: 'AND' })}
                  className={cn(
                    'flex-1 rounded-sm border-2 px-3 py-2 text-sm font-medium transition-colors',
                    filter.mode === 'AND'
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <div className="font-semibold">AND (Todas)</div>
                  <div className="text-xs opacity-80">
                    Mostra contatos com todas as tags selecionadas
                  </div>
                </button>
              </div>
            </div>
            
            {/* Include Filters */}
            <div className="border-b-2 border-border px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Incluir Tags
                </span>
                {filter.include.length > 0 && (
                  <button
                    onClick={() => onChange({ ...filter, include: [] })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </button>
                )}
              </div>
              {filter.include.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {filter.include.map(tagId => {
                    const tag = getTagById(tagId)
                    if (!tag) return null
                    return (
                      <TagBadge
                        key={tagId}
                        name={tag.name}
                        color={tag.color}
                        size="sm"
                        removable
                        onRemove={() => removeIncludeTag(tagId)}
                      />
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma tag de inclusão selecionada
                </p>
              )}
            </div>
            
            {/* Exclude Filters */}
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Excluir Tags
                </span>
                {(filter.exclude?.length || 0) > 0 && (
                  <button
                    onClick={() => onChange({ ...filter, exclude: [] })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </button>
                )}
              </div>
              {(filter.exclude?.length || 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {filter.exclude!.map(tagId => {
                    const tag = getTagById(tagId)
                    if (!tag) return null
                    return (
                      <TagBadge
                        key={tagId}
                        name={tag.name}
                        color="gray"
                        size="sm"
                        removable
                        onRemove={() => removeExcludeTag(tagId)}
                      />
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma tag de exclusão selecionada
                </p>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="flex items-center justify-between  border-t-2 border-border px-4 py-3">
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
                disabled={activeFiltersCount === 0}
              >
                Limpar Filtros
              </button>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                className="rounded-sm"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Active Filters Display (outside dropdown) */}
      {activeFiltersCount > 0 && !isOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          
          {/* Include tags */}
          {filter.include.map(tagId => {
            const tag = getTagById(tagId)
            if (!tag) return null
            return (
              <TagBadge
                key={tagId}
                name={tag.name}
                color={tag.color}
                size="sm"
                removable
                onRemove={() => removeIncludeTag(tagId)}
              />
            )
          })}
          
          {/* Mode indicator */}
          {filter.include.length > 1 && (
            <span className="inline-flex items-center rounded-sm border border-border bg-accent px-2 py-0.5 text-xs font-medium">
              {filter.mode === 'AND' ? 'E' : 'OU'}
            </span>
          )}
          
          {/* Exclude tags */}
          {(filter.exclude?.length || 0) > 0 && (
            <>
              <span className="text-xs text-muted-foreground">excluindo:</span>
              {filter.exclude!.map(tagId => {
                const tag = getTagById(tagId)
                if (!tag) return null
                return (
                  <TagBadge
                    key={tagId}
                    name={tag.name}
                    color="gray"
                    size="sm"
                    removable
                    onRemove={() => removeExcludeTag(tagId)}
                  />
                )
              })}
            </>
          )}
          
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}
