/**
 * @swagger
 * /api/integrations/webhooks/test:
 *   post:
 *     summary: Testa um webhook enviando uma requisição de teste
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - webhookId
 *             properties:
 *               webhookId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do webhook a ser testado
 *               testPayload:
 *                 type: object
 *                 description: Payload customizado para o teste (opcional)
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
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
 *                     status:
 *                       type: string
 *                     statusCode:
 *                       type: integer
 *                     responseTime:
 *                       type: integer
 *                       description: Tempo de resposta em ms
 *                     responseBody:
 *                       type: object
 *                     requestPayload:
 *                       type: object
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Webhook não encontrado
 *       500:
 *         description: Erro interno
 */

/**
 * Webhook Test API Route
 * POST: Send a test request to a webhook URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface TestResult {
  status: 'success' | 'error';
  statusCode?: number;
  responseTime: number;
  responseBody?: string;
  requestPayload: Record<string, unknown>;
  error?: string;
}

/**
 * POST /api/integrations/webhooks/test
 * Send a test request to a webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { webhookId, testPayload } = body;

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'webhookId is required' },
        { status: 400 }
      );
    }

    // Buscar o webhook
    const webhook = await prisma.outgoingWebhook.findFirst({
      where: { 
        id: webhookId,
        organizationId: (user as { organization?: { id: string } }).organization?.id,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Preparar payload de teste
    const defaultPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      organizationId: webhook.organizationId,
      webhookId: webhook.id,
      webhookName: webhook.name,
      data: {
        message: 'Este é um teste do webhook',
        test: true,
        example: {
          contact: {
            id: 'test-contact-id',
            name: 'Contato de Teste',
            email: 'test@exemplo.com',
            phone: '+5511999999999',
          },
          deal: {
            id: 'test-deal-id',
            title: 'Oportunidade de Teste',
            value: 1000,
            status: 'OPEN',
          },
        },
      },
    };

    const payload = testPayload || defaultPayload;

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Test': 'true',
      'X-Webhook-Id': webhook.id,
      'X-Webhook-Event': 'test',
      'X-Webhook-Timestamp': new Date().toISOString(),
    };

    // Adicionar headers customizados do webhook
    if (webhook.headers && typeof webhook.headers === 'object') {
      Object.entries(webhook.headers as Record<string, string>).forEach(([key, value]) => {
        headers[key] = value;
      });
    }

    // Enviar requisição de teste
    let result: TestResult;
    
    try {
      const fetchStart = Date.now();
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        // Timeout de 10 segundos para testes
        signal: AbortSignal.timeout(10000),
      });
      const responseTime = Date.now() - fetchStart;

      // Tentar ler o corpo da resposta
      let responseBody: string | undefined;
      try {
        responseBody = await response.text();
      } catch {
        // Ignora erro ao ler o corpo
      }

      result = {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        responseBody: responseBody || undefined,
        requestPayload: payload,
      };

      // Atualizar o webhook com o resultado do teste
      await prisma.outgoingWebhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          lastResponseStatus: response.status,
          status: response.ok ? 'active' : 'error',
        },
      });

      // Registrar log da atividade sem bloquear o teste
      try {
        await prisma.integrationActivityLog.create({
          data: {
            id: randomUUID(),
            organizationId: webhook.organizationId,
            integrationType: 'WEBHOOK',
            instanceId: webhook.id,
            activityType: 'WEBHOOK_SENT',
            status: response.ok ? 'SUCCESS' : 'FAILED',
            title: response.ok ? 'Teste de webhook bem-sucedido' : 'Teste de webhook falhou',
            description: `Requisição de teste enviada para ${webhook.url}. Status: ${response.status}`,
            requestPayload: payload,
            responsePayload: responseBody ? { body: responseBody } : null,
            httpMethod: 'POST',
            httpStatusCode: response.status,
            webhookUrl: webhook.url,
            durationMs: responseTime,
            completedAt: new Date(),
          },
        });
      } catch (logError) {
        console.error('Failed to create integration activity log for webhook test success:', logError);
      }

    } catch (fetchError) {
      const responseTime = Date.now() - startTime;
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';

      result = {
        status: 'error',
        responseTime,
        requestPayload: payload,
        error: errorMessage,
      };

      // Atualizar o webhook com status de erro
      await prisma.outgoingWebhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          status: 'error',
        },
      });

      // Registrar log de erro sem bloquear o retorno
      try {
        await prisma.integrationActivityLog.create({
          data: {
            id: randomUUID(),
            organizationId: webhook.organizationId,
            integrationType: 'WEBHOOK',
            instanceId: webhook.id,
            activityType: 'WEBHOOK_SENT',
            status: 'FAILED',
            title: 'Teste de webhook falhou',
            description: `Falha ao enviar requisição de teste para ${webhook.url}: ${errorMessage}`,
            requestPayload: payload,
            errorMessage: errorMessage,
            webhookUrl: webhook.url,
            durationMs: responseTime,
            completedAt: new Date(),
          },
        });
      } catch (logError) {
        console.error('Failed to create integration activity log for webhook test failure:', logError);
      }
    }

    return NextResponse.json({
      success: result.status === 'success',
      data: result,
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
