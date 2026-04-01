import { NextRequest, NextResponse } from 'next/server'
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { updateSessionPipeline } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/user/switch-pipeline
 * Altera o pipelineId ativo no cookie de sessão.
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId()
    const body = await request.json()
    const { pipelineId } = body

    if (!pipelineId) {
      return NextResponse.json(
        { success: false, error: 'pipelineId é obrigatório' },
        { status: 400 }
      )
    }

    // Valida que o pipeline pertence à organização
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
      select: { id: true },
    })

    if (!pipeline) {
      return NextResponse.json(
        { success: false, error: 'Pipeline não encontrado' },
        { status: 404 }
      )
    }

    await updateSessionPipeline(pipelineId)

    return NextResponse.json({
      success: true,
      data: { pipelineId },
    })
  } catch (error) {
    console.error('[Switch Pipeline] Error:', error)
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }
    return NextResponse.json(
      { success: false, error: 'Failed to switch pipeline' },
      { status: 500 }
    )
  }
}
