"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Package,
  CreditCard,
  Receipt,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  History
} from "lucide-react"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  status: "ativo" | "inativo"
  plano: string
  valorMensal: string
  assinaturas: number
  faturasPendentes: number
  cidade: string
  estado: string
  dataCadastro: string
  ultimoPagamento: string
}

const clientes: Cliente[] = [
  { id: "cus_001", nome: "João Silva", email: "joao@acme.com", telefone: "(11) 98765-4321", empresa: "Acme Corp", status: "ativo", plano: "Enterprise", valorMensal: "R$ 499,00", assinaturas: 2, faturasPendentes: 0, cidade: "São Paulo", estado: "SP", dataCadastro: "15/01/2024", ultimoPagamento: "01/03/2026" },
  { id: "cus_002", nome: "Maria Santos", email: "maria@techstart.com", telefone: "(11) 91234-5678", empresa: "TechStart Ltda", status: "ativo", plano: "Pro", valorMensal: "R$ 199,00", assinaturas: 1, faturasPendentes: 0, cidade: "São Paulo", estado: "SP", dataCadastro: "20/03/2024", ultimoPagamento: "01/03/2026" },
  { id: "cus_003", nome: "Pedro Costa", email: "pedro@consulting.pro", telefone: "(21) 99876-5432", empresa: "Consulting Pro", status: "ativo", plano: "Business", valorMensal: "R$ 299,00", assinaturas: 1, faturasPendentes: 1, cidade: "Rio de Janeiro", estado: "RJ", dataCadastro: "10/06/2024", ultimoPagamento: "01/02/2026" },
  { id: "cus_004", nome: "Ana Oliveira", email: "ana@devstudio.io", telefone: "(31) 98765-1234", empresa: "DevStudio", status: "inativo", plano: "Pro", valorMensal: "R$ 0,00", assinaturas: 0, faturasPendentes: 0, cidade: "Belo Horizonte", estado: "MG", dataCadastro: "05/09/2023", ultimoPagamento: "-" },
  { id: "cus_005", nome: "Carlos Mendes", email: "carlos@marketing.plus", telefone: "(11) 95678-9012", empresa: "Marketing Plus", status: "ativo", plano: "Starter", valorMensal: "R$ 99,00", assinaturas: 1, faturasPendentes: 0, cidade: "São Paulo", estado: "SP", dataCadastro: "12/12/2024", ultimoPagamento: "01/03/2026" },
  { id: "cus_006", nome: "Fernanda Lima", email: "fernanda@globalsolutions.com", telefone: "(41) 98765-4321", empresa: "Global Solutions", status: "ativo", plano: "Enterprise", valorMensal: "R$ 799,00", assinaturas: 3, faturasPendentes: 0, cidade: "Curitiba", estado: "PR", dataCadastro: "08/02/2024", ultimoPagamento: "01/03/2026" },
  { id: "cus_007", nome: "Ricardo Souza", email: "ricardo@startupxyz.com", telefone: "(11) 93456-7890", empresa: "StartupXYZ", status: "ativo", plano: "Starter", valorMensal: "R$ 99,00", assinaturas: 1, faturasPendentes: 2, cidade: "São Paulo", estado: "SP", dataCadastro: "18/07/2024", ultimoPagamento: "01/01/2026" },
  { id: "cus_008", nome: "Juliana Pereira", email: "juliana@enterprise.com", telefone: "(19) 98765-4321", empresa: "Enterprise Ltda", status: "ativo", plano: "Business", valorMensal: "R$ 299,00", assinaturas: 1, faturasPendentes: 0, cidade: "Campinas", estado: "SP", dataCadastro: "22/11/2023", ultimoPagamento: "01/03/2026" },
]

