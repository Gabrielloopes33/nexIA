import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRLS } from '@/lib/db/rls'
import { getOrganizationId, getAuthenticatedUser } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const [campaigns, total] = await withRLS(prisma, organizationId, async (tx) => {
      return Promise.all([
        tx.campaign.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: { _count: { select: { contacts: true } } },
        }),
        tx.campaign.count({ where: { organizationId } }),
      ])
    })

    return NextResponse.json({ success: true, data: campaigns, meta: { total, limit, offset } })
  } catch (error) {
    console.error('GET /api/campaigns error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const organizationId = user.organizationId

    const body = await request.json()
    const { name, instanceId, templateName, templateLanguage, templateComponents, audienceType, audienceTags, contactIds } = body

    if (!name || !instanceId || !templateName || !templateLanguage || !audienceType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Resolve contacts based on audienceType
    let contacts: { id: string; phone: string; name: string | null }[] = []

    if (audienceType === 'ALL') {
      contacts = await withRLS(prisma, organizationId, async (tx) => {
        return tx.contact.findMany({
          where: { organizationId, status: 'ACTIVE', deletedAt: null, phone: { not: '' } },
          select: { id: true, phone: true, name: true },
        })
      })
    } else if (audienceType === 'BY_TAG') {
      const tags: string[] = audienceTags || []
      contacts = await withRLS(prisma, organizationId, async (tx) => {
        return tx.contact.findMany({
          where: {
            organizationId,
            status: 'ACTIVE',
            deletedAt: null,
            phone: { not: '' },
            tags: { hasSome: tags },
          },
          select: { id: true, phone: true, name: true },
        })
      })
    } else if (audienceType === 'MANUAL') {
      const ids: string[] = contactIds || []
      contacts = await withRLS(prisma, organizationId, async (tx) => {
        return tx.contact.findMany({
          where: { id: { in: ids }, organizationId, deletedAt: null, phone: { not: '' } },
          select: { id: true, phone: true, name: true },
        })
      })
    }

    if (contacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid contacts found for this audience' }, { status: 400 })
    }

    const campaign = await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.create({
        data: {
          organizationId,
          name,
          instanceId,
          templateName,
          templateLanguage,
          templateComponents: templateComponents || undefined,
          audienceType,
          audienceTags: audienceTags || [],
          totalContacts: contacts.length,
          pendingCount: contacts.length,
          createdBy: user.userId,
          contacts: {
            create: contacts.map((c) => ({
              contactId: c.id,
              phone: c.phone,
              name: c.name,
              status: 'PENDING',
            })),
          },
        },
      })
    })

    return NextResponse.json({ success: true, data: campaign }, { status: 201 })
  } catch (error) {
    console.error('POST /api/campaigns error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create campaign' }, { status: 500 })
  }
}
