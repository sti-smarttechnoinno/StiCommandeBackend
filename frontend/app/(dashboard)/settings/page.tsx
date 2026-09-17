'use client';

import { useSettingsStore } from '@/features/settings/store';
import { SettingsHeader } from '@/features/settings/components/settings-header';
import { SettingsSidebar } from '@/features/settings/components/settings-sidebar';
import { CompanyForm } from '@/features/settings/components/company-form';
import { GeneralSettings } from '@/features/settings/components/general-settings';
import { SecuritySettings } from '@/features/settings/components/security-settings';
import { NotificationSettings } from '@/features/settings/components/notification-settings';
import { IntegrationsGrid } from '@/features/settings/components/integrations-grid';
import { BackupSettings } from '@/features/settings/components/backup-settings';
import { ApiSettings } from '@/features/settings/components/api-settings';
import { AppearanceSettings } from '@/features/settings/components/appearance-settings';
import { AboutSystem } from '@/features/settings/components/about-system';
import { StorageUsageCard } from '@/features/settings/components/storage-usage-card';
import { RecentChangesCard } from '@/features/settings/components/recent-changes-card';
import { QuickActionsCard } from '@/features/settings/components/quick-actions-card';
import { CatalogSettings } from '@/features/settings/components/catalog-settings';
import { UsersPermissionsSettings } from '@/features/settings/components/users-permissions-settings';
import { LocalizationSettings } from '@/features/settings/components/localization-settings';
import { TooltipProvider } from '@/components/ui/tooltip';

function SettingsContent() {
  const { activeTab } = useSettingsStore();

  switch (activeTab) {
    case 'general':
      return <GeneralSettings />;
    case 'company':
      return <CompanyForm />;
    case 'catalog':
      return <CatalogSettings />;
    case 'users':
      return <UsersPermissionsSettings />;
    case 'security':
      return <SecuritySettings />;
    case 'notifications':
      return <NotificationSettings />;
    case 'integrations':
      return <IntegrationsGrid />;
    case 'backup':
      return <BackupSettings />;
    case 'api':
      return <ApiSettings />;
    case 'appearance':
      return <AppearanceSettings />;
    case 'about':
      return <AboutSystem />;
    case 'localization':
      return <LocalizationSettings />;
    case 'reports':
      return <GeneralSettings />;
    default:
      return <CompanyForm />;
  }
}

import { RoleGuard } from '@/components/auth/role-guard';

export default function SettingsPage() {
  return (
    <RoleGuard requiredPermission="settings.manage">
      <TooltipProvider delay={300}>
        <div className="space-y-6">
          {/* Page Hero Header */}
          <SettingsHeader />

          {/* Main Layout: Sidebar & Form Area */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Left Sidebar */}
            <div>
              <SettingsSidebar />
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <SettingsContent />

              {/* Bottom 3-Column Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                <StorageUsageCard />
                <RecentChangesCard />
                <QuickActionsCard />
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </RoleGuard>
  );
}
