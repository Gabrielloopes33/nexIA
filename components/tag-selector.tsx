/**
 * TagSelector Component
 * Multi-select tag input com dropdown de tags reais da API
 */

'use client'

import { useState, useMemo } from 'react'
import { Check, Plus, Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagBadge } from '@/components/ui/tag-badge'
import type { TagColor } from '@/lib/types/tag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags } from '@/hooks/use-tags'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface TagSelectorProps {
  /** IDs das tags selecionadas */
  selectedTagIds: string[]
  /** Callback quando seleção muda */
  onChange: (tagIds: string[]) => void
  /** Placeholder do input */
  placeholder?: string
  /** Número máximo de tags permitidas */
  maxTags?: number
  /** Se true, permite criar novas tags */
  allowCreate?: boolean
  /** Classes CSS adicionais */
  className?: string
}

export function TagSelector({
  selectedTagIds,
  onChange,
  placeholder = 'Buscar tags...',
  maxTags = 20,
  allowCreate = false,
  className
}: TagSelectorProps) {
  const organizationId = useOrganizationId() ?? ''
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Buscar tags da API real
  const { tags, isLoading } = useTags(organizationId)
  
  // Helper para buscar tag por ID
  const getTagById = (id: string) => tags.find(t => t.id === id)
  
  // Tags selecionadas completas
  const selectedTags = useMemo(
    () => selectedTagIds.map(id => getTagById(id)).filter(Boolean) as typeof tags,
    [selectedTagIds, tags]
  )
  
  // Filtrar tags por busca
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [searchQuery, tags])
  
  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      if (selectedTagIds.length < maxTags) {
        onChange([...selectedTagIds, tagId])
      }
    }
  }
  
  // Remove tag
  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId))
  }
  
  // Clear all tags
  const clearAll = () => {
    onChange([])
  }
  
  return (
    <div className={cn('relative', className)}>
      {/* Selected Tags Display */}
      <div className="rounded-sm shadow-sm bg-card p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color as TagColor}
                  size="sm"
                  removable
                  onRemove={() => removeTag(tag.id)}
                />
              ))}
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar tudo
              </button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhuma tag selecionada
            </span>
          )}
        </div>
        
        {/* Search Input */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pl-9 rounded-sm border"
              disabled={isLoading}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {selectedTags.length}/{maxTags}
          </span>
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[400px] overflow-y-auto rounded-sm shadow-lg bg-card">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando tags...</span>
              </div>
            )}
            
            {/* Tags List */}
            {!isLoading && (
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    📂 Tags Disponíveis
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({filteredTags.length})
                  </span>
                </div>
                
                {filteredTags.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors',
                          'hover:bg-accent',
                          selectedTagIds.includes(tag.id) && 'bg-primary/10'
                        )}
                      >
                        <div className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border',
                          selectedTagIds.includes(tag.id) 
                            ? 'border-primary bg-primary' 
                            : 'border-border'
                        )}>
                          {selectedTagIds.includes(tag.id) && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <TagBadge name={tag.name} color={tag.color as TagColor} size="sm" />
                        {tag._count?.contactTags !== undefined && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {tag._count.contactTags}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? `Nenhuma tag encontrada para "${searchQuery}"`
                        : "Nenhuma tag disponível"
                      }
                    </p>
                    {allowCreate && searchQuery && (
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar nova tag
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Create New Tag Section */}
            {allowCreate && !showCreateForm && !isLoading && filteredTags.length > 0 && (
              <div className="border-t border-border p-3">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar nova tag
                </Button>
              </div>
            )}
            
            {/* Create Form (placeholder - would be full component) */}
            {showCreateForm && (
              <div className="border-t border-border bg-accent p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Formulário de criação de tag (implementar)
                </p>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
