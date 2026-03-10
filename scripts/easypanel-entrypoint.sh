#!/bin/sh
# ============================================
# Entrypoint para EasyPanel
# Executa migrações antes de iniciar a aplicação
# ============================================

set -e

echo "🚀 Iniciando NexIA no EasyPanel..."
echo ""

# Verificar variáveis obrigatórias
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não configurada"
    echo "Configure no EasyPanel: Environment Variables"
    exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
    echo "⚠️  AVISO: AUTH_SECRET não configurada"
    echo "Gere uma chave com: openssl rand -hex 32"
fi

# Aguardar banco estar pronto (se for interno)
echo "⏳ Aguardando banco de dados..."
sleep 5

# Testar conexão com banco
echo "🔌 Testando conexão com PostgreSQL..."
for i in 1 2 3 4 5; do
    if npx prisma db execute --url "$DATABASE_URL" --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Conexão com banco estabelecida!"
        break
    else
        echo "   Tentativa $i/5..."
        sleep 3
    fi
done

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Aplicar migrações
echo "🔄 Aplicando migrações do banco..."
npx prisma migrate deploy || {
    echo "⚠️  Migrate falhou, tentando db push..."
    npx prisma db push --accept-data-loss
}

# Verificar se tabelas do pipeline existem
echo "📊 Verificando tabelas do Pipeline..."
PIPELINE_CHECK=$(npx prisma db execute --url "$DATABASE_URL" --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'PipelineStage';" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0")

if [ "$PIPELINE_CHECK" = "0" ]; then
    echo "📋 Tabelas do Pipeline não encontradas. Criando..."
    # Executar script SQL de migração do pipeline
    if [ -f "scripts/migrate-pipeline.sql" ]; then
        npx prisma db execute --url "$DATABASE_URL" --file scripts/migrate-pipeline.sql || true
    fi
fi

echo ""
echo "✅ Setup completo! Iniciando aplicação..."
echo ""

# Iniciar aplicação
exec "$@"
