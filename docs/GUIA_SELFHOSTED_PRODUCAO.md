# Guia: Configurar CRM no Supabase Self-Hosted (Produção)

## 📋 Resumo

Este guia configura o banco de dados **do ZERO** no Supabase Self-Hosted para uso em produção.

**Servidor:** 49.13.228.89:6543  
**Ambiente:** Produção (limpo)  
**Status:** Pronto para executar

---

## 🗂️ Arquivos Criados

| Arquivo | Descrição | Tamanho |
|---------|-----------|---------|
| `migrations/selfhosted_create_schema.sql` | Schema completo (33 tabelas) | 1,441 linhas |
| `migrations/selfhosted_seeds.sql` | Dados iniciais (planos, cupons) | 404 linhas |
| `.env.local` | Atualizado com credenciais self-hosted | - |

---

## 🚀 Passo a Passo para Produção

### PASSO 1: Criar Schema no Banco (EXECUTAR AGORA)

Execute no terminal (com PowerShell ou CMD):

```powershell
# Definir senha
$env:PGPASSWORD = "your-super-secret-and-long-postgres-password"

# Criar schema completo
psql -h 49.13.228.89 -p 6543 -U postgres -d postgres -f migrations/selfhosted_create_schema.sql
```

**Esperado:** Mensagens de sucesso para cada tabela criada.

---

### PASSO 2: Inserir Dados Iniciais

```powershell
# Mesma senha
$env:PGPASSWORD = "your-super-secret-and-long-postgres-password"

# Inserir seeds
psql -h 49.13.228.89 -p 6543 -U postgres -d postgres -f migrations/selfhosted_seeds.sql
```

**Esperado:** 
- 3 planos criados (Básico, Pro, Enterprise)
- 2 cupons criados (BEMVINDO20, PRO50OFF)
- 2 templates de pipeline
- 10 tipos de integrações

---

### PASSO 3: Verificar Instalação

Execute no SQL Editor do seu Supabase Self-Hosted:

```sql
-- Verificar tabelas criadas
SELECT COUNT(*) as total_tabelas 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar planos
SELECT name, price_cents/100.0 as preco FROM plans;

-- Verificar cupons
SELECT code, discount_percent FROM coupons;
```

**Esperado:**
- total_tabelas: ~33
- Planos: Básico, Pro, Enterprise
- Cupons: BEMVINDO20, PRO50OFF

---

### PASSO 4: Testar Aplicação Local

```bash
# No diretório do projeto
pnpm install
npx prisma generate
pnpm dev
```

**Acesse:** http://localhost:3000

**Testar:**
1. Login (criar conta nova)
2. Criar organização
3. Verificar se dashboard carrega
4. Criar um contato de teste
5. Verificar se aparece na lista

---

## ⚙️ Configurações do .env.local (Já Atualizado)

O arquivo `.env.local` já foi atualizado automaticamente:

```env
# Banco de dados (Self-Hosted)
DATABASE_URL=postgresql://postgres.postgres:your-super-secret-and-long-postgres-password@49.13.228.89:6543/postgres

# Supabase (Self-Hosted)
NEXT_PUBLIC_SUPABASE_URL=http://49.13.228.89:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzczMjg0NDAwLCJleHAiOjE5MzEwNTA4MDB9.6uz_uXAQx-pGCSaAHM3hUeH1hWrLPC27_5nJL6R8TCY

# Outras configs mantidas (auth, webhooks, etc)
```

---

## 🔧 Solução de Problemas

### Erro: "Can't reach database server"
**Causa:** Senha incorreta ou porta fechada  
**Solução:** Verificar senha e firewall da VPS

### Erro: "relation already exists"
**Causa:** Schema já foi criado parcialmente  
**Solução:** Dropar banco e recriar, ou usar `IF NOT EXISTS`

### Erro: "permission denied"
**Causa:** Usuário sem permissão  
**Solução:** Usar usuário postgres ou verificar grants

---

## ✅ Checklist de Validação

Após executar todos os passos:

- [ ] Schema criado (33 tabelas)
- [ ] Seeds inseridos (planos, cupons)
- [ ] `pnpm dev` inicia sem erros
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar contato funciona
- [ ] Pipeline funciona
- [ ] Integrações aparecem
- [ ] Planos listam corretamente

---

## 🎯 Próximos Passos (Depois de Validado)

1. **Deploy em produção** (Netlify/Render)
2. **Configurar SSL** no Supabase Self-Hosted
3. **Backups automáticos** configurados
4. **Monitoramento** com logs

---

## 📞 Suporte

Se encontrar erros durante a execução:
1. Verificar mensagem de erro específica
2. Confirmar senha está correta
3. Verificar se VPS está acessível (ping 49.13.228.89)
4. Verificar se porta 6543 está aberta no firewall

**Status:** Pronto para executar! 🚀
