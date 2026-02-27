import Stripe from 'stripe'

// Verifica se a chave do Stripe está configurada
const stripeKey = process.env.STRIPE_SECRET_KEY

// Inicializa o cliente Stripe apenas se houver uma chave válida
export const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null as unknown as Stripe

// Preços dos planos (em centavos)
export const PLAN_PRICES = {
  starter: {
    monthly: 9900,  // R$ 99,00
    yearly: 95040,  // R$ 950,40 (20% desconto)
  },
  pro: {
    monthly: 19900, // R$ 199,00
    yearly: 191040, // R$ 1.910,40 (20% desconto)
  },
  business: {
    monthly: 29900, // R$ 299,00
    yearly: 287040, // R$ 2.870,40 (20% desconto)
  },
  enterprise: {
    monthly: 49900, // R$ 499,00
    yearly: 479040, // R$ 4.790,40 (20% desconto)
  },
}

// IDs dos produtos/planos no Stripe (substituir pelos IDs reais quando criados)
export const STRIPE_PRICE_IDS = {
  starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
  starter_yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  business_monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '',
  business_yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
  enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
  enterprise_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
}

// Configurações de webhook
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// URL base da aplicação
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Helper para verificar se o Stripe está configurado
export const isStripeConfigured = (): boolean => {
  return !!stripeKey && !!STRIPE_WEBHOOK_SECRET
}
