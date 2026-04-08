#!/bin/bash
# ============================================
# Health Check Completo - NexIA
# ============================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "
╔═══════════════════════════════════════════════════════════╗
║              🔍 NexIA - Health Check                      ║
╚═══════════════════════════════════════════════════════════╝
"

# ============================================
# 1. Verificar Containers
# ============================================
echo "📦 Containers Docker:"
echo "---------------------"

containers=("nexia-app" "nexia-db" "nexia-prometheus" "nexia-grafana" "nexia-backup")
for container in "${containers[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        check_pass "$container está rodando"
    else
        check_fail "$container NÃO está rodando"
    fi
done

echo ""

# ============================================
# 2. Verificar Health Endpoints
# ============================================
echo "🏥 Health Endpoints:"
echo "--------------------"

# App health
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    check_pass "NexIA App (/api/health)"
else
    check_fail "NexIA App indisponível"
fi

# Prometheus
if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
    check_pass "Prometheus (/-/healthy)"
else
    check_fail "Prometheus indisponível"
fi

# Grafana
if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    check_pass "Grafana (/api/health)"
else
    check_fail "Grafana indisponível"
fi

echo ""

# ============================================
# 3. Verificar Banco de Dados
# ============================================
echo "🗄️  Banco de Dados:"
echo "------------------"

if docker exec nexia-db pg_isready -U nexia > /dev/null 2>&1; then
    check_pass "PostgreSQL respondendo"
    
    # Verificar conexões
    conn_count=$(docker exec nexia-db psql -U nexia -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
    if [ "$conn_count" -lt 80 ]; then
        check_pass "Conexões ativas: $conn_count"
    else
        check_warn "Muitas conexões: $conn_count"
    fi
    
    # Verificar tamanho do banco
    db_size=$(docker exec nexia-db psql -U nexia -t -c "SELECT pg_size_pretty(pg_database_size('nexia'));" 2>/dev/null | xargs)
    check_pass "Tamanho do banco: $db_size"
else
    check_fail "PostgreSQL não responde"
fi

echo ""

# ============================================
# 4. Verificar Backups
# ============================================
echo "💾 Backups:"
echo "-----------"

# Verificar último backup
latest_backup=$(find ./backups/local -name "nexia_full_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$latest_backup" ]; then
    backup_date=$(stat -c %y "$latest_backup" 2>/dev/null | cut -d' ' -f1)
    check_pass "Último backup: $backup_date"
    
    # Verificar se backup tem menos de 24h
    backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup" 2>/dev/null)) / 3600 ))
    if [ "$backup_age" -lt 24 ]; then
        check_pass "Backup recente (< 24h)"
    else
        check_warn "Backup antigo ($backup_age horas)"
    fi
else
    check_fail "Nenhum backup encontrado"
fi

# Verificar serviço de backup
if docker ps --format "{{.Names}}" | grep -q "^nexia-backup$"; then
    check_pass "Serviço de backup ativo"
else
    check_warn "Serviço de backup não está rodando"
fi

echo ""

# ============================================
# 5. Verificar Recursos
# ============================================
echo "💻 Recursos do Sistema:"
echo "-----------------------"

# CPU
if command -v top > /dev/null 2>&1; then
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage < 80" | bc -l) )); then
        check_pass "CPU: ${cpu_usage}%"
    else
        check_warn "CPU alta: ${cpu_usage}%"
    fi
fi

# Memória
if command -v free > /dev/null 2>&1; then
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$mem_usage" -lt 85 ]; then
        check_pass "Memória: ${mem_usage}%"
    else
        check_warn "Memória alta: ${mem_usage}%"
    fi
fi

# Disco
disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ "$disk_usage" -lt 80 ]; then
    check_pass "Disco: ${disk_usage}%"
else
    check_warn "Disco quase cheio: ${disk_usage}%"
fi

echo ""

# ============================================
# 6. Verificar SSL (se configurado)
# ============================================
if command -v openssl > /dev/null 2>&1; then
    echo "🔒 SSL/TLS:"
    echo "----------"
    
    # Verificar expiração do certificado (ajuste o domínio)
    domain="${DOMAIN:-localhost}"
    if [ "$domain" != "localhost" ]; then
        expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        if [ -n "$expiry" ]; then
            expiry_epoch=$(date -d "$expiry" +%s)
            now_epoch=$(date +%s)
            days_until=$(( (expiry_epoch - now_epoch) / 86400 ))
            
            if [ "$days_until" -gt 30 ]; then
                check_pass "SSL válido por $days_until dias"
            elif [ "$days_until" -gt 7 ]; then
                check_warn "SSL expira em $days_until dias"
            else
                check_fail "SSL expira em $days_until dias!"
            fi
        fi
    fi
    
    echo ""
fi

# ============================================
# Resumo
# ============================================
echo "═══════════════════════════════════════════════════════════"
echo "                    📊 RESUMO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "Checks OK:    ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Falha: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os sistemas operacionais!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Existem problemas que precisam de atenção${NC}"
    exit 1
fi
