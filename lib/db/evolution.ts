/**
 * Evolution Database Operations
 * 
 * Funções de acesso ao banco de dados para a integração Evolution API (WhatsApp não oficial).
 * 
 * @module lib/db/evolution
 */

import { prisma } from '@/lib/prisma';
import type { EvolutionInstance } from '@/lib/types/evolution';

// ============================================
// INSTANCE CRUD OPERATIONS
// ============================================

/**
 * Lista todas as instâncias Evolution de uma organização
 */
export async function getEvolutionInstances(organizationId: string): Promise<EvolutionInstance[]> {
  return prisma.evolutionInstance.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Busca uma instância Evolution pelo ID
 */
export async function getEvolutionInstanceById(
  id: string, 
  organizationId: string
): Promise<EvolutionInstance | null> {
  return prisma.evolutionInstance.findFirst({
    where: { id, organizationId },
  });
}

/**
 * Busca uma instância Evolution pelo nome da instância
 */
export async function getEvolutionInstanceByName(
  instanceName: string, 
  organizationId: string
): Promise<EvolutionInstance | null> {
  return prisma.evolutionInstance.findFirst({
    where: { instanceName, organizationId },
  });
}

// ============================================
// CREATE & UPDATE OPERATIONS
// ============================================

interface CreateEvolutionInstanceInput {
  organizationId: string;
  name: string;
  instanceName: string;
  apiKey?: string;
  webhookUrl?: string;
}

/**
 * Cria uma nova instância Evolution
 */
export async function createEvolutionInstance(
  data: CreateEvolutionInstanceInput
): Promise<EvolutionInstance> {
  return prisma.evolutionInstance.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      instanceName: data.instanceName,
      apiKey: data.apiKey,
      webhookUrl: data.webhookUrl,
      status: 'DISCONNECTED',
      webhookEnabled: !!data.webhookUrl,
      messagesSent: 0,
      messagesReceived: 0,
    },
  });
}

/**
 * Atualiza uma instância Evolution
 */
export async function updateEvolutionInstance(
  id: string,
  organizationId: string,
  data: Partial<EvolutionInstance>
): Promise<EvolutionInstance> {
  return prisma.evolutionInstance.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Atualiza o status de uma instância Evolution
 */
export async function updateInstanceStatus(
  id: string,
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR',
  additionalData?: Partial<EvolutionInstance>
): Promise<EvolutionInstance> {
  const updateData: Record<string, unknown> = {
    status,
    ...additionalData,
    lastActivityAt: new Date(),
  };

  if (status === 'CONNECTED') {
    updateData.connectedAt = new Date();
    updateData.disconnectedAt = null;
  }

  if (status === 'DISCONNECTED' || status === 'ERROR') {
    updateData.disconnectedAt = new Date();
  }

  return prisma.evolutionInstance.update({
    where: { id },
    data: updateData,
  });
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Remove uma instância Evolution
 */
export async function deleteEvolutionInstance(
  id: string, 
  organizationId: string
): Promise<void> {
  await prisma.evolutionInstance.delete({
    where: { id },
  });
}

// ============================================
// PROFILE & METADATA OPERATIONS
// ============================================

interface ProfileUpdateData {
  profileName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

/**
 * Atualiza as informações de perfil de uma instância
 */
export async function updateInstanceProfile(
  id: string,
  profileData: ProfileUpdateData
): Promise<EvolutionInstance> {
  return prisma.evolutionInstance.update({
    where: { id },
    data: {
      profileName: profileData.profileName,
      phoneNumber: profileData.phoneNumber,
      profilePictureUrl: profileData.profilePictureUrl,
      updatedAt: new Date(),
    },
  });
}

/**
 * Configura o webhook de uma instância
 */
export async function configureInstanceWebhook(
  id: string,
  webhookUrl: string,
  enabled: boolean
): Promise<EvolutionInstance> {
  return prisma.evolutionInstance.update({
    where: { id },
    data: {
      webhookUrl,
      webhookEnabled: enabled,
      updatedAt: new Date(),
    },
  });
}

// ============================================
// METRICS OPERATIONS
// ============================================

/**
 * Incrementa o contador de mensagens enviadas
 */
export async function incrementMessagesSent(instanceId: string): Promise<void> {
  await prisma.evolutionInstance.update({
    where: { id: instanceId },
    data: {
      messagesSent: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });
}

/**
 * Incrementa o contador de mensagens recebidas
 */
export async function incrementMessagesReceived(instanceId: string): Promise<void> {
  await prisma.evolutionInstance.update({
    where: { id: instanceId },
    data: {
      messagesReceived: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });
}

/**
 * Obtém estatísticas de mensagens de uma instância
 */
export async function getInstanceMessageStats(
  instanceId: string
): Promise<{ sent: number; received: number } | null> {
  const instance = await prisma.evolutionInstance.findUnique({
    where: { id: instanceId },
    select: {
      messagesSent: true,
      messagesReceived: true,
    },
  });

  if (!instance) return null;

  return {
    sent: instance.messagesSent,
    received: instance.messagesReceived,
  };
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Atualiza o status de todas as instâncias de uma organização
 */
export async function updateAllInstancesStatus(
  organizationId: string,
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
): Promise<number> {
  const result = await prisma.evolutionInstance.updateMany({
    where: { organizationId },
    data: {
      status,
      updatedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Lista instâncias conectadas de uma organização
 */
export async function getConnectedInstances(
  organizationId: string
): Promise<EvolutionInstance[]> {
  return prisma.evolutionInstance.findMany({
    where: {
      organizationId,
      status: 'CONNECTED',
    },
    orderBy: { lastActivityAt: 'desc' },
  });
}

/**
 * Conta instâncias por status
 */
export async function countInstancesByStatus(
  organizationId: string
): Promise<Record<string, number>> {
  const counts = await prisma.evolutionInstance.groupBy({
    by: ['status'],
    where: { organizationId },
    _count: {
      status: true,
    },
  });

  return counts.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);
}
