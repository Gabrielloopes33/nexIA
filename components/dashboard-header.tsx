import { Bell, Plus, Calendar, User, Download, ChevronDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-[32px] font-bold leading-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oi John, Bem-vindo de volta
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Period Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-10 items-center gap-2 rounded-sm border-2 border-border bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Período</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                Últimos 7 dias
              </button>
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                Últimos 30 dias
              </button>
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                Este mês
              </button>
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                Mês passado
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-10 items-center gap-2 rounded-sm border-2 border-border bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Todos usuários</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary bg-secondary">
                Todos usuários
              </button>
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                João Silva
              </button>
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                Maria Santos
              </button>
              <button className="rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary">
                Pedro Oliveira
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Export Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 items-center gap-2 rounded-sm border-2 border-border bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Exportar</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <span className="text-sm">Exportar PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="text-sm">Exportar Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="text-sm">Exportar CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />
        
        {/* Notifications */}
        <button className="relative flex h-10 items-center justify-center gap-2 rounded-sm border-2 border-border bg-card px-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="text-sm">Notificações</span>
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
            3
          </span>
        </button>
        {/* New Button */}
        <button className="flex h-10 items-center gap-2 rounded-sm bg-gradient-to-r from-[#9795e4] to-[#b3b3e5] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />
          <span>Novo Lead</span>
        </button>
      </div>
    </header>
  )
}
