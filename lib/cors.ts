/**
 * Helpers para CORS (Cross-Origin Resource Sharing)
 * Permite que a API seja acessada de domínios externos
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Headers CORS padrão para permitir acesso de qualquer origem
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Cria uma resposta com headers CORS
 */
export function createCorsResponse(body: unknown, status: number = 200): NextResponse {
  const response = NextResponse.json(body, { status });
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Responde a requisições preflight OPTIONS
 */
export function handleCorsPreflight(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Adiciona headers CORS a uma resposta existente
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Verifica se é uma requisição preflight OPTIONS
 */
export function isPreflightRequest(request: NextRequest): boolean {
  return request.method === 'OPTIONS';
}
