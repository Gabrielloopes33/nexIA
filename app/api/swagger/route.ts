import { NextRequest, NextResponse } from 'next/server';
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
export async function GET(request: NextRequest) {
  // Detecta o host do request para configurar o servidor correto
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${protocol}://${host}/api` : undefined;
  
  const spec = getApiDocs(baseUrl);
  
  // Adiciona headers CORS para permitir acesso de qualquer origem
  const response = NextResponse.json(spec);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

/**
 * OPTIONS /api/swagger
 * Responde a requisições preflight CORS
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
