# 📊 Monitoramento e Observabilidade - NexIA

> Guia completo de monitoramento, alerting e observabilidade para produção.

---

## 📋 Visão Geral

O sistema de monitoramento NexIA inclui:

| Componente | Função | Porta |
|------------|--------|-------|
| **Prometheus** | Coleta de métricas | 9090 |
| **Grafana** | Dashboards e visualização | 3001 |
| **Loki** | Agregação de logs | 3100 |
| **Alertmanager** | Gestão de alertas | 9093 |
| **Uptime Kuma** | Monitoramento de uptime | 3002 |
| **cAdvisor** | Métricas de containers | 8080 |

---

## 🚀 Quick Start

### 1. Subir Stack de Monitoramento

```bash
# Certifique-se que a rede nexia-network existe
docker network create nexia-network 2>/dev/null || true

# Subir monitoramento
docker-compose -f docker-compose.monitoring.yml up -d

# Verificar status
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Acessar Dashboards

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Grafana | http://localhost:3001 | admin/admin (altere!) |
| Prometheus | http://localhost:9090 | - |
| Uptime Kuma | http://localhost:3002 | configure no primeiro acesso |

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.backup.example .env.backup

# Editar configurações
nano .env.backup
```

---

## 📊 Dashboards Disponíveis

### 1. NexIA Overview (`nexia-overview`)
Status geral do sistema em uma visão:
- ✅ Status dos serviços (App, DB, etc)
- 📈 CPU, Memória, Disco em tempo real
- 📊 Taxa de requisições HTTP
- ⏱️ Tempos de resposta

### 2. Database Metrics (`nexia-database`)
Métricas detalhadas do PostgreSQL:
- Conexões ativas/idle
- Transações por segundo
- Tempo médio de queries
- Crescimento do banco

### 3. Container Metrics
Métricas dos containers Docker:
- Uso de CPU/Memória por container
- Network I/O
- Status de containers

---

## 🚨 Alertas Configurados

### Critical (Ação Imediata)

| Alerta | Condição | Notificação |
|--------|----------|-------------|
| `NexIAAppDown` | App não responde por 1m | Email + Slack + Telegram |
| `PostgreSQLDown` | DB offline | Email + Slack |
| `CriticalCPUUsage` | CPU > 95% por 2m | Slack |
| `CriticalMemoryUsage` | Memória > 95% por 2m | Slack |
| `CriticalDiskSpace` | Disco < 5% por 1m | Slack |

### Warning (Atenção)

| Alerta | Condição | Notificação |
|--------|----------|-------------|
| `HighCPUUsage` | CPU > 80% por 5m | Slack |
| `HighMemoryUsage` | Memória > 85% por 5m | Slack |
| `LowDiskSpace` | Disco < 10% por 5m | Slack |
| `HighResponseTime` | P95 > 2s por 3m | Slack |
| `HighErrorRate` | Erros 5xx > 10% por 2m | Slack |

---

## 🔧 Configuração de Notificações

### Discord Webhook

1. No Discord: Server Settings → Integrations → Webhooks
2. Copiar URL do webhook
3. Adicionar ao `.env.backup`:
```env
NOTIFICATION_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Slack

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#alerts
```

### Telegram

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-1001234567890
```

### Email (SMTP)

```env
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_app_password
ALERT_EMAIL_TO=admin@nexiachat.com.br
```

---

## 📈 Métricas Exportadas

### Métricas da Aplicação

Endpoint: `/api/metrics` (se configurado)

```
# Exemplos de métricas
http_requests_total{status="200",method="GET"}
http_request_duration_seconds_bucket{le="0.1"}
nexia_active_users
deals_created_total
messages_sent_total
```

### Métricas de Infraestrutura

```
# Node Exporter
node_cpu_seconds_total
node_memory_MemAvailable_bytes
node_filesystem_avail_bytes

# PostgreSQL Exporter
pg_up
pg_stat_activity_count
pg_database_size_bytes

# cAdvisor
container_cpu_usage_seconds_total
container_memory_usage_bytes
```

---

## 🔍 Troubleshooting

### Prometheus não coleta métricas

```bash
# Verificar targets
curl http://localhost:9090/api/v1/targets

# Verificar logs
docker logs nexia-prometheus
```

### Grafana não inicia

```bash
# Resetar senha admin
docker exec -it nexia-grafana grafana-cli admin reset-admin-password nova_senha

# Verificar permissões
docker exec -it nexia-grafana ls -la /var/lib/grafana
```

### Loki não recebe logs

```bash
# Verificar configuração do Promtail
docker exec -it nexia-promtail cat /etc/promtail/config.yml

# Testar conexão
docker exec -it nexia-promtail wget -O- http://loki:3100/ready
```

---

## 💾 Backups dos Dados de Monitoramento

```bash
# Backup Prometheus
docker exec nexia-prometheus tar czf - /prometheus > prometheus_backup_$(date +%Y%m%d).tar.gz

# Backup Grafana
docker exec nexia-grafana tar czf - /var/lib/grafana > grafana_backup_$(date +%Y%m%d).tar.gz
```

---

## 🔄 Atualização

```bash
# Parar serviços
docker-compose -f docker-compose.monitoring.yml down

# Atualizar imagens
docker-compose -f docker-compose.monitoring.yml pull

# Subir novamente
docker-compose -f docker-compose.monitoring.yml up -d
```

---

## 📚 Recursos Adicionais

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Loki Docs](https://grafana.com/docs/loki/)
- [PostgreSQL Exporter](https://github.com/prometheus-community/postgres_exporter)

---

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs: `docker logs nexia-prometheus`
2. Teste conectividade: `docker exec nexia-prometheus wget nexia-app:3000/api/health`
3. Verifique alertas no Prometheus: http://localhost:9090/alerts
