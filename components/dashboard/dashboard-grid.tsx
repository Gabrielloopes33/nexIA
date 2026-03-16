import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

/**
 * Tipos de layout suportados
 */
export type DashboardLayout = '2-1' | '1-1' | '3-1' | 'sidebar'

/**
 * Props do DashboardGrid
 */
export interface DashboardGridProps {
  children: ReactNode
  className?: string
  /**
   * Conteúdo da sidebar (KPIs verticais)
   */
  sidebar?: ReactNode
  /**
   * Gap entre os cards (padrão: 5 = 1.25rem = 20px)
   */
  gap?: 2 | 3 | 4 | 5 | 6
  /**
   * Layout do grid
   * - 'sidebar': Sidebar (100px) + Conteúdo principal (padrão)
   * - '2-1': 2 colunas na primeira, 1 na segunda
   * - '1-1': Colunas iguais
   * - '3-1': 3 partes na primeira, 1 na segunda
   */
  layout?: DashboardLayout
}

/**
 * Configurações de layout para o grid
 */
const layoutClasses: Record<DashboardLayout, string> = {
  'sidebar': 'xl:grid-cols-[160px_1fr]',
  '2-1': 'xl:grid-cols-[2fr_1fr]',
  '1-1': 'xl:grid-cols-[1fr_1fr]',
  '3-1': 'xl:grid-cols-[3fr_1fr]',
}

/**
 * DashboardGrid - Container de grid para cards do dashboard
 * 
 * Layouts suportados:
 * - 'sidebar': Coluna de KPIs (100px) + conteúdo principal
 * - '2-1': Grid 2:1 para distribuição assimétrica
 * - '1-1': Grid simétrico 1:1
 * - '3-1': Grid 3:1 para conteúdo principal maior
 * 
 * Responsivo: stack em mobile (uma coluna), grid em desktop (xl)
 * Gap padrão: 20px (gap-5)
 * 
 * @example
 * ```tsx
 * // Com sidebar de KPIs
 * <DashboardGrid sidebar={<KpiSidebar />} layout="sidebar">
 *   <DashboardRow columns={2}>
 *     <FunilCard />
 *     <LeadsCard />
 *   </DashboardRow>
 * </DashboardGrid>
 * 
 * // Layout 2-1 sem sidebar
 * <DashboardGrid layout="2-1">
 *   <div>Conteúdo principal (2/3)</div>
 *   <div>Sidebar conteúdo (1/3)</div>
 * </DashboardGrid>
 * ```
 */
export function DashboardGrid({
  children,
  className,
  sidebar,
  gap = 5,
  layout = 'sidebar',
}: DashboardGridProps) {
  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
  }

  return (
    <div 
      className={cn(
        'grid grid-cols-1',
        layoutClasses[layout],
        gapClasses[gap],
        className
      )}
    >
      {/* Sidebar Column (apenas quando layout='sidebar' e sidebar existe) */}
      {layout === 'sidebar' && sidebar && (
        <aside className="kpi-sidebar flex flex-col gap-3">
          {sidebar}
        </aside>
      )}
      
      {/* Main Content Column */}
      <main className="main-content flex flex-col gap-5">
        {children}
      </main>
    </div>
  )
}

/**
 * Sub-componente para linhas de cards no grid principal
 */
export interface DashboardRowProps {
  children: ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
  gap?: 2 | 3 | 4 | 5
}

/**
 * DashboardRow - Linha de cards dentro do grid
 * 
 * Distribui os cards filhos em colunas responsivas
 * Em mobile: sempre 1 coluna
 * Em desktop: respeita o número de colunas definido
 */
export function DashboardRow({
  children,
  className,
  columns = 2,
  gap = 5,
}: DashboardRowProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
  }

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

export default DashboardGrid
