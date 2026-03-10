"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Key, 
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"

interface Token {
  id: string
  nome: string
  token: string
  status: "ativo" | "revogado"
  criadoEm: string
  ultimoUso: string
  permissoes: string[]
}

const tokens: Token[] = [
  { 
    id: "tok_001", 
    nome: "Token API Principal", 
    token: "sk-synkra-••••••••••••••2f3a",
    status: "ativo",
    criadoEm: "15/01/2026",
    ultimoUso: "ontem",
    permissoes: ["read", "write"]
  },
  { 
    id: "tok_002", 
    nome: "Token Webhook Externo", 
    token: "sk-synkra-••••••••••••••9b1c",
    status: "ativo",
    criadoEm: "20/01/2026",
    ultimoUso: "há 2 horas",
    permissoes: ["read"]
  },
  { 
    id: "tok_003", 
    nome: "Token Zapier", 
    token: "sk-synkra-••••••••••••••7d4e",
    status: "revogado",
    criadoEm: "01/12/2025",
    ultimoUso: "há 30 dias",
    permissoes: ["read", "write"]
  },
]

export default function AuthPage() {
  const [tokensState, setTokensState] = useState(tokens)
  const [visibleToken, setVisibleToken] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const revokeToken = (id: string) => {
    setTokensState(prev => prev.map(t => 
      t.id === id ? { ...t, status: "revogado" } : t
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tokens de Autenticação</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie tokens de API para acesso programático
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Plus className="h-4 w-4" />
          Novo Token
        </Button>
      </div>

      {/* Alerta de Segurança */}
      <Card className="shadow-sm border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-amber-800">Segurança</p>
              <p className="text-sm text-amber-700">
                Mantenha seus tokens seguros. Nunca compartilhe em repositórios públicos ou client-side.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tokens */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-[#46347F]" />
            Tokens Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {tokensState.map((token) => (
              <div key={token.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-[#46347F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{token.nome}</p>
                        {token.status === "ativo" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Revogado</Badge>
                        )}
                      </div>
                      
                      {/* Token */}
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {visibleToken === token.id 
                            ? token.token.replace(/•/g, "x") 
                            : token.token}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => setVisibleToken(visibleToken === token.id ? null : token.id)}
                        >
                          {visibleToken === token.id ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* Info */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Criado em: {token.criadoEm}</span>
                        <span>•</span>
                        <span>Último uso: {token.ultimoUso}</span>
                      </div>

                      {/* Permissões */}
                      <div className="flex gap-1 mt-2">
                        {token.permissoes.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm === 'read' ? 'Leitura' : 'Escrita'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => copyToClipboard(token.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {token.status === "ativo" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => revokeToken(token.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
