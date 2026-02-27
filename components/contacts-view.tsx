"use client"

import { useState, useMemo } from "react"
import { Contact, ContactStatus, ContactSource } from "@/lib/types/contact"
import { getInitials } from "@/lib/utils"
import { ContactsHeader } from "@/components/contacts-header"
import { ContactsKPIs } from "@/components/contacts-kpis"
import { ContactsToolbar } from "@/components/contacts-toolbar"
import { ContactsTable } from "@/components/contacts-table"

// Mock data para contatos
const MOCK_CONTACTS: Contact[] = [
  {
    id: 1,
    nome: "Ana Silva",
    email: "ana.silva@techcorp.com",
    telefone: "11987654321",
    empresa: "TechCorp Inc.",
    cargo: "CEO",
    localizacao: "São Paulo, SP",
    fonte: "LinkedIn",
    status: "ativo",
    ultimoContato: "2026-02-24",
    avatar: getInitials("Ana Silva"),
    tags: ["VIP", "Decisor"],
    criadoEm: "2026-01-15",
    atualizadoEm: "2026-02-24",
    favorito: true,
    negocios: 3,
    receita: 150000,
  },
  {
    id: 2,
    nome: "Carlos Santos",
    email: "carlos@dataflow.com.br",
    telefone: "21998765432",
    empresa: "DataFlow Systems",
    cargo: "CTO",
    localizacao: "Rio de Janeiro, RJ",
    fonte: "Manual",
    status: "ativo",
    ultimoContato: "2026-02-20",
    avatar: getInitials("Carlos Santos"),
    tags: ["Tecnologia", "Inovação"],
    criadoEm: "2026-01-20",
    atualizadoEm: "2026-02-20",
    favorito: false,
    negocios: 2,
    receita: 85000,
  },
  {
    id: 3,
    nome: "Marina Costa",
    email: "marina@innovate.io",
    telefone: "11976543210",
    empresa: "Innovate Solutions",
    cargo: "Diretora de Vendas",
    localizacao: "São Paulo, SP",
    fonte: "LinkedIn",
    status: "aguardando",
    ultimoContato: "2026-02-10",
    avatar: getInitials("Marina Costa"),
    tags: ["Vendas"],
    criadoEm: "2026-02-05",
    atualizadoEm: "2026-02-10",
    favorito: false,
    negocios: 1,
    receita: 45000,
  },
  {
    id: 4,
    nome: "Ricardo Oliveira",
    email: "ricardo.oliveira@globaltech.com",
    telefone: "11965432109",
    empresa: "GlobalTech",
    cargo: "Gerente de Projetos",
    localizacao: "Campinas, SP",
    fonte: "Import",
    status: "ativo",
    ultimoContato: "2026-02-25",
    avatar: getInitials("Ricardo Oliveira"),
    tags: ["Projetos", "Estratégia"],
    criadoEm: "2025-12-10",
    atualizadoEm: "2026-02-25",
    favorito: true,
    negocios: 5,
    receita: 230000,
  },
  {
    id: 5,
    nome: "Juliana Ferreira",
    email: "juliana@startuphub.io",
    telefone: "11954321098",
    empresa: "Startup Hub",
    cargo: "Fundadora",
    localizacao: "São Paulo, SP",
    fonte: "API",
    status: "ativo",
    ultimoContato: "2026-02-22",
    avatar: getInitials("Juliana Ferreira"),
    tags: ["Startup", "Empreendedora"],
    criadoEm: "2026-01-28",
    atualizadoEm: "2026-02-22",
    favorito: false,
    negocios: 1,
    receita: 60000,
  },
  {
    id: 6,
    nome: "Paulo Mendes",
    email: "paulo.mendes@consultoria.com",
    empresa: "Consultoria Estratégica",
    cargo: "Consultor Senior",
    localizacao: "Belo Horizonte, MG",
    fonte: "Manual",
    status: "inativo",
    ultimoContato: "2025-12-15",
    avatar: getInitials("Paulo Mendes"),
    tags: ["Consultoria"],
    criadoEm: "2025-11-01",
    atualizadoEm: "2025-12-15",
    favorito: false,
    negocios: 0,
    receita: 0,
  },
  {
    id: 7,
    nome: "Beatriz Almeida",
    email: "beatriz@marketingpro.com.br",
    telefone: "11943210987",
    empresa: "Marketing Pro",
    cargo: "Head de Marketing",
    localizacao: "São Paulo, SP",
    fonte: "LinkedIn",
    status: "ativo",
    ultimoContato: "2026-02-23",
    avatar: getInitials("Beatriz Almeida"),
    tags: ["Marketing", "Digital"],
    criadoEm: "2026-02-01",
    atualizadoEm: "2026-02-23",
    favorito: false,
    negocios: 2,
    receita: 95000,
  },
  {
    id: 8,
    nome: "Fernando Lima",
    email: "fernando@devhouse.io",
    telefone: "11932109876",
    empresa: "Dev House",
    cargo: "Tech Lead",
    localizacao: "Curitiba, PR",
    fonte: "Import",
    status: "aguardando",
    avatar: getInitials("Fernando Lima"),
    tags: ["Desenvolvimento", "Tech"],
    criadoEm: "2026-02-12",
    atualizadoEm: "2026-02-12",
    favorito: false,
    negocios: 0,
    receita: 0,
  },
  {
    id: 9,
    nome: "Camila Rodrigues",
    email: "camila@financecorp.com.br",
    telefone: "21921098765",
    empresa: "Finance Corp",
    cargo: "CFO",
    localizacao: "Rio de Janeiro, RJ",
    fonte: "LinkedIn",
    status: "ativo",
    ultimoContato: "2026-02-26",
    avatar: getInitials("Camila Rodrigues"),
    tags: ["Finanças", "C-Level"],
    criadoEm: "2026-01-10",
    atualizadoEm: "2026-02-26",
    favorito: true,
    negocios: 4,
    receita: 180000,
  },
  {
    id: 10,
    nome: "Roberto Souza",
    email: "roberto@produtosdigitais.com",
    telefone: "11910987654",
    empresa: "Produtos Digitais Ltda",
    cargo: "Product Manager",
    localizacao: "São Paulo, SP",
    fonte: "API",
    status: "ativo",
    ultimoContato: "2026-02-19",
    avatar: getInitials("Roberto Souza"),
    tags: ["Produto", "UX"],
    criadoEm: "2026-01-25",
    atualizadoEm: "2026-02-19",
    favorito: false,
    negocios: 2,
    receita: 75000,
  },
]

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<ContactStatus | "todos">("todos")
  const [filterSource, setFilterSource] = useState<ContactSource | "todos">("todos")
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Filtrar contatos
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.empresa.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "todos" || contact.status === filterStatus
      const matchesSource = filterSource === "todos" || contact.fonte === filterSource

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [contacts, searchTerm, filterStatus, filterSource])

  // Handlers
  const handleSelectContact = (id: number, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? filteredContacts.map((c) => c.id) : [])
  }

  const handleToggleFavorite = (id: number) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, favorito: !contact.favorito } : contact
      )
    )
  }

  const handleBulkDelete = () => {
    if (confirm(`Deseja realmente excluir ${selectedIds.length} contato(s)?`)) {
      setContacts((prev) => prev.filter((contact) => !selectedIds.includes(contact.id)))
      setSelectedIds([])
    }
  }

  const handleNewContact = () => {
    alert("Funcionalidade 'Novo Contato' será implementada em breve")
  }

  const handleImport = () => {
    alert("Funcionalidade 'Importar' será implementada em breve")
  }

  const handleExport = () => {
    alert("Funcionalidade 'Exportar' será implementada em breve")
  }

  const handleViewContact = (id: number) => {
    console.log("Ver contato:", id)
  }

  const handleEditContact = (id: number) => {
    console.log("Editar contato:", id)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ContactsHeader
        onNewContact={handleNewContact}
        onImport={handleImport}
        onExport={handleExport}
      />

      {/* KPIs */}
      <ContactsKPIs contacts={contacts} />

      {/* Toolbar */}
      <ContactsToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterSource={filterSource}
        onFilterSourceChange={setFilterSource}
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
      />

      {/* Table */}
      <ContactsTable
        contacts={filteredContacts}
        selectedIds={selectedIds}
        onSelectContact={handleSelectContact}
        onSelectAll={handleSelectAll}
        onToggleFavorite={handleToggleFavorite}
        onViewContact={handleViewContact}
        onEditContact={handleEditContact}
      />
    </div>
  )
}
