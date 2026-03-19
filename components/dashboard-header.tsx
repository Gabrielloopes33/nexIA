"use client"

import { Calendar, User, Download, ChevronDown, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useDashboard, DATE_RANGES } from "@/hooks/use-dashboard-context"
import { useFilteredData } from "@/hooks/use-filtered-data"
import { toast } from "sonner"

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
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { QuickLeadModal } from "@/components/leads/quick-lead-modal"

export function DashboardHeader() {
  const { dateRange, setDateRange, selectedUsers, toggleUser } = useDashboard()
  const { stats } = useFilteredData()
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [userName, setUserName] = useState("John")

  // Buscar nome do usuário logado
  useEffect(() => {
    const getUser = async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return
      const data = await res.json()
      const displayName = data.name || data.email?.split('@')[0] || 'John'
      setUserName(displayName.charAt(0).toUpperCase() + displayName.slice(1))
    }
    getUser()
  }, [])

  const handleSelectPeriod = (key: keyof typeof DATE_RANGES) => {
    setDateRange(DATE_RANGES[key])
    setOpen(false)
  }

  const exportToCSV = async () => {
    setIsExporting(true)
    
    try {
      const headers = ["Métrica", "Valor", "Período"]
      const rows = [
        ["Total de Leads", stats.total.toString(), dateRange.label],
        ["Taxa de Conversão", `${stats.conversionRate}%`, dateRange.label],
        ["Ticket Médio", `R$ ${stats.avgTicket.toLocaleString()}`, dateRange.label],
        ["Novos Leads", stats.newThisPeriod.toString(), dateRange.label],
      ]
      
      const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success("CSV exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar CSV:", error)
      toast.error("Erro ao exportar CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    
    try {
      const headers = ["Métrica", "Valor", "Período"]
      const rows = [
        ["Total de Leads", stats.total.toString(), dateRange.label],
        ["Taxa de Conversão", `${stats.conversionRate}%`, dateRange.label],
        ["Ticket Médio", `R$ ${stats.avgTicket.toLocaleString()}`, dateRange.label],
        ["Novos Leads", stats.newThisPeriod.toString(), dateRange.label],
      ]
      
      // Excel usa o mesmo formato CSV mas com extensão diferente
      const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.xls`
      link.click()
      
      toast.success("Excel exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar Excel:", error)
      toast.error("Erro ao exportar Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    
    try {
      // Fallback simples usando window.print()
      window.print()
      
      toast.success("PDF gerado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      toast.error("Erro ao exportar PDF")
    } finally {
      setIsExporting(false)
    }
  }

  // Lista de usuários disponíveis
  const users = [
    { id: "joao", name: "João Silva" },
    { id: "maria", name: "Maria Santos" },
    { id: "pedro", name: "Pedro Oliveira" },
  ]

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-[28px] font-bold leading-tight text-foreground">Início</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oi {userName}, bem-vindo de volta
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Period Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="flex h-8 items-center gap-2 rounded-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{dateRange.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              {(Object.keys(DATE_RANGES) as Array<keyof typeof DATE_RANGES>).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSelectPeriod(key)}
                  className={`rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary ${
                    dateRange.label === DATE_RANGES[key].label ? "bg-secondary" : ""
                  }`}
                >
                  {DATE_RANGES[key].label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-8 items-center gap-2 rounded-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {selectedUsers.length === 0 
                  ? "Todos usuários" 
                  : `${selectedUsers.length} usuário${selectedUsers.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  // Limpar seleção = todos usuários
                  selectedUsers.forEach((id) => toggleUser(id))
                }}
                className={`rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary ${
                  selectedUsers.length === 0 ? "bg-secondary" : ""
                }`}
              >
                Todos usuários
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary ${
                    selectedUsers.includes(user.id) ? "bg-secondary" : ""
                  }`}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Export Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex h-10 items-center gap-2 rounded-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Exportar</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
              <span className="text-sm">Exportar PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
              <span className="text-sm">Exportar Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
              <span className="text-sm">Exportar CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />
        
        {/* Notifications */}
        <NotificationDropdown />
        
        {/* New Lead Button */}
        <QuickLeadModal>
          <button className="flex h-8 items-center gap-2 rounded-sm bg-gradient-to-r from-[#8B7DB8] to-[#8B7DB8] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90">
            <span>Novo Lead</span>
          </button>
        </QuickLeadModal>
      </div>
    </header>
  )
}
