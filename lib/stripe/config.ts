import Stripe from 'stripe'

// Verifica se a chave do Stripe está configurada
const stripeKey = process.env.STRIPE_SECRET_KEY

// Inicializa o cliente Stripe apenas se houver uma chave válida
export const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : (null as any)

// Preço do plano Nexia Chat (em centavos)
// R$ 300,00 a cada 3 meses (trimestral)
export const PLAN_PRICE = {
  name: 'Nexia Chat',
  priceCents: 30000,
  interval: '3 months' as const,
  intervalCount: 3,
}

// ID do preço do plano no Stripe
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ''

// Configurações de webhook
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// URL base da aplicação
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Helper para verificar se o Stripe está configurado
export const isStripeConfigured = (): boolean => {
  return !!stripeKey && !!STRIPE_WEBHOOK_SECRET && !!STRIPE_PRICE_ID
}
