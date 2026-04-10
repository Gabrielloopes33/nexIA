# Cypress - Testes E2E do NexIA Chat

Este diretório contém os testes E2E (End-to-End) do projeto NexIA Chat usando Cypress.

> 📖 **Documentação completa gerada pelo TestSprite:** Veja `TESTES_TESTSPRITE.md`

## 🧪 Estrutura de Testes

```
cypress/e2e/
├── auth/              # 23 testes - Login, Cadastro
├── contacts/          # 16 testes - CRUD de Contatos
├── conversations/     # 14 testes - Chat, Mensagens
├── pipeline/          # 17 testes - Pipeline de Vendas
└── scheduling/        # 19 testes - Agendamentos

Total: 89 testes
```

## 🚀 Começando

### Instalação
```bash
pnpm install
```

### Configurar variáveis de ambiente
Copie o arquivo de exemplo e configure suas credenciais de teste:
```bash
cp cypress.env.json.example cypress.env.json
```

Edite o `cypress.env.json` com suas credenciais de teste.

## 📋 Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm cypress:open` | Abre o Cypress em modo interativo |
| `pnpm cypress:run` | Executa os testes em modo headless |
| `pnpm cypress:run:e2e` | Executa apenas os testes E2E |
| `pnpm cypress:run:component` | Executa apenas os testes de componente |
| `pnpm cypress:ci` | Executa no CI com gravação no Cypress Cloud |

## 🏗️ Estrutura de pastas

```
cypress/
├── e2e/                    # Testes E2E
│   ├── spec.cy.ts         # Teste básico de exemplo
│   └── dashboard.cy.ts    # Testes do dashboard
├── fixtures/              # Dados mockados
│   └── example.json
├── support/               # Comandos e configurações globais
│   ├── commands.ts        # Comandos customizados
│   ├── e2e.ts            # Configuração E2E
│   └── component.ts      # Configuração de componentes
├── component/             # Testes de componente
├── downloads/             # Downloads durante os testes
├── screenshots/           # Screenshots de falhas
└── videos/               # Gravações dos testes
```

## 📝 Comandos customizados

### `cy.login(email, password)`
Realiza login no sistema mantendo a sessão:
```typescript
cy.login('usuario@teste.com', 'senha123')
cy.visit('/dashboard')
```

### `cy.clearSession()`
Limpa cookies, localStorage e sessionStorage:
```typescript
cy.clearSession()
```

### `cy.waitForApp()`
Aguarda requisições da API terminarem:
```typescript
cy.waitForApp()
```

## 🔗 Cypress Cloud

Este projeto está configurado com o Cypress Cloud (projectId: `2y1o7b`).

Para gravar execuções no Cypress Cloud:
```bash
pnpm cypress:ci
```

## ⚙️ Configuração

As configurações estão em `cypress.config.ts`:
- `baseUrl`: URL base da aplicação (http://localhost:3000)
- `viewportWidth/Height`: Tamanho da viewport padrão (1280x720)
- `defaultCommandTimeout`: Timeout padrão para comandos (10s)

## 🧪 Escrevendo testes

Exemplo básico:
```typescript
describe('Funcionalidade X', () => {
  beforeEach(() => {
    cy.login('usuario@teste.com', 'senha123')
  })

  it('deve realizar ação Y', () => {
    cy.visit('/pagina')
    cy.get('[data-testid="botao"]').click()
    cy.contains('Texto esperado').should('be.visible')
  })
})
```

## 📚 Documentação

- [Documentação oficial do Cypress](https://docs.cypress.io)
- [Guia de boas práticas](https://docs.cypress.io/guides/references/best-practices)
