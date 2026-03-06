# Anexo Técnico: Schemas META para PostgreSQL/Prisma

## 📦 Tabelas WhatsApp Business API

### 1. whatsapp_cloud_instances
**Propósito:** Armazenar as contas WhatsApp Business conectadas

```sql
CREATE TABLE "whatsapp_cloud_instances" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,           -- Multi-tenant
  "agent_id" UUID,                           -- Agente vinculado
  "unit_id" UUID,                            -- Unidade/loja
  
  -- IDs da Meta
  "waba_id" VARCHAR(255) NOT NULL,           -- WhatsApp Business Account ID
  "phone_number_id" VARCHAR(255) NOT NULL,   -- ID do número na Meta
  "business_id" VARCHAR(255),                -- Facebook Business ID
  
  -- Dados do número
  "display_phone_number" VARCHAR(50),        -- Formato: +55 11 99999-9999
  "verified_name" VARCHAR(255),              -- Nome verificado
  
  -- Autenticação
  "access_token" TEXT NOT NULL,              -- Token de acesso (criptografar!)
  "token_expires_at" TIMESTAMP,              -- Data de expiração
  
  -- Status
  "status" VARCHAR(50) DEFAULT 'active',     -- active, pending_setup, error, disconnected
  "channel_type" VARCHAR(50) DEFAULT 'whatsapp',
  "error_message" TEXT,
  
  -- Webhook
  "webhook_url" TEXT,
  "webhook_subscribed" BOOLEAN DEFAULT false,
  "last_status_check" TIMESTAMP,
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "whatsapp_cloud_instances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "whatsapp_cloud_instances_waba_key" UNIQUE ("organization_id", "waba_id"),
  CONSTRAINT "whatsapp_cloud_instances_phone_key" UNIQUE ("organization_id", "phone_number_id")
);
```

**Índices importantes:**
```sql
CREATE INDEX idx_whatsapp_instances_org ON "whatsapp_cloud_instances"("organization_id");
CREATE INDEX idx_whatsapp_instances_status ON "whatsapp_cloud_instances"("status");
CREATE INDEX idx_whatsapp_instances_agent ON "whatsapp_cloud_instances"("agent_id");
```

---

### 2. whatsapp_cloud_templates
**Propósito:** Cache local dos templates aprovados pela Meta

```sql
CREATE TABLE "whatsapp_cloud_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "whatsapp_cloud_instance_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  
  -- Dados do template
  "template_id" VARCHAR(255),                -- ID na Meta (após aprovação)
  "name" VARCHAR(255) NOT NULL,              -- Nome do template
  "category" VARCHAR(50) NOT NULL,           -- AUTHENTICATION, MARKETING, UTILITY
  "language" VARCHAR(10) NOT NULL,           -- pt_BR, en_US, etc
  
  -- Componentes (JSON)
  "components" JSONB NOT NULL,               -- Header, Body, Footer, Buttons
  
  -- Conteúdo
  "body" TEXT NOT NULL,
  "header" TEXT,
  "footer" TEXT,
  
  -- Status
  "status" VARCHAR(50) DEFAULT 'PENDING',    -- DRAFT, PENDING, APPROVED, REJECTED
  "reason" TEXT,                             -- Motivo da rejeição
  
  -- Timestamps
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "submitted_at" TIMESTAMP,
  "approved_at" TIMESTAMP,
  "last_sync_at" TIMESTAMP,
  
  CONSTRAINT "whatsapp_cloud_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "whatsapp_cloud_templates_instance_fkey" 
    FOREIGN KEY ("whatsapp_cloud_instance_id") REFERENCES "whatsapp_cloud_instances"("id") ON DELETE CASCADE
);
```

---

### 3. whatsapp_cloud_logs
**Propósito:** Auditoria de todas as operações

```sql
CREATE TABLE "whatsapp_cloud_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "whatsapp_cloud_instance_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  
  "operation" VARCHAR(100) NOT NULL,         -- send_message, receive_message, sync_templates, etc
  "status" VARCHAR(50),                      -- success, error
  
  -- Payloads
  "payload" JSONB,                           -- Dados enviados
  "response" JSONB,                          -- Resposta da API
  "error_message" TEXT,
  "error_code" VARCHAR(100),
  
  -- Metadados
  "recipient_phone" VARCHAR(50),
  "message_type" VARCHAR(50),
  "external_message_id" VARCHAR(255),        -- wamid da Meta
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "whatsapp_cloud_logs_pkey" PRIMARY KEY ("id")
);
```

