"use client"

import { useState } from "react"
import { Plus, Phone, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { AddPhoneNumberRequest } from "@/lib/whatsapp/types"

const formSchema = z.object({
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
  disabled?: boolean
}

export function AddNumberDialog({ onAdd, disabled }: AddNumberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      countryCode: "BR",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const country = countryCodes.find(c => c.value === values.countryCode)
      const cleanNumber = values.phoneNumber.replace(/\D/g, '')
      
      await onAdd({
        phoneNumber: `${country?.code || '+55'} ${cleanNumber}`,
        countryCode: values.countryCode,
      })
      
      setIsOpen(false)
      form.reset()
    } finally {
      setIsLoading(false)
    }
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#46347F]" />
            Adicionar Número de Telefone
          </DialogTitle>
          <DialogDescription>
            Adicione um novo número de telefone para usar com o WhatsApp Business API.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 98765-4321" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Inclua o DDD. Não inclua o código do país.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Verificação necessária</p>
                  <p className="mt-1 text-amber-700">
                    Após adicionar, você receberá um código de verificação via SMS ou 
                    chamada telefônica para confirmar a propriedade do número.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
                className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
