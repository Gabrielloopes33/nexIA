/**
 * Script para aplicar migration de forma segura em produção
 * Adiciona a coluna assigned_to na tabela conversations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conectado!');

    // Verifica se a coluna já existe
    console.log('\n🔍 Verificando se a coluna assigned_to já existe...');
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'assigned_to'
    `;

    if (checkColumn.length > 0) {
      console.log('⚠️  A coluna assigned_to já existe. Nada a fazer.');
      return;
    }

    // Adiciona a coluna
    console.log('\n📝 Adicionando coluna assigned_to...');
    await prisma.$executeRaw`ALTER TABLE conversations ADD COLUMN assigned_to UUID NULL`;
    console.log('✅ Coluna adicionada!');

    // Cria índice
    console.log('\n📇 Criando índice...');
    await prisma.$executeRaw`CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to)`;
    console.log('✅ Índice criado!');

    // Adiciona comentário
    console.log('\n💬 Adicionando comentário...');
    await prisma.$executeRaw`COMMENT ON COLUMN conversations.assigned_to IS 'ID do usuário/agente atribuído a esta conversa'`;
    console.log('✅ Comentário adicionado!');

    console.log('\n🎉 Migration aplicada com sucesso!');
    console.log('\nResumo:');
    console.log('  - Coluna assigned_to adicionada (UUID, nullable)');
    console.log('  - Índice criado para melhor performance');
    console.log('  - Nenhum dado foi perdido ou alterado');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão fechada.');
  }
}

applyMigration();
