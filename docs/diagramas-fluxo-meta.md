# Diagramas de Fluxo - Integrações META

## 🔄 Fluxo 1: Conexão WhatsApp (Embedded Signup)

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  Usuário │────▶│   Frontend  │────▶│  API Next.js │────▶│    Meta     │────▶│   Banco     │
│          │     │  (Next.js)  │     │  (/api/meta) │     │  (Facebook) │     │ (Postgres)  │
└──────────┘     └─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
     │                  │                   │                   │                   │
     │  1. Clica        │                   │                   │                   │
     │  "Conectar      │                   │                   │                   │
     │   WhatsApp"     │                   │                   │                   │
     │────────────────▶│                   │                   │                   │
     │                  │                   │                   │                   │
     │           2. Abre popup             │                   │                   │
     │              Facebook               │                   │                   │
     │◀────────────────│                   │                   │                   │
     │                  │                   │                   │                   │
     │  3. Login FB     │                   │                   │                   │
     │  + Permissões    │                   │                   │                   │
     │────────────────▶│                   │                   │                   │
     │                  │                   │                   │                   │
     │           4. Retorna code           │                   │                   │
     │              OAuth                  │                   │                   │
     │◀────────────────│                   │                   │                   │
     │                  │                   │                   │                   │
     │                  │  5. POST /auth    │                   │                   │
     │                  │  {code, org_id}   │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 6. Exchange code  │                   │
     │                  │                   │    for token      │                   │
     │                  │                   │──────────────────▶│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 7. Access Token   │                   │
     │                  │                   │◀──────────────────│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 8. Fetch WABA     │                   │
     │                  │                   │    details        │                   │
     │                  │                   │──────────────────▶│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 9. WABA Info      │                   │
     │                  │                   │◀──────────────────│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 10. Fetch phone   │                   │
     │                  │                   │     numbers       │                   │
     │                  │                   │──────────────────▶│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 11. Phone numbers │                   │
     │                  │                   │◀──────────────────│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 12. INSERT        │                   │
     │                  │                   │     whatsapp_     │                   │
     │                  │                   │     cloud_        │                   │
     │                  │                   │     instances     │                   │
     │                  │                   │──────────────────────────────────────▶│
     │                  │                   │                   │                   │
     │                  │ 13. Response      │                   │                   │
     │                  │     {success,     │                   │                   │
     │                  │      instance}    │                   │                   │
     │                  │◀──────────────────│                   │                   │
     │                  │                   │                   │                   │
     │           14. Mostra número         │                   │                   │
     │              conectado              │                   │                   │
     │◀────────────────│                   │                   │                   │
```

---

## 🔄 Fluxo 2: Envio de Mensagem (WhatsApp)

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│ Atendente│────▶│   Frontend  │────▶│  API Next.js │────▶│    Meta     │────▶│   Banco     │
│          │     │  (Chat UI)  │     │  (/api/meta) │     │  (WhatsApp) │     │ (Postgres)  │
└──────────┘     └─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
     │                  │                   │                   │                   │
     │  1. Digita       │                   │                   │                   │
     │  mensagem        │                   │                   │                   │
     │  e envia         │                   │                   │                   │
     │────────────────▶│                   │                   │                   │
     │                  │                   │                   │                   │
     │                  │  2. POST /send    │                   │                   │
     │                  │  {instance_id,    │                   │                   │
     │                  │   to, message,    │                   │                   │
     │                  │   type}           │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 3. Busca instance │                   │
     │                  │                   │    no banco       │                   │
     │                  │                   │──────────────────────────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │ 4. Retorna        │                   │
     │                  │                   │    access_token   │                   │
     │                  │                   │    phone_id       │                   │
     │                  │                   │◀──────────────────────────────────────│
     │                  │                   │                   │                   │
     │                  │                   │ 5. Monta payload  │                   │
     │                  │                   │    da mensagem    │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 6. POST Graph API │                   │
     │                  │                   │    /messages      │                   │
     │                  │                   │──────────────────▶│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 7. Processa      │                   │
     │                  │                   │    na fila        │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 8. wamid (ID)     │                   │
     │                  │                   │◀──────────────────│                   │
     │                  │                   │                   │                   │
     │                  │                   │ 9. INSERT message │                   │
     │                  │                   │    na conversa    │                   │
     │                  │                   │──────────────────────────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │ 10. INSERT log   │                   │
     │                  │                   │     (sucesso)    │                   │
     │                  │                   │──────────────────────────────────────▶│
     │                  │                   │                   │                   │
     │                  │ 11. Response      │                   │                   │
     │                  │     {success,     │                   │                   │
     │                  │      message_id}  │                   │                   │
     │                  │◀──────────────────│                   │                   │
     │                  │                   │                   │                   │
     │           12. Atualiza UI            │                   │                   │
     │              (check enviado)         │                   │                   │
     │◀────────────────│                   │                   │                   │
```

