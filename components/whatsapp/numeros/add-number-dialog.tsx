"use client"

import { useState } from "react"
import { Plus, Phone, Loader2, Shield, KeyRound, Building2, Smartphone, BadgeCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmbeddedSignupButton } from "@/components/whatsapp/connect/embedded-signup-button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { AddPhoneNumberRequest } from "@/lib/whatsapp/types"
import { cn } from "@/lib/utils"

const simpleFormSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Número muito curto")
    .max(15, "Número muito longo")
    .regex(/^\+?[\d\s\-\(\)]+$/, "Número inválido"),
  countryCode: z.string().min(1, "Selecione o país"),
})

const countryCodes = [
  { value: "BR", label: "Brasil (+55)", code: "+55" },
  { value: "US", label: "Estados Unidos (+1)", code: "+1" },
  { value: "PT", label: "Portugal (+351)", code: "+351" },
  { value: "AR", label: "Argentina (+54)", code: "+54" },
  { value: "CL", label: "Chile (+56)", code: "+56" },
  { value: "CO", label: "Colômbia (+57)", code: "+57" },
  { value: "MX", label: "México (+52)", code: "+52" },
]

interface AddNumberDialogProps {
  onAdd: (request: AddPhoneNumberRequest) => Promise<void>
  onSuccess?: () => void
  disabled?: boolean
}

