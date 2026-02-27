"use client"

import { useState } from "react"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MOCK_TAGS } from "@/lib/mock/tags"
import { CONTACT_STATUS_OPTIONS } from "@/lib/mock/contacts"

interface ContactFiltersProps {
  onSearch: (query: string) => void
  onFilterTags: (tagIds: string[]) => void
  onFilterStatus: (statuses: string[]) => void
  selectedTags: string[]
  selectedStatuses: string[]
}

export function ContactFilters({
  onSearch,
  onFilterTags,
  onFilterStatus,
  selectedTags,
  selectedStatuses,
}: ContactFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Tag Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-0 shadow-sm">
            <Filter className="h-4 w-4" />
            Tags
            {selectedTags.length > 0 && (
              <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#9795e4] px-1.5 text-xs font-medium text-white">
                {selectedTags.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {MOCK_TAGS.map((tag) => (
            <DropdownMenuCheckboxItem
              key={tag.id}
              checked={selectedTags.includes(tag.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onFilterTags([...selectedTags, tag.id])
                } else {
                  onFilterTags(selectedTags.filter((id) => id !== tag.id))
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.cor }}
                />
                <span className="flex-1">{tag.nome}</span>
                <span className="text-xs text-muted-foreground">({tag.contatosCount})</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-0 shadow-sm">
            <Filter className="h-4 w-4" />
            Status
            {selectedStatuses.length > 0 && (
              <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#9795e4] px-1.5 text-xs font-medium text-white">
                {selectedStatuses.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {CONTACT_STATUS_OPTIONS.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.value}
              checked={selectedStatuses.includes(status.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onFilterStatus([...selectedStatuses, status.value])
                } else {
                  onFilterStatus(selectedStatuses.filter((s) => s !== status.value))
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span>{status.label}</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {(selectedTags.length > 0 || selectedStatuses.length > 0 || searchQuery) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={() => {
            setSearchQuery("")
            onSearch("")
            onFilterTags([])
            onFilterStatus([])
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
