#!/bin/bash
# ============================================
# PostgreSQL Restore Script - NexIA
# ============================================
#
# Script de restauração de backup com:
# - Validação do arquivo
# - Backup automático antes da restore
# - Verificação pós-restauração
#
# Uso: ./restore-postgres.sh <arquivo_backup> [nome_banco_destino]
#
# ============================================

set -euo pipefail

# ============================================
# Configurações
# ============================================
BACKUP_FILE="${1:-}"
TARGET_DB="${2:-}"
DRY_RUN="${DRY_RUN:-false}"

# PostgreSQL Config
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-nexia}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# Funções
# ============================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar uso
usage() {
    cat <<EOF
Uso: $0 <arquivo_backup> [nome_banco_destino]

Opções:
    DRY_RUN=true    $0 backup.sql.gz    # Simulação (não executa)
    
Exemplos:
    $0 /backup/nexia_full_20240115_020000.sql.gz
    $0 /backup/nexia_full_20240115_020000.sql.gz nexia_restored
    DRY_RUN=true $0 backup.sql.gz

EOF
    exit 1
}

# Validar arquivo de backup
validate_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Arquivo de backup não especificado"
        usage
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Arquivo não encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "Validando arquivo de backup..."
    
    # Verificar se é arquivo gzip
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
            log_error "Arquivo gzip corrompido ou inválido"
            exit 1
        fi
        log_success "Arquivo gzip válido"
    fi
    
    # Verificar se é criptografado
    if [[ "$BACKUP_FILE" == *.gpg ]]; then
        if [ -z "${GPG_PASSPHRASE:-}" ]; then
            log_error "Arquivo criptografado mas GPG_PASSPHRASE não definido"
            exit 1
        fi
        log_info "Arquivo criptografado detectado"
    fi
}

# Criar backup de segurança antes de restaurar
create_safety_backup() {
    if [ "$DRY_RUN" = "true" ]; then
        return 0
    fi
    
    local safety_file="/tmp/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    log_warning "Criando backup de segurança do banco atual..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose | gzip > "$safety_file"
    
    log_success "Backup de segurança criado: $safety_file"
    echo "$safety_file"
}

# Descriptografar se necessário
decrypt_if_needed() {
    local file="$1"
    
    if [[ "$file" == *.gpg ]]; then
        log_info "Descriptografando arquivo..."
        local decrypted="${file%.gpg}"
        gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
            -d -o "$decrypted" "$file"
        echo "$decrypted"
    else
        echo "$file"
    fi
}

# Preparar banco para restauração
prepare_database() {
    local target="${TARGET_DB:-$DB_NAME}"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Prepararia banco: $target"
        return 0
    fi
    
    log_info "Preparando banco de dados: $target"
    
    # Se for banco diferente, criar
    if [ "$target" != "$DB_NAME" ]; then
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -c "DROP DATABASE IF EXISTS \"$target\";" || true
            
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -c "CREATE DATABASE \"$target\";"
        
        log_success "Banco $target criado"
    else
        # Terminar conexões existentes
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$target' AND pid <> pg_backend_pid();" || true
    fi
}

# Restaurar backup
perform_restore() {
    local file="$1"
    local target="${TARGET_DB:-$DB_NAME}"
    
    log_info "Iniciando restauração para: $target"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Restauração simulada"
        return 0
    fi
    
    # Descomprimir e restaurar
    if [[ "$file" == *.gz ]]; then
        gunzip -c "$file" | PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$target" \
            --set ON_ERROR_STOP=on
    else
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$target" \
            --set ON_ERROR_STOP=on \
            -f "$file"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Restauração concluída com sucesso"
    else
        log_error "Falha na restauração"
        exit 1
    fi
}

# Verificar integridade pós-restauração
verify_restore() {
    local target="${TARGET_DB:-$DB_NAME}"
    
    log_info "Verificando integridade da restauração..."
    
    # Contar tabelas
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$target" \
        -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
    
    log_info "Tabelas restauradas: $(echo $table_count | xargs)"
    
    # Contar registros principais
    local contact_count=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$target" \
        -t -c "SELECT count(*) FROM contacts;" 2>/dev/null || echo "N/A")
    
    log_info "Contatos: $(echo $contact_count | xargs)"
    
    log_success "Verificação concluída"
}

# ============================================
# Main
# ============================================
main() {
    log_info "=========================================="
    log_info "Restauração NexIA PostgreSQL"
    log_info "Arquivo: $BACKUP_FILE"
    log_info "Data: $(date)"
    [ "$DRY_RUN" = "true" ] && log_warning "MODO SIMULAÇÃO (DRY RUN)"
    log_info "=========================================="
    
    # Validações
    validate_backup_file
    
    # Backup de segurança
    local safety_backup=$(create_safety_backup)
    
    # Descriptografar se necessário
    local processed_file=$(decrypt_if_needed "$BACKUP_FILE")
    
    # Preparar banco
    prepare_database
    
    # Restaurar
    perform_restore "$processed_file"
    
    # Verificar
    verify_restore
    
    log_success "=========================================="
    log_success "Restauração concluída com sucesso!"
    [ -n "$safety_backup" ] && log_info "Backup de segurança: $safety_backup"
    log_success "=========================================="
    
    # Limpar arquivo descriptografado temporário
    if [[ "$processed_file" != "$BACKUP_FILE" ]]; then
        rm -f "$processed_file"
    fi
}

# Confirmar se não for dry run
if [ "$DRY_RUN" != "true" ]; then
    log_warning "ATENÇÃO: Isso irá substituir dados no banco!"
    log_info "Use DRY_RUN=true para simular"
    read -p "Continuar? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Operação cancelada"
        exit 0
    fi
fi

main "$@"
