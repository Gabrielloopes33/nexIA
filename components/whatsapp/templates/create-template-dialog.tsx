"use client"

import { useState } from "react"
import { Plus, FileText, Loader2, AlertCircle } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { CreateTemplateRequest } from "@/lib/whatsapp/types"
import { TEMPLATE_CATEGORIES } from "@/lib/whatsapp/constants"

const formSchema = z.object({
  name: z.string()
    .min(2, "Nome muito curto")
    .max(512, "Nome muito longo")
    .regex(/^[a-z0-9_]+$/, "Apenas letras minúsculas, números e underscores"),
  category: z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION']),
  language: z.string().min(1, "Selecione o idioma"),
  header: z.object({
    enabled: z.boolean(),
    type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
    text: z.string().max(60).optional(),
  }),
  body: z.string()
    .min(1, "O corpo da mensagem é obrigatório")
    .max(1024, "Máximo de 1024 caracteres"),
  footer: z.string().max(60).optional(),
})

const languages = [
  { value: "pt_BR", label: "Português (Brasil)" },
  { value: "en_US", label: "English (US)" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
]

interface CreateTemplateDialogProps {
  onCreate: (request: CreateTemplateRequest) => Promise<void>
  disabled?: boolean
}

export function CreateTemplateDialog({ onCreate, disabled }: CreateTemplateDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "UTILITY",
      language: "pt_BR",
      header: {
        enabled: false,
        type: "TEXT",
        text: "",
      },
      body: "",
      footer: "",
    },
  })

  const headerEnabled = form.watch("header.enabled")
  const selectedCategory = form.watch("category")

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const components: CreateTemplateRequest['components'] = []

      if (values.header.enabled && values.header.text) {
        components.push({
          type: 'HEADER',
          format: values.header.type,
          text: values.header.text,
          example: values.header.type === 'TEXT' ? { header_text: [values.header.text] } : undefined,
        })
      }

      components.push({
        type: 'BODY',
        text: values.body,
        example: { body_text: [[values.body]] },
      })

      if (values.footer) {
        components.push({
          type: 'FOOTER',
          text: values.footer,
        })
      }

      await onCreate({
        name: values.name,
        category: values.category,
        language: values.language,
        components,
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
          Criar Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#46347F]" />
            Criar Template de Mensagem
          </DialogTitle>
          <DialogDescription>
            Crie um template para enviar mensagens fora da janela de 24 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Aprovação necessária</p>
              <p className="mt-1 text-amber-700">
                Todos os templates devem ser aprovados pela Meta antes de uso. 
                O processo pode levar até 24 horas.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                {/* Template Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Template</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="boas_vindas_cliente" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Apenas letras minúsculas, números e underscores
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Header */}
                <FormField
                  control={form.control}
                  name="header.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Adicionar Cabeçalho</FormLabel>
                        <FormDescription>
                          Opcional. Máximo 60 caracteres.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {headerEnabled && (
                  <FormField
                    control={form.control}
                    name="header.text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto do Cabeçalho</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Bem-vindo!" 
                            maxLength={60}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Body */}
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corpo da Mensagem *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Olá {{1}}, obrigado por entrar em contato..."
                          className="min-h-[100px]"
                          maxLength={1024}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Use {'{{1}}'}, {'{{2}}'} etc para variáveis. Máximo 1024 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Footer */}
                <FormField
                  control={form.control}
                  name="footer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rodapé</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="NexIA - Inteligência Artificial" 
                          maxLength={60}
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional. Máximo 60 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {TEMPLATE_CATEGORIES.find(c => c.value === selectedCategory)?.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-medium">Dica para aprovação rápida</p>
                  <p className="mt-1 text-blue-700">
                    Templates UTILITY precisam ter conteúdo claramente transacional 
                    (confirmações, atualizações, alertas). Evite linguagem promocional.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Template
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
