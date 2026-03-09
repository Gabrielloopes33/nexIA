# CICLO 3 — Instagram + Pipeline Schema

**Branch:** `feat/ciclo-03-instagram-pipeline-schema`
**Entregável:** Modelos Instagram, Pipeline e Deal com ActivityLog no banco

---

## Resumo

Este ciclo adiciona suporte ao Instagram Business API e implementa um pipeline CRM completo com deals, stages e activity tracking.

## Schema Adicionado

### InstagramInstance
Configuração de integração com Instagram Business.

- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `name`: String (nome amigável)
- `pageId`: String (ID da página do Facebook)
- `instagramBusinessAccountId`: String (ID da conta business no Instagram)
- `accessToken`: String? (token de acesso)
- `refreshToken`: String?
- `tokenExpiresAt`: DateTime?
- `username`: String? (nome de usuário Instagram)
- `profilePictureUrl`: String?
- `status`: InstagramInstanceStatus @default(DISCONNECTED)
- `webhookVerifyToken`: String?
- `settings`: Json?
- `lastSyncAt`: DateTime?
- Timestamps: `createdAt`, `updatedAt`, `connectedAt`

### PipelineStage
Etapas do funil de vendas.

- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `name`: String
- `position`: Int (ordem no pipeline)
- `color`: String? (hex color para UI)
- `probability`: Int @default(0) (probabilidade de fechamento %)
- `isDefault`: Boolean @default(false)
- `isClosed`: Boolean @default(false) (etapa de fechamento ganho/perdido)
- `settings`: Json?
- Timestamps: `createdAt`, `updatedAt`

### Deal
Oportunidades/comercial no pipeline.

- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `contactId` → Contact.id
- `stageId` → PipelineStage.id
- `unitId`: String? → OrganizationUnit.id (filial responsável)
- `title`: String
- `description`: String?
- `amount`: Decimal? (valor da oportunidade)
- `currency`: String @default("BRL")
- `leadScore`: Int @default(0) (pontuação de qualificação)
- `probability`: Int? (sobrescreve a do stage se definido)
- `expectedCloseDate`: DateTime?
- `actualCloseDate`: DateTime?
- `source`: String? (origem: whatsapp, instagram, manual, etc)
- `sourceId`: String? (ID da origem, ex: conversation_id)
- `assignedTo`: String? → User.id (responsável)
- `status`: DealStatus @default(OPEN)
- `priority`: DealPriority @default(MEDIUM)
- `metadata`: Json? (campos customizados flexíveis)
- `tags`: String[]
- Timestamps: `createdAt`, `updatedAt`

### DealActivity
Atividades e histórico do deal (timeline).

- `id`: String @id @default(uuid())
- `dealId` → Deal.id
- `type`: ActivityType
- `title`: String
- `content`: String?
- `metadata`: Json? (dados específicos do tipo)
- `scoreImpact`: Int @default(0) (impacto no leadScore)
- `performedBy`: String? → User.id
- `automationId`: String? (se foi triggered por automação)
- Timestamps: `createdAt`

## Enums Adicionados

```prisma
enum InstagramInstanceStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
  ERROR
  SUSPENDED
}

enum DealStatus {
  OPEN
  WON
  LOST
  PAUSED
}

enum DealPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ActivityType {
  NOTE
  CALL
  EMAIL
  MEETING
  WHATSAPP
  INSTAGRAM
  STAGE_CHANGE
  TASK_CREATED
  TASK_COMPLETED
  DOCUMENT
  AUTOMATION
  SYSTEM
}
```

## Estrutura do Metadata (Deal)

Estrutura JSON sugerida para campos customizados:

```typescript
interface DealMetadata {
  // Informações do cliente
  companyName?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  industry?: string;
  
  // Dados do negócio
  competitors?: string[];
  decisionMaker?: boolean;
  budgetConfirmed?: boolean;
  timeline?: 'immediate' | '1-3months' | '3-6months' | '6months+';
  
  // Campos específicos por industry
  customFields?: Record<string, unknown>;
}
```

## Estrutura do Metadata (DealActivity)

```typescript
interface ActivityMetadata {
  // Para STAGE_CHANGE
  previousStageId?: string;
  newStageId?: string;
  
  // Para CALL
  callDuration?: number; // segundos
  callRecording?: string; // URL
  
  // Para EMAIL
  emailSubject?: string;
  emailTo?: string[];
  
  // Para WHATSAPP/INSTAGRAM
  messageId?: string;
  conversationId?: string;
  
  // Para TASK
  taskId?: string;
  taskDueDate?: string;
  
  // Genérico
  attachments?: string[];
  linkedRecords?: string[];
}
```

## Fórmula de Lead Score

Score base inicial: 0

### Incrementos positivos:
- Novo deal criado: +10
- Email aberto: +5
- Link clicado: +10
- Resposta em mensagem: +15
- Call realizada: +20
- Demo agendada: +30
- Orçamento solicitado: +40
- Visitou página de preços: +25

### Decrementos negativos:
- Sem atividade por 7 dias: -5
- Sem atividade por 14 dias: -10
- Email bounce: -10
- Unsubscribe: -50
- Deal perdido: -100

### Multiplicadores:
- Empresa target: ×1.5
- Decision maker identificado: ×1.3
- Budget confirmado: ×1.4

```typescript
function calculateLeadScore(activities: DealActivity[]): number {
  return activities.reduce((score, activity) => {
    return score + activity.scoreImpact;
  }, 0);
}
```

## Relacionamentos

```
Organization 1:N InstagramInstance
Organization 1:N PipelineStage
Organization 1:N Deal
Contact 1:N Deal
PipelineStage 1:N Deal
User (assignedTo) 1:N Deal
Deal 1:N DealActivity
OrganizationUnit 1:N Deal
```

## Critérios de Aceite

- [x] Migration sem erro
- [x] Build passa
- [x] Prisma Client gerado sem erros
- [x] Estrutura do `metadata` aprovada pelo Analyst
- [x] Fórmula de `leadScore` definida e documentada

## Validação Analyst

✅ **Metadata estrutura aprovada**: JSON flexível com campos sugeridos permite customização sem migrations.

✅ **Lead Score fórmula aprovada**: Sistema de pontuação baseado em atividades com pesos configuráveis via `scoreImpact`.

## Decisões Arquiteturais

1. **PipelineStage com probability**: Permite forecast de receita baseado em estágio
2. **Metadata como JSON**: Flexibilidade para diferentes tipos de negócio sem migrations
3. **ActivityType específico**: Diferencia origem da atividade (WhatsApp vs Instagram vs manual)
4. **Tags em arrays**: Permite múltiplas categorização sem tabela extra
5. **OrganizationUnit em Deal**: Permite filiais gerenciarem seus próprios deals

## Próximos Passos

- Implementar UI de pipeline (kanban)
- Criar automações baseadas em stage changes
- Integrar Instagram Webhooks para criar deals automaticamente
- Relatórios de forecast e conversão