---

### 4. conversations (Chat Unificado)
**Propósito:** Unificar conversas de todos os canais

```sql
CREATE TABLE "conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "unit_id" UUID,
  
  -- Canal
  "channel" VARCHAR(50) NOT NULL,            -- whatsapp, instagram, widget, email
  "channel_instance_id" UUID,                -- FK para whatsapp_cloud_instances ou instagram_instances
  
  -- Contato
  "contact_id" UUID,
  "contact_phone" VARCHAR(50),
  "contact_email" VARCHAR(255),
  "name" VARCHAR(255),
  
  -- Identificadores externos
  "external_session_id" VARCHAR(255),        -- ID da sessão na Meta
  "phone" VARCHAR(50),                       -- Número formatado
  
  -- Status
  "status" VARCHAR(50) DEFAULT 'active',     -- active, closed, archived
  
  -- Última mensagem
  "last_message_at" TIMESTAMP,
  "last_message_text" VARCHAR(500),
  "last_message_type" VARCHAR(50),
  "from_me" BOOLEAN DEFAULT false,
  
  -- Agente/Atendente
  "assigned_to" UUID,                        -- Usuário responsável
  "agent_id" UUID,                           -- Agente de IA
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conversations_contact_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
);
```

---

### 5. messages (Mensagens Unificadas)
**Propósito:** Todas as mensagens de todos os canais

```sql
CREATE TABLE "messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  
  -- Origem
  "direction" VARCHAR(20) NOT NULL,          -- inbound, outbound
  "from_me" BOOLEAN NOT NULL,
  
  -- Conteúdo
  "content" TEXT NOT NULL,                   -- Texto ou JSON
  "text_content" TEXT,                       -- Somente texto para busca
  "message_type" VARCHAR(50) NOT NULL,       -- text, image, video, template, etc
  
  -- Mídia
  "media_url" TEXT,
  "caption" TEXT,
  
  -- Template
  "template_id" UUID,
  "template_name" VARCHAR(255),
  
  -- Status de entrega
  "status" VARCHAR(50) DEFAULT 'sent',       -- sent, delivered, read, failed
  "sent_at" TIMESTAMP,
  "delivered_at" TIMESTAMP,
  "read_at" TIMESTAMP,
  "failed_at" TIMESTAMP,
  "failed_reason" TEXT,
  
  -- IDs externos
  "external_message_id" VARCHAR(255),        -- wamid (WhatsApp) ou message_id (Instagram)
  "reply_to_message_id" UUID,                -- Resposta a qual mensagem
  
  -- Metadados
  "sender_type" VARCHAR(50),                 -- user, assistant, human
  "author_user_id" UUID,                     -- Se enviado por atendente
  "author_name" VARCHAR(255),
  "message_timestamp" TIMESTAMP,
  
  "source" VARCHAR(50),                      -- meta_send, webhook, dashboard
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messages_conversation_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE
);
```

---

## 📦 Tabelas Instagram Business API

### 6. instagram_instances
**Propósito:** Contas Instagram Business conectadas

```sql
CREATE TABLE "instagram_instances" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "agent_id" UUID,
  "unit_id" UUID,
  
  -- IDs da Meta
  "page_id" VARCHAR(255) NOT NULL,           -- Facebook Page ID
  "page_name" VARCHAR(255),
  "instagram_business_account_id" VARCHAR(255) NOT NULL, -- IG ID
  "instagram_username" VARCHAR(255),
  
  -- Perfil do Instagram
  "followers_count" INTEGER DEFAULT 0,
  "media_count" INTEGER DEFAULT 0,
  "profile_picture_url" TEXT,
  "biography" TEXT,
  "website" TEXT,
  
  -- Autenticação
  "access_token" TEXT NOT NULL,
  "token_expires_at" TIMESTAMP,
  
  -- Status
  "status" VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, error
  "error_message" TEXT,
  
  -- Webhook
  "webhook_url" TEXT,
  "webhook_subscribed" BOOLEAN DEFAULT false,
  "last_status_check" TIMESTAMP,
  "last_sync_at" TIMESTAMP,
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "instagram_instances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instagram_instances_ig_key" UNIQUE ("organization_id", "instagram_business_account_id")
);
```

---

### 7. instagram_messages_log
**Propósito:** Auditoria de mensagens Instagram

