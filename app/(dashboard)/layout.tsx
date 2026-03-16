import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { KpiColumn } from '@/components/dashboard/layout/KpiColumn';

/**
 * Layout do Dashboard
 * 
 * Estrutura:
 * - Sidebar fixa (280px)
 * - Coluna de KPIs (100px)
 * - Main content (flex-1)
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - 280px */}
      <aside className="w-[280px] flex-shrink-0 bg-white border-r">
        <Sidebar />
      </aside>
      
      {/* KPI Column - 100px */}
      <div className="w-[100px] flex-shrink-0 bg-white border-r">
        <KpiColumn />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
