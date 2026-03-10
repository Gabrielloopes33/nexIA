"use client"

import { useState, useRef, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  Save,
  Search,
  Settings,
  ImageIcon,
} from "lucide-react"

// Estados brasileiros
const estados = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
]

// Fusos horários
const fusosHorarios = [
  { value: "America/Sao_Paulo", label: "Brasília (UTC-03:00)" },
  { value: "America/Manaus", label: "Manaus (UTC-04:00)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC-05:00)" },
  { value: "America/Fortaleza", label: "Fortaleza (UTC-03:00)" },
  { value: "America/Recife", label: "Recife (UTC-03:00)" },
  { value: "America/Bahia", label: "Salvador (UTC-03:00)" },
  { value: "America/Belem", label: "Belém (UTC-03:00)" },
  { value: "America/Cuiaba", label: "Cuiabá (UTC-04:00)" },
  { value: "America/Campo_Grande", label: "Campo Grande (UTC-04:00)" },
]

// Formatos de número
const formatosNumero = [
  { value: "pt-BR", label: "Português (Brasil) - 1.234,56" },
  { value: "en-US", label: "Inglês (EUA) - 1,234.56" },
  { value: "de-DE", label: "Alemão - 1.234,56" },
  { value: "fr-FR", label: "Francês - 1 234,56" },
]

