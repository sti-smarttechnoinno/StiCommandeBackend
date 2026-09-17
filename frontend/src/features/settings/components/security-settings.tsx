'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Eye, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [strongPasswords, setStrongPasswords] = useState(true);
  const [loginAudit, setLoginAudit] = useState(true);
  const [deviceVerification, setDeviceVerification] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [captcha, setCaptcha] = useState(true);
  const [singleSession, setSingleSession] = useState(false);
  const [autoLockout, setAutoLockout] = useState(true);

  const settings = [
    { label: 'Enable Two-Factor Authentication', desc: 'Require 2FA for all administrator accounts', value: twoFactor, onChange: setTwoFactor, icon: <Key className="h-4 w-4" /> },
    { label: 'Require Strong Passwords', desc: 'Minimum 12 characters with mixed case, numbers, symbols', value: strongPasswords, onChange: setStrongPasswords, icon: <Lock className="h-4 w-4" /> },
    { label: 'Login Audit Logs', desc: 'Track all login attempts and sessions', value: loginAudit, onChange: setLoginAudit, icon: <Eye className="h-4 w-4" /> },
    { label: 'Device Verification', desc: 'Verify new device logins via email', value: deviceVerification, onChange: setDeviceVerification, icon: <AlertTriangle className="h-4 w-4" /> },
    { label: 'IP Whitelist', desc: 'Restrict access to approved IP addresses', value: ipWhitelist, onChange: setIpWhitelist, icon: <Shield className="h-4 w-4" /> },
    { label: 'CAPTCHA on Login', desc: 'Show CAPTCHA after 3 failed attempts', value: captcha, onChange: setCaptcha, icon: <Shield className="h-4 w-4" /> },
    { label: 'Single Session Login', desc: 'Allow only one active session per user', value: singleSession, onChange: setSingleSession, icon: <Lock className="h-4 w-4" /> },
    { label: 'Automatic Account Lockout', desc: 'Lock accounts after 5 failed login attempts', value: autoLockout, onChange: setAutoLockout, icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Security
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-semibold text-muted-foreground" onClick={() => toast.info('Security logs')}>
              <Eye className="h-3.5 w-3.5 mr-1.5" /> Logs
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-semibold text-muted-foreground" onClick={() => toast.info('Configuring 2FA')}>
              <Key className="h-3.5 w-3.5 mr-1.5" /> 2FA
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {settings.map((s) => (
            <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{s.icon}</span>
                <div>
                  <span className="text-sm font-medium text-foreground block">{s.label}</span>
                  <span className="text-[11px] text-muted-foreground">{s.desc}</span>
                </div>
              </div>
              <Switch checked={s.value} onCheckedChange={s.onChange} />
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 block">Security Score</span>
              <span className="text-[10px] text-emerald-600">Your system security is excellent</span>
            </div>
            <div className="relative w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray="92 100" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-emerald-700">92%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
