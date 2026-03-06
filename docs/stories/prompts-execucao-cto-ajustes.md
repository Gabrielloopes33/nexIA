# Prompts de Execução — STORY-CTO-AJUSTES-001

**Story:** docs/stories/story-cto-ajustes-crm.md
**Status atual:** TASK-02 (Lead Score) concluída. Restam TASK-01 e TASK-03.

---

## Status das Tasks

| Task | Descrição | Status |
|------|-----------|--------|
| TASK-02 | Remover Lead Score / Pontuação | ✅ Concluída |
| TASK-01 | Remover Gestão de Emails | ⏳ Próxima |
| TASK-03 | Corrigir Inconsistência da Sidebar | ⏳ Aguardando TASK-01 |

---

## TASK-01 — Remover Gestão de Emails do CRM

### PASSO 1 — Cole este prompt para o @dev

```
@dev

## TASK-01 — Remover Gestão de Emails do CRM
**Story:** STORY-CTO-AJUSTES-001

A CTO confirmou que o CRM não terá módulo de gestão de emails. Remover tudo relacionado a envio, rastreamento e canal de email. Email como dado cadastral do contato (campo de endereço) deve ser MANTIDO.

### Arquivos e o que remover:

**1. `components/contacts/contacts-table.tsx`**
- Remover a ação "Enviar Email" no dropdown/menu de ações da linha de contato (~linha 198)
- Remover o import `Mail` de lucide-react SE não for mais usado no arquivo após a remoção

**2. `components/contact-detail-panel.tsx`**
- Remover o botão com ícone `Mail` na toolbar da timeline (~linha 730):
  ```tsx
  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
    <Mail className="h-4 w-4" />
  </Button>
  ```
- Remover o import `Mail` de lucide-react SE não for mais usado no arquivo após a remoção

**3. `components/conversation-volume-chart.tsx`**
- Remover a entrada `email: "#b3b3e5"` do objeto de cores (~linha 26)
- Remover o `<Bar dataKey="email" ... />` do gráfico (~linha 80)
- Remover o item de legenda "Email" (~linhas 106-107):
  ```tsx
  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: channelColors.email }} />
  <span className="text-muted-foreground text-xs">Email</span>
  ```
- Remover o campo `email` dos dados mock usados por este gráfico (se estiverem no mesmo arquivo)

### NÃO remover:
- Campos `contact.email` exibindo o endereço de email do contato
- Inputs `type="email"` em formulários de cadastro
- Qualquer coisa em `app/integracoes/` (integração de canal é diferente de gestão)
- Campos de email em payloads de webhook (`lib/whatsapp/`)

### Ao finalizar:
Relate os arquivos modificados. NÃO rode validações — isso é responsabilidade do @qa.
```

---

### PASSO 2 — Após o @dev finalizar, cole este prompt para o @qa

```
@qa

## Validação — TASK-01 — Remover Gestão de Emails
**Story:** STORY-CTO-AJUSTES-001

O @dev removeu as features de gestão de email. Valide antes do push.

### Execute nesta ordem:

**1. Confirmar que features de email foram removidas:**
```bash
grep -rn "Enviar Email\|channelColors.email\|dataKey=\"email\"\|emailsAbertos\|emailsClicados" \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.next .
```
Deve retornar zero resultados.

**2. Confirmar que email cadastral foi MANTIDO (não pode estar vazio):**
```bash
grep -rn "contact\.email\|type=\"email\"" \
  --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  app/contatos/ components/contacts/
```
Deve retornar resultados (o campo de endereço de email do contato foi preservado).

**3. Typecheck:**
```bash
npm run typecheck
```

**4. Lint:**
```bash
npm run lint
```

**5. Build:**
```bash
npm run build
```

### Critérios de aprovação:
- [ ] grep de features de email retornou zero resultados
- [ ] grep de email cadastral retornou resultados (campo foi mantido)
- [ ] `npm run typecheck` — zero erros
- [ ] `npm run lint` — zero erros/warnings
- [ ] `npm run build` — compilou com sucesso
- [ ] Arquivos alterados revisados manualmente

### Se todos marcados, emita:

✅ BLOCO APROVADO — pronto para push
Validações executadas:
- [x] npm run lint     → sem erros
- [x] npm run typecheck → sem erros de tipo
- [x] npm run build    → compilou com sucesso
- [x] Arquivos alterados revisados manualmente

Arquivos modificados neste bloco:
- [listar os arquivos que o @dev relatou]

Branch: main | Commit: <hash>
→ @devops autorizado a fazer push para new-origin

Se qualquer item estiver com [ ], NÃO emita a aprovação. Reporte ao @dev.
```

---

### PASSO 3 — Após o @qa aprovar, cole este prompt para o @devops

```
@devops

## Push — TASK-01 — Remover Gestão de Emails
**Story:** STORY-CTO-AJUSTES-001

O @qa emitiu aprovação. Você tem autoridade para fazer o push.

1. Confirme o commit local: `git log --oneline -5`
2. Faça o push:
```bash
git push new-origin main
```
3. Confirme o push e reporte o commit hash.
```

