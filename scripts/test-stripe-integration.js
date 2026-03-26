#!/usr/bin/env node
/**
 * Script de teste da integração Stripe
 * Testa: Configuração, API de checkout, e verificação do banco
 */

const https = require('https');
const http = require('http');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(status, message) {
  const icon = status === 'ok' ? '✅' : status === 'error' ? '❌' : status === 'warn' ? '⚠️' : 'ℹ️';
  const color = status === 'ok' ? colors.green : status === 'error' ? colors.red : status === 'warn' ? colors.yellow : colors.blue;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function testStripeConfig() {
  console.log('\n📋 TESTE 1: Configuração Stripe\n');
  
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET', 
    'STRIPE_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  let allOk = true;
  for (const key of required) {
    const value = process.env[key];
    if (value && value.length > 10) {
      log('ok', `${key}: ${value.substring(0, 10)}...`);
    } else {
      log('error', `${key}: NÃO DEFINIDO ou INVÁLIDO`);
      allOk = false;
    }
  }
  
  return allOk;
}

async function testStripeConnection() {
  console.log('\n📋 TESTE 2: Conexão com Stripe API\n');
  
  try {
    // Usar Stripe diretamente via script
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia'
    });
    
    // Testar buscando o próprio account
    const account = await stripe.accounts.retrieve();
    log('ok', `Conectado à conta: ${account.id}`);
    log('ok', `Modo: ${account.charges_enabled ? 'LIVE' : 'TEST'}`);
    
    // Testar o preço
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
    log('ok', `Preço encontrado: ${price.id}`);
    log('ok', `Produto: ${price.product}`);
    log('ok', `Tipo: ${price.type} | Recorrência: ${price.recurring?.interval_count} ${price.recurring?.interval}(s)`);
    
    return { ok: true, stripe, price };
  } catch (error) {
    log('error', `Erro na conexão: ${error.message}`);
    return { ok: false, error };
  }
}

async function testLocalServer() {
  console.log('\n📋 TESTE 3: Servidor Local\n');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'healthy') {
            log('ok', 'Servidor respondendo na porta 3000');
            log('ok', `Database: ${json.checks?.database ? 'OK' : 'ERRO'}`);
            resolve(true);
          } else {
            log('warn', 'Servidor respondendo, mas status não é healthy');
            resolve(false);
          }
        } catch {
          log('warn', 'Resposta não é JSON válido');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      log('error', 'Servidor não está rodando em http://localhost:3000');
      log('info', 'Inicie o servidor com: pnpm dev');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      log('error', 'Timeout ao conectar no servidor');
      resolve(false);
    });
  });
}

async function testCheckoutAPI() {
  console.log('\n📋 TESTE 4: API de Checkout\n');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      priceId: process.env.STRIPE_PRICE_ID,
      customerEmail: 'teste@exemplo.com.br'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/stripe/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200 && json.url) {
            log('ok', 'API de checkout respondendo');
            log('ok', `Session ID: ${json.sessionId?.substring(0, 20)}...`);
            log('ok', `URL gerada: ${json.url.substring(0, 60)}...`);
            resolve({ ok: true, url: json.url });
          } else if (json.error) {
            log('error', `Erro da API: ${json.error}`);
            resolve({ ok: false, error: json.error });
          } else {
            log('error', 'Resposta inesperada da API');
            resolve({ ok: false });
          }
        } catch {
          log('error', 'Resposta não é JSON válido');
          resolve({ ok: false });
        }
      });
    });
    
    req.on('error', (err) => {
      log('error', `Erro na requisição: ${err.message}`);
      resolve({ ok: false });
    });
    
    req.write(postData);
    req.end();
  });
}

