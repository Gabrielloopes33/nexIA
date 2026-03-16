/**
 * Contacts API Route
 * GET: List all contacts for an organization
 * POST: Create a new contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * GET /api/contacts
 * List all contacts for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    let organizationId = searchParams.get('organizationId');
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

    // Busca organização válida
    if (organizationId === 'default_org_id') {
      const { data: existingOrg } = await supabaseServer
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      organizationId = existingOrg?.id || organizationId;
    }

    // Build query
    let query = supabaseServer
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('last_interaction_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contacts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contacts || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + (contacts?.length || 0) < (count || 0),
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
      email,
      phone, 
      avatarUrl,
      notes,
      metadata,
      tags,
      status,
      source,
    } = body;

    console.log('[Contacts POST] Body:', body);

    // Validate required fields
    if (!organizationId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, phone' },
        { status: 400 }
      );
    }

    // Busca organização válida
    let orgId = organizationId;
    if (organizationId === 'default_org_id') {
      const { data: existingOrg } = await supabaseServer
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        // Cria organização default
        const { data: newOrg, error: orgError } = await supabaseServer
          .from('organizations')
          .insert({
            name: 'Default Organization',
            slug: 'default',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (orgError || !newOrg) {
          return NextResponse.json(
            { success: false, error: 'Failed to create organization', details: orgError?.message },
            { status: 500 }
          );
        }
        
        orgId = newOrg.id;
      }
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check if contact already exists
    const { data: existingContact, error: checkError } = await supabaseServer
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone', normalizedPhone)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking existing contact:', checkError);
    }

    if (existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact with this phone number already exists' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { data: contact, error } = await supabaseServer
      .from('contacts')
      .insert({
        organization_id: orgId,
        phone: normalizedPhone,
        name: name || null,
        email: email || null,
        avatar_url: avatarUrl || null,
        notes: notes || null,
        metadata: metadata || {},
        tags: tags || [],
        status: status || 'ACTIVE',
        source: source || null,
        lead_score: 0,
        created_at: now,
        updated_at: now,
        last_interaction_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create contact', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contact', details: error.message },
      { status: 500 }
    );
  }
}
