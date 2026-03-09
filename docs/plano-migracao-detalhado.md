# Plano de Migração: Meta Integrations + Pipeline CRM

**Baseado em:** análise real dos dois repositórios
**Data:** 09/03/2026
**Versão:** 5.0

---

## Princípios dos Ciclos

- Cada ciclo tem **um entregável deployável** e **não quebra o que já existe**
- Branch por ciclo: `feat/ciclo-XX-nome` → PR → deploy de preview no Netlify → aprovação → merge
- Agentes atuam **juntos dentro do ciclo**, não em sequência
- `@sm` cria a story antes do ciclo iniciar; `@qa` valida antes do merge
- Dados mock no frontend só são removidos quando o banco real está pronto no mesmo ciclo

---

## Agentes e Papéis

| Agente | Papel |
|---|---|
| `@aios-master` | Orquestração, desbloqueia impedimentos entre ciclos |
| `@architect` | Valida decisões técnicas antes de implementar |
| `@dev` | Implementação: API routes, lógica, portagem do Aurea |
| `@ux-design-expert` | Componentes: reescreve JSX do Aurea no design system do CRM |
| `@devops` | Netlify, env vars, webhooks, deploy |
| `@qa` | Testes, validação de aceite, edge cases |
| `@analyst` | Lead score, estrutura de dados do Deal |
| `@sm` | Cria stories, quebra tarefas, acompanha progresso |
| `@po` | Aprova critérios de aceite antes de cada ciclo |

---

## Regra Visual (vale para todos os ciclos)

Todo componente novo ou portado usa exclusivamente:
- Primitivos: `Card`, `Button`, `Badge`, `Dialog`, `Input` de `@/components/ui`
- Cores: variáveis CSS do sistema (`bg-background`, `text-muted-foreground`) — nunca hex fixo exceto `#9795e4` (cor de marca)
- Ícones: `lucide-react`
- Utilitários: `cn()` de `@/lib/utils`
- Dark mode: coberto pelas variáveis oklch existentes

---

## CICLO 1 — Multi-tenancy Foundation
**Branch:** `feat/ciclo-01-organization-schema`
**Entregável:** Modelos `Organization`, `OrganizationMember`, `OrganizationUnit` e `User` no banco, sem quebrar nada existente

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-01-organization-schema.md` |
| `@po` | Valida: usuário pode pertencer a múltiplas orgs com roles diferentes |
| `@architect` | Revisa schema antes de qualquer migration; define como `organization_id` será passado nas API routes |
| `@dev` | Adiciona modelos ao `prisma/schema.prisma` e roda migration |
| `@qa` | Verifica que migration roda sem erro e build não quebra |
| `@devops` | Garante que `DATABASE_URL` de staging está configurada no Netlify |

### Schema a adicionar

```prisma
model Organization { ... }      // name, slug, ownerId, feature flags
model OrganizationMember { ... } // organizationId, userId, role, status
model OrganizationUnit { ... }   // organizationId, name, slug, isDefault
model User { ... }               // email, name, avatarUrl
```

### Critérios de aceite
- [ ] Migration roda sem erro
- [ ] `npx prisma generate` sem erros
- [ ] Build do Next.js passa
- [ ] Nenhuma página existente quebra

---

## CICLO 2 — WhatsApp Instance Schema
**Branch:** `feat/ciclo-02-whatsapp-schema`
**Entregável:** Modelos WhatsApp no banco, antigos removidos, `lib/db/whatsapp.ts` atualizado

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-02-whatsapp-schema.md` |
| `@architect` | Valida remoção dos modelos antigos vs novo `WhatsAppInstance` flat; confirma se há dados em produção para migrar |
| `@dev` | Remove modelos antigos (`WhatsAppBusinessAccount`, etc.), adiciona `WhatsAppInstance`, `WhatsAppTemplate`, `WhatsAppLog`, atualiza `lib/db/whatsapp.ts` |
| `@qa` | Build passa, nenhuma API route quebra em runtime |

### Schema a adicionar/remover

```
REMOVER: WhatsAppBusinessAccount, WhatsAppPhoneNumber, MessageTemplate,
         WhatsAppConversation, WhatsAppMessage, WebhookEvent, WhatsAppAnalytics

ADICIONAR: WhatsAppInstance (com organization_id), WhatsAppTemplate, WhatsAppLog
           Contact, Conversation, Message
```

### Critérios de aceite
- [ ] Migration sem erro
- [ ] Build passa
- [ ] `lib/db/whatsapp.ts` atualizado para os novos modelos
- [ ] Nenhuma rota existente quebra (podem retornar dados vazios, mas não 500)

