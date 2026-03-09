# CICLO 8 — Instagram Send + UI

## Branch
`feat/ciclo-08-instagram-send-ui`

## Entregável
Envio de DMs Instagram + páginas Instagram com dados reais

---

## Resumo
Implementar envio e recebimento de mensagens Instagram Direct, incluindo:
- API de envio de mensagens (texto, imagem, reações)
- Webhook de mensagens recebidas
- Páginas de UI para gerenciar Instagram
- Métricas e insights da conta

---

## Checklist Técnico

### Backend
- [ ] Criar `/api/instagram/messages/send` - Envia mensagem
- [ ] Criar `/api/instagram/webhooks` - Recebe webhooks
- [ ] Criar `/api/instagram/insights` - Métricas da conta
- [ ] Criar `/api/instagram/media` - Listar mídias
- [ ] Criar `/api/instagram/logs` - Logs de eventos
- [ ] Implementar handlers de mensagem recebida
- [ ] Salvar `Contact`, `Conversation`, `Message` no banco

### Frontend
- [ ] Componente `InstagramAccountSection` - Card da conta
- [ ] Componente `InstagramDirectSection` - Lista de conversas
- [ ] Componente `InstagramLogsSection` - Logs de eventos
- [ ] Componente `InstagramMetricsSection` - Métricas
- [ ] Componente `InstagramMediaSection` - Mídias recentes
- [ ] Página `/integracoes/instagram` - Dashboard
- [ ] Página `/integracoes/instagram/direct` - Mensagens
- [ ] Página `/integracoes/instagram/metrics` - Estatísticas

### DevOps
- [ ] Registrar URL webhook no Meta Developer Portal
- [ ] Configurar webhook fields: `messages`, `messaging_postbacks`

### QA
- [ ] Enviar DM com sucesso
- [ ] Receber DM via webhook
- [ ] Ver métricas da conta
- [ ] Visual consistente com WhatsApp

---

## API Endpoints

### POST /api/instagram/messages/send
Envia mensagem via Instagram Direct API.

**Request Body:**
```json
{
  "instanceId": "...",
  "recipientId": "...",
  "message": {
    "text": "Hello!"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "..."
  }
}
```

### GET /api/instagram/webhooks
Verificação do webhook (challenge).

### POST /api/instagram/webhooks
Processa eventos de mensagem.

### GET /api/instagram/insights
Métricas da conta Instagram.

**Response:**
```json
{
  "success": true,
  "data": {
    "followers": 1234,
    "mediaCount": 56,
    "insights": {
      "impressions": 50000,
      "reach": 12000,
      "profileViews": 800
    }
  }
}
```

### GET /api/instagram/media
Lista mídias recentes.

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "mediaType": "IMAGE",
    "mediaUrl": "...",
    "permalink": "...",
    "caption": "...",
    "likeCount": 100,
    "commentsCount": 20,
    "timestamp": "..."
  }]
}
```

---

## Componentes UI

### InstagramAccountSection
Card com informações da conta conectada.
```typescript
interface Props {
  instance: InstagramInstance;
  onDisconnect: () => void;
  onRefresh: () => void;
}
```

### InstagramDirectSection
Lista de conversas do Direct.
```typescript
interface Props {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
}
```

### InstagramLogsSection
Logs de eventos do webhook.
```typescript
interface Props {
  logs: InstagramLog[];
  onRefresh: () => void;
}
```

### InstagramMetricsSection
Métricas e insights.
```typescript
interface Props {
  insights: InstagramInsights;
  period: 'day' | 'week' | 'month';
}
```

### InstagramMediaSection
Grid de mídias recentes.
```typescript
interface Props {
  media: InstagramMedia[];
  onLoadMore: () => void;
}
```

---

## Páginas

### /integracoes/instagram
Dashboard principal com overview da conta.

```
┌─────────────────────────────────────────────────────┐
│ Instagram                  [Conectar Nova Conta]   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│ │ Seguidores  │  │  Mídias    │  │ Mensagens   │  │
│ │   1,234     │  │    56      │  │   89 hoje   │  │
│ └─────────────┘  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────┤
│ Contas Conectadas                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [@minhaconta]    Conectado ✓   [Gerenciar]    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### /integracoes/instagram/direct
Interface de mensagens Direct.

```
┌─────────────────────────────────────────────────────┐
│ Direct Messages                                     │
├────────────────────┬────────────────────────────────┤
│ [🔍 Buscar...]     │ @usuario                       │
│                    │                                │
│ ┌────────────────┐ │ ┌────────────────────────────┐ │
│ │ @usuario1      │ │ │                            │ │
│ │ Olá!           │ │ │  Olá, tudo bem?            │ │
│ │ 2m atrás       │ │ │                            │ │
│ └────────────────┘ │ ├────────────────────────────┤ │
│ ┌────────────────┐ │ │                            │ │
│ │ @usuario2      │ │ │  Tudo bem! E você?         │ │
│ │ Imagem 📷      │ │ │                            │ │
│ │ 5m atrás       │ │ │                            │ │
│ └────────────────┘ │ └────────────────────────────┘ │
│                    │ [Digite uma mensagem...] [📎]  │
└────────────────────┴────────────────────────────────┘
```

### /integracoes/instagram/metrics
Estatísticas detalhadas.

---

## Schema de Dados

### InstagramInstance (já existe do Ciclo 7)

### InstagramMedia
```prisma
model InstagramMedia {
  id              String   @id @default(uuid())
  instagramId     String   @map("instagram_id")
  mediaId         String   @unique @map("media_id")
  mediaType       String   @map("media_type") // IMAGE, VIDEO, CAROUSEL_ALBUM
  mediaUrl        String?  @map("media_url")
  permalink       String?
  caption         String?
  likeCount       Int      @default(0) @map("like_count")
  commentsCount   Int      @default(0) @map("comments_count")
  timestamp       DateTime
  syncedAt        DateTime @default(now()) @map("synced_at")
  
  instagramInstance InstagramInstance @relation(fields: [instagramId], references: [id])
}
```

### InstagramLog
```prisma
model InstagramLog {
  id              String   @id @default(uuid())
  instagramId     String   @map("instagram_id")
  eventType       String   @map("event_type")
  payload         Json
  status          String   @default("PENDING")
  processedAt     DateTime? @map("processed_at")
  createdAt       DateTime @default(now()) @map("created_at")
  
  instagramInstance InstagramInstance @relation(fields: [instagramId], references: [id])
}
```

---

## Webhook Events

### Mensagem Recebida
```json
{
  "object": "instagram",
  "entry": [{
    "id": "<instagram-business-account-id>",
    "messaging": [{
      "sender": { "id": "<sender-id>" },
      "recipient": { "id": "<instagram-business-account-id>" },
      "timestamp": 1234567890,
      "message": {
        "mid": "<message-id>",
        "text": "Hello!"
      }
    }]
  }]
}
```

### Processamento:
1. Validar assinatura
2. Extrair sender/recipient
3. Buscar/criar Contact
4. Buscar/criar Conversation
5. Salvar Message
6. Notificar UI (WebSocket/SSE)

---

## Referências

- Arquivos Aurea:
  - `apps/aurea/supabase/functions/meta-instagram-send/index.ts`
  - `apps/aurea/supabase/functions/meta-instagram-insights/index.ts`
- Meta Instagram Messaging API: https://developers.facebook.com/docs/messenger-platform/instagram
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api

---

## Notas

- Instagram Direct API requer `instagram_manage_messages` permission
- Rate limit: 200 calls/hour para mensagens
- Mensagens devem ser respondidas dentro de 24h (igual WhatsApp)
- Webhook deve responder em < 20s
