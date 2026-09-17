import { Providers } from '@/components/layout/providers';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Providers>
        <DashboardLayout>{children}</DashboardLayout>
      </Providers>
    </AuthGuard>
  );
}
