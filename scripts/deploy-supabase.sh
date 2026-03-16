#!/bin/bash
# ============================================
# Deploy Script - NexIA + Supabase Self-Hosted
# ============================================
# Uso: ./scripts/deploy-supabase.sh [comando]
# Comandos:
#   setup     - Configuração inicial
#   start     - Inicia todos os serviços
#   stop      - Para todos os serviços
#   restart   - Reinicia todos os serviços
#   logs      - Mostra logs
#   update    - Atualiza imagens e reinicia
#   status    - Status dos containers
#   backup    - Faz backup do banco de dados
#   restore   - Restaura backup do banco de dados
#
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.fullstack.yml"
ENV_FILE="$PROJECT_DIR/.env"

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

# ============================================
# SETUP INICIAL
# ============================================
setup() {
    log "🚀 Iniciando configuração do NexIA + Supabase..."
    
    # Verificar se docker e docker-compose estão instalados
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado. Instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose não encontrado. Instale o Docker Compose primeiro."
        exit 1
    fi
    
    # Verificar se .env existe
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "Arquivo .env não encontrado!"
        log "Copiando .env.supabase.example para .env..."
        cp "$PROJECT_DIR/.env.supabase.example" "$ENV_FILE"
        log_warn "⚠️  IMPORTANTE: Edite o arquivo .env e configure as senhas antes de continuar!"
        log "   Arquivo: $ENV_FILE"
        exit 1
    fi
    
    # Gerar secrets se necessário
    log "🔑 Verificando secrets..."
    
    # Carregar variáveis do .env
    source "$ENV_FILE"
    
    # Verificar POSTGRES_PASSWORD
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "sua_senha_segura_aqui_minimo_16_caracteres" ]; then
        log_warn "POSTGRES_PASSWORD não configurado!"
        log "Gerando senha segura..."
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" "$ENV_FILE"
        log "✅ POSTGRES_PASSWORD atualizado no .env"
    fi
    
    # Verificar JWT_SECRET
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "sua_chave_jwt_32_caracteres_minimo" ]; then
        log_warn "JWT_SECRET não configurado!"
        log "Gerando JWT_SECRET..."
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
        log "✅ JWT_SECRET atualizado no .env"
    fi
    
    # Verificar AUTH_SECRET
    if [ -z "$AUTH_SECRET" ]; then
        log_warn "AUTH_SECRET não configurado!"
        log "Gerando AUTH_SECRET..."
        AUTH_SECRET=$(openssl rand -hex 32)
        echo "" >> "$ENV_FILE"
        echo "# Auth Secret para Next.js" >> "$ENV_FILE"
        echo "AUTH_SECRET=$AUTH_SECRET" >> "$ENV_FILE"
        log "✅ AUTH_SECRET adicionado ao .env"
    fi
    
    # Verificar ANON_KEY e SERVICE_ROLE_KEY
    if [ -z "$ANON_KEY" ] || [ "$ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.seu_token_anon_aqui" ]; then
        log_warn "ANON_KEY não configurado!"
        log "Gerando ANON_KEY..."
        
        # Gerar token JWT para anon
        HEADER='{"alg":"HS256","typ":"JWT"}'
        PAYLOAD='{"role":"anon","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}'
        
        HEADER_B64=$(echo -n "$HEADER" | base64 | tr '+/' '-_' | tr -d '=')
        PAYLOAD_B64=$(echo -n "$PAYLOAD" | base64 | tr '+/' '-_' | tr -d '=')
        
        MESSAGE="$HEADER_B64.$PAYLOAD_B64"
        SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '=')
        
        ANON_KEY="$MESSAGE.$SIGNATURE"
        sed -i "s|ANON_KEY=.*|ANON_KEY=$ANON_KEY|" "$ENV_FILE"
        log "✅ ANON_KEY gerado e atualizado no .env"
    fi
    
    if [ -z "$SERVICE_ROLE_KEY" ] || [ "$SERVICE_ROLE_KEY" = "eyJhc3NvcnQiOiJzZXJ2aWNlX3JvbGUiLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNjU2NTEyMDAwLAogICJleHAiOiAxODQxNjg4MDAwCn0.seu_token_service_aqui" ]; then
        log_warn "SERVICE_ROLE_KEY não configurado!"
        log "Gerando SERVICE_ROLE_KEY..."
        
        # Gerar token JWT para service_role
        HEADER='{"alg":"HS256","typ":"JWT"}'
        PAYLOAD='{"role":"service_role","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}'
        
        HEADER_B64=$(echo -n "$HEADER" | base64 | tr '+/' '-_' | tr -d '=')
        PAYLOAD_B64=$(echo -n "$PAYLOAD" | base64 | tr '+/' '-_' | tr -d '=')
        
        MESSAGE="$HEADER_B64.$PAYLOAD_B64"
        SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '=')
        
        SERVICE_ROLE_KEY="$MESSAGE.$SIGNATURE"
        sed -i "s|SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" "$ENV_FILE"
        log "✅ SERVICE_ROLE_KEY gerado e atualizado no .env"
    fi
    
    # Verificar SECRET_KEY_BASE para Realtime
    if [ -z "$SECRET_KEY_BASE" ]; then
        log_warn "SECRET_KEY_BASE não configurado!"
        log "Gerando SECRET_KEY_BASE..."
        SECRET_KEY_BASE=$(openssl rand -base64 48)
        echo "" >> "$ENV_FILE"
        echo "# Secret para Realtime" >> "$ENV_FILE"
        echo "SECRET_KEY_BASE=$SECRET_KEY_BASE" >> "$ENV_FILE"
        log "✅ SECRET_KEY_BASE adicionado ao .env"
    fi
    
    # Verificar DASHBOARD_PASSWORD
    if [ -z "$DASHBOARD_PASSWORD" ]; then
        log_warn "DASHBOARD_PASSWORD não configurado!"
        log "Gerando senha para dashboard Kong..."
        DASHBOARD_PASSWORD=$(openssl rand -base64 16)
        sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD|" "$ENV_FILE"
        log "✅ DASHBOARD_PASSWORD gerado e atualizado no .env"
        log_warn "🔐 Senha do Dashboard Kong: $DASHBOARD_PASSWORD"
    fi
    
    log "✅ Configuração inicial concluída!"
    log ""
    log "📋 Próximos passos:"
    log "   1. Edite o arquivo .env com suas configurações personalizadas"
    log "   2. Execute: ./scripts/deploy-supabase.sh start"
    log ""
}

