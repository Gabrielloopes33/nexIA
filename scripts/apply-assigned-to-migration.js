/**
 * Script para aplicar migration de forma segura em produção
 * Adiciona a coluna assigned_to na tabela conversations
 */

const { Client } = require('pg');

// URL do banco fornecida pelo usuário
const DATABASE_URL = 'postgresql://root:jVmcWsmLrxHr@49.13.228.89:5432/nexia_chat?sslmode=disable';

async function applyMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    // Verifica se a coluna já existe
    console.log('\n🔍 Verificando se a coluna assigned_to já existe...');
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'assigned_to'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⚠️  A coluna assigned_to já existe. Nada a fazer.');
      return;
    }

    // Adiciona a coluna
    console.log('\n📝 Adicionando coluna assigned_to...');
    await client.query(`
      ALTER TABLE conversations 
      ADD COLUMN assigned_to UUID NULL
    `);
    console.log('✅ Coluna adicionada!');

    // Cria índice
    console.log('\n📇 Criando índice...');
    await client.query(`
      CREATE INDEX idx_conversations_assigned_to 
      ON conversations(assigned_to)
    `);
    console.log('✅ Índice criado!');

    // Adiciona comentário
    console.log('\n💬 Adicionando comentário...');
    await client.query(`
      COMMENT ON COLUMN conversations.assigned_to IS 'ID do usuário/agente atribuído a esta conversa'
    `);
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
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

applyMigration();
