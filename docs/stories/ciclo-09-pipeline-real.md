# CICLO 9 — Pipeline Real

## Branch
`feat/ciclo-09-pipeline-real`

## Entregável
Kanban conectado ao banco, drag-and-drop salvando, modal de deal funcional

---

## Resumo
Conectar o kanban de pipeline a dados reais do banco, implementar drag-and-drop
com persistência e criar modal de detalhes do deal com timeline de atividades.

---

## Schema de Dados

### PipelineStage
```prisma
model PipelineStage {
  id              String   @id @default(uuid())
  organizationId  String   @map("organization_id")
  name            String
  color           String   @default("#3b82f6")
  order           Int      @default(0)
  probability     Float    @default(0) // % de chance de fechamento
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  deals           Deal[]
}
```

### Deal
```prisma
model Deal {
  id              String   @id @default(uuid())
  organizationId  String   @map("organization_id")
  stageId         String   @map("stage_id")
  contactId       String   @map("contact_id")
  title           String
  description     String?
  value           Float    @default(0)
  currency        String   @default("BRL")
  status          DealStatus @default(OPEN)
  priority        Priority @default(MEDIUM)
  expectedCloseDate DateTime? @map("expected_close_date")
  actualCloseDate DateTime? @map("actual_close_date")
  leadScore       Float    @default(0) @map("lead_score")
  metadata        Json?    // Campos customizados
  source          String?  // Origem do lead
  tags            String[] @default([])
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  stage           PipelineStage @relation(fields: [stageId], references: [id])
  contact         Contact @relation(fields: [contactId], references: [id])
  activities      DealActivity[]
}

enum DealStatus {
  OPEN
  WON
  LOST
}
```

### DealActivity
```prisma
model DealActivity {
  id              String   @id @default(uuid())
  dealId          String   @map("deal_id")
  type            ActivityType
  description     String
  metadata        Json?    // Dados adicionais específicos do tipo
  createdBy       String?  @map("created_by")
  createdAt       DateTime @default(now()) @map("created_at")
  
  deal            Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)
}

enum ActivityType {
  STAGE_CHANGE
  NOTE
  CALL
  EMAIL
  MEETING
  TASK
  WHATSAPP
  INSTAGRAM
}
```

---

## API Endpoints

