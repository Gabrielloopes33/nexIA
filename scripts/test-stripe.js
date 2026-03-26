#!/usr/bin/env node
/**
 * Script para testar a conexão com a API do Stripe
 * Usage: node scripts/test-stripe.js
 */

const fs = require('fs');
const path = require('path');

// Carrega variáveis do .env.local manualmente
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado!');
    return false;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove aspas se existirem
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key] = cleanValue;
      }
    }
  }
  return true;
}

async function testStripeConnection() {
  console.log('🧪 Testando conexão com Stripe...\n');

  if (!loadEnv()) {
    process.exit(1);
  }

  // Verifica se as variáveis estão configuradas
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('📋 Status das variáveis:');
  console.log(`  STRIPE_SECRET_KEY: ${secretKey ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${publishableKey ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`  STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✅ Configurada' : '❌ Não configurada'}`);

  if (!secretKey) {
    console.error('\n❌ ERRO: STRIPE_SECRET_KEY não encontrada!');
    process.exit(1);
  }

  try {
    // Importa stripe dinamicamente
    const { default: Stripe } = await import('stripe');
    
    // Inicializa o cliente Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Testa a conexão buscando a conta
    console.log('\n🔄 Testando conexão com API...');
    const account = await stripe.accounts.retrieve();
    
    console.log('\n✅ CONEXÃO BEM-SUCEDIDA!');
    console.log('\n📊 Informações da Conta:');
    console.log(`  ID: ${account.id}`);
    console.log(`  Email: ${account.email || 'N/A'}`);
    console.log(`  País: ${account.country}`);
    console.log(`  Modo: ${secretKey.startsWith('sk_live_') ? '🟢 LIVE' : '🟡 TEST'}`);
    console.log(`  Cobranças habilitadas: ${account.charges_enabled ? '✅ Sim' : '❌ Não'}`);
    console.log(`  Saques habilitados: ${account.payouts_enabled ? '✅ Sim' : '❌ Não'}`);

    // Lista produtos existentes
    console.log('\n📦 Produtos cadastrados:');
    const products = await stripe.products.list({ limit: 10 });
    
    if (products.data.length === 0) {
      console.log('  ⚠️  Nenhum produto encontrado. Você precisa criar os planos!');
    } else {
      products.data.forEach(product => {
        console.log(`  • ${product.name} (${product.id})`);
      });
    }

    // Verifica webhooks configurados
    console.log('\n🔗 Webhooks configurados:');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('  ❌ Nenhum webhook encontrado!');
    } else {
      webhooks.data.forEach(wh => {
        console.log(`  • ${wh.url}`);
        console.log(`    Status: ${wh.enabled ? '✅ Ativo' : '❌ Desativado'}`);
        console.log(`    Eventos: ${wh.enabled_events.join(', ')}`);
      });
    }

    console.log('\n🎉 Integração Stripe está funcionando corretamente!');
    console.log('\n⚠️  PRÓXIMO PASSO: Crie os produtos e preços no Stripe Dashboard');
    console.log('   Vá em: Products → Add Product');
    console.log('   Planos necessários: Starter, Pro, Business, Enterprise (mensal e anual)');

  } catch (error) {
    console.error('\n❌ ERRO NA CONEXÃO:');
    console.error(`  ${error.message}`);
    
    if (error.message.includes('Invalid API Key')) {
      console.error('\n💡 Dica: Verifique se a STRIPE_SECRET_KEY está correta');
    }
    
    process.exit(1);
  }
}

testStripeConnection();
