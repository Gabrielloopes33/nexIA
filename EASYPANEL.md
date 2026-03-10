# 🚀 Deploy no EasyPanel

Guia completo para deploy do NexIA no EasyPanel via GitHub.

---

## 📋 Pré-requisitos

1. VPS com EasyPanel instalado
2. Repositório no GitHub (já temos!)
3. Domínio configurado (nexiachat.com.br)

---

## 🔧 Passo a Passo

### 1. Acessar o EasyPanel

```
http://IP_DA_VPS:3000
```

### 2. Criar Nova Aplicação

1. Clique em **"Create Service"** → **"App"**
2. Escolha **"Git Repository"**

#### Configuração do Git:

| Campo | Valor |
|-------|-------|
| **Provider** | GitHub |
| **Repository** | Gabrielloopes33/nexIA |
| **Branch** | main |
| **Auto Deploy** | ✅ Habilitado |

### 3. Configurar Build

| Campo | Valor |
|-------|-------|
| **Build Path** | `./` (raiz) |
| **Dockerfile** | `Dockerfile.easypanel` |
| **Port** | `3000` |

### 4. Criar Banco de Dados (Antes do deploy!)

1. No menu lateral, clique em **"Databases"**
2. **"Create Database"** → **"PostgreSQL"**
3. Configuração:
   - **Name**: `nexia-db`
   - **Version**: `15`
   - **Username**: `nexia`
   - **Password**: (gerar senha forte)
   - **Database**: `nexia`

4. **Importante**: Anote a connection string que aparecer!
   ```
   postgresql://nexia:SENHA@nexia-db:5432/nexia
   ```

### 5. Configurar Variáveis de Ambiente

Na aba **"Environment"** da sua aplicação, adicione:

#### Obrigatórias:

```env
NODE_ENV=production
DATABASE_URL=postgresql://nexia:SENHA@nexia-db:5432/nexia  # Use a do passo 4
AUTH_SECRET=sua_chave_aqui_32_caracteres_minimo
NEXT_PUBLIC_SUPABASE_URL=https://wqbppfngjolnxbwqngfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 💡 **Gerar AUTH_SECRET**:
> ```bash
> openssl rand -hex 32
> ```

#### Opcionais (funcionalidades extras):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
META_APP_ID=4294607007478015
META_APP_SECRET=seu_secret
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
OPENAI_API_KEY=sk-...
```

### 6. Configurar Domínio

Na aba **"Domains"**:

1. **"Add Domain"**
2. Digite: `nexiachat.com.br`
3. Habilite **"HTTPS"** (Certbot automático)

### 7. Deploy!

Clique em **"Deploy"** ou espote o auto-deploy do GitHub.

---

## 🔄 Fluxo de Atualização

### Método 1: Auto-Deploy (Recomendado)

1. Faça push para a branch `main`
2. EasyPanel detecta automaticamente
3. Rebuild e deploy acontecem sozinhos!

### Método 2: Manual

1. No EasyPanel → sua aplicação
2. Aba **"Deployments"**
3. Clique **"Redeploy"**

---

## 📊 Monitoramento

### Health Check

A aplicação expõe `/api/health` que o EasyPanel usa:

```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Logs

Aba **"Logs"** no EasyPanel mostra:
- Logs da aplicação
- Logs do build
- Erros em tempo real

---

## 🗄️ Migração de Dados

### Exportar do Supabase Atual

```bash
# Dump do schema + dados
pg_dump "URL_DO_SUPABASE_ATUAL" > backup.sql
```

### Importar para EasyPanel

**Opção 1: Via terminal**
```bash
# No EasyPanel, abra o terminal do container PostgreSQL
psql "postgresql://nexia:SENHA@localhost:5432/nexia" < backup.sql
```

**Opção 2: Via interface**
1. EasyPanel → Databases → nexia-db
2. Aba **"Import"**
3. Faça upload do arquivo `.sql`

---

## 🐛 Troubleshooting

### Erro: "Database connection failed"

**Causa**: `DATABASE_URL` incorreta

**Solução**:
1. Verifique se o banco está rodando: EasyPanel → Databases
2. Copie a connection string exata do EasyPanel
3. Verifique se a senha está correta

### Erro: "Prisma Client not found"

**Causa**: Build não gerou o client

**Solução**:
1. Faça redeploy
2. Verifique logs de build

### Erro: "Migrations failed"

**Causa**: Tabelas já existem ou schema diferente

**Solução**:
```bash
# No terminal do container:
npx prisma db push --accept-data-loss
```

### Erro: "Port already in use"

**Causa**: Outro serviço usando porta 3000

**Solução**:
1. Mude a porta no EasyPanel para 3001, 3002, etc.
2. Ou pare o outro serviço

---

## 🌐 Configurar Subdomínios

### Produção (VPS)
- `nexiachat.com.br` → EasyPanel (main branch)

### Staging (Netlify)
- `dev.nexiachat.com.br` → Netlify (para testes)

No DNS do seu domínio:
```
Tipo    Nome              Valor
A       @                 IP_DA_VPS
A       www               IP_DA_VPS
CNAME   dev               sites.netlify.com
```

---

## 💾 Backup Automático

No EasyPanel:
1. Vá em **Databases** → **nexia-db**
2. Aba **"Backups"**
3. Configure **"Automatic Backups"**
   - Frequency: Daily
   - Retention: 7 days

---

## 📱 Comandos Úteis

### Terminal no Container

EasyPanel → sua app → **"Terminal"**

```bash
# Verificar saúde
curl http://localhost:3000/api/health

# Rodar migrações manualmente
npx prisma migrate deploy

# Ver tabelas
npx prisma studio

# Reset do banco (CUIDADO!)
npx prisma migrate reset
```

---

## ✅ Checklist Pré-Deploy

- [ ] EasyPanel instalado na VPS
- [ ] Banco PostgreSQL criado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio apontando para VPS
- [ ] Código pushado no GitHub (branch main)
- [ ] AUTH_SECRET gerada
- [ ] Chaves do Supabase copiadas

---

## 🚀 Pronto!

Com essa configuração, todo push na branch `main` será automaticamente deployado no EasyPanel! 🎉
