/**
 * Contact API Route (Refatorado - Fase 3: RBAC)
 * GET: Get a specific contact
 * PATCH: Update a contact
 * DELETE: Soft delete a contact (ADMIN+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  getOrganizationId, 
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';
import { 
  withPermission,
  permissionDeniedResponse 
} from '@/lib/auth/permissions';

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
    const organizationId = await getOrganizationId();
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

    // Verifica se o contato pertence à organização do usuário
    if (contact.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
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
    const organizationId = await getOrganizationId();
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

    // Verifica se o contato pertence à organização do usuário
    if (existingContact.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if phone is being changed and if new phone already exists
    if (phone && phone !== existingContact.phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const phoneExists = await prisma.contact.findUnique({
        where: {
          organizationId_phone: {
            organizationId,
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
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Soft delete a contact (requer permissão contacts:delete - ADMIN+)
 */
export const DELETE = withPermission(
  'contacts:delete',
  async (request: NextRequest, member, { params }: RouteParams) => {
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

      // Verifica se o contato pertence à organização do usuário (RLS já faz isso, mas double-check)
      if (existingContact.organizationId !== member.organizationId) {
        return permissionDeniedResponse('Acesso negado a este contato');
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
);
