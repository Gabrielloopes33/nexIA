# CICLO 10 — Conversations + Deal Bridge

## Branch
`feat/ciclo-10-conversations-deal-bridge`

## Entregável
Mensagens WhatsApp/Instagram registram `DealActivity` no deal ativo do contato

---

## Resumo
Criar ponte entre canais de comunicação (WhatsApp/Instagram) e o pipeline de vendas.
Quando uma mensagem é recebida de um contato que possui um deal ativo, o sistema deve:
1. Criar uma `DealActivity` vinculada ao deal
2. Atualizar o `leadScore` do deal conforme o tipo de interação
3. Mostrar indicador visual no chat sobre o deal ativo

---

## Score Impact por Tipo de Interação

| Tipo de Interação | Activity Type | Score Impact |
|-------------------|---------------|--------------|
| Mensagem WhatsApp recebida | `WHATSAPP` | +2 |
| Mensagem Instagram recebida | `INSTAGRAM` | +2 |
| Ligação realizada | `CALL` | +5 |
| Email enviado | `EMAIL` | +3 |
| Reunião agendada | `MEETING` | +10 |
| Tarefa completada | `TASK` | +5 |
| Nota adicionada | `NOTE` | +1 |
| Mudança de estágio | `STAGE_CHANGE` | +5 |

### Fórmula de Atualização do Lead Score

```typescript
function calculateScoreImpact(activityType: ActivityType): number {
  const impactMap: Record<ActivityType, number> = {
    WHATSAPP: 2,
    INSTAGRAM: 2,
    CALL: 5,
    EMAIL: 3,
    MEETING: 10,
    TASK: 5,
    NOTE: 1,
    STAGE_CHANGE: 5,
  };
  
  return impactMap[activityType] || 0;
}

function updateLeadScore(currentScore: number, activityType: ActivityType): number {
  const impact = calculateScoreImpact(activityType);
  const newScore = Math.min(100, currentScore + impact);
  return newScore;
}
```

### Decay de Score (Atividades Antigas)

Atividades perdem impacto ao longo do tempo:
- Atividades < 7 dias: 100% do impacto
- Atividades 7-30 dias: 50% do impacto
- Atividades > 30 dias: 0% do impacto (não somam)

---

## Fluxo de Processamento

### Webhook WhatsApp/Instagram

```
1. Receber webhook de mensagem
   ↓
2. Extrair contactId do remetente
   ↓
3. Buscar deals ativos (status = OPEN) do contato
   ↓
4. Se houver deal ativo:
   a. Criar DealActivity (tipo: WHATSAP/INSTAGRAM)
   b. Calcular novo leadScore
   c. Atualizar deal com novo score
   ↓
5. Continuar processamento normal da mensagem
```

### Implementação no Webhook

```typescript
// Após salvar a mensagem no banco
const activeDeals = await prisma.deal.findMany({
  where: {
    contactId: contact.id,
    status: "OPEN",
  },
});

for (const deal of activeDeals) {
  // Criar activity
  await prisma.dealActivity.create({
    data: {
      dealId: deal.id,
      type: "WHATSAPP", // ou "INSTAGRAM"
      description: `Mensagem recebida: ${message.text?.slice(0, 50)}...`,
      metadata: {
        messageId: message.id,
        channel: "WHATSAPP",
        preview: message.text?.slice(0, 100),
      },
    },
  });
  
  // Atualizar lead score
  const newScore = updateLeadScore(deal.leadScore, "WHATSAPP");
  await prisma.deal.update({
    where: { id: deal.id },
    data: { leadScore: newScore },
  });
}
```

---

## API Endpoints

### GET /api/contacts/[id]/active-deal
Retorna o deal ativo do contato (se houver).

**Response:**
```json
{
  "success": true,
  "data": {
    "hasActiveDeal": true,
    "deal": {
      "id": "...",
      "title": "Negócio Exemplo",
      "value": 15000,
      "stage": {
        "id": "...",
        "name": "Qualificação",
        "color": "#8b5cf6"
      },
      "leadScore": 75,
      "expectedCloseDate": "2024-12-31"
    }
  }
}
```

---

## Componentes UI

### DealBadge (Chat)
Badge discreto no header do chat quando o contato tem deal ativo.

```typescript
interface DealBadgeProps {
  deal: {
    id: string;
    title: string;
    stage: {
      name: string;
      color: string;
    };
    value: number;
    leadScore: number;
  };
  onClick: () => void;
}
```

**Design:**
- Posição: Header do chat, ao lado do nome do contato
- Estilo: Badge pill com cor do estágio
- Conteúdo: "🎯 Negócio: {stage.name} • R$ {value}"
- Comportamento: Click abre modal do deal

### Exemplo Visual:
```
┌─────────────────────────────────────────────────────┐
│ [←] João Silva                    🎯 Proposta R$15k │
│      joao@email.com                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Olá! Tenho interesse no produto...                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Checklist de Implementação

### Backend
- [ ] Atualizar `POST /api/whatsapp/webhooks` para criar DealActivity
- [ ] Atualizar `POST /api/instagram/webhooks` para criar DealActivity
- [ ] Criar função `updateLeadScore` em `lib/pipeline/scoring.ts`
- [ ] Criar `GET /api/contacts/[id]/active-deal`
- [ ] Adicionar `ActivityType.WHATSAPP` e `ActivityType.INSTAGRAM` no schema

### Frontend
- [ ] Criar componente `DealBadge` para o chat
- [ ] Integrar `DealBadge` no header do chat
- [ ] Criar hook `useActiveDeal(contactId)`
- [ ] Adicionar link para abrir modal do deal

### QA
- [ ] Testar mensagem recebida → DealActivity criada
- [ ] Testar lead score atualizado
- [ ] Testar badge aparecendo no chat
- [ ] Testar contato sem deal (não deve quebrar)

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Performance: consulta de deals a cada mensagem | Usar índice em `contactId` + `status` |
| Spam de activities | Limitar a 1 activity por hora para mensagens |
| Race condition no lead score | Usar transação atômica no Prisma |

---

## Notas

- O badge no chat deve ser discreto para não poluir a interface
- Click no badge abre o `DealDetailModal` já existente
- Se contato tiver múltiplos deals ativos, mostrar apenas o mais recente
- Atividades de mensagens devem ter preview do conteúdo (limitado a 100 chars)
