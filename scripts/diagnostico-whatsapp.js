/**
 * Script de Diagnóstico WhatsApp
 * Verifica o estado das instâncias Evolution e WhatsApp Business API
 * 
 * Uso: node scripts/diagnostico-whatsapp.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticar() {
  console.log('🔍 Iniciando diagnóstico do WhatsApp...\n');

  try {
    // 1. Verificar instâncias Evolution
    console.log('📱 Instâncias Evolution:');
    const evolutionInstances = await prisma.evolutionInstance.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (evolutionInstances.length === 0) {
      console.log('  ⚠️  Nenhuma instância Evolution encontrada!');
    } else {
      evolutionInstances.forEach(inst => {
        console.log(`  • ${inst.name} (${inst.instanceName})`);
        console.log(`    Status: ${inst.status}`);
        console.log(`    Telefone: ${inst.phoneNumber || 'Não configurado'}`);
        console.log(`    Conectado em: ${inst.connectedAt ? inst.connectedAt.toISOString() : 'Nunca'}`);
        console.log(`    Última atividade: ${inst.lastActivityAt ? inst.lastActivityAt.toISOString() : 'Nunca'}`);
        console.log(`    Webhook: ${inst.webhookUrl || 'Não configurado'}`);
        console.log(`    Mensagens recebidas: ${inst.messagesReceived}`);
        console.log(`    Mensagens enviadas: ${inst.messagesSent}`);
        console.log('');
      });
    }

    // 2. Verificar instâncias WhatsApp Business API (Meta)
    console.log('📲 Instâncias WhatsApp Business API (Meta):');
    const metaInstances = await prisma.whatsAppInstance.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (metaInstances.length === 0) {
      console.log('  ⚠️  Nenhuma instância Meta encontrada!');
    } else {
      metaInstances.forEach(inst => {
        console.log(`  • ${inst.name}`);
        console.log(`    Status: ${inst.status}`);
        console.log(`    Phone Number ID: ${inst.phoneNumberId || 'Não configurado'}`);
        console.log(`    Número: ${inst.phoneNumber || 'Não configurado'}`);
        console.log(`    Display: ${inst.displayPhoneNumber || 'Não configurado'}`);
        console.log(`    Conectado em: ${inst.connectedAt ? inst.connectedAt.toISOString() : 'Nunca'}`);
        console.log('');
      });
    }

    // 3. Verificar logs de webhook recentes (últimas 24h)
    console.log('📝 Logs de Webhook (últimas 24h):');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentLogs = await prisma.metaWebhookLog.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        whatsappInstance: {
          select: { name: true, phoneNumber: true },
        },
      },
    });

    if (recentLogs.length === 0) {
      console.log('  ⚠️  Nenhum log de webhook nas últimas 24h!');
      console.log('      Isso indica que o webhook não está recebendo eventos.\n');
    } else {
      console.log(`  ✓ ${recentLogs.length} eventos recebidos:\n`);
      recentLogs.forEach(log => {
        console.log(`    [${log.createdAt.toISOString()}] ${log.eventType}`);
        console.log(`    Instância: ${log.whatsappInstance?.name || 'N/A'}`);
        console.log(`    Processado: ${log.processed ? '✓' : '✗'}`);
        if (log.errorMessage) {
          console.log(`    ❌ Erro: ${log.errorMessage}`);
        }
        console.log('');
      });
    }

    // 4. Verificar conversas recentes
    console.log('💬 Conversas recentes (últimas 24h):');
    const recentConversations = await prisma.conversation.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        contact: {
          select: { name: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (recentConversations.length === 0) {
      console.log('  ⚠️  Nenhuma conversa criada nas últimas 24h!\n');
    } else {
      console.log(`  ✓ ${recentConversations.length} conversas:\n`);
      recentConversations.forEach(conv => {
        console.log(`    [${conv.createdAt.toISOString()}] ${conv.contact.name || 'Sem nome'} (${conv.contact.phone})`);
        if (conv.messages[0]) {
          console.log(`    Última mensagem: ${conv.messages[0].content.substring(0, 50)}...`);
        }
        console.log('');
      });
    }

    // 5. Verificar mensagens recentes
    console.log('📨 Mensagens recentes (últimas 24h):');
    const recentMessages = await prisma.message.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentMessages.length === 0) {
      console.log('  ⚠️  Nenhuma mensagem nas últimas 24h!\n');
    } else {
      const inbound = recentMessages.filter(m => m.direction === 'INBOUND').length;
      const outbound = recentMessages.filter(m => m.direction === 'OUTBOUND').length;
      console.log(`  ✓ Total: ${recentMessages.length} (Recebidas: ${inbound}, Enviadas: ${outbound})\n`);
    }

    // 6. Verificar variáveis de ambiente
    console.log('🔧 Variáveis de ambiente:');
    console.log(`  EVOLUTION_API_URL: ${process.env.EVOLUTION_API_URL ? '✓ Configurado' : '✗ Não configurado'}`);
    console.log(`  EVOLUTION_API_KEY: ${process.env.EVOLUTION_API_KEY ? '✓ Configurado' : '✗ Não configurado'}`);
    console.log(`  EVOLUTION_WEBHOOK_SECRET: ${process.env.EVOLUTION_WEBHOOK_SECRET ? '✓ Configurado' : '✗ Não configurado'}`);
    console.log(`  WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? '✓ Configurado' : '✗ Não configurado'}`);
    console.log(`  WHATSAPP_APP_SECRET: ${process.env.WHATSAPP_APP_SECRET ? '✓ Configurado' : '✗ Não configurado'}`);
    console.log(`  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Não configurado'}`);
    console.log('');

    // Resumo
    console.log('📊 RESUMO DO DIAGNÓSTICO:');
    console.log('═══════════════════════════════════════════════════════');
    
    const temInstanciaConectada = evolutionInstances.some(i => i.status === 'CONNECTED');
    const temLogsRecentes = recentLogs.length > 0;
    const temMensagensRecentes = recentMessages.length > 0;

    if (!temInstanciaConectada && evolutionInstances.length > 0) {
      console.log('❌ PROBLEMA: Instância Evolution existe mas NÃO está conectada');
      console.log('   → Solução: Reconecte a instância escaneando o QR Code\n');
    } else if (evolutionInstances.length === 0 && metaInstances.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma instância WhatsApp configurada');
      console.log('   → Solução: Crie uma instância Evolution ou conecte via Meta API\n');
    }

    if (!temLogsRecentes && temInstanciaConectada) {
      console.log('❌ PROBLEMA: Instância conectada mas SEM logs de webhook');
      console.log('   → Possíveis causas:');
      console.log('     1. Webhook não configurado na Evolution');
      console.log('     2. URL do webhook incorreta');
      console.log('     3. Evolution API não está enviando eventos');
      console.log('     4. Número foi desconectado do WhatsApp (saiu do celular)\n');
    }

    if (!temMensagensRecentes && temLogsRecentes) {
      console.log('⚠️  ATENÇÃO: Logs existem mas mensagens não foram salvas');
      console.log('   → Verifique os logs de erro do webhook\n');
    }

    if (temInstanciaConectada && temLogsRecentes) {
      console.log('✅ Instância e webhook parecem OK');
      console.log('   → Teste enviando uma mensagem para o número\n');
    }

    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
