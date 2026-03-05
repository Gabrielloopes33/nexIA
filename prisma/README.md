# WhatsApp Business API - Database Schema

Este diretório contém o schema Prisma para integração com a WhatsApp Business API da Meta.

## 📁 Estrutura

```
prisma/
├── schema.prisma              # Schema principal com todos os modelos
├── migrations/
│   └── whatsapp_integration/
│       └── migration.sql      # SQL de migração para PostgreSQL
└── README.md                  # Este arquivo
```

## 🗄️ Modelos

### WhatsAppBusinessAccount
Representa uma conta de negócio do WhatsApp (WABA) na API da Meta.

| Campo | Descrição |
|-------|-----------|
| `wabaId` | ID da conta na Meta |
| `name` | Nome da conta |
| `status` | NOT_CONNECTED, CONNECTING, CONNECTED, ERROR, SUSPENDED |
| `qualityRating` | GREEN, YELLOW, RED, UNKNOWN |

### WhatsAppPhoneNumber
Números de telefone associados à WABA.

| Campo | Descrição |
|-------|-----------|
| `phoneNumberId` | ID do número na Meta |
| `displayPhoneNumber` | Número formatado |
| `status` | PENDING, VERIFIED, BLOCKED, DELETED |
| `messagingTier` | Tier de mensagens (1, 2, 3) |
| `messagingLimit` | Limite diário de mensagens |

### MessageTemplate
Templates de mensagem aprovados pela Meta.

| Campo | Descrição |
|-------|-----------|
| `templateId` | ID do template na Meta |
| `name` | Nome do template |
| `category` | AUTHENTICATION, MARKETING, UTILITY |
| `status` | DRAFT, PENDING, APPROVED, REJECTED, PAUSED, DISABLED |
| `components` | JSON com header, body, footer, buttons |

### WhatsAppConversation
Conversas dentro da janela de 24 horas.

| Campo | Descrição |
|-------|-----------|
| `conversationId` | ID da conversa na Meta |
| `contactPhone` | Telefone do contato |
| `type` | USER_INITIATED, BUSINESS_INITIATED, REFERRAL_INITIATED |
| `windowStart` | Início da janela de 24h |
| `windowEnd` | Fim da janela de 24h |

### WhatsAppMessage
Mensagens enviadas e recebidas.

| Campo | Descrição |
|-------|-----------|
| `messageId` | ID da mensagem na Meta |
| `direction` | INBOUND, OUTBOUND |
| `type` | TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, LOCATION, CONTACT, TEMPLATE, INTERACTIVE |
| `status` | SENT, DELIVERED, READ, FAILED |

### WebhookEvent
Eventos recebidos via webhook da Meta.

| Campo | Descrição |
|-------|-----------|
| `eventType` | Tipo do evento (messages, message_template_status_update, etc) |
| `payload` | JSON completo do evento |
| `processed` | Se o evento foi processado |

### WhatsAppAnalytics
Métricas diárias agregadas.

| Campo | Descrição |
|-------|-----------|
| `date` | Data das métricas |
| `conversationsTotal` | Total de conversas |
| `messagesSent` | Mensagens enviadas |
| `messagesDelivered` | Mensagens entregues |
| `messagesRead` | Mensagens lidas |

## 🚀 Configuração

### 1. Instalar dependências

```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Configurar variáveis de ambiente

```bash
# .env.local
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. Executar migrações

```bash
npx prisma migrate dev --name whatsapp_integration
```

### 4. Gerar cliente Prisma

```bash
npx prisma generate
```

### 5. (Opcional) Abrir Prisma Studio

```bash
npx prisma studio
```

## 📊 Índices

O schema inclui índices otimizados para as consultas mais comuns:

- `wabaId` - Busca por conta da Meta
- `userId` - Listar WABAs de um usuário
- `status` - Filtrar por status
- `contactPhone` - Buscar conversas por contato
- `windowEnd` - Encontrar conversas expiradas
- `createdAt` - Ordenação por data

## 🔗 Relacionamentos

```
User 1:N WhatsAppBusinessAccount
WhatsAppBusinessAccount 1:N WhatsAppPhoneNumber
WhatsAppBusinessAccount 1:N MessageTemplate
WhatsAppBusinessAccount 1:N WhatsAppConversation
WhatsAppBusinessAccount 1:N WebhookEvent
WhatsAppBusinessAccount 1:N WhatsAppAnalytics
WhatsAppPhoneNumber 1:N WhatsAppConversation
WhatsAppConversation 1:N WhatsAppMessage
MessageTemplate 1:N WhatsAppMessage
```

## 📝 Uso

```typescript
import { 
  createWABA, 
  getWABAById, 
  createConversation,
  createMessage 
} from '@/lib/db/whatsapp';

import { 
  getDashboardData,
  getMessageMetrics 
} from '@/lib/db/queries';

// Criar WABA
const waba = await createWABA({
  wabaId: '123456789',
  name: 'Minha Empresa',
  userId: 'user_id',
});

// Obter métricas
const metrics = await getMessageMetrics(waba.id);
```

## 🔒 Cascades

- Ao deletar uma WABA: deleta todos os números, templates, conversas, eventos e analytics
- Ao deletar uma conversa: deleta todas as mensagens
- Ao deletar um template: seta null nas mensagens relacionadas
