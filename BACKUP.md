# 💾 Backup e Recuperação - NexIA

> Guia completo de estratégia de backup, retenção e recuperação de desastres.

---

## 📋 Estratégia de Backup

### Tipos de Backup

| Tipo | Frequência | Retenção | Descrição |
|------|------------|----------|-----------|
| **Full** | Diário (2h) | 7 dias | Backup completo do banco |
| **Schema** | Semanal | 4 semanas | Apenas estrutura das tabelas |
| **Globals** | Mensal | 12 meses | Usuários, roles, configs |

### Arquitetura de Backup

```
┌─────────────────────────────────────────────────────────────┐
│                    NexIA Application                        │
│                         │                                   │
│                         ▼                                   │
│              ┌─────────────────────┐                       │
│              │   PostgreSQL        │                       │
│              │   (Production)      │                       │
│              └──────────┬──────────┘                       │
│                         │                                   │
│              ┌──────────▼──────────┐                       │
│              │   Backup Service    │                       │
│              │   (Daily 2 AM)      │                       │
│              └──────────┬──────────┘                       │
│                         │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐              │
│   │  Local   │   │   S3/    │   │  Offsite │              │
│   │  (7d)    │   │   R2     │   │  (30d)   │              │
│   └──────────┘   └──────────┘   └──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Configurar Backup Automático

```bash
# Copiar configuração
cp .env.backup.example .env.backup

# Editar variáveis
nano .env.backup
```

Preencha obrigatoriamente:
```env
DB_PASSWORD=sua_senha_segura
BACKUP_GPG_PASSPHRASE=sua_passphrase_criptografia

# Cloud (RECOMENDADO)
S3_BUCKET_NAME=nexia-backups
S3_ACCESS_KEY=seu_access_key
S3_SECRET_KEY=seu_secret_key
S3_ENDPOINT=https://seu-endpoint.r2.cloudflarestorage.com
```

### 2. Iniciar Serviço de Backup

```bash
# Subir serviço
docker-compose -f docker-compose.backup.yml up -d

# Verificar status
docker-compose -f docker-compose.backup.yml logs -f
```

### 3. Testar Backup Manual

```bash
# Entrar no container
docker exec -it nexia-backup sh

# Executar backup manual
/scripts/backup-postgres.sh full

# Verificar backup criado
ls -la /backup/local/$(date +%Y%m%d)/
```

---

## 📅 Agendamento

O backup automático roda via CRON (padrão: todo dia às 2h da manhã).

### Alterar Horário

```env
# .env.backup
BACKUP_CRON=0 2 * * *      # 2 AM todos os dias
BACKUP_CRON=0 */6 * * *    # A cada 6 horas
BACKUP_CRON=0 2 * * 0      # Todo domingo 2 AM
```

Formato CRON:
```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

---

## 🔒 Criptografia

### Habilitar GPG

```env
BACKUP_GPG_PASSPHRASE=sua_passphrase_super_secreta
```

Os backups serão automaticamente criptografados com AES256.

### Descriptografar Manualmente

```bash
# Descriptografar
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz

# Ou usar o script de restore (automático)
GPG_PASSPHRASE=sua_passphrase ./restore-postgres.sh backup.sql.gz.gpg
```

---

## ☁️ Cloud Storage

### Cloudflare R2 (Recomendado - 10GB grátis)

```env
S3_BUCKET_NAME=nexia-backups
S3_ACCESS_KEY=seu_r2_access_key
S3_SECRET_KEY=seu_r2_secret_key
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto
```

### AWS S3

```env
S3_BUCKET_NAME=nexia-backups
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
S3_REGION=us-east-1
# S3_ENDPOINT=  # Deixe vazio para AWS
```

### MinIO (Self-hosted)

```env
S3_BUCKET_NAME=nexia-backups
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
```

---

## 🔄 Restauração

### ⚠️ AVISO IMPORTANTE

> A restauração SUBSTITUI dados existentes. Sempre faça backup do estado atual antes!

### Restauração Completa

```bash
# Listar backups disponíveis
ls -la ./backups/local/

# Restaurar (interativo - pede confirmação)
./scripts/backup/restore-postgres.sh ./backups/local/20240115/nexia_full_20240115_020000.sql.gz

# Simulação (dry run)
DRY_RUN=true ./scripts/backup/restore-postgres.sh ./backups/local/20240115/nexia_full_20240115_020000.sql.gz

# Restaurar para banco diferente (não destrói original)
./scripts/backup/restore-postgres.sh backup.sql.gz nexia_restored
```

