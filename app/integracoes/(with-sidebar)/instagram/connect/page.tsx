"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InstagramConnectButton } from "@/components/instagram";
import { Instagram, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { ConnectForm } from "./ConnectForm";

export default function InstagramConnectPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/integracoes/instagram">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Instagram className="h-6 w-6 text-pink-500" />
          Conectar Instagram
        </h1>
        <p className="text-muted-foreground mt-1">
          Conecte sua conta Instagram Business para gerenciar mensagens e métricas
        </p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <ConnectForm />
      </Suspense>

      {/* Requirements Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Requisitos</CardTitle>
          <CardDescription>
            Para conectar sua conta Instagram, você precisa:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Conta Instagram Business ou Creator</p>
                <p className="text-sm text-muted-foreground">
                  Contas pessoais não são suportadas
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Página do Facebook vinculada</p>
                <p className="text-sm text-muted-foreground">
                  Sua conta Instagram deve estar conectada a uma página do Facebook
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Permissões de administrador</p>
                <p className="text-sm text-muted-foreground">
                  Você deve ser administrador da página do Facebook
                </p>
              </div>
            </li>
          </ul>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Durante o processo de autorização, você precisará conceder permissões para:
              <ul className="mt-2 ml-4 list-disc">
                <li>Acessar informações básicas da conta</li>
                <li>Ler e enviar mensagens</li>
                <li>Acessar métricas e insights</li>
                <li>Gerenciar metadados da página</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Connect Card */}
      <Card>
        <CardHeader>
          <CardTitle>Iniciar Conexão</CardTitle>
          <CardDescription>
            Clique no botão abaixo para iniciar o processo de autorização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstagramConnectButton
            onSuccess={() => console.log("Redirecting to Facebook OAuth...")}
            onError={(err) => console.error(err)}
          />
        </CardContent>
      </Card>

      {/* Help Text */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Precisa de ajuda?{" "}
        <Link href="/docs/instagram-setup" className="text-primary hover:underline">
          Consulte nossa documentação
        </Link>
      </p>
    </div>
  );
}