# ============================================
# START
# ============================================
start() {
    log "🚀 Iniciando serviços NexIA + Supabase..."
    
    # Verificar se .env existe
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Arquivo .env não encontrado! Execute './scripts/deploy-supabase.sh setup' primeiro."
        exit 1
    fi
    
    # Criar diretórios necessários
    mkdir -p "$PROJECT_DIR/supabase/volumes/functions"
    
    # Pull das imagens mais recentes
    log "📥 Baixando imagens Docker..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Iniciar os serviços
    log "▶️  Iniciando containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Aguardar banco de dados
    log "⏳ Aguardando banco de dados..."
    sleep 10
    
    # Verificar saúde dos serviços
    log "🔍 Verificando saúde dos serviços..."
    
    # Verificar DB
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "supabase-db.*healthy\|Up"; then
        log "✅ Banco de dados: OK"
    else
        log_warn "⚠️  Banco de dados pode estar iniciando..."
    fi
    
    # Verificar App
    sleep 5
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "nexia-app.*Up"; then
        log "✅ Aplicação NexIA: OK"
    else
        log_warn "⚠️  Aplicação pode estar iniciando..."
    fi
    
    log ""
    log "🎉 Serviços iniciados com sucesso!"
    log ""
    log "📊 Acessos:"
    log "   🌐 Aplicação NexIA:    http://localhost:3000"
    log "   🔧 Supabase Studio:    http://localhost:3001"
    log "   🔑 Supabase API:       http://localhost:8000"
    log "   🐘 PostgreSQL:         localhost:5432"
    log ""
    log "📋 Comandos úteis:"
    log "   Ver logs:   ./scripts/deploy-supabase.sh logs"
    log "   Status:     ./scripts/deploy-supabase.sh status"
    log "   Parar:      ./scripts/deploy-supabase.sh stop"
    log ""
}

