# 🚀 Guia de Deploy - NexIA

> **🎯 MÉTODO RECOMENDADO**: [EasyPanel + GitHub](./EASYPANEL.md) - Deploy automático a cada push!

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        DNS                                  │
├─────────────────┬──────────────────┬───────────────────────┤
│  nexiachat.com  │ dev.nexiachat    │ app.nexiachat         │
│   (Produção)    │   (Staging)      │   (EasyPanel)         │
└────────┬────────┴────────┬─────────┴───────────┬───────────┘
         │                 │                     │
    ┌────▼────┐      ┌────▼────┐           ┌────▼────┐
    │  VPS    │      │Netlify  │           │Docker   │
    │Hetzner  │      │         │           │Compose  │
    │+EasyPanel     │         │           │         │
    └────┬────┘      └─────────┘           └────┬────┘
         │                                        │
    ┌────▼────────────────────────────────────────▼────┐
    │           PostgreSQL (Self-hosted)               │
    │              ou Supabase Cloud                   │
    └──────────────────────────────────────────────────┘
```

## 🚀 Opções de Deploy

| Método | Dificuldade | Automação | Recomendado |
|--------|-------------|-----------|-------------|
| **[EasyPanel + GitHub](./EASYPANEL.md)** | ⭐ Fácil | 🔄 Auto-deploy | ✅ **SIM** |
| [Portainer + GHCR](#-deploy-com-portainer-imagem-ghcr) | ⭐ Fácil | 🔄 Auto-deploy | ✅ **SIM** |
| [Docker Manual](#-deploy-manual-sem-easypanel) | ⭐⭐ Médio | 🔧 Manual | Opcional |
| [EasyPanel Template](#-deploy-com-easypanel-template) | ⭐ Fácil | 🔄 Auto | Alternativa |

---

## 📋 Checklist Pre-Deploy

### 1. Preparar VPS (Hetzner)

```bash
# Acesse a VPS via SSH
ssh root@SEU_IP

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm
```

### 2. Instalar EasyPanel (opcional)

```bash
curl -fsSL https://easypanel.io/install.sh | sh
```

Acesse: `http://SEU_IP:3000`

---

## 🗄️ Configurar PostgreSQL

### Opção A: PostgreSQL no Docker (Recomendado para VPS)

```bash
# Criar volume para dados
docker volume create postgres_data

# Rodar PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_USER=nexia \
  -e POSTGRES_PASSWORD=SUA_SENHA_FORTE \
  -e POSTGRES_DB=nexia \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# URL de conexão
DATABASE_URL="postgresql://nexia:SUA_SENHA_FORTE@localhost:5432/nexia"
```

### Opção B: EasyPanel + PostgreSQL

1. No EasyPanel → Databases → Create
2. Escolha PostgreSQL 15
3. Anote: `host`, `port`, `username`, `password`, `database`

---

## 🚀 Deploy Manual (Sem EasyPanel)

```bash
# 1. Clone o repositório
git clone https://github.com/Gabrielloopes33/nexIA.git /opt/nexia
cd /opt/nexia

# 2. Criar arquivo de variáveis de ambiente
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://nexia:SUA_SENHA@localhost:5432/nexia
AUTH_SECRET=SUA_CHAVE_SECRETA_AQUI
NEXT_PUBLIC_SUPABASE_URL=https://wqbppfngjolnxbwqngfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

# 3. Tornar script executável e rodar
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 🐳 Deploy com EasyPanel

### 1. Criar Aplicação

No EasyPanel:
1. **Applications** → **Create**
2. **Source**: Git Repository
   - Repository: `https://github.com/Gabrielloopes33/nexIA.git`
   - Branch: `main`
3. **Build Type**: Dockerfile
4. **Port**: `3000`

### 2. Configurar Variáveis de Ambiente

Adicione no EasyPanel:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/nexia
AUTH_SECRET=sua_chave_aleatoria_32_chars
NEXT_PUBLIC_SUPABASE_URL=https://wqbppfngjolnxbwqngfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3. Configurar Domínio

1. No EasyPanel → sua app → Domains
2. Add Domain: `nexiachat.com.br`
3. Configure DNS apontando para o IP da VPS

---

## 🔄 Migração de Dados

### Exportar do Supabase atual

```bash
# Instalar supabase CLI
npm install -g supabase

# Login
supabase login

# Dump do schema
supabase db dump --db-url "SUA_URL_ATUAL" -f schema.sql

# Dump dos dados
supabase db dump --db-url "SUA_URL_ATUAL" --data-only -f data.sql
```

