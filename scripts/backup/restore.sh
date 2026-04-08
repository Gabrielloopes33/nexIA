#!/bin/bash
# ============================================
# PostgreSQL Restore Script - NexIA (PM2 Version)
# ============================================

set -euo pipefail

# Carregar variáveis
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../../.env.backup" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/../../.env.backup" | xargs)
fi

# Configurações
DB_HOST="${DB_HOST:-49.13.228.89}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nexia_chat}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-jVmcWsmLrxHr}"

BACKUP_FILE="${1:-}"
DRY_RUN="${DRY_RUN:-false}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    echo "Uso: $0 <arquivo_backup.sql.gz>"
    echo ""
    echo "Exemplos:"
    echo "  $0 /var/www/nexIA/backups/local/20240115/nexia_20240115_020000.sql.gz"
    echo "  DRY_RUN=true $0 backup.sql.gz  # Simulação"
    echo ""
    exit 1
}

# Validar arquivo
validate_file() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Arquivo não especificado"
        usage
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Arquivo não encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "Arquivo: $BACKUP_FILE"
    log_info "Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"
}

# Backup de segurança antes de restaurar
safety_backup() {
    if [ "$DRY_RUN" = "true" ]; then
        return 0
    fi
    
    local safety_file="/tmp/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    log_warning "Criando backup de segurança do estado atual..."
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$safety_file"
    
    log_success "Backup de segurança: $safety_file"
    echo "$safety_file"
}

# Restaurar
perform_restore() {
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Simulando restauração..."
        log_info "[DRY RUN] Comando: gunzip < $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
        return 0
    fi
    
    log_info "Restaurando backup..."
    log_warning "Isso vai SUBSTITUIR todos os dados atuais!"
    
    # Terminar conexões
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid) 
        FROM pg_stat_activity 
        WHERE pg_stat_activity.datname = '$DB_NAME' 
        AND pid <> pg_backend_pid();
    " 2>/dev/null || true
    
    # Restaurar
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --set ON_ERROR_STOP=on
    else
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --set ON_ERROR_STOP=on \
            -f "$BACKUP_FILE"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Restauração concluída!"
    else
        log_error "Falha na restauração"
        exit 1
    fi
}

# Verificar integridade
verify_restore() {
    log_info "Verificando integridade..."
    
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)
    
    log_info "Tabelas restauradas: $table_count"
    
    local contact_count=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT count(*) FROM contacts;" 2>/dev/null | xargs || echo "0")
    
    log_info "Contatos: $contact_count"
    log_success "Verificação concluída!"
}

# MAIN
main() {
    echo ""
    log_info "========================================"
    log_info "Restauração NexIA PostgreSQL"
    log_info "========================================"
    
    validate_file
    
    if [ "$DRY_RUN" != "true" ]; then
        log_warning "⚠️  ATENÇÃO: Isso vai APAGAR os dados atuais!"
        read -p "Digite 'RESTAURAR' para confirmar: " confirm
        if [ "$confirm" != "RESTAURAR" ]; then
            log_info "Operação cancelada"
            exit 0
        fi
    fi
    
    local safety_file=$(safety_backup)
    perform_restore
    verify_restore
    
    log_success "========================================"
    log_success "RESTAURAÇÃO CONCLUÍDA!"
    [ -n "$safety_file" ] && log_info "Backup de segurança: $safety_file"
    log_success "========================================"
}

main "$@"
