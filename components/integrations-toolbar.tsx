"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Props {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function IntegrationsToolbar({
  searchTerm,
  onSearchChange,
}: Props) {
  return (
    <div className="flex items-center gap-4">
      {/* Search */}
      <div className="relative w-[320px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar integrações..."
          className="h-10 rounded-sm shadow-sm border-0 pl-9"
        />
      </div>
    </div>
  )
}
