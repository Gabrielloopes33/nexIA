/**
 * GET /api/integrations/linkedin/accounts
 * Lista as contas de anúncios acessíveis pelo token OAuth salvo
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { decrypt } from '@/lib/crypto'
import { getAdAccounts } from '@/lib/linkedin/api'

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

    const integration = await prisma.linkedInIntegration.findUnique({
      where: { organizationId },
    })

    if (!integration || !integration.accessToken || integration.status === 'DISCONNECTED') {
      return NextResponse.json(
        { success: false, error: 'Integração LinkedIn não conectada' },
        { status: 404 }
      )
    }

    const accessToken = decrypt(integration.accessToken)
    const accounts = await getAdAccounts(accessToken)

    return NextResponse.json({ success: true, data: accounts })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('[LinkedIn Accounts]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar contas',
      },
      { status: 500 }
    )
  }
}