---

## 🔄 Fluxo 3: Recebimento de Mensagem (Webhook)

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Cliente │────▶│   Meta      │────▶│  API Next.js │────▶│   Fila/      │────▶│   Banco     │
│ WhatsApp │     │  (Webhook)  │     │  (/webhooks) │     │  Processador │     │ (Postgres)  │
└──────────┘     └─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
     │                  │                   │                   │                   │
     │  1. Envia        │                   │                   │                   │
     │  mensagem        │                   │                   │                   │
     │  para empresa    │                   │                   │                   │
     │────────────────▶│                   │                   │                   │
     │                  │                   │                   │                   │
     │           2. POST webhook           │                   │                   │
     │              (JSON payload)         │                   │                   │
     │              + Assinatura HMAC      │                   │                   │
     │────────────────────────────────────▶│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 3. Valida         │                   │
     │                  │                   │    assinatura     │                   │
     │                  │                   │    (segurança)    │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 4. Parse payload  │                   │
     │                  │                   │    Extrai:        │                   │
     │                  │                   │    - phone_id     │                   │
     │                  │                   │    - from (tel)   │                   │
     │                  │                   │    - message      │                   │
     │                  │                   │    - timestamp    │                   │
     │                  │                   │                   │                   │
     │                  │ 5. HTTP 200 OK    │                   │                   │
     │                  │    (resposta      │                   │                   │
     │                  │     rápida!)      │                   │                   │
     │◀─────────────────────────────────────│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 6. Envia para     │                   │
     │                  │                   │    processamento  │                   │
     │                  │                   │    assíncrono     │                   │
     │                  │                   │──────────────────▶│                   │
     │                  │                   │                   │                   │
     │                  │                   │                   │ 7. Busca/cria    │
     │                  │                   │                   │    contato       │
     │                  │                   │                   │──────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │                   │ 8. Busca/cria    │
     │                  │                   │                   │    conversa      │
     │                  │                   │                   │──────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │                   │ 9. INSERT        │
     │                  │                   │                   │    mensagem      │
     │                  │                   │                   │    (inbound)     │
     │                  │                   │                   │──────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │                   │ 10. Notifica     │
     │                  │                   │                   │     frontend     │
     │                  │                   │                   │     (WebSocket)  │
     │                  │                   │                   │                   │
     │                  │                   │                   │ 11. Processa     │
     │                  │                   │                   │     com IA       │
     │                  │                   │                   │     (se agente)  │
