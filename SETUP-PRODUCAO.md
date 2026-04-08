# 🚀 Setup de Produção - NexIA (PM2)

> Guia passo a passo para configurar backup e monitoramento na sua VPS com PM2.

---

## 📋 O que Vamos Configurar

```
┌─────────────────────────────────────────────────────────────┐
│                    SUA VPS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   PM2        │  │ PostgreSQL   │  │   Docker     │      │
│  │  (NexIA App) │  │   (nativo)   │  │ (Monitoring) │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│         │                  │                │              │
│         │                  │       ┌────────▼────────┐      │
│         │                  │       │  • Grafana      │      │
│         │                  │       │  • Prometheus   │      │
│         │                  │       │  • Loki (logs)  │      │
│         │                  │       │  • Uptime Kuma  │      │
│         │                  │       └─────────────────┘      │
│         │                  │                                │
│         └──────────┬───────┘                                │
│              ┌─────▼──────┐                                │
│              │   BACKUP   │                                │
│              │  (automático│                                │
│              │   2h/dia)  │                                │
│              └────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ PRÉ-REQUISITOS

- [ ] Acesso SSH à VPS
- [ ] App rodando com PM2
- [ ] PostgreSQL instalado e rodando

---

## 🚀 PASSO A PASSO

### 1. Conectar na VPS

```bash
ssh root@49.13.228.89
```

### 2. Ir para a pasta da aplicação

```bash
cd /var/www/nexIA
```

### 3. Executar o setup automático

```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

Esse script vai:
- ✅ Verificar/instalar Docker
- ✅ Criar diretórios
- ✅ Subir monitoramento
- ✅ Configurar backups automáticos

---

## ⚙️ CONFIGURAÇÃO MANUAL (se preferir)

### Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### Subir Monitoramento

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Acesse:
- **Grafana:** http://49.13.228.89:3001 (login: admin/admin)
- **Uptime Kuma:** http://49.13.228.89:3002

### Configurar Backup

1. Copiar configuração:
```bash
cp .env.backup.example .env.backup
nano .env.backup
```

2. Preencher obrigatórios:
```env
# Já vem preenchido:
DB_PASSWORD=jVmcWsmLrxHr

# Você precisa adicionar:
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

3. Testar backup:
```bash
./scripts/backup/backup.sh
```

---

## 🔧 CONFIGURAR CLOUDFLARE R2 (BACKUP NA NUVEM)

### 1. Criar Conta

1. Acesse: https://dash.cloudflare.com/sign-up
2. Confirme seu email

### 2. Criar Bucket

1. No menu lateral, clique em **"R2"**
2. Clique **"Create bucket"**
3. Nome: `nexia-backups`
4. Clique **"Create bucket"**

### 3. Criar API Token

1. Na página do R2, clique **"Manage R2 API Tokens"**
2. Clique **"Create API Token"**
3. Preencha:
   - **Token name:** nexia-backup
   - **Permissions:** Object Read & Write ✅
   - **TTL:** (deixe em branco para nunca expirar)
4. Clique **"Create API Token"**
5. **COPIE** os valores mostrados:
   - Access Key ID
   - Secret Access Key

### 4. Pegar Endpoint S3

1. Volte para a página do bucket `nexia-backups`
2. Clique em **"Settings"**
3. Procure **"S3 API"**
4. Copie a URL (vai parecer: `https://xxxx.r2.cloudflarestorage.com`)

### 5. Configurar no .env.backup

```bash
nano /var/www/nexIA/.env.backup
```

Adicione:
```env
S3_BUCKET_NAME=nexia-backups
S3_ACCESS_KEY=cole_aqui_access_key_id
S3_SECRET_KEY=cole_aqui_secret_access_key
S3_ENDPOINT=https://cole_aqui_seu_endpoint.r2.cloudflarestorage.com
S3_REGION=auto
```

### 6. Testar

```bash
./scripts/backup/backup.sh
```

Verifique se aparece: ✅ Upload concluído

---

## 📱 CONFIGURAR DISCORD (ALERTAS)

### 1. Criar Webhook no Discord

1. No seu servidor Discord, clique no nome → **Server Settings**
2. Menu lateral: **Integrations** → **Webhooks**
3. Clique **"New Webhook"**
4. Nome: `NexIA Alerts`
5. Canal: `#alertas` (ou crie um)
6. Clique **"Copy Webhook URL"**

### 2. Configurar

```bash
nano /var/www/nexIA/.env.backup
```

Adicione:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx/xxxxx
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. Alterar Senha do Grafana

1. Acesse: http://49.13.228.89:3001
2. Login: `admin` / `admin`
3. Troque a senha imediatamente!

### 2. Configurar Uptime Kuma

1. Acesse: http://49.13.228.89:3002
2. Crie uma conta
3. Clique **"Add New Monitor"**
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** NexIA App
   - **URL:** `http://49.13.228.89:3000/api/health`
   - **Heartbeat Interval:** 60 seconds

### 3. Verificar Backup Automático

```bash
# Ver CRON configurado
crontab -l

# Ver logs do backup
tail -f /var/www/nexIA/backups/logs/cron.log
```

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Fazer backup manual
./scripts/backup/backup.sh

# Ver logs em tempo real
tail -f backups/logs/backup_$(date +%Y%m%d).log

# Ver containers rodando
docker ps

# Restartar monitoramento
docker-compose -f docker-compose.monitoring.yml restart

# Ver espaço em disco
df -h

# Ver uso de memória
free -h
```

---

## 🆘 RECUPERAÇÃO DE DESASTRE

### Se precisar restaurar backup:

```bash
# 1. Listar backups disponíveis
ls -la backups/local/

# 2. Restaurar (modo teste primeiro)
DRY_RUN=true ./scripts/backup/restore.sh backups/local/20240115/nexia_20240115_020000.sql.gz

# 3. Se OK, restaurar de verdade
./scripts/backup/restore.sh backups/local/20240115/nexia_20240115_020000.sql.gz
```

---

## 💰 CUSTOS

| Serviço | Custo |
|---------|-------|
| Cloudflare R2 | **GRÁTIS** (10GB) → depois ~$0.015/GB |
| Monitoramento | **GRÁTIS** (roda na sua VPS) |
| Discord | **GRÁTIS** |

---

## 📞 SUPORTE

Se tiver problemas:

1. Verifique logs: `tail -f backups/logs/*.log`
2. Verifique containers: `docker ps`
3. Teste conexão: `pg_isready -h 49.13.228.89 -U root`
