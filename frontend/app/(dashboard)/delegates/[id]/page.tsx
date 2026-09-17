'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { delegatesService, type DelegateData } from '@/services/delegates';
import { clientsService, type ClientData } from '@/services/clients';
import { DelegateStatusBadge } from '@/features/delegates/components/delegate-status-badge';
import { DelegateObjectivesCard } from '@/features/delegates/components/delegate-objectives-card';
import { ClientTypeBadge, ClientStatusBadge } from '@/features/clients/components/client-badges';
import { formatCurrency, formatFullCurrency, getPerformanceLevel } from '@/features/delegates/utils';
import { EditDelegateDialog } from '@/features/delegates/components/edit-delegate-dialog';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShoppingCart,
  TrendingUp,
  Users,
  Calendar,
  AtSign,
  Loader2,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Pencil,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DelegateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [delegate, setDelegate] = useState<DelegateData | null>(null);
  const [assignedClients, setAssignedClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const delegateRes = await delegatesService.get(id);
        if (!active) return;
        setDelegate(delegateRes);

        // Fetch assigned clients
        const clientsRes = await clientsService.list({ pageSize: 100 });
        if (!active) return;
        const filteredClients = clientsRes.data.filter(
          (c) => String(c.delegateId) === String(id) || (delegateRes.name && c.delegateName === delegateRes.name)
        );
        setAssignedClients(filteredClients);
      } catch {
        if (active) toast.error('Failed to load delegate profile');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground">Loading delegate profile...</p>
      </div>
    );
  }

  if (!delegate) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <User className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Delegate Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested delegate profile could not be found.</p>
        <Link href="/delegates">
          <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Delegates
          </Button>
        </Link>
      </div>
    );
  }

  const perfLevel = getPerformanceLevel(delegate.completionRate);
  const avatarInitials = delegate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 pb-10">
      {/* Top Breadcrumb & Actions Toolbar */}
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
                <BreadcrumbLink href="/delegates" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Delegates
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/delegates/${id}`} className="text-foreground text-xs font-semibold">
                  {delegate.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <Link href="/delegates" title="Back to Delegates">
              <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Delegate Profile & Operations
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info(`Contacting ${delegate.phone}`)}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span>Call Delegate</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg"
          >
            <Pencil className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>

      {/* Main Profile Hero Card */}
      <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-bold">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {delegate.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    {delegate.delegateCode || `DEL-2026-${id.padStart(6, '0')}`}
                  </span>
                  <DelegateStatusBadge status={delegate.status as any} lastActivity={delegate.lastActivity} />
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold">
                    <AtSign className="h-3.5 w-3.5 text-blue-500" />
                    @{delegate.username || delegate.email.split('@')[0]}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {delegate.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {delegate.phone}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs pt-1">
                  <Badge variant="outline" className="gap-1 font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                    <Globe className="h-3 w-3" /> {delegate.region} Region
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-semibold border-amber-500/30 text-amber-600 bg-amber-500/10">
                    <MapPin className="h-3 w-3" /> {delegate.wilaya}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Shift Activity & Stats Summary */}
            <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/50 w-full md:w-auto min-w-[200px]">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Last Activity
                </span>
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Just now
                </span>
              </div>
              <div className="h-px bg-border/40 w-full hidden md:block" />
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Performance Level
                </span>
                <span className="text-xs font-bold" style={{ color: perfLevel.color }}>
                  {perfLevel.label} ({delegate.completionRate}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance KPIs Grid (4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Assigned Clients */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Clients</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-foreground">{assignedClients.length}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">Active customer accounts</span>
          </div>
        </Card>

        {/* KPI 2: Total Orders */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Orders</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-foreground">
              {assignedClients.reduce((sum, c) => sum + (c.totalOrders || 0), delegate.totalOrders || 0)}
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">Completed orders</span>
          </div>
        </Card>

        {/* KPI 3: Revenue Generated */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue Volume</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-foreground">
              {formatFullCurrency(assignedClients.reduce((sum, c) => sum + (c.totalSpent || 0), delegate.totalRevenue || 0))}
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">Total turnover in DZD</span>
          </div>
        </Card>

        {/* KPI 4: Completion Rate */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion Rate</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-foreground text-xl">{delegate.completionRate}%</span>
              <span className="font-bold" style={{ color: perfLevel.color }}>{perfLevel.label}</span>
            </div>
            <Progress value={delegate.completionRate} className="h-1.5" />
          </div>
        </Card>
      </div>

      {/* Monthly Objectives & Performance Archive Section */}
      <DelegateObjectivesCard delegateId={id} delegateName={delegate.name} />

      {/* Main Content Layout: Assigned Clients Table (8 cols) + Territory Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Assigned Clients List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Assigned Customer Accounts</CardTitle>
                    <CardDescription className="text-xs">
                      Clients managed by {delegate.name} in {delegate.region} region.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary bg-primary/10">
                  {assignedClients.length} Accounts
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {assignedClients.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">No Clients Assigned Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No client accounts are currently assigned to this commercial delegate. You can assign clients when creating new clients.
                  </p>
                  <Link href="/clients/new">
                    <Button size="sm" className="gap-2 rounded-full text-xs font-bold mt-2">
                      <Users className="h-3.5 w-3.5" /> Assign New Client
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-xs font-bold">Client Code</TableHead>
                        <TableHead className="text-xs font-bold">Business Name</TableHead>
                        <TableHead className="text-xs font-bold">Type</TableHead>
                        <TableHead className="text-xs font-bold">Wilaya</TableHead>
                        <TableHead className="text-xs font-bold text-right">Total Orders</TableHead>
                        <TableHead className="text-xs font-bold text-right">Total Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedClients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {client.clientCode}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-semibold text-xs text-foreground block">{client.name}</span>
                              <span className="text-[10px] text-muted-foreground">{client.email || client.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ClientTypeBadge type={client.clientType} />
                          </TableCell>
                          <TableCell className="text-xs text-foreground">{client.wilaya}</TableCell>
                          <TableCell className="text-xs font-bold text-right text-foreground">{client.totalOrders}</TableCell>
                          <TableCell className="text-xs font-bold text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(client.totalSpent)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Territory & System Account Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">Territory & Account Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary" /> Delegate Code:
                </span>
                <span className="font-mono font-bold text-foreground">{delegate.delegateCode || `DEL-2026-${id}`}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5 text-blue-500" /> Username:
                </span>
                <span className="font-semibold text-foreground">@{delegate.username || delegate.email.split('@')[0]}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" /> Region:
                </span>
                <span className="font-semibold text-foreground">{delegate.region}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> HQ Wilaya:
                </span>
                <span className="font-semibold text-foreground">{delegate.wilaya}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Member Since:
                </span>
                <span className="font-semibold text-foreground">
                  {new Date(delegate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {delegate && (
        <EditDelegateDialog
          delegate={delegate}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdated={(updated) => setDelegate(updated)}
        />
      )}
    </div>
  );
}
