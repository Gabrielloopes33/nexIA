"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Trash2,
  AlertTriangle,
  Search,
  RotateCcw,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useContacts, Contact } from "@/hooks/use-contacts"
import { useOrganizationId } from "@/lib/contexts/organization-context"

// Helper to calculate days remaining (30 days from deletion)
function calcularDiasRestantes(deletedAt: string): number {
  const deleted = new Date(deletedAt)
  const expiration = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diff = expiration.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getExpirationBadge(dias: number) {
  if (dias > 14) {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        {dias} dias restantes
      </Badge>
    )
  } else if (dias >= 7) {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        {dias} dias restantes
      </Badge>
    )
  } else {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
        {dias} dias restantes
      </Badge>
    )
  }
}

// Helper to get initials from name
function getInitials(name?: string | null, phone?: string): string {
  const text = name || phone || ""
  return text.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function LixeiraPage() {
  const organizationId = useOrganizationId() ?? ''
  const { 
    contacts, 
    total, 
    isLoading, 
    restoreContact, 
    deleteContact 
  } = useContacts(organizationId, {
    includeDeleted: true,
  })
  
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isEmptyDialogOpen, setIsEmptyDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  // Filter only deleted contacts and by search
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => c.deletedAt) // Only show deleted contacts
      .filter((contact) => {
        const searchLower = search.toLowerCase()
        const name = contact.name || contact.phone || ""
        const metadata = contact.metadata as Record<string, string> | undefined
        return (
          name.toLowerCase().includes(searchLower) ||
          (metadata?.email?.toLowerCase() || "").includes(searchLower) ||
          (metadata?.company?.toLowerCase() || "").includes(searchLower)
        )
      })
  }, [contacts, search])

  const selectedContacts = useMemo(() => {
    return filteredContacts.filter((c) => selectedIds.includes(c.id))
  }, [filteredContacts, selectedIds])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredContacts.map((c) => c.id))
    }
  }

  const handleRestore = async (contact: Contact) => {
    const success = await restoreContact(contact.id)
    if (success) {
      setSelectedIds((prev) => prev.filter((id) => id !== contact.id))
      toast.success(`Contato "${contact.name || contact.phone}" restaurado com sucesso`)
    }
  }

  const handleRestoreSelected = async () => {
    let successCount = 0
    for (const id of selectedIds) {
      const success = await restoreContact(id)
      if (success) successCount++
    }
    setSelectedIds([])
    toast.success(`${successCount} contato(s) restaurado(s) com sucesso`)
  }

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (contactToDelete) {
      const success = await deleteContact(contactToDelete.id)
      if (success) {
        setSelectedIds((prev) => prev.filter((id) => id !== contactToDelete.id))
        setIsDeleteDialogOpen(false)
        setContactToDelete(null)
        toast.success("Contato excluído permanentemente")
      }
    }
  }

  const handleEmptyTrash = async () => {
    let successCount = 0
    for (const contact of filteredContacts) {
      const success = await deleteContact(contact.id)
      if (success) successCount++
    }
    setSelectedIds([])
    setIsEmptyDialogOpen(false)
    toast.success(`Lixeira esvaziada. ${successCount} contato(s) excluído(s) permanentemente`)
  }

  const hasSelection = selectedIds.length > 0
  const deletedCount = filteredContacts.length

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lixeira</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {deletedCount} contato{deletedCount !== 1 ? "s" : ""} ser{deletedCount !== 1 ? "ão" : "á"} excluído{deletedCount !== 1 ? "s" : ""} permanentemente após 30 dias
            </p>
          </div>
          {deletedCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsEmptyDialogOpen(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Esvaziar Lixeira
            </Button>
          )}
        </div>

        <Separator className="mb-6" />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          </div>
        ) : deletedCount === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Lixeira vazia</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Nenhum contato foi excluído recentemente
              </p>
              <Button asChild variant="outline">
                <Link href="/contatos">Ver todos os contatos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Banner informativo */}
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Contatos são excluídos permanentemente após 30 dias. Restaure-os antes que o prazo expire.
              </p>
            </div>

            {/* Barra de busca */}
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Ações em massa */}
            {hasSelection && (
              <div className="mb-4 flex items-center justify-between rounded-md bg-[#46347F]/10 p-3">
                <span className="text-sm font-medium">
                  {selectedIds.length} contato{selectedIds.length !== 1 ? "s" : ""} selecionado{selectedIds.length !== 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestoreSelected}
                    className="text-[#46347F] hover:text-[#46347F] hover:bg-[#46347F]/20"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar selecionados
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds([])}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir permanentemente
                  </Button>
                </div>
              </div>
            )}

            {/* Tabela */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredContacts.length > 0 &&
                            selectedIds.length === filteredContacts.length
                          }
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Excluído em</TableHead>
                      <TableHead>Excluído por</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => {
                      const diasRestantes = calcularDiasRestantes(contact.deletedAt!)
                      const isSelected = selectedIds.includes(contact.id)
                      const metadata = contact.metadata as Record<string, string> | undefined

                      return (
                        <TableRow key={contact.id} className={cn(isSelected && "bg-[#46347F]/5")}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(contact.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium"
                                style={{
                                  backgroundColor: "#E8E7F7",
                                  color: "#555",
                                }}
                              >
                                {getInitials(contact.name, contact.phone)}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {contact.name || contact.phone}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {metadata?.company || ""}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {metadata?.email || "-"}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(contact.deletedAt!)}</TableCell>
                          <TableCell>
                            <span className="text-sm">-</span> {/* excluidoPor not in API */}
                          </TableCell>
                          <TableCell>{getExpirationBadge(diasRestantes)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRestore(contact)}
                                  className="text-[#46347F]"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Restaurar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(contact)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir Permanentemente
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog Esvaziar Lixeira */}
        <Dialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Esvaziar Lixeira</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-4">
              Esta ação excluirá permanentemente todos os{" "}
              <strong>{deletedCount}</strong> contatos da lixeira. Esta ação NÃO pode ser
              desfeita.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmptyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEmptyTrash}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Esvaziar Lixeira
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Excluir Individual */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Excluir Permanentemente</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-4">
              Tem certeza que deseja excluir permanentemente o contato &quot;
              <strong>
                {contactToDelete?.name || contactToDelete?.phone}
              </strong>
              &quot;? Esta ação não pode ser desfeita.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
