"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Package,
  Check,
  Users,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlans } from "@/hooks/use-plans"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import { toast } from "sonner"

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export default function PlanosPage() {
  const { plans, isLoading: isLoadingPlans, error: errorPlans, refetch: refetchPlans, updatePlan } = usePlans()
  const { subscriptions, isLoading: isLoadingSubscriptions } = useSubscriptions()
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null)

  const isLoading = isLoadingPlans || isLoadingSubscriptions

  const toggleStatus = async (id: string, currentStatus: string) => {
    setUpdatingPlanId(id)
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const success = await updatePlan(id, { status: newStatus })
      if (success) {
        toast.success(`Plano ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`)
      } else {
        toast.error("Erro ao atualizar status do plano")
      }
    } finally {
      setUpdatingPlanId(null)
    }
  }

  // Calcular estatísticas
  const totalClientes = subscriptions.filter(s => s.status === 'active').length
  const mrrTotal = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, sub) => acc + (sub.plan?.priceCents || 0), 0)

  // Encontrar plano mais popular
  const planCounts = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, sub) => {
      acc[sub.planId] = (acc[sub.planId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  const mostPopularPlanId = Object.entries(planCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    )
  }

  if (errorPlans) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold">Erro ao carregar planos</h3>
          <p className="text-muted-foreground">{errorPlans}</p>
          <Button onClick={refetchPlans} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos e Preços</h1>
          <p className="text-sm text-muted-foreground">
            Configure os planos disponíveis para seus clientes
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Planos</p>
            <p className="text-3xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Clientes Ativos</p>
            <p className="text-3xl font-bold text-[#46347F]">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MRR Total</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(mrrTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Planos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plano) => {
          const clientesCount = planCounts[plano.id] || 0
          const isPopular = plano.id === mostPopularPlanId && clientesCount > 0
          const isUpdating = updatingPlanId === plano.id

          return (
            <Card 
              key={plano.id} 
              className={cn(
                "shadow-sm hover:shadow-md transition-shadow",
                isPopular && "ring-2 ring-[#46347F]"
              )}
            >
              {isPopular && (
                <div className="bg-[#46347F] text-white text-xs font-medium text-center py-1">
                  Mais Popular
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{plano.name}</h3>
                    <p className="text-xs text-muted-foreground">{plano.description || 'Sem descrição'}</p>
                  </div>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch 
                      checked={plano.status === "active"}
                      onCheckedChange={() => toggleStatus(plano.id, plano.status)}
                      disabled={isUpdating}
                    />
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">{formatCurrency(plano.priceCents)}</span>
                  <span className="text-sm text-muted-foreground">/{plano.interval === 'monthly' ? 'mês' : 'ano'}</span>
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{clientesCount} clientes ativos</span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground">Recursos:</p>
                  {Array.isArray(plano.features) && plano.features.length > 0 ? (
                    plano.features.slice(0, 4).map((recurso: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-muted-foreground">{recurso}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sem recursos definidos</p>
                  )}
                  {Array.isArray(plano.features) && plano.features.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{plano.features.length - 4} recursos</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 border-0 shadow-sm">
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {plans.length === 0 && (
        <Card className="shadow-sm border-dashed border-2 border-muted">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-[#46347F]/10 flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 text-[#46347F]" />
            </div>
            <h3 className="font-medium mb-2">Nenhum plano encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro plano para começar a receber assinaturas
            </p>
            <Button className="bg-[#46347F] hover:bg-[#46347F]">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Plan Card */}
      <Card className="shadow-sm border-dashed border-2 border-muted">
        <CardContent className="p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-[#46347F]/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-6 w-6 text-[#46347F]" />
          </div>
          <h3 className="font-medium mb-2">Criar Novo Plano</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione um novo plano com recursos e preços personalizados
          </p>
          <Button className="bg-[#46347F] hover:bg-[#46347F]">
            Configurar Plano
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