### Importar para novo banco

```bash
# Aplicar schema
psql $DATABASE_URL < schema.sql

# Importar dados
psql $DATABASE_URL < data.sql

# Ou usar o script de migração
npx prisma migrate deploy
```

---

## 📊 Comandos Úteis

```bash
# Ver logs
docker logs -f nexia-production

# Restart app
docker restart nexia-production

# Entrar no container
docker exec -it nexia-production sh

# Backup manual
docker exec postgres pg_dump -U nexia nexia > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i postgres psql -U nexia nexia < backup_file.sql
```

---

## 🔒 Configurar Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/nexia
server {
    listen 80;
    server_name nexiachat.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/nexia /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL com Certbot
certbot --nginx -d nexiachat.com.br
```

---

## 🧪 Testar Deploy

```bash
# Health check
curl http://localhost:3000/api/health

# Deve retornar:
# {
#   "status": "healthy",
#   "checks": {
#     "database": true,
#     "timestamp": "2024-..."
#   }
# }
```

---

## 🐳 Deploy com Portainer (Imagem GHCR)

Deploy usando o Portainer com imagem pré-construída do GitHub Container Registry.

### Vantagens
- ✅ Não precisa construir imagem na VPS
- ✅ Deploy mais rápido
- ✅ Imagem sempre atualizada a cada push na main
- ✅ Fácil rollback para versões anteriores

### 1. Configurar GitHub Actions

O arquivo `.github/workflows/docker-publish.yml` já está configurado. A cada push na branch `main`, a imagem é automaticamente publicada no GHCR.

### 2. Configurar Portainer

#### Acesse o Portainer:
```
https://SEU_IP:9443
```

#### Criar Stack:
1. **Stacks** → **Add stack**
2. **Name**: `nexia`
3. **Build method**: **Web editor**
4. Cole o conteúdo do arquivo `docker-compose.portainer.yml`:

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/gabrielloopes33/nexia:latest
    container_name: nexia-portainer
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    networks:
      - nexia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  nexia-network:
    driver: bridge
```

### 3. Configurar Environment Variables

No Portainer, na seção **Environment variables**, adicione:

```env
DATABASE_URL=postgresql://user:password@host:5432/nexia
AUTH_SECRET=sua_chave_secreta_32_caracteres
NEXT_PUBLIC_SUPABASE_URL=https://wqbppfngjolnxbwqngfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 💡 **Gerar AUTH_SECRET**: `openssl rand -hex 32`

### 4. Deploy

Clique em **Deploy the stack**.

### 5. Atualizar Imagem

Para atualizar para a última versão:
1. No Portainer → **Stacks** → **nexia**
2. Clique em **Editor** → **Update the stack**
3. Marque **Re-pull image and redeploy**
4. Clique em **Update**

Ou use webhook para atualização automática:
```bash
# Configurar webhook no Portainer para receber notificações do GitHub
curl -X POST "https://portainer.seu-dominio.com/api/stacks/1/git/redeploy?endpointId=1&registryId=1"
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

O projeto já possui CI/CD configurado para publicar imagens Docker automaticamente.

### Workflow Existente: Docker Publish

Arquivo: `.github/workflows/docker-publish.yml`

**Triggers:**
- Push na branch `main` ou `master`
- Tags `v*` (releases)
- Pull requests (apenas build, não publica)
- Manual (`workflow_dispatch`)

**Funcionalidades:**
- Build multi-plataforma (amd64, arm64)
- Cache de camadas Docker
- Tags automáticas: `latest`, `main`, versões semver
- Publicação no GHCR (GitHub Container Registry)

### Workflow Opcional: Deploy para VPS

Se quiser deploy automático para VPS, crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/nexia
            git pull origin main
            ./scripts/deploy.sh
```

---

## ⚠️ Troubleshooting

### Erro: "Connection refused"
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
docker logs postgres
```

### Erro: "Prisma Client not found"
```bash
# Gerar cliente
docker exec nexia-production npx prisma generate
```

### Erro: "Database does not exist"
```bash
# Criar banco manualmente
docker exec postgres createdb -U nexia nexia
```

---

## 📞 Suporte

Em caso de problemas:
1. Verifique logs: `docker logs nexia-production`
2. Health check: `curl localhost:3000/api/health`
3. Teste conexão DB: `docker exec postgres psql -U nexia -c "SELECT 1"`