# ============================================
# STOP
# ============================================
stop() {
    log "🛑 Parando serviços..."
    docker-compose -f "$COMPOSE_FILE" down
    log "✅ Serviços parados!"
}

# ============================================
# RESTART
# ============================================
restart() {
    log "🔄 Reiniciando serviços..."
    stop
    sleep 2
    start
}

# ============================================
# LOGS
# ============================================
logs() {
    if [ -z "$2" ]; then
        docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
    else
        docker-compose -f "$COMPOSE_FILE" logs -f --tail=100 "$2"
    fi
}

# ============================================
# UPDATE
# ============================================
update() {
    log "🔄 Atualizando imagens..."
    docker-compose -f "$COMPOSE_FILE" pull
    log "🔄 Reiniciando serviços..."
    docker-compose -f "$COMPOSE_FILE" up -d
    log "✅ Atualização concluída!"
}

# ============================================
# STATUS
# ============================================
status() {
    log "📊 Status dos serviços:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# ============================================
# BACKUP
# ============================================
backup() {
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log "💾 Criando backup do banco de dados..."
    log "   Destino: $BACKUP_FILE"
    
    source "$ENV_FILE"
    
    docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump \
        -U postgres \
        -d postgres \
        --clean \
        --if-exists \
        > "$BACKUP_FILE"
    
    log "✅ Backup criado: $BACKUP_FILE"
    log "   Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"
}

# ============================================
# RESTORE
# ============================================
restore() {
    if [ -z "$2" ]; then
        log_error "Especifique o arquivo de backup!"
        log "Uso: ./scripts/deploy-supabase.sh restore <arquivo.sql>"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Arquivo não encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log_warn "⚠️  ATENÇÃO: Isso irá substituir todos os dados atuais!"
    read -p "Tem certeza? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Operação cancelada."
        exit 0
    fi
    
    log "🔄 Restaurando backup..."
    
    docker-compose -f "$COMPOSE_FILE" exec -T db psql \
        -U postgres \
        -d postgres \
        < "$BACKUP_FILE"
    
    log "✅ Backup restaurado com sucesso!"
}

# ============================================
# HELP
# ============================================
help() {
    echo ""
    echo "🚀 NexIA + Supabase Deploy Script"
    echo ""
    echo "Uso: ./scripts/deploy-supabase.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "   setup     - Configuração inicial (gera secrets)"
    echo "   start     - Inicia todos os serviços"
    echo "   stop      - Para todos os serviços"
    echo "   restart   - Reinicia todos os serviços"
    echo "   logs      - Mostra logs (use: logs [servico])"
    echo "   update    - Atualiza imagens e reinicia"
    echo "   status    - Status dos containers"
    echo "   backup    - Faz backup do banco de dados"
    echo "   restore   - Restaura backup do banco (use: restore <arquivo.sql>)"
    echo "   help      - Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "   ./scripts/deploy-supabase.sh setup"
    echo "   ./scripts/deploy-supabase.sh start"
    echo "   ./scripts/deploy-supabase.sh logs app"
    echo "   ./scripts/deploy-supabase.sh backup"
    echo ""
}

# ============================================
# MAIN
# ============================================
case "${1:-help}" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    update)
        update
        ;;
    status)
        status
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$@"
        ;;
    help|--help|-h)
        help
        ;;
    *)
        log_error "Comando desconhecido: $1"
        help
        exit 1
        ;;
esac
