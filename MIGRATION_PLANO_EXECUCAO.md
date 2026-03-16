# 🚀 PLANO DE EXECUÇÃO - Migração CRM NexIA

## Resumo
Este documento contém o passo a passo completo para executar a migração do banco de dados e configurar a integração com o Plano de Ação.

---

## ✅ CHECKLIST PRÉ-REQUISITOS

- [ ] Acesso ao EasyPanel (http://49.13.228.89:3000)
- [ ] Acesso ao terminal do servidor (SSH)
- [ ] Código do CRM NexIA na pasta local
- [ ] Supabase rodando no EasyPanel (já está ✓)

---

## 📋 FASE 1: EXPOR PORTA DO POSTGRESQL (EasyPanel)

### Passo 1.1 - Editar docker-compose.yml
1. Acesse o EasyPanel: http://49.13.228.89:3000/projects/nexia-chat/compose/supabase
2. No menu lateral esquerdo, clique em **"Fonte"**
3. Localize o serviço `db:` no docker-compose.yml
4. Adicione a porta conforme exemplo abaixo:

```yaml
services:
  db:
    image: supabase/postgres:latest
    ports:
      - "5432:5432"  # ← ADICIONAR ESTA LINHA
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    # ... resto da configuração
```

### Passo 1.2 - Implantar alterações
1. Clique no botão **"Implantar"** (verde)
2. Aguarde o serviço reiniciar (2-3 minutos)
3. Verifique se o container `db` está rodando:
   - Vá em **"Visão Geral"** → Container `db` → deve estar verde

---

## 📋 FASE 2: CONFIGURAR AMBIENTE LOCAL

### Passo 2.1 - Verificar arquivo .env.local
O arquivo já foi criado com as configurações:

```bash
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@49.13.228.89:5432/postgres
```

### Passo 2.2 - Testar conexão
No terminal local, execute:

```bash
cd C:\Users\gmora\Downloads\b_T5RdTRTLxF8-1772119549385

# Testar conexão com o banco
npx prisma db pull
```

Se der erro de conexão, verifique:
- [ ] Porta 5432 está exposta no EasyPanel
- [ ] IP do servidor está correto (49.13.228.89)
- [ ] Senha está correta

---

## 📋 FASE 3: EXECUTAR MIGRAÇÃO

### Passo 3.1 - Aplicar migration
```bash
npx prisma migrate deploy
```

**Saída esperada:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "49.13.228.89:5432"

1 migration found in prisma/migrations

The following migration(s) have been applied:

migrations/
  └─ 20250310180000_add_pending_form_delivery/
    └─ migration.sql
    
✅ All migrations have been successfully applied.
```

### Passo 3.2 - Gerar Prisma Client
```bash
npx prisma generate
```

### Passo 3.3 - Verificar tabela criada
```bash
npx prisma studio
```
Abre o Prisma Studio - confira se a tabela `pending_form_deliveries` aparece.

---

## 📋 FASE 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

### Passo 4.1 - Configurar webhook secret
Edite o arquivo `.env.local` e defina um secret seguro:

```bash
# Alterar esta linha:
FORM_WEBHOOK_SECRET=whsec_sua_chave_secreta_aqui

# Para algo seguro (exemplo):
FORM_WEBHOOK_SECRET=whsec_crm_nexia_2024_plano_acao_integration
```

### Passo 4.2 - Configurar webhook no plano-de-acao (sistema remoto)
No sistema plano-de-acao-lancamento, configure:

```bash
CRM_API_URL=https://49.13.228.89:3000  # ou seu domínio
CRM_SECRET=whsec_crm_nexia_2024_plano_acao_integration  # mesmo valor acima
```

---

## 📋 FASE 5: TESTAR INTEGRAÇÃO

### Passo 5.1 - Testar endpoint de webhook
```bash
# Teste local com curl
curl -X POST http://localhost:3000/api/webhooks/form-submission \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "whsec_crm_nexia_2024_plano_acao_integration",
    "organizationId": "test-org-id",
    "instanceId": "test-instance-id",
    "templateName": "hello_world",
    "templateVariables": ["João"],
    "leadData": {
      "nome": "João Teste",
      "email": "joao@teste.com",
      "telefone": "5511999999999"
    },
    "pdfUrl": "https://exemplo.com/test.pdf",
    "pdfFilename": "teste.pdf",
    "dossieId": "test-dossie-123",
    "alunoId": "test-aluno-123",
    "source": "typebot",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }'
```

### Passo 5.2 - Verificar dashboard
Acesse no navegador:
```
http://49.13.228.89:3000/meta-api/whatsapp/form-submissions
```

Deve aparecer o dashboard de "Envio de Formulários"

---

## 📋 FASE 6: DEPLOY NA VPS (Opcional)

Se quiser rodar o CRM na mesma VPS:

### Passo 6.1 - Build do projeto
```bash
npm run build
```

### Passo 6.2 - Configurar no EasyPanel
1. Crie um novo serviço "Next.js" no EasyPanel
2. Faça upload do código ou use Git
3. Configure as mesmas variáveis de ambiente do `.env.local`
4. Defina o comando de start: `npm start`

---

## 🔧 TROUBLESHOOTING

### Erro: "connection refused" na porta 5432
**Causa:** Porta não exposta no Docker Compose
**Solução:**
1. Verifique se adicionou `ports: - "5432:5432"` no serviço `db`
2. Verifique se clicou em "Implantar"
3. Verifique firewall: `sudo ufw allow 5432/tcp`

### Erro: "password authentication failed"
**Causa:** Senha incorreta
**Solução:**
1. Verifique a senha nas variáveis de ambiente do EasyPanel
2. Confirme que está usando: `your-super-secret-and-long-postgres-password`

### Erro: "Tenant or user not found"
**Causa:** Tentando conectar na porta 8000 (Kong) em vez de 5432 (PostgreSQL)
**Solução:** Use `DATABASE_URL` com porta 5432, não 8000

### Erro: "migration already applied"
**Causa:** Migration já foi aplicada anteriormente
**Solução:**
```bash
npx prisma migrate resolve --applied 20250310180000_add_pending_form_delivery
```

---

## ✅ CHECKLIST FINAL

- [ ] Porta 5432 exposta no EasyPanel
- [ ] Migration aplicada com sucesso
- [ ] Tabela `pending_form_deliveries` aparece no Prisma Studio
- [ ] Webhook secret configurado
- [ ] Dashboard acessível em `/meta-api/whatsapp/form-submissions`
- [ ] Teste de webhook funcionando

---

## 📞 PRÓXIMOS PASSOS

1. Configurar domínio para o CRM (ex: crm.nexiachat.com.br)
2. Configurar SSL/HTTPS
3. Configurar webhook da Meta para receber "delivered"
4. Testar fluxo completo: Typebot → Plano de Ação → CRM → WhatsApp

---

**Data de criação:** 2024-03-10
**Versão:** 1.0