---
---

## TASK-03 — Corrigir Inconsistência da Sidebar Principal

> Iniciar somente após TASK-01 estar concluída e com push feito.

### PASSO 1 — Cole este prompt para o @dev

```
@dev

## TASK-03 — Corrigir Inconsistência da Sidebar Principal
**Story:** STORY-CTO-AJUSTES-001

A CTO reportou que a sidebar fica "recolhendo e expandindo meio bugado". O problema é que ao clicar em qualquer item de navegação, a sidebar colapsa automaticamente, sem o usuário ter pedido isso.

### Arquivo a editar: `components/sidebar.tsx`

**Causa raiz — função `handleNavClick`:**
```typescript
// ATUAL (bugado) — força colapso sem o usuário pedir
const handleNavClick = (key: NavItemKey, href: string) => {
  if (routesWithSubSidebar.includes(key) && !isCollapsed) {
    setCollapsed(true)
  }
  router.push(href)
}
```

**Correção — remover a lógica de auto-colapso:**
```typescript
// CORRETO — sidebar mantém o estado que o usuário definiu
const handleNavClick = (href: string) => {
  router.push(href)
}
```

**Limpeza obrigatória de variáveis órfãs:**

1. Remover a declaração do array `routesWithSubSidebar` (ficará sem uso):
   ```typescript
   // REMOVER esta linha:
   const routesWithSubSidebar: NavItemKey[] = ['contatos', 'cobrancas', 'integracoes', 'conversas', 'agendamentos']
   ```

2. Verificar se `setCollapsed` ainda é usado em algum outro lugar do componente `Sidebar`. Se não for, remover da desestruturação:
   ```typescript
   // Se setCollapsed não for mais usado, trocar:
   const { isCollapsed, toggle, setCollapsed } = useMainSidebar()
   // por:
   const { isCollapsed, toggle } = useMainSidebar()
   ```

3. Atualizar as chamadas de `onClick` nos botões de navegação, já que a assinatura da função mudou (não recebe mais `key`):
   ```typescript
   // Trocar:
   onClick={() => handleNavClick(item.key, item.href)}
   // Por:
   onClick={() => handleNavClick(item.href)}
   ```

### NÃO mudar:
- O botão de toggle (`onClick={toggle}`) — continua funcionando normalmente
- A persistência no localStorage via `useMainSidebar`
- Qualquer outra lógica do arquivo

### Ao finalizar:
Relate exatamente quais linhas foram alteradas. NÃO rode validações — isso é responsabilidade do @qa.
```

---

### PASSO 2 — Após o @dev finalizar, cole este prompt para o @qa

```
@qa

## Validação — TASK-03 — Correção da Sidebar
**Story:** STORY-CTO-AJUSTES-001 — TASK FINAL

O @dev fez uma alteração cirúrgica em `components/sidebar.tsx`. Valide antes do push final desta story.

### Execute nesta ordem:

**1. Confirmar que a lógica de auto-colapso foi removida:**
```bash
grep -n "routesWithSubSidebar\|setCollapsed" components/sidebar.tsx
```
Deve retornar zero resultados.

**2. Confirmar que handleNavClick foi simplificado:**
```bash
grep -A5 "handleNavClick" components/sidebar.tsx
```
A função não deve conter nenhuma chamada a `setCollapsed`.

**3. Typecheck:**
```bash
npm run typecheck
```

**4. Lint:**
```bash
npm run lint
```

**5. Build:**
```bash
npm run build
```

### Critérios de aprovação:
- [ ] `routesWithSubSidebar` não existe mais no arquivo
- [ ] `handleNavClick` não contém lógica de colapso automático
- [ ] Sem variáveis declaradas e não utilizadas
- [ ] `npm run typecheck` — zero erros
- [ ] `npm run lint` — zero erros/warnings
- [ ] `npm run build` — compilou com sucesso
- [ ] Arquivos alterados revisados manualmente

### Se todos marcados, emita:

✅ BLOCO APROVADO — pronto para push
Validações executadas:
- [x] npm run lint     → sem erros
- [x] npm run typecheck → sem erros de tipo
- [x] npm run build    → compilou com sucesso
- [x] Arquivos alterados revisados manualmente

Arquivos modificados neste bloco:
- components/sidebar.tsx

Branch: main | Commit: <hash>
→ @devops autorizado a fazer push para new-origin

Se qualquer item estiver com [ ], NÃO emita a aprovação. Reporte ao @dev.
```

---

### PASSO 3 — Após o @qa aprovar, cole este prompt para o @devops

```
@devops

## Push Final — TASK-03 — Correção da Sidebar
**Story:** STORY-CTO-AJUSTES-001 — CONCLUÍDA

O @qa emitiu aprovação para o bloco final. Você tem autoridade para fazer o push.

1. Confirme o commit local: `git log --oneline -5`
2. Faça o push:
```bash
git push new-origin main
```
3. Confirme o push, reporte o commit hash e declare a STORY-CTO-AJUSTES-001 como concluída.
```
