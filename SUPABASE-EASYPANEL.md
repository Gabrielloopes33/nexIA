# 🚀 Deploy NexIA + Supabase Self-Hosted no EasyPanel

Guia completo para deploy do sistema NexIA com **Supabase Self-Hosted** no EasyPanel.

---

## 📋 Visão Geral

Este setup inclui:
- ✅ **Aplicação NexIA** (Next.js)
- ✅ **Supabase completo**:
  - PostgreSQL 15 com extensões
  - Autenticação (GoTrue)
  - API REST automática (PostgREST)
  - Storage de arquivos
  - Realtime (WebSockets)
  - Edge Functions
  - Interface Web (Studio)
  - Analytics/Logs

---

## 🎯 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      VPS + EasyPanel                     │
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   NexIA     │    │   Kong      │    │   Studio    │  │
│  │   App       │◄──►│  Gateway    │◄──►│  (UI Web)   │  │
│  │   :3000     │    │   :8000     │    │   :3001     │  │
│  └─────────────┘    └──────┬──────┘    └─────────────┘  │
│                            │                             │
│  ┌─────────────┐    ┌──────┴──────┐    ┌─────────────┐  │
│  │   Auth      │    │  PostgreSQL │    │   Storage   │  │
│  │  (GoTrue)   │◄──►│  (Supabase) │◄──►│   + S3      │  │
│  │   :9999     │    │   :5432     │    │   :5000     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   REST      │    │  Realtime   │    │  Functions  │  │
│  │ (PostgREST) │    │(WebSockets) │    │  (Deno)     │  │
│  │   :3000     │    │   :4000     │    │   :9000     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Pré-requisitos

### Hardware Recomendado
| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disco | 20 GB SSD | 50+ GB SSD |
| Rede | 100 Mbps | 1 Gbps |

### Software
- EasyPanel instalado na VPS
- Docker e Docker Compose
- Git

---

## 🔧 Passo a Passo

### 1. Preparar o Repositório

```bash
# Clone o repositório (ou use seu fork)
git clone https://github.com/seu-usuario/nexIA.git
cd nexIA

# Certifique-se que está na branch correta
git checkout main
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.supabase.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

**⚠️ Configure obrigatoriamente:**

```env
# PostgreSQL (senha forte!)
POSTGRES_PASSWORD=sua_senha_segura_aqui_32_caracteres

# JWT Secret (mínimo 32 caracteres)
JWT_SECRET=sua_chave_jwt_segura_aqui_32_caracteres

# Supabase Keys (serão geradas automaticamente)
ANON_KEY=sera_gerado_automaticamente
SERVICE_ROLE_KEY=sera_gerado_automaticamente

# Domínios
SITE_URL=https://nexiachat.com.br
API_EXTERNAL_URL=https://api.nexiachat.com.br
SUPABASE_PUBLIC_URL=https://api.nexiachat.com.br

# Auth Secret (Next.js)
AUTH_SECRET=gerar_com_openssl_rand_hex_32

# Meta/Facebook OAuth (opcional)
EXTERNAL_FACEBOOK_CLIENT_ID=seu_app_id
EXTERNAL_FACEBOOK_SECRET=seu_app_secret
EXTERNAL_FACEBOOK_REDIRECT_URI=https://api.nexiachat.com.br/auth/v1/callback

# SMTP (para emails)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sua_chave_sendgrid
```

### 3. Gerar Secrets (Opcional - pode usar o script)

```bash
# JWT Secret
openssl rand -hex 32

# Auth Secret
openssl rand -hex 32

# Secret Key Base (Realtime)
openssl rand -base64 48
```

### 4. Upload para o Servidor

**Opção A: Via Git (Recomendado)**

```bash
# No seu computador
git add .
git commit -m "Configuração Supabase self-hosted"
git push origin main

# No servidor (via SSH)
git clone https://github.com/seu-usuario/nexIA.git
cd nexIA
```

**Opção B: Via SCP/RSYNC**

```bash
# Compactar projeto
tar -czvf nexia-deploy.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .

# Enviar para servidor
scp nexia-deploy.tar.gz usuario@IP_DA_VPS:/opt/

# No servidor
ssh usuario@IP_DA_VPS
cd /opt
tar -xzvf nexia-deploy.tar.gz
```

### 5. Configurar no EasyPanel

#### 5.1 Criar Projeto

1. Acesse: `http://IP_DA_VPS:3000`
2. Clique em **"Create Service"** → **"Docker Compose"**
3. Nome: `nexia-stack`

