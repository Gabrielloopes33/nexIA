# CICLO 5 — WhatsApp Send + Webhook

**Branch:** `feat/ciclo-05-whatsapp-send-webhook`
**Entregável:** Envio real de mensagens WhatsApp e recebimento via webhook funcional

---

## Resumo

Este ciclo implementa o envio real de mensagens via API da Meta e o recebimento de webhooks para mensagens recebidas e atualizações de status.

## API Routes Implementadas

### POST /api/whatsapp/messages/send
Envia mensagem via WhatsApp Business API.

**Request Body:**
```typescript
interface SendMessageRequest {
  instanceId: string;           // ID da WhatsAppInstance
  to: string;                   // Número do destinatário (com country code)
  type: 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive';
  content: {
    // Para type: 'text'
    body?: string;
    
    // Para type: 'template'
    templateName?: string;
    language?: string;
    components?: TemplateComponent[];
    
    // Para type: 'image' | 'video' | 'audio' | 'document'
    mediaUrl?: string;
    caption?: string;
    
    // Para type: 'location'
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
  };
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.xxx",
  "message": { /* Message object from DB */ }
}
```

**Fluxo:**
1. Busca WhatsAppInstance e verifica tokens válidos
2. Verifica/cria Conversation ativa
3. Chama Meta API POST /messages
4. Salva Message no banco (status: SENT)
5. Retorna dados

### GET /api/whatsapp/webhooks
Verificação do webhook pela Meta.

**Query Params:**
- `hub.mode` = "subscribe"
- `hub.verify_token` = WEBHOOK_VERIFY_TOKEN
- `hub.challenge` = random string

**Response:** Retorna `hub.challenge` como texto puro (200)

### POST /api/whatsapp/webhooks
Recebe eventos do webhook Meta.

**Event Types:**
- `messages` - Mensagem recebida
- `message_status_updates` - Atualização de status (sent, delivered, read, failed)
- `message_template_status_update` - Atualização de template

**Processamento:**
```typescript
// 1. Salva log em WhatsAppLog
// 2. Processa evento específico
// 3. Atualiza banco conforme tipo
```

## Estrutura de Eventos

### Mensagem Recebida (messages)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "id": "wamid.xxx",
          "from": "5511999999999",
          "type": "text",
          "text": { "body": "Olá!" },
          "timestamp": "1234567890"
        }]
      }
    }]
  }]
}
```

**Ações:**
1. Identifica WhatsAppInstance por wabaId
2. Busca/cria Contact pelo número
3. Busca/cria Conversation ativa
4. Cria Message (direction: INBOUND)
5. Atualiza lastInteractionAt do Contact

### Status Update (message_status_updates)
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890"
        }]
      }
    }]
  }]
}
```

**Ações:**
1. Busca Message pelo messageId (wamid)
2. Atualiza status e timestamps
3. Se delivered/read, atualiza conversation

## Tipos de Mensagem Suportados

| Tipo | Envio | Recebimento |
|------|-------|-------------|
| text | ✅ | ✅ |
| template | ✅ | ❌ |
| image | ✅ | ✅ |
| video | ✅ | ✅ |
| audio | ✅ | ✅ |
| document | ✅ | ✅ |
| location | ✅ | ✅ |
| interactive | ✅ | ❌ |
| contact | ❌ | ✅ |
| sticker | ❌ | ✅ |

## Configuração no Meta Developer Portal

1. Acesse: App → WhatsApp → Configuration
2. Configure Webhook URL: `https://seu-dominio.com/api/whatsapp/webhooks`
3. Verify Token: igual ao WEBHOOK_VERIFY_TOKEN
4. Subscriptions: messages, message_template_status_update

## Critérios de Aceite

- [x] Mensagem de texto enviada com sucesso via API
- [x] Mensagem salva em `Conversation` + `Message` no banco
- [x] Webhook de verificação Meta retorna `hub.challenge`
- [x] Webhook de mensagem recebida cria `Message` no banco
- [x] Webhook de status update atualiza `Message.status`
- [x] Logs salvos em `WhatsAppLog`

## Testes QA

1. **Envio de mensagem:**
   - Texto simples
   - Com template aprovado
   - Com imagem (URL pública)
   - Erro: número inválido

2. **Recebimento de webhook:**
   - Verificação (GET)
   - Mensagem de texto recebida
   - Mensagem com mídia
   - Status updates (sent → delivered → read)

3. **Logs:**
   - Todo webhook salvo em WhatsAppLog
   - Processed = true após sucesso
   - Error preenchido em caso de falha

## Decisões Arquiteturais

1. **Async Processing**: Webhook responde 200 imediatamente, processa em background
2. **Idempotency**: messageId (wamid) garante mensagens não duplicadas
3. **Contact Unification**: Mesmo número = mesmo contact em toda a org
4. **Conversation Window**: Só aceita mensagens inbound se janela ativa (24h)
