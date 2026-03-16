import { DashboardGrid } from '@/components/dashboard/layout/DashboardGrid';

/**
 * Página principal do Dashboard
 * 
 * Layout:
 * | Sidebar 280px | KPIs 100px | Main Grid | Contact Panel |
 */
export default function DashboardPage() {
  return (
    <div className="p-6">
      <DashboardGrid />
    </div>
  );
}
