"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Bot, CheckCircle2, AlertCircle, Unplug, Copy } from "lucide-react"
import { useOrganizationId } from "@/lib/contexts/organization-context"
import { toast } from "sonner"

interface TypebotIntegration {
  id: string
  status: string
  webhookUrl?: string
  webhookSecret?: string
  fieldMapping?: Record<string, string>
  selectedFlowIds: string[]
  totalResponses: number
  lastResponseAt?: string
}

interface TypebotFlow {
  id: string
  name: string
  selected?: boolean
}

export default function TypebotIntegrationPage() {
  const organizationId = useOrganizationId()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integration, setIntegration] = useState<TypebotIntegration | null>(null)
  const [flows, setFlows] = useState<TypebotFlow[]>([])

  const [apiKey, setApiKey] = useState("")
  const [manualFlows, setManualFlows] = useState("")
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([])

  const [nameVariable, setNameVariable] = useState("nome")
  const [emailVariable, setEmailVariable] = useState("email")
  const [phoneVariable, setPhoneVariable] = useState("telefone")
  const [flowIdVariable, setFlowIdVariable] = useState("flowId")
  const [flowNameVariable, setFlowNameVariable] = useState("flowName")
  const [setupMethod, setSetupMethod] = useState<"HTTP_REQUEST" | "API_TOKEN">("API_TOKEN")

  const isActive = integration?.status === "ACTIVE"

  const webhookInfo = useMemo(() => {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "")
    const fallbackUrl = organizationId
      ? `${appUrl}/api/webhooks/typebot?organizationId=${organizationId}`
      : ""

    const url = integration?.webhookUrl || fallbackUrl
    const secret = integration?.webhookSecret || ""
    const payloadJson = JSON.stringify(
      {
        flowId: `{{${flowIdVariable}}}`,
        flowName: `{{${flowNameVariable}}}`,
        answers: {
          nome: `{{${nameVariable}}}`,
          email: `{{${emailVariable}}}`,
          telefone: `{{${phoneVariable}}}`,
        },
      },
      null,
      2
    )

    return {
      url,
      secret,
      payloadJson,
      bodyType: "JSON",
      headerName: "x-typebot-secret",
    }
  }, [organizationId, integration?.webhookUrl, integration?.webhookSecret, flowIdVariable, flowNameVariable, nameVariable, emailVariable, phoneVariable])

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) {
      toast.error(`Nada para copiar em ${label}`)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copiado`) 
    } catch {
      toast.error(`Não foi possível copiar ${label}`)
    }
  }

  const loadFieldMappingFromIntegration = (mapping?: Record<string, string>) => {
    if (!mapping) return

    setNameVariable(mapping.nameVariable || "nome")
    setEmailVariable(mapping.emailVariable || "email")
    setPhoneVariable(mapping.phoneVariable || "telefone")
    setFlowIdVariable(mapping.flowIdVariable || "flowId")
    setFlowNameVariable(mapping.flowNameVariable || "flowName")

    if (mapping.integrationMethod === "API_TOKEN" || mapping.integrationMethod === "HTTP_REQUEST") {
      setSetupMethod(mapping.integrationMethod)
    }
  }

  const fetchIntegration = useCallback(async () => {
    if (!organizationId) return

    try {
      setLoading(true)

      const [integrationRes, flowsRes] = await Promise.all([
        fetch(`/api/integrations/typebot?organizationId=${organizationId}`),
        fetch(`/api/integrations/typebot/flows?organizationId=${organizationId}`),
      ])

      const integrationJson = await integrationRes.json()
      const flowsJson = await flowsRes.json()

      if (integrationJson.success) {
        setIntegration(integrationJson.data)
        const currentSelected = integrationJson.data?.selectedFlowIds || []
        setSelectedFlowIds(currentSelected)
        loadFieldMappingFromIntegration(integrationJson.data?.fieldMapping)
      }

      if (flowsJson.success && Array.isArray(flowsJson.data)) {
        setFlows(flowsJson.data)
      }
    } catch {
      toast.error("Erro ao carregar integração Typebot")
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchIntegration()
  }, [fetchIntegration])

  const toggleFlow = (flowId: string, checked: boolean) => {
    setSelectedFlowIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, flowId]))
      }
      return prev.filter((id) => id !== flowId)
    })
  }

  const resolveFlowIdsForSave = () => {
    const manual = manualFlows
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    return Array.from(new Set([...selectedFlowIds, ...manual]))
  }

  const handleConnect = async () => {
    if (!organizationId) {
      toast.error("Organização não encontrada")
      return
    }

    try {
      setSaving(true)

      const response = await fetch("/api/integrations/typebot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          apiKey: apiKey.trim(),
          selectedFlowIds: resolveFlowIdsForSave(),
          fieldMapping: {
            nameVariable,
            emailVariable,
            phoneVariable,
            flowIdVariable,
            flowNameVariable,
            integrationMethod: setupMethod,
          },
        }),
      })

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || "Erro ao conectar integração")
      }

      setIntegration(json.data)
      setApiKey("")
      loadFieldMappingFromIntegration(json.data?.fieldMapping)
      toast.success("Typebot conectado com sucesso")

      await fetchIntegration()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao conectar")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!organizationId || !integration) return

    try {
      setSaving(true)

      const response = await fetch("/api/integrations/typebot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          selectedFlowIds: resolveFlowIdsForSave(),
          status: "ACTIVE",
          fieldMapping: {
            nameVariable,
            emailVariable,
            phoneVariable,
            flowIdVariable,
            flowNameVariable,
            integrationMethod: setupMethod,
          },
        }),
      })

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || "Erro ao salvar configuração")
      }

      setIntegration((prev) => (prev ? { ...prev, ...json.data } : prev))
      setManualFlows("")
      toast.success("Configuração do Typebot atualizada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!organizationId) return

    try {
      setSaving(true)

      const response = await fetch(`/api/integrations/typebot?organizationId=${organizationId}`, {
        method: "DELETE",
      })

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || "Erro ao desconectar")
      }

      setIntegration(null)
      setSelectedFlowIds([])
      setManualFlows("")
      setFlows([])
      toast.success("Integração Typebot desconectada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#46347F]/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-[#46347F]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Typebot</h1>
          <p className="text-sm text-muted-foreground">
            Capture respostas de fluxos finalizados e sincronize com contatos
          </p>
        </div>
        {integration && (
          <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
            {isActive ? "Ativo" : integration.status}
          </Badge>
        )}
      </div>

      {integration && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-2xl font-bold">{integration.totalResponses}</p>
                <p className="text-sm text-muted-foreground">Respostas processadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-2xl font-bold">
                  {integration.lastResponseAt
                    ? new Date(integration.lastResponseAt).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
                <p className="text-sm text-muted-foreground">Última sincronização</p>
              </CardContent>
            </Card>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Ao finalizar o fluxo, o CRM busca nome, email e telefone. Se existir contato, atualiza; se não existir, cria contato com tag/lista TYPEBOT.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Fluxos monitorados</CardTitle>
              <CardDescription>
                Selecione os fluxos do Typebot que devem criar/atualizar contatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flows.length > 0 ? (
                <div className="space-y-3">
                  {flows.map((flow) => {
                    const checked = selectedFlowIds.includes(flow.id)
                    return (
                      <label key={flow.id} className="flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleFlow(flow.id, Boolean(value))}
                        />
                        <div>
                          <p className="text-sm font-medium">{flow.name}</p>
                          <p className="text-xs text-muted-foreground">{flow.id}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não foi possível listar flows automaticamente. Você pode informar IDs manualmente abaixo.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Adicionar IDs manuais</Label>
                <Input
                  placeholder="flow-1, flow-2"
                  value={manualFlows}
                  onChange={(e) => setManualFlows(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-[#46347F] hover:bg-[#46347F]/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar configuração"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleDisconnect}
                disabled={saving}
              >
                <Unplug className="h-4 w-4 mr-2" />
                Desconectar Typebot
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {!integration && (
        <Card>
          <CardHeader>
            <CardTitle>Conectar Typebot</CardTitle>
            <CardDescription>
              Escolha o método abaixo. Você pode usar API Token para facilitar seleção de fluxos ou seguir sem token via HTTP Request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Método de integração</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={setupMethod === "API_TOKEN" ? "default" : "outline"}
                  className={setupMethod === "API_TOKEN" ? "bg-[#46347F] hover:bg-[#46347F]/90" : ""}
                  onClick={() => setSetupMethod("API_TOKEN")}
                >
                  Com API Token
                </Button>
                <Button
                  type="button"
                  variant={setupMethod === "HTTP_REQUEST" ? "default" : "outline"}
                  className={setupMethod === "HTTP_REQUEST" ? "bg-[#46347F] hover:bg-[#46347F]/90" : ""}
                  onClick={() => setSetupMethod("HTTP_REQUEST")}
                >
                  Sem API Token (HTTP Request)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Token {setupMethod === "API_TOKEN" ? "(obrigatório neste método)" : "(opcional)"}</Label>
              <Input
                type="password"
                placeholder="tb_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Flows (IDs manuais, opcional)</Label>
              <Input
                placeholder="flow-1, flow-2"
                value={manualFlows}
                onChange={(e) => setManualFlows(e.target.value)}
              />
            </div>

            <Button
              onClick={handleConnect}
              disabled={saving || (setupMethod === "API_TOKEN" && !apiKey.trim())}
              className="w-full bg-[#46347F] hover:bg-[#46347F]/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar Typebot"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tutorial Completo</CardTitle>
          <CardDescription>
            Escolha como quer vincular o Typebot ao CRM. Os dois métodos suportam múltiplos fluxos ativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Método selecionado</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={setupMethod === "API_TOKEN" ? "default" : "outline"}
                className={setupMethod === "API_TOKEN" ? "bg-[#46347F] hover:bg-[#46347F]/90" : ""}
                onClick={() => setSetupMethod("API_TOKEN")}
              >
                Com API Token
              </Button>
              <Button
                type="button"
                variant={setupMethod === "HTTP_REQUEST" ? "default" : "outline"}
                className={setupMethod === "HTTP_REQUEST" ? "bg-[#46347F] hover:bg-[#46347F]/90" : ""}
                onClick={() => setSetupMethod("HTTP_REQUEST")}
              >
                Sem API Token (HTTP Request)
              </Button>
            </div>
          </div>

          {setupMethod === "API_TOKEN" ? (
            <>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-medium">Passo a passo com API Token</p>
                <ol className="list-decimal pl-5 text-sm text-foreground space-y-2">
                  <li>No Typebot, abra <strong>Configurações &amp; Membros</strong> e vá em <strong>Credenciais</strong>.</li>
                  <li>Na seção <strong>Tokens de API</strong>, clique em <strong>Criar</strong> e copie o token gerado.</li>
                  <li>No CRM, cole o token em <strong>API Token</strong> e clique em <strong>Conectar Typebot</strong>.</li>
                  <li>Depois da conexão, em <strong>Fluxos monitorados</strong>, marque quantos fluxos quiser (múltiplos suportados).</li>
                  <li>Opcional: adicione IDs manuais para fluxos extras e salve a configuração.</li>
                  <li>No final de cada fluxo Typebot, adicione um bloco HTTP Request usando a configuração pronta abaixo.</li>
                </ol>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  API Token serve para facilitar gestão e seleção de múltiplos fluxos no CRM. A entrega do lead ainda acontece pelo HTTP Request no final do fluxo.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <p className="text-sm font-medium">Passo a passo sem API Token (somente HTTP Request)</p>
              <ol className="list-decimal pl-5 text-sm text-foreground space-y-2">
                <li>No Typebot, abra o bot e vá em <strong>Flow</strong>.</li>
                <li>No último bloco do fluxo, clique em <strong>+</strong> e adicione <strong>HTTP Request</strong>.</li>
                <li>Preencha Method, Body Type, URL, Header e Payload exatamente como abaixo.</li>
                <li>Repita esse bloco no final de cada fluxo que deve cair no CRM.</li>
                <li>Publique e rode um teste até o fim do fluxo.</li>
              </ol>
            </div>
          )}

          {setupMethod === "HTTP_REQUEST" && (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Configuração exata do node HTTP Request</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Method</p>
                  <code className="block rounded-md bg-muted px-3 py-2 text-xs">POST</code>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Body Type</p>
                  <code className="block rounded-md bg-muted px-3 py-2 text-xs">{webhookInfo.bodyType}</code>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground">URL</p>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookInfo.url, "URL do webhook")}>
                      <Copy className="h-3.5 w-3.5 mr-1" />Copiar
                    </Button>
                  </div>
                  <code className="block rounded-md bg-muted px-3 py-2 text-xs break-all">{webhookInfo.url}</code>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground">Header (adicione 1 header manual)</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${webhookInfo.headerName}: ${webhookInfo.secret}`, "Header")}
                      disabled={!webhookInfo.secret}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />Copiar
                    </Button>
                  </div>
                  <code className="block rounded-md bg-muted px-3 py-2 text-xs break-all">
                    {webhookInfo.headerName}: {webhookInfo.secret || "(conecte o Typebot primeiro para gerar o secret)"}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Variáveis usadas no payload (ajuste se necessário)</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Variável de nome no Typebot</Label>
                <Input value={nameVariable} onChange={(e) => setNameVariable(e.target.value.trim())} placeholder="nome" />
              </div>
              <div className="space-y-2">
                <Label>Variável de email no Typebot</Label>
                <Input value={emailVariable} onChange={(e) => setEmailVariable(e.target.value.trim())} placeholder="email" />
              </div>
              <div className="space-y-2">
                <Label>Variável de telefone no Typebot</Label>
                <Input value={phoneVariable} onChange={(e) => setPhoneVariable(e.target.value.trim())} placeholder="telefone" />
              </div>
              <div className="space-y-2">
                <Label>Variável flowId no Typebot</Label>
                <Input value={flowIdVariable} onChange={(e) => setFlowIdVariable(e.target.value.trim())} placeholder="flowId" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Variável flowName no Typebot</Label>
                <Input value={flowNameVariable} onChange={(e) => setFlowNameVariable(e.target.value.trim())} placeholder="flowName" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Payload JSON (copie e cole no Body)</Label>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookInfo.payloadJson, "Payload JSON")}>
                <Copy className="h-3.5 w-3.5 mr-1" />Copiar
              </Button>
            </div>
            <pre className="rounded-md bg-muted px-3 py-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
{webhookInfo.payloadJson}
            </pre>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se falhar, confira este checklist: 1) o bloco HTTP Request está no fim do fluxo; 2) Method está POST; 3) Body está JSON; 4) header x-typebot-secret está igual ao da tela; 5) nomes das variáveis no payload existem no Typebot exatamente com o mesmo texto.
            </AlertDescription>
          </Alert>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Resultado esperado após teste: contato criado/atualizado, com tag TYPEBOT, lista TYPEBOT e dados visíveis no Contexto do Cliente. Você pode ter vários fluxos Typebot ativos caindo na mesma integração.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

    </div>
  )
}
