/**
 * RBAC - Role-Based Access Control
 * 
 * Permissões granulares para organizações:
 * OWNER > ADMIN > MANAGER > MEMBER
 * 
 * Uso:
 *   const canDelete = checkPermission(member.role, 'contacts:delete');
 *   await requirePermission(request, 'contacts:delete');
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrganizationRole } from '@prisma/client';
import { getCurrentMember } from './helpers';

// ============================================================================
// DEFINIÇÃO DE PERMISSÕES
// ============================================================================

export type Permission =
  // Contatos
  | 'contacts:read'
  | 'contacts:create'
  | 'contacts:update'
  | 'contacts:update_own'
  | 'contacts:delete'
  | 'contacts:import'
  | 'contacts:export'

  // Deals/Pipeline
  | 'deals:read'
  | 'deals:read_all'
  | 'deals:create'
  | 'deals:update'
  | 'deals:update_own'
  | 'deals:delete'
  | 'deals:change_stage'

  // Mensagens
  | 'messages:read'
  | 'messages:send'
  | 'messages:use_templates'
  | 'messages:read_all'

  // Configurações
  | 'settings:read'
  | 'settings:update'
  | 'billing:read'
  | 'billing:manage'

  // Membros da organização
  | 'members:read'
  | 'members:invite'
  | 'members:update'
  | 'members:remove'
  | 'members:change_role'

  // Instâncias WhatsApp/Instagram
  | 'instances:read'
  | 'instances:connect'
  | 'instances:manage'
  | 'instances:delete'

  // Tags, Listas, Segmentos
  | 'tags:read'
  | 'tags:manage'
  | 'lists:read'
  | 'lists:manage'
  | 'segments:read'
  | 'segments:manage'

  // Pipeline Stages
  | 'pipeline:read'
  | 'pipeline:manage'

  // Dashboard/Relatórios
  | 'dashboard:read'
  | 'reports:read'
  | 'reports:export'

  // Agendamentos
  | 'schedules:read'
  | 'schedules:create'
  | 'schedules:update'
  | 'schedules:delete'

  // Metas
  | 'goals:read'
  | 'goals:manage'

  // Webhooks/Integrações
  | 'integrations:read'
  | 'integrations:manage'
  | 'webhooks:manage';

// ============================================================================
// MATRIZ DE PERMISSÕES
// ============================================================================

/**
 * Mapeamento de roles para permissões
 * Cada role herda as permissões das roles inferiores
 */
const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  // MEMBER: Acesso básico para operar no dia a dia
  MEMBER: [
    'contacts:read',
    'contacts:create',
    'contacts:update_own',
    'deals:read',
    'deals:update_own',
    'deals:change_stage',
    'messages:read',
    'messages:send',
    'messages:use_templates',
    'tags:read',
    'lists:read',
    'segments:read',
    'pipeline:read',
    'instances:read',
    'settings:read',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'dashboard:read',
  ],

  // MANAGER: Gerencia equipe e pipeline
  MANAGER: [
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'contacts:import',
    'contacts:export',
    'deals:read',
    'deals:read_all',
    'deals:create',
    'deals:update',
    'deals:change_stage',
    'messages:read',
    'messages:send',
    'messages:use_templates',
    'messages:read_all',
    'tags:read',
    'tags:manage',
    'lists:read',
    'lists:manage',
    'segments:read',
    'segments:manage',
    'pipeline:read',
    'pipeline:manage',
    'instances:read',
    'instances:connect',
    'settings:read',
    'settings:update',
    'members:read',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'schedules:delete',
    'goals:read',
    'dashboard:read',
    'reports:read',
  ],

  // ADMIN: Administrador do sistema
  ADMIN: [
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'contacts:delete',
    'contacts:import',
    'contacts:export',
    'deals:read',
    'deals:read_all',
    'deals:create',
    'deals:update',
    'deals:delete',
    'deals:change_stage',
    'messages:read',
    'messages:send',
    'messages:use_templates',
    'messages:read_all',
    'tags:read',
    'tags:manage',
    'lists:read',
    'lists:manage',
    'segments:read',
    'segments:manage',
    'pipeline:read',
    'pipeline:manage',
    'instances:read',
    'instances:connect',
    'instances:manage',
    'settings:read',
    'settings:update',
    'members:read',
    'members:invite',
    'members:update',
    'members:remove',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'schedules:delete',
    'goals:read',
    'goals:manage',
    'dashboard:read',
    'reports:read',
    'reports:export',
    'integrations:read',
    'integrations:manage',
    'webhooks:manage',
    'billing:read',
  ],

  // OWNER: Acesso total
  OWNER: [
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'contacts:delete',
    'contacts:import',
    'contacts:export',
    'deals:read',
    'deals:read_all',
    'deals:create',
    'deals:update',
    'deals:delete',
    'deals:change_stage',
    'messages:read',
    'messages:send',
    'messages:use_templates',
    'messages:read_all',
    'tags:read',
    'tags:manage',
    'lists:read',
    'lists:manage',
    'segments:read',
    'segments:manage',
    'pipeline:read',
    'pipeline:manage',
    'instances:read',
    'instances:connect',
    'instances:manage',
    'instances:delete',
    'settings:read',
    'settings:update',
    'members:read',
    'members:invite',
    'members:update',
    'members:remove',
    'members:change_role',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'schedules:delete',
    'goals:read',
    'goals:manage',
    'dashboard:read',
    'reports:read',
    'reports:export',
    'integrations:read',
    'integrations:manage',
    'webhooks:manage',
    'billing:read',
    'billing:manage',
  ],
};

