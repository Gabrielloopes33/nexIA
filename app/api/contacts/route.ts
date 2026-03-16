/**
 * Contacts API Route
 * GET: List all contacts for an organization
 * POST: Create a new contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/contacts
 * List all contacts for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | null;
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { 
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };
    
    if (status) where.status = status;
    if (tags?.length) where.tags = { hasSome: tags };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { lastInteractionAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + contacts.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Create a new contact
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      organizationId, 
      name, 
      phone, 
      avatarUrl,
      metadata,
      tags,
      status,
    } = body;

    // Validate required fields
    if (!organizationId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, phone' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: {
        organizationId_phone: {
          organizationId,
          phone: normalizedPhone,
        },
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact with this phone number already exists' },
        { status: 409 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        organizationId,
        phone: normalizedPhone,
        name: name || null,
        avatarUrl: avatarUrl || null,
        metadata: metadata || {},
        tags: tags || [],
        status: status || 'ACTIVE',
        leadScore: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: contact,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
