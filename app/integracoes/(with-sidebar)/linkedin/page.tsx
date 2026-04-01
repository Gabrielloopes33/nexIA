"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
  Zap,
  Users,
  Tag,
  List,
  Unplug,
} from "lucide-react"
import { toast } from "sonner"

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

interface Integration {
  id: string
  organizationId: string
  linkedInMemberName?: string
  linkedInMemberEmail?: string
  adAccountId?: string
  adAccountName?: string
  selectedFormIds: string[]
  pipelineId?: string
  productId?: string
  webhookSubscriptionId?: string
  status: string
  lastLeadAt?: string
  totalLeads: number
}

interface AdAccount { id: string; name: string }
interface LeadForm { id: string; name: string; status: string }
interface Pipeline { id: string; name: string }
interface Product { id: string; name: string }

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING:      { label: "Não configurado", variant: "secondary" },
  CONFIGURED:   { label: "Configurado",     variant: "outline" },
  ACTIVE:       { label: "Ativo",           variant: "default" },
  ERROR:        { label: "Erro",            variant: "destructive" },
  DISCONNECTED: { label: "Desconectado",    variant: "secondary" },
}

function LinkedInIntegrationContent() {
  const searchParams = useSearchParams()
  const successParam = searchParams.get("success")

  const [integration, setIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(true)

  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [forms, setForms] = useState<LeadForm[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [loadingForms, setLoadingForms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  // Campos editáveis
  const [selectedAccount, setSelectedAccount] = useState("")
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")

  const fetchIntegration = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/linkedin")
      const json = await res.json()
      if (json.success && json.data) {
        setIntegration(json.data)
        setSelectedAccount(json.data.adAccountId ?? "")
        setSelectedForms(json.data.selectedFormIds ?? [])
        setSelectedPipeline(json.data.pipelineId ?? "")
        setSelectedProduct(json.data.productId ?? "")
      }
    } catch {
      toast.error("Erro ao carregar integração")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAdAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const res = await fetch("/api/integrations/linkedin/accounts")
      const json = await res.json()
      if (json.success) setAdAccounts(json.data)
    } catch {
      toast.error("Erro ao carregar contas de anúncios")
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  const fetchForms = useCallback(async (adAccountId: string) => {
    if (!adAccountId) return
    setLoadingForms(true)
    try {
      const res = await fetch(`/api/integrations/linkedin/forms?adAccountId=${adAccountId}`)
      const json = await res.json()
      if (json.success) setForms(json.data)
    } catch {
      toast.error("Erro ao carregar formulários")
    } finally {
      setLoadingForms(false)
    }
  }, [])

  const fetchPipelinesAndProducts = useCallback(async () => {
    try {
      const [plRes, prRes] = await Promise.all([
        fetch("/api/pipeline/stages"),
        fetch("/api/products"),
      ])
      const [plJson, prJson] = await Promise.all([plRes.json(), prRes.json()])
      if (plJson.pipelines) setPipelines(plJson.pipelines)
      if (prJson.data) setProducts(prJson.data)
    } catch {
      // Silencia — não crítico
    }
  }, [])

  useEffect(() => {
    fetchIntegration()
    fetchPipelinesAndProducts()
    if (successParam === "connected") {
      toast.success("LinkedIn conectado com sucesso!")
    }
  }, [fetchIntegration, fetchPipelinesAndProducts, successParam])

  useEffect(() => {
    if (integration && integration.status !== "DISCONNECTED" && integration.status !== "PENDING") {
      fetchAdAccounts()
    }
  }, [integration, fetchAdAccounts])

  useEffect(() => {
    if (selectedAccount) {
      fetchForms(selectedAccount)
    }
  }, [selectedAccount, fetchForms])

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedAccountObj = adAccounts.find((a) => a.id === selectedAccount)
      const res = await fetch("/api/integrations/linkedin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId: selectedAccount || null,
          adAccountName: selectedAccountObj?.name || null,
          selectedFormIds: selectedForms,
          pipelineId: selectedPipeline || null,
          productId: selectedProduct || null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setIntegration(json.data)
      toast.success("Configuração salva com sucesso")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    try {
      const res = await fetch("/api/integrations/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await fetchIntegration()
      toast.success("Integração ativada! Leads do LinkedIn serão sincronizados automaticamente.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao ativar integração")
    } finally {
      setActivating(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/integrations/linkedin", { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setIntegration(null)
      toast.success("LinkedIn desconectado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar")
    }
  }

  const toggleForm = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    )
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // ─── Não conectado ─────────────────────────────────────────────────────────
  if (!integration || integration.status === "DISCONNECTED" || integration.status === "PENDING") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
            <LinkedInIcon className="h-5 w-5 text-[#0A66C2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LinkedIn Lead Gen Forms</h1>
            <p className="text-muted-foreground text-sm">Capture leads dos seus anúncios automaticamente</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <LinkedInIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-lg">Integração não conectada</p>
              <p className="text-muted-foreground text-sm mt-1">
                Conecte sua conta LinkedIn Ads para sincronizar leads automaticamente
              </p>
            </div>
            <Link href="/integracoes/linkedin/connect">
              <Button className="bg-[#0A66C2] hover:bg-[#004182] text-white gap-2">
                <LinkedInIcon className="h-4 w-4" />
                Conectar LinkedIn
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* O que acontece quando um lead chega */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">O que acontece quando um lead preenche o formulário?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Users, label: "Contato criado automaticamente no CRM" },
              { icon: Tag, label: "Tag 'LINKEDIN' aplicada ao contato" },
              { icon: List, label: "Contato adicionado à lista 'LINKEDIN'" },
              { icon: Zap, label: "Deal criado no pipeline configurado" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#0A66C2]" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Conectado ─────────────────────────────────────────────────────────────
  const statusInfo = STATUS_LABEL[integration.status] ?? { label: integration.status, variant: "secondary" as const }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
            <LinkedInIcon className="h-5 w-5 text-[#0A66C2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LinkedIn Lead Gen Forms</h1>
            <p className="text-muted-foreground text-sm">
              {integration.linkedInMemberName && `Conectado como ${integration.linkedInMemberName}`}
            </p>
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{integration.totalLeads}</p>
            <p className="text-sm text-muted-foreground">Leads capturados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {integration.lastLeadAt
                ? new Date(integration.lastLeadAt).toLocaleDateString("pt-BR")
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Último lead</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Configure como os leads serão importados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Conta de anúncios */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Conta de Anúncios</label>
            {loadingAccounts ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {adAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Formulários */}
          {selectedAccount && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Lead Gen Forms</label>
              <p className="text-xs text-muted-foreground">
                Selecione quais formulários devem importar leads. Se nenhum selecionado, todos serão importados.
              </p>
              {loadingForms ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : forms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum formulário encontrado nesta conta.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {forms.map((form) => (
                    <label
                      key={form.id}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedForms.includes(form.id)}
                        onChange={() => toggleForm(form.id)}
                      />
                      <span className="text-sm">{form.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {form.status}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pipeline */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pipeline</label>
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Produto */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Produto</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info sobre tag/lista automáticas */}
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
              A tag <strong>LINKEDIN</strong> e a lista <strong>LINKEDIN</strong> serão criadas automaticamente
              e aplicadas a todos os leads importados.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#46347F] hover:bg-[#46347F]/90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuração"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Ativar webhook */}
      {integration.status === "CONFIGURED" && (
        <Card className="border-[#0A66C2]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#0A66C2]" />
              Ativar Integração
            </CardTitle>
            <CardDescription>
              Registra o webhook no LinkedIn para receber novos leads em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleActivate}
              disabled={activating || !selectedAccount}
              className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Ativar Recebimento de Leads
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status ACTIVE */}
      {integration.status === "ACTIVE" && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
            Integração ativa. Novos leads do LinkedIn serão importados automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Reativar se em erro */}
      {integration.status === "ERROR" && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            Ocorreu um erro na integração.{" "}
            <button
              onClick={handleActivate}
              className="underline font-medium"
            >
              Clique aqui para reativar
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Desconectar */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 gap-2">
                <Unplug className="h-4 w-4" />
                Desconectar LinkedIn
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar LinkedIn?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso remove o token de acesso e para de importar novos leads. Os leads já importados
                  não serão afetados. Você pode reconectar a qualquer momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Desconectar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LinkedInIntegrationPage() {
  return (
    <Suspense fallback={null}>
      <LinkedInIntegrationContent />
    </Suspense>
  )
}
