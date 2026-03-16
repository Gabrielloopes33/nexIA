# Plano de Migração: Supabase Cloud → Self-Hosted

## 📋 Resumo Executivo

Migrar todo o banco de dados e funcionalidades do Supabase Cloud (atual) para o Supabase Self-Hosted já configurado na VPS (49.13.228.89).

**Origem:** Supabase Cloud (https://wqbppfngjolnxbwqngfo.supabase.co)  
**Destino:** Supabase Self-Hosted (EasyPanel na VPS 49.13.228.89)  
**Status:** Supabase self-hosted já está rodando e acessível

---

## 🎯 Objetivos

1. ✅ Migrar TODOS os dados do Supabase Cloud para Self-Hosted
2. ✅ Atualizar credenciais no projeto (.env.local)
3. ✅ Garantir que todas as APIs funcionem com o novo banco
4. ✅ Verificar autenticação (Supabase Auth)
5. ✅ Testar aplicação completa no ambiente local
6. ✅ Preparar para deploy em produção

---

## 📊 Escopo da Migração

### Banco de Dados
- Todas as tabelas (30+)
- Todos os dados (contacts, deals, conversations, integrations, etc.)
- Sequences e constraints
- Indexes
- Functions e triggers
- Views (v_dashboard_summary)

### Configurações do Supabase
- Auth (usuários, policies)
- Storage (buckets, arquivos)
- Realtime (subscriptions)
- Edge Functions (se houver)

### Projeto Next.js
- DATABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SERVICE_ROLE_KEY (se usado)

---

## 👥 Time de Agents

### @architect - Arquitetura e Schema
- Analisar schema completo do Supabase Cloud
- Validar compatibilidade com Self-Hosted
- Definir estratégia de backup/restore
- Mapear dependências entre tabelas

### @dev - Implementação
- Executar backup do banco Cloud
- Executar restore no Self-Hosted
- Atualizar credenciais no .env.local
- Verificar e ajustar APIs
- Testar funcionalidades

### @qa - Validação
- Verificar integridade dos dados
- Testar todas as funcionalidades CRUD
- Validar autenticação
- Testar integrações (WhatsApp, etc.)
- Validar dashboard e métricas

---

## 🗓️ Fases da Migração

### FASE 1 - Análise e Preparação (@architect)
**Duração:** 30 minutos

**Tarefas:**
- [ ] Listar todas as tabelas do banco Cloud
- [ ] Identificar tamanho total do banco
- [ ] Verificar versões do PostgreSQL (Cloud vs Self-Hosted)
- [ ] Identificar extensions necessárias
- [ ] Verificar se há dados críticos em storage
- [ ] Criar script de backup completo

**Entregável:** Relatório de análise e script de backup

---

### FASE 2 - Backup dos Dados (@dev)
**Duração:** 1 hora

**Tarefas:**
- [ ] Fazer dump do schema (DDL)
- [ ] Fazer dump dos dados (DML)
- [ ] Backup do Auth (usuários)
- [ ] Backup do Storage (se necessário)
- [ ] Verificar integridade dos backups

**Comandos sugeridos:**
```bash
# Schema apenas
pg_dump --schema-only --no-owner --no-privileges > schema.sql

# Dados apenas
pg_dump --data-only --no-owner --no-privileges > data.sql

# Completo
pg_dump --no-owner --no-privileges > full_backup.sql
```

**Entregável:** Arquivos de backup (.sql)

---

### FASE 3 - Restore no Self-Hosted (@dev)
**Duração:** 1 hora

**Tarefas:**
- [ ] Criar banco novo no Self-Hosted (ou usar existente)
- [ ] Executar schema.sql
- [ ] Executar data.sql
- [ ] Verificar tabelas criadas
- [ ] Verificar constraints e indexes
- [ ] Atualizar sequences

**Comandos:**
```bash
# Restore schema
psql -h 49.13.228.89 -p 6543 -U postgres -d postgres < schema.sql

# Restore data
psql -h 49.13.228.89 -p 6543 -U postgres -d postgres < data.sql
```

**Entregável:** Banco configurado no Self-Hosted

---

### FASE 4 - Configuração do Projeto (@dev)
**Duração:** 30 minutos

**Tarefas:**
- [ ] Obter credenciais do Supabase Self-Hosted
- [ ] Atualizar .env.local com novas credenciais
- [ ] Atualizar DATABASE_URL
- [ ] Atualizar NEXT_PUBLIC_SUPABASE_URL
- [ ] Atualizar NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Rodar prisma generate
- [ ] Testar conexão

**Credenciais necessárias do Self-Hosted:**
```env
# PostgreSQL (Pooler)
DATABASE_URL=postgresql://postgres.{TENANT_ID}:{PASSWORD}@49.13.228.89:6543/postgres

# Supabase API
NEXT_PUBLIC_SUPABASE_URL=http://49.13.228.89:8000 (ou porta do seu supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY={ANON_KEY_DO_SELF_HOSTED}
```

**Entregável:** .env.local atualizado e testado

---

### FASE 5 - Testes e Validação (@qa)
**Duração:** 1-2 horas

**Tarefas:**
- [ ] Rodar `pnpm dev` e verificar se inicia sem erros
- [ ] Testar login/autenticação
- [ ] Testar CRUD de contatos
- [ ] Testar CRUD de deals
- [ ] Testar conversas
- [ ] Testar integrações
- [ ] Testar dashboard
- [ ] Verificar se todos os dados estão presentes
- [ ] Rodar testes automatizados

**Checklist de Validação:**
```
✅ Aplicação inicia sem erros de banco
✅ Login funciona
✅ Contatos aparecem corretamente
✅ Pipeline mostra deals
✅ Conversas carregam
✅ Integrações funcionam
✅ Dashboard mostra métricas
✅ Sem erros no console
✅ Testes passam
```

**Entregável:** Relatório de testes aprovado

---

### FASE 6 - Ajustes Finais (@dev + @qa)
**Duração:** 30 minutos

**Tarefas:**
- [ ] Corrigir eventuais erros encontrados
- [ ] Verificar RLS policies
- [ ] Verificar Storage (se usado)
- [ ] Documentar alterações
- [ ] Criar backup final do self-hosted

---

## 🔧 Passo a Passo Detalhado

### 1. Preparar Ambiente

```bash
# No terminal do projeto
# Verificar conectividade com self-hosted
psql "postgresql://postgres.{CREDENCIAIS}@49.13.228.89:6543/postgres" -c "SELECT version();"
```

### 2. Backup do Supabase Cloud

```bash
# Exportar URL do banco Cloud (temporariamente)
export PGPASSWORD="senha-do-cloud"

# Backup completo
pg_dump -h db.wqbppfngjolnxbwqngfo.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > supabase_cloud_backup.sql
```

### 3. Restore no Self-Hosted

```bash
# Importar para self-hosted
export PGPASSWORD="senha-do-self-hosted"

psql -h 49.13.228.89 \
  -p 6543 \
  -U postgres \
  -d postgres \
  < supabase_cloud_backup.sql
```

### 4. Atualizar Projeto

Editar `.env.local`:
```env
# Banco (Self-Hosted)
DATABASE_URL=postgresql://postgres.{TENANT}:{SENHA}@49.13.228.89:6543/postgres

# Supabase (Self-Hosted)
NEXT_PUBLIC_SUPABASE_URL=http://49.13.228.89:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY={chave-anon-do-self-hosted}
```

### 5. Testar

```bash
# Regenerar Prisma
npx prisma generate

# Iniciar aplicação
pnpm dev
```

---

## ⚠️ Riscos e Mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dados não migram corretamente | Alto | Backup completo antes; testar restore em staging |
| Versões PostgreSQL diferentes | Médio | Verificar compatibilidade antes |
| Extensions não disponíveis | Médio | Listar extensions necessárias; instalar no self-hosted |
| Auth não funciona | Alto | Migrar auth.users; testar login imediatamente |
| Storage não migrado | Médio | Identificar uso; migrar buckets e arquivos |
| Performance diferente | Baixo | Monitorar; ajustar indexes se necessário |

---

## ✅ Critérios de Sucesso

- [ ] Todos os dados migrados sem perda
- [ ] Aplicação funciona 100% com novo banco
- [ ] Autenticação funciona
- [ ] Todas as páginas carregam dados
- [ ] CRUD funcional em todas as entidades
- [ ] Testes automatizados passam
- [ ] Dashboard mostra métricas corretas

---

## 📦 Entregáveis Finais

1. **Banco migrado** no Supabase Self-Hosted
2. **Código atualizado** com novas credenciais
3. **Documentação** do processo
4. **Backup** do estado final
5. **Aplicação funcionando** localmente

---

## 🚀 Próximos Passos (Após Migração)

1. Deploy para produção (Netlify/Render)
2. Configurar SSL no Supabase Self-Hosted
3. Configurar backups automáticos no self-hosted
4. Monitoramento

---

**Status:** Aguardando início da Fase 1
**Responsável:** @architect, @dev, @qa