// Moedas
const moedas = [
  { value: "BRL", label: "Real Brasileiro (R$)" },
  { value: "USD", label: "Dólar Americano ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "Libra Esterlina (£)" },
  { value: "ARS", label: "Peso Argentino ($)" },
  { value: "CLP", label: "Peso Chileno ($)" },
  { value: "UYU", label: "Peso Uruguaio ($)" },
]

export default function EmpresaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  // Estado do formulário de informações da empresa
  const [empresa, setEmpresa] = useState({
    nome: "",
    nomeFantasia: "",
    cnpj: "",
    razaoSocial: "",
  })

  // Estado do formulário de contato
  const [contato, setContato] = useState({
    email: "",
    telefone: "",
    website: "",
  })

  // Estado do formulário de endereço
  const [endereco, setEndereco] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  })

  // Estado das configurações do sistema
  const [configuracoes, setConfiguracoes] = useState({
    fusoHorario: "America/Sao_Paulo",
    moeda: "BRL",
    formatoNumero: "pt-BR",
    dominioPersonalizado: "",
  })

  // Formatadores
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14)
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
  }

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    return digits.replace(/(\d{5})(\d)/, "$1-$2")
  }

  // Handlers
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCepSearch = async () => {
    const cepLimpo = endereco.cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setEndereco(prev => ({
          ...prev,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleSave = () => {
    // Aqui você implementaria a lógica de salvamento
    console.log({ empresa, contato, endereco, configuracoes })
    alert("Configurações salvas com sucesso!")
  }

  const handleExportData = () => {
    alert("Exportação iniciada. Você receberá um email quando estiver pronto.")
  }

  const handleDeleteAccount = () => {
    if (confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.")) {
      alert("Solicitação de exclusão enviada.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#46347F" }}>
          Configurações da Empresa
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie as informações da sua organização
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção Informações da Empresa */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" style={{ color: "#46347F" }} />
                <CardTitle className="text-lg">Informações da Empresa</CardTitle>
              </div>
              <CardDescription>
                Dados cadastrais e identificação da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden"
                  >
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700"
                          onClick={handleRemoveLogo}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG ou SVG. Máximo 2MB.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Nexia CRM"
                    value={empresa.nome}
                    onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    placeholder="Ex: Nexia"
                    value={empresa.nomeFantasia}
                    onChange={(e) => setEmpresa({ ...empresa, nomeFantasia: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={empresa.cnpj}
                    onChange={(e) => setEmpresa({ ...empresa, cnpj: formatCNPJ(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input
                    id="razaoSocial"
                    placeholder="Razão social completa"
                    value={empresa.razaoSocial}
                    onChange={(e) => setEmpresa({ ...empresa, razaoSocial: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção Contato */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" style={{ color: "#46347F" }} />
                <CardTitle className="text-lg">Contato</CardTitle>
              </div>
              <CardDescription>
                Informações de contato comercial da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Comercial</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      className="pl-10"
                      value={contato.email}
                      onChange={(e) => setContato({ ...contato, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone Comercial</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                      value={contato.telefone}
                      onChange={(e) => setContato({ ...contato, telefone: formatPhone(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    placeholder="https://www.empresa.com"
                    className="pl-10"
                    value={contato.website}
                    onChange={(e) => setContato({ ...contato, website: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção Endereço */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" style={{ color: "#46347F" }} />
                <CardTitle className="text-lg">Endereço</CardTitle>
              </div>
              <CardDescription>
                Endereço comercial da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={endereco.cep}
                      onChange={(e) => setEndereco({ ...endereco, cep: formatCEP(e.target.value) })}
                      onBlur={handleCepSearch}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCepSearch}
                      disabled={isLoadingCep || endereco.cep.replace(/\D/g, "").length !== 8}
                    >
                      {isLoadingCep ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    placeholder="Rua, Avenida, etc."
                    value={endereco.logradouro}
                    onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={endereco.numero}
                    onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Sala, Andar, etc."
                    value={endereco.complemento}
                    onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Bairro"
                    value={endereco.bairro}
                    onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={endereco.cidade}
                    onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select 
                    value={endereco.estado} 
                    onValueChange={(value) => setEndereco({ ...endereco, estado: value })}
                  >
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção Configurações do Sistema */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" style={{ color: "#46347F" }} />
                <CardTitle className="text-lg">Configurações do Sistema</CardTitle>
              </div>
              <CardDescription>
                Preferências regionais e configurações avançadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fusoHorario">Fuso Horário Padrão</Label>
                  <Select 
                    value={configuracoes.fusoHorario} 
                    onValueChange={(value) => setConfiguracoes({ ...configuracoes, fusoHorario: value })}
                  >
                    <SelectTrigger id="fusoHorario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fusosHorarios.map((fuso) => (
                        <SelectItem key={fuso.value} value={fuso.value}>
                          {fuso.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moeda">Moeda Padrão</Label>
                  <Select 
                    value={configuracoes.moeda} 
                    onValueChange={(value) => setConfiguracoes({ ...configuracoes, moeda: value })}
                  >
                    <SelectTrigger id="moeda">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moedas.map((moeda) => (
                        <SelectItem key={moeda.value} value={moeda.value}>
                          {moeda.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formatoNumero">Formato de Número</Label>
                  <Select 
                    value={configuracoes.formatoNumero} 
                    onValueChange={(value) => setConfiguracoes({ ...configuracoes, formatoNumero: value })}
                  >
                    <SelectTrigger id="formatoNumero">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatosNumero.map((formato) => (
                        <SelectItem key={formato.value} value={formato.value}>
                          {formato.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dominio">Domínio Personalizado</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="dominio"
                      placeholder="app.suaempresa.com"
                      className="pl-10"
                      value={configuracoes.dominioPersonalizado}
                      onChange={(e) => setConfiguracoes({ ...configuracoes, dominioPersonalizado: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção Danger Zone */}
          <Card className="shadow-sm border-red-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg text-red-600">Zona de Perigo</CardTitle>
              </div>
              <CardDescription>
                Ações irreversíveis que afetam sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div>
                  <h4 className="font-medium text-sm">Exportar Todos os Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Baixe uma cópia completa dos seus dados em formato JSON
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={handleExportData}
                >
                  <Download className="h-4 w-4" />
                  Exportar Dados
                </Button>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-200 bg-red-50/50">
                <div>
                  <h4 className="font-medium text-sm text-red-600">Excluir Conta</h4>
                  <p className="text-sm text-muted-foreground">
                    Exclua permanentemente sua conta e todos os dados
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="gap-2 shrink-0"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar direita */}
        <div className="space-y-6">
          {/* Card de Ações */}
          <Card className="shadow-sm sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full gap-2" 
                style={{ backgroundColor: "#46347F" }}
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-xs text-blue-700">
                  As alterações serão aplicadas imediatamente após o salvamento.
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <p><strong>Última atualização:</strong></p>
                <p>10 de março de 2026 às 14:30</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Dicas */}
          <Card className="shadow-sm bg-gradient-to-br from-[#46347F]/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: "#46347F" }} />
                Dicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[#46347F]">•</span>
                  Mantenha seus dados sempre atualizados
                </li>
                <li className="flex gap-2">
                  <span className="text-[#46347F]">•</span>
                  Use um logo com fundo transparente
                </li>
                <li className="flex gap-2">
                  <span className="text-[#46347F]">•</span>
                  O CEP preenche automaticamente o endereço
                </li>
                <li className="flex gap-2">
                  <span className="text-[#46347F]">•</span>
                  Configure o fuso horário correto para evitar problemas com agendamentos
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
