#!/bin/bash
# ============================================
# PostgreSQL Backup Script - NexIA (PM2 Version)
# ============================================

set -euo pipefail

# Carregar variáveis do .env.backup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../../.env.backup" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/../../.env.backup" | xargs)
fi

# Configurações (podem ser sobrescritas via .env.backup)
DB_HOST="${DB_HOST:-49.13.228.89}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nexia_chat}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-jVmcWsmLrxHr}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)
BACKUP_DIR="${BACKUP_DIR:-/var/www/nexIA/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Cloudflare R2 / S3
S3_BUCKET="${S3_BUCKET_NAME:-}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_REGION="${S3_REGION:-auto}"
S3_PATH="${S3_PATH:-backups/nexia}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$BACKUP_DIR/logs/backup_$DATE.log"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$BACKUP_DIR/logs/backup_$DATE.log"; }
log_warning() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$BACKUP_DIR/logs/backup_$DATE.log"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$BACKUP_DIR/logs/backup_$DATE.log"; }

# Criar diretórios
setup_dirs() {
    mkdir -p "$BACKUP_DIR/local/$DATE"
    mkdir -p "$BACKUP_DIR/logs"
    mkdir -p "$BACKUP_DIR/archive"
}

# Testar conexão
test_connection() {
    log_info "Testando conexão com PostgreSQL..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Conexão OK"
    else
        log_error "Falha na conexão com PostgreSQL"
        exit 1
    fi
}

# Realizar backup
perform_backup() {
    local backup_file="$BACKUP_DIR/local/$DATE/nexia_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    log_info "Iniciando backup do banco: $DB_NAME"
    
    # Dump do banco
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F p \
        --verbose \
        --no-owner \
        --no-acl \
        > "$backup_file" 2>>"$BACKUP_DIR/logs/backup_$DATE.log"
    
    if [ $? -eq 0 ]; then
        log_success "Backup criado: $(du -h "$backup_file" | cut -f1)"
        
        # Comprimir
        log_info "Comprimindo..."
        gzip -f "$backup_file"
        
        local final_size=$(du -h "$compressed_file" | cut -f1)
        log_success "Backup comprimido: $final_size"
        
        echo "$compressed_file"
    else
        log_error "Falha ao criar backup"
        exit 1
    fi
}

# Upload para R2/S3
upload_to_s3() {
    local file="$1"
    local filename=$(basename "$file")
    
    if [ -z "$S3_BUCKET" ] || [ -z "$S3_ACCESS_KEY" ]; then
        log_warning "S3 não configurado. Upload pulado."
        return 0
    fi
    
    log_info "Fazendo upload para S3/R2..."
    
    # Configurar AWS CLI se necessário
    if ! command -v aws &> /dev/null; then
        log_info "Instalando AWS CLI..."
        apt-get update && apt-get install -y awscli
    fi
    
    # Configurar credenciais temporárias
    export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
    export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
    
    if aws s3 cp "$file" "s3://${S3_BUCKET}/${S3_PATH}/${filename}" \
        --endpoint-url="$S3_ENDPOINT" \
        --region="$S3_REGION" 2>>"$BACKUP_DIR/logs/backup_$DATE.log"; then
        log_success "Upload concluído: s3://${S3_BUCKET}/${S3_PATH}/${filename}"
    else
        log_error "Falha no upload"
    fi
}

# Enviar notificação Discord
notify_discord() {
    local status="$1"
    local message="$2"
    local webhook="${DISCORD_WEBHOOK_URL:-}"
    
    if [ -z "$webhook" ]; then
        return 0
    fi
    
    local color="3066993"  # Verde
    [ "$status" = "error" ] && color="15158332"  # Vermelho
    
    local payload=$(cat <<EOF
{
    "embeds": [{
        "title": "NexIA Backup - ${status^^}",
        "description": "$message",
        "color": $color,
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "footer": {"text": "NexIA Backup System"}
    }]
}
EOF
)
    
    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" "$webhook" > /dev/null || true
}

# Limpar backups antigos
cleanup() {
    log_info "Limpando backups mais antigos que $RETENTION_DAYS dias..."
    find "$BACKUP_DIR/local" -name "nexia_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    log_success "Limpeza concluída"
}

# MAIN
main() {
    echo ""
    log_info "========================================"
    log_info "Iniciando Backup NexIA"
    log_info "Banco: $DB_NAME"
    log_info "Data: $(date)"
    log_info "========================================"
    
    setup_dirs
    test_connection
    
    local backup_file=$(perform_backup)
    upload_to_s3 "$backup_file"
    cleanup
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    
    log_success "========================================"
    log_success "Backup concluído!"
    log_success "Arquivo: $backup_file"
    log_success "Tamanho: $file_size"
    log_success "========================================"
    
    notify_discord "success" "✅ Backup concluído!\n📦 Tamanho: $file_size\n🗄️ Banco: $DB_NAME"
}

main "$@"
