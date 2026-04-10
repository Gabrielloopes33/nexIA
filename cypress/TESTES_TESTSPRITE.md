# 🧪 Testes Cypress - Plano TestSprite

> Este documento foi gerado com base na análise do projeto NexIA Chat utilizando o TestSprite.

## 📋 Sumário dos Testes Criados

### 1. 🔐 Autenticação (`cypress/e2e/auth/`)

| Arquivo | Casos de Teste | Cobertura |
|---------|----------------|-----------|
| `login.cy.ts` | 13 testes | Login, validações, segurança, responsividade |
| `register.cy.ts` | 10 testes | Cadastro CRM, Revenda, validações |

**Principais cenários:**
- ✅ Login com credenciais válidas
- ❌ Login com credenciais inválidas
- ✅ Cadastro de usuário CRM
- ✅ Cadastro de revenda
- 🔒 Redirecionamento de usuários não autenticados
- 📱 Responsividade (Mobile, Tablet, Desktop)

---

### 2. 👥 Contatos (`cypress/e2e/contacts/`)

| Arquivo | Casos de Teste | Cobertura |
|---------|----------------|-----------|
| `crud.cy.ts` | 16 testes | CRUD completo, tags, segmentos |

**Principais cenários:**
- ✅ Listar contatos com filtros
- ✅ Criar novo contato
- ✅ Editar contato existente
- ✅ Mover para lixeira
- ✅ Adicionar tags
- ✅ Busca de contatos
- 📱 Responsividade mobile

---

### 3. 💬 Conversas (`cypress/e2e/conversations/`)

| Arquivo | Casos de Teste | Cobertura |
|---------|----------------|-----------|
| `chat.cy.ts` | 14 testes | Chat, mensagens, atribuição |

**Principais cenários:**
- ✅ Listar conversas (minhas/não atribuídas)
- ✅ Abrir conversa específica
- ✅ Enviar mensagem de texto
- ✅ Anexar arquivos
- ✅ Usar templates
- ✅ Atribuir conversa
- ✅ Arquivar conversa
- ✅ Adicionar notas internas

---

### 4. 📊 Pipeline (`cypress/e2e/pipeline/`)

| Arquivo | Casos de Teste | Cobertura |
|---------|----------------|-----------|
| `deals.cy.ts` | 17 testes | Oportunidades, drag-drop, filtros |

**Principais cenários:**
- ✅ Visualizar pipeline em colunas
- ✅ Criar nova oportunidade
- ✅ Mover entre estágios (drag & drop)
- ✅ Editar oportunidade
- ✅ Adicionar notas
- ✅ Filtrar por valor
- ✅ Marcar como ganha/perdida
- ✅ Busca de oportunidades

---

### 5. 📅 Agendamentos (`cypress/e2e/scheduling/`)

| Arquivo | Casos de Teste | Cobertura |
|---------|----------------|-----------|
| `appointments.cy.ts` | 19 testes | Tarefas, reuniões, ligações, prazos |

**Principais cenários:**
- ✅ Dashboard de agendamentos
- ✅ Criar tarefa
- ✅ Criar reunião com participantes
- ✅ Agendar ligação
- ✅ Criar prazo
- ✅ Marcar como concluído
- ✅ Editar data
- ✅ Excluir agendamento
- ✅ Visualização em calendário
- ✅ Fila de atendimento

---

## 📊 Resumo da Cobertura

```
Total de testes: 89
├── Autenticação: 23 testes
├── Contatos: 16 testes
├── Conversas: 14 testes
├── Pipeline: 17 testes
└── Agendamentos: 19 testes
```

---

## 🚀 Como Executar

### 1. Configurar variáveis de ambiente

Copie o arquivo de exemplo:
```bash
cp cypress.env.json.example cypress.env.json
```

Edite `cypress.env.json`:
```json
{
  "TEST_USER_EMAIL": "seu-email-de-teste@nexia.com",
  "TEST_USER_PASSWORD": "sua-senha-de-teste"
}
```

### 2. Iniciar a aplicação

```bash
pnpm dev
```

### 3. Executar testes

**Modo interativo:**
```bash
pnpm cypress:open
```

**Modo headless:**
```bash
# Todos os testes
pnpm cypress:run

# Apenas autenticação
pnpm cypress:run --spec "cypress/e2e/auth/**/*.cy.ts"

# Apenas contatos
pnpm cypress:run --spec "cypress/e2e/contacts/**/*.cy.ts"
```

---

## 🎯 Prioridades de Teste

### 🔴 Crítico (Executar sempre)
1. `auth/login.cy.ts` - Login é porta de entrada
2. `auth/register.cy.ts` - Cadastro de novos usuários
3. `contacts/crud.cy.ts` - Core do CRM

### 🟡 Importante (Executar no CI)
4. `conversations/chat.cy.ts` - Comunicação com clientes
5. `pipeline/deals.cy.ts` - Gestão de vendas
6. `scheduling/appointments.cy.ts` - Produtividade

---

## 📝 Recomendações TestSprite

### Dados de Teste
- Use emails únicos: `teste_${Date.now()}@nexia.com`
- Limpe dados após testes quando possível
- Use `cy.session()` para manter login entre testes

### Seletores
- Prefira `data-testid` quando disponível
- Use seletores de atributo como fallback: `[type="email"]`
- Evite seletores baseados em classes CSS que podem mudar

### Esperas
- Use `cy.intercept()` para aguardar requisições API
- Evite `cy.wait()` com tempo fixo
- Use asserções que esperam elementos: `cy.get().should('exist')`

### Flake Prevention
- Use `{ force: true }` em cliques quando elementos podem estar cobertos
- Verifique existência antes de interagir
- Use `.then()` para verificações condicionais

---

## 🔧 Configurações Especiais

### Viewports para Testes Responsivos
```typescript
{ name: 'Mobile', width: 375, height: 667 }
{ name: 'Tablet', width: 768, height: 1024 }
{ name: 'Desktop', width: 1280, height: 720 }
```

### Timeouts Configurados
- `defaultCommandTimeout`: 10000ms
- `requestTimeout`: 10000ms
- `pageLoadTimeout`: 30000ms

---

## 📚 Documentação Adicional

- [Cypress Docs](https://docs.cypress.io)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Reference](https://docs.cypress.io/api/table-of-contents)

---

## ✅ Checklist Pré-Deploy

- [ ] Todos os testes de autenticação passam
- [ ] Testes de contatos passam
- [ ] Testes de conversas passam
- [ ] Testes de pipeline passam
- [ ] Testes de agendamentos passam
- [ ] Screenshots de falhas revisados
- [ ] Vídeos de execução revisados (se necessário)

---

*Gerado com 💜 por TestSprite + Kimi Code CLI*