```sql
CREATE TABLE "instagram_messages_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "instagram_instance_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  
  "operation" VARCHAR(100) NOT NULL,         -- send_message, get_conversations, etc
  "payload" JSONB,
  "response" JSONB,
  "error_message" TEXT,
  
  "recipient_id" VARCHAR(255),               -- ID do destinatário
  "message_text" TEXT,
  "external_message_id" VARCHAR(255),
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "instagram_messages_log_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instagram_log_instance_fkey" 
    FOREIGN KEY ("instagram_instance_id") REFERENCES "instagram_instances"("id") ON DELETE CASCADE
);
```

---

## 📦 Tabelas de Suporte (Estruturais)

### 8. organizations (Multi-tenancy)
```sql
CREATE TABLE "organizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "owner_id" UUID NOT NULL,
  
  -- Configurações de canais
  "whatsapp_enabled" BOOLEAN DEFAULT false,
  "whatsapp_max_instances" INTEGER DEFAULT 0,
  "instagram_enabled" BOOLEAN DEFAULT false,
  "instagram_max_instances" INTEGER DEFAULT 0,
  "webchat_enabled" BOOLEAN DEFAULT true,
  "webchat_max_instances" INTEGER DEFAULT 1,
  
  -- Limites do plano
  "plan_type" VARCHAR(50) DEFAULT 'free',    -- lite, plus, premium
  "max_agents" INTEGER DEFAULT 3,
  "max_members" INTEGER DEFAULT 1,
  "max_units" INTEGER DEFAULT 1,
  
  -- Credenciais Meta (App-level)
  "facebook_app_id" VARCHAR(255),
  "facebook_app_secret" VARCHAR(255),
  "openai_api_key" TEXT,
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
```

---

### 9. organization_units (Filiais/Unidades)
```sql
CREATE TABLE "organization_units" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "is_default" BOOLEAN DEFAULT false,
  
  -- Endereço
  "address" TEXT,
  "google_maps_link" TEXT,
  "capacity" INTEGER,
  
  -- Horários específicos
  "specific_hours" JSONB,
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_units_org_slug_key" UNIQUE ("organization_id", "slug"),
  CONSTRAINT "organization_units_org_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);
```

---

### 10. agents (Agentes de IA)
```sql
CREATE TABLE "agents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "unit_id" UUID,
  "user_id" UUID NOT NULL,                   -- Criador
  
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "system_prompt" TEXT,
  
  -- Configurações
  "is_central" BOOLEAN DEFAULT false,        -- Agente central da unidade
  "template_type" VARCHAR(100),              -- Tipo de template/base
  
  -- Webhook para processamento (n8n/Dify)
  "webhook_url" TEXT,
  "webhook_method" VARCHAR(10) DEFAULT 'POST',
  "webhook_path" TEXT,
  
  -- Auth do webhook
  "auth_type" VARCHAR(50) DEFAULT 'none',    -- none, basic, bearer
  "auth_username" VARCHAR(255),
  "auth_password" TEXT,
  
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "agents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agents_org_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);
```

---

## 🔗 Relacionamentos

```
organizations
  ├── organization_units
  │     └── agents (is_central)
  ├── whatsapp_cloud_instances
  │     ├── whatsapp_cloud_templates
  │     └── whatsapp_cloud_logs
  ├── instagram_instances
  │     └── instagram_messages_log
  ├── conversations
  │     └── messages
  └── agents
```

---

## 📝 Notas de Implementação

### Segurança
1. **Criptografar tokens** antes de salvar no banco
2. **Nunca expor** access_tokens nas APIs públicas
3. **Usar Row Level Security (RLS)** no PostgreSQL para isolamento multi-tenant

### Performance
1. **Índices obrigatórios** em todos os campos de filtro (organization_id, status, created_at)
2. **Particionar** tabelas de logs (whatsapp_cloud_logs, messages) por data
3. **Cachear** templates em Redis (sincronização periódica)

### Webhooks
1. **Validar assinatura** de todos os webhooks recebidos
2. **Responder rapidamente** (200 OK em < 20s)
3. **Processar assincronamente** (fila para processamento)
4. **Idempotência** - evitar processar mesma mensagem 2x

---

**Total de tabelas novas:** 10 tabelas principais  
**Complexidade:** Média-Alta  
**Tempo estimado de implementação:** 1-2 semanas (schemas + migrations)
