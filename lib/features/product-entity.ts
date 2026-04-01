import { prisma } from '@/lib/prisma'

/**
 * Verifica se a entidade Product está habilitada para a organização.
 * A flag é lida de organization.settings.productEntityEnabled.
 * Como fallback de rollout gradual, organizações específicas podem
 * ser habilitadas via env var ou hardcoded.
 */
export async function isProductEntityEnabled(organizationId: string): Promise<boolean> {
  // 1. Verifica se há override de ambiente para forçar globalmente
  const envOverride = process.env.PRODUCT_ENTITY_ENABLED
  if (envOverride === 'true') return true
  if (envOverride === 'false') return false

  // 2. Verifica se a org está na lista piloto (env var)
  const pilotOrgs = (process.env.PRODUCT_ENTITY_PILOT_ORGS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (pilotOrgs.includes(organizationId)) return true

  // 3. Lê do banco (settings JSON)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  })

  if (!org || !org.settings) return false

  const settings = org.settings as Record<string, unknown>
  return settings.productEntityEnabled === true
}

/**
 * Ativa ou desativa a feature flag para uma organização.
 * Requer permissão de OWNER/ADMIN (validada antes da chamada).
 */
export async function setProductEntityEnabled(
  organizationId: string,
  enabled: boolean
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  })

  const settings = (org?.settings as Record<string, unknown>) || {}
  settings.productEntityEnabled = enabled

  await prisma.organization.update({
    where: { id: organizationId },
    data: { settings: settings as any },
  })
}
