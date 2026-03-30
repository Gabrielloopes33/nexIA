/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticação e autorização
 *
 * /api/auth/token:
 *   post:
 *     summary: Gera um token JWT para uso em integrações
 *     description: |
 *       Autentica com email/senha e retorna um token JWT que pode ser usado 
 *       no header Authorization (Bearer token) para acessar as APIs.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token JWT para uso no header Authorization
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         organizationId:
 *                           type: string
 *                         role:
 *                           type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/server';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';

/**
 * OPTIONS /api/auth/token
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return handleCorsPreflight();
}

/**
 * POST /api/auth/token
 * Generate a JWT token for API usage (integrations)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            organization: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get active membership
    const membership = user.memberships[0];
    const organizationId = membership?.organizationId || null;
    const role = membership?.role || null;

    // Generate token (7 days expiration)
    const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + SESSION_DURATION_MS;

    // Sign token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId,
      setupComplete: true,
      expiresAt,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId,
          role,
        },
        expiresAt: new Date(expiresAt).toISOString(),
      },
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error('[Auth Token] Error:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
