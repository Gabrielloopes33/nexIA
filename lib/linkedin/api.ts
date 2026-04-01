/**
 * Stub da API do LinkedIn — implementação mínima para permitir build.
 * TODO: substituir pela integração real com a API do LinkedIn.
 */

export async function registerWebhookSubscription(
  _accessToken: string,
  _adAccountId: string,
  _webhookUrl: string
): Promise<string> {
  throw new Error('LinkedIn API não implementada')
}

export async function deleteWebhookSubscription(
  _accessToken: string,
  _subscriptionId: string
): Promise<void> {
  throw new Error('LinkedIn API não implementada')
}

export async function getAdAccounts(_accessToken: string): Promise<unknown[]> {
  return []
}

export async function getLeadForms(
  _accessToken: string,
  _adAccountId: string
): Promise<unknown[]> {
  return []
}
