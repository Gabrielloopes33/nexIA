/**
 * GET /api/integrations/linkedin/auth
 * Inicia fluxo OAuth 2.0 do LinkedIn
 * Retorna URL de autorização para redirecionar o usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkedInConfig } from '@/lib/linkedin/config'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const organizationId =
      new URL(request.url).searchParams.get('organizationId') ||
      user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    if (!linkedInConfig.clientId) {
      return NextResponse.json(
        { success: false, error: 'LINKEDIN_CLIENT_ID não configurado' },
        { status: 500 }
      )
    }

    const state = Buffer.from(
      JSON.stringify({
        organizationId,
        timestamp: Date.now(),
      })
    ).toString('base64')

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', linkedInConfig.clientId)
    authUrl.searchParams.set('redirect_uri', linkedInConfig.redirectUri)
    authUrl.searchParams.set('scope', linkedInConfig.scopes.join(' '))
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      success: true,
      data: {
        authUrl: authUrl.toString(),
        state,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('[LinkedIn Auth] Erro ao gerar URL:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar URL de autorização' },
      { status: 500 }
    )
  }
}