async function testPlansAPI() {
  console.log('\n📋 TESTE 5: API de Planos\n');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/plans', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            log('ok', `API de planos retornando ${json.length} plano(s)`);
            if (json.length > 0) {
              log('ok', `Primeiro plano: ${json[0].name} (R$ ${json[0].priceCents / 100})`);
            }
            resolve({ ok: true, plans: json });
          } else if (json.error) {
            log('error', `Erro: ${json.error}`);
            resolve({ ok: false });
          } else {
            log('warn', 'Resposta inesperada');
            resolve({ ok: false });
          }
        } catch {
          log('error', 'Resposta não é JSON válido');
          resolve({ ok: false });
        }
      });
    });
    
    req.on('error', () => {
      log('error', 'Não foi possível conectar na API de planos');
      resolve({ ok: false });
    });
  });
}

async function testWebhookAPI() {
  console.log('\n📋 TESTE 6: API de Webhook\n');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/stripe/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_invalid_signature'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Esperamos um erro 400 pois a assinatura é inválida
        if (res.statusCode === 400) {
          log('ok', 'Webhook está respondendo (rejeitou assinatura inválida como esperado)');
          resolve({ ok: true });
        } else if (res.statusCode === 503) {
          log('warn', 'Stripe não configurado no servidor');
          resolve({ ok: false });
        } else {
          log('warn', `Status inesperado: ${res.statusCode}`);
          resolve({ ok: false });
        }
      });
    });
    
    req.on('error', () => {
      log('error', 'Não foi possível conectar no webhook');
      resolve({ ok: false });
    });
    
    req.write(JSON.stringify({ type: 'test' }));
    req.end();
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 TESTE DE INTEGRAÇÃO STRIPE - NEXIA CHAT              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Carregar variáveis de ambiente manualmente
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...val] = line.split('=');
      process.env[key.trim()] = val.join('=').trim();
    }
  });
  
  // Teste 1: Configuração
  const configOk = await testStripeConfig();
  if (!configOk) {
    log('error', 'Configure as variáveis de ambiente primeiro!');
    process.exit(1);
  }
  
  // Teste 2: Conexão Stripe
  const stripeResult = await testStripeConnection();
  if (!stripeResult.ok) {
    log('error', 'Verifique suas credenciais do Stripe!');
    process.exit(1);
  }
  
  // Teste 3: Servidor local
  const serverOk = await testLocalServer();
  if (!serverOk) {
    log('error', 'Inicie o servidor antes de continuar: pnpm dev');
    process.exit(1);
  }
  
  // Teste 4: API de checkout
  const checkoutResult = await testCheckoutAPI();
  
  // Teste 5: API de planos
  const plansResult = await testPlansAPI();
  
  // Teste 6: Webhook
  const webhookResult = await testWebhookAPI();
  
  // Resumo
  console.log('\n' + '═'.repeat(64));
  console.log('📊 RESUMO DOS TESTES');
  console.log('═'.repeat(64));
  
  const results = [
    { name: 'Configuração Stripe', ok: configOk },
    { name: 'Conexão Stripe API', ok: stripeResult.ok },
    { name: 'Servidor Local', ok: serverOk },
    { name: 'API de Checkout', ok: checkoutResult.ok },
    { name: 'API de Planos', ok: plansResult.ok },
    { name: 'API de Webhook', ok: webhookResult.ok }
  ];
  
  let passed = 0;
  for (const r of results) {
    if (r.ok) {
      log('ok', r.name);
      passed++;
    } else {
      log('error', r.name);
    }
  }
  
  console.log('─'.repeat(64));
  if (passed === results.length) {
    log('ok', `Todos os ${results.length} testes passaram! 🎉`);
    console.log('\n💡 Próximo passo: Teste um checkout real acessando:');
    console.log('   http://localhost:3000/configuracoes/assinaturas/nova');
    process.exit(0);
  } else {
    log('error', `${passed}/${results.length} testes passaram`);
    process.exit(1);
  }
}

main().catch(err => {
  log('error', `Erro inesperado: ${err.message}`);
  process.exit(1);
});
