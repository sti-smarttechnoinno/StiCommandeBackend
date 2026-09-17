'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Code, Copy, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function ApiSettings() {
  const [apiKey] = useState('sk_live_********************3f8a');
  const [secretKey] = useState('sk_secret_********************9d2c');
  const [webhookUrl] = useState('https://erp.sti.dz/api/webhooks');

  const copyToClipboard = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          API & Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">API Base URL</label>
            <div className="flex gap-2">
              <Input value="https://erp.sti.dz/api/v1" readOnly className="h-11 rounded-xl border-border/60 font-mono text-xs" />
              <Button variant="outline" size="sm" className="h-11 px-3 rounded-xl" onClick={() => copyToClipboard('https://erp.sti.dz/api/v1', 'API URL')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Environment</label>
            <Input value="Production" readOnly className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">API Version</label>
            <Input value="v1.0.0" readOnly className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Webhook URL</label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="h-11 rounded-xl border-border/60 font-mono text-xs" />
              <Button variant="outline" size="sm" className="h-11 px-3 rounded-xl" onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">API Key</label>
          <div className="flex gap-2">
            <Input value={apiKey} readOnly className="h-11 rounded-xl border-border/60 font-mono text-xs" />
            <Button variant="outline" size="sm" className="h-11 px-3 rounded-xl" onClick={() => copyToClipboard(apiKey, 'API Key')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Secret Key</label>
          <div className="flex gap-2">
            <Input value={secretKey} type="password" readOnly className="h-11 rounded-xl border-border/60 font-mono text-xs" />
            <Button variant="outline" size="sm" className="h-11 px-3 rounded-xl" onClick={() => copyToClipboard(secretKey, 'Secret Key')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.success('API key regenerated')}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate Key
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.success('Webhook test sent')}>
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Test Webhook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
