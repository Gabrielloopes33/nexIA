/**
 * Server-side organization utilities
 * For use in API routes and middleware
 */

import { prisma } from '@/lib/prisma'

export type OrganizationType = 'REGULAR' | 'RESELLER'

export interface OrganizationData {
  id: string
  name: string
  slug: string
  type: OrganizationType
  setupComplete: boolean
  logoUrl: string | null
  segment: string | null
}

/**
 * Busca uma organização pelo ID
 * 
 * @param organizationId - ID da organização
 * @returns Dados da organização ou null se não encontrada
 */
export async function getOrganization(
  organizationId: string
): Promise<OrganizationData | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      setupComplete: true,
      logoUrl: true,
      segment: true,
    },
  })

  return org
}

/**
 * Verifica se o usuário é membro da organização
 * 
 * @param userId - ID do usuário
 * @param organizationId - ID da organização
 * @returns true se for membro ativo
 */
export async function isOrganizationMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: 'ACTIVE',
    },
  })

  return !!membership
}

/**
 * Verifica se o onboarding da organização está completo
 * 
 * @param organizationId - ID da organização
 * @returns true se setupComplete for true
 */
export async function isOnboardingComplete(
  organizationId: string
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { setupComplete: true },
  })

  return org?.setupComplete ?? false
}