const planos = ["Todos", "Starter", "Pro", "Business", "Enterprise"]
const statusOptions = ["Todos", "Ativo", "Inativo"]

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroPlano, setFiltroPlano] = useState("Todos")
  const [filtroStatus, setFiltroStatus] = useState("Todos")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)

  const clientesFiltrados = clientes.filter((cli) => {
    const matchSearch = 
      cli.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    const matchPlano = filtroPlano === "Todos" || cli.plano === filtroPlano
    const matchStatus = filtroStatus === "Todos" || cli.status === filtroStatus.toLowerCase()
    return matchSearch && matchPlano && matchStatus
  })

  const stats = {
    total: clientes.length,
    ativos: clientes.filter(c => c.status === "ativo").length,
    inativos: clientes.filter(c => c.status === "inativo").length,
    mrr: "R$ 2.293,00"
  }

  const getIniciais = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus clientes e suas assinaturas
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Clientes</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inativos</p>
            <p className="text-3xl font-bold text-gray-500">{stats.inativos}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MRR Total</p>
            <p className="text-2xl font-bold text-[#46347F]">{stats.mrr}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filtroPlano}
              onChange={(e) => setFiltroPlano(e.target.value)}
            >
              {planos.map((p) => <option key={p} value={p}>{p === "Todos" ? "Todos os Planos" : p}</option>)}
            </select>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clientesFiltrados.map((cli) => (
          <Card key={cli.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-[#46347F] text-white">
                    <AvatarFallback>{getIniciais(cli.nome)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{cli.nome}</p>
                    <p className="text-xs text-muted-foreground">{cli.empresa}</p>
                  </div>
                </div>
                <Badge variant={cli.status === "ativo" ? "default" : "secondary"} className={cli.status === "ativo" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                  {cli.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs truncate">{cli.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">{cli.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">{cli.cidade}, {cli.estado}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Package className="h-3.5 w-3.5 text-[#46347F]" />
                  </div>
                  <p className="text-lg font-semibold">{cli.assinaturas}</p>
                  <p className="text-xs text-muted-foreground">Assinaturas</p>
                </div>
                <div className="text-center border-x border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-[#46347F]" />
                  </div>
                  <p className="text-lg font-semibold">{cli.valorMensal}</p>
                  <p className="text-xs text-muted-foreground">Mensal</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-[#46347F]" />
                  </div>
                  <p className="text-lg font-semibold">{cli.faturasPendentes}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs border-0 shadow-sm"
                      onClick={() => setClienteSelecionado(cli)}
                    >
                      Ver Detalhes
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-[#46347F] text-white">
                          <AvatarFallback>{getIniciais(cli.nome)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{cli.nome}</p>
                          <p className="text-sm font-normal text-muted-foreground">{cli.empresa}</p>
                        </div>
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-6">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant={cli.status === "ativo" ? "default" : "secondary"} className={cli.status === "ativo" ? "bg-green-100 text-green-700" : ""}>
                          {cli.status === "ativo" ? "Cliente Ativo" : "Cliente Inativo"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-0 shadow-sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Informações de Contato */}
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4 text-[#46347F]" />
                            Informações de Contato
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="text-sm">{cli.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Telefone</span>
                            <span className="text-sm">{cli.telefone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Localização</span>
                            <span className="text-sm">{cli.cidade}, {cli.estado}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Plano e Assinatura */}
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#46347F]" />
                            Assinatura
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Plano Atual</span>
                            <Badge variant="outline">{cli.plano}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Valor Mensal</span>
                            <span className="text-sm font-semibold">{cli.valorMensal}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Assinaturas</span>
                            <span className="text-sm">{cli.assinaturas}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Faturas Pendentes</span>
                            <span className={`text-sm ${cli.faturasPendentes > 0 ? 'text-red-600 font-semibold' : ''}`}>
                              {cli.faturasPendentes}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Datas */}
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#46347F]" />
                            Histórico
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cliente desde</span>
                            <span className="text-sm">{cli.dataCadastro}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Último pagamento</span>
                            <span className="text-sm">{cli.ultimoPagamento}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-[#46347F] hover:bg-[#46347F]">
                          <Receipt className="h-4 w-4 mr-2" />
                          Ver Faturas
                        </Button>
                        <Button variant="outline" className="flex-1 border-0 shadow-sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar Email
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      )}
    </div>
  )
}