```

---

## 🔄 Fluxo 4: Sincronização de Templates

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  Admin   │────▶│  API Next.js │────▶│    Meta     │────▶│   Banco     │
│          │     │  (/templates)│     │  (Graph API)│     │ (Postgres)  │
└──────────┘     └──────────────┘     └─────────────┘     └─────────────┘
      │                 │                   │                   │
      │  1. Clica       │                   │                   │
      │  "Sincronizar   │                   │                   │
      │   Templates"    │                   │                   │
      │────────────────▶│                   │                   │
      │                 │                   │                   │
      │                 │  2. GET /templates│                   │
      │                 │     {instance_id} │                   │
      │                 │                   │                   │
      │                 │  3. Busca token   │                   │
      │                 │     da instance   │                   │
      │                 │──────────────────────────────────────▶│
      │                 │                   │                   │
      │                 │  4. Retorna token │                   │
      │                 │◀──────────────────────────────────────│
      │                 │                   │                   │
      │                 │  5. GET /message_templates            │
      │                 │     Graph API v24.0                   │
      │                 │──────────────────▶│                   │
      │                 │                   │                   │
      │                 │  6. Lista de      │                   │
      │                 │     templates     │                   │
      │                 │     aprovados     │                   │
      │                 │◀──────────────────│                   │
      │                 │                   │                   │
      │                 │  7. Para cada     │                   │
      │                 │     template:     │                   │
      │                 │                   │                   │
      │                 │     7a. UPSERT    │                   │
      │                 │         whatsapp_ │                   │
      │                 │         cloud_    │                   │
      │                 │         templates │                   │
      │                 │──────────────────────────────────────▶│
      │                 │                   │                   │
      │                 │  8. Retorna       │                   │
      │                 │     {synced: N}   │                   │
      │◀────────────────│                   │                   │
      │                 │                   │                   │
      │  9. Atualiza    │                   │                   │
      │     lista na UI │                   │                   │
      │◀────────────────│                   │                   │
```

---

## 🔄 Fluxo 5: Atualização de Status (Entregue/Lida)

```
Meta ──► Webhook ──► API ──► Fila ──► UPDATE messages SET status = 'delivered'/'read'
                                      UPDATE conversations SET last_message_at = NOW()
                                      Notifica frontend (real-time)
```

**Detalhes:**
1. Meta envia webhook quando mensagem é entregue no celular
2. Meta envia webhook novamente quando é lida
3. Sistema atualiza status no banco
4. UI atualiza em tempo real (✓✓ para delivered, azul para read)

---

## 🔄 Fluxo 6: Instagram Direct (Mensagem)

```
Usuário Instagram ──► Meta ──► Webhook ──► API ──► Processa igual WhatsApp
                                              (mas salva channel = 'instagram')
```

**Diferenças do WhatsApp:**
- Usa `instagram_business_account_id` ao invés de `phone_number_id`
- Limitação: só pode responder (não iniciar conversa)
- Usa `recipient.id` ao invés de número de telefone

---

## 📊 Resumo de Endpoints Necessários

### Autenticação
```
POST   /api/meta/auth
       - action: embedded_signup_complete
       - action: oauth_callback
       - action: refresh_token
       - action: validate
       
POST   /api/meta/instagram/auth
       - action: oauth_callback
       - action: refresh_token
```

### Mensagens
```
POST   /api/meta/send
       - Envia mensagem WhatsApp
       
POST   /api/meta/instagram/send
       - Envia mensagem Instagram Direct
```

### Templates
```
POST   /api/meta/templates/sync
GET    /api/meta/templates
```

### Webhooks
```
GET    /api/meta/webhooks          # Verificação
POST   /api/meta/webhooks          # Recebimento de eventos
```

### Configuração
```
GET    /api/meta/instances         # Listar instâncias
DELETE /api/meta/instances/:id     # Desconectar
GET    /api/meta/status            # Status das conexões
```

---

## ⏱️ Timings Importantes

| Operação | Tempo Máximo | Observação |
|----------|-------------|------------|
| Webhook response | 20 segundos | Meta reenvia se demorar |
| OAuth token exchange | 10 segundos | Operação síncrona |
| Envio de mensagem | 5 segundos | Timeout da API |
| Sincronização templates | 30 segundos | Dependendo da quantidade |
| Conexão Embedded Signup | 2-5 minutos | Fluxo completo do usuário |

---

## 🔔 Eventos Webhook Principais

### WhatsApp
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{"from": "551199999999", "type": "text", ...}],
        "contacts": [{"profile": {"name": "João"}}]
      }
    }]
  }]
}
```

### Instagram
```json
{
  "object": "instagram",
  "entry": [{
    "messaging": [{
      "sender": {"id": "12345"},
      "recipient": {"id": "67890"},
      "message": {"text": "Olá!"}
    }]
  }]
}
```

---

**Diagramas de fluxo - Versão 1.0**
