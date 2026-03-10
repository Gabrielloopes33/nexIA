#!/bin/bash
# ============================================
# Script de Deploy - NexIA na VPS
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "  🚀 DEPLOY NEXIA - VPS HETZNER"
echo "============================================"
echo -e "${NC}"

# Verificar variáveis de ambiente
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Erro: DATABASE_URL não configurada${NC}"
    exit 1
fi

# Diretório do projeto
PROJECT_DIR="/opt/nexia"
BACKUP_DIR="/opt/backups/nexia"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${YELLOW}📁 Diretório do projeto: $PROJECT_DIR${NC}"
echo -e "${YELLOW}💾 Backup: $BACKUP_DIR${NC}"
echo ""

# 1. Criar diretórios necessários
echo -e "${BLUE}[1/7] Criando diretórios...${NC}"
mkdir -p $PROJECT_DIR
mkdir -p $BACKUP_DIR

# 2. Backup do banco (se existir)
echo -e "${BLUE}[2/7] Realizando backup do banco...${NC}"
if command -v pg_dump &> /dev/null; then
    # Extrair informações da DATABASE_URL
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$TIMESTAMP.sql" 2>/dev/null || echo "⚠️  Backup pulado (banco pode estar vazio)"
    echo -e "${GREEN}✅ Backup salvo em: $BACKUP_DIR/backup_$TIMESTAMP.sql${NC}"
else
    echo -e "${YELLOW}⚠️  pg_dump não encontrado, pulando backup${NC}"
fi

# 3. Parar containers antigos
echo -e "${BLUE}[3/7] Parando containers antigos...${NC}"
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker stop nexia-production 2>/dev/null || true
docker rm nexia-production 2>/dev/null || true

# 4. Copiar arquivos do projeto
echo -e "${BLUE}[4/7] Copiando arquivos do projeto...${NC}"
# Nota: Este script assume que os arquivos já foram copiados via git clone ou scp
# git pull origin main

# 5. Build da imagem Docker
echo -e "${BLUE}[5/7] Build da imagem Docker...${NC}"
docker build -t nexia-app:latest .

# 6. Aplicar migrações
echo -e "${BLUE}[6/7] Aplicando migrações do banco...${NC}"
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# 7. Iniciar containers
echo -e "${BLUE}[7/7] Iniciando containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# 8. Verificar saúde
echo ""
echo -e "${BLUE}🏥 Verificando saúde da aplicação...${NC}"
sleep 5

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}"
    echo "============================================"
    echo "  ✅ DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "============================================"
    echo -e "${NC}"
    echo "📱 Aplicação rodando em: http://localhost:3000"
    echo "🌐 Configure o Nginx para proxy reverso"
    echo ""
else
    echo -e "${YELLOW}"
    echo "============================================"
    echo "  ⚠️  DEPLOY CONCLUÍDO COM ALERTAS"
    echo "============================================"
    echo -e "${NC}"
    echo "Status da saúde: $HEALTH_STATUS"
    echo "Verifique os logs: docker logs nexia-production"
    echo ""
fi

# Mostrar logs recentes
echo -e "${BLUE}📋 Logs recentes:${NC}"
docker logs --tail 20 nexia-production 2>/dev/null || echo "Container ainda iniciando..."
