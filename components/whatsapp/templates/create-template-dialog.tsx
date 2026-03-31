"use client"

import { useState } from "react"
import { Plus, FileText, Loader2, AlertCircle, Trash2 } from "lucide-react"
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
import { useForm, useFieldArray } from "react-hook-form"
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
  buttonsEnabled: z.boolean().default(false),
  buttons: z.array(
    z.object({
      type: z.enum(['QUICK_REPLY', 'URL']),
      text: z.string().min(1, "Texto obrigatório").max(25, "Máximo 25 caracteres"),
      url: z.string().optional(),
    })
  ).max(3, "Máximo de 3 botões").default([]),
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
      buttonsEnabled: false,
      buttons: [],
    },
  })

  const headerEnabled = form.watch("header.enabled")
  const buttonsEnabled = form.watch("buttonsEnabled")
  const selectedCategory = form.watch("category")

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "buttons",
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const components: CreateTemplateRequest['components'] = []

      if (values.header.enabled && values.header.text) {
        components.push({
          type: 'HEADER',
          format: values.header.type,
          text: values.header.text,
        })
      }

      components.push({
        type: 'BODY',
        text: values.body,
      })

      if (values.footer) {
        components.push({
          type: 'FOOTER',
          text: values.footer,
        })
      }

      if (values.buttonsEnabled && values.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: values.buttons.map((btn) => ({
            type: btn.type,
            text: btn.text,
            ...(btn.type === 'URL' && btn.url ? { url: btn.url } : {}),
          })),
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

                {/* Category - movido para cá para ficar visível */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
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
                          placeholder="Perci Consultoria" 
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

                {/* Buttons */}
                <FormField
                  control={form.control}
                  name="buttonsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Adicionar Botões</FormLabel>
                        <FormDescription>
                          Máximo de 3 botões. Tipos: resposta rápida ou link.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {buttonsEnabled && (
                  <div className="space-y-3 rounded-md border p-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Botão {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-600 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormField
                          control={form.control}
                          name={`buttons.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo do botão" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="QUICK_REPLY">Resposta Rápida</SelectItem>
                                  <SelectItem value="URL">Link (URL)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`buttons.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Texto do botão</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Sim" 
                                  maxLength={25}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch(`buttons.${index}.type`) === 'URL' && (
                          <FormField
                            control={form.control}
                            name={`buttons.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://..." 
                                    {...field} 
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {index < fields.length - 1 && <hr className="border-border/50" />}
                      </div>
                    ))}
                    {fields.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => append({ type: 'QUICK_REPLY', text: '', url: '' })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar botão
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
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

                <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium">Exemplo de template com botão</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">
{`Corpo:
Olá! Ontem aconteceu o workshop de NR1. Sabemos que imprevistos acontecem e liberamos o replay por 24 horas.

Você gostaria de receber o link?`}
                  </p>
                  <p className="mt-2 text-slate-600">
                    Botão: <strong>Sim</strong> (Resposta Rápida)
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ou use um botão <strong>Link (URL)</strong> para enviar o link diretamente.
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
