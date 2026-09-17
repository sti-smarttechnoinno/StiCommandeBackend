'use client';

import { UsersHeader } from '@/features/users/components/users-header';
import { UsersKPICards } from '@/features/users/components/users-kpi-cards';
import { UsersToolbar } from '@/features/users/components/users-toolbar';
import { UsersTable } from '@/features/users/components/users-table';
import { ActiveSessionsCard } from '@/features/users/components/active-sessions-card';
import { SecurityEventsCard } from '@/features/users/components/security-events-card';
import { UserStatisticsCard } from '@/features/users/components/user-statistics-card';
import { NewUserDialog } from '@/features/users/components/new-user-dialog';
import { FloatingActionButton } from '@/features/users/components/floating-action-button';
import { TooltipProvider } from '@/components/ui/tooltip';

import { RoleGuard } from '@/components/auth/role-guard';

export default function UsersPage() {
  return (
    <RoleGuard requiredPermission="users.manage">
      <TooltipProvider delay={300}>
        <div className="space-y-6">
          {/* Page Hero Header */}
          <UsersHeader />

          {/* KPI Cards */}
          <UsersKPICards />

          {/* Integrated Filter Toolbar */}
          <UsersToolbar />

          {/* Full-Width Users Table */}
          <UsersTable />

          {/* Bottom 3-Column Analytics & Security Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            <ActiveSessionsCard />
            <SecurityEventsCard />
            <UserStatisticsCard />
          </div>

          {/* New User Modal */}
          <NewUserDialog />

          {/* Floating Action Button (mobile) */}
          <FloatingActionButton />
        </div>
      </TooltipProvider>
    </RoleGuard>
  );
}
