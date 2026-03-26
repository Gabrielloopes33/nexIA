/**
 * Script para atualizar a URL do webhook de todas as instâncias Evolution
 *
 * Uso:
 *   node scripts/update-webhook.js https://SEU-DOMINIO.com
 *
 * Para desenvolvimento local com ngrok:
 *   1. Instale ngrok: https://ngrok.com/download
 *   2. Execute: ngrok http 3000
 *   3. Copie a URL gerada (ex: https://abc123.ngrok-free.app)
 *   4. Execute: node scripts/update-webhook.js https://abc123.ngrok-free.app
 */

const { PrismaClient } = require('@prisma/client');

const publicUrl = process.argv[2];

if (!publicUrl) {
  console.error('❌ Informe a URL pública:');
  console.error('   node scripts/update-webhook.js https://SEU-DOMINIO.com');
  process.exit(1);
}

if (publicUrl.startsWith('http://localhost') || publicUrl.startsWith('http://127')) {
  console.error('❌ A URL precisa ser pública (acessível externamente). Use ngrok ou seu domínio.');
  process.exit(1);
}

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

if (!EVOLUTION_URL || !EVOLUTION_KEY) {
  // Tenta ler do .env.local
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...rest] = line.split('=');
      const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (key === 'EVOLUTION_API_URL') process.env.EVOLUTION_API_URL = value;
      if (key === 'EVOLUTION_API_KEY') process.env.EVOLUTION_API_KEY = value;
    }
  }
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const instances = await prisma.evolutionInstance.findMany({
      select: { id: true, name: true, instanceName: true, status: true, webhookUrl: true },
    });

    if (instances.length === 0) {
      console.log('Nenhuma instância Evolution encontrada no banco.');
      return;
    }

    console.log(`\nInstâncias encontradas: ${instances.length}`);

    for (const instance of instances) {
      const webhookUrl = `${publicUrl}/api/evolution/webhook`;
      console.log(`\n📡 ${instance.name} (${instance.instanceName}) — status: ${instance.status}`);
      console.log(`   Webhook atual: ${instance.webhookUrl || 'não configurado'}`);
      console.log(`   Novo webhook:  ${webhookUrl}`);

      try {
        // Atualiza na Evolution API
        const apiUrl = process.env.EVOLUTION_API_URL;
        const apiKey = process.env.EVOLUTION_API_KEY;

        const res = await fetch(`${apiUrl}/webhook/set/${instance.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            webhook: {
              url: webhookUrl,
              enabled: true,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
            }
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error(`   ❌ Evolution API error: ${err}`);
        } else {
          console.log(`   ✅ Webhook atualizado na Evolution API`);
        }

        // Atualiza no banco
        await prisma.evolutionInstance.update({
          where: { id: instance.id },
          data: { webhookUrl, webhookEnabled: true },
        });
        console.log(`   ✅ Banco atualizado`);

      } catch (err) {
        console.error(`   ❌ Erro: ${err.message}`);
      }
    }

    console.log(`\n✅ Concluído! Adicione ao .env.local:`);
    console.log(`   NEXT_PUBLIC_APP_URL=${publicUrl}\n`);

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