### GET /api/pipeline/stages
Retorna estágios do pipeline da organização.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Novo Lead",
      "color": "#3b82f6",
      "order": 0,
      "probability": 10
    }
  ]
}
```

### POST /api/pipeline/stages
Cria novo estágio.

**Request:**
```json
{
  "name": "Qualificação",
  "color": "#8b5cf6",
  "order": 1,
  "probability": 25
}
```

### GET /api/pipeline/deals
Retorna deals com filtros opcionais.

**Query Parameters:**
- `stageId` - Filtrar por estágio
- `status` - Filtrar por status (OPEN, WON, LOST)
- `contactId` - Filtrar por contato

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Deal Exemplo",
      "value": 10000,
      "currency": "BRL",
      "status": "OPEN",
      "priority": "HIGH",
      "leadScore": 75,
      "stageId": "...",
      "contact": {
        "id": "...",
        "name": "João Silva",
        "email": "joao@exemplo.com"
      },
      "expectedCloseDate": "2024-12-31T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/pipeline/deals
Cria novo deal.

**Request:**
```json
{
  "stageId": "...",
  "contactId": "...",
  "title": "Novo Deal",
  "description": "Descrição opcional",
  "value": 5000,
  "priority": "MEDIUM",
  "expectedCloseDate": "2024-12-31"
}
```

### PATCH /api/pipeline/deals/[id]
Atualiza deal (usado para mover estágio).

**Request:**
```json
{
  "stageId": "novo-stage-id",
  "status": "WON"
}
```

### GET /api/pipeline/deals/[id]/activities
Retorna atividades do deal.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "STAGE_CHANGE",
      "description": "Movido de 'Novo Lead' para 'Qualificação'",
      "metadata": {
        "fromStageId": "...",
        "toStageId": "...",
        "fromStageName": "Novo Lead",
        "toStageName": "Qualificação"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/pipeline/deals/[id]/activities
Cria nova atividade (nota, call, etc).

**Request:**
```json
{
  "type": "NOTE",
  "description": "Lembrete: ligar na sexta-feira"
}
```

---

## Componentes

### PipelineKanban
Kanban board com colunas por estágio e cards de deals.

```typescript
interface PipelineKanbanProps {
  stages: PipelineStage[];
  deals: Deal[];
  onMoveDeal: (dealId: string, newStageId: string) => void;
  onSelectDeal: (deal: Deal) => void;
}
```

### DealCard
Card de deal draggável.

```typescript
interface DealCardProps {
  deal: Deal;
  onClick: () => void;
}
```

### DealDetailModal
Modal com detalhes do deal e timeline.

```typescript
interface DealDetailModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  activities: DealActivity[];
  onAddNote: (note: string) => void;
  onUpdateDeal: (updates: Partial<Deal>) => void;
}
```

### LeadScoreBadge
Badge com score do lead colorido.

```typescript
interface LeadScoreBadgeProps {
  score: number; // 0-100
}
```

---

## Fluxo de Drag-and-Drop

1. Usuário arrasta card de deal para outra coluna
2. `onDragEnd` captura novo `stageId`
3. Chama `PATCH /api/pipeline/deals/[id]` com novo stage
4. Backend:
   - Atualiza `stageId` do deal
   - Cria `DealActivity` do tipo `STAGE_CHANGE`
5. UI atualiza otimisticamente

---

## Fórmula de Lead Score

Baseada em múltiplos fatores:

```typescript
function calculateLeadScore(deal: Deal): number {
  let score = 0;
  
  // 1. Idade do deal (mais novo = mais quente)
  const daysSinceCreated = differenceInDays(new Date(), deal.createdAt);
  if (daysSinceCreated <= 7) score += 20;
  else if (daysSinceCreated <= 30) score += 10;
  else score += 5;
  
  // 2. Última atividade
  const lastActivity = deal.activities[0];
  if (lastActivity) {
    const daysSinceActivity = differenceInDays(new Date(), lastActivity.createdAt);
    if (daysSinceActivity <= 3) score += 20;
    else if (daysSinceActivity <= 7) score += 10;
  }
  
  // 3. Valor do deal
  if (deal.value > 50000) score += 20;
  else if (deal.value > 10000) score += 15;
  else if (deal.value > 5000) score += 10;
  
  // 4. Prioridade
  switch (deal.priority) {
    case "HIGH": score += 15; break;
    case "MEDIUM": score += 10; break;
    case "LOW": score += 5; break;
  }
  
  // 5. Probabilidade do estágio
  score += (deal.stage.probability * 0.15);
  
  return Math.min(100, Math.max(0, score));
}
```

---

## Checklist de Implementação

### Backend
- [ ] Criar `/api/pipeline/stages` (GET, POST)
- [ ] Criar `/api/pipeline/deals` (GET, POST)
- [ ] Criar `/api/pipeline/deals/[id]` (GET, PATCH, DELETE)
- [ ] Criar `/api/pipeline/deals/[id]/activities` (GET, POST)
- [ ] Implementar cálculo de lead score
- [ ] Criar DealActivity ao mover estágio

### Frontend
- [ ] Criar `DealCard` component
- [ ] Criar `DealDetailModal` com timeline
- [ ] Criar `LeadScoreBadge` component
- [ ] Atualizar `PipelineKanban` para usar dados reais
- [ ] Implementar drag-and-drop com @hello-pangea/dnd
- [ ] Adicionar loading states e erros

### QA
- [ ] Testar criação de deal
- [ ] Testar mover entre colunas
- [ ] Verificar criação de DealActivity
- [ ] Testar modal com dados reais
- [ ] Testar adicionar nota

---

## Notas

- Manter visual idêntico ao kanban atual
- Usar otimistic UI para drag-and-drop
- Implementar retry em caso de falha na API
- Cache de estágos (raramente mudam)
