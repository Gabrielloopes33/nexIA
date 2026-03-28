import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRLS } from '@/lib/db/rls'
import { getOrganizationId } from '@/lib/auth/helpers'

interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const organizationId = await getOrganizationId()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const campaign = await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.findFirst({
        where: { id, organizationId },
        include: {
          contacts: {
            orderBy: { createdAt: 'asc' },
            take: limit,
            skip: offset,
          },
          _count: { select: { contacts: true } },
        },
      })
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: campaign })
  } catch (error) {
    console.error('GET /api/campaigns/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const organizationId = await getOrganizationId()
    const { id } = await params

    const campaign = await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.findFirst({ where: { id, organizationId } })
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json({ success: false, error: 'Only DRAFT campaigns can be deleted' }, { status: 400 })
    }

    await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/campaigns/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete campaign' }, { status: 500 })
  }
}
