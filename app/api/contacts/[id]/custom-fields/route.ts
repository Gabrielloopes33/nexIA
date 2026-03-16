/**
 * Contact Custom Fields API Route
 * GET: List custom field values for a contact
 * POST/PUT: Set custom field value for a contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/contacts/[id]/custom-fields
 * List custom field values for a contact
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    const customFieldValues = await prisma.contactCustomFieldValue.findMany({
      where: { contactId: id },
      include: {
        field: true,
      },
      orderBy: { field: { displayOrder: 'asc' } },
    });

    return NextResponse.json({
      success: true,
      data: customFieldValues.map(cf => ({
        id: cf.id,
        value: cf.value,
        field: cf.field,
        updatedAt: cf.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching contact custom fields:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact custom fields' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts/[id]/custom-fields
 * Set custom field value for a contact
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fieldId, value } = body;

    if (!fieldId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: fieldId' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    const field = await prisma.customFieldDefinition.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return NextResponse.json(
        { success: false, error: 'Custom field not found' },
        { status: 404 }
      );
    }

    // Upsert the value (create or update)
    const customFieldValue = await prisma.contactCustomFieldValue.upsert({
      where: {
        contactId_fieldId: {
          contactId: id,
          fieldId,
        },
      },
      update: {
        value: value || null,
      },
      create: {
        contactId: id,
        fieldId,
        value: value || null,
      },
      include: {
        field: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: customFieldValue,
    }, { status: 201 });
  } catch (error) {
    console.error('Error setting custom field value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set custom field value' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]/custom-fields?fieldId=xxx
 * Remove custom field value from a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: fieldId' },
        { status: 400 }
      );
    }

    const existingValue = await prisma.contactCustomFieldValue.findUnique({
      where: {
        contactId_fieldId: {
          contactId: id,
          fieldId,
        },
      },
    });

    if (!existingValue) {
      return NextResponse.json(
        { success: false, error: 'Custom field value not found' },
        { status: 404 }
      );
    }

    await prisma.contactCustomFieldValue.delete({
      where: {
        contactId_fieldId: {
          contactId: id,
          fieldId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field value removed successfully',
    });
  } catch (error) {
    console.error('Error removing custom field value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove custom field value' },
      { status: 500 }
    );
  }
}
