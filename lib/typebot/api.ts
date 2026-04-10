import { decrypt } from '@/lib/crypto'

export interface TypebotFlow {
  id: string
  name: string
}

interface TypebotRequestOptions {
  apiKey: string
  baseUrl?: string
}

function getTypebotBaseUrl(baseUrl?: string): string {
  return (baseUrl || process.env.TYPEBOT_API_BASE_URL || 'https://api.typebot.io').replace(/\/$/, '')
}

async function requestTypebot(path: string, options: TypebotRequestOptions): Promise<unknown> {
  const url = `${getTypebotBaseUrl(options.baseUrl)}${path}`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Typebot API ${response.status}: ${body || 'request failed'}`)
  }

  return response.json()
}

export async function listTypebotFlows(encryptedApiKey: string): Promise<TypebotFlow[]> {
  const apiKey = decrypt(encryptedApiKey)

  // Typebot pode variar o endpoint entre versões/cloud.
  const candidates = ['/v1/typebots', '/api/v1/typebots']

  for (const path of candidates) {
    try {
      const data = await requestTypebot(path, { apiKey })
      const maybeArray = (data as { typebots?: Array<{ id?: string; name?: string }> }).typebots

      if (Array.isArray(maybeArray)) {
        return maybeArray
          .filter((item) => item?.id && item?.name)
          .map((item) => ({ id: item.id as string, name: item.name as string }))
      }
    } catch {
      // Tenta próximo endpoint candidato.
    }
  }

  return []
}
