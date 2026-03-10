"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Camera,
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Clock,
  Calendar,
  Lock,
  Shield,
  Smartphone,
  Bell,
  Mail as MailIcon,
  FileText,
  Check,
  LogOut,
} from "lucide-react"

export default function PerfilPage() {
  // Estados para Informações Pessoais
  const [nome, setNome] = useState("João Silva")
  const [email, setEmail] = useState("joao.silva@empresa.com")
  const [telefone, setTelefone] = useState("(11) 98765-4321")
  const [cargo, setCargo] = useState("admin")
  const [avatarUrl, setAvatarUrl] = useState("/placeholder.svg")

  // Estados para Preferências
  const [idioma, setIdioma] = useState("pt")
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo")
  const [formatoData, setFormatoData] = useState("DD/MM/AAAA")

  // Estados para Segurança
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [doisFatores, setDoisFatores] = useState(true)

  // Estados para Notificações
  const [emailLeads, setEmailLeads] = useState(true)
  const [emailMensagens, setEmailMensagens] = useState(true)
  const [relatoriosSemanais, setRelatoriosSemanais] = useState(false)

  // Sessões ativas mock
  const sessoesAtivas = [
    {
      id: 1,
      dispositivo: "Chrome - Windows",
      localizacao: "São Paulo, Brasil",
      ip: "192.168.1.1",
      atual: true,
    },
    {
      id: 2,
      dispositivo: "Safari - iPhone",
      localizacao: "São Paulo, Brasil",
      ip: "192.168.1.2",
      atual: false,
    },
  ]

  const handleSalvarPerfil = () => {
    console.log("Salvando perfil...", { nome, email, telefone, cargo })
  }

  const handleSalvarPreferencias = () => {
    console.log("Salvando preferências...", { idioma, fusoHorario, formatoData })
  }

  const handleAlterarSenha = () => {
    console.log("Alterando senha...")
  }

  const handleEncerrarSessao = (id: number) => {
    console.log("Encerrando sessão:", id)
  }

  const handleUploadFoto = () => {
    console.log("Upload de foto...")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#46347F" }}>
          Configurações de Perfil
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie seus dados pessoais e informações de perfil
        </p>
      </div>

      {/* Grid de 2 colunas em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção Informações Pessoais */}
        <Card className="shadow-sm rounded-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: "#46347F" }} />
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </div>
            <CardDescription>Atualize seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl} alt={nome} />
                  <AvatarFallback className="text-2xl" style={{ backgroundColor: "#46347F", color: "white" }}>
                    {nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 shadow-sm"
                  onClick={handleUploadFoto}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Campos do formulário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-9 rounded-sm"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 rounded-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="pl-9 rounded-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo/Função</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={cargo} onValueChange={setCargo}>
                    <SelectTrigger className="pl-9 rounded-sm w-full">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSalvarPerfil}
              className="w-full rounded-sm"
              style={{ backgroundColor: "#46347F" }}
            >
              <Check className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Seção Preferências */}
        <Card className="shadow-sm rounded-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: "#46347F" }} />
              <CardTitle className="text-lg">Preferências</CardTitle>
            </div>
            <CardDescription>Configure suas preferências regionais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idioma">Idioma</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={idioma} onValueChange={setIdioma}>
                    <SelectTrigger className="pl-9 rounded-sm w-full">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuso">Fuso Horário</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={fusoHorario} onValueChange={setFusoHorario}>
                    <SelectTrigger className="pl-9 rounded-sm w-full">
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">América/São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">América/New York (GMT-4)</SelectItem>
                      <SelectItem value="Europe/London">Europa/Londres (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Europa/Paris (GMT+2)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Ásia/Tóquio (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formato-data">Formato de Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={formatoData} onValueChange={setFormatoData}>
                    <SelectTrigger className="pl-9 rounded-sm w-full">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/AAAA">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/AAAA">MM/DD/AAAA</SelectItem>
                      <SelectItem value="AAAA-MM-DD">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSalvarPreferencias}
              variant="outline"
              className="w-full rounded-sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        {/* Seção Segurança */}
        <Card className="shadow-sm rounded-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" style={{ color: "#46347F" }} />
              <CardTitle className="text-lg">Segurança</CardTitle>
            </div>
            <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alterar Senha */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Alterar Senha</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="rounded-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="rounded-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="rounded-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button 
                onClick={handleAlterarSenha}
                variant="outline"
                className="w-full rounded-sm"
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </div>

            {/* Autenticação de Dois Fatores */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Autenticação de Dois Fatores</h4>
                  <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                </div>
              </div>
              <Switch
                checked={doisFatores}
                onCheckedChange={setDoisFatores}
              />
            </div>

            {/* Sessões Ativas */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Sessões Ativas</h4>
              </div>
              <div className="space-y-2">
                {sessoesAtivas.map((sessao) => (
                  <div
                    key={sessao.id}
                    className="flex items-center justify-between p-3 rounded-sm bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{sessao.dispositivo}</span>
                        {sessao.atual && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#46347F20", color: "#46347F" }}
                          >
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {sessao.localizacao} • {sessao.ip}
                      </p>
                    </div>
                    {!sessao.atual && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleEncerrarSessao(sessao.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção Notificações */}
        <Card className="shadow-sm rounded-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: "#46347F" }} />
              <CardTitle className="text-lg">Notificações</CardTitle>
            </div>
            <CardDescription>Escolha quais notificações deseja receber</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Email de Novos Leads */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-muted/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#46347F15" }}
                  >
                    <MailIcon className="w-5 h-5" style={{ color: "#46347F" }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Email de novos leads</h4>
                    <p className="text-xs text-muted-foreground">Receba notificações quando um novo lead for cadastrado</p>
                  </div>
                </div>
                <Switch
                  checked={emailLeads}
                  onCheckedChange={setEmailLeads}
                />
              </div>

              {/* Email de Mensagens */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-muted/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#46347F15" }}
                  >
                    <Bell className="w-5 h-5" style={{ color: "#46347F" }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Email de mensagens</h4>
                    <p className="text-xs text-muted-foreground">Receba notificações de novas mensagens</p>
                  </div>
                </div>
                <Switch
                  checked={emailMensagens}
                  onCheckedChange={setEmailMensagens}
                />
              </div>

              {/* Relatórios Semanais */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-muted/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#46347F15" }}
                  >
                    <FileText className="w-5 h-5" style={{ color: "#46347F" }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Relatórios semanais</h4>
                    <p className="text-xs text-muted-foreground">Receba um resumo semanal de atividades</p>
                  </div>
                </div>
                <Switch
                  checked={relatoriosSemanais}
                  onCheckedChange={setRelatoriosSemanais}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                As notificações são enviadas para o e-mail cadastrado: <strong>{email}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
