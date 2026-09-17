'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  adminOnly?: boolean;
}

export function RoleGuard({ children, requiredPermission, adminOnly }: RoleGuardProps) {
  const { can, isAdmin, user } = usePermissions();

  if (adminOnly && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 ring-8 ring-rose-500/5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Accès Réservé à l&apos;Administration</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          Cette section nécessite des privilèges d&apos;administrateur. Votre compte actuel ({user?.role || 'Utilisateur'}) n&apos;y a pas accès.
        </p>
        <Link href="/dashboard" className="mt-6">
          <Button variant="outline" className="rounded-xl font-semibold gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour au Tableau de Bord
          </Button>
        </Link>
      </div>
    );
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Accès Restreint</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          Vous ne disposez pas des permissions requises pour accéder à cette page.
        </p>
        <Link href="/dashboard" className="mt-6">
          <Button variant="outline" className="rounded-xl font-semibold gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour au Tableau de Bord
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