### Restauração de Emergência

```bash
# 1. Parar a aplicação
docker-compose stop app

# 2. Conectar ao container de backup
docker exec -it nexia-backup sh

# 3. Executar restore
/scripts/restore-postgres.sh /backup/local/20240115/nexia_full_20240115_020000.sql.gz

# 4. Reiniciar aplicação
docker-compose start app

# 5. Verificar health check
curl http://localhost:3000/api/health
```

---

## 📊 Monitoramento de Backups

### Verificar Último Backup

```bash
# Ver logs
docker-compose -f docker-compose.backup.yml logs --tail=100

# Listar backups recentes
ls -lt ./backups/local/*/nexia_full_*.sql.gz | head -5
```

### Notificações

Configure notificações no `.env.backup`:

```env
# Discord
NOTIFICATION_WEBHOOK_URL=https://discord.com/api/webhooks/...
NOTIFICATION_LEVEL=error  # error, warning, info

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 🧪 Testes de Recuperação

### Plano de Teste Mensal

```bash
#!/bin/bash
# monthly-restore-test.sh

BACKUP_FILE=$(ls -t ./backups/local/*/nexia_full_*.sql.gz | head -1)
TEST_DB="nexia_test_restore_$(date +%Y%m%d)"

echo "Testando restauração de: $BACKUP_FILE"
echo "Banco de teste: $TEST_DB"

# Restaurar para banco de teste
./scripts/backup/restore-postgres.sh "$BACKUP_FILE" "$TEST_DB"

# Verificar integridade
docker exec nexia-db psql -U nexia -d "$TEST_DB" -c "
    SELECT 
        (SELECT count(*) FROM contacts) as contacts,
        (SELECT count(*) FROM organizations) as organizations,
        (SELECT count(*) FROM deals) as deals
"

# Limpar
docker exec nexia-db psql -U nexia -c "DROP DATABASE \"$TEST_DB\""

echo "✅ Teste de restauração concluído com sucesso!"
```

---

## 📋 Checklist de Produção

Antes de colocar em produção:

- [ ] Configurar `DB_PASSWORD` em `.env.backup`
- [ ] Configurar `BACKUP_GPG_PASSPHRASE` (mínimo 20 caracteres)
- [ ] Configurar Cloud Storage (S3/R2)
- [ ] Testar backup manual
- [ ] Testar restore para banco de teste
- [ ] Configurar notificações (Discord/Slack)
- [ ] Verificar retenção de backups
- [ ] Documentar procedimento de recuperação
- [ ] Agendar teste mensal de restore

---

## 🆘 Recuperação de Desastres

### Cenário 1: Perda de Dados (DB Corrompido)

```bash
# 1. Identificar último backup bom
ls -lt ./backups/local/*/nexia_full_*.sql.gz

# 2. Parar aplicação
docker-compose down app

# 3. Remover volume corrompido (CUIDADO!)
docker volume rm nexia_postgres_data

# 4. Recriar volume
docker volume create nexia_postgres_data

# 5. Subir apenas o banco
docker-compose up -d db

# 6. Restaurar backup
./scripts/backup/restore-postgres.sh ./backups/local/YYYYMMDD/nexia_full_YYYYMMDD_HHMMSS.sql.gz

# 7. Subir aplicação
docker-compose up -d
```

### Cenário 2: VPS Completa Falhou

1. Provisionar nova VPS
2. Instalar Docker e Docker Compose
3. Restaurar aplicação do Git
4. Configurar variáveis de ambiente
5. Baixar backup mais recente do S3/R2
6. Restaurar banco de dados
7. Iniciar serviços

---

## 💰 Custos Estimados

| Serviço | Custo Mensal | Armazenamento |
|---------|--------------|---------------|
| Local (VPS) | $0 | Limitado pelo disco |
| Cloudflare R2 | $0 (até 10GB) | Ilimitado |
| AWS S3 | ~$0.23/GB | Ilimitado |
| Wasabi | $7/TB | Ilimitado |

---

## 📞 Suporte

Em caso de falha no backup:

1. Verifique logs: `docker logs nexia-backup`
2. Teste conexão com DB: `docker exec nexia-backup pg_isready -h db -U nexia`
3. Verifique espaço em disco: `df -h`
4. Teste manual: `docker exec -it nexia-backup /scripts/backup-postgres.sh full`
