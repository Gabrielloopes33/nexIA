/**
 * Contact API Route
 * GET: Get a specific contact
 * PATCH: Update a contact
 * DELETE: Soft delete a contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/contacts/[id]
 * Get a specific contact
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        deals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            conversations: true,
            deals: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Update a contact
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, avatarUrl, metadata, tags, status, leadScore } = body;

    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check if phone is being changed and if new phone already exists
    if (phone && phone !== existingContact.phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const phoneExists = await prisma.contact.findUnique({
        where: {
          organizationId_phone: {
            organizationId: existingContact.organizationId,
            phone: normalizedPhone,
          },
        },
      });

      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Contact with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone.replace(/\D/g, '') }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(metadata !== undefined && { metadata }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && { status }),
        ...(leadScore !== undefined && { leadScore }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Soft delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    await prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact moved to trash successfully',
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
