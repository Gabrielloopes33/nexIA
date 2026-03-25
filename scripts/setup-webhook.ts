require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!EVOLUTION_URL || !EVOLUTION_KEY) {
  console.error('EVOLUTION_API_URL e EVOLUTION_API_KEY são obrigatórios');
  process.exit(1);
}

const WEBHOOK_URL = `${APP_URL || 'https://nexia.gmoraes.me'}/api/evolution/webhook`;

async function setupWebhook(instanceName: string) {
  console.log(`Configurando webhook para: ${instanceName}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  
  try {
    const response = await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        webhook: {
          url: WEBHOOK_URL,
          enabled: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        }
      }),
    });
    
    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

async function checkWebhook(instanceName: string) {
  console.log(`\nVerificando webhook atual de: ${instanceName}`);
  
  try {
    const response = await fetch(`${EVOLUTION_URL}/webhook/find/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_KEY,
      },
    });
    
    const data = await response.json();
    console.log('Webhook atual:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Executar
const instanceName = process.argv[2] || 'nexia_mn651ty8_aleq';

checkWebhook(instanceName)
  .then(() => setupWebhook(instanceName))
  .then(() => checkWebhook(instanceName))
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
