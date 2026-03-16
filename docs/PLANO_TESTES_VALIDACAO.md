# Plano de Testes e Validação

**Data:** 2026-03-12  
**Status:** Em execução  
**Escopo:** APIs, Hooks e Componentes implementados (AI Insights, Transcriptions, Integration Logs, Conversations)

---

## Sumário Executivo

Este plano cobre a validação completa das implementações realizadas:
- ✅ 4 APIs RESTful (AI Insights, Transcriptions, Integration Logs, Conversations)
- ✅ 4 React Hooks com SWR
- ✅ 4 Componentes de exemplo
- ✅ Schema Prisma atualizado
- ✅ Integração com Organization Context

**Objetivo:** Garantir que todas as implementações estejam funcionando corretamente, seguras e prontas para produção.

---

## Estrutura de Testes

```
__tests__/
├── unit/
│   ├── hooks/
│   │   ├── use-ai-insights.test.ts
│   │   ├── use-transcriptions.test.ts
│   │   ├── use-integration-logs.test.ts
│   │   └── use-conversations.test.ts
│   ├── lib/
│   │   ├── api-client.test.ts
│   │   └── formatters.test.ts
│   └── components/
│       └── examples/
├── integration/
│   ├── api/
│   │   ├── ai-insights.test.ts
│   │   ├── transcriptions.test.ts
│   │   ├── integration-logs.test.ts
│   │   └── conversations.test.ts
│   └── database/
│       └── prisma-models.test.ts
├── e2e/
│   └── flows/
│       ├── ai-insights-dashboard.spec.ts
│       ├── transcriptions-workflow.spec.ts
│       └── conversations-chat.spec.ts
└── setup.ts
```

---

## Fase 1 — Testes Unitários (Responsável: @dev)

### 1.1 Hooks - Checklist de Testes

| Hook | Teste | Critério de Aceite |
|------|-------|-------------------|
| `useAiInsights` | Fetch inicial | Chama API com organization_id correto |
| `useAiInsights` | Filtros | Aplica filtros de tipo e status na query |
| `useAiInsights` | Mutações | create/update/delete com optimistic update |
| `useAiInsights` | Cache SWR | Reutiliza dados em re-mount |
| `useAiInsights` | Error handling | Retorna erro em português amigável |
| `useTranscriptions` | Fetch | Lista transcriptions com paginação |
| `useTranscriptions` | Single item | Busca transcription por ID |
| `useTranscriptions` | Analytics | Calcula taxa de conversão corretamente |
| `useIntegrationLogs` | Período filter | Filtra por período (24h, 7d, 30d) |
| `useIntegrationLogs` | Type filter | Filtra por tipo de integração |
| `useIntegrationLogs` | Stats | Retorna estatísticas agregadas |
| `useConversations` | Window validation | Bloqueia envio se janela expirou |
| `useConversations` | Pagination | Carrega mais mensagens ao scrollar |
| `useConversations` | Real-time | Atualiza mensagens novas |

### 1.2 Padrão de Teste para Hooks

```typescript
// __tests__/unit/hooks/use-ai-insights.test.ts
describe('useAiInsights', () => {
  it('fetches insights with organization_id', async () => {
    // Mock SWR
    // Verificar se URL contém organization_id
  })
  
  it('creates insight with optimistic update', async () => {
    // Verificar se mutate é chamado com dados otimistas
    // Verificar rollback em erro
  })
  
  it('handles errors in Portuguese', async () => {
    // Mock erro 500
    // Verificar mensagem em português
  })
})
```

---

## Fase 2 — Testes de Integração (Responsável: @dev + @qa)

### 2.1 APIs - Checklist de Testes

#### AI Insights API (`/api/ai-insights`)

| Método | Rota | Teste | Esperado |
|--------|------|-------|----------|
| GET | `/api/ai-insights` | Lista com paginação | 200 + array de insights |
| GET | `/api/ai-insights` | Filtro por tipo | Retorna apenas do tipo solicitado |
| GET | `/api/ai-insights` | Filtro por status | Retorna apenas status solicitado |
| GET | `/api/ai-insights` | Sem organization_id | 400 Bad Request |
| GET | `/api/ai-insights/stats` | Estatísticas | 200 + objeto com contagens |
| POST | `/api/ai-insights` | Cria insight | 201 + objeto criado |
| POST | `/api/ai-insights` | Dados inválidos | 400 + mensagem erro |
| PATCH | `/api/ai-insights/[id]` | Atualiza insight | 200 + objeto atualizado |
| PATCH | `/api/ai-insights/[id]` | ID inexistente | 404 Not Found |
| DELETE | `/api/ai-insights/[id]` | Remove insight | 200 + confirmação |
| DELETE | `/api/ai-insights/[id]` | ID inexistente | 404 Not Found |

