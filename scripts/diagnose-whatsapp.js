#!/usr/bin/env node
/**
 * Script de diagnóstico para verificar o estado do WhatsApp
 * 
 * Uso: node scripts/diagnose-whatsapp.js [organizationId]
 * 
 * Exemplo:
 *   node scripts/diagnose-whatsapp.js 733221c6-4f41-43bc-82ad-d81ae29b51d6
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseWhatsApp(organizationId) {
  console.log('========================================');
  console.log('🔍 Diagnóstico WhatsApp - NexIA Chat');
  console.log('========================================\n');

  try {
    // Busca organização
    console.log(`📋 Organização ID: ${organizationId}\n`);
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true }
    });
    
    if (!organization) {
      console.error('❌ Organização não encontrada!');
      process.exit(1);
    }
    console.log(`🏢 Nome: ${organization.name}\n`);

    // Busca instâncias WhatsApp Cloud
    console.log('📱 Instâncias WhatsApp Cloud API (Oficial):');
    console.log('----------------------------------------');
    
    const officialInstances = await prisma.whatsAppInstance.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    if (officialInstances.length === 0) {
      console.log('❌ Nenhuma instância oficial encontrada\n');
    } else {
      for (const inst of officialInstances) {
        console.log(`  ID: ${inst.id}`);
        console.log(`  Nome: ${inst.name}`);
        console.log(`  Status: ${inst.status}`);
        console.log(`  Phone Number: ${inst.displayPhoneNumber || inst.phoneNumber || 'N/A'}`);
        console.log(`  Phone Number ID: ${inst.phoneNumberId || 'N/A'}`);
        console.log(`  WABA ID: ${inst.wabaId || 'N/A'}`);
        console.log(`  Access Token: ${inst.accessToken ? `✅ Presente (${inst.accessToken.substring(0, 20)}...)` : '❌ Ausente'}`);
        console.log(`  Conectado em: ${inst.connectedAt || 'Nunca'}`);
        console.log(`  Atualizado em: ${inst.updatedAt}`);
        console.log('  ---');
      }
      console.log('');
    }

    // Busca instâncias Evolution
    console.log('📱 Instâncias Evolution (Não Oficial):');
    console.log('----------------------------------------');
    
    const evolutionInstances = await prisma.evolutionInstance.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    if (evolutionInstances.length === 0) {
      console.log('❌ Nenhuma instância Evolution encontrada\n');
    } else {
      for (const inst of evolutionInstances) {
        console.log(`  ID: ${inst.id}`);
        console.log(`  Nome: ${inst.name}`);
        console.log(`  Instance Name: ${inst.instanceName}`);
        console.log(`  Status: ${inst.status}`);
        console.log(`  Conectado em: ${inst.connectedAt || 'Nunca'}`);
        console.log('  ---');
      }
      console.log('');
    }

    // Busca conversas recentes
    console.log('💬 Conversas Recentes:');
    console.log('----------------------------------------');
    
    const conversations = await prisma.conversation.findMany({
      where: { organizationId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        contact: { select: { name: true, phone: true } }
      }
    });

    if (conversations.length === 0) {
      console.log('❌ Nenhuma conversa encontrada\n');
    } else {
      for (const conv of conversations) {
        console.log(`  ID: ${conv.id}`);
        console.log(`  Contato: ${conv.contact.name || conv.contact.phone}`);
        console.log(`  Instance ID: ${conv.instanceId || 'N/A'}`);
        console.log(`  Instance Type: ${conv.instanceType || 'N/A'}`);
        console.log(`  Status: ${conv.status}`);
        console.log('  ---');
      }
      console.log('');
    }

    // Testa token se houver instância conectada
    const connectedInstance = officialInstances.find(i => i.status === 'CONNECTED' && i.accessToken);
    
    if (connectedInstance) {
      console.log('🧪 Testando Token do Meta:');
      console.log('----------------------------------------');
      
      try {
        const response = await fetch(`https://graph.facebook.com/v22.0/debug_token?input_token=${connectedInstance.accessToken}&access_token=${connectedInstance.accessToken}`);
        const data = await response.json();
        
        if (data.data) {
          const tokenInfo = data.data;
          console.log(`  ✅ Token válido: ${tokenInfo.is_valid ? 'SIM' : 'NÃO'}`);
          console.log(`  📱 App ID: ${tokenInfo.app_id}`);
          console.log(`  👤 User ID: ${tokenInfo.user_id}`);
          console.log(`  ⏱️  Expira em: ${tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000).toLocaleString() : 'Nunca'}`);
          console.log(`  🔒 Scopes: ${tokenInfo.scopes?.join(', ') || 'Nenhum'}`);
          
          if (!tokenInfo.is_valid) {
            console.log('\n  ⚠️  TOKEN INVÁLIDO! É necessário reconectar a conta.');
          }
          
          if (tokenInfo.expires_at && tokenInfo.expires_at * 1000 < Date.now()) {
            console.log('\n  ⚠️  TOKEN EXPIRADO! É necessário renovar.');
          }
        } else if (data.error) {
          console.log(`  ❌ Erro ao verificar token: ${data.error.message}`);
          
          if (data.error.message?.includes('deactivated')) {
            console.log('\n  🔴 ERRO CRÍTICO: API access deactivated!');
            console.log('  👉 Solução: Acesse developer.facebook.com e complete o registro.');
          }
        }
      } catch (error) {
        console.log(`  ❌ Erro na requisição: ${error.message}`);
      }
      console.log('');
    }

    console.log('========================================');
    console.log('✅ Diagnóstico concluído');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa diagnóstico
const organizationId = process.argv[2];

if (!organizationId) {
  console.error('❌ Uso: node scripts/diagnose-whatsapp.js [organizationId]');
  console.error('   Exemplo: node scripts/diagnose-whatsapp.js 733221c6-4f41-43bc-82ad-d81ae29b51d6');
  process.exit(1);
}

diagnoseWhatsApp(organizationId);
