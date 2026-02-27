"use client"

import { Plus, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContactsHeaderProps {
  onNewContact?: () => void
  onImport?: () => void
  onExport?: () => void
}

export function ContactsHeader({ onNewContact, onImport, onExport }: ContactsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie relacionamentos e acompanhe interações
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="default" onClick={onImport}>
          <Upload className="h-4 w-4" />
          Importar
        </Button>
        <Button variant="outline" size="default" onClick={onExport}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        <Button variant="default" size="default" onClick={onNewContact}>
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
      </div>
    </div>
  )
}
