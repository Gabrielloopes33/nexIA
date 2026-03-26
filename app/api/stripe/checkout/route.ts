import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Dynamic import to avoid build-time issues
  const { stripe, isStripeConfigured, STRIPE_PRICE_ID } = await import('@/lib/stripe/config')
  
  // Verifica se o Stripe está configurado
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe não configurado. Configure as variáveis de ambiente STRIPE_SECRET_KEY e STRIPE_PRICE_ID.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { customerEmail, metadata = {} } = body

    // Usa o priceId do body ou o padrão configurado
    const priceId = body.priceId || STRIPE_PRICE_ID

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

    // Adiciona email do cliente se fornecido
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail
    }

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
