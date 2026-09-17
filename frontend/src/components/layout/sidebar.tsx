'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/constants';
import { useUIStore } from '@/store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useWebSocketOrders } from '@/hooks/use-websocket-orders';
import { notificationsService } from '@/services/notifications';
import { useNotificationsStore } from '@/features/notifications/store';
import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const collapsed = !isMobile && sidebarCollapsed;
  const { unvalidatedCount } = useWebSocketOrders();
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const { can, user } = usePermissions();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ Vente: true });

  useEffect(() => {
    if (pathname.startsWith('/orders') || pathname.startsWith('/delivery-notes')) {
      setOpenSections((prev) => ({ ...prev, Vente: true }));
    }
  }, [pathname]);

  useEffect(() => {
    notificationsService
      .getKpis()
      .then((res) => setUnreadNotificationsCount(res.unreadCount))
      .catch(() => setUnreadNotificationsCount(0));
  }, [refreshKey, pathname]);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.permission && !can(item.permission)) {
      return false;
    }
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    if (item.children && item.children.length > 0) {
      const hasVisibleChild = item.children.some((child) => {
        if (child.permission && !can(child.permission)) return false;
        if (child.adminOnly && user?.role !== 'admin') return false;
        return true;
      });
      if (!hasVisibleChild) return false;
    }
    return true;
  });

  return (
    <>
      {isMobile && sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-border flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[280px]',
          isMobile
            ? sidebarMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0'
        )}
      >
        {/* Header with Centered Larger Logo & Refined Text */}
        <div className="flex flex-col items-center justify-center text-center px-4 py-6 border-b border-border/40">
          {collapsed ? (
            <div className="relative w-10 h-10 flex items-center justify-center">
              <Image
                src="/assets/logo-sti.png"
                alt="STI Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-3 w-full">
              {/* Centered Bigger Logo Image */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <Image
                  src="/assets/logo-sti.png"
                  alt="STI Logo"
                  width={96}
                  height={96}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Centered Refined Text Below Logo */}
              <div className="text-center">
                <span className="block text-xl font-bold tracking-tight text-foreground leading-none">
                  STI
                </span>
                <span className="block text-sm font-semibold text-primary mt-1.5 leading-none">
                  Distribution
                </span>
                <span className="block text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mt-2.5">
                  Système de Gestion ERP
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items Filtered by Permissions */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            // Handle Section with Children (e.g. Vente -> Commandes, Bons de Livraison)
            if (item.children && item.children.length > 0) {
              const visibleChildren = item.children.filter((child) => {
                if (child.permission && !can(child.permission)) return false;
                if (child.adminOnly && user?.role !== 'admin') return false;
                return true;
              });

              const isChildActive = visibleChildren.some(
                (child) => pathname === child.href || pathname.startsWith(child.href + '/')
              );
              const isOpen = openSections[item.label] ?? false;

              let sectionBadge: number | undefined;
              if (unvalidatedCount > 0 && visibleChildren.some((c) => c.href === '/orders')) {
                sectionBadge = unvalidatedCount;
              }

              // Collapsed Sidebar View for Dropdown Section (Pop-out on click)
              if (collapsed) {
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger
                      className="w-full flex justify-center outline-none"
                    >
                      <div
                        className={cn(
                          'group relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all duration-200 mb-1 cursor-pointer',
                          isChildActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        title={item.label}
                      >
                        {isChildActive && (
                          <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                        )}
                        <Icon className={cn('h-5 w-5', isChildActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100')} />
                        {sectionBadge && sectionBadge > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse border-2 border-white" />
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      sideOffset={14}
                      className="w-56 p-2 shadow-xl bg-white dark:bg-card border border-border rounded-2xl z-50 animate-in fade-in-0 zoom-in-95"
                    >
                      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>{item.label}</span>
                        {sectionBadge && (
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
                            {sectionBadge}
                          </span>
                        )}
                      </div>
                      <div className="h-px bg-border/50 my-1" />
                      <div className="space-y-0.5">
                        {visibleChildren.map((subItem) => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                          const SubIcon = subItem.icon;
                          let subBadge: number | undefined;
                          if (subItem.href === '/orders' && unvalidatedCount > 0) {
                            subBadge = unvalidatedCount;
                          }
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                                isSubActive
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'text-foreground hover:bg-muted'
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <SubIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{subItem.label}</span>
                              </div>
                              {subBadge && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none shadow-xs">
                                  {subBadge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              // Expanded Sidebar View for Dropdown Section (Collapsible Accordion)
              return (
                <div key={item.label} className="mb-0.5">
                  <button
                    type="button"
                    onClick={() => setOpenSections((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                    className={cn(
                      'w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                      isChildActive
                        ? 'bg-primary/5 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {isChildActive && (
                      <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-5 w-5 flex-shrink-0', isChildActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100')} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOpen && sectionBadge && sectionBadge > 0 && (
                        <span className="bg-amber-500 animate-pulse text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none shadow-xs">
                          {sectionBadge}
                        </span>
                      )}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200 opacity-60 group-hover:opacity-100',
                          isOpen && 'rotate-180 text-foreground'
                        )}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="ml-5 pl-4 pr-1 py-1 space-y-1 border-l-2 border-primary/20 my-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                      {visibleChildren.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                        const SubIcon = subItem.icon;
                        let subBadge: number | undefined;
                        if (subItem.href === '/orders' && unvalidatedCount > 0) {
                          subBadge = unvalidatedCount;
                        }
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => isMobile && setSidebarMobileOpen(false)}
                            className={cn(
                              'group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                              isSubActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <SubIcon className={cn('h-4 w-4 flex-shrink-0', isSubActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100')} />
                              <span>{subItem.label}</span>
                            </div>
                            {subBadge && (
                              <span className="bg-amber-500 animate-pulse text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none shadow-xs">
                                {subBadge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Standard Navigation Item (without children)
            const itemHref = item.href || '#';
            const isActive = pathname === itemHref || pathname.startsWith(itemHref + '/');
            let badgeValue: number | undefined = undefined;
            if (itemHref === '/notifications' && unreadNotificationsCount > 0) {
              badgeValue = unreadNotificationsCount;
            } else if (item.badge) {
              badgeValue = item.badge;
            }

            return (
              <Link
                key={itemHref}
                href={itemHref}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => isMobile && setSidebarMobileOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                )}
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100')} />
                {!collapsed && <span>{item.label}</span>}
                {badgeValue && !collapsed && (
                  <span className="ml-auto text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none shadow-xs bg-primary">
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