// ============================================================================
// NÍVEIS DE HIERARQUIA
// ============================================================================

const ROLE_LEVELS: Record<OrganizationRole, number> = {
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================================================

/**
 * Verifica se um role tem uma permissão específica
 */
export function checkPermission(
  role: OrganizationRole | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Verifica se um role tem pelo menos uma das permissões
 */
export function checkAnyPermission(
  role: OrganizationRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some((p) => checkPermission(role, p));
}

/**
 * Verifica se um role tem todas as permissões
 */
export function checkAllPermissions(
  role: OrganizationRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.every((p) => checkPermission(role, p));
}

/**
 * Retorna o nível hierárquico de um role
 * Útil para comparações (ex: precisa ser MANAGER ou superior)
 */
export function getRoleLevel(role: OrganizationRole | null | undefined): number {
  if (!role) return 0;
  return ROLE_LEVELS[role] ?? 0;
}

/**
 * Verifica se o role é igual ou superior ao requerido
 */
export function checkRoleLevel(
  userRole: OrganizationRole | null | undefined,
  requiredRole: OrganizationRole
): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Retorna todas as permissões de um role
 */
export function getRolePermissions(role: OrganizationRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ============================================================================
// FUNÇÕES ASSÍNCRONAS PARA ENDPOINTS
// ============================================================================

/**
 * Interface do membro retornado por getCurrentMember
 */
interface CurrentMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: string;
}

/**
 * Verifica permissão e retorna erro 403 se não tiver
 * Uso em endpoints API Route
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<CurrentMember> {
  const member = await getCurrentMember(request);

  if (!member) {
    throw new PermissionError('Membro não encontrado na organização', 404);
  }

  if (member.status !== 'ACTIVE') {
    throw new PermissionError('Membro inativo na organização', 403);
  }

  if (!checkPermission(member.role, permission)) {
    throw new PermissionError(
      `Permissão negada: ${permission}. Role atual: ${member.role}`,
      403
    );
  }

  return member;
}

/**
 * Verifica qualquer uma das permissões
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<CurrentMember> {
  const member = await getCurrentMember(request);

  if (!member) {
    throw new PermissionError('Membro não encontrado na organização', 404);
  }

  if (member.status !== 'ACTIVE') {
    throw new PermissionError('Membro inativo na organização', 403);
  }

  if (!checkAnyPermission(member.role, permissions)) {
    throw new PermissionError(
      `Permissão negada. Requer uma das: ${permissions.join(', ')}`,
      403
    );
  }

  return member;
}

/**
 * Verifica se o usuário tem o nível de role mínimo
 */
export async function requireRoleLevel(
  request: NextRequest,
  minRole: OrganizationRole
): Promise<CurrentMember> {
  const member = await getCurrentMember(request);

  if (!member) {
    throw new PermissionError('Membro não encontrado na organização', 404);
  }

  if (member.status !== 'ACTIVE') {
    throw new PermissionError('Membro inativo na organização', 403);
  }

  if (!checkRoleLevel(member.role, minRole)) {
    throw new PermissionError(
      `Role insuficiente. Requer ${minRole} ou superior. Role atual: ${member.role}`,
      403
    );
  }

  return member;
}

/**
 * Retorna o membro atual sem verificar permissões
 * Útil quando a permissão depende de contexto
 */
export async function getCurrentMemberWithRole(
  request: NextRequest
): Promise<CurrentMember | null> {
  return getCurrentMember(request);
}

// ============================================================================
// CLASSE DE ERRO
// ============================================================================

export class PermissionError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'PermissionError';
    this.statusCode = statusCode;
  }
}

// ============================================================================
// HELPER PARA RESPOSTAS DE ERRO
// ============================================================================

export function permissionDeniedResponse(
  message: string = 'Permissão negada',
  permission?: Permission
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(permission && { requiredPermission: permission }),
    },
    { status: 403 }
  );
}

// ============================================================================
// DECORATOR/WAPPER PARA HANDLERS
// ============================================================================

/**
 * Wrapper para handlers de API que requer permissão
 * 
 * Uso:
 * export const DELETE = withPermission('contacts:delete', async (request, member) => {
 *   // Código do handler
 * });
 */
export function withPermission<T extends unknown[]>(
  permission: Permission,
  handler: (request: NextRequest, member: CurrentMember, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const member = await requirePermission(request, permission);
      return handler(request, member, ...args);
    } catch (error) {
      if (error instanceof PermissionError) {
        return permissionDeniedResponse(error.message, permission);
      }
      throw error;
    }
  };
}

/**
 * Wrapper com qualquer uma das permissões
 */
export function withAnyPermission<T extends unknown[]>(
  permissions: Permission[],
  handler: (request: NextRequest, member: CurrentMember, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const member = await requireAnyPermission(request, permissions);
      return handler(request, member, ...args);
    } catch (error) {
      if (error instanceof PermissionError) {
        return permissionDeniedResponse(error.message);
      }
      throw error;
    }
  };
}

/**
 * Wrapper com nível mínimo de role
 */
export function withMinRole<T extends unknown[]>(
  minRole: OrganizationRole,
  handler: (request: NextRequest, member: CurrentMember, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const member = await requireRoleLevel(request, minRole);
      return handler(request, member, ...args);
    } catch (error) {
      if (error instanceof PermissionError) {
        return permissionDeniedResponse(error.message);
      }
      throw error;
    }
  };
}
