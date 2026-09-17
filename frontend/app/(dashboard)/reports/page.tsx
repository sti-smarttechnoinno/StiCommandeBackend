'use client';

import { ReportsHeader } from '@/features/reports/components/reports-header';
import { ReportsKPICards } from '@/features/reports/components/reports-kpi-cards';
import { ReportsFilters } from '@/features/reports/components/reports-filters';
import { RevenueOverviewChart } from '@/features/reports/components/revenue-overview-chart';
import { OrdersStatusChart } from '@/features/reports/components/orders-status-chart';
import { RevenueRegionChart } from '@/features/reports/components/revenue-region-chart';
import { TopDelegatesCard } from '@/features/reports/components/top-delegates-card';
import { SalesTrendChart } from '@/features/reports/components/sales-trend-chart';
import { BestProductsCard } from '@/features/reports/components/best-products-card';
import { ReportTemplatesCard } from '@/features/reports/components/report-templates-card';
import { RecentReportsTable } from '@/features/reports/components/recent-reports-table';
import { ReportDialog } from '@/features/reports/components/report-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ReportsPage() {
  return (
    <TooltipProvider delay={300}>
      <div className="space-y-6">
        {/* Page Hero Header */}
        <ReportsHeader />

        {/* KPI Cards */}
        <ReportsKPICards />

        {/* Filter Toolbar */}
        <ReportsFilters />

        {/* Revenue Overview Chart */}
        <RevenueOverviewChart />

        {/* Bottom Analytics Grid 1: Revenue Region, Sales Trend, Orders Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          <RevenueRegionChart />
          <SalesTrendChart />
          <OrdersStatusChart />
        </div>

        {/* Bottom Analytics Grid 2: Top Delegates, Best Products, Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          <TopDelegatesCard />
          <BestProductsCard />
          <ReportTemplatesCard />
        </div>

        {/* Recent Generated Reports Table */}
        <RecentReportsTable />

        {/* Create Custom Report Modal */}
        <ReportDialog />
      </div>
    </TooltipProvider>
  );
}