#### Transcriptions API (`/api/transcriptions`)

| Método | Rota | Teste | Esperado |
|--------|------|-------|----------|
| GET | `/api/transcriptions` | Lista | 200 + transcriptions |
| GET | `/api/transcriptions` | Filtro por contactId | Retorna do contato específico |
| GET | `/api/transcriptions` | Filtro por status | Filtra por processing/completed/failed |
| GET | `/api/transcriptions/[id]` | Busca por ID | 200 + transcription |
| GET | `/api/transcriptions/[id]` | ID inválido | 404 |
| POST | `/api/transcriptions` | Cria transcription | 201 + objeto criado |
| PATCH | `/api/transcriptions/[id]` | Atualiza | 200 + atualizado |
| DELETE | `/api/transcriptions/[id]` | Remove | 200 |
| GET | `/api/transcriptions/analytics` | Analytics | 200 + métricas |

#### Integration Logs API (`/api/integration-logs`)

| Método | Rota | Teste | Esperado |
|--------|------|-------|----------|
| GET | `/api/integration-logs` | Lista | 200 + logs paginados |
| GET | `/api/integration-logs` | Filtro por tipo | Filtra integration_type |
| GET | `/api/integration-logs` | Filtro por status | Filtra status |
| GET | `/api/integration-logs` | Período 24h | Retorna últimas 24h |
| GET | `/api/integration-logs/stats` | Estatísticas | 200 + stats |
| POST | `/api/integration-logs` | Cria log | 201 |
| DELETE | `/api/integration-logs` | Limpa antigos | 200 + count removido |

#### Conversations API (`/api/conversations`)

| Método | Rota | Teste | Esperado |
|--------|------|-------|----------|
| GET | `/api/conversations` | Lista | 200 + conversas |
| GET | `/api/conversations` | Filtro activeOnly | Retorna apenas com janela ativa |
| GET | `/api/conversations` | Filtro por canal | WhatsApp/Instagram/Chat |
| GET | `/api/conversations/[id]` | Detalhe | 200 + messages |
| GET | `/api/conversations/[id]/messages` | Mensagens | 200 + paginação |
| POST | `/api/conversations` | Cria conversa | 201 |
| POST | `/api/conversations/[id]/messages` | Envia mensagem | 201 (se janela ativa) |
| POST | `/api/conversations/[id]/messages` | Janela expirada | 400 + erro |
| PATCH | `/api/conversations/[id]` | Atualiza | 200 |
| DELETE | `/api/conversations/[id]` | Remove | 200 |
| GET | `/api/conversations/stats` | Stats | 200 |

### 2.2 Testes de Banco de Dados

| Teste | Descrição | Query de Validação |
|-------|-----------|-------------------|
| Modelo AiInsight | Campos obrigatórios | `SELECT * FROM "AiInsight" LIMIT 1` |
| Modelo Transcription | Relação com Contact | Verificar FK contact_id |
| Modelo IntegrationActivityLog | Relação com Organization | Verificar FK organization_id |
| Soft delete | Não exclui físico | Verificar campo deletedAt |
| Indexes | Performance | `EXPLAIN` nas queries principais |
| RLS | Segurança | Testar acesso cross-organization |

---

## Fase 3 — Testes E2E (Responsável: @qa)

### 3.1 Fluxos de Usuário

```gherkin
# Fluxo: AI Insights Dashboard
Feature: AI Insights Dashboard
  Scenario: Visualizar insights
    Given estou logado na organização "Acme Corp"
    And existem insights do tipo "prediction" na base
    When acesso a página "/insights"
    Then vejo a lista de insights agrupados por tipo
    And posso marcar um insight como "dismissed"
    And o insight some da lista sem refresh

  Scenario: Janela de conversa expirada
    Given estou em uma conversa WhatsApp
    And a última mensagem do cliente foi há 25 horas
    When tento enviar uma mensagem
    Then vejo um aviso que a janela expirou
    And o botão de envio está desabilitado
```

### 3.2 Cenários de Teste E2E

| Fluxo | Cenário | Validação |
|-------|---------|-----------|
| AI Insights | Visualizar e dismiss | Insight some com optimistic update |
| AI Insights | Filtrar por tipo | Apenas tipo selecionado aparece |
| Transcriptions | Upload e processamento | Status muda para "completed" |
| Transcriptions | Ver analytics | Gráficos atualizam |
| Integration Logs | Ver logs em tempo real | Novos logs aparecem automaticamente |
| Integration Logs | Filtrar por erro | Apenas erros exibidos |
| Conversations | Enviar mensagem | Mensagem aparece imediatamente |
| Conversations | Janela expirada | Bloqueio e aviso exibidos |
| Conversations | Carregar histórico | Scroll infinito funciona |

