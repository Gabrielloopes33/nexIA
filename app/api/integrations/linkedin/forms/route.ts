/**
 * GET /api/integrations/linkedin/forms?adAccountId=xxx
 * Lista os Lead Gen Forms de uma conta de anúncios
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { decrypt } from '@/lib/crypto'
import { getLeadForms } from '@/lib/linkedin/api'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || user.organizationId
    const adAccountId = searchParams.get('adAccountId')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    if (!adAccountId) {
      return NextResponse.json(
        { success: false, error: 'adAccountId é obrigatório' },
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
    const forms = await getLeadForms(accessToken, adAccountId)

    return NextResponse.json({ success: true, data: forms })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('[LinkedIn Forms]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar formulários',
      },
      { status: 500 }
    )
  }
}
