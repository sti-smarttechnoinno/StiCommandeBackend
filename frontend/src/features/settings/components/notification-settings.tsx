'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    email: true, push: true, sms: false, lowStock: true, newOrder: true,
    orderApproval: true, failedLogin: true, backup: true, dailySummary: false, weeklyReport: true,
  });
  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: 'email' as const, label: 'Email Notifications', desc: 'Receive alerts via email' },
    { key: 'push' as const, label: 'Push Notifications', desc: 'Browser and mobile push alerts' },
    { key: 'sms' as const, label: 'SMS Notifications', desc: 'Critical alerts via SMS' },
    { key: 'lowStock' as const, label: 'Low Stock Alerts', desc: 'When inventory drops below threshold' },
    { key: 'newOrder' as const, label: 'New Order Alerts', desc: 'Instant notification on new orders' },
    { key: 'orderApproval' as const, label: 'Order Approval Requests', desc: 'When orders need admin approval' },
    { key: 'failedLogin' as const, label: 'Failed Login Alerts', desc: 'Security alert on failed attempts' },
    { key: 'backup' as const, label: 'Backup Notifications', desc: 'Backup completion and failure alerts' },
    { key: 'dailySummary' as const, label: 'Daily Summary Reports', desc: 'End-of-day business summary' },
    { key: 'weeklyReport' as const, label: 'Weekly Performance Report', desc: 'Weekly delegate and sales report' },
  ];

  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors">
              <div>
                <span className="text-sm font-medium text-foreground block">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
              <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4 h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.info('Opening notification templates')}>
          Configure Notification Templates
        </Button>
      </CardContent>
    </Card>
  );
}
