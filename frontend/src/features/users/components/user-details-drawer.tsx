'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useUsersStore } from '../store';
import { getRoleColor, getRoleLabel, getStatusColor, getStatusDot, getStatusLabel, getAvatarColor } from '../utils';
import { usersService } from '@/services/users';
import type { UserRow } from '../types';
import { toast } from 'sonner';
import { X, Pencil, KeyRound, Lock, Trash2, Monitor, Smartphone, MapPin, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, ExternalLink } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  login: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  logout: <Clock className="h-3 w-3 text-muted-foreground" />,
  password_changed: <AlertTriangle className="h-3 w-3 text-amber-500" />,
  role_updated: <AlertTriangle className="h-3 w-3 text-amber-500" />,
  failed_login: <XCircle className="h-3 w-3 text-rose-500" />,
};

export function UserDetailsDrawer() {
  const router = useRouter();
  const { isDetailsDrawerOpen, setDetailsDrawerOpen, selectedUserId } = useUsersStore();
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedUserId || !isDetailsDrawerOpen) {
      setUser(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    usersService
      .get(selectedUserId)
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUserId, isDetailsDrawerOpen]);

  if (!isDetailsDrawerOpen) return null;

  return (
    <Drawer open={isDetailsDrawerOpen} onOpenChange={(open) => setDetailsDrawerOpen(open)}>
      <DrawerContent className="max-w-[480px] bg-card text-card-foreground">
        <DrawerHeader className="border-b border-border/30 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-foreground">User Details</DrawerTitle>
            <button onClick={() => setDetailsDrawerOpen(false)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>

        {loading || !user ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Profile */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 cursor-pointer" onClick={() => { setDetailsDrawerOpen(false); router.push(`/users/${user.id}`); }}>
                  <AvatarFallback className={cn('text-lg font-bold', getAvatarColor(0))}>{user.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 
                    className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => { setDetailsDrawerOpen(false); router.push(`/users/${user.id}`); }}
                  >
                    {user.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="ghost" className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', getRoleColor(user.role))}>{getRoleLabel(user.role)}</Badge>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold', getStatusColor(user.status))}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(user.status))} />
                      {getStatusLabel(user.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* View Full Profile CTA Button */}
            <Button
              variant="default"
              size="sm"
              className="w-full h-9 font-semibold gap-2 rounded-xl shadow-sm"
              onClick={() => {
                setDetailsDrawerOpen(false);
                router.push(`/users/${user.id}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open Full User Profile
            </Button>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-[11px] gap-1 rounded-xl" 
                onClick={() => {
                  setDetailsDrawerOpen(false);
                  router.push(`/users/${user.id}?edit=true`);
                }}
              >
                <Pencil className="h-3 w-3 text-amber-500" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-[11px] gap-1 rounded-xl" onClick={() => toast.success(`Password reset sent to ${user.email}`)}>
                <KeyRound className="h-3 w-3 text-emerald-500" /> Reset
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-[11px] gap-1 rounded-xl" onClick={() => toast.info('Account lock toggled')}>
                <Lock className="h-3 w-3 text-indigo-500" /> Lock
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-[11px] gap-1 rounded-xl text-rose-600 hover:text-rose-600" onClick={() => toast.error('User deleted')}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>

            {/* Account Info */}
            <Card className="border border-border/40 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="font-mono font-bold text-primary">{user.employeeId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-semibold text-foreground">{user.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-muted-foreground">Territory</span>
                  <span className="font-semibold text-foreground">{user.wilaya} ({user.region})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-semibold text-foreground">{user.department}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">2FA Status</span>
                  <span className={cn('font-bold', user.twoFactorEnabled ? 'text-emerald-600' : 'text-amber-600')}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Registered Devices */}
            <Card className="border border-border/40 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Devices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {(user.devices || []).map((dev, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <div className="flex items-center gap-2">
                      {dev.type === 'Desktop' ? <Monitor className="h-4 w-4 text-blue-500" /> : <Smartphone className="h-4 w-4 text-emerald-500" />}
                      <div>
                        <span className="font-semibold block text-foreground">{dev.browser}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {dev.location} · {dev.ip}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600">{dev.lastActive}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card className="border border-border/40 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Audit Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {(user.loginHistory || []).map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-2">
                      {EVENT_ICONS[event.type] || <Clock className="h-3 w-3 text-muted-foreground" />}
                      <div>
                        <span className="font-semibold block text-foreground">{event.device}</span>
                        <span className="text-[10px] text-muted-foreground">{event.timestamp} · {event.ipAddress}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                      Success
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
