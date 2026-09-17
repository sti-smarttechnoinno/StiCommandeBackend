'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { useUIStore } from '@/store';
import { useMediaQuery } from '@/hooks/use-media-query';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const collapsed = !isMobile && sidebarCollapsed;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : collapsed ? 72 : 280 }}
      >
        <Header />
        <main className="p-6 max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  );
}
