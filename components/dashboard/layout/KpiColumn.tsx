'use client';

import { useKpisData } from '@/hooks/dashboard/useKpisData';
import { KpiItem } from '../kpis/KpiItem';
import { KpiColumnSkeleton } from '../skeletons/KpiSkeleton';

/**
 * Coluna vertical de KPIs (100px de largura)
 * 
 * Exibe 5 KPIs em coluna vertical:
 * - Leads Semana
 * - Receita Fechada
 * - Taxa Conversão
 * - Pipeline Valor
 * - Tempo Médio Conversão
 */
export function KpiColumn() {
  const { data, isLoading, isError } = useKpisData();

  if (isLoading) {
    return <KpiColumnSkeleton />;
  }

  if (isError || !data || !data.kpis || !Array.isArray(data.kpis)) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-red-500 text-center">Erro ao carregar</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      {data.kpis.map((kpi) => (
        <KpiItem key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
