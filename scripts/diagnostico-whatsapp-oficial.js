/**
 * Script de Diagnóstico WhatsApp Business API (Meta) Oficial
 * Verifica o estado da integração oficial da Meta
 * 
 * Uso: node scripts/diagnostico-whatsapp-oficial.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticar() {
  console.log('🔍 Diagnóstico WhatsApp Business API (Meta Oficial)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Verificar variáveis de ambiente CRÍTICAS
    console.log('1️⃣  Variáveis de Ambiente:\n');
    
    const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    console.log(`   WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${webhookVerifyToken ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    console.log(`   WHATSAPP_APP_SECRET: ${appSecret ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    console.log(`   META_APP_ID: ${metaAppId ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    console.log(`   META_APP_SECRET: ${metaAppSecret ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    console.log(`   NEXT_PUBLIC_APP_URL: ${appUrl || '❌ NÃO CONFIGURADO'}`);
    console.log('');

    if (!webhookVerifyToken || !appSecret) {
      console.log('   ⚠️  ALERTA CRÍTICO: Variáveis de webhook não configuradas!');
      console.log('   → O webhook da Meta vai falhar toda vez que tentar enviar mensagens.\n');
    }

    // 2. Verificar instâncias WhatsApp Business API
    console.log('2️⃣  Instâncias WhatsApp Business API:\n');
    
    const instances = await prisma.whatsAppInstance.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (instances.length === 0) {
      console.log('   ❌ Nenhuma instância encontrada!\n');
    } else {
      instances.forEach(inst => {
        const tokenExpired = inst.tokenExpiresAt && inst.tokenExpiresAt < new Date();
        
        console.log(`   📱 ${inst.name}`);
        console.log(`      ID: ${inst.id}`);
        console.log(`      Status: ${inst.status}${tokenExpired ? ' ⚠️ TOKEN EXPIRADO!' : ''}`);
        console.log(`      Phone Number ID: ${inst.phoneNumberId || 'N/A'}`);
        console.log(`      Número: ${inst.phoneNumber || 'N/A'}`);
        console.log(`      Display: ${inst.displayPhoneNumber || 'N/A'}`);
        console.log(`      WABA ID: ${inst.wabaId || 'N/A'}`);
        console.log(`      Quality Rating: ${inst.qualityRating}`);
        console.log(`      Token expira em: ${inst.tokenExpiresAt ? inst.tokenExpiresAt.toISOString() : 'N/A'}`);
        console.log(`      Conectado em: ${inst.connectedAt ? inst.connectedAt.toISOString() : 'Nunca'}`);
        console.log('');
      });
    }

    // 3. Verificar logs de webhook (MetaWebhookLog)
    console.log('3️⃣  Logs de Webhook (últimas 24h):\n');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentLogs = await prisma.metaWebhookLog.findMany({
      where: {
        createdAt: { gte: yesterday },
        whatsappInstanceId: { not: null }, // Apenas logs da API oficial
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
      console.log('   ❌ Nenhum log de webhook nas últimas 24h!');
      console.log('   → Isso indica que a Meta não está enviando eventos para o webhook.\n');
    } else {
      console.log(`   ✅ ${recentLogs.length} eventos recebidos:\n`);
      
      const eventTypes = {};
      let errorCount = 0;
      
      recentLogs.forEach(log => {
        eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
        if (log.errorMessage) errorCount++;
        
        console.log(`   [${log.createdAt.toISOString()}] ${log.eventType}`);
        console.log(`   Instância: ${log.whatsappInstance?.name || 'N/A'}`);
        console.log(`   Processado: ${log.processed ? '✅' : '❌'}`);
        if (log.errorMessage) {
          console.log(`   ⚠️  Erro: ${log.errorMessage}`);
        }
        console.log('');
      });
      
      console.log('   Resumo por tipo:');
      Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
      if (errorCount > 0) {
        console.log(`   ⚠️  Total de erros: ${errorCount}`);
      }
      console.log('');
    }

    // 4. Verificar último log de erro específico
    console.log('4️⃣  Últimos Erros de Webhook:\n');
    
    const errorLogs = await prisma.metaWebhookLog.findMany({
      where: {
        errorMessage: { not: null },
        createdAt: { gte: yesterday },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (errorLogs.length === 0) {
      console.log('   ✅ Nenhum erro encontrado nas últimas 24h\n');
    } else {
      errorLogs.forEach(log => {
        console.log(`   [${log.createdAt.toISOString()}]`);
        console.log(`   Erro: ${log.errorMessage}`);
        console.log(`   Tipo: ${log.eventType}`);
        console.log('');
      });
    }

    // 5. Verificar configuração do webhook esperada
    console.log('5️⃣  Configuração Esperada do Webhook:\n');
    
    const webhookUrl = `${appUrl}/api/whatsapp/webhooks`;
    console.log(`   URL do Webhook: ${webhookUrl}`);
    console.log(`   Verify Token: ${webhookVerifyToken || 'NÃO CONFIGURADO'}`);
    console.log('');
    console.log('   → Verifique se esta URL está configurada no:');
    console.log('     1. Meta Developers → Seu App → WhatsApp → Configuração');
    console.log('     2. Ou no painel do WABA (Business Manager)');
    console.log('');

    // 6. Diagnóstico final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 DIAGNÓSTICO FINAL:\n');

    const temVariaveis = webhookVerifyToken && appSecret;
    const temInstancia = instances.length > 0;
    const temInstanciaConectada = instances.some(i => i.status === 'CONNECTED');
    const temTokenExpirado = instances.some(i => i.tokenExpiresAt && i.tokenExpiresAt < new Date());
    const temLogsRecentes = recentLogs.length > 0;

    if (!temVariaveis) {
      console.log('🔴 PROBLEMA CRÍTICO: Variáveis de ambiente faltando!');
      console.log('   → Adicione no .env.local:');
      console.log('     WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_token_aqui');
      console.log('     WHATSAPP_APP_SECRET=seu_app_secret_aqui');
      console.log('');
    }

    if (temInstancia && temTokenExpirado) {
      console.log('🔴 PROBLEMA: Token de acesso expirado!');
      console.log('   → É necessário reconectar a instância via Embedded Signup');
      console.log('');
    }

    if (!temInstanciaConectada && temInstancia) {
      console.log('🟡 ATENÇÃO: Instância existe mas não está conectada');
      console.log('   → Verifique o status no painel ou reconecte');
      console.log('');
    }

    if (!temLogsRecentes && temInstanciaConectada && temVariaveis) {
      console.log('🔴 PROBLEMA: Webhook não está recebendo eventos!');
      console.log('   Possíveis causas:');
      console.log('   1. URL do webhook incorreta no dashboard da Meta');
      console.log('   2. Verify token incorreto');
      console.log('   3. App não foi aprovado para receber webhooks');
      console.log('   4. Assinatura do webhook falhou (APP_SECRET incorreto)');
      console.log('   5. O número foi desconectado do WABA');
      console.log('');
    }

    if (temVariaveis && temInstanciaConectada && temLogsRecentes) {
      console.log('🟢 Tudo parece configurado corretamente!');
      console.log('   → Teste enviando uma mensagem para o número');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // 7. Ações recomendadas
    console.log('🚀 AÇÕES RECOMENDADAS:\n');
    
    if (!temVariaveis) {
      console.log('1. Adicione as variáveis de ambiente no .env.local');
      console.log('2. Reinicie o servidor');
      console.log('3. Verifique se o webhook está configurado no Meta Developers');
    } else if (temTokenExpirado) {
      console.log('1. Reconecte a instância via Embedded Signup');
      console.log('2. O token será renovado automaticamente');
    } else if (!temLogsRecentes) {
      console.log('1. Verifique no Meta Developers se o webhook está ativo');
      console.log('2. Verifique se a URL do webhook está correta');
      console.log('3. Teste o endpoint: curl -X GET ' + webhookUrl);
    } else {
      console.log('1. Verifique os logs em tempo real');
      console.log('2. Teste enviando uma mensagem');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
