'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { KPICard } from '@/components/cards/kpi-card';
import { ActionCard } from '@/components/cards/action-card';
import { InventoryCard } from '@/components/cards/inventory-card';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { StatusChart } from '@/components/charts/status-chart';
import { OrdersTable } from '@/components/tables/orders-table';
import { DelegatePerformance } from '@/components/features/dashboard/delegate-performance';
import { NotificationsPanel } from '@/components/features/dashboard/notifications-panel';
import { reportsService, type ReportsKPIs } from '@/services/reports';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Users,
  Plus,
  UserPlus,
  Package,
  ArrowRightLeft,
  FileSpreadsheet,
  HardDrive,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpis, setKpis] = useState<ReportsKPIs | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(format(now, 'EEEE, MMMM d, yyyy'));
      setCurrentTime(format(now, 'HH:mm:ss'));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchKpis = async () => {
    try {
      setLoadingKpis(true);
      const res = await reportsService.getKpis();
      setKpis(res);
    } catch (err) {
      console.error('Failed to load dashboard KPIs', err);
    } finally {
      setLoadingKpis(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.success('Dashboard data refreshed');
    await fetchKpis();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const quickActions = [
    { title: 'New Order', description: 'Create a new order entry', icon: <Plus className="h-5 w-5" />, color: 'blue' as const },
    { title: 'New Client', description: 'Register a new client', icon: <UserPlus className="h-5 w-5" />, color: 'green' as const },
    { title: 'New Product', description: 'Add product to catalog', icon: <Package className="h-5 w-5" />, color: 'purple' as const },
    { title: 'Add Delegate', description: 'Register a new delegate', icon: <Users className="h-5 w-5" />, color: 'indigo' as const },
    { title: 'Transfer Stock', description: 'Move inventory between warehouses', icon: <ArrowRightLeft className="h-5 w-5" />, color: 'orange' as const },
    { title: 'Generate Report', description: 'Create detailed analytics report', icon: <FileText className="h-5 w-5" />, color: 'teal' as const },
    { title: 'Import Excel', description: 'Bulk import data from spreadsheet', icon: <FileSpreadsheet className="h-5 w-5" />, color: 'cyan' as const },
    { title: 'Manage Inventory', description: 'Update stock levels and alerts', icon: <HardDrive className="h-5 w-5" />, color: 'red' as const },
  ];

  const inventoryItems = [
    { label: 'SIM Cards', value: '12,450', trend: '+5.2% this week', trendType: 'positive' as const, icon: <HardDrive className="h-5 w-5" />, iconColor: 'blue' as const },
    { label: 'Mobile Credit', value: '8,320', trend: '+2.8% this week', trendType: 'positive' as const, icon: <DollarSign className="h-5 w-5" />, iconColor: 'green' as const },
    { label: 'Accessories', value: '3,847', trend: '-1.4% this week', trendType: 'negative' as const, icon: <Package className="h-5 w-5" />, iconColor: 'purple' as const },
    { label: 'Low Stock Alerts', value: '7', trend: '3 critical items', trendType: 'warning' as const, icon: <Clock className="h-5 w-5" />, iconColor: 'red' as const },
    { label: 'Warehouses', value: '5', trend: 'All operational', trendType: 'positive' as const, icon: <HardDrive className="h-5 w-5" />, iconColor: 'teal' as const },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header / Hero inside Dashboard Page */}
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
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Administration Dashboard
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Welcome back, Administrator.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate || 'Today'}</span>
          </div>

          {/* Export Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success('Report exported')}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export Report</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          {/* Generate PDF Button */}
          <Button
            size="sm"
            onClick={() => toast.success('PDF report generated')}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Generate PDF</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {loadingKpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 flex items-center justify-center h-28 border-border/40 bg-card">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="Total Orders"
            value={kpis ? kpis.totalOrders : 0}
            trend={kpis?.ordersGrowth}
            sparkData={kpis?.ordersSparkline}
            icon={<ShoppingCart className="h-5 w-5" />}
            iconColor="blue"
            sparkColor="#2563EB"
          />
          <KPICard
            title="Total Revenue"
            value={kpis ? kpis.totalRevenue : 0}
            suffix=" DA"
            trend={kpis?.revenueGrowth}
            sparkData={kpis?.revenueSparkline}
            icon={<DollarSign className="h-5 w-5" />}
            iconColor="green"
            sparkColor="#22C55E"
          />
          <KPICard
            title="Pending Orders"
            value={kpis ? kpis.pendingOrders : 0}
            trend={kpis?.pendingGrowth}
            sparkData={kpis?.pendingSparkline}
            icon={<Clock className="h-5 w-5" />}
            iconColor="orange"
            sparkColor="#F59E0B"
          />
          <KPICard
            title="Active Delegates"
            value={kpis ? kpis.activeDelegates : 0}
            subtitle="Field Sales Reps"
            sparkData={kpis?.delegatesSparkline}
            icon={<Users className="h-5 w-5" />}
            iconColor="indigo"
            sparkColor="#6366F1"
          />
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <RevenueChart />
        <StatusChart />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <ActionCard key={action.title} {...action} />
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable />

      {/* Delegates & Recent Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
        <div className="xl:col-span-2 flex flex-col">
          <DelegatePerformance />
        </div>
        <div className="xl:col-span-1 flex flex-col">
          <NotificationsPanel />
        </div>
      </div>

      {/* Inventory Summary */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">Inventory Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {inventoryItems.map((item) => (
            <InventoryCard key={item.label} {...item} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between py-5 border-t border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">STI ERP</span>
          <span className="bg-muted px-2 py-0.5 rounded text-[11px]">Version 1.0</span>
        </div>
        <span>Last Backup: <strong className="text-foreground font-semibold">Today, 08:00 AM</strong></span>
        <div className="flex items-center gap-3">
          <span>Server Time: <strong className="text-foreground font-semibold">{currentTime || '08:00:00'}</strong></span>
          <span>|</span>
          <span>Connected Users: <strong className="text-foreground font-semibold">12</strong></span>
        </div>
      </footer>
    </div>
  );
}
