import { NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'

export async function POST(req: Request) {
  // Verifica se o Stripe está configurado
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe não configurado. Configure as variáveis de ambiente STRIPE_SECRET_KEY.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { priceId, customerId, customerEmail, metadata = {} } = body

    // Validações
    if (!priceId) {
      return NextResponse.json(
        { error: 'ID do preço é obrigatório' },
        { status: 400 }
      )
    }

    // Configuração da sessão de checkout
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cobrancas/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cobrancas`,
      metadata: {
        ...metadata,
        integration: 'nexia-crm',
      },
      subscription_data: {
        metadata: {
          ...metadata,
          integration: 'nexia-crm',
        },
      },
    }

    // Adiciona cliente existente ou email
    if (customerId) {
      sessionConfig.customer = customerId
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail
    }

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
