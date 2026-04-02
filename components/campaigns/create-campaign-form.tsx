"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users, Tag, MousePointer, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCampaigns, type AudienceType } from '@/hooks/use-campaigns'
import { useWhatsAppInstances } from '@/hooks/use-whatsapp-instances'
import { useTags } from '@/hooks/use-tags'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import { toast } from 'sonner'
import { TagBadge } from '@/components/ui/tag-badge'

interface Template {
  id: string
  name: string
  language: string
  status: string
  body?: string
  components?: unknown[]
}

interface Contact {
  id: string
  name?: string | null
  phone: string
  tags: string[]
}

export function CreateCampaignForm() {
  const router = useRouter()
  const orgId = useOrganizationId()
  const { createCampaign } = useCampaigns()
  const { instances, isLoading: loadingInstances } = useWhatsAppInstances(orgId)

  const [name, setName] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [audienceType, setAudienceType] = useState<AudienceType>('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])

  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [tagMode, setTagMode] = useState<'existing' | 'new'>('existing')
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [newTagName, setNewTagName] = useState<string>('')

  const { tags: existingTags, isLoading: loadingTags, createTag } = useTags(orgId)
  const connectedInstances = instances.filter((i) => i.status === 'CONNECTED' && i.type === 'OFFICIAL')

  // Load templates when instance changes
  useEffect(() => {
    if (!instanceId) {
      setTemplates([])
      setSelectedTemplate(null)
      return
    }
    setLoadingTemplates(true)
    fetch(`/api/whatsapp/templates?instanceId=${instanceId}&status=APPROVED`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTemplates((data.data?.templates || []).filter((t: Template) => t.status === 'APPROVED'))
        }
      })
      .catch(() => toast.error('Erro ao carregar templates'))
      .finally(() => setLoadingTemplates(false))
  }, [instanceId])

  // Load contacts and tags
  useEffect(() => {
    if (!orgId) return
    setLoadingContacts(true)
    fetch('/api/contacts?status=ACTIVE&limit=500')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const contactList: Contact[] = data.data || []
          setContacts(contactList)
          const tagSet = new Set<string>()
          contactList.forEach((c) => (c.tags || []).forEach((t) => tagSet.add(t)))
          setAllTags(Array.from(tagSet).sort())
        }
      })
      .catch(() => {})
      .finally(() => setLoadingContacts(false))
  }, [orgId])

  // Calculate preview count
  useEffect(() => {
    if (audienceType === 'ALL') {
      setPreviewCount(contacts.length)
    } else if (audienceType === 'BY_TAG') {
      if (selectedTags.length === 0) {
        setPreviewCount(0)
      } else {
        const count = contacts.filter((c) =>
          c.tags.some((t) => selectedTags.includes(t))
        ).length
        setPreviewCount(count)
      }
    } else {
      setPreviewCount(selectedContactIds.length)
    }
  }, [audienceType, selectedTags, selectedContactIds, contacts])

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }, [])

  const toggleContact = useCallback((id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Digite o nome da campanha')
    if (!instanceId) return toast.error('Selecione uma instância WhatsApp')
    if (!selectedTemplate) return toast.error('Selecione um template')
    if (tagMode === 'existing' && !selectedTagId) return toast.error('Selecione uma tag para a campanha')
    if (tagMode === 'new' && !newTagName.trim()) return toast.error('Digite o nome da nova tag')
    if (audienceType === 'BY_TAG' && selectedTags.length === 0) return toast.error('Selecione ao menos uma tag de audiência')
    if (audienceType === 'MANUAL' && selectedContactIds.length === 0) return toast.error('Selecione ao menos um contato')

    setIsSubmitting(true)

    let resolvedTagId = tagMode === 'existing' ? selectedTagId : undefined
    let resolvedNewTagName = tagMode === 'new' ? newTagName.trim() : undefined

    // If creating a new tag inline, create it first
    if (tagMode === 'new' && resolvedNewTagName) {
      const created = await createTag({ name: resolvedNewTagName, color: '#f59e0b', source: 'campanha' })
      if (created) {
        resolvedTagId = created.id
        resolvedNewTagName = undefined
      } else {
        setIsSubmitting(false)
        return
      }
    }

    const result = await createCampaign({
      name: name.trim(),
      instanceId,
      templateName: selectedTemplate.name,
      templateLanguage: selectedTemplate.language,
      templateComponents: selectedTemplate.components,
      audienceType,
      audienceTags: audienceType === 'BY_TAG' ? selectedTags : undefined,
      contactIds: audienceType === 'MANUAL' ? selectedContactIds : undefined,
      tagId: resolvedTagId,
      newTagName: resolvedNewTagName,
    })
    setIsSubmitting(false)

    if (result) {
      router.push('/campanhas')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Nome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="name">Nome da campanha</Label>
            <Input
              id="name"
              placeholder="Ex: Promoção Black Friday"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tag da Campanha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tag da Campanha</CardTitle>
          <CardDescription>Toda campanha precisa estar atrelada a uma tag</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTagMode('existing')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tagMode === 'existing'
                  ? 'border-[#46347F] bg-[#46347F]/5 text-[#46347F]'
                  : 'border-border hover:border-[#46347F]/40'
              }`}
            >
              Tag existente
            </button>
            <button
              type="button"
              onClick={() => setTagMode('new')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tagMode === 'new'
                  ? 'border-[#46347F] bg-[#46347F]/5 text-[#46347F]'
                  : 'border-border hover:border-[#46347F]/40'
              }`}
            >
              Criar nova tag
            </button>
          </div>

          {tagMode === 'existing' ? (
            <div className="space-y-2">
              <Label>Selecione a tag</Label>
              {loadingTags ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando tags...
                </div>
              ) : existingTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tag encontrada. Crie uma nova tag.</p>
              ) : (
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingTags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-tag-name">Nome da nova tag</Label>
              <Input
                id="new-tag-name"
                placeholder="Ex: Black Friday 2026"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instância */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instância WhatsApp</CardTitle>
          <CardDescription>Selecione a conta WhatsApp Business para envio</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInstances ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando instâncias...
            </div>
          ) : connectedInstances.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma instância da API Oficial conectada. Conecte em{' '}
                <a href="/meta-api/whatsapp/connect" className="text-[#46347F] underline">
                  API Oficial Meta
                </a>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <Select value={instanceId} onValueChange={setInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {connectedInstances.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {inst.name} ({inst.phoneNumber})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Template */}
      {instanceId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template de Mensagem</CardTitle>
            <CardDescription>Apenas templates aprovados pela Meta estão disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates...
              </div>
            ) : templates.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum template aprovado encontrado. Crie templates em{' '}
                  <a href="/meta-api/whatsapp/templates" className="text-[#46347F] underline">
                    Templates
                  </a>
                  .
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Select
                  value={selectedTemplate?.name || ''}
                  onValueChange={(name) => {
                    const t = templates.find((t) => t.name === name)
                    setSelectedTemplate(t || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id || t.name} value={t.name}>
                        {t.name} ({t.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplate?.body && (
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Pré-visualização:</p>
                    <p>{selectedTemplate.body}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audiência */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audiência</CardTitle>
          <CardDescription>Defina quem receberá esta campanha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'ALL' as AudienceType, label: 'Todos os contatos', icon: Users },
              { type: 'BY_TAG' as AudienceType, label: 'Por tag', icon: Tag },
              { type: 'MANUAL' as AudienceType, label: 'Seleção manual', icon: MousePointer },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setAudienceType(type)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                  audienceType === type
                    ? 'border-[#46347F] bg-[#46347F]/5 text-[#46347F]'
                    : 'border-border hover:border-[#46347F]/40'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {/* Tags selector */}
          {audienceType === 'BY_TAG' && (
            <div className="space-y-2">
              <Label>Selecione as tags</Label>
              {allTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tag encontrada nos contatos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-[#46347F] hover:bg-[#46347F]/90'
                          : 'hover:border-[#46347F]/40'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual selector */}
          {audienceType === 'MANUAL' && (
            <div className="space-y-2">
              <Label>Selecione os contatos</Label>
              {loadingContacts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando contatos...
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedContactIds.includes(contact.id)}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{contact.name || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview count */}
          {previewCount !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-[#46347F]/5 border border-[#46347F]/20 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-[#46347F]" />
              <span className="text-sm font-medium text-[#46347F]">
                {previewCount} contato{previewCount !== 1 ? 's' : ''} serão atingidos
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/campanhas')} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !name ||
            !instanceId ||
            !selectedTemplate ||
            previewCount === 0 ||
            (tagMode === 'existing' && !selectedTagId) ||
            (tagMode === 'new' && !newTagName.trim())
          }
          className="bg-[#46347F] hover:bg-[#3a2c6b]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar Campanha'
          )}
        </Button>
      </div>
    </div>
  )
}
