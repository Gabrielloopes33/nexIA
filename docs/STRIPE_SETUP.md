# Configuração do Stripe - NexIA CRM

## Visão Geral

O módulo de cobranças do NexIA CRM está integrado com o Stripe para processar pagamentos e gerenciar assinaturas SaaS.

## Configuração Inicial

### 1. Criar Conta Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta
2. Complete a verificação da conta
3. Ative o modo de produção quando estiver pronto

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env.local`:

```bash
# Stripe Secret Key (obtenha em: Dashboard > Developers > API Keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (obtenha após configurar o webhook)
STRIPE_WEBHOOK_SECRET=whsec_...

# IDs dos Preços (crie no Dashboard > Product Catalog)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...

# URL da Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Criar Produtos e Preços no Stripe

No Dashboard do Stripe:

1. Vá para **Product Catalog**
2. Clique em **+ Add Product**
3. Crie os seguintes planos:

#### Plano Starter
- Nome: "NexIA CRM - Starter"
- Descrição: "Para pequenas equipes"
- Preço Mensal: R$ 99,00
- Preço Anual: R$ 950,40 (20% OFF)

#### Plano Pro
- Nome: "NexIA CRM - Pro"
- Descrição: "Para empresas em crescimento"
- Preço Mensal: R$ 199,00
- Preço Anual: R$ 1.910,40 (20% OFF)

#### Plano Business
- Nome: "NexIA CRM - Business"
- Descrição: "Para empresas estabelecidas"
- Preço Mensal: R$ 299,00
- Preço Anual: R$ 2.870,40 (20% OFF)

#### Plano Enterprise
- Nome: "NexIA CRM - Enterprise"
- Descrição: "Para grandes organizações"
- Preço Mensal: R$ 499,00
- Preço Anual: R$ 4.790,40 (20% OFF)

### 4. Configurar Webhook

1. No Dashboard, vá para **Developers > Webhooks**
2. Clique em **+ Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Copie o **Signing Secret** e adicione às variáveis de ambiente

## Testar Integração

### Usar Cartões de Teste

Use estes cartões para testar diferentes cenários:

| Cenário | Número do Cartão | Resultado |
|---------|------------------|-----------|
| Sucesso | 4242 4242 4242 4242 | Pagamento aprovado |
| Recusado | 4000 0000 0000 0002 | Pagamento recusado |
| 3D Secure | 4000 0025 0000 3155 | Requer autenticação |

### Fluxo de Teste

1. Acesse `/cobrancas` no sistema
2. Clique em "Nova Assinatura"
3. Selecione um plano
4. Use o cartão de teste 4242 4242 4242 4242
5. Verifique se o webhook recebeu o evento

## Estrutura de Arquivos

```
lib/
  stripe/
    config.ts          # Configurações e constantes
app/
  api/
    stripe/
      checkout/
        route.ts       # API para criar sessão de checkout
      webhook/
        route.ts       # API para receber webhooks
  cobrancas/
    page.tsx           # Dashboard de cobranças
components/
  cobrancas/
    cobrancas-sub-sidebar.tsx  # Sub-sidebar do módulo
```

## Próximos Passos

1. [ ] Implementar salvamento no banco de dados
2. [ ] Criar página de planos públicos
3. [ ] Adicionar portal do cliente Stripe
4. [ ] Implementar cancelamento de assinaturas
5. [ ] Adicionar upgrade/downgrade de planos

## Recursos Úteis

- [Documentação Stripe](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Test Cards](https://stripe.com/docs/testing)
- [Webhooks](https://stripe.com/docs/webhooks)