export function AddNumberDialog({ onAdd, onSuccess, disabled }: AddNumberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("embedded")
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Simple form (kept for backward compatibility if needed elsewhere, but not exposed in UI)
  const simpleForm = useForm<z.infer<typeof simpleFormSchema>>({
    resolver: zodResolver(simpleFormSchema),
    defaultValues: {
      phoneNumber: "",
      countryCode: "BR",
    },
  })

  // Official form state
  const [officialForm, setOfficialForm] = useState({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    displayPhoneNumber: "",
    verifiedName: "",
  })
  const [officialErrors, setOfficialErrors] = useState<Record<string, string | undefined>>({})
  const [showToken, setShowToken] = useState(false)

  const validateOfficialForm = (): boolean => {
    const errors: Record<string, string | undefined> = {}

    if (!officialForm.wabaId.trim()) {
      errors.wabaId = "WABA ID é obrigatório"
    } else if (!/^\d+$/.test(officialForm.wabaId.trim())) {
      errors.wabaId = "WABA ID deve conter apenas números"
    }

    if (!officialForm.phoneNumberId.trim()) {
      errors.phoneNumberId = "Phone Number ID é obrigatório"
    } else if (!/^\d+$/.test(officialForm.phoneNumberId.trim())) {
      errors.phoneNumberId = "Phone Number ID deve conter apenas números"
    }

    if (!officialForm.accessToken.trim()) {
      errors.accessToken = "Access Token é obrigatório"
    } else if (officialForm.accessToken.length < 20) {
      errors.accessToken = "Access Token parece inválido (muito curto)"
    }

    if (officialForm.displayPhoneNumber && !/^\+?[\d\s\-\(\)]{8,}$/.test(officialForm.displayPhoneNumber)) {
      errors.displayPhoneNumber = "Formato de telefone inválido"
    }

    setOfficialErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSimpleSubmit = async (values: z.infer<typeof simpleFormSchema>) => {
    setIsLoading(true)
    setResult(null)
    try {
      const country = countryCodes.find(c => c.value === values.countryCode)
      const cleanNumber = values.phoneNumber.replace(/\D/g, '')
      
      await onAdd({
        phoneNumber: `${country?.code || '+55'} ${cleanNumber}`,
        countryCode: values.countryCode,
      })
      
      setIsOpen(false)
      simpleForm.reset()
      onSuccess?.()
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao adicionar número",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!validateOfficialForm()) {
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
          name: officialForm.verifiedName || `WhatsApp ${officialForm.displayPhoneNumber || officialForm.phoneNumberId}`,
          phoneNumber: officialForm.displayPhoneNumber || officialForm.phoneNumberId,
          wabaId: officialForm.wabaId,
          phoneNumberId: officialForm.phoneNumberId,
          accessToken: officialForm.accessToken,
          displayPhoneNumber: officialForm.displayPhoneNumber || null,
          verifiedName: officialForm.verifiedName || null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsOpen(false)
        setOfficialForm({
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
          message: data.error || "Erro ao conectar conta oficial. Tente novamente.",
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

  const handleOfficialChange = (field: keyof typeof officialForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfficialForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (officialErrors[field]) {
      setOfficialErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleEmbeddedSuccess = () => {
    setIsOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Adicionar Número
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#46347F]" />
            Adicionar Número de Telefone
          </DialogTitle>
          <DialogDescription>
            Escolha como deseja conectar o número WhatsApp Business.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="embedded" className="gap-2">
              <Facebook className="h-4 w-4" />
              Embedded Signup
            </TabsTrigger>
            <TabsTrigger value="official" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Conexão Manual
            </TabsTrigger>
          </TabsList>

          {/* Embedded Signup Tab */}
          <TabsContent value="embedded" className="pt-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Facebook className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Conexão rápida com Facebook</p>
                    <p className="mt-1 text-blue-700">
                      Use o Embedded Signup da Meta para conectar sua conta WhatsApp Business de forma segura e automática.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <EmbeddedSignupButton 
                  onSuccess={handleEmbeddedSuccess}
                  onError={(err) => setResult({ type: "error", message: err })}
                />
              </div>

              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <p>
                  <strong>Nota:</strong> Você precisa ser administrador de um Business Manager da Meta. 
                  O domínio deve estar verificado no Facebook Developer Console.
                </p>
              </div>

              {result && activeTab === "embedded" && (
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
            </div>
          </TabsContent>

          {/* Manual Connection Tab */}
          <TabsContent value="official" className="pt-4">
            <form onSubmit={onOfficialSubmit} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Informações obtidas no{" "}
                  <a 
                    href="https://business.facebook.com/wa/manage/phone-numbers/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Facebook Business Manager
                  </a>
                  .
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wabaId" className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    WABA ID *
                  </Label>
                  <Input
                    id="wabaId"
                    placeholder="Ex: 123456789012345"
                    value={officialForm.wabaId}
                    onChange={handleOfficialChange("wabaId")}
                    className={cn(
                      "font-mono text-sm",
                      officialErrors.wabaId && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {officialErrors.wabaId ? (
                    <p className="text-xs text-red-500">{officialErrors.wabaId}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">ID da conta WhatsApp Business</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId" className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    Phone Number ID *
                  </Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="Ex: 109876543210987"
                    value={officialForm.phoneNumberId}
                    onChange={handleOfficialChange("phoneNumberId")}
                    className={cn(
                      "font-mono text-sm",
                      officialErrors.phoneNumberId && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {officialErrors.phoneNumberId ? (
                    <p className="text-xs text-red-500">{officialErrors.phoneNumberId}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">ID do número na Meta</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken" className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Access Token *
                </Label>
                <div className="relative">
                  <Input
                    id="accessToken"
                    type={showToken ? "text" : "password"}
                    placeholder="EAAxxxxx..."
                    value={officialForm.accessToken}
                    onChange={handleOfficialChange("accessToken")}
                    className={cn(
                      "pr-10 font-mono text-sm",
                      officialErrors.accessToken && "border-red-500 focus-visible:ring-red-500"
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
                {officialErrors.accessToken ? (
                  <p className="text-xs text-red-500">{officialErrors.accessToken}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    System User Token ou Page Access Token
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="displayPhoneNumber" className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Número de Telefone
                    <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="displayPhoneNumber"
                    placeholder="Ex: +55 11 98765-4321"
                    value={officialForm.displayPhoneNumber}
                    onChange={handleOfficialChange("displayPhoneNumber")}
                    className={cn(
                      officialErrors.displayPhoneNumber && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {officialErrors.displayPhoneNumber ? (
                    <p className="text-xs text-red-500">{officialErrors.displayPhoneNumber}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Formato internacional</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verifiedName" className="flex items-center gap-2 text-sm">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    Nome Verificado
                    <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="verifiedName"
                    placeholder="Ex: Minha Empresa"
                    value={officialForm.verifiedName}
                    onChange={handleOfficialChange("verifiedName")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome comercial no WhatsApp
                  </p>
                </div>
              </div>

              {result && activeTab === "official" && (
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

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Conectar Oficial
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
