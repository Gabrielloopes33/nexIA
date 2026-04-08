import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers';
import { AutomationLogStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/automations/[id]/logs
 * Retorna os logs de execução de uma automação
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const organizationId = await getOrganizationId();
    const { id: automationId } = await params;
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusFilter = searchParams.get('status') as AutomationLogStatus | null;
    
    // Verificar se a automação pertence à organização
    const automation = await prisma.pipelineAutomation.findFirst({
      where: {
        id: automationId,
        organizationId
      }
    });
    
    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automação não encontrada' },
        { status: 404 }
      );
    }
    
    // Construir where clause
    const where: any = {
      automationId,
      organizationId
    };
    
    if (statusFilter) {
      where.status = statusFilter;
    }
    
    // Buscar logs com paginação
    const [logs, totalCount] = await Promise.all([
      prisma.automationLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: Math.min(limit, 100), // Máximo 100 registros por vez
        skip: offset,
        include: {
          deal: {
            select: { 
              id: true, 
              title: true 
            }
          }
        }
      }),
      prisma.automationLog.count({ where })
    ]);
    
    // Calcular estatísticas
    const stats = await prisma.automationLog.groupBy({
      by: ['status'],
      where: { automationId, organizationId },
      _count: { status: true }
    });
    
    const statusCounts = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + logs.length < totalCount
      },
      stats: {
        total: totalCount,
        success: statusCounts[AutomationLogStatus.SUCCESS] || 0,
        failed: statusCounts[AutomationLogStatus.FAILED] || 0,
        skipped: statusCounts[AutomationLogStatus.SKIPPED] || 0,
        pending: statusCounts[AutomationLogStatus.PENDING] || 0
      }
    });
  } catch (error) {
    console.error('[Automation Logs] Erro ao buscar logs:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar logs' },
      { status: 500 }
    );
  }
}
