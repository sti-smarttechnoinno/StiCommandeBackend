'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '../store';
import type { SettingsTab } from '../types';
import { toast } from 'sonner';
import {
  Building2,
  Settings,
  Users,
  Shield,
  Bell,
  Globe,
  Plug,
  Database,
  BarChart3,
  Code,
  Palette,
  Info,
  Headphones,
  ExternalLink,
} from 'lucide-react';

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General Settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'company', label: 'Company Profile', icon: <Building2 className="h-4 w-4" /> },
  { id: 'catalog', label: 'Operators & Catalog', icon: <Globe className="h-4 w-4" /> },
  { id: 'users', label: 'Users & Permissions', icon: <Users className="h-4 w-4" /> },
  { id: 'security', label: 'Security & Auth', icon: <Shield className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'localization', label: 'Localization & Region', icon: <Globe className="h-4 w-4" /> },
  { id: 'integrations', label: 'Integrations & Apps', icon: <Plug className="h-4 w-4" /> },
  { id: 'backup', label: 'Backup & Restore', icon: <Database className="h-4 w-4" /> },
  { id: 'reports', label: 'Reports & Export', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'api', label: 'API & Webhooks', icon: <Code className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance & Theme', icon: <Palette className="h-4 w-4" /> },
  { id: 'about', label: 'About ERP System', icon: <Info className="h-4 w-4" /> },
];

export function SettingsSidebar() {
  const { activeTab, setActiveTab } = useSettingsStore();

  return (
    <div className="space-y-4">
      <Card className="border border-border/40 shadow-xs rounded-2xl bg-card">
        <CardHeader className="pb-2 border-b border-border/30">
          <CardTitle className="text-sm font-bold tracking-tight">Navigation</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left',
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <span className={cn(activeTab === item.id ? 'text-primary' : 'text-muted-foreground')}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Help Center */}
      <Card className="border border-border/40 shadow-xs rounded-2xl bg-card overflow-hidden">
        <CardContent className="p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
            <Headphones className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-foreground mb-1">ERP Help Center</h4>
          <p className="text-[11px] text-muted-foreground mb-3 leading-normal">Need assistance configuring system preferences?</p>
          <Button variant="outline" size="sm" className="w-full h-8 rounded-full border-border/60 text-xs font-semibold bg-card hover:bg-muted/80" onClick={() => toast.info('Opening support')}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
