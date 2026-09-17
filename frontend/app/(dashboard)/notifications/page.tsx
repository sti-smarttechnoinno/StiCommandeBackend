'use client';

import { useState, useEffect } from 'react';
import { NotificationsHeader } from '@/features/notifications/components/notifications-header';
import { NotificationsKPICards } from '@/features/notifications/components/notifications-kpi-cards';
import { NotificationsToolbar } from '@/features/notifications/components/notifications-toolbar';
import { NotificationFeed } from '@/features/notifications/components/notification-feed';
import { CategoryChartCard } from '@/features/notifications/components/category-chart-card';
import { AnnouncementsCard } from '@/features/notifications/components/announcements-card';
import { NotificationsTable } from '@/features/notifications/components/notifications-table';
import { NotificationDetailsDrawer } from '@/features/notifications/components/notification-details-drawer';
import { CreateAnnouncementDialog } from '@/features/notifications/components/create-announcement-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <TooltipProvider delay={300}>
      <div className="space-y-8">
        {/* Page Header / Hero Banner */}
        <NotificationsHeader />

        {/* KPI Cards Row */}
        <NotificationsKPICards />

        {/* Integrated Filter Toolbar */}
        <NotificationsToolbar />

        {/* Full Width Notifications Table */}
        <div className="w-full">
          <NotificationsTable />
        </div>

        {/* Bottom Section: Operations & Analytics Summary */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <h2 className="text-lg font-bold text-foreground tracking-tight">System Alerts & Operational Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <NotificationFeed />
            <CategoryChartCard />
            <AnnouncementsCard />
          </div>
        </div>

        {/* Notification Details Drawer */}
        <NotificationDetailsDrawer />

        {/* Create Announcement Dialog */}
        <CreateAnnouncementDialog />
      </div>
    </TooltipProvider>
  );
}
