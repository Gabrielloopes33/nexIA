/**
 * SSE endpoint para atualizações em tempo real de uma conversa.
 * Envia eventos de novas mensagens e estado de digitação.
 * A conexão dura até ~20s, o EventSource do browser reconecta automaticamente.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

const POLL_INTERVAL_MS = 2000;  // checar DB a cada 2s
const MAX_DURATION_MS  = 20000; // fechar após 20s (Netlify timeout safety)

export async function GET(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const organizationId = user.organizationId;

  if (!organizationId) {
    return new Response('No organization', { status: 400 });
  }

  // Verifica que a conversa pertence à organização
  const conversation = await prisma.conversation.findFirst({
    where: { id, organizationId },
  });
  if (!conversation) {
    return new Response('Not found', { status: 404 });
  }

  // Marca o ponto de início: só envia mensagens criadas APÓS a conexão
  // (o cliente já tem as antigas via SWR)
  const lastEventId = request.headers.get('last-event-id');
  let lastCheckedAt = lastEventId ? new Date(lastEventId) : new Date();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let lastTyping: boolean | null = null;

      const send = (event: string, data: unknown, id?: string) => {
        if (closed) return;
        let chunk = '';
        if (id) chunk += `id: ${id}\n`;
        chunk += `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      // Heartbeat inicial
      send('connected', { conversationId: id });

      const poll = async () => {
        if (closed) return;

        try {
          // 1. Novas mensagens
          const newMessages = await prisma.message.findMany({
            where: {
              conversationId: id,
              createdAt: { gt: lastCheckedAt },
            },
            orderBy: { createdAt: 'asc' },
          });

          if (newMessages.length > 0) {
            const latestAt = newMessages[newMessages.length - 1].createdAt;
            lastCheckedAt = latestAt;
            // Envia as mensagens completas para o cliente atualizar o cache sem re-fetch
            send('messages', { count: newMessages.length, messages: newMessages }, latestAt.toISOString());
          }

          // 2. Estado de digitação
          const conv = await prisma.conversation.findUnique({
            where: { id },
            select: { typingUntil: true, typingPhone: true },
          });

          const isTyping = !!(conv?.typingUntil && conv.typingUntil > new Date());
          if (isTyping !== lastTyping) {
            lastTyping = isTyping;
            send('typing', { isTyping, phone: conv?.typingPhone ?? null });
          }
        } catch (err) {
          console.error('[SSE] Poll error:', err);
        }
      };

      // Poll loop
      const timer = setInterval(poll, POLL_INTERVAL_MS);

      // Fecha automaticamente após MAX_DURATION_MS (reconnect pelo EventSource)
      const maxTimer = setTimeout(() => {
        closed = true;
        clearInterval(timer);
        try { controller.close(); } catch {}
      }, MAX_DURATION_MS);

      // Client desconectou
      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(timer);
        clearTimeout(maxTimer);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
