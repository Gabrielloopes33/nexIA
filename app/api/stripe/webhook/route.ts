import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Dynamic import to avoid build-time issues
  const { stripe, STRIPE_WEBHOOK_SECRET, isStripeConfigured } = await import('@/lib/stripe/config')
  
  // Verifica se o Stripe está configurado
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe não configurado. Configure as variáveis de ambiente STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET.' },
      { status: 503 }
    )
  }

  try {
    const payload = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Assinatura do Stripe não encontrada' },
        { status: 400 }
      )
    }

    // Verifica o evento do webhook
    let event
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err: any) {
      console.error('Erro na verificação do webhook:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Processa os eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('✅ Checkout completado:', session.id)
        // Aqui você pode salvar no banco de dados
        // await saveSubscription(session)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        console.log('✅ Fatura paga:', invoice.id)
        // Atualiza o status da assinatura
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('❌ Falha no pagamento:', invoice.id)
        // Notifica o cliente sobre a falha
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('✅ Assinatura criada:', subscription.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('📝 Assinatura atualizada:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('🗑️ Assinatura cancelada:', subscription.id)
        break
      }

      default:
        console.log(`ℹ️ Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