---

## Fase 4 — Validação de Segurança (Responsável: @architect + @qa)

### 4.1 Checklist de Segurança

| Aspecto | Teste | Ferramenta/Método |
|---------|-------|-------------------|
| RLS | Usuário A não vê dados do Usuário B | Teste manual + query |
| SQL Injection | Tentativa de injeção em filtros | sqlmap ou teste manual |
| XSS | Script em campos de texto | `<script>alert(1)</script>` |
| Auth | Acesso sem token | 401 Unauthorized |
| Auth | Token expirado | 401 Unauthorized |
| Rate Limit | Muitas requisições | Verificar limites |
| CORS | Origens não permitidas | Teste de preflight |

### 4.2 Testes de RLS

```sql
-- Teste: Usuário da Org A não deve ver dados da Org B
-- Como usuário da Org A:
SELECT * FROM "AiInsight" WHERE "organizationId" = '<org-b-id>';
-- Esperado: 0 resultados

-- Como usuário da Org B:
SELECT * FROM "AiInsight" WHERE "organizationId" = '<org-b-id>';
-- Esperado: N resultados
```

---

## Fase 5 — Validação Técnica (Responsável: @dev)

### 5.1 TypeScript & Build

```bash
# Checklist de validação
npm run typecheck      # Deve passar sem erros
npm run lint           # Deve passar sem warnings
npm run build          # Deve gerar build sem erros
```

### 5.2 Validação de Imports

```bash
# Verificar se não há imports de mock nos novos arquivos
grep -r "from.*mock" app/api/ai-insights/
grep -r "from.*mock" hooks/use-ai-insights.ts
# Esperado: nenhum resultado
```

### 5.3 Validação de Tipos

| Arquivo | Validação |
|---------|-----------|
| `hooks/use-ai-insights.ts` | Retorna `AiInsight[]` tipado |
| `hooks/use-transcriptions.ts` | Retorna `Transcription[]` tipado |
| `app/api/ai-insights/route.ts` | Request/Response tipados |
| `prisma/schema.prisma` | Modelos com @map correto |

---

## Fase 6 — Documentação (Responsável: @pm)

### 6.1 Documentação a Criar

| Documento | Descrição |
|-----------|-----------|
| `docs/API_AI_INSIGHTS.md` | Documentação da API |
| `docs/API_TRANSCRIPTIONS.md` | Documentação da API |
| `docs/API_INTEGRATION_LOGS.md` | Documentação da API |
| `docs/API_CONVERSATIONS.md` | Documentação da API |
| `docs/HOOKS_GUIDE.md` | Guia de uso dos hooks |
| `docs/CHANGELOG.md` | Registro de mudanças |

---

## Execução dos Testes

### Comandos

```bash
# Rodar todos os testes
npm test

# Rodar testes unitários apenas
npm run test:unit

# Rodar testes de integração
npm run test:integration

# Rodar testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage

# Validação completa (pre-commit)
npm run validate
```

---

## Critérios de Aceite Gerais

### Para Aprovação do Plano

- [ ] 100% dos testes unitários passando
- [ ] 100% dos testes de integração passando
- [ ] Testes E2E principais passando
- [ ] Cobertura de código > 80%
- [ ] TypeScript sem erros
- [ ] Lint sem warnings
- [ ] Build gera sem erros
- [ ] Segurança: RLS funcionando
- [ ] Nenhum import de mock nos novos arquivos
- [ ] Documentação completa

---

## Agentes e Responsabilidades

| Agente | Responsabilidade | Entregáveis |
|--------|------------------|-------------|
| @dev | Testes unitários e integração | Arquivos de teste, scripts |
| @qa | Testes E2E e validação manual | Relatório de bugs, aprovação |
| @architect | Validação de segurança e schema | Review de RLS, aprovação técnica |
| @pm | Documentação e coordenação | Docs, atualização do plano |

---

## Próximos Passos

1. **@dev** - Configurar ambiente de testes (Jest/Vitest)
2. **@dev** - Criar testes unitários para hooks
3. **@dev** - Criar testes de integração para APIs
4. **@qa** - Criar testes E2E
5. **@architect** - Validar segurança
6. **@pm** - Documentar e aprovar

---

## Registro de Execução

| Data | Atividade | Responsável | Status |
|------|-----------|-------------|--------|
| 2026-03-12 | Plano criado | @architect | ✅ Concluído |
| | | | |
