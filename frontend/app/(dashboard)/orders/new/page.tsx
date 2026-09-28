'use client';

import { useState, useEffect, Suspense } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import { CreateOrderForm } from '@/features/orders/components/create-order-form';

import { RoleGuard } from '@/components/auth/role-guard';

export default function NewOrderPage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE d MMMM yyyy', { locale: fr }));
  }, []);

  if (!mounted) return null;

  return (
    <RoleGuard requiredPermission="orders.create">
      <div className="space-y-8 pb-10">
        {/* Top Breadcrumb & Banner */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                    Accueil
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/orders" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                    Commandes
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/orders/new" className="text-foreground text-xs font-semibold capitalize">
                    Nouvelle commande
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
                  Créer une nouvelle commande
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enregistrez une nouvelle commande de distribution pour vos clients et régions.
                </p>
              </div>
            </div>
          </div>

          {/* Date Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs capitalize">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Main Form Component */}
        <Suspense
          fallback={
            <div className="p-12 flex flex-col items-center justify-center gap-3 border border-border/60 rounded-2xl bg-card">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-semibold text-muted-foreground">Chargement du formulaire...</p>
            </div>
          }
        >
          <CreateOrderForm />
        </Suspense>
      </div>
    </RoleGuard>
  );
}
