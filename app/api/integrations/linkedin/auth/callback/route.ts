/**
 * GET /api/integrations/linkedin/auth/callback
 * Recebe callback do LinkedIn OAuth 2.0 após autorização
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { linkedInConfig } from '@/lib/linkedin/config'
import { exchangeCodeForToken, getUserProfile } from '@/lib/linkedin/api'
import { encrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const stateParam = searchParams.get('state')

  let organizationId = ''
  try {
    if (stateParam) {
      const state = JSON.parse(Buffer.from(stateParam, 'base64').toString())
      organizationId = state.organizationId || ''
    }
  } catch {
    console.warn('[LinkedIn Callback] Parâmetro state inválido')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error) {
    console.error('[LinkedIn Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/integracoes/linkedin/connect?error=${encodeURIComponent(error)}`,
        baseUrl
      )
    )
  }

  if (!code) {
    console.error('[LinkedIn Callback] Código não recebido')
    return NextResponse.redirect(
      new URL(`/integracoes/linkedin/connect?error=no_code`, baseUrl)
    )
  }

  if (!linkedInConfig.clientId || !linkedInConfig.clientSecret) {
    return NextResponse.redirect(
      new URL(
        `/integracoes/linkedin/connect?error=missing_credentials`,
        baseUrl
      )
    )
  }

  try {
    // 1. Troca code por access token
    const tokenData = await exchangeCodeForToken(
      code,
      linkedInConfig.redirectUri,
      linkedInConfig.clientId,
      linkedInConfig.clientSecret
    )

    // 2. Busca perfil do usuário
    const profile = await getUserProfile(tokenData.access_token)

    // 3. Calcula expiração
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null

    // 4. Criptografa tokens
    const encryptedAccessToken = encrypt(tokenData.access_token)
    const encryptedRefreshToken = tokenData.refresh_token
      ? encrypt(tokenData.refresh_token)
      : null

    // 5. Salva ou atualiza integração no banco
    await prisma.linkedInIntegration.upsert({
      where: { organizationId },
      update: {
        linkedInMemberId: profile.sub,
        linkedInMemberName: profile.name || null,
        linkedInMemberEmail: profile.email || null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        status: 'PENDING',
        totalLeads: 0,
        lastLeadAt: null,
        webhookSubscriptionId: null,
      },
      create: {
        organizationId,
        linkedInMemberId: profile.sub,
        linkedInMemberName: profile.name || null,
        linkedInMemberEmail: profile.email || null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        status: 'PENDING',
        totalLeads: 0,
      },
    })

    return NextResponse.redirect(
      new URL(`/integracoes/linkedin?success=connected`, baseUrl)
    )
  } catch (err) {
    console.error('[LinkedIn Callback] Erro:', err)
    const message = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      new URL(
        `/integracoes/linkedin/connect?error=${encodeURIComponent(message)}`,
        baseUrl
      )
    )
  }
}
