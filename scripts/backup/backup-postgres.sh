#!/bin/bash
# ============================================
# PostgreSQL Backup Script - NexIA
# ============================================
# 
# Script avançado de backup com:
# - Dump completo do banco
# - Compressão
# - Criptografia opcional (GPG)
# - Upload para S3
# - Notificações
#
# Uso: ./backup-postgres.sh [full|incremental|schema-only]
#
# ============================================

set -euo pipefail

# ============================================
# Configurações
# ============================================
BACKUP_TYPE="${1:-full}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)
BACKUP_DIR="${BACKUP_DIR:-/backup}"
LOCAL_BACKUP_DIR="${BACKUP_DIR}/local"
S3_BUCKET="${S3_BUCKET_NAME:-}"
S3_PATH="${S3_PATH:-backups/nexia}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# PostgreSQL Config
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-nexia}"
DB_USER="${POSTGRES_USER:-nexia}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Funções
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    local deps=("pg_dump" "pg_dumpall" "gzip")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Dependência não encontrada: $dep"
            exit 1
        fi
    done
}

# Criar diretórios
setup_directories() {
    mkdir -p "$LOCAL_BACKUP_DIR"/{"$DATE",archive,logs}
    log_info "Diretórios de backup criados"
}

# Testar conexão com banco
test_connection() {
    log_info "Testando conexão com PostgreSQL..."
    if PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        log_success "Conexão com PostgreSQL OK"
    else
        log_error "Não foi possível conectar ao PostgreSQL"
        send_notification "error" "Falha na conexão com PostgreSQL"
        exit 1
    fi
}

# Realizar backup
perform_backup() {
    local backup_file="$LOCAL_BACKUP_DIR/$DATE/nexia_${BACKUP_TYPE}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    log_info "Iniciando backup do tipo: $BACKUP_TYPE"
    log_info "Arquivo de destino: $backup_file"
    
    case "$BACKUP_TYPE" in
        full)
            PGPASSWORD="$DB_PASSWORD" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                -F p \
                --verbose \
                --no-owner \
                --no-acl \
                --clean \
                --if-exists \
                > "$backup_file" 2>"$LOCAL_BACKUP_DIR/logs/backup_${TIMESTAMP}.log"
            ;;
            
        schema-only)
            PGPASSWORD="$DB_PASSWORD" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                --schema-only \
                --verbose \
                > "$backup_file" 2>"$LOCAL_BACKUP_DIR/logs/backup_${TIMESTAMP}.log"
            ;;
            
        data-only)
            PGPASSWORD="$DB_PASSWORD" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                --data-only \
                --verbose \
                > "$backup_file" 2>"$LOCAL_BACKUP_DIR/logs/backup_${TIMESTAMP}.log"
            ;;
            
        globals)
            PGPASSWORD="$DB_PASSWORD" pg_dumpall \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                --globals-only \
                > "$backup_file" 2>"$LOCAL_BACKUP_DIR/logs/backup_${TIMESTAMP}.log"
            ;;
            
        *)
            log_error "Tipo de backup desconhecido: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log_success "Backup criado com sucesso"
        
        # Comprimir
        log_info "Comprimindo backup..."
        gzip -f "$backup_file"
        
        local final_size=$(du -h "$compressed_file" | cut -f1)
        log_success "Backup comprimido: $final_size"
        
        # Criptografar se GPG_PASSPHRASE estiver definido
        if [ -n "${GPG_PASSPHRASE:-}" ]; then
            log_info "Criptografando backup..."
            gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
                --symmetric --cipher-algo AES256 \
                -o "${compressed_file}.gpg" "$compressed_file"
            rm "$compressed_file"
            compressed_file="${compressed_file}.gpg"
            log_success "Backup criptografado"
        fi
        
        echo "$compressed_file"
    else
        log_error "Falha ao criar backup"
        send_notification "error" "Falha ao criar backup do PostgreSQL"
        exit 1
    fi
}

# Upload para S3
upload_to_s3() {
    local file="$1"
    local filename=$(basename "$file")
    
    if [ -z "$S3_BUCKET" ]; then
        log_warning "S3_BUCKET não configurado. Pulando upload."
        return 0
    fi
    
    log_info "Fazendo upload para S3..."
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$file" "s3://${S3_BUCKET}/${S3_PATH}/${filename}" \
            --storage-class STANDARD_IA
        log_success "Upload para S3 concluído"
    elif command -v rclone &> /dev/null; then
        rclone copy "$file" "s3:${S3_BUCKET}/${S3_PATH}/"
        log_success "Upload via rclone concluído"
    else
        log_warning "AWS CLI ou rclone não encontrado. Upload pulado."
    fi
}

# Limpar backups antigos
cleanup_old_backups() {
    log_info "Limpando backups mais antigos que $RETENTION_DIAS dias..."
    
    find "$LOCAL_BACKUP_DIR" -name "nexia_*.sql.gz*" -mtime +$RETENTION_DAYS -delete
    find "$LOCAL_BACKUP_DIR" -name "backup_*.log" -mtime +$RETENTION_DAYS -delete
    
    # Limpar diretórios vazios
    find "$LOCAL_BACKUP_DIR" -type d -empty -delete 2>/dev/null || true
    
    log_success "Limpeza concluída"
}

# Verificar integridade do backup
verify_backup() {
    local file="$1"
    
    log_info "Verificando integridade do backup..."
    
    # Verificar se arquivo existe e não está vazio
    if [ ! -s "$file" ]; then
        log_error "Arquivo de backup está vazio ou não existe"
        return 1
    fi
    
    # Verificar se gzip está válido
    if [[ "$file" == *.gz && ! "$file" == *.gpg ]]; then
        if gzip -t "$file" 2>/dev/null; then
            log_success "Integridade do backup verificada"
            return 0
        else
            log_error "Arquivo de backup corrompido"
            return 1
        fi
    fi
    
    return 0
}

# Enviar notificação
send_notification() {
    local status="$1"
    local message="$2"
    local webhook_url="${NOTIFICATION_WEBHOOK_URL:-}"
    
    if [ -z "$webhook_url" ]; then
        return 0
    fi
    
    local color="good"
    [ "$status" = "error" ] && color="danger"
    
    local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "NexIA Backup - ${status^^}",
        "text": "$message",
        "fields": [
            {"title": "Tipo", "value": "$BACKUP_TYPE", "short": true},
            {"title": "Data", "value": "$(date)", "short": true}
        ],
        "footer": "NexIA Backup System"
    }]
}
EOF
)
    
    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" "$webhook_url" > /dev/null || true
}

# ============================================
# Main
# ============================================
main() {
    log_info "=========================================="
    log_info "Iniciando Backup NexIA"
    log_info "Tipo: $BACKUP_TYPE"
    log_info "Data: $(date)"
    log_info "=========================================="
    
    check_dependencies
    setup_directories
    test_connection
    
    # Realizar backup
    local backup_file=$(perform_backup)
    
    # Verificar integridade
    verify_backup "$backup_file"
    
    # Upload para S3
    upload_to_s3 "$backup_file"
    
    # Limpar backups antigos
    cleanup_old_backups
    
    # Notificar sucesso
    local file_size=$(du -h "$backup_file" | cut -f1)
    send_notification "success" "Backup concluído com sucesso! Tamanho: $file_size"
    
    log_success "=========================================="
    log_success "Backup concluído com sucesso!"
    log_success "Arquivo: $backup_file"
    log_success "Tamanho: $file_size"
    log_success "=========================================="
}

# Executar main
main "$@"
