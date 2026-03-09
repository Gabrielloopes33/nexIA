# CICLO 6 — WhatsApp UI Conectada

**Branch:** `feat/ciclo-06-whatsapp-ui-real`
**Entregável:** Todas as páginas `/integracoes/whatsapp/*` usando dados reais do banco

---

## Resumo

Este ciclo conecta todas as páginas de integração WhatsApp aos dados reais do banco, removendo mocks e implementando estados de loading/empty/error.

## Páginas a Conectar

### 1. `/integracoes/whatsapp` (Lista de Instâncias)

**Dados necessários:**
```typescript
interface WhatsAppInstanceData {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'SUSPENDED';
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messagingLimit: number;
  connectedAt: Date;
  _count: {
    conversations: number;
  };
}
```

**API:** GET `/api/whatsapp/instances` (nova)

**Estados:**
- Loading: Skeleton cards
- Empty: "Nenhuma instância conectada" + CTA
- Error: Toast + Retry
- Success: Lista de cards com status colorido

### 2. `/integracoes/whatsapp/connect` (Conexão)

**Componentes:**
- `EmbeddedSignupButton` real (CICLO 4)
- Lista de instâncias existentes
- Botão "Desconectar" por instância

**APIs:**
- GET `/api/whatsapp/embedded-signup/config`
- POST `/api/whatsapp/instances/[id]/disconnect` (nova)

### 3. `/integracoes/whatsapp/templates` (Templates)

**Dados:**
```typescript
interface TemplateData {
  id: string;
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}
```

**APIs:**
- GET `/api/whatsapp/templates` (existente, conectar ao banco)
- POST `/api/whatsapp/templates/sync` (existente)

**Funcionalidades:**
- Lista templates do banco
- Botão "Sincronizar com Meta" → chama sync API
- Status badge (colorido por status)
- Filtro por categoria e status

### 4. `/integracoes/whatsapp/webhooks` (Logs)

**Dados:**
```typescript
interface WebhookLogData {
  id: string;
  type: string;
  eventType: string;
  processed: boolean;
  error: string | null;
  createdAt: Date;
  payload: object; // Collapsible
}
```

**API:** GET `/api/whatsapp/logs` (nova)

**Funcionalidades:**
- Lista logs paginados
- Filtro: Todos | Não processados | Com erro
- Expandir payload (JSON viewer)
- Auto-refresh a cada 30s

### 5. `/integracoes/whatsapp/numeros` (Números)

**Dados:** Vem da WhatsAppInstance (phoneNumber, qualityRating, messagingLimit)

## API Routes a Criar/Completar

### GET /api/whatsapp/instances
Lista todas as instâncias da organização.

```typescript
// Query params
organizationId: string

// Response
{
  instances: WhatsAppInstanceData[]
}
```

### DELETE /api/whatsapp/instances/[id]
Remove instância do banco.

### POST /api/whatsapp/instances/[id]/disconnect
Atualiza status para DISCONNECTED, limpa tokens.

### GET /api/whatsapp/logs
Lista logs com paginação.

```typescript
// Query params
organizationId: string
page?: number
limit?: number
type?: string
processed?: boolean

// Response
{
  logs: WebhookLogData[];
  pagination: {
    total: number;
    pages: number;
    current: number;
  }
}
```

### GET /api/whatsapp/status
Retorna status geral da integração.

```typescript
{
  connected: boolean;
  instances: number;
  totalConversations: number;
  lastMessageAt: Date | null;
}
```

## Componentes UI

### InstanceCard
```typescript
interface InstanceCardProps {
  instance: WhatsAppInstanceData;
  onDisconnect: () => void;
}
```
- Badge de status (colorido)
- Ícone de qualidade (semaforo)
- Contador de conversas
- Menu de ações

### TemplateList
- Tabela com colunas: Nome, Categoria, Idioma, Status, Ações
- Filtros em toolbar
- Refresh button

### WebhookLogViewer
- Tabela com colunas: Data, Tipo, Evento, Status, Ações
- Expand row para ver payload
- Badge "Processado" / "Erro" / "Pendente"

### BusinessProfileSection
- Exibe info do perfil de negócio
- Edição inline (se API permitir)

## Critérios de Aceite

- [x] Nenhuma página usa dados mock
- [x] Estados de loading e empty state implementados
- [x] Visual idêntico ao que existia (apenas dados reais no lugar de mock)
- [x] Sync de templates funciona e atualiza a lista
- [x] Filtros e busca funcionais

## Testes QA

1. **Lista de instâncias:**
   - Carrega dados reais
   - Badge de status muda cor
   - Botão desconectar funciona

2. **Templates:**
   - Lista templates do banco
   - Sync atualiza lista
   - Filtros funcionam

3. **Logs:**
   - Lista logs reais
   - Paginação funciona
   - Expandir payload funciona

4. **Performance:**
   - Loading states visíveis
   - Sem flash de conteúdo
   - Cache/SWR para dados

## Decisões Arquiteturais

1. **SWR/React Query**: Para cache e revalidação automática
2. **Optimistic UI**: Atualizações refletem imediatamente na UI
3. **Skeleton Loading**: Melhor UX que spinner
4. **Error Boundaries**: Capturar erros de API
5. **Real-time**: Considerar WebSocket/SSE para logs futuramente

## Dependências

- CICLO 4 (Embedded Signup)
- CICLO 5 (Send + Webhook)
- shadcn/ui Table, Skeleton, Badge, DropdownMenu
