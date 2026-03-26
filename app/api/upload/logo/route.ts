import { NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

/**
 * POST /api/upload/logo
 * 
 * Endpoint para upload de logo da organização.
 * Atualmente retorna uma URL mockada - em produção, integrar com
 * serviço de storage (S3, Cloudflare R2, Supabase Storage, etc.)
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()

    // Verifica se o content-type é multipart/form-data
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      )
    }

    // Parse do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validações do arquivo
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 5MB' },
        { status: 400 }
      )
    }

    // Valida o tipo do arquivo (apenas imagens)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de arquivo não suportado. Apenas imagens são permitidas (JPEG, PNG, GIF, WebP, SVG)',
          receivedType: file.type
        },
        { status: 400 }
      )
    }

    // TODO: Em produção, fazer upload para serviço de storage
    // Exemplos:
    // - AWS S3
    // - Cloudflare R2
    // - Supabase Storage
    // - Cloudinary
    // - etc.

    // Por enquanto, retorna uma URL mockada
    // Em produção, o arquivo seria salvo e a URL real seria retornada
    const mockUrl = generateMockLogoUrl(file.name, user.userId)

    console.log('[API] Logo recebido:', {
      originalName: file.name,
      type: file.type,
      size: file.size,
      userId: user.userId,
      mockUrl,
    })

    return NextResponse.json({
      success: true,
      url: mockUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      message: 'Upload simulado - em produção, o arquivo será salvo no storage',
    })
  } catch (error) {
    console.error('[API] Erro no upload de logo:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno no upload do arquivo' },
      { status: 500 }
    )
  }
}

/**
 * Gera uma URL mockada para o logo
 * Em produção, isso seria substituído pela URL real do storage
 */
function generateMockLogoUrl(fileName: string, userId: string): string {
  const timestamp = Date.now()
  const extension = fileName.split('.').pop() || 'png'
  return `https://storage.nexia.chat/logos/${userId}/${timestamp}-logo.${extension}`
}
