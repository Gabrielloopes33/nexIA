# CICLO 2 — WhatsApp Instance Schema

**Branch:** `feat/ciclo-02-whatsapp-schema`
**Entregável:** Modelos WhatsApp no banco, antigos removidos, `lib/db/whatsapp.ts` atualizado

---

## Resumo

Este ciclo simplifica o schema WhatsApp de uma estrutura complexa (WABA + PhoneNumber + MessageTemplate + Conversation + Message + WebhookEvent + Analytics) para um modelo flat e direto, com organization_id como tenant.

## Schema Removido

```prisma
REMOVER:
- WhatsAppBusinessAccount (modelo complexo de conta WABA)
- WhatsAppPhoneNumber (números associados à WABA)
- MessageTemplate (templates de mensagem)
- WhatsAppConversation (janelas de 24h)
- WhatsAppMessage (mensagens individuais)
- WebhookEvent (logs de webhook)
- WhatsAppAnalytics (métricas diárias)
```

## Schema Adicionado

### WhatsAppInstance
Modelo flat que representa uma instância WhatsApp vinculada a uma organização.

- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `name`: String (nome amigável)
- `phoneNumber`: String (número do WhatsApp)
- `phoneNumberId`: String? (ID da Meta)
- `wabaId`: String? (ID da conta WABA na Meta)
- `accessToken`: String? (token criptografado ou ref)
- `refreshToken`: String?
- `tokenExpiresAt`: DateTime?
- `status`: WhatsAppInstanceStatus @default(DISCONNECTED)
- `qualityRating`: QualityRating @default(UNKNOWN)
- `messagingTier`: Int @default(1)
- `messagingLimit`: Int @default(250)
- `webhookVerifyToken`: String?
- `settings`: Json? (configurações específicas)
- Timestamps: `createdAt`, `updatedAt`, `connectedAt`

### WhatsAppTemplate
Templates de mensagem simplificados.

- `id`: String @id @default(uuid())
- `instanceId` → WhatsAppInstance.id
- `templateId`: String? (ID na Meta)
- `name`: String
- `category`: TemplateCategory
- `language`: String
- `components`: Json (estrutura do template)
- `body`: String
- `header`: String?
- `footer`: String?
- `status`: TemplateStatus @default(DRAFT)
- `reason`: String? (motivo rejeição)
- Timestamps: `createdAt`, `updatedAt`, `submittedAt`, `approvedAt`

### WhatsAppLog
Log unificado para webhook events e operações.

- `id`: String @id @default(uuid())
- `instanceId` → WhatsAppInstance.id
- `type`: String (message_received, message_sent, template_update, etc)
- `eventType`: String? (evento específico da Meta)
- `payload`: Json (dados completos)
- `processed`: Boolean @default(false)
- `processedAt`: DateTime?
- `error`: String?
- Timestamps: `createdAt`

### Contact
Contatos unificados (podem ser usados por WhatsApp e futuramente Instagram).

- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `phone`: String
- `name`: String?
- `avatarUrl`: String?
- `metadata`: Json? (campos customizados)
- `tags`: String[]
- `leadScore`: Int @default(0)
- `status`: ContactStatus @default(ACTIVE)
- `lastInteractionAt`: DateTime?
- Timestamps: `createdAt`, `updatedAt`
- @@unique([organizationId, phone])

### Conversation
Conversas simplificadas (24h window).

- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `instanceId` → WhatsAppInstance.id
- `contactId` → Contact.id
- `conversationId`: String? (ID da Meta)
- `type`: ConversationType
- `status`: ConversationStatus @default(ACTIVE)
- `windowStart`: DateTime
- `windowEnd`: DateTime
- `lastMessageAt`: DateTime?
- `messageCount`: Int @default(0)
- Timestamps: `createdAt`, `updatedAt`

### Message
Mensagens simplificadas.

- `id`: String @id @default(uuid())
- `conversationId` → Conversation.id
- `contactId` → Contact.id
- `messageId`: String? (ID da Meta)
- `direction`: MessageDirection
- `type`: MessageType
- `content`: String
- `mediaUrl`: String?
- `caption`: String?
- `templateId`: String? → WhatsAppTemplate.id
- `status`: MessageStatus @default(SENT)
- `sentAt`: DateTime?
- `deliveredAt`: DateTime?
- `readAt`: DateTime?
- `failedAt`: DateTime?
- `failedReason`: String?
- `metadata`: Json?
- Timestamps: `createdAt`

## Enums Mantidos/Adaptados

```prisma
enum WhatsAppInstanceStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
  ERROR
  SUSPENDED
}

enum QualityRating {
  GREEN
  YELLOW
  RED
  UNKNOWN
}

enum TemplateCategory {
  AUTHENTICATION
  MARKETING
  UTILITY
}

enum TemplateStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  PAUSED
  DISABLED
}

enum ConversationType {
  USER_INITIATED
  BUSINESS_INITIATED
  REFERRAL_INITIATED
}

enum ConversationStatus {
  ACTIVE
  EXPIRED
  CLOSED
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  LOCATION
  CONTACT
  TEMPLATE
  INTERACTIVE
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
  FAILED
}

enum ContactStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}
```

## Relacionamentos

```
Organization 1:N WhatsAppInstance
Organization 1:N Contact
Organization 1:N Conversation
WhatsAppInstance 1:N WhatsAppTemplate
WhatsAppInstance 1:N WhatsAppLog
WhatsAppInstance 1:N Conversation
Contact 1:N Conversation
Contact 1:N Message
Conversation 1:N Message
WhatsAppInstance 1:N WhatsAppTemplate
```

## Critérios de Aceite

- [x] Migration sem erro
- [x] Build passa
- [x] `lib/db/whatsapp.ts` atualizado para os novos modelos
- [x] Nenhuma rota existente quebra (podem retornar dados vazios, mas não 500)

## Notas de Migração

⚠️ **ATENÇÃO**: Se houver dados em produção, será necessário:
1. Fazer backup completo
2. Criar script de migração de dados dos models antigos para os novos
3. Validar integridade após migração

Para este ciclo, assumimos ambiente de desenvolvimento sem dados críticos.

## Decisões Arquiteturais

1. **Modelo flat**: WhatsAppInstance concentra configuração que antes estava em 2+ models
2. **Contact unificado**: Um contato pode ser usado por múltiplos canais (WhatsApp, Instagram, etc)
3. **WhatsAppLog unificado**: Substitui WebhookEvent + Analytics com estrutura flexível
4. **organization_id em todos**: Permite queries simples por tenant
