"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Building2,
  Smartphone,
  BadgeCheck,
  Phone
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ManualConnectionFormProps {
  organizationId: string
  onSuccess?: () => void
}

interface FormData {
  wabaId: string
  phoneNumberId: string
  accessToken: string
  displayPhoneNumber: string
  verifiedName: string
}

interface FormErrors {
  wabaId?: string
  phoneNumberId?: string
  accessToken?: string
  displayPhoneNumber?: string
  verifiedName?: string
}

export function ManualConnectionForm({ organizationId, onSuccess }: ManualConnectionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    displayPhoneNumber: "",
    verifiedName: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.wabaId.trim()) {
      newErrors.wabaId = "WABA ID é obrigatório"
    } else if (!/^\d+$/.test(formData.wabaId.trim())) {
      newErrors.wabaId = "WABA ID deve conter apenas números"
    }

    if (!formData.phoneNumberId.trim()) {
      newErrors.phoneNumberId = "Phone Number ID é obrigatório"
    } else if (!/^\d+$/.test(formData.phoneNumberId.trim())) {
      newErrors.phoneNumberId = "Phone Number ID deve conter apenas números"
    }

    if (!formData.accessToken.trim()) {
      newErrors.accessToken = "Access Token é obrigatório"
    } else if (formData.accessToken.length < 20) {
      newErrors.accessToken = "Access Token parece inválido (muito curto)"
    }

    // Optional fields validation - apenas formato
    if (formData.displayPhoneNumber && !/^\+?[\d\s\-\(\)]{8,}$/.test(formData.displayPhoneNumber)) {
      newErrors.displayPhoneNumber = "Formato de telefone inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/whatsapp/instances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          name: formData.verifiedName || `WhatsApp ${formData.displayPhoneNumber || formData.phoneNumberId}`,
          phoneNumber: formData.displayPhoneNumber || formData.phoneNumberId,
          wabaId: formData.wabaId,
          phoneNumberId: formData.phoneNumberId,
          accessToken: formData.accessToken,
          displayPhoneNumber: formData.displayPhoneNumber || null,
          verifiedName: formData.verifiedName || null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          type: "success",
          message: "Conta WhatsApp conectada com sucesso! A conexão foi salva no banco de dados.",
        })
        setFormData({
          wabaId: "",
          phoneNumberId: "",
          accessToken: "",
          displayPhoneNumber: "",
          verifiedName: "",
        })
        onSuccess?.()
      } else {
        setResult({
          type: "error",
          message: data.error || "Erro ao salvar conexão. Tente novamente.",
        })
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "Erro de conexão. Verifique sua internet e tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card className="border-[#25D366]/30 shadow-sm">
      <CardHeader className="bg-[#25D366]/5 border-b border-[#25D366]/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/10">
            <KeyRound className="h-5 w-5 text-[#25D366]" />
          </div>
          <div>
            <CardTitle className="text-lg">Conexão Manual</CardTitle>
            <CardDescription>
              Insira os dados da sua conta WhatsApp Business diretamente
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Helper Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-sm">
              Você pode obter essas informações no{" "}
              <a 
                href="https://business.facebook.com/wa/manage/phone-numbers/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                Facebook Business Manager
              </a>
              . Esta opção não requer configuração de domínio.
            </AlertDescription>
          </Alert>

          {/* Required Fields */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* WABA ID */}
            <div className="space-y-2">
              <Label htmlFor="wabaId" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                WABA ID *
              </Label>
              <Input
                id="wabaId"
                placeholder="Ex: 123456789012345"
                value={formData.wabaId}
                onChange={handleChange("wabaId")}
                className={cn(
                  "font-mono text-sm",
                  errors.wabaId && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.wabaId ? (
                <p className="text-xs text-red-500">{errors.wabaId}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ID da conta WhatsApp Business Account
                </p>
              )}
            </div>

            {/* Phone Number ID */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                Phone Number ID *
              </Label>
              <Input
                id="phoneNumberId"
                placeholder="Ex: 109876543210987"
                value={formData.phoneNumberId}
                onChange={handleChange("phoneNumberId")}
                className={cn(
                  "font-mono text-sm",
                  errors.phoneNumberId && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.phoneNumberId ? (
                <p className="text-xs text-red-500">{errors.phoneNumberId}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ID do número de telefone registrado
                </p>
              )}
            </div>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Access Token *
            </Label>
            <div className="relative">
              <Input
                id="accessToken"
                type={showToken ? "text" : "password"}
                placeholder="EAAxxxxx..."
                value={formData.accessToken}
                onChange={handleChange("accessToken")}
                className={cn(
                  "pr-10 font-mono text-sm",
                  errors.accessToken && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.accessToken ? (
              <p className="text-xs text-red-500">{errors.accessToken}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Token de acesso permanente (System User Token ou Page Access Token)
              </p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t">
            {/* Display Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="displayPhoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Número de Telefone
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="displayPhoneNumber"
                placeholder="Ex: +55 11 98765-4321"
                value={formData.displayPhoneNumber}
                onChange={handleChange("displayPhoneNumber")}
                className={cn(
                  errors.displayPhoneNumber && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.displayPhoneNumber ? (
                <p className="text-xs text-red-500">{errors.displayPhoneNumber}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Número no formato internacional
                </p>
              )}
            </div>

            {/* Verified Name */}
            <div className="space-y-2">
              <Label htmlFor="verifiedName" className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                Nome Verificado
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="verifiedName"
                placeholder="Ex: Minha Empresa"
                value={formData.verifiedName}
                onChange={handleChange("verifiedName")}
              />
              <p className="text-xs text-muted-foreground">
                Nome comercial verificado no WhatsApp
              </p>
            </div>
          </div>

          {/* Result Messages */}
          {result && (
            <Alert 
              className={cn(
                result.type === "success" 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-red-50 border-red-200"
              )}
            >
              {result.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription 
                className={cn(
                  result.type === "success" ? "text-emerald-700" : "text-red-700"
                )}
              >
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              * Campos obrigatórios
            </p>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#25D366] hover:bg-[#25D366]/90 text-white min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Conectando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Conectar
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Segurança:</strong> O Access Token é armazenado de forma segura no banco 
              de dados. Em ambiente de produção, recomenda-se criptografar os tokens. 
              Nunca compartilhe este token com terceiros.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