#### 5.2 Configurar Docker Compose

Cole o conteúdo do arquivo `docker-compose.fullstack.yml` no editor do EasyPanel.

Ou use o método **Git Repository**:

| Campo | Valor |
|-------|-------|
| **Provider** | GitHub |
| **Repository** | seu-usuario/nexIA |
| **Branch** | main |
| **Docker Compose File** | docker-compose.fullstack.yml |

#### 5.3 Configurar Variáveis de Ambiente

No EasyPanel, abra a aba **"Environment"** e adicione todas as variáveis do arquivo `.env`.

**Variáveis Obrigatórias:**
```env
POSTGRES_PASSWORD=
JWT_SECRET=
ANON_KEY=
SERVICE_ROLE_KEY=
AUTH_SECRET=
SITE_URL=
API_EXTERNAL_URL=
SUPABASE_PUBLIC_URL=
```

#### 5.4 Configurar Domínios

Na aba **"Domains"**, adicione:

| Serviço | Domínio | Porta |
|---------|---------|-------|
| Aplicação | `nexiachat.com.br` | 3000 |
| Supabase API | `api.nexiachat.com.br` | 8000 |
| Supabase Studio | `studio.nexiachat.com.br` | 3001 |

> 💡 **Dica**: Configure os subdomínios no DNS da sua VPS apontando para o IP.

### 6. Deploy

Clique em **"Deploy"** no EasyPanel e aguarde!

O build pode levar **5-10 minutos** na primeira vez.

---

## 🌐 Configuração de DNS

No painel DNS do seu domínio:

```
Tipo    Nome              Valor                    TTL
A       @                 IP_DA_VPS                300
A       www               IP_DA_VPS                300
A       api               IP_DA_VPS                300
A       studio            IP_DA_VPS                300
```

---

## 🔒 Configuração do Meta/Facebook OAuth

