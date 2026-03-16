import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

/**
 * @swagger
 * /api/swagger:
 *   get:
 *     summary: Retorna a especificação OpenAPI/Swagger
 *     tags: [Docs]
 *     responses:
 *       200:
 *         description: Especificação OpenAPI em formato JSON
 */
export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