---

## CICLO 3 — Instagram + Pipeline Schema
**Branch:** `feat/ciclo-03-instagram-pipeline-schema`
**Entregável:** Modelos Instagram, Pipeline e Deal com ActivityLog no banco

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-03-instagram-pipeline-schema.md` |
| `@analyst` | Define campos padrão do `metadata` Json no `Deal` e fórmula inicial do `leadScore` |
| `@architect` | Valida schema do `DealActivity` e relacionamentos |
| `@dev` | Adiciona `InstagramInstance`, `PipelineStage`, `Deal`, `DealActivity` ao schema e roda migration |
| `@qa` | Build passa, Prisma Client gerado sem erros |

### Schema a adicionar

```
InstagramInstance    // organization_id, page_id, instagram_business_account_id, tokens
PipelineStage        // organization_id, name, position, color, probability
Deal                 // organization_id, contact_id, stage_id, amount, leadScore, metadata Json
DealActivity         // deal_id, type, title, content, metadata Json, scoreImpact
```

### Critérios de aceite
- [ ] Migration sem erro
- [ ] Build passa
- [ ] `@analyst` aprova estrutura do `metadata` e `DealActivity`

---

## CICLO 4 — Embedded Signup Real
**Branch:** `feat/ciclo-04-embedded-signup-real`
**Entregável:** Fluxo completo de conexão WhatsApp via Embedded Signup salvando no banco real

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-04-embedded-signup.md` |
| `@architect` | Confirma qual fluxo está ativo no Meta Developer Portal (Tech Provider sem `redirect_uri` vs Standard com `redirect_uri`) |
| `@dev` | Substitui `saveAccountToDatabase` (TODO/mock) pela lógica real portada do `meta-auth` do Aurea; upsert em `WhatsAppInstance` via Prisma |
| `@ux-design-expert` | Porta `EmbeddedSignupButton.tsx` do Aurea para `components/integrations/EmbeddedSignupButton.tsx` usando shadcn/ui |
| `@devops` | Configura `META_APP_ID`, `META_APP_SECRET` no Netlify |
| `@qa` | Testa fluxo completo: clicar → popup Facebook → callback → instância salva no banco |

### Arquivos de referência no Aurea
- `apps/aurea/supabase/functions/meta-auth/index.ts` — lógica de `embedded_signup_complete`
- `apps/aurea/src/components/MetaAPI/EmbeddedSignupButton.tsx` — componente visual

### Critérios de aceite
- [ ] Clicar em "Conectar WhatsApp" abre popup Meta
- [ ] Após autorizar, instância aparece salva no banco
- [ ] Status exibido corretamente na UI
- [ ] Token de acesso guardado (sem expor na resposta da API)
- [ ] Visual do botão segue design system do CRM

---

