'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Calendar, UserPlus } from 'lucide-react';
import { CreateClientForm } from '@/features/clients/components/create-client-form';

import { RoleGuard } from '@/components/auth/role-guard';

export default function NewClientPage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const formattedDate = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
    setCurrentDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  }, []);

  if (!mounted) return null;

  return (
    <RoleGuard requiredPermission="clients.create">
      <div className="space-y-8 pb-10">
        {/* Top Breadcrumb & Page Banner */}
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
                  <BreadcrumbLink href="/clients" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                    Clients
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/clients/new" className="text-foreground text-xs font-semibold capitalize">
                    Nouveau Client
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Ajouter un Nouveau Client
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enregistrer un nouveau compte client dans le système de distribution STI.
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

        {/* Main Form Component */}
        <CreateClientForm />
      </div>
    </RoleGuard>
  );
}
