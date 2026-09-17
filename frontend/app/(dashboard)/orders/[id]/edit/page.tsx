'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Calendar, ShoppingBag } from 'lucide-react';
import { EditOrderForm } from '@/features/orders/components/edit-order-form';
import { RoleGuard } from '@/components/auth/role-guard';

export default function EditOrderPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  if (!mounted) return null;

  return (
    <RoleGuard requiredPermission="orders.update">
      <div className="space-y-8 pb-10">
        {/* Top Breadcrumbs */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/orders" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                    Orders
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/orders/${id}`} className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                    #{id.length > 8 ? id.slice(0, 8) : id}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/orders/${id}/edit`} className="text-foreground text-xs font-semibold capitalize">
                    Edit
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Edit Order #{id.length > 8 ? id.slice(0, 8) : id}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Update customer information, line items, payment terms, and delivery instructions.
                </p>
              </div>
            </div>
          </div>

          {/* Date Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Main Edit Form Component */}
        <EditOrderForm orderId={id} />
      </div>
    </RoleGuard>
  );
}
