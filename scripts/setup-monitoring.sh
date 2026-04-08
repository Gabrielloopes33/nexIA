#!/bin/bash
# ============================================
# Setup de Monitoramento e Backup - NexIA
# ============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚀 NexIA - Setup de Monitoramento e Backup           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    log_error "Execute este script do diretório raiz do projeto"
    exit 1
fi

# ============================================
# 1. Verificar Dependências
# ============================================
log_info "Verificando dependências..."

command -v docker >/dev/null 2>&1 || { log_error "Docker não instalado"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose não instalado"; exit 1; }

log_success "Dependências OK"

# ============================================
# 2. Criar Rede Docker
# ============================================
log_info "Configurando rede Docker..."

if ! docker network ls | grep -q "nexia-network"; then
    docker network create nexia-network
    log_success "Rede nexia-network criada"
else
    log_info "Rede nexia-network já existe"
fi

# ============================================
# 3. Configurar Ambiente
# ============================================
log_info "Configurando ambiente..."

# Backup env
if [ ! -f ".env.backup" ]; then
    if [ -f ".env.backup.example" ]; then
        cp .env.backup.example .env.backup
        log_warning "Arquivo .env.backup criado. EDITE AS CONFIGURAÇÕES!"
    fi
else
    log_info ".env.backup já existe"
fi

# ============================================
# 4. Perguntar o que instalar
# ============================================
echo ""
echo "O que deseja configurar?"
echo "  1) Monitoramento completo (Prometheus + Grafana + Loki)"
echo "  2) Backup automático (PostgreSQL)"
echo "  3) Ambos"
echo "  4) Sair"
echo ""
read -p "Opção (1-4): " choice

case $choice in
    1)
        SETUP_MONITORING=true
        SETUP_BACKUP=false
        ;;
    2)
        SETUP_MONITORING=false
        SETUP_BACKUP=true
        ;;
    3)
        SETUP_MONITORING=true
        SETUP_BACKUP=true
        ;;
    4)
        log_info "Saindo..."
        exit 0
        ;;
    *)
        log_error "Opção inválida"
        exit 1
        ;;
esac

# ============================================
# 5. Setup Monitoramento
# ============================================
if [ "$SETUP_MONITORING" = true ]; then
    echo ""
    log_info "============================================"
    log_info "Configurando Monitoramento"
    log_info "============================================"
    
    # Criar diretórios necessários
    mkdir -p monitoring/grafana/dashboards
    mkdir -p backups/local
    
    # Perguntar senha do Grafana
    read -sp "Senha para Grafana (admin): " grafana_pass
    echo ""
    if [ -n "$grafana_pass" ]; then
        export GRAFANA_ADMIN_PASSWORD=$grafana_pass
    fi
    
    # Subir stack
    log_info "Iniciando serviços de monitoramento..."
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Aguardar inicialização
    log_info "Aguardando inicialização..."
    sleep 10
    
    # Verificar status
    if docker-compose -f docker-compose.monitoring.yml ps | grep -q "Up"; then
        log_success "Monitoramento iniciado com sucesso!"
        echo ""
        echo "  📊 Grafana:      http://localhost:3001"
        echo "  📈 Prometheus:   http://localhost:9090"
        echo "  📝 Loki:         http://localhost:3100"
        echo "  🚨 Alertmanager: http://localhost:9093"
        echo "  ⏱️  Uptime Kuma:  http://localhost:3002"
        echo ""
        log_warning "Altere a senha padrão do Grafana em: http://localhost:3001"
    else
        log_error "Falha ao iniciar monitoramento"
        docker-compose -f docker-compose.monitoring.yml logs
        exit 1
    fi
fi

# ============================================
# 6. Setup Backup
# ============================================
if [ "$SETUP_BACKUP" = true ]; then
    echo ""
    log_info "============================================"
    log_info "Configurando Backup Automático"
    log_info "============================================"
    
    # Verificar se .env.backup foi configurado
    if grep -q "sua_senha_segura_aqui\|SEU_ACCESS_KEY" .env.backup 2>/dev/null; then
        log_warning "ARQUIVO .env.backup PRECISA SER CONFIGURADO!"
        echo ""
        echo "Edite o arquivo .env.backup e configure:"
        echo "  - DB_PASSWORD"
        echo "  - BACKUP_GPG_PASSPHRASE (recomendado)"
        echo "  - S3_BUCKET_NAME (recomendado)"
        echo "  - S3_ACCESS_KEY (recomendado)"
        echo "  - S3_SECRET_KEY (recomendado)"
        echo ""
        read -p "Pressione ENTER para continuar ou Ctrl+C para cancelar..."
    fi
    
    # Criar diretório de backups
    mkdir -p backups/local
    
    # Subir serviço
    log_info "Iniciando serviço de backup..."
    docker-compose -f docker-compose.backup.yml up -d
    
    # Verificar status
    sleep 5
    if docker-compose -f docker-compose.backup.yml ps | grep -q "Up"; then
        log_success "Serviço de backup iniciado!"
        
        # Perguntar se quer testar
        read -p "Deseja executar um backup de teste agora? (s/n): " test_backup
        if [ "$test_backup" = "s" ]; then
            log_info "Executando backup de teste..."
            docker exec -it nexia-backup /scripts/backup-postgres.sh full
        fi
    else
        log_error "Falha ao iniciar serviço de backup"
        docker-compose -f docker-compose.backup.yml logs
        exit 1
    fi
fi

# ============================================
# 7. Resumo
# ============================================
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP CONCLUÍDO                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

if [ "$SETUP_MONITORING" = true ]; then
    echo "📊 MONITORAMENTO:"
    echo "   Grafana:      http://localhost:3001 (admin/admin)"
    echo "   Prometheus:   http://localhost:9090"
    echo ""
fi

if [ "$SETUP_BACKUP" = true ]; then
    echo "💾 BACKUP:"
    echo "   Status:       docker-compose -f docker-compose.backup.yml ps"
    echo "   Logs:         docker-compose -f docker-compose.backup.yml logs -f"
    echo "   Backups:      ./backups/local/"
    echo ""
fi

echo "📚 DOCUMENTAÇÃO:"
echo "   Monitoramento: MONITORING.md"
echo "   Backup:        BACKUP.md"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "   1. Configure as variáveis em .env.backup"
echo "   2. Altere a senha padrão do Grafana"
echo "   3. Configure webhooks de notificação"
echo "   4. Teste a restauração de backup"
echo "   5. Adicione monitoramento no Uptime Kuma"
echo ""
log_success "Setup concluído! 🚀"
