/**
 * LinkedIn Marketing API client
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/
 */

const LI_API = 'https://api.linkedin.com/v2'
const LI_REST = 'https://api.linkedin.com/rest'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiAdAccount {
  id: string      // "urn:li:sponsoredAccount:123"
  name: string
  status: string  // "ACTIVE" | "CANCELLED" | "DRAFT"
  currency?: string
}

export interface LiLeadForm {
  id: string      // "urn:li:leadGenerationForm:123"
  name: string
  status: string  // "ENABLED" | "DISABLED" | "DELETED"
}

export interface LiUserProfile {
  sub: string
  name?: string
  email?: string
  picture?: string
}

export interface LiFormAnswer {
  questionType: string
  answer: string
}

export interface LiFormResponse {
  id: string
  owner: string
  leadGenerationForm: string
  submittedAt: number
  answers: LiFormAnswer[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function liGet<T>(path: string, accessToken: string, base = LI_API): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202401',
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn API ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

async function liPost<T>(
  path: string,
  accessToken: string,
  body: unknown,
  base = LI_REST
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202401',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn API POST ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

async function liDelete(path: string, accessToken: string, base = LI_REST): Promise<void> {
  const res = await fetch(`${base}${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202401',
    },
  })
  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`LinkedIn API DELETE ${res.status}: ${err}`)
  }
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(accessToken: string): Promise<LiUserProfile> {
  return liGet<LiUserProfile>('/userinfo', accessToken)
}

// ─── Ad Accounts ─────────────────────────────────────────────────────────────

export async function getAdAccounts(accessToken: string): Promise<LiAdAccount[]> {
  try {
    const data = await liGet<{
      elements: Array<{ id: string; name: string; status: string; currency?: string }>
    }>(
      '/adAccountsV2?q=search&search.type.values[0]=BUSINESS&count=50',
      accessToken
    )
    return (data.elements || []).map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      currency: a.currency,
    }))
  } catch (error) {
    console.error('[LinkedIn] getAdAccounts error:', error)
    return []
  }
}

// ─── Lead Gen Forms ───────────────────────────────────────────────────────────

export async function getLeadForms(
  accessToken: string,
  adAccountId: string
): Promise<LiLeadForm[]> {
  try {
    const ownerUrn = adAccountId.startsWith('urn:')
      ? adAccountId
      : `urn:li:sponsoredAccount:${adAccountId}`

    const encoded = encodeURIComponent(ownerUrn)
    const data = await liGet<{
      elements: Array<{ id: string; name: string; status: string }>
    }>(
      `/leadGenerationForms?q=owner&owner=${encoded}&count=100`,
      accessToken
    )
    return (data.elements || []).map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
    }))
  } catch (error) {
    console.error('[LinkedIn] getLeadForms error:', error)
    return []
  }
}

// ─── Webhook Subscriptions ────────────────────────────────────────────────────

export async function registerWebhookSubscription(
  accessToken: string,
  _adAccountId: string,
  webhookUrl: string
): Promise<string> {
  const data = await liPost<{ id: string }>(
    '/webhookSubscriptions',
    accessToken,
    {
      callbackUrl: webhookUrl,
      eventTypes: ['LEAD_GEN_FORM_RESPONSE'],
    }
  )
  return data.id
}

export async function deleteWebhookSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  await liDelete(`/webhookSubscriptions/${subscriptionId}`, accessToken)
}

// ─── Lead Form Response ───────────────────────────────────────────────────────

export async function getFormResponse(
  accessToken: string,
  responseId: string
): Promise<LiFormResponse | null> {
  try {
    const clean = responseId.startsWith('urn:')
      ? responseId.split(':').pop()!
      : responseId

    const data = await liGet<{
      id: string
      owner: string
      leadGenerationForm: string
      submittedAt?: number
      formResponse?: {
        submittedAt?: number
        answers?: Array<{ questionType: string; answer: unknown }>
      }
    }>(`/leadGenerationFormResponses/${clean}`, accessToken)

    const answers = (data.formResponse?.answers || []).map((a) => ({
      questionType: a.questionType,
      answer: String(a.answer ?? ''),
    }))

    return {
      id: data.id,
      owner: data.owner,
      leadGenerationForm: data.leadGenerationForm,
      submittedAt: data.formResponse?.submittedAt ?? data.submittedAt ?? Date.now(),
      answers,
    }
  } catch (error) {
    console.error('[LinkedIn] getFormResponse error:', error)
    return null
  }
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
}> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed ${res.status}: ${err}`)
  }

  return res.json()
}
