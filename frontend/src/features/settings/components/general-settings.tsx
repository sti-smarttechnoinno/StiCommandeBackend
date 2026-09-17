'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';

export function GeneralSettings() {
  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          General Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Default Language</label>
            <Select defaultValue="fr">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Francais</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Time Zone</label>
            <Select defaultValue="cet">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cet">Africa/Algiers (CET +1)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Currency</label>
            <Select defaultValue="dzd">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dzd">DZD - Algerian Dinar</SelectItem>
                <SelectItem value="eur">EUR - Euro</SelectItem>
                <SelectItem value="usd">USD - US Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date Format</label>
            <Select defaultValue="ddmmyyyy">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Number Format</label>
            <Select defaultValue="spaces">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="spaces">1 234 567,89</SelectItem>
                <SelectItem value="commas">1,234,567.89</SelectItem>
                <SelectItem value="dots">1.234.567,89</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Fiscal Year Start</label>
            <Select defaultValue="jan">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jan">January</SelectItem>
                <SelectItem value="apr">April</SelectItem>
                <SelectItem value="jul">July</SelectItem>
                <SelectItem value="oct">October</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Default Dashboard</label>
            <Select defaultValue="main">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Dashboard</SelectItem>
                <SelectItem value="orders">Orders Overview</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Auto Refresh Interval</label>
            <Select defaultValue="30">
              <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