## CICLO 5 — WhatsApp Send + Webhook
**Branch:** `feat/ciclo-05-whatsapp-send-webhook`
**Entregável:** Envio real de mensagens WhatsApp e recebimento via webhook funcional

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-05-whatsapp-send-webhook.md` |
| `@dev` | Porta `meta-send/index.ts` do Aurea para `/api/whatsapp/messages/send`; implementa `/api/whatsapp/webhooks` (GET verificação + POST processamento) |
| `@devops` | Registra URL do webhook no Meta Developer Portal; configura `WEBHOOK_VERIFY_TOKEN` no Netlify |
| `@qa` | Testa envio de texto, template e imagem; simula webhook de mensagem recebida e status update |

### Tipos de mensagem a suportar (do meta-send)
`text`, `template`, `image`, `video`, `audio`, `document`, `location`, `interactive`

### Critérios de aceite
- [ ] Mensagem de texto enviada com sucesso via API
- [ ] Mensagem salva em `Conversation` + `Message` no banco
- [ ] Webhook de verificação Meta retorna `hub.challenge`
- [ ] Webhook de mensagem recebida cria `Message` no banco
- [ ] Webhook de status update atualiza `Message.status`
- [ ] Logs salvos em `WhatsAppLog`

---

## CICLO 6 — WhatsApp UI Conectada
**Branch:** `feat/ciclo-06-whatsapp-ui-real`
**Entregável:** Todas as páginas `/integracoes/whatsapp/*` usando dados reais do banco

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-06-whatsapp-ui.md` |
| `@ux-design-expert` | Porta `BusinessProfileSection` e `WebhookLogsSection` do Aurea para o design system do CRM; conecta páginas existentes às API routes reais |
| `@dev` | Completa routes: `/api/whatsapp/templates/sync`, `/api/whatsapp/status`, `/api/whatsapp/phone-numbers` |
| `@qa` | Valida que visual não mudou, dados aparecem corretamente, estados de loading/empty/error funcionam |

### Páginas a conectar
- `/integracoes/whatsapp` → lista de instâncias reais
- `/integracoes/whatsapp/connect` → `EmbeddedSignupButton` real
- `/integracoes/whatsapp/templates` → templates reais + botão sync
- `/integracoes/whatsapp/webhooks` → logs reais da tabela `WhatsAppLog`

### Critérios de aceite
- [ ] Nenhuma página usa dados mock
- [ ] Estados de loading e empty state implementados
- [ ] Visual idêntico ao que existia (apenas dados reais no lugar de mock)
- [ ] Sync de templates funciona e atualiza a lista

---

## CICLO 7 — Instagram Auth + Connect
**Branch:** `feat/ciclo-07-instagram-auth`
**Entregável:** Fluxo de conexão Instagram funcionando e salvando no banco

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-07-instagram-auth.md` |
| `@architect` | Valida o fluxo OAuth Instagram (short-lived → long-lived token, pages → instagram business account) |
| `@dev` | Porta `meta-instagram-auth/index.ts` do Aurea para `/api/instagram/auth`; remove dependência do `CENTRAL_AGENT_ID` hardcodado |
| `@ux-design-expert` | Cria página `/integracoes/instagram/connect` seguindo exatamente o visual da página WhatsApp connect |
| `@devops` | Configura permissões `instagram_basic`, `instagram_manage_messages` no app Meta |
| `@qa` | Testa fluxo completo: OAuth → token long-lived → instância salva |

### Arquivo de referência no Aurea
- `apps/aurea/supabase/functions/meta-instagram-auth/index.ts`

### Critérios de aceite
- [ ] Fluxo OAuth Instagram completo sem erros
- [ ] `InstagramInstance` salva no banco com token long-lived
- [ ] Página de connect segue visual das páginas WhatsApp
- [ ] `CENTRAL_AGENT_ID` removido (sem dependência hardcodada)

---

## CICLO 8 — Instagram Send + UI
**Branch:** `feat/ciclo-08-instagram-send-ui`
**Entregável:** Envio de DMs Instagram + páginas Instagram com dados reais

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-08-instagram-send-ui.md` |
| `@dev` | Porta `meta-instagram-send` e `meta-instagram-insights` do Aurea para API routes; implementa webhook Instagram |
| `@ux-design-expert` | Porta componentes `Instagram/` do Aurea: `AccountSection`, `DirectSection`, `LogsSection`, `MetricsSection` — todos reescritos com shadcn/ui; cria páginas `/integracoes/instagram/*` |
| `@devops` | Registra URL webhook Instagram no Meta Developer Portal |
| `@qa` | Testa envio de DM, recebimento via webhook, exibição de métricas |

### Componentes a portar do Aurea
`InstagramAccountSection`, `InstagramDirectSection`, `InstagramLogsSection`, `InstagramMetricsSection`, `InstagramMediaSection`

### Critérios de aceite
- [ ] DM Instagram enviada com sucesso
- [ ] Webhook de mensagem recebida processa e salva no banco
- [ ] Páginas Instagram com dados reais, visual consistente com WhatsApp
- [ ] Métricas exibidas corretamente

---

## CICLO 9 — Pipeline Real
**Branch:** `feat/ciclo-09-pipeline-real`
**Entregável:** Kanban conectado ao banco, drag-and-drop salvando, modal de deal funcional

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-09-pipeline-real.md` |
| `@analyst` | Finaliza definição dos campos do `metadata` e fórmula do `leadScore` |
| `@dev` | Cria API routes `/api/pipeline/stages` e `/api/pipeline/deals`; substitui `gerarDealsMock()` por fetch real; implementa move de stage |
| `@ux-design-expert` | Cria `DealDetailModal` usando `Dialog` shadcn com timeline de activities, campos de `metadata`, lead score e input de nova nota |
| `@qa` | Valida kanban (criar deal, mover entre colunas, abrir modal), verifica que `DealActivity` é criada ao mover stage |

### Critérios de aceite
- [ ] Estágios do kanban carregados do banco
- [ ] Deals carregados do banco por estágio
- [ ] Drag-and-drop salva novo `stage_id` e cria `DealActivity` de `stage_change`
- [ ] Modal de deal exibe dados reais + timeline de activities
- [ ] Nova nota salva como `DealActivity` do tipo `note`
- [ ] Visual do kanban idêntico ao atual (só a fonte de dados muda)

---

## CICLO 10 — Conversations + Deal Bridge
**Branch:** `feat/ciclo-10-conversations-deal-bridge`
**Entregável:** Mensagens WhatsApp/Instagram registram `DealActivity` no deal ativo do contato

### Agentes

| Agente | O que faz neste ciclo |
|---|---|
| `@sm` | Cria story `docs/stories/ciclo-10-conversations-deal-bridge.md` |
| `@analyst` | Define `scoreImpact` padrão por tipo de interação (ex: mensagem recebida = +2, reunião = +10) |
| `@dev` | Ao processar webhook de mensagem recebida: se contato tem deal ativo, cria `DealActivity` do tipo `whatsapp_message` ou `instagram_message`; calcula novo `leadScore` |
| `@ux-design-expert` | Adiciona badge/link discreto no chat quando contato tem deal ativo (segue padrão visual dos badges existentes) |
| `@qa` | Testa: mensagem recebida → deal activity criada → lead score atualizado → badge aparece no chat |

### Critérios de aceite
- [ ] Mensagem recebida de contato com deal ativo cria `DealActivity`
- [ ] `leadScore` atualizado após cada activity
- [ ] Badge no chat mostra deal relacionado sem poluir o visual
- [ ] Contato sem deal: nenhum comportamento muda

---

## Sequência de Deploy

```
Ciclo 1  → sem risco (só adiciona tabelas novas)
Ciclo 2  → atenção: remove modelos antigos (backup antes)
Ciclo 3  → sem risco (só adiciona)
Ciclo 4  → primeiro deploy com integração Meta real
Ciclo 5  → primeiro envio real de mensagens
Ciclo 6  → remove mocks do WhatsApp UI
Ciclo 7  → primeiro deploy Instagram
Ciclo 8  → Instagram completo
Ciclo 9  → remove mocks do Pipeline
Ciclo 10 → integração entre canais e pipeline
```

---

## Stories a criar (via `@sm`)

```
@sm *create-story "Ciclo 01 - Organization Schema"
@sm *create-story "Ciclo 02 - WhatsApp Instance Schema"
@sm *create-story "Ciclo 03 - Instagram + Pipeline Schema"
@sm *create-story "Ciclo 04 - Embedded Signup Real"
@sm *create-story "Ciclo 05 - WhatsApp Send + Webhook"
@sm *create-story "Ciclo 06 - WhatsApp UI Conectada"
@sm *create-story "Ciclo 07 - Instagram Auth + Connect"
@sm *create-story "Ciclo 08 - Instagram Send + UI"
@sm *create-story "Ciclo 09 - Pipeline Real"
@sm *create-story "Ciclo 10 - Conversations + Deal Bridge"
```

---

## Riscos

| Risco | Ciclo afetado | Ação |
|---|---|---|
| Tech Provider vs Standard Signup (redirect_uri) | Ciclo 4 | `@architect` confirma no Meta Developer Portal antes de implementar |
| Migração destrutiva dos modelos WhatsApp antigos | Ciclo 2 | `@devops` faz backup do banco antes |
| `organization_id` nas API routes sem auth definida | Ciclos 4-10 | Definir estratégia de auth antes do Ciclo 4 (`@architect`) |
| `CENTRAL_AGENT_ID` hardcodado no Aurea Instagram | Ciclo 7 | `@dev` remove na portagem |
| Tokens em texto puro no banco | Todos | Risco documentado, resolver em ciclo futuro |

---

## Arquivos de Referência no Aurea

| O que portar | Arquivo |
|---|---|
| OAuth WhatsApp | `apps/aurea/supabase/functions/meta-auth/index.ts` |
| Envio mensagens | `apps/aurea/supabase/functions/meta-send/index.ts` |
| Templates | `apps/aurea/supabase/functions/meta-templates/index.ts` |
| OAuth Instagram | `apps/aurea/supabase/functions/meta-instagram-auth/index.ts` |
| Envio Instagram DM | `apps/aurea/supabase/functions/meta-instagram-send/index.ts` |
| Métricas Instagram | `apps/aurea/supabase/functions/meta-instagram-insights/index.ts` |
| Botão Embedded Signup | `apps/aurea/src/components/MetaAPI/EmbeddedSignupButton.tsx` |
| Seções WhatsApp | `apps/aurea/src/components/MetaAPI/` |
| Componentes Instagram | `apps/aurea/src/components/Instagram/` |
| Schema banco | `apps/aurea/database-aurea/database/migrations/schema.sql` |

---

**Versão:** 5.0 — 09/03/2026
