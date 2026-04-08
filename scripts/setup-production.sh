#!/bin/bash
set -e

echo "=========================================="
echo "🚀 NexIA - Setup de Produção (PM2)"
echo "=========================================="
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale primeiro:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "✅ Docker encontrado"

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p backups/local backups/logs logs
chmod +x scripts/backup/*.sh 2>/dev/null || true

# Verificar .env.backup
if [ ! -f ".env.backup" ]; then
    echo "❌ .env.backup não encontrado!"
    exit 1
fi

echo "✅ .env.backup encontrado"

# Subir monitoramento
echo ""
echo "🚀 Baixando imagens Docker..."
docker compose -f docker-compose.monitoring.yml pull

echo ""
echo "🚀 Iniciando monitoramento..."
docker compose -f docker-compose.monitoring.yml up -d

echo ""
echo "⏳ Aguardando inicialização (15s)..."
sleep 15

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "nexia|NAME" || true

# Verificar se Grafana subiu
if docker ps | grep -q "nexia-grafana"; then
    echo ""
    echo "=========================================="
    echo "✅ MONITORAMENTO CONCLUÍDO!"
    echo "=========================================="
    echo ""
    echo "📊 Acessos:"
    IP=$(curl -s ifconfig.me 2>/dev/null || echo "49.13.228.89")
    echo "   Grafana:      http://$IP:3001"
    echo "   Uptime Kuma:  http://$IP:3002"
    echo ""
    echo "💾 Para testar backup manual:"
    echo "   ./scripts/backup/backup.sh"
    echo ""
    echo "⚠️  PRÓXIMOS PASSOS:"
    echo "   1. Acesse Grafana: http://$IP:3001 (admin/admin)"
    echo "   2. Troque a senha do admin"
    echo "   3. Configure Uptime Kuma: http://$IP:3002"
    echo ""
else
    echo ""
    echo "❌ Erro ao iniciar. Verificando logs..."
    docker compose -f docker-compose.monitoring.yml logs --tail=20
fi