No [Facebook Developers](https://developers.facebook.com/):

1. Vá em **Settings** → **Basic**
2. Em **App Domains**, adicione:
   - `nexiachat.com.br`
   - `api.nexiachat.com.br`
3. Em **Valid OAuth Redirect URIs**, adicione:
   ```
   https://api.nexiachat.com.br/auth/v1/callback
   ```

---

## ✅ Verificação do Deploy

### Testar Endpoints

```bash
# Health Check da Aplicação
curl https://nexiachat.com.br/api/health

# Health Check do Supabase
curl https://api.nexiachat.com.br/health

# Testar Auth
curl https://api.nexiachat.com.br/auth/v1/settings

# Testar REST API
curl https://api.nexiachat.com.br/rest/v1/
```

### Acessos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| NexIA App | https://nexiachat.com.br | - |
| Supabase Studio | https://studio.nexiachat.com.br | DASHBOARD_USERNAME/PASSWORD do .env |
| Kong Admin | https://api.nexiachat.com.br | DASHBOARD_USERNAME/PASSWORD do .env |

---

## 🔄 Migração do Supabase Cloud

### 1. Exportar Dados do Supabase Cloud

```bash
# Dump do schema
gpg --symmetric --cipher-algo AES256 \
  --batch --passphrase "$SUPABASE_DB_PASSWORD" \
  --output supabase_schema.sql \
  <(pg_dump \
    --clean \
    --if-exists \
    --quote-all-identifier \
    --schema-only \
    --no-privileges \
    --no-owner \
    --exclude-schema '"supabase_functions"' \
    --exclude-schema '"storage"' \
    --db-url "$OLD_SUPABASE_URL")

# Dump dos dados (apenas suas tabelas)
pg_dump \
  --data-only \
  --no-privileges \
  --no-owner \
  --table="public.*" \
  "$OLD_SUPABASE_URL" > dados_public.sql
```

### 2. Importar para Self-Hosted

```bash
# No servidor (via terminal do container)
docker-compose -f docker-compose.fullstack.yml exec db psql \
  -U postgres \
  -d postgres \
  -f /dados_public.sql
```

### 3. Atualizar Configuração da App

Altere no `.env` da aplicação:

```env
# Antes (Supabase Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://wqbppfngjolnxbwqngfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Depois (Self-Hosted)
NEXT_PUBLIC_SUPABASE_URL=https://api.nexiachat.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=<novo_anon_key_do_.env>
```

---

## 📊 Monitoramento

### Health Checks

A aplicação expõe:
- `/api/health` - Status geral
- `/api/health/db` - Status do banco

### Logs

No EasyPanel ou via terminal:
```bash
# Todas as logs
docker-compose -f docker-compose.fullstack.yml logs -f

# Logs específicas
docker-compose -f docker-compose.fullstack.yml logs -f app
docker-compose -f docker-compose.fullstack.yml logs -f db
docker-compose -f docker-compose.fullstack.yml logs -f auth
```

---

## 💾 Backup Automatizado

### Script de Backup Diário

```bash
#!/bin/bash
# /opt/backup/backup.sh

BACKUP_DIR="/opt/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup do banco
cd /opt/nexIA
docker-compose -f docker-compose.fullstack.yml exec -T db pg_dump \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  > "$BACKUP_DIR/database.sql"

# Backup do storage
tar -czvf "$BACKUP_DIR/storage.tar.gz" supabase/volumes/storage/

# Backup do .env
cp .env "$BACKUP_DIR/"

# Upload para S3 (opcional)
aws s3 sync "$BACKUP_DIR" s3://seu-bucket/nexia-backups/

# Limpar backups antigos (> 7 dias)
find /opt/backups -type d -mtime +7 -exec rm -rf {} \;
```

### Cron Job

```bash
# Editar crontab
crontab -e

# Adicionar (executa todo dia às 3h)
0 3 * * * /opt/backup/backup.sh >> /var/log/nexia-backup.log 2>&1
```

---

## 🐛 Troubleshooting

### "Database connection failed"

**Causa**: Senha do PostgreSQL incorreta

**Solução**:
```bash
# Resetar senha do postgres no container
docker-compose -f docker-compose.fullstack.yml exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'nova_senha';"
```

### "JWT validation failed"

**Causa**: Chaves JWT não correspondem

**Solução**:
```bash
# Regenerar chaves
./scripts/deploy-supabase.sh setup
```

### "Port already in use"

**Causa**: Outro serviço usando a porta

**Solução**:
```bash
# Verificar portas em uso
netstat -tulpn | grep 3000

# Matar processo ou mudar porta no docker-compose
```

### Erro de permissão nos volumes

```bash
# Corrigir permissões
sudo chown -R 1000:1000 supabase/volumes/
sudo chmod -R 755 supabase/volumes/
```

---

## 🚀 Comandos Úteis

```bash
# Entrar no container da aplicação
docker-compose -f docker-compose.fullstack.yml exec app sh

# Entrar no PostgreSQL
docker-compose -f docker-compose.fullstack.yml exec db psql -U postgres

# Rodar migrações Prisma manualmente
docker-compose -f docker-compose.fullstack.yml exec app npx prisma migrate deploy

# Reset do banco (CUIDADO!)
docker-compose -f docker-compose.fullstack.yml exec app npx prisma migrate reset

# Ver estatísticas do PostgreSQL
docker-compose -f docker-compose.fullstack.yml exec db psql -U postgres -c "\dt"

# Restart de um serviço específico
docker-compose -f docker-compose.fullstack.yml restart auth
```

---

## 📚 Recursos

- [Documentação Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting/docker)
- [Docker Compose do Supabase](https://github.com/supabase/supabase/tree/master/docker)
- [GoTrue (Auth)](https://github.com/supabase/gotrue)
- [PostgREST](https://postgrest.org/)

---

## ✅ Checklist de Deploy

- [ ] VPS com mínimo 4GB RAM
- [ ] EasyPanel instalado
- [ ] Domínio configurado no DNS
- [ ] Arquivo `.env` configurado com senhas fortes
- [ ] Secrets JWT gerados
- [ ] Meta OAuth configurado (se necessário)
- [ ] SMTP configurado (se necessário)
- [ ] Repositório clonado no servidor
- [ ] Docker Compose configurado no EasyPanel
- [ ] Domínios adicionados no EasyPanel
- [ ] Deploy realizado com sucesso
- [ ] Health checks passando
- [ ] Backup configurado

---

## 🎉 Pronto!

Seu sistema NexIA com Supabase Self-Hosted está no ar! 🚀

Para atualizações futuras, basta fazer push no GitHub que o EasyPanel faz deploy automático (se auto-deploy estiver habilitado).
