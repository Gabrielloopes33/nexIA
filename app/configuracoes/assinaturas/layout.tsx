"use client"

import { useOrganization } from "@/lib/contexts/organization-context"
import { Button } from "@/components/ui/button"
import { Loader2, Lock } from "lucide-react"
import Link from "next/link"

export default function AssinaturasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, isLoading } = useOrganization()
  const isOwner = role === "OWNER"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Apenas OWNER pode acessar
  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas proprietários da organização podem acessar a área de assinaturas.
          </p>
          <Link href="/configuracoes">
            <Button variant="outline">
              Voltar para Configurações
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
