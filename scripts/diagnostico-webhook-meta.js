/**
 * Diagnóstico específico para Webhook WhatsApp Meta
 * Verifica se o webhook está recebendo e processando mensagens corretamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticoWebhookMeta() {
  console.log('🔍 Diagnóstico Webhook WhatsApp Business API (Meta)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Verificar variáveis de ambiente
    console.log('1️⃣  Variáveis de Ambiente do Webhook:\n');
    
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    console.log(`   WHATSAPP_APP_SECRET: ${appSecret ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    console.log(`   WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${webhookVerifyToken ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    console.log('');

    if (!appSecret) {
      console.log('   ⚠️  PROBLEMA CRÍTICO: APP_SECRET não configurado!');
      console.log('   → O webhook vai rejeitar mensagens por falta de assinatura válida.\n');
    }

    // 2. Verificar instâncias WhatsApp
    console.log('2️⃣  Instâncias WhatsApp Business API:\n');
    
    const instances = await prisma.whatsAppInstance.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    if (instances.length === 0) {
      console.log('   ❌ Nenhuma instância encontrada!\n');
    } else {
      instances.forEach(inst => {
        console.log(`   📱 ${inst.name}`);
        console.log(`      ID: ${inst.id}`);
        console.log(`      Status: ${inst.status}`);
        console.log(`      phoneNumberId: ${inst.phoneNumberId || '❌ NÃO CONFIGURADO'}`);
        console.log(`      phoneNumber: ${inst.phoneNumber || 'N/A'}`);
        console.log(`      displayPhoneNumber: ${inst.displayPhoneNumber || 'N/A'}`);
        console.log(`      wabaId: ${inst.wabaId || 'N/A'}`);
        console.log(`      tokenExpiresAt: ${inst.tokenExpiresAt ? inst.tokenExpiresAt.toISOString() : 'N/A'}`);
        
        // Alertas específicos
        if (!inst.phoneNumberId) {
          console.log(`      ⚠️  ALERTA: phoneNumberId não configurado!`);
          console.log(`         → O webhook não conseguirá encontrar esta instância.`);
        }
        if (inst.status !== 'CONNECTED') {
          console.log(`      ⚠️  ALERTA: Instância não está conectada!`);
        }
        if (inst.tokenExpiresAt && inst.tokenExpiresAt < new Date()) {
          console.log(`      🔴 CRÍTICO: Token expirado!`);
        }
        console.log('');
      });
    }

    // 3. Verificar logs de webhook recentes
    console.log('3️⃣  Logs de Webhook (últimas 24h):\n');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const logs = await prisma.metaWebhookLog.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        whatsappInstance: {
          select: { name: true, phoneNumber: true },
        },
      },
    });

    if (logs.length === 0) {
      console.log('   ❌ Nenhum log nas últimas 24h!');
      console.log('   → A Meta não está enviando webhooks para este endpoint.\n');
      console.log('   Possíveis causas:');
      console.log('   1. URL do webhook não configurada no Meta Developers');
      console.log('   2. Verify token incorreto');
      console.log('   3. App não aprovado para receber webhooks');
      console.log('   4. Assinatura do webhook inválida (APP_SECRET errado)\n');
    } else {
      console.log(`   ✅ ${logs.length} logs encontrados\n`);
      
      // Agrupar por tipo
      const byType = {};
      const byInstance = {};
      let errors = 0;
      
      logs.forEach(log => {
        byType[log.eventType] = (byType[log.eventType] || 0) + 1;
        const instName = log.whatsappInstance?.name || 'Sem instância';
        byInstance[instName] = (byInstance[instName] || 0) + 1;
        if (log.errorMessage) errors++;
      });

      console.log('   Por tipo de evento:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
      console.log('');

      console.log('   Por instância:');
      Object.entries(byInstance).forEach(([name, count]) => {
        console.log(`   - ${name}: ${count}`);
      });
      console.log('');

      if (errors > 0) {
        console.log(`   ⚠️  ${errors} logs com erro\n`);
      }

      // Mostrar últimos logs
      console.log('   Últimos 5 logs:');
      logs.slice(0, 5).forEach(log => {
        console.log(`   [${log.createdAt.toISOString()}] ${log.eventType}`);
        console.log(`   Instância: ${log.whatsappInstance?.name || 'N/A'}`);
        console.log(`   Processado: ${log.processed ? '✅' : '❌'}`);
        if (log.errorMessage) {
          console.log(`   Erro: ${log.errorMessage}`);
        }
        console.log('');
      });
    }

    // 4. Verificar logs de erro específicos
    console.log('4️⃣  Logs com Erro:\n');
    
    const errorLogs = await prisma.metaWebhookLog.findMany({
      where: {
        errorMessage: { not: null },
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (errorLogs.length === 0) {
      console.log('   ✅ Nenhum erro encontrado\n');
    } else {
      console.log(`   ❌ ${errorLogs.length} erros encontrados:\n`);
      errorLogs.forEach(log => {
        console.log(`   [${log.createdAt.toISOString()}] ${log.eventType}`);
        console.log(`   Erro: ${log.errorMessage}`);
        console.log('');
      });
    }

    // 5. Verificar se há mensagens não salvas
    console.log('5️⃣  Verificação de Mensagens:\n');
    
    const recentMessages = await prisma.message.findMany({
      where: {
        createdAt: { gte: yesterday },
        direction: 'INBOUND',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        contact: { select: { name: true, phone: true } },
        conversation: { select: { id: true } },
      },
    });

    if (recentMessages.length === 0) {
      console.log('   ❌ Nenhuma mensagem INBOUND recebida nas últimas 24h!\n');
    } else {
      console.log(`   ✅ ${recentMessages.length} mensagens recebidas:\n`);
      recentMessages.forEach(msg => {
        console.log(`   [${msg.createdAt.toISOString()}] ${msg.contact?.name || 'Desconhecido'}`);
        console.log(`   ${msg.content.substring(0, 50)}...`);
        console.log('');
      });
    }

    // 6. Diagnóstico final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 DIAGNÓSTICO FINAL:\n');

    const temAppSecret = !!appSecret;
    const temInstancia = instances.length > 0;
    const temPhoneNumberId = instances.some(i => i.phoneNumberId);
    const temInstanciaConectada = instances.some(i => i.status === 'CONNECTED');
    const temTokenExpirado = instances.some(i => i.tokenExpiresAt && i.tokenExpiresAt < new Date());
    const temLogs = logs.length > 0;

    if (!temAppSecret) {
      console.log('🔴 CRÍTICO: APP_SECRET não configurado');
      console.log('   → O webhook rejeita mensagens sem assinatura válida.\n');
    }

    if (temInstancia && !temPhoneNumberId) {
      console.log('🔴 CRÍTICO: Instância existe mas sem phoneNumberId');
      console.log('   → O webhook não consegue encontrar a instância.');
      console.log('   → Solução: Atualize a instância com o phoneNumberId correto.\n');
    }

    if (temTokenExpirado) {
      console.log('🔴 CRÍTICO: Token de acesso expirado');
      console.log('   → É necessário reconectar via Embedded Signup.\n');
    }

    if (!temLogs && temInstanciaConectada && temAppSecret) {
      console.log('🟡 ALERTA: Nenhum webhook recebido');
      console.log('   → Verifique no Meta Developers se o webhook está ativo.');
      console.log('   → Verifique se a URL está correta.\n');
    }

    if (temLogs && recentMessages.length === 0) {
      console.log('🟡 ALERTA: Webhooks chegam mas mensagens não são salvas');
      console.log('   → Verifique os logs de erro acima.\n');
    }

    if (temAppSecret && temPhoneNumberId && temInstanciaConectada && !temTokenExpirado) {
      console.log('🟢 Configuração parece OK');
      console.log('   → Teste enviando uma mensagem para o número.');
      console.log('   → Verifique os logs em tempo real: pm2 logs\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // 7. Ações recomendadas
    console.log('🚀 PRÓXIMOS PASSOS:\n');
    
    if (!temAppSecret) {
      console.log('1. Adicione WHATSAPP_APP_SECRET no .env.local');
      console.log('   (Encontre em: Meta Developers → Seu App → Configurações → Básico)');
      console.log('2. Reinicie o servidor');
    } else if (!temPhoneNumberId) {
      console.log('1. Atualize a instância no banco com o phoneNumberId correto');
      console.log('2. Ou reconecte a instância via Embedded Signup');
    } else if (temTokenExpirado) {
      console.log('1. Reconecte a instância via Embedded Signup');
      console.log('   (Configurações → WhatsApp → Reconectar)');
    } else if (!temLogs) {
      console.log('1. Verifique no Meta Developers:');
      console.log('   - Se o webhook está configurado');
      console.log('   - Se a URL está correta');
      console.log('   - Se o verify token está correto');
    } else {
      console.log('1. Monitore os logs em tempo real');
      console.log('2. Envie uma mensagem de teste');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticoWebhookMeta();
