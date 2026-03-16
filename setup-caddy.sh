#!/bin/bash
# ============================================
# Script de instalação do Caddy Proxy
# para Supabase Self-Hosted com SSL
# ============================================

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Caddy Proxy - Supabase Self-Hosted${NC}"
echo -e "${BLUE}============================================${NC}"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker não encontrado. Instalando...${NC}"
    curl -fsSL https://get.docker.com | sh
fi

# Verificar se a rede do Supabase existe
if ! docker network ls | grep -q "supabase_network"; then
    echo -e "${YELLOW}Criando rede supabase_network...${NC}"
    docker network create supabase_network
fi

# Parar container existente se houver
if docker ps -a | grep -q "caddy-proxy"; then
    echo -e "${YELLOW}Parando container Caddy existente...${NC}"
    docker stop caddy-proxy || true
    docker rm caddy-proxy || true
fi

# Perguntar o domínio
echo ""
echo -e "${BLUE}Configuração do Domínio${NC}"
echo "Qual é o seu domínio para a API do Supabase?"
echo "Exemplo: api.nexiachat.com.br"
read -p "Domínio: " DOMAIN

# Atualizar Caddyfile com o domínio correto
sed -i "s/api.nexiachat.com.br/$DOMAIN/g" Caddyfile

echo ""
echo -e "${BLUE}Iniciando Caddy...${NC}"
docker-compose -f caddy-compose.yml up -d

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Caddy Proxy instalado com sucesso!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "URL da API: ${YELLOW}https://$DOMAIN${NC}"
echo -e "URL do Dashboard: ${YELLOW}http://49.13.228.89:8000${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Configure o DNS do seu domínio apontando para: 49.13.228.89"
echo "2. Aguarde 2-3 minutos para o SSL ser gerado"
echo "3. Atualize as variáveis de ambiente no frontend:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://$DOMAIN"
echo ""
echo -e "Para ver logs: ${YELLOW}docker logs -f caddy-proxy${NC}"
