'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Administration Dashboard', subtitle: 'Welcome back, Administrator.' },
  '/orders': { title: 'Orders Management', subtitle: 'View and manage all orders.' },
  '/clients': { title: 'Clients Management', subtitle: 'Manage your client database.' },
  '/delegates': { title: 'Delegates Management', subtitle: 'Track and manage delegates.' },
  '/products': { title: 'Products Catalog', subtitle: 'Manage product inventory.' },
  '/regions': { title: 'Regions', subtitle: 'Manage geographical regions.' },
  '/wilayas': { title: 'Wilayas', subtitle: 'Manage wilayas and districts.' },
  '/stock': { title: 'Stock Management', subtitle: 'Monitor inventory levels.' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'View detailed reports.' },
  '/users': { title: 'User Management', subtitle: 'Manage system users and roles.' },
  '/settings': { title: 'Settings', subtitle: 'Configure your account and system.' },
  '/notifications': { title: 'Notifications', subtitle: 'View all notifications.' },
};

export function PageHeader() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] || { title: 'Dashboard', subtitle: '' };
  const segments = pathname.split('/').filter(Boolean);

  return (
    <div className="mb-6 space-y-1.5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, i) => (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/${segments.slice(0, i + 1).join('/')}`}
                  className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors"
                >
                  {segment}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{page.title}</h1>
        {page.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{page.subtitle}</p>}
      </div>
    </div>
  );
}
