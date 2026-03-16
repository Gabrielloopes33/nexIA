'use client';

import { Home, BarChart3, Users, Settings, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Users, label: 'Leads', href: '/leads' },
  { icon: Settings, label: 'Config', href: '/settings' },
];

/**
 * Sidebar de navegação (280px)
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <BarChart3 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">SalesDash</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* Help */}
      <div className="p-4 border-t">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-gray-100 transition-colors w-full">
          <HelpCircle className="w-5 h-5" />
          Ajuda
        </button>
      </div>
    </div>
  );
}
