/**
 * TagSelector Component
 * Multi-select tag input with 3-section dropdown:
 * 1. Popular Tags (top 10)
 * 2. All Tags (grouped by category)
 * 3. Create New Tag
 */

'use client'

import { useState, useMemo } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagBadge } from '@/components/ui/tag-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MOCK_TAGS, 
  POPULAR_TAGS, 
  TAGS_BY_CATEGORY,
  getTagById,
  searchTags 
} from '@/lib/mock-tags'
import { TAG_CATEGORY_LABELS } from '@/lib/types/tag'
import type { Tag, TagCategory } from '@/lib/types/tag'

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
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Tags selecionadas completas
  const selectedTags = useMemo(
    () => selectedTagIds.map(id => getTagById(id)).filter(Boolean) as Tag[],
    [selectedTagIds]
  )
  
  // Filtrar tags por busca
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_TAGS
    return searchTags(searchQuery)
  }, [searchQuery])
  
  // Popular tags não selecionadas
  const availablePopularTags = useMemo(
    () => POPULAR_TAGS.filter(tag => !selectedTagIds.includes(tag.id)),
    [selectedTagIds]
  )
  
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
      <div className="rounded-sm border-2 border-border bg-card p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
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
              className="pl-9 rounded-sm border-2"
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
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[400px] overflow-y-auto rounded-sm border-2 border-border bg-card shadow-lg">
            {/* Popular Tags Section */}
            {!searchQuery && availablePopularTags.length > 0 && (
              <div className="border-b-2 border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    📌 Tags Populares
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availablePopularTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        'border-2 hover:bg-accent',
                        selectedTagIds.includes(tag.id) 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border'
                      )}
                    >
                      <span>{tag.name}</span>
                      <span className="text-muted-foreground">({tag.usageCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* All Tags by Category */}
            <div className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  📂 Todas as Tags
                </span>
              </div>
              
              {(Object.keys(TAGS_BY_CATEGORY) as TagCategory[]).map(category => {
                const categoryTags = TAGS_BY_CATEGORY[category].filter(tag =>
                  filteredTags.includes(tag)
                )
                
                if (categoryTags.length === 0) return null
                
                return (
                  <div key={category} className="mb-4 last:mb-0">
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                      {TAG_CATEGORY_LABELS[category]}
                    </h4>
                    <div className="space-y-1">
                      {categoryTags.map(tag => (
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
                            'flex h-4 w-4 items-center justify-center rounded-sm border-2',
                            selectedTagIds.includes(tag.id) 
                              ? 'border-primary bg-primary' 
                              : 'border-border'
                          )}>
                            {selectedTagIds.includes(tag.id) && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>
                          <TagBadge name={tag.name} color={tag.color} size="sm" />
                          <span className="ml-auto text-xs text-muted-foreground">
                            {tag.usageCount}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              {filteredTags.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tag encontrada para "{searchQuery}"
                  </p>
                  {allowCreate && (
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
            
            {/* Create New Tag Section */}
            {allowCreate && !showCreateForm && filteredTags.length > 0 && (
              <div className="border-t-2 border-border p-3">
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
              <div className="border-t-2 border-border bg-accent p-4">
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
