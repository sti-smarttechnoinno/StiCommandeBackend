'use client';

import { useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Truck } from 'lucide-react';
import { CreateDeliveryNoteForm } from '@/features/delivery-notes/components/create-delivery-note-form';

export default function NewDeliveryNotePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Breadcrumb & Banner */}
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
                <BreadcrumbLink href="/delivery-notes" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Bons de Livraison
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/delivery-notes/new" className="text-foreground text-xs font-semibold capitalize">
                  Nouveau Bon de Livraison
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Créer un Bon de Livraison
              </h1>
              <p className="text-sm text-muted-foreground">
                Génération d&apos;un bon d&apos;expédition par validation de commande ou émission directe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Component */}
      <CreateDeliveryNoteForm />
    </div>
  );
}
