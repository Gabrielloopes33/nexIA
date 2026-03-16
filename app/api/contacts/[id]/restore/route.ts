/**
 * Contact Restore API Route
 * PATCH: Restore a soft-deleted contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/contacts/[id]/restore
 * Restore a soft-deleted contact
 */
export async function PATCH(
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

    if (!existingContact.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Contact is not deleted' },
        { status: 400 }
      );
    }

    // Restore by clearing deletedAt
    const restored = await prisma.contact.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      data: restored,
      message: 'Contact restored successfully',
    });
  } catch (error) {
    console.error('Error restoring contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore contact' },
      { status: 500 }
    );
  }
}
